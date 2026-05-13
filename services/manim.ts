import { API_URL } from "@/constants/api";

const MANIM_CODE_REGEX = /```(?:python|manim)?\s*\n([\s\S]*?)```/g;
const MANIM_SIGNATURE =
    /\b(?:from\s+manim|import\s+manim|class\s+\w+\s*\(\s*\w*Scene\w*\s*\))/;

export function hopefullyExtractManimCodeFromLLMHallucination(
    markdown: string,
): string[] {
    const blocks: string[] = [];
    for (const match of markdown.matchAll(MANIM_CODE_REGEX)) {
        const code = match[1].trim();
        if (MANIM_SIGNATURE.test(code)) blocks.push(code);
    }
    return blocks;
}

export function stripManimCodeBlocks(markdown: string): string {
    // Remove all manim code blocks.
    let out = markdown.replace(MANIM_CODE_REGEX, (match, code) =>
        MANIM_SIGNATURE.test(code.trim()) ? "" : match,
    );

    // Remove unfinished code blocks so they don't appear when rendering.
    const parts = out.split("```");
    if (parts.length % 2 === 0) {
        parts.pop(); // remove the stuff after ```
        out = parts.join("```").replace(/```\s*$/, ""); // and the ``` as well
    }

    return out.replace(/\n{3,}/g, "\n\n").trim();
}

export type RenderResult =
    | { kind: "ready"; videoUrl: string }
    | { kind: "failed"; reason: string };

/// Sends the code to the server.
export async function submitManimCode(
    code: string,
    signal?: AbortSignal,
): Promise<string> {
    const res = await fetch(`${API_URL}/api/compile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        signal,
    });
    if (!res.ok) throw new Error(`compile failed: HTTP ${res.status}`);
    return res.json();
}

/// Polls /res/{uuid}.mp4 and /res/{uuid}.fail every `intervalMs` for `timeoutMs`.
export async function pollForRender(
    uuid: string,
    {
        intervalMs = 1000,
        timeoutMs = 180_000,
        signal,
    }: {
        intervalMs?: number;
        timeoutMs?: number;
        signal?: AbortSignal;
    } = {},
): Promise<RenderResult> {
    const mp4Url = `${API_URL}/res/${uuid}.mp4`;
    const failUrl = `${API_URL}/res/${uuid}.fail`;
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        if (signal?.aborted) throw new Error("aborted");

        const [mp4, fail] = await Promise.all([
            fetch(mp4Url, { method: "HEAD", signal }).catch(() => null),
            fetch(failUrl, { method: "HEAD", signal }).catch(() => null),
        ]);

        if (mp4?.ok) return { kind: "ready", videoUrl: mp4Url };
        if (fail?.ok) {
            const reason = await fetch(failUrl, { signal })
                .then((r) => r.text())
                .catch(() => "unknown error");
            return { kind: "failed", reason };
        }

        await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error("render timeout");
}
