import type { ServerAdapterModule } from "../types.js";
import { execute } from "./execute.js";
import { testEnvironment } from "./test.js";

export const openaiCompatibleAdapter: ServerAdapterModule = {
  type: "openai_compatible",
  execute,
  testEnvironment,
  models: [
    // Groq production
    { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)" },
    { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (Groq)" },
    { id: "openai/gpt-oss-120b", label: "GPT OSS 120B (Groq)" },
    { id: "openai/gpt-oss-20b", label: "GPT OSS 20B (Groq)" },
    // Groq preview
    { id: "meta-llama/llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout 17B (Groq)" },
    { id: "qwen/qwen3-32b", label: "Qwen 3 32B (Groq)" },
    // Cerebras
    { id: "llama-3.3-70b", label: "Llama 3.3 70B (Cerebras)" },
    { id: "qwen-2.5-coder-32b", label: "Qwen 2.5 Coder 32B (Cerebras)" },
  ],
  agentConfigurationDoc: `# openai_compatible agent configuration

Adapter: openai_compatible

Use when:
- You want to use free or low-cost LLM providers (Groq, Cerebras, SambaNova, etc.)
- You need an OpenAI-compatible chat completions API
- You want to avoid consuming tokens on your primary provider

Don't use when:
- You need full agentic capabilities with tool use and file editing (use claude_local, codex_local, etc.)
- You need webhook-style invocation (use http)

Core fields:
- url (string, required): Base API URL (e.g. https://api.groq.com/openai/v1)
- apiKey (string, required): Provider API key
- model (string, required): Model identifier (e.g. llama-3.3-70b-versatile)

Optional fields:
- maxTokens (number): Max output tokens (default: 4096)
- temperature (number): Sampling temperature 0-2 (default: 0.7)
- timeoutSec (number): Request timeout in seconds (default: 120)
- systemPrompt (string): Custom system prompt override

Provider presets:
- Groq: https://api.groq.com/openai/v1
- Cerebras: https://api.cerebras.ai/v1
- SambaNova: https://api.sambanova.ai/v1
- Together: https://api.together.xyz/v1
- OpenRouter: https://openrouter.ai/api/v1
`,
};
