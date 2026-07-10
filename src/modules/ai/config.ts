export const KEYRING_SERVICE = "terax-ai";

import { getDynamicModelInfo } from "./dynamicModels";

export type ProviderId =
  | "openai"
  | "anthropic"
  | "google"
  | "xai"
  | "cerebras"
  | "groq"
  | "deepseek"
  | "mistral"
  | "openrouter"
  | "openai-compatible"
  | "lmstudio"
  | "mlx"
  | "ollama"
  | "opencode-zen"
  | "opencode-go"
  | "nvidia";

/** Wire-protocol style used to reach a model. Lets one provider expose several
 *  API versions (OpenAI Responses, Anthropic Messages, Google, OpenAI-compatible
 *  chat/completions) through a single model catalog. */
export type ProviderApiStyle =
  | "openai"
  | "anthropic"
  | "google"
  | "openai-compatible";

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  keyringAccount: string;
  keyPrefix: string | null;
  consoleUrl: string;
  /** Provider accepts (but does not require) an API key. */
  keyOptional?: boolean;
};

export const PROVIDERS: readonly ProviderInfo[] = [
  {
    id: "openai",
    label: "OpenAI",
    keyringAccount: "openai-api-key",
    keyPrefix: "sk-",
    consoleUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    keyringAccount: "anthropic-api-key",
    keyPrefix: "sk-ant-",
    consoleUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "google",
    label: "Google",
    keyringAccount: "google-api-key",
    keyPrefix: null,
    consoleUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "xai",
    label: "xAI",
    keyringAccount: "xai-api-key",
    keyPrefix: "xai-",
    consoleUrl: "https://console.x.ai/",
  },
  {
    id: "cerebras",
    label: "Cerebras",
    keyringAccount: "cerebras-api-key",
    keyPrefix: "csk-",
    consoleUrl: "https://cloud.cerebras.ai/",
  },
  {
    id: "groq",
    label: "Groq",
    keyringAccount: "groq-api-key",
    keyPrefix: "gsk_",
    consoleUrl: "https://console.groq.com/keys",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    keyringAccount: "deepseek-api-key",
    keyPrefix: "sk-",
    consoleUrl: "https://platform.deepseek.com/api_keys",
  },
  {
    id: "mistral",
    label: "Mistral",
    keyringAccount: "mistral-api-key",
    keyPrefix: null,
    consoleUrl: "https://console.mistral.ai/api-keys/",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    keyringAccount: "openrouter-api-key",
    keyPrefix: "sk-or-",
    consoleUrl: "https://openrouter.ai/keys",
  },
  {
    id: "openai-compatible",
    label: "OpenAI Compatible",
    keyringAccount: "openai-compatible-api-key",
    keyPrefix: null,
    consoleUrl: "https://platform.openai.com/docs/api-reference",
    keyOptional: true,
  },
  {
    id: "lmstudio",
    label: "LM Studio",
    keyringAccount: "",
    keyPrefix: null,
    consoleUrl: "https://lmstudio.ai/docs/basics/server",
  },
  {
    id: "mlx",
    label: "MLX",
    keyringAccount: "",
    keyPrefix: null,
    consoleUrl: "https://github.com/ml-explore/mlx-lm/blob/main/mlx_lm/SERVER.md",
  },
  {
    id: "ollama",
    label: "Ollama",
    keyringAccount: "",
    keyPrefix: null,
    consoleUrl: "https://ollama.com/download",
  },
  {
    id: "opencode-zen",
    label: "OpenCode Zen",
    keyringAccount: "opencode-zen-api-key",
    keyPrefix: "zen-",
    consoleUrl: "https://opencode.ai/zen",
    keyOptional: true,
  },
  {
    id: "opencode-go",
    label: "OpenCode Go",
    keyringAccount: "opencode-go-api-key",
    keyPrefix: "go-",
    consoleUrl: "https://opencode.ai/go",
    keyOptional: true,
  },
  {
    id: "nvidia",
    label: "NVIDIA",
    keyringAccount: "nvidia-api-key",
    keyPrefix: "nvapi-",
    consoleUrl: "https://build.nvidia.com",
  },
] as const;

export type CustomEndpoint = {
  id: string;
  name: string;
  baseURL: string;
  modelId: string;
  contextLimit: number;
};

const COMPAT_MODEL_PREFIX = "compat-";

export function compatModelIdForEndpoint(endpointId: string): string {
  return `${COMPAT_MODEL_PREFIX}${endpointId}`;
}

export function isCompatModelId(modelId: string): boolean {
  return modelId.startsWith(COMPAT_MODEL_PREFIX);
}

export function endpointIdFromCompatModel(modelId: string): string {
  return isCompatModelId(modelId)
    ? modelId.slice(COMPAT_MODEL_PREFIX.length)
    : "";
}

/** One-shot migration of the legacy single OpenAI-compatible config into the
 *  named-endpoint list. Returns one endpoint when the old base URL + model id
 *  were both set, else empty. `id` is supplied by the caller to stay pure. */
export function migrateLegacyCompatEndpoint(
  baseURL: string,
  modelId: string,
  contextLimit: number,
  id: string,
): CustomEndpoint[] {
  if (!baseURL.trim() || !modelId.trim()) return [];
  return [{ id, name: "Custom endpoint", baseURL, modelId, contextLimit }];
}

