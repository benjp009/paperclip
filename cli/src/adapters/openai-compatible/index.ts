import type { CLIAdapterModule } from "@paperclipai/adapter-utils";
import { printOpenaiCompatibleStreamEvent } from "./format-event.js";

export const openaiCompatibleCLIAdapter: CLIAdapterModule = {
  type: "openai_compatible",
  formatStdoutEvent: printOpenaiCompatibleStreamEvent,
};
