import { pollForRender, RenderResult, submitManimCode } from "@/services/manim";
import { useCallback, useEffect, useRef, useState } from "react";

type State =
    | { status: "idle" }
    | { status: "compiling"; uuid: string }
    | { status: "ready"; uuid: string; videoUrl: string }
    | { status: "failed"; uuid?: string; reason: string };

export function useManimRender() {
    const [state, setState] = useState<State>({ status: "idle" });
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => () => abortRef.current?.abort(), []);

    const render = useCallback(async (code: string) => {
        abortRef.current?.abort();
        const ctrl = new AbortController();
        abortRef.current = ctrl;

        try {
            const uuid = await submitManimCode(code, ctrl.signal);
            setState({ status: "compiling", uuid });

            const result: RenderResult = await pollForRender(uuid, {
                signal: ctrl.signal,
            });

            if (result.kind === "ready")
                setState({ status: "ready", uuid, videoUrl: result.videoUrl });
            else setState({ status: "failed", uuid, reason: result.reason });
        } catch (e: any) {
            if (e?.name === "AbortError" || e?.message === "aborted") return;
            setState({
                status: "failed",
                reason: e?.message ?? "network error",
            });
        }
    }, []);

    return { state, render };
}
