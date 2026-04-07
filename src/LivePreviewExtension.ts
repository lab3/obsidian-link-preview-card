import { Decoration, DecorationSet, EditorView, WidgetType } from "@codemirror/view";
import { StateField, RangeSetBuilder, EditorState, Prec } from "@codemirror/state";
import type LinkPreviewPlugin from "./main";
import { renderSkeleton, renderCard, renderError } from "./cardRenderer";

const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|bmp|ico|tiff?|avif)(\?.*)?$/i;
const IMAGE_LINK_RE = /^!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)$/;

function isDirectImageUrl(url: string): boolean {
    try {
        return IMAGE_EXT.test(new URL(url).pathname);
    } catch {
        return false;
    }
}

class LinkPreviewWidget extends WidgetType {
    constructor(
        readonly url: string,
        readonly alt: string,
        readonly plugin: LinkPreviewPlugin,
    ) { super(); }

    eq(other: LinkPreviewWidget): boolean {
        return other.url === this.url && other.alt === this.alt;
    }

    toDOM(_view: EditorView): HTMLElement {
        const el = document.createElement("div");
        el.className = "link-preview-card link-preview-state-loading";
        renderSkeleton(el);

        this.plugin.fetchMetadata(this.url).then(
            (meta) => { if (el.isConnected) renderCard(el, meta, this.plugin.getCollapsed(this.url), (c) => this.plugin.setCollapsed(this.url, c)); },
            ()     => { if (el.isConnected) renderError(el, this.url, this.alt); },
        );

        return el;
    }

    ignoreEvent(): boolean { return false; }
}

function buildDecorations(state: EditorState, plugin: LinkPreviewPlugin): DecorationSet {
    const builder = new RangeSetBuilder<Decoration>();
    const { selection } = state;

    for (let i = 1; i <= state.doc.lines; i++) {
        const line = state.doc.line(i);
        const trimmed = line.text.trim();

        if (!trimmed.startsWith("![")) continue;

        const match = trimmed.match(IMAGE_LINK_RE);
        if (!match) continue;

        const [, alt, url] = match;
        if (isDirectImageUrl(url)) continue;

        // When cursor is on line: mark it so CSS hides the adjacent image-embed widget
        const cursorOnLine = selection.ranges.some(
            (r) => r.from >= line.from && r.from <= line.to,
        );
        if (cursorOnLine) {
            builder.add(line.from, line.from, Decoration.line({
                attributes: { class: "lp-cursor-on-link" },
            }));
            continue;
        }

        builder.add(line.from, line.to, Decoration.replace({
            widget: new LinkPreviewWidget(url, alt, plugin),
            block: true,
        }));
    }

    return builder.finish();
}

export function createLivePreviewExtension(plugin: LinkPreviewPlugin) {
    return StateField.define<DecorationSet>({
        create: (state) => buildDecorations(state, plugin),
        update: (decs, tr) => {
            if (tr.docChanged || tr.selection) return buildDecorations(tr.state, plugin);
            return decs.map(tr.changes);
        },
        provide: (f) => Prec.highest(EditorView.decorations.from(f)),
    });
}
