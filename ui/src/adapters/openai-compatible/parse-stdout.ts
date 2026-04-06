import type { TranscriptEntry } from "../types";

export function parseOpenaiCompatibleStdoutLine(line: string, ts: string): TranscriptEntry[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  // SSE data lines from streaming — try to extract content delta
  if (trimmed.startsWith("data: ")) {
    if (trimmed === "data: [DONE]") return [];
    try {
      const chunk = JSON.parse(trimmed.slice(6));
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) return [{ kind: "assistant", ts, text: delta, delta: true }];
    } catch { /* not JSON */ }
    return [];
  }

  // Full JSON response (non-streaming fallback)
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed.choices?.[0]?.message?.content) {
      return [{ kind: "assistant", ts, text: parsed.choices[0].message.content }];
    }
    if (parsed.error?.message) {
      return [{ kind: "stderr", ts, text: parsed.error.message }];
    }
  } catch { /* not JSON */ }

  // Plain text output
  return [{ kind: "stdout", ts, text: trimmed }];
}
