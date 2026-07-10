import { create } from "zustand";

import type { ModelInfo, ProviderApiStyle, ProviderId } from "./config";
import { MODEL_ID_PREFIX } from "./config";

/** Providers whose catalog is fetched live (it rotates / grows over time). */
export type DynamicProviderId = "opencode-zen" | "opencode-go" | "nvidia";

export const DYNAMIC_PROVIDERS: readonly DynamicProviderId[] = [
  "opencode-zen",
  "opencode-go",
  "nvidia",
];

/** Base URL for the OpenAI-compatible `/models` listing of each provider. */
export const DYNAMIC_PROVIDER_BASE_URL: Record<DynamicProviderId, string> = {
  "opencode-zen": "https://api.opencode.ai/zen/v1",
  "opencode-go": "https://api.opencode.ai/go/v1",
  "nvidia": "https://integrate.api.nvidia.com/v1",
};

const DYNAMIC_STORAGE_KEY = "terax.dynamicModels.v1";

type ProviderDynamicState = {
  models: ModelInfo[];
  fetchedAt: number | null;
  loading: boolean;
  error: string | null;
};

type DynamicModelsState = {
  byProvider: Partial<Record<ProviderId, ProviderDynamicState>>;
  refresh: (provider: ProviderId, apiKey: string | null) => Promise<void>;
  getModels: (provider: ProviderId) => ModelInfo[];
  getAll: () => ModelInfo[];
  find: (id: string) => ModelInfo | null;
};

function prefixFor(provider: ProviderId): string {
  return MODEL_ID_PREFIX[provider as keyof typeof MODEL_ID_PREFIX] ?? "";
}

function humanize(rawId: string): string {
  return rawId
    .split(/[-_.]/)
    .map((t) => {
      if (/^\d/.test(t)) return t;
      const up = t.toUpperCase();
      if (["GPT", "NV", "GLM", "QWEN", "KV", "NV"].includes(up)) return up;
      return t.charAt(0).toUpperCase() + t.slice(1);
    })
    .join(" ");
}

/** The wire style a live-fetched model needs, inferred from its id. */
function inferApiStyle(provider: ProviderId, rawId: string): ProviderApiStyle {
  const lower = rawId.toLowerCase();
  if (provider === "nvidia") return "openai-compatible";
  if (lower.startsWith("claude")) return "anthropic";
  if (lower.startsWith("gemini")) return "google";
  if (lower.startsWith("gpt")) return "openai";
  if (provider === "opencode-go" && /^(minimax|qwen)/.test(lower))
    return "anthropic";
  return "openai-compatible";
}

function toModelInfo(provider: ProviderId, rawId: string): ModelInfo {
  const prefix = prefixFor(provider);
  const isFree = /-free$/i.test(rawId);
  return {
    id: `${prefix}${rawId}`,
    provider,
    label: humanize(rawId),
    hint: isFree ? "Free" : "Live",
    description: `Fetched live from ${provider}${isFree ? " (free tier)" : ""}.`,
    capabilities: { intelligence: 3, speed: 3, cost: 5 },
    apiStyle: inferApiStyle(provider, rawId),
  };
}

function loadPersisted(): Partial<Record<ProviderId, ProviderDynamicState>> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(DYNAMIC_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<
      Record<ProviderId, ProviderDynamicState>
    >;
    for (const key of Object.keys(parsed)) {
      parsed[key as ProviderId] = {
        ...(parsed[key as ProviderId] ?? emptyState(key as ProviderId)),
        loading: false,
      };
    }
    return parsed;
  } catch {
    return {};
  }
}

function persist(state: Partial<Record<ProviderId, ProviderDynamicState>>) {
  if (typeof localStorage === "undefined") return;
  try {
    const slim: Partial<Record<ProviderId, ProviderDynamicState>> = {};
    for (const [k, v] of Object.entries(state)) {
      if (v?.models.length) slim[k as ProviderId] = v;
    }
    localStorage.setItem(DYNAMIC_STORAGE_KEY, JSON.stringify(slim));
  } catch {
    /* ignore quota / serialization errors */
  }
}

function emptyState(_provider: ProviderId): ProviderDynamicState {
  return { models: [], fetchedAt: null, loading: false, error: null };
}

export const useDynamicModelsStore = create<DynamicModelsState>(
  (set, get) => ({
    byProvider: loadPersisted(),

    refresh: async (provider, apiKey) => {
      if (!DYNAMIC_PROVIDERS.includes(provider as DynamicProviderId)) return;
      const dyn = provider as DynamicProviderId;
      const base = DYNAMIC_PROVIDER_BASE_URL[dyn];
      set((s) => ({
        byProvider: {
          ...s.byProvider,
          [provider]: {
            ...(s.byProvider[provider] ?? emptyState(provider)),
            loading: true,
            error: null,
          },
        },
      }));
      try {
        const headers: Record<string, string> = { Accept: "application/json" };
        if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
        const res = await fetch(`${base}/models`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as {
          data?: { id: string }[];
          models?: { id: string }[];
        };
        const list = json.data ?? json.models ?? [];
        const models = list
          .map((m) => m.id)
          .filter((id): id is string => typeof id === "string" && id.length > 0)
          .map((rawId) => toModelInfo(provider, rawId));
        const next: ProviderDynamicState = {
          models,
          fetchedAt: Date.now(),
          loading: false,
          error: null,
        };
        set((s) => {
          const byProvider = { ...s.byProvider, [provider]: next };
          persist(byProvider);
          return { byProvider };
        });
      } catch (err) {
        set((s) => ({
          byProvider: {
            ...s.byProvider,
            [provider]: {
              ...(s.byProvider[provider] ?? emptyState(provider)),
              loading: false,
              error: err instanceof Error ? err.message : String(err),
            },
          },
        }));
      }
    },

    getModels: (provider) => get().byProvider[provider]?.models ?? [],

    getAll: () =>
      DYNAMIC_PROVIDERS.flatMap(
        (p) => get().byProvider[p]?.models ?? [],
      ),

    find: (id) => {
      for (const p of DYNAMIC_PROVIDERS) {
        const m = get().byProvider[p]?.models.find((x) => x.id === id);
        if (m) return m;
      }
      return null;
    },
  }),
);

/** Non-React accessor used by config.ts resolution helpers. */
export function getDynamicModelInfo(id: string): ModelInfo | null {
  return useDynamicModelsStore.getState().find(id);
}

export function getAllDynamicModels(): ModelInfo[] {
  return useDynamicModelsStore.getState().getAll();
}
