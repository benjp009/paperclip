import pc from "picocolors";

export function printOpenaiCompatibleStreamEvent(raw: string, _debug: boolean): void {
  const line = raw.trim();
  if (!line) return;

  // SSE data lines
  if (line.startsWith("data: ")) {
    if (line === "data: [DONE]") return;
    try {
      const chunk = JSON.parse(line.slice(6));
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) {
        process.stdout.write(delta);
        return;
      }
    } catch { /* not JSON */ }
    return;
  }

  // Error lines
  if (line.toLowerCase().includes("error")) {
    console.log(pc.red(line));
    return;
  }

  // Full JSON response
  try {
    const parsed = JSON.parse(line);
    if (parsed.choices?.[0]?.message?.content) {
      console.log(pc.green(parsed.choices[0].message.content));
      return;
    }
    if (parsed.usage) {
      console.log(pc.cyan(`tokens: in=${parsed.usage.prompt_tokens} out=${parsed.usage.completion_tokens}`));
      return;
    }
  } catch { /* not JSON */ }

  console.log(line);
}
