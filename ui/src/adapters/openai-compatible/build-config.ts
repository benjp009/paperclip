import type { CreateConfigValues } from "@paperclipai/adapter-utils";

export function buildOpenaiCompatibleConfig(v: CreateConfigValues): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vals = v as any;
  const ac: Record<string, unknown> = {};
  if (v.url) ac.url = v.url;
  if (vals.apiKey) ac.apiKey = vals.apiKey;
  if (v.model) ac.model = v.model;
  ac.maxTokens = vals.maxTokens ? Number(vals.maxTokens) : 4096;
  ac.temperature = vals.temperature != null ? Number(vals.temperature) : 0.7;
  ac.timeoutSec = 120;
  return ac;
}
