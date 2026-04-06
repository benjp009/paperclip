import type { AdapterConfigFieldsProps } from "../types";
import {
  Field,
  DraftInput,
  DraftNumberInput,
} from "../../components/agent-config-primitives";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

const PROVIDER_PRESETS: { label: string; url: string }[] = [
  { label: "Groq", url: "https://api.groq.com/openai/v1" },
  { label: "Cerebras", url: "https://api.cerebras.ai/v1" },
  { label: "SambaNova", url: "https://api.sambanova.ai/v1" },
  { label: "Together", url: "https://api.together.xyz/v1" },
  { label: "OpenRouter", url: "https://openrouter.ai/api/v1" },
];

export function OpenaiCompatibleConfigFields({
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
}: AdapterConfigFieldsProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vals = values as any;
  const currentUrl = isCreate ? vals?.url ?? "" : String(config.url ?? "");

  return (
    <>
      <Field label="Provider Preset" hint="Quick-fill the base URL for a known provider">
        <div className="flex flex-wrap gap-1.5">
          {PROVIDER_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() =>
                isCreate
                  ? set!({ url: p.url })
                  : mark("adapterConfig", "url", p.url)
              }
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                currentUrl === p.url
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Base URL" hint="OpenAI-compatible API base URL (e.g. https://api.groq.com/openai/v1)">
        <DraftInput
          value={
            isCreate
              ? values!.url
              : eff("adapterConfig", "url", String(config.url ?? ""))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ url: v })
              : mark("adapterConfig", "url", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="https://api.groq.com/openai/v1"
        />
      </Field>

      <Field label="API Key" hint="Provider authentication key">
        <DraftInput
          type="password"
          value={
            isCreate
              ? vals?.apiKey ?? ""
              : eff("adapterConfig", "apiKey", String(config.apiKey ?? ""))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ apiKey: v } as any)
              : mark("adapterConfig", "apiKey", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="sk-..."
        />
      </Field>

      <Field label="Model" hint="Model identifier (e.g. llama-3.3-70b-versatile)">
        <DraftInput
          value={
            isCreate
              ? values!.model
              : eff("adapterConfig", "model", String(config.model ?? ""))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ model: v })
              : mark("adapterConfig", "model", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="llama-3.3-70b-versatile"
        />
      </Field>

      <Field label="Max Tokens" hint="Maximum output tokens (default: 4096)">
        <DraftNumberInput
          value={
            isCreate
              ? vals?.maxTokens ?? 4096
              : eff("adapterConfig", "maxTokens", (config.maxTokens as number) ?? 4096)
          }
          onCommit={(v) =>
            isCreate
              ? set!({ maxTokens: v || 4096 } as any)
              : mark("adapterConfig", "maxTokens", v || undefined)
          }
          immediate
          min={1}
          max={128000}
          className={inputClass}
        />
      </Field>

      <Field label="Temperature" hint="Sampling temperature 0-2 (default: 0.7)">
        <DraftNumberInput
          value={
            isCreate
              ? vals?.temperature ?? 0.7
              : eff("adapterConfig", "temperature", (config.temperature as number) ?? 0.7)
          }
          onCommit={(v) =>
            isCreate
              ? set!({ temperature: v ?? 0.7 } as any)
              : mark("adapterConfig", "temperature", v ?? undefined)
          }
          immediate
          min={0}
          max={2}
          step={0.1}
          className={inputClass}
        />
      </Field>
    </>
  );
}
