import type { UIAdapterModule } from "../types";
import { parseOpenaiCompatibleStdoutLine } from "./parse-stdout";
import { OpenaiCompatibleConfigFields } from "./config-fields";
import { buildOpenaiCompatibleConfig } from "./build-config";

export const openaiCompatibleUIAdapter: UIAdapterModule = {
  type: "openai_compatible",
  label: "OpenAI-Compatible API",
  parseStdoutLine: parseOpenaiCompatibleStdoutLine,
  ConfigFields: OpenaiCompatibleConfigFields,
  buildAdapterConfig: buildOpenaiCompatibleConfig,
};
