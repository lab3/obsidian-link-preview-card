import { Plugin, requestUrl } from "obsidian";
import { LinkPreviewCard } from "./LinkPreviewCard";
import { createLivePreviewExtension } from "./LivePreviewExtension";
import { LinkPreviewSettingTab, LinkPreviewSettings, DEFAULT_SETTINGS } from "./settings";

const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|bmp|ico|tiff?|avif)(\?.*)?$/i;

function isDirectImageUrl(url: string): boolean {
    try {
        return IMAGE_EXT.test(new URL(url).pathname);
    } catch {
        return false;
    }
}

export interface OGMetadata {
    title: string;
    description: string;
    image: string;
    siteName: string;
    url: string;
}

export default class LinkPreviewPlugin extends Plugin {
    settings: LinkPreviewSettings;
    private cache = new Map<string, OGMetadata | Error>();

    async onload() {
        console.log("[LinkPreview] onload start");
        await this.loadSettings();
        this.addSettingTab(new LinkPreviewSettingTab(this.app, this));

        // Reading View
        this.registerMarkdownPostProcessor((el, ctx) => {
            el.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
                const src = img.getAttribute("src") ?? "";
                if (!src.startsWith("http://") && !src.startsWith("https://")) return;
                if (isDirectImageUrl(src)) return;

                const alt = img.getAttribute("alt") ?? "";
                const card = new LinkPreviewCard(src, alt, this);
                ctx.addChild(card);
                img.replaceWith(card.containerEl);
            });
        });

        // Live Preview (CodeMirror 6)
        console.log("[LinkPreview] registering editor extension");
        const ext = createLivePreviewExtension(this);
        console.log("[LinkPreview] extension created:", ext);
        this.registerEditorExtension(ext);
        console.log("[LinkPreview] onload done");
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<LinkPreviewSettings>);
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    async fetchMetadata(url: string): Promise<OGMetadata> {
        const cached = this.cache.get(url);
        if (cached instanceof Error) throw cached;
        if (cached) return cached;

        try {
            const response = await requestUrl({ url, method: "GET", throw: false });

            const contentType = response.headers?.["content-type"] ?? "";
            const html = contentType.includes("html") ? response.text : "";

            let title = "", description = "", image = "", siteName = "";

            if (html) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, "text/html");

                title       = getMeta(doc, "og:title")       || getMeta(doc, "twitter:title")       || doc.title || "";
                description = getMeta(doc, "og:description") || getMeta(doc, "twitter:description") || getMeta(doc, "description") || "";
                image       = getMeta(doc, "og:image")       || getMeta(doc, "twitter:image")       || getMeta(doc, "twitter:image:src") || "";
                siteName    = getMeta(doc, "og:site_name")   || "";

                if (image && !image.startsWith("http")) {
                    try { image = new URL(image, url).href; } catch { image = ""; }
                }
            }

            const hostname = new URL(url).hostname.replace(/^www\./, "");
            const meta: OGMetadata = {
                title: title || hostname,
                description,
                image,
                siteName: siteName || hostname,
                url,
            };

            this.cache.set(url, meta);
            return meta;
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            this.cache.set(url, error);
            throw error;
        }
    }
}

function getMeta(doc: Document, name: string): string {
    const el = doc.querySelector(`meta[property="${name}"]`) ?? doc.querySelector(`meta[name="${name}"]`);
    return el?.getAttribute("content")?.trim() ?? "";
}
