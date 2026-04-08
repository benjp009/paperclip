import type { AdapterExecutionContext, AdapterExecutionResult } from "../types.js";
import { asString, asNumber, parseObject } from "../utils.js";

export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  const { config, runId, agent, context, onLog, onMeta } = ctx;

  const baseUrl = asString(config.url, "").replace(/\/+$/, "");
  if (!baseUrl) throw new Error("OpenAI-compatible adapter requires url");

  const apiKey = asString(config.apiKey, "");
  if (!apiKey) throw new Error("OpenAI-compatible adapter requires apiKey");

  const model = asString(config.model, "");
  if (!model) throw new Error("OpenAI-compatible adapter requires model");

  const maxTokens = asNumber(config.maxTokens, 4096);
  const temperature = asNumber(config.temperature, 0.7);
  const timeoutMs = (asNumber(config.timeoutSec, 120) || 120) * 1000;

  const prompt = asString(context.paperclipPrompt, "");
  const systemPrompt = asString(
    config.systemPrompt,
    `You are agent "${agent.name}" working in the Paperclip system. Follow your instructions carefully.`,
  );

  if (onMeta) {
    await onMeta({
      adapterType: "openai_compatible",
      command: "POST",
      cwd: process.cwd(),
      commandArgs: [`${baseUrl}/chat/completions`, `model=${model}`],
      prompt,
    });
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
  if (prompt) messages.push({ role: "user", content: prompt });

  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature,
    stream: true,
  };
  if (maxTokens > 0) payload.max_tokens = maxTokens;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      return { exitCode: 124, signal: null, timedOut: true, errorMessage: `Request timed out after ${config.timeoutSec}s` };
    }
    const msg = err instanceof Error ? err.message : String(err);
    await onLog("stderr", `Fetch error: ${msg}\n`);
    return { exitCode: 1, signal: null, timedOut: false, errorMessage: msg };
  }

  if (!response.ok) {
    clearTimeout(timer);
    const errorBody = await response.text().catch(() => "");
    let errorMessage = `API error ${response.status}`;
    let errorCode: string | null = null;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed?.error?.message) errorMessage = parsed.error.message;
      if (parsed?.error?.code) errorCode = parsed.error.code;
    } catch { /* not JSON */ }
    await onLog("stderr", `${errorMessage}\n`);
    return { exitCode: response.status, signal: null, timedOut: false, errorMessage, errorCode };
  }

  // Stream SSE response
  let fullContent = "";
  let inputTokens = 0;
  let outputTokens = 0;
  let resolvedModel = model;

  try {
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]") continue;
          if (!trimmed.startsWith("data: ")) continue;

          try {
            const chunk = JSON.parse(trimmed.slice(6));
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              await onLog("stdout", delta);
            }
            if (chunk.model) resolvedModel = chunk.model;
            if (chunk.usage) {
              inputTokens = chunk.usage.prompt_tokens ?? 0;
              outputTokens = chunk.usage.completion_tokens ?? 0;
            }
          } catch { /* skip malformed chunks */ }
        }
      }
    } else {
      // Fallback: non-streaming response body
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        fullContent = data.choices?.[0]?.message?.content ?? "";
        inputTokens = data.usage?.prompt_tokens ?? 0;
        outputTokens = data.usage?.completion_tokens ?? 0;
        if (data.model) resolvedModel = data.model;
        if (fullContent) await onLog("stdout", fullContent);
      } catch {
        fullContent = text;
        await onLog("stdout", text);
      }
    }
  } finally {
    clearTimeout(timer);
  }

  if (fullContent && !fullContent.endsWith("\n")) {
    await onLog("stdout", "\n");
  }

  const provider = detectProvider(baseUrl);

  return {
    exitCode: 0,
    signal: null,
    timedOut: false,
    usage: inputTokens || outputTokens ? { inputTokens, outputTokens } : undefined,
    provider,
    biller: provider,
    model: resolvedModel,
    billingType: "api",
    costUsd: 0,
    summary: `${resolvedModel} via ${provider}`,
  };
}

function detectProvider(url: string): string {
  if (url.includes("groq")) return "groq";
  if (url.includes("cerebras")) return "cerebras";
  if (url.includes("sambanova")) return "sambanova";
  if (url.includes("together")) return "together";
  if (url.includes("openrouter")) return "openrouter";
  if (url.includes("huggingface") || url.includes("hf.")) return "huggingface";
  if (url.includes("cloudflare")) return "cloudflare";
  if (url.includes("fireworks")) return "fireworks";
  return "openai_compatible";
}
