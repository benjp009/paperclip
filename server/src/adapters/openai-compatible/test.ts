import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "../types.js";
import { asString, parseObject } from "../utils.js";

function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult["status"] {
  if (checks.some((c) => c.level === "error")) return "fail";
  if (checks.some((c) => c.level === "warn")) return "warn";
  return "pass";
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = parseObject(ctx.config);
  const url = asString(config.url, "");
  const apiKey = asString(config.apiKey, "");
  const model = asString(config.model, "");

  if (!url) {
    checks.push({
      code: "oai_url_missing",
      level: "error",
      message: "Base URL is required.",
      hint: "Set a base URL like https://api.groq.com/openai/v1",
    });
  } else {
    try {
      const parsed = new URL(url);
      if (!parsed.protocol.startsWith("http")) {
        checks.push({ code: "oai_url_protocol", level: "error", message: `Unsupported protocol: ${parsed.protocol}` });
      } else {
        checks.push({ code: "oai_url_ok", level: "info", message: `Base URL: ${parsed.toString()}` });
      }
    } catch {
      checks.push({ code: "oai_url_invalid", level: "error", message: `Invalid URL: ${url}` });
    }
  }

  if (!apiKey) {
    checks.push({ code: "oai_key_missing", level: "error", message: "API key is required.", hint: "Set your provider API key" });
  } else {
    checks.push({ code: "oai_key_ok", level: "info", message: `API key configured (${apiKey.length} chars)` });
  }

  if (!model) {
    checks.push({ code: "oai_model_missing", level: "error", message: "Model is required.", hint: "Set a model like llama-3.3-70b" });
  } else {
    checks.push({ code: "oai_model_ok", level: "info", message: `Model: ${model}` });
  }

  // Connectivity probe
  if (url && apiKey) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(`${url.replace(/\/+$/, "")}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: controller.signal,
      });
      if (res.ok) {
        checks.push({ code: "oai_conn_ok", level: "info", message: "API endpoint reachable and authenticated." });
      } else if (res.status === 401 || res.status === 403) {
        checks.push({ code: "oai_conn_auth", level: "error", message: `Authentication failed (HTTP ${res.status}).`, hint: "Verify your API key." });
      } else {
        checks.push({ code: "oai_conn_status", level: "warn", message: `API returned HTTP ${res.status}.` });
      }
    } catch (err) {
      checks.push({
        code: "oai_conn_fail",
        level: "warn",
        message: err instanceof Error ? err.message : "Connectivity test failed.",
        hint: "Verify the endpoint is reachable from this server.",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
