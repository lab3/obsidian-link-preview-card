import { MarkdownRenderChild } from "obsidian";
import type LinkPreviewPlugin from "./main";
import { renderSkeleton, renderCard, renderError } from "./cardRenderer";

export class LinkPreviewCard extends MarkdownRenderChild {
    constructor(
        private url: string,
        private alt: string,
        private plugin: LinkPreviewPlugin,
    ) {
        const el = document.createElement("div");
        super(el);
        this.containerEl.addClass("link-preview-card", "link-preview-state-loading");
        renderSkeleton(this.containerEl);
    }

    onload() {
        this.plugin.fetchMetadata(this.url).then(
            (meta) => renderCard(this.containerEl, meta, this.plugin.getCollapsed(this.url), (c) => { this.plugin.setCollapsed(this.url, c); }),
            () => renderError(this.containerEl, this.url, this.alt),
        );
    }
}
