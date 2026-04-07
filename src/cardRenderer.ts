import type { OGMetadata } from "./main";

export function renderSkeleton(el: HTMLElement): void {
    el.empty();
    const row = el.createDiv("link-preview-skeleton-row");
    row.createDiv("link-preview-skeleton-thumb");
    const lines = row.createDiv("link-preview-skeleton-lines");
    lines.createDiv("link-preview-skeleton-bar lp-bar-long");
    lines.createDiv("link-preview-skeleton-bar lp-bar-medium");
    lines.createDiv("link-preview-skeleton-bar lp-bar-short");
}

export function renderError(el: HTMLElement, url: string, alt: string): void {
    el.className = "link-preview-card link-preview-state-error";
    el.empty();
    const hostname = safeHostname(url);
    const row = el.createDiv("link-preview-error-row");
    row.createSpan({ cls: "link-preview-error-icon", text: "⚠" });
    const link = row.createEl("a", { cls: "link-preview-error-link", text: alt || hostname });
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    row.createSpan({ cls: "link-preview-error-domain", text: hostname });
}

export function renderCard(el: HTMLElement, meta: OGMetadata, initialCollapsed: boolean, onToggle: (collapsed: boolean) => void): void {
    el.className = "link-preview-card link-preview-state-loaded";
    el.empty();

    const anchor = el.createEl("a", { cls: "link-preview-anchor" });
    anchor.href = meta.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.setAttribute("data-tooltip-position", "none");

    // ── Main row: thumbnail + text ────────────────────────────────────────────
    const mainRow = anchor.createDiv("link-preview-main-row");

    // Thumbnail
    if (meta.image) {
        const thumbWrap = mainRow.createDiv("link-preview-thumb-wrap");
        const thumb = thumbWrap.createEl("img", { cls: "link-preview-thumb" });
        thumb.src = meta.image;
        thumb.alt = meta.title;
        thumb.loading = "lazy";
        thumb.addEventListener("error", () => thumbWrap.addClass("link-preview-thumb-hidden"));
    } else {
        // Favicon fallback thumbnail
        const thumbWrap = mainRow.createDiv("link-preview-thumb-wrap link-preview-thumb-favicon");
        const fav = thumbWrap.createEl("img", { cls: "link-preview-thumb-fav-img" });
        fav.src = `https://www.google.com/s2/favicons?domain=${safeHostname(meta.url)}&sz=64`;
        fav.alt = "";
        fav.addEventListener("error", () => thumbWrap.addClass("link-preview-thumb-hidden"));
    }

    // Text column
    const textCol = mainRow.createDiv("link-preview-text-col");
    textCol.createDiv({ cls: "link-preview-title", text: meta.title });

    if (meta.description) {
        textCol.createDiv({ cls: "link-preview-description", text: meta.description });
    }

    textCol.createDiv({ cls: "link-preview-domain", text: meta.siteName });

    // ── URL row ───────────────────────────────────────────────────────────────
    const urlRow = anchor.createDiv("link-preview-url-row");
    urlRow.createSpan({ cls: "link-preview-url", text: meta.url });

    // ── Collapsed link ────────────────────────────────────────────────────────
    const collapsedLink = el.createEl("a", { cls: "link-preview-collapsed-link" });
    collapsedLink.href = meta.url;
    collapsedLink.target = "_blank";
    collapsedLink.rel = "noopener noreferrer";
    collapsedLink.setText(meta.url);

    // ── Toggle ────────────────────────────────────────────────────────────────
    let collapsed = initialCollapsed;
    const toggle = el.createDiv("link-preview-toggle");
    toggle.setAttribute("aria-label", "Toggle preview");
    const svg = toggle.createSvg("svg", { attr: { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "2.5", "stroke-linecap": "round", "stroke-linejoin": "round" } });
    svg.createSvg("polyline", { attr: { points: "6 9 12 15 18 9" } });
    el.toggleClass("link-preview-collapsed", collapsed);
    toggle.toggleClass("lp-toggle-open", !collapsed);

    toggle.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        collapsed = !collapsed;
        el.toggleClass("link-preview-collapsed", collapsed);
        toggle.toggleClass("lp-toggle-open", !collapsed);
        onToggle(collapsed);
    });
}

export function safeHostname(url: string): string {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}