export function getProvider(id: ProviderId): ProviderInfo {
  const p = PROVIDERS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown provider: ${id}`);
  return p;
}

/** 1 (lowest) – 5 (highest). For `cost`, higher = cheaper. */
export type CapabilityScore = 1 | 2 | 3 | 4 | 5;

export type ModelCapabilities = {
  intelligence: CapabilityScore;
  speed: CapabilityScore;
  cost: CapabilityScore;
};

export type ModelTag = "vision" | "reasoning" | "tools" | "coding";

export type ModelInfo = {
  id: string;
  provider: ProviderId;
  label: string;
  /** One short word for the dropdown trigger. */
  hint: string;
  /** One-line marketing-style description shown under the label. */
  description: string;
   capabilities: ModelCapabilities;
  tags?: readonly ModelTag[];
  /** How to reach this model over the wire. Defaults by provider when omitted. */
  apiStyle?: ProviderApiStyle;
};

/** Prefix applied to model ids for dynamic/aggregator providers so they never
 *  collide with the canonical ids of the same underlying model. Stripped at
 *  request time in `buildLanguageModel`. */
export const MODEL_ID_PREFIX: Record<"opencode-zen" | "opencode-go" | "nvidia", string> = {
  "opencode-zen": "zen/",
  "opencode-go": "go/",
  "nvidia": "nvidia/",
};

export function apiModelId(model: ModelInfo): string {
  const prefix = MODEL_ID_PREFIX[model.provider as keyof typeof MODEL_ID_PREFIX];
  return prefix && model.id.startsWith(prefix)
    ? model.id.slice(prefix.length)
    : model.id;
}

export const MODELS = [
  // ── OpenAI ────────────────────────────────────────────────────────────────
  {
    id: "gpt-5.5",
    provider: "openai",
    label: "GPT-5.5",
    hint: "Flagship",
    description: "Frontier reasoning and code.",
    capabilities: { intelligence: 5, speed: 3, cost: 1 },
    tags: ["vision", "reasoning", "tools", "coding"],
  },
  {
    id: "gpt-5.5-pro",
    provider: "openai",
    label: "GPT-5.5 Pro",
    hint: "Max",
    description: "Highest-accuracy version for the hardest professional and agentic tasks.",
    capabilities: { intelligence: 5, speed: 2, cost: 1 },
    tags: ["vision", "reasoning", "tools", "coding"],
  },
  {
    id: "gpt-5.4-mini",
    provider: "openai",
    label: "GPT-5.4 mini",
    hint: "Fast",
    description: "Snappy default at low cost.",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["vision", "tools"],
  },
  {
    id: "gpt-5.4-nano",
    provider: "openai",
    label: "GPT-5.4 nano",
    hint: "Fastest",
    description: "Tiny and instant — great for autocomplete.",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["tools"],
  },
  {
    id: "gpt-5.3-codex",
    provider: "openai",
    label: "GPT-5.3 Codex",
    hint: "Coding",
    description: "Tuned for code and tool use.",
    capabilities: { intelligence: 4, speed: 4, cost: 3 },
    tags: ["tools", "coding"],
  },
  {
    id: "gpt-4.1-mini",
    provider: "openai",
    label: "GPT-4.1 mini",
    hint: "Cheap",
    description: "Ultra-cheap workhorse for bulk tasks.",
    capabilities: { intelligence: 3, speed: 4, cost: 5 },
    tags: ["vision", "tools"],
  },

  // ── Anthropic ─────────────────────────────────────────────────────────────
  {
    id: "claude-opus-4-8",
    provider: "anthropic",
    label: "Claude Opus 4.8",
    hint: "Best",
    description: "Anthropic's most capable model for complex reasoning and long-horizon agentic coding.",
    capabilities: { intelligence: 5, speed: 2, cost: 1 },
    tags: ["vision", "reasoning", "tools", "coding"],
  },
  {
    id: "claude-opus-4-7",
    provider: "anthropic",
    label: "Claude Opus 4.7",
    hint: "Previous",
    description: "Previous-gen flagship for long reasoning.",
    capabilities: { intelligence: 5, speed: 2, cost: 1 },
    tags: ["vision", "reasoning", "tools", "coding"],
  },
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic",
    label: "Claude Sonnet 4.6",
    hint: "Balanced",
    description: "Sweet spot of quality and speed.",
    capabilities: { intelligence: 4, speed: 4, cost: 3 },
    tags: ["vision", "tools", "coding"],
  },
  {
    id: "claude-haiku-4-5",
    provider: "anthropic",
    label: "Claude Haiku 4.5",
    hint: "Fast",
    description: "Quick, cheap, multimodal.",
    capabilities: { intelligence: 3, speed: 5, cost: 4 },
    tags: ["vision", "tools"],
  },
  {
    id: "claude-opus-4-6",
    provider: "anthropic",
    label: "Claude Opus 4.6",
    hint: "Legacy",
    description: "Previous-gen Opus.",
    capabilities: { intelligence: 5, speed: 2, cost: 1 },
    tags: ["vision", "reasoning", "tools", "coding"],
  },

  // ── Google ────────────────────────────────────────────────────────────────
  {
    id: "gemini-3.5-flash",
    provider: "google",
    label: "Gemini 3.5 Flash",
    hint: "Fast",
    description: "High-intelligence, extremely fast multimodal model.",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["vision", "tools", "coding"],
  },
  {
    id: "gemini-3.1-flash-lite",
    provider: "google",
    label: "Gemini 3.1 Flash-Lite",
    hint: "Lite",
    description: "Extremely fast, cheap, and lightweight multimodal model.",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["vision", "tools"],
  },
  {
    id: "gemini-3.1-pro-preview",
    provider: "google",
    label: "Gemini 3.1 Pro",
    hint: "Flagship",
    description: "Strong reasoning, 1M context.",
    capabilities: { intelligence: 5, speed: 3, cost: 2 },
    tags: ["vision", "reasoning", "tools", "coding"],
  },
  {
    id: "gemini-3-flash-preview",
    provider: "google",
    label: "Gemini 3 Flash",
    hint: "Fast",
    description: "Fast multimodal, 1M context.",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["vision", "tools"],
  },
  {
    id: "gemini-2.5-pro",
    provider: "google",
    label: "Gemini 2.5 Pro",
    hint: "Stable",
    description: "Production-stable Gemini.",
    capabilities: { intelligence: 4, speed: 3, cost: 3 },
    tags: ["vision", "tools", "coding"],
  },
  {
    id: "gemini-2.5-flash",
    provider: "google",
    label: "Gemini 2.5 Flash",
    hint: "Cheap",
    description: "Bulk throughput at low cost.",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["vision", "tools"],
  },

  // ── xAI ───────────────────────────────────────────────────────────────────
  {
    id: "grok-4.20-reasoning",
    provider: "xai",
    label: "Grok 4.20 Reasoning",
    hint: "Reasoning",
    description: "Frontier reasoning with extended thinking.",
    capabilities: { intelligence: 5, speed: 2, cost: 2 },
    tags: ["reasoning", "tools", "coding"],
  },
  {
    id: "grok-4.20-non-reasoning",
    provider: "xai",
    label: "Grok 4.20",
    hint: "Fast",
    description: "Fast tier for chat and tools.",
    capabilities: { intelligence: 4, speed: 4, cost: 3 },
    tags: ["tools"],
  },
  {
    id: "grok-4-fast-reasoning",
    provider: "xai",
    label: "Grok 4 Fast",
    hint: "Reasoning",
    description: "Cheaper Grok 4 with vision and reasoning.",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["vision", "reasoning", "tools"],
  },
  {
    id: "grok-4.3",
    provider: "xai",
    label: "Grok 4.3",
    hint: "Flagship",
    description: "Most intelligent and fastest Grok. Strong agentic tool use and 1M context.",
    capabilities: { intelligence: 5, speed: 4, cost: 2 },
    tags: ["vision", "reasoning", "tools", "coding"],
  },
  {
    id: "grok-build-0.1",
    provider: "xai",
    label: "Grok Build 0.1",
    hint: "Coding",
    description: "Specialized fast coding model for agentic workflows (powers Grok Build CLI).",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["tools", "coding"],
  },

  // ── DeepSeek ──────────────────────────────────────────────────────────────
  {
    id: "deepseek-v4-pro",
    provider: "deepseek",
    label: "DeepSeek V4 Pro",
    hint: "Best",
    description: "Strong open-weight code model.",
    capabilities: { intelligence: 5, speed: 3, cost: 4 },
    tags: ["reasoning", "tools", "coding"],
  },
  {
    id: "deepseek-v4-flash",
    provider: "deepseek",
    label: "DeepSeek V4 Flash",
    hint: "Fast",
    description: "Cheap and fast everyday tier.",
    capabilities: { intelligence: 4, speed: 5, cost: 5 },
    tags: ["reasoning", "tools"],
  },
  {
    id: "deepseek-reasoner",
    provider: "deepseek",
    label: "DeepSeek Reasoner",
    hint: "Thinking",
    description: "Chain-of-thought at open-weight prices.",
    capabilities: { intelligence: 5, speed: 2, cost: 4 },
    tags: ["reasoning", "coding"],
  },

  // ── Mistral ────────────────────────────────────────────────────────────────
  {
    id: "mistral-large-latest",
    provider: "mistral",
    label: "Mistral Large 3",
    hint: "Best",
    description: "Flagship Mistral model with 128K context.",
    capabilities: { intelligence: 5, speed: 3, cost: 3 },
    tags: ["vision", "tools", "coding"],
  },
  {
    id: "mistral-medium-latest",
    provider: "mistral",
    label: "Mistral Medium 3.5",
    hint: "Balanced",
    description: "Good balance of speed and intelligence.",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["vision", "tools"],
  },
  {
    id: "codestral-latest",
    provider: "mistral",
    label: "Codestral",
    hint: "Code",
    description: "Purpose-built coding model from Mistral.",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["coding"],
  },

  // ── Cerebras (autocomplete-tier) ──────────────────────────────────────────
  {
    id: "gpt-oss-120b",
    provider: "cerebras",
    label: "GPT-OSS 120B",
    hint: "Ultra-fast",
    description: "Fastest inference on Cerebras silicon.",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["tools", "coding"],
  },
  {
    id: "llama3.3-70b",
    provider: "cerebras",
    label: "Llama 3.3 70B",
    hint: "Fast",
    description: "Meta's open model on wafer-scale silicon.",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["tools"],
  },
  {
    id: "qwen-3-32b",
    provider: "cerebras",
    label: "Qwen 3 32B",
    hint: "Fast",
    description: "Multilingual model at extreme speed.",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["tools", "coding"],
  },

  // ── Groq (autocomplete-tier) ──────────────────────────────────────────────
  {
    id: "openai/gpt-oss-20b",
    provider: "groq",
    label: "GPT-OSS 20B",
    hint: "Ultra-fast",
    description: "Sub-second responses on Groq LPU.",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["tools", "coding"],
  },
  {
    id: "llama-3.3-70b-versatile",
    provider: "groq",
    label: "Llama 3.3 70B",
    hint: "Versatile",
    description: "Fast and broadly capable.",
    capabilities: { intelligence: 4, speed: 5, cost: 5 },
    tags: ["tools"],
  },
  {
    id: "deepseek-r1-distill-llama-70b",
    provider: "groq",
    label: "DeepSeek R1 Distill 70B",
    hint: "Thinking",
    description: "Reasoning-distilled Llama on Groq.",
    capabilities: { intelligence: 4, speed: 5, cost: 5 },
    tags: ["reasoning", "tools"],
  },

  // ── OpenRouter (gateway; model id is user-supplied at runtime) ────────────
  {
    id: "openrouter-custom",
    provider: "openrouter",
    label: "OpenRouter",
    hint: "Configurable",
    description: "Any model on OpenRouter by id.",
    capabilities: { intelligence: 3, speed: 3, cost: 3 },
  },

  // ── Generic OpenAI-compatible (user-defined endpoint) ─────────────────────
  {
    id: "openai-compatible-custom",
    provider: "openai-compatible",
    label: "Custom endpoint",
    hint: "Configurable",
    description: "Any OpenAI-compatible endpoint.",
    capabilities: { intelligence: 3, speed: 3, cost: 3 },
  },

  // ── LM Studio (local; model id is user-supplied at runtime) ───────────────
  {
    id: "lmstudio-local",
    provider: "lmstudio",
    label: "LM Studio",
    hint: "Local",
    description: "Local GGUF models via LM Studio.",
    capabilities: { intelligence: 3, speed: 3, cost: 5 },
  },

  // ── MLX (local; Apple-silicon; model id is user-supplied at runtime) ──────
  {
    id: "mlx-local",
    provider: "mlx",
    label: "MLX",
    hint: "Local",
    description: "Apple-silicon models via mlx_lm.server.",
    capabilities: { intelligence: 3, speed: 3, cost: 5 },
  },

  // ── Ollama (local; model id is user-supplied at runtime) ──────────────────
  {
    id: "ollama-local",
    provider: "ollama",
    label: "Ollama",
    hint: "Local",
    description: "Local models via Ollama.",
    capabilities: { intelligence: 3, speed: 3, cost: 5 },
  },

  // ── OpenCode Zen ──────────────────────────────────────────────────────────
  // Aggregator over OpenAI / Anthropic / Google / open-weight models. Keyless
  // on the free tier; pass a `zen-` key for higher limits. apiStyle selects
  // which SDK/endpoint reaches each model (all API versions supported).
  {
    id: "zen/gpt-5.5",
    provider: "opencode-zen",
    label: "Zen · GPT-5.5",
    hint: "Flagship",
    description: "OpenAI flagship via Zen (Responses API).",
    capabilities: { intelligence: 5, speed: 3, cost: 1 },
    tags: ["vision", "reasoning", "tools", "coding"],
    apiStyle: "openai",
  },
  {
    id: "zen/gpt-5.5-pro",
    provider: "opencode-zen",
    label: "Zen · GPT-5.5 Pro",
    hint: "Max",
    description: "Highest-accuracy GPT via Zen (Responses API).",
    capabilities: { intelligence: 5, speed: 2, cost: 1 },
    tags: ["vision", "reasoning", "tools", "coding"],
    apiStyle: "openai",
  },
  {
    id: "zen/gpt-5.4-mini",
    provider: "opencode-zen",
    label: "Zen · GPT-5.4 mini",
    hint: "Fast",
    description: "Snappy GPT tier via Zen (Responses API).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["vision", "tools"],
    apiStyle: "openai",
  },
  {
    id: "zen/gpt-5.4-nano",
    provider: "opencode-zen",
    label: "Zen · GPT-5.4 nano",
    hint: "Fastest",
    description: "Tiny, instant GPT via Zen — great for autocomplete.",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["tools"],
    apiStyle: "openai",
  },
  {
    id: "zen/gpt-5.3-codex",
    provider: "opencode-zen",
    label: "Zen · GPT-5.3 Codex",
    hint: "Coding",
    description: "Code-tuned GPT via Zen (Responses API).",
    capabilities: { intelligence: 4, speed: 4, cost: 3 },
    tags: ["tools", "coding"],
    apiStyle: "openai",
  },
  {
    id: "zen/gpt-4.1-mini",
    provider: "opencode-zen",
    label: "Zen · GPT-4.1 mini",
    hint: "Cheap",
    description: "Ultra-cheap GPT workhorse via Zen (Responses API).",
    capabilities: { intelligence: 3, speed: 4, cost: 5 },
    tags: ["vision", "tools"],
    apiStyle: "openai",
  },
  {
    id: "zen/claude-opus-4-8",
    provider: "opencode-zen",
    label: "Zen · Claude Opus 4.8",
    hint: "Best",
    description: "Anthropic flagship via Zen (Messages API).",
    capabilities: { intelligence: 5, speed: 2, cost: 1 },
    tags: ["vision", "reasoning", "tools", "coding"],
    apiStyle: "anthropic",
  },
  {
    id: "zen/claude-opus-4-7",
    provider: "opencode-zen",
    label: "Zen · Claude Opus 4.7",
    hint: "Previous",
    description: "Previous-gen Opus via Zen (Messages API).",
    capabilities: { intelligence: 5, speed: 2, cost: 1 },
    tags: ["vision", "reasoning", "tools", "coding"],
    apiStyle: "anthropic",
  },
  {
    id: "zen/claude-sonnet-4-6",
    provider: "opencode-zen",
    label: "Zen · Claude Sonnet 4.6",
    hint: "Balanced",
    description: "Balanced Claude via Zen (Messages API).",
    capabilities: { intelligence: 4, speed: 4, cost: 3 },
    tags: ["vision", "tools", "coding"],
    apiStyle: "anthropic",
  },
  {
    id: "zen/claude-haiku-4-5",
    provider: "opencode-zen",
    label: "Zen · Claude Haiku 4.5",
    hint: "Fast",
    description: "Quick Claude via Zen (Messages API).",
    capabilities: { intelligence: 3, speed: 5, cost: 4 },
    tags: ["vision", "tools"],
    apiStyle: "anthropic",
  },
  {
    id: "zen/claude-opus-4-6",
    provider: "opencode-zen",
    label: "Zen · Claude Opus 4.6",
    hint: "Legacy",
    description: "Legacy Opus via Zen (Messages API).",
    capabilities: { intelligence: 5, speed: 2, cost: 1 },
    tags: ["vision", "reasoning", "tools", "coding"],
    apiStyle: "anthropic",
  },
  {
    id: "zen/gemini-3.5-flash",
    provider: "opencode-zen",
    label: "Zen · Gemini 3.5 Flash",
    hint: "Fast",
    description: "Fast multimodal Gemini via Zen (Generative AI API).",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["vision", "tools", "coding"],
    apiStyle: "google",
  },
  {
    id: "zen/gemini-3.1-flash-lite",
    provider: "opencode-zen",
    label: "Zen · Gemini 3.1 Flash-Lite",
    hint: "Lite",
    description: "Lightweight Gemini via Zen (Generative AI API).",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["vision", "tools"],
    apiStyle: "google",
  },
  {
    id: "zen/gemini-3.1-pro-preview",
    provider: "opencode-zen",
    label: "Zen · Gemini 3.1 Pro",
    hint: "Flagship",
    description: "Strong-reasoning Gemini via Zen (Generative AI API).",
    capabilities: { intelligence: 5, speed: 3, cost: 2 },
    tags: ["vision", "reasoning", "tools", "coding"],
    apiStyle: "google",
  },
  {
    id: "zen/gemini-3-flash-preview",
    provider: "opencode-zen",
    label: "Zen · Gemini 3 Flash",
    hint: "Fast",
    description: "Fast Gemini via Zen (Generative AI API).",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["vision", "tools"],
    apiStyle: "google",
  },
  {
    id: "zen/gemini-2.5-pro",
    provider: "opencode-zen",
    label: "Zen · Gemini 2.5 Pro",
    hint: "Stable",
    description: "Stable Gemini via Zen (Generative AI API).",
    capabilities: { intelligence: 4, speed: 3, cost: 3 },
    tags: ["vision", "tools", "coding"],
    apiStyle: "google",
  },
  {
    id: "zen/gemini-2.5-flash",
    provider: "opencode-zen",
    label: "Zen · Gemini 2.5 Flash",
    hint: "Cheap",
    description: "Cheap Gemini via Zen (Generative AI API).",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["vision", "tools"],
    apiStyle: "google",
  },
  {
    id: "zen/deepseek-v4-pro",
    provider: "opencode-zen",
    label: "Zen · DeepSeek V4 Pro",
    hint: "Best",
    description: "Open-weight code model via Zen (chat/completions).",
    capabilities: { intelligence: 5, speed: 3, cost: 4 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/deepseek-v4-flash",
    provider: "opencode-zen",
    label: "Zen · DeepSeek V4 Flash",
    hint: "Fast",
    description: "Fast open-weight tier via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 5, cost: 5 },
    tags: ["reasoning", "tools"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/deepseek-reasoner",
    provider: "opencode-zen",
    label: "Zen · DeepSeek Reasoner",
    hint: "Thinking",
    description: "Chain-of-thought via Zen (chat/completions).",
    capabilities: { intelligence: 5, speed: 2, cost: 4 },
    tags: ["reasoning", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/minimax-m2.7",
    provider: "opencode-zen",
    label: "Zen · MiniMax M2.7",
    hint: "Thinking",
    description: "MiniMax reasoning model via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/minimax-m2.5",
    provider: "opencode-zen",
    label: "Zen · MiniMax M2.5",
    hint: "Fast",
    description: "Fast MiniMax via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/qwen3.7-max",
    provider: "opencode-zen",
    label: "Zen · Qwen3.7 Max",
    hint: "Flagship",
    description: "Qwen flagship via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 3, cost: 3 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/qwen3.7-plus",
    provider: "opencode-zen",
    label: "Zen · Qwen3.7 Plus",
    hint: "Balanced",
    description: "Balanced Qwen via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/qwen3.6-plus",
    provider: "opencode-zen",
    label: "Zen · Qwen3.6 Plus",
    hint: "Balanced",
    description: "Qwen Plus via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/glm-4.7-flash",
    provider: "opencode-zen",
    label: "Zen · GLM 4.7 Flash",
    hint: "Fast",
    description: "Cheap GLM via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 5, cost: 5 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/glm-4.6",
    provider: "opencode-zen",
    label: "Zen · GLM 4.6",
    hint: "Balanced",
    description: "Balanced GLM via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/kimi-k2.6",
    provider: "opencode-zen",
    label: "Zen · Kimi K2.6",
    hint: "Balanced",
    description: "Kimi via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/kimi-k2.5",
    provider: "opencode-zen",
    label: "Zen · Kimi K2.5",
    hint: "Balanced",
    description: "Kimi via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/grok-4.20",
    provider: "opencode-zen",
    label: "Zen · Grok 4.20",
    hint: "Flagship",
    description: "Grok via Zen (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/big-pickle-2.5",
    provider: "opencode-zen",
    label: "Zen · Big Pickle 2.5",
    hint: "Fast",
    description: "Tiny fast model via Zen (chat/completions).",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["tools"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/best-pickle-2.5",
    provider: "opencode-zen",
    label: "Zen · Best Pickle 2.5",
    hint: "Fast",
    description: "Tiny fast model via Zen (chat/completions).",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["tools"],
    apiStyle: "openai-compatible",
  },
  {
    id: "zen/mimo-1.7b",
    provider: "opencode-zen",
    label: "Zen · Mimo 1.7B",
    hint: "Fastest",
    description: "Tiny on-device-class model via Zen (chat/completions).",
    capabilities: { intelligence: 2, speed: 5, cost: 5 },
    tags: ["tools"],
    apiStyle: "openai-compatible",
  },

  // ── OpenCode Go ───────────────────────────────────────────────────────────
  // Open-weight coding models. Keyless on the free tier; `go-` key for limits.
  {
    id: "go/glm-4.7-flash",
    provider: "opencode-go",
    label: "Go · GLM 4.7 Flash",
    hint: "Fast",
    description: "Cheap GLM via Go (chat/completions).",
    capabilities: { intelligence: 4, speed: 5, cost: 5 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "go/glm-4.6",
    provider: "opencode-go",
    label: "Go · GLM 4.6",
    hint: "Balanced",
    description: "Balanced GLM via Go (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "go/kimi-k2.7-code",
    provider: "opencode-go",
    label: "Go · Kimi K2.7 Code",
    hint: "Coding",
    description: "Code-tuned Kimi via Go (chat/completions).",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "go/kimi-k2.6",
    provider: "opencode-go",
    label: "Go · Kimi K2.6",
    hint: "Balanced",
    description: "Kimi via Go (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "go/deepseek-v4-pro",
    provider: "opencode-go",
    label: "Go · DeepSeek V4 Pro",
    hint: "Best",
    description: "Open-weight code model via Go (chat/completions).",
    capabilities: { intelligence: 5, speed: 3, cost: 4 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "go/deepseek-v4-flash",
    provider: "opencode-go",
    label: "Go · DeepSeek V4 Flash",
    hint: "Fast",
    description: "Fast open-weight tier via Go (chat/completions).",
    capabilities: { intelligence: 4, speed: 5, cost: 5 },
    tags: ["reasoning", "tools"],
    apiStyle: "openai-compatible",
  },
  {
    id: "go/mimo-1.7b",
    provider: "opencode-go",
    label: "Go · Mimo 1.7B",
    hint: "Fastest",
    description: "Tiny model via Go (chat/completions).",
    capabilities: { intelligence: 2, speed: 5, cost: 5 },
    tags: ["tools"],
    apiStyle: "openai-compatible",
  },
  {
    id: "go/minimax-m3",
    provider: "opencode-go",
    label: "Go · MiniMax M3",
    hint: "Fast",
    description: "Fast MiniMax via Go (chat/completions).",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "go/minimax-m2.7",
    provider: "opencode-go",
    label: "Go · MiniMax M2.7",
    hint: "Thinking",
    description: "MiniMax reasoning via Go (Messages API).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "anthropic",
  },
  {
    id: "go/minimax-m2.5",
    provider: "opencode-go",
    label: "Go · MiniMax M2.5",
    hint: "Fast",
    description: "Fast MiniMax via Go (Messages API).",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "anthropic",
  },
  {
    id: "go/qwen3.7-max",
    provider: "opencode-go",
    label: "Go · Qwen3.7 Max",
    hint: "Flagship",
    description: "Qwen flagship via Go (Messages API).",
    capabilities: { intelligence: 4, speed: 3, cost: 3 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "anthropic",
  },
  {
    id: "go/qwen3.7-plus",
    provider: "opencode-go",
    label: "Go · Qwen3.7 Plus",
    hint: "Balanced",
    description: "Balanced Qwen via Go (Messages API).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "anthropic",
  },
  {
    id: "go/qwen3.6-plus",
    provider: "opencode-go",
    label: "Go · Qwen3.6 Plus",
    hint: "Balanced",
    description: "Qwen Plus via Go (Messages API).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "anthropic",
  },

  // ── NVIDIA ────────────────────────────────────────────────────────────────
  // NIM catalog. Requires an `nvapi-` key. OpenAI-compatible chat/completions.
  {
    id: "nvidia/nemotron-nano-9b-v2",
    provider: "nvidia",
    label: "NVIDIA · Nemotron Nano 9B",
    hint: "Fast",
    description: "Tiny Nemotron via NIM (chat/completions).",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "nvidia/nemotron-nano-12b-v2",
    provider: "nvidia",
    label: "NVIDIA · Nemotron Nano 12B",
    hint: "Fast",
    description: "Small Nemotron via NIM (chat/completions).",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "nvidia/nemotron-nano-21b-v2",
    provider: "nvidia",
    label: "NVIDIA · Nemotron Nano 21B",
    hint: "Balanced",
    description: "Mid Nemotron via NIM (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "nvidia/llama-3.3-nemotron-super-49b-v1",
    provider: "nvidia",
    label: "NVIDIA · Llama Nemotron Super 49B",
    hint: "Flagship",
    description: "Flagship Nemotron via NIM (chat/completions).",
    capabilities: { intelligence: 5, speed: 3, cost: 2 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    provider: "nvidia",
    label: "NVIDIA · Nemotron Ultra 253B",
    hint: "Max",
    description: "Largest Nemotron via NIM (chat/completions).",
    capabilities: { intelligence: 5, speed: 2, cost: 1 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "nvidia/deepseek-v3-2",
    provider: "nvidia",
    label: "NVIDIA · DeepSeek V3.2",
    hint: "Best",
    description: "DeepSeek via NIM (chat/completions).",
    capabilities: { intelligence: 5, speed: 3, cost: 3 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "nvidia/glm-4.7",
    provider: "nvidia",
    label: "NVIDIA · GLM 4.7",
    hint: "Balanced",
    description: "GLM via NIM (chat/completions).",
    capabilities: { intelligence: 4, speed: 4, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "nvidia/gpt-oss-120b",
    provider: "nvidia",
    label: "NVIDIA · GPT-OSS 120B",
    hint: "Ultra-fast",
    description: "GPT-OSS on NIM silicon (chat/completions).",
    capabilities: { intelligence: 4, speed: 5, cost: 4 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "nvidia/gpt-oss-20b",
    provider: "nvidia",
    label: "NVIDIA · GPT-OSS 20B",
    hint: "Fastest",
    description: "Tiny GPT-OSS via NIM (chat/completions).",
    capabilities: { intelligence: 3, speed: 5, cost: 5 },
    tags: ["tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "nvidia/qwen3-235b",
    provider: "nvidia",
    label: "NVIDIA · Qwen3 235B",
    hint: "Flagship",
    description: "Qwen3 via NIM (chat/completions).",
    capabilities: { intelligence: 5, speed: 3, cost: 2 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "openai-compatible",
  },
  {
    id: "nvidia/mistral-nemotron-ultra-235b",
    provider: "nvidia",
    label: "NVIDIA · Mistral Nemotron Ultra 235B",
    hint: "Max",
    description: "Mistral Nemotron via NIM (chat/completions).",
    capabilities: { intelligence: 5, speed: 2, cost: 1 },
    tags: ["reasoning", "tools", "coding"],
    apiStyle: "openai-compatible",
  },
] as const satisfies readonly ModelInfo[];

export type ModelId = (typeof MODELS)[number]["id"];

export function getCompatModelInfo(
  modelId: string,
  endpoints: readonly CustomEndpoint[],
): ModelInfo {
  const eid = endpointIdFromCompatModel(modelId);
  const ep = endpoints.find((e) => e.id === eid);
  const name = ep?.name || "Custom endpoint";
  return {
    id: modelId,
    provider: "openai-compatible",
    label: ep?.modelId || name,
    hint: name,
    description: ep ? `${name} — ${ep.baseURL}` : "Custom OpenAI-compatible endpoint",
    capabilities: { intelligence: 3, speed: 3, cost: 3 },
  };
}

export function resolveModel(
  modelId: string,
  endpoints: readonly CustomEndpoint[] = [],
): ModelInfo {
  if (isCompatModelId(modelId)) return getCompatModelInfo(modelId, endpoints);
  const m = MODELS.find((x) => x.id === modelId);
  if (m) return m;
  const dyn = getDynamicModelInfo(modelId);
  if (dyn) return dyn;
  throw new Error(`Unknown model: ${modelId}`);
}

export function getModel(id: ModelId): ModelInfo {
  const m = MODELS.find((x) => x.id === id);
  if (m) return m;
  const dyn = getDynamicModelInfo(id);
  if (dyn) return dyn;
  throw new Error(`Unknown model: ${id}`);
}

export function isKnownModelId(id: string): id is ModelId {
  return (
    MODELS.some((x) => x.id === id) ||
    isDynamicModelId(id)
  );
}

export function isDynamicModelId(id: string): boolean {
  return !!getDynamicModelInfo(id);
}

const FREEFORM_PROVIDERS: ReadonlySet<ProviderId> = new Set([
  "openrouter",
  "openai-compatible",
  "lmstudio",
  "mlx",
  "ollama",
]);

// Reasoning models reject tool-call turns whose reasoning was stripped; keep it.
export function modelKeepsReasoning(m: ModelInfo): boolean {
  return (m.tags?.includes("reasoning") ?? false) || FREEFORM_PROVIDERS.has(m.provider);
}

export const DEFAULT_MODEL_ID: ModelId = "gpt-5.4-mini";

/** Approximate context window (in tokens) per model. Used for the
 *  context-usage indicator in the AI mini-window header. Conservative
 *  estimates — actual provider limits may shift. */
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  "gpt-5.5": 1_050_000,
  "gpt-5.5-pro": 1_050_000,
  "gpt-5.4-mini": 400_000,
  "gpt-5.4-nano": 400_000,
  "gpt-5.3-codex": 400_000,
  "gpt-4.1-mini": 128_000,
  "claude-opus-4-7": 200_000,
  "claude-opus-4-8": 1_000_000,
  "claude-sonnet-4-6": 200_000,
  "claude-haiku-4-5": 200_000,
  "claude-opus-4-6": 200_000,
  "gemini-3.5-flash": 1_000_000,
  "gemini-3.1-flash-lite": 1_000_000,
  "gemini-3.1-pro-preview": 1_000_000,
  "gemini-3-flash-preview": 1_000_000,
  "gemini-2.5-pro": 1_000_000,
  "gemini-2.5-flash": 1_000_000,
  "grok-4.20-reasoning": 2_000_000,
  "grok-4.20-non-reasoning": 2_000_000,
  "grok-4-fast-reasoning": 2_000_000,
  "grok-4.3": 1_000_000,
  "grok-build-0.1": 256_000,
  "deepseek-v4-pro": 1_000_000,
  "deepseek-v4-flash": 1_000_000,
  "deepseek-reasoner": 128_000,
  "gpt-oss-120b": 128_000,
  "llama3.3-70b": 128_000,
  "qwen-3-32b": 32_000,
  "openai/gpt-oss-20b": 128_000,
  "llama-3.3-70b-versatile": 128_000,
  "deepseek-r1-distill-llama-70b": 128_000,
  "openrouter-custom": 256_000,
  "openai-compatible-custom": 128_000,
  "lmstudio-local": 32_000,
  "mlx-local": 32_000,
  "ollama-local": 32_000,
  "mistral-large-latest": 131_072,
  "mistral-medium-latest": 32_768,
  "codestral-latest": 256_000,
  "zen/gpt-5.5": 400_000,
  "zen/gpt-5.5-pro": 400_000,
  "zen/gpt-5.4-mini": 400_000,
  "zen/gpt-5.4-nano": 1_000_000,
  "zen/gpt-5.3-codex": 400_000,
  "zen/gpt-4.1-mini": 1_000_000,
  "zen/claude-opus-4-8": 1_000_000,
  "zen/claude-opus-4-7": 1_000_000,
  "zen/claude-sonnet-4-6": 1_000_000,
  "zen/claude-haiku-4-5": 1_000_000,
  "zen/claude-opus-4-6": 1_000_000,
  "zen/gemini-3.5-flash": 2_000_000,
  "zen/gemini-3.1-flash-lite": 2_000_000,
  "zen/gemini-3.1-pro-preview": 2_000_000,
  "zen/gemini-3-flash-preview": 2_000_000,
  "zen/gemini-2.5-pro": 1_000_000,
  "zen/gemini-2.5-flash": 1_000_000,
  "zen/deepseek-v4-pro": 1_000_000,
  "zen/deepseek-v4-flash": 1_000_000,
  "zen/deepseek-reasoner": 128_000,
  "zen/minimax-m2.7": 256_000,
  "zen/minimax-m2.5": 256_000,
  "zen/qwen3.7-max": 256_000,
  "zen/qwen3.7-plus": 256_000,
  "zen/qwen3.6-plus": 256_000,
  "zen/glm-4.7-flash": 256_000,
  "zen/glm-4.6": 256_000,
  "zen/kimi-k2.6": 256_000,
  "zen/kimi-k2.5": 256_000,
  "zen/grok-4.20": 256_000,
  "zen/big-pickle-2.5": 32_000,
  "zen/best-pickle-2.5": 32_000,
  "zen/mimo-1.7b": 32_000,
  "go/glm-4.7-flash": 256_000,
  "go/glm-4.6": 256_000,
  "go/kimi-k2.7-code": 256_000,
  "go/kimi-k2.6": 256_000,
  "go/deepseek-v4-pro": 1_000_000,
  "go/deepseek-v4-flash": 1_000_000,
  "go/mimo-1.7b": 32_000,
  "go/minimax-m3": 256_000,
  "go/minimax-m2.7": 256_000,
  "go/minimax-m2.5": 256_000,
  "go/qwen3.7-max": 256_000,
  "go/qwen3.7-plus": 256_000,
  "go/qwen3.6-plus": 256_000,
  "nvidia/nemotron-nano-9b-v2": 128_000,
  "nvidia/nemotron-nano-12b-v2": 128_000,
  "nvidia/nemotron-nano-21b-v2": 128_000,
  "nvidia/llama-3.3-nemotron-super-49b-v1": 128_000,
  "nvidia/llama-3.1-nemotron-ultra-253b-v1": 128_000,
  "nvidia/deepseek-v3-2": 128_000,
  "nvidia/glm-4.7": 128_000,
  "nvidia/gpt-oss-120b": 128_000,
  "nvidia/gpt-oss-20b": 128_000,
  "nvidia/qwen3-235b": 128_000,
  "nvidia/mistral-nemotron-ultra-235b": 128_000,
};

export function getModelContextLimit(
  modelId: string | undefined,
  compatOverride?: number,
): number {
  if (!modelId) return 128_000;
  if (isCompatModelId(modelId)) return compatOverride ?? 128_000;
  if (modelId === "openai-compatible-custom" && compatOverride)
    return compatOverride;
  return MODEL_CONTEXT_LIMITS[modelId] ?? 128_000;
}

export type ModelPricing = {
  input: number;
  output: number;
  cacheRead?: number;
};

export const MODEL_PRICING: Record<string, ModelPricing> = {
  "gpt-5.5": { input: 5, output: 15, cacheRead: 0.5 },
  "gpt-5.5-pro": { input: 30, output: 180 },
  "gpt-5.4-mini": { input: 0.4, output: 1.6, cacheRead: 0.04 },
  "gpt-5.4-nano": { input: 0.1, output: 0.4, cacheRead: 0.01 },
  "gpt-5.3-codex": { input: 1.5, output: 6, cacheRead: 0.15 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6, cacheRead: 0.1 },
  "claude-opus-4-7": { input: 15, output: 75, cacheRead: 1.5 },
  "claude-opus-4-8": { input: 5, output: 25, cacheRead: 0.5 },
  "claude-opus-4-6": { input: 15, output: 75, cacheRead: 1.5 },
  "claude-sonnet-4-6": { input: 3, output: 15, cacheRead: 0.3 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheRead: 0.1 },
  "gemini-3.5-flash": { input: 0.3, output: 2.5, cacheRead: 0.075 },
  "gemini-3.1-flash-lite": { input: 0.075, output: 0.3, cacheRead: 0.015 },
  "gemini-3.1-pro-preview": { input: 1.25, output: 10, cacheRead: 0.31 },
  "gemini-3-flash-preview": { input: 0.3, output: 2.5, cacheRead: 0.075 },
  "gemini-2.5-pro": { input: 1.25, output: 10, cacheRead: 0.31 },
  "gemini-2.5-flash": { input: 0.3, output: 2.5, cacheRead: 0.075 },
  "grok-4.20-reasoning": { input: 3, output: 15 },
  "grok-4.20-non-reasoning": { input: 1, output: 5 },
  "grok-4-fast-reasoning": { input: 0.2, output: 0.5 },
  "grok-4.3": { input: 1.25, output: 2.5 },
  "grok-build-0.1": { input: 1, output: 2 },
  "deepseek-v4-pro": { input: 0.28, output: 1.1, cacheRead: 0.028 },
  "deepseek-v4-flash": { input: 0.07, output: 0.27, cacheRead: 0.007 },
  "deepseek-reasoner": { input: 0.55, output: 2.19, cacheRead: 0.14 },
};

export function estimateCost(
  modelId: string | undefined,
  usage: { inputTokens: number; outputTokens: number; cachedInputTokens: number },
): number | null {
  if (!modelId) return null;
  const p = MODEL_PRICING[modelId];
  if (!p) return null;
  const fresh = Math.max(0, usage.inputTokens - usage.cachedInputTokens);
  const cached = usage.cachedInputTokens;
  return (
    (fresh * p.input + cached * (p.cacheRead ?? p.input) + usage.outputTokens * p.output) /
    1_000_000
  );
}

/** Providers that do not require an API key (local servers, key-optional). */
export const KEYLESS_PROVIDERS: readonly ProviderId[] = [
  "lmstudio",
  "mlx",
  "ollama",
  "openai-compatible",
] as const;

export function providerNeedsKey(id: ProviderId): boolean {
  return !KEYLESS_PROVIDERS.includes(id);
}

/** True when the provider is a cloud service that demands an API key.
 *  keyOptional providers (e.g. opencode-zen) return false — they are
 *  usable on the free tier without one. */
export function providerRequiresKey(id: ProviderId): boolean {
  return providerNeedsKey(id) && !getProvider(id).keyOptional;
}

/** True for providers that accept an API key — required *or* optional.
 *  Used by Settings to decide whether to render a key card at all. */
export function providerSupportsKey(id: ProviderId): boolean {
  if (providerNeedsKey(id)) return true;
  const p = getProvider(id);
  return !!p.keyOptional;
}

/** Any provider can power the editor's inline autocomplete; latency is the
 *  user's choice. The picker filters down to fast tiers in the UI. */
export type AutocompleteProviderId = ProviderId;

/** Sensible default model id per provider for inline autocomplete. */
export const DEFAULT_AUTOCOMPLETE_MODEL: Partial<Record<ProviderId, string>> = {
  cerebras: "gpt-oss-120b",
  groq: "openai/gpt-oss-20b",
  lmstudio: "qwen2.5-coder-7b-instruct",
  openai: "gpt-5.4-nano",
  anthropic: "claude-haiku-4-5",
  google: "gemini-2.5-flash",
  xai: "grok-4.3",
  deepseek: "deepseek-v4-flash",
  openrouter: "openai/gpt-5.4-mini",
  "openai-compatible": "",
  "opencode-zen": "zen/gpt-5.4-nano",
  "opencode-go": "go/deepseek-v4-flash",
  nvidia: "nvidia/nemotron-nano-12b-v2",
};

/** Curated list of fast models suitable for inline completion (speed ≥ 4). */
export function getAutocompleteEligibleModels(): readonly ModelInfo[] {
  return MODELS.filter(
    (m) => m.capabilities.speed >= 4 && m.id !== "openai-compatible-custom",
  );
}

export type SttProvider = "openai" | "groq" | "whispercpp";

export const STT_PROVIDER_LABELS: Record<SttProvider, string> = {
  openai: "OpenAI Whisper",
  groq: "Groq Whisper",
  whispercpp: "Whisper.cpp (local)",
};

export const DEFAULT_STT_PROVIDER: SttProvider = "openai";
export const WHISPERCPP_DEFAULT_BASE_URL = "http://127.0.0.1:8080";
export const LMSTUDIO_DEFAULT_BASE_URL = "http://localhost:1234/v1";
export const MLX_DEFAULT_BASE_URL = "http://127.0.0.1:8080/v1";
export const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434/v1";
export const OPENAI_COMPATIBLE_DEFAULT_BASE_URL = "";
export const MAX_AGENT_STEPS = 24;
export const TERMINAL_BUFFER_LINES = 300;

export const SYSTEM_PROMPT = `You are Terax, an AI agent embedded in a developer terminal emulator. You are a hands-on engineer, not a chat bot — your job is to *do* the work, not narrate it.

# Environment
Every turn carries a short <env> block (prepended to the latest user message): workspace_root, active_terminal_cwd, optionally active_file. Treat it as ground truth — never ask the user where they are. The terminal scrollback is NOT auto-injected; call get_terminal_output only when the user references "this error" / "the last command" or you genuinely need to interpret recent output.

# Operating principles (CRITICAL — read these)
- **Execute, don't echo.** When the user asks you to create, write, fix, or edit something, go straight to the tool call. Do NOT print the proposed file content in chat first and then ask "should I write this?" — the approval card IS the confirmation. Echoing the body twice (once in prose, once in the tool call) wastes tokens and breaks the user's flow.
- **Chain actions until done.** A real task is usually: read context → understand → make the change → verify. Run the full chain in one turn. Don't stop after a single read to summarize and wait — keep going.
- **Ask only when genuinely stuck.** Ask one short question when the path/scope is ambiguous AND guessing wrong would be costly to undo. Don't ask for trivial confirmations (filename, indentation style, "should I proceed?"). For low-cost reversible defaults, just pick one and proceed.
- **Investigate before guessing.** If you don't know where something lives, grep/glob for it — don't speculate. Verify assumptions with reads instead of asking the user.
- **Match scope to the request.** A bug fix is a bug fix, not a refactor. Don't add unrequested cleanups, comments, or "while we're here" improvements.

# Tools
- Read: read_file, list_directory, grep, glob, get_terminal_output
- Mutate (approval required): edit, multi_edit, write_file, create_directory, bash_run, bash_background
- Background process IO: bash_logs, bash_list, bash_kill
- Plan / delegation: todo_write, run_subagent
- Side-channel: suggest_command, open_preview

# Tool budget
- Don't re-read a file you read earlier this session unless you wrote to it; read_file returns {unchanged: true} and you pay the round-trip for nothing.
- One focused grep beats three list_directory calls. grep for "where is X?", glob for "what files match path Y?", list_directory for "show me this folder".
- read_file defaults to the first 25KB / 2000 lines. Use offset/limit to page large files — don't pull the whole thing if you only need one function.
- Before five or more tool calls in a row, drop a one-line plan via todo_write so the user can see your trajectory. Skip for single-step asks.

# Editing
- Prefer edit (single exact-string replace) or multi_edit (atomic batch on one file). Both require a prior read_file on the path in this session.
- old_string must be unique in the file unless replace_all: true. If it's not, expand context until it is — don't lower your standard.
- write_file is for brand-new files or full replacement of tiny ones. Never use it as a proxy for a targeted change.
- Don't add comments unless the WHY is non-obvious. Don't add file-headers. Don't restate what the code says.

# Path resolution
- Bare filenames resolve against active_terminal_cwd, not workspace_root. Never write to /notes.md.
- "create X" with no path → active_terminal_cwd, else workspace_root. Pick and proceed; don't ask.
- "edit/fix this file" with no path → active_file when present.
- Before write_file or create_directory in a fresh subtree, list_directory the parent to confirm it exists.

# Shell
- bash_run for short-lived commands needed for the task (lint, test, search, install). cwd persists across calls in the session shell. Never run interactive tools (vim, less, top) or dev servers/watchers via bash_run — they hang.
- bash_background for dev servers, watchers, log tailers. Read output via bash_logs, terminate via bash_kill.
- BEFORE spawning any dev server (pnpm dev, next dev, vite, cargo watch, ...) call bash_list. If a matching command is running, do NOT respawn — reuse it: open_preview to surface the page and tell the user it's already running. Only restart on explicit user request (bash_kill the old handle first).
- After editing files in a project whose dev server is already up, just say "should hot-reload" — don't respawn.
- suggest_command when the answer IS a single shell command for the user to insert. Don't also paste it in prose.

# Output style
- Terse. No filler, no apologies, no restating the question, no "Sure!" / "I'll go ahead and...".
- State the *why* in one short sentence right before a mutation tool call. Not a paragraph.
- After the work is done, one or two sentences: what changed, what's next (if anything). Don't recap the diff — the user can see it.
- Code blocks always carry a language fence.
- Refused reads on sensitive files (.env, .ssh, credentials) are final — don't retry.`;

export const SYSTEM_PROMPT_LITE = `You are Terax, an AI agent in a developer terminal. Each turn carries an <env> block (workspace_root, active_terminal_cwd, optional active_file) prepended to the user's message — treat as ground truth.

Tools: read_file, list_directory, grep, glob, get_terminal_output, edit, multi_edit, write_file, create_directory, bash_run, bash_background, bash_logs, bash_list, bash_kill, suggest_command, open_preview.

Rules:
- Execute, don't echo. When asked to create/fix/edit a file, go straight to the tool call. The approval card is the confirmation; don't print the file content in chat first.
- Chain actions: read → understand → change → verify in one turn. Don't stop mid-task to ask trivial confirmations.
- Ask only when genuinely ambiguous and a wrong guess is costly. Otherwise pick a reasonable default and proceed.
- Bare filenames resolve to active_terminal_cwd, not workspace_root.
- Prefer grep over scanning many files; read_file defaults to 25KB / 2000 lines (use offset/limit for larger).
- edit/multi_edit need a prior read_file on the path. write_file for new/tiny files only.
- bash_list before any dev server; reuse if already running.
- Concise. No filler, no recap of the diff.`;

const LITE_SYSTEM_PROMPT_MODEL_IDS = new Set<string>([
  "gpt-5.4-nano",
  "gpt-4.1-mini",
  "claude-haiku-4-5",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
  "deepseek-v4-flash",
  "gpt-oss-120b",
  "openai/gpt-oss-20b",
  "llama3.3-70b",
  "llama-3.3-70b-versatile",
  "qwen-3-32b",
  "grok-build-0.1",
]);

export function selectSystemPrompt(modelId: string | undefined): string {
  if (modelId && LITE_SYSTEM_PROMPT_MODEL_IDS.has(modelId)) {
    return SYSTEM_PROMPT_LITE;
  }
  return SYSTEM_PROMPT;
}
