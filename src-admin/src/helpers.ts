export function normalizeArray(value: unknown): any[] {
    return Array.isArray(value) ? value : [];
}

export function detectThemeMode(props: any, theme: any): 'dark' | 'light' {
    const candidates = [
        props && (props.themeType || props.themeMode || props.themeName),
        theme && theme.palette && theme.palette.mode,
    ].filter(v => v === 'dark' || v === 'light');

    if (candidates.length) return candidates[0];

    try {
        const cls = (globalThis.document && globalThis.document.body && globalThis.document.body.className) || '';
        if (/\bdark\b/i.test(cls)) return 'dark';
        if (/\blight\b/i.test(cls)) return 'light';
    } catch {
        // ignore
    }

    try {
        if (globalThis.matchMedia && globalThis.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch {
        // ignore
    }

    return 'light';
}
