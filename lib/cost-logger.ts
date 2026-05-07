/**
 * cost-logger.ts
 * Lightweight per-request API cost logger for e2e analysis.
 * Logs to console as structured JSON — visible in `next dev` output and Vercel logs.
 *
 * Usage prices (USD per million tokens) — update if Anthropic changes rates:
 */
const PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-20250514':       { input: 15,  output: 75  }, // deprecated!
  'claude-opus-4':                { input: 15,  output: 75  },
  'claude-opus-4-7':              { input: 5,   output: 25  },
  'claude-opus-4-6':              { input: 5,   output: 25  },
  'claude-opus-4-5':              { input: 5,   output: 25  },
  'claude-sonnet-4-6':            { input: 3,   output: 15  },
  'claude-sonnet-4-5':            { input: 3,   output: 15  },
  'claude-sonnet-4-20250514':     { input: 3,   output: 15  },
  'claude-haiku-4-5':             { input: 1,   output: 5   },
  'claude-haiku-4-5-20251001':    { input: 1,   output: 5   },
};

export interface ApiCallLog {
  ts: string;          // ISO timestamp
  endpoint: string;    // e.g. '/api/generate'
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
  estimatedCostUSD: number;
  durationMs?: number;
  meta?: Record<string, unknown>;
}

function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  cacheReadTokens = 0,
  cacheCreationTokens = 0,
): number {
  const pricing = PRICING[model] ?? { input: 3, output: 15 }; // fallback to Sonnet rates
  const inputCost   = (inputTokens / 1_000_000) * pricing.input;
  const outputCost  = (outputTokens / 1_000_000) * pricing.output;
  // Cache reads cost ~10% of input; cache writes cost ~125% of input
  const cacheReadCost    = (cacheReadTokens / 1_000_000) * pricing.input * 0.1;
  const cacheWriteCost   = (cacheCreationTokens / 1_000_000) * pricing.input * 1.25;
  return inputCost + outputCost + cacheReadCost + cacheWriteCost;
}

export function logApiCall(params: {
  endpoint: string;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_read_input_tokens?: number | null;
    cache_creation_input_tokens?: number | null;
  };
  durationMs?: number;
  meta?: Record<string, unknown>;
}): ApiCallLog {
  const {
    endpoint,
    model,
    usage,
    durationMs,
    meta,
  } = params;

  const inputTokens         = usage.input_tokens ?? 0;
  const outputTokens        = usage.output_tokens ?? 0;
  const cacheReadTokens     = usage.cache_read_input_tokens ?? 0;
  const cacheCreationTokens = usage.cache_creation_input_tokens ?? 0;

  const estimatedCostUSD = estimateCost(
    model,
    inputTokens,
    outputTokens,
    cacheReadTokens,
    cacheCreationTokens,
  );

  const log: ApiCallLog = {
    ts: new Date().toISOString(),
    endpoint,
    model,
    inputTokens,
    outputTokens,
    ...(cacheReadTokens     > 0 && { cacheReadTokens }),
    ...(cacheCreationTokens > 0 && { cacheCreationTokens }),
    estimatedCostUSD: Math.round(estimatedCostUSD * 1_000_000) / 1_000_000, // 6 dp
    ...(durationMs !== undefined && { durationMs }),
    ...(meta && { meta }),
  };

  // Emit as a single parseable JSON line prefixed for easy grep
  console.log(`[API_COST] ${JSON.stringify(log)}`);

  return log;
}
