import { MetricDefinition, Commit, MetricSuggestion, AgentActivity, McpSessionLog } from './types';

export const INITIAL_METRICS: MetricDefinition[] = [
  {
    id: 'api-feed-latency',
    name: 'GET /api/v1/items Latency',
    category: 'performance',
    description: 'P95 latency of the core feed retrieval endpoint under standard load simulation.',
    direction: 'minimize',
    unit: 'ms',
    currentVal: 94.2,
    previousVal: 152.0,
    targetVal: 80.0,
    enabledForAgent: true,
    codeSnippet: `import { lodestar, metrics } from '@lodestar/sdk';

export const feedLatency = metrics.performance({
  name: 'GET /api/v1/items Latency',
  direction: 'minimize',
  unit: 'ms',
  guardrails: {
    maxAbsolute: 180,
    regressionAllowancePercent: 2.5
  }
});

// Record inside express route handler
app.get('/api/v1/items', async (req, res) => {
  const timer = feedLatency.startTimer();
  const data = await fetchFeedFromDb();
  res.json(data);
  timer.observe();
});`,
    history: [
      { commitHash: 'c7a8f1b', value: 168.4 },
      { commitHash: 'a3d4f82', value: 162.1 },
      { commitHash: 'b5e6f98', value: 153.2 },
      { commitHash: 'df84a0c', value: 152.0 }, // The spike commit!
      { commitHash: 'e3f1c9d', value: 94.2 },  // The Agent fix commit!
    ]
  },
  {
    id: 'bundle-size-main',
    name: 'main.js Bundle Size',
    category: 'size',
    description: 'Production Javascript bundle size after treeshaking and gzip compression.',
    direction: 'minimize',
    unit: 'KB',
    currentVal: 184.2,
    previousVal: 182.1,
    targetVal: 150.0,
    enabledForAgent: false,
    codeSnippet: `import { metrics } from '@lodestar/sdk';

// Triggered during production build hooks
export const mainBundleSize = metrics.size({
  name: 'main.js Bundle Size',
  direction: 'minimize',
  unit: 'KB',
  sourcePath: './dist/assets/main-*.js'
});`,
    history: [
      { commitHash: 'c7a8f1b', value: 142.1 },
      { commitHash: 'a3d4f82', value: 144.5 },
      { commitHash: 'b5e6f98', value: 145.0 },
      { commitHash: 'df84a0c', value: 182.1 }, // spiked due to large import
      { commitHash: 'e3f1c9d', value: 184.2 },
    ]
  },
  {
    id: 'test-coverage',
    name: 'Overall Code Coverage',
    category: 'quality',
    description: 'Line-by-line coverage percentage across unit, integration, and e2e test suites.',
    direction: 'maximize',
    unit: '%',
    currentVal: 88.5,
    previousVal: 88.4,
    targetVal: 95.0,
    enabledForAgent: false,
    codeSnippet: `import { metrics } from '@lodestar/sdk';

// Automated Vitest / Jest coverage ingestion
export const testCoverage = metrics.quality({
  name: 'Overall Code Coverage',
  direction: 'maximize',
  unit: '%',
  importer: 'vitest-json'
});`,
    history: [
      { commitHash: 'c7a8f1b', value: 89.1 },
      { commitHash: 'a3d4f82', value: 88.2 },
      { commitHash: 'b5e6f98', value: 88.4 },
      { commitHash: 'df84a0c', value: 88.4 },
      { commitHash: 'e3f1c9d', value: 88.5 },
    ]
  },
  {
    id: 'db-pool-exhaustion',
    name: 'DB Connection Wait Time',
    category: 'performance',
    description: 'Average milliseconds queue time spent waiting for an available DB connection.',
    direction: 'minimize',
    unit: 'ms',
    currentVal: 4.8,
    previousVal: 12.3,
    targetVal: 5.0,
    enabledForAgent: true,
    codeSnippet: `import { metrics } from '@lodestar/sdk';

export const dbPoolWait = metrics.custom({
  name: 'DB Connection Wait Time',
  direction: 'minimize',
  unit: 'ms'
});

dbPool.on('acquire_wait', (ms) => {
  dbPoolWait.record(ms);
});`,
    history: [
      { commitHash: 'c7a8f1b', value: 14.1 },
      { commitHash: 'a3d4f82', value: 13.2 },
      { commitHash: 'b5e6f98', value: 12.9 },
      { commitHash: 'df84a0c', value: 12.3 },
      { commitHash: 'e3f1c9d', value: 4.8 }, // Agent optimized connection pooling!
    ]
  },
  {
    id: 'cache-hit-rate',
    name: 'Redis Cache Hit Rate',
    category: 'performance',
    description: 'Ratio of cache hits versus total queries processed by the key-value cache layer.',
    direction: 'maximize',
    unit: '%',
    currentVal: 91.2,
    previousVal: 74.5,
    targetVal: 95.0,
    enabledForAgent: true,
    codeSnippet: `import { metrics } from '@lodestar/sdk';

export const cacheRate = metrics.custom({
  name: 'Redis Cache Hit Rate',
  direction: 'maximize',
  unit: '%'
});

// In Redis manager logic
cacheRate.record((hits / (hits + misses)) * 100);`,
    history: [
      { commitHash: 'c7a8f1b', value: 72.1 },
      { commitHash: 'a3d4f82', value: 73.4 },
      { commitHash: 'b5e6f98', value: 74.8 },
      { commitHash: 'df84a0c', value: 74.5 },
      { commitHash: 'e3f1c9d', value: 91.2 }, // Agent added caching to critical path!
    ]
  },
  {
    id: 'llm-inference-cost',
    name: 'LLM Cost per 1K Generations',
    category: 'cost',
    description: 'Aggregated monetary API token cost incurred for every thousand customer requests.',
    direction: 'minimize',
    unit: 'USD',
    currentVal: 0.048,
    previousVal: 0.072,
    targetVal: 0.030,
    enabledForAgent: true,
    codeSnippet: `import { metrics } from '@lodestar/sdk';

export const costPer1K = metrics.cost({
  name: 'LLM Cost per 1K Generations',
  direction: 'minimize',
  unit: 'USD'
});

// Recorded whenever OpenAI/Gemini answers are generated
costPer1K.record((inputTokens * 0.00015) + (outputTokens * 0.0006));`,
    history: [
      { commitHash: 'c7a8f1b', value: 0.078 },
      { commitHash: 'a3d4f82', value: 0.074 },
      { commitHash: 'b5e6f98', value: 0.072 },
      { commitHash: 'df84a0c', value: 0.072 },
      { commitHash: 'e3f1c9d', value: 0.048 }, // Agent optimized LLM calls (cached or smaller prompt)
    ]
  }
];

export const GIT_COMMITS: Commit[] = [
  {
    hash: 'e3f1c9d2a09f3e46b14d24a6e5b6c7a8d9f0e1a2',
    shortHash: 'e3f1c9d',
    branch: 'main',
    author: 'Lodestar Autonomous Optimizer',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80',
    date: '2026-05-31 16:42',
    message: '🤖 [Lodestar AI] optimize: implement async memoized indexing on items feed & pool connections',
    metrics: {
      'api-feed-latency': 94.2,
      'bundle-size-main': 184.2,
      'test-coverage': 88.5,
      'db-pool-exhaustion': 4.8,
      'cache-hit-rate': 91.2,
      'llm-inference-cost': 0.048
    },
    regressions: []
  },
  {
    hash: 'd1e8c7a8a09f3e46b14d24a6e5b6c7a8d9f0e1a2',
    shortHash: 'd1e8c7a',
    branch: 'feature/llm-optimization',
    author: 'Marcus Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
    date: '2026-05-31 15:10',
    message: 'feat: optimize LLM request parameters by compressing visual frames & system prompt layout',
    metrics: {
      'api-feed-latency': 148.2,
      'bundle-size-main': 182.1,
      'test-coverage': 88.4,
      'db-pool-exhaustion': 12.3,
      'cache-hit-rate': 74.5,
      'llm-inference-cost': 0.032
    }
  },
  {
    hash: 'df84a0c11be3092f3de1f8d4e9b8c0a3f5d2b7c1',
    shortHash: 'df84a0c',
    branch: 'main',
    author: 'Alex Rivera',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
    date: '2026-05-31 12:15',
    message: 'feat: overhaul user recommendation carousel and add high-res image previews',
    metrics: {
      'api-feed-latency': 152.0,
      'bundle-size-main': 182.1,
      'test-coverage': 88.4,
      'db-pool-exhaustion': 12.3,
      'cache-hit-rate': 74.5,
      'llm-inference-cost': 0.072
    },
    regressions: [
      { metricId: 'api-feed-latency', delta: 57.8, rawDelta: '+57.8ms (+61.3%)' },
      { metricId: 'bundle-size-main', delta: 37.1, rawDelta: '+37.1KB (+25.5%)' },
      { metricId: 'db-pool-exhaustion', delta: -0.6, rawDelta: '-0.6ms (-4.6%)' }
    ]
  },
  {
    hash: 'b5e6f9872e6c5d1a8f9b0c2e3d4f5a6b7c8d9e0f',
    shortHash: 'b5e6f98',
    branch: 'feature/carousel-v2',
    author: 'Alex Rivera',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80',
    date: '2026-05-30 18:30',
    message: 'refactor: split react-slick vendor chunk out from runtime bundle helpers',
    metrics: {
      'api-feed-latency': 153.2,
      'bundle-size-main': 145.0,
      'test-coverage': 88.4,
      'db-pool-exhaustion': 12.9,
      'cache-hit-rate': 74.8,
      'llm-inference-cost': 0.072
    }
  },
  {
    hash: 'f2a7db53a09f3e46b14d24a6e5b6c7a8d9f0e1a2',
    shortHash: 'f2a7db5',
    branch: 'feature/redis-pooling',
    author: 'Sarah Jenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    date: '2026-05-30 14:20',
    message: 'perf: implement connection pooling using generic pool wrapper under high concurrent load',
    metrics: {
      'api-feed-latency': 158.4,
      'bundle-size-main': 146.2,
      'test-coverage': 88.5,
      'db-pool-exhaustion': 4.1,
      'cache-hit-rate': 74.0,
      'llm-inference-cost': 0.074
    }
  },
  {
    hash: 'a3d4f826e7b5c1d3e8f9a0c2b4d6e8f0a2c4e6f8',
    shortHash: 'a3d4f82',
    branch: 'main',
    author: 'Sarah Jenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80',
    date: '2026-05-30 09:12',
    message: 'fix: handle redis query connection timeout exceptions gracefully inside auth guard',
    metrics: {
      'api-feed-latency': 162.1,
      'bundle-size-main': 144.5,
      'test-coverage': 88.2,
      'db-pool-exhaustion': 13.2,
      'cache-hit-rate': 73.4,
      'llm-inference-cost': 0.074
    }
  },
  {
    hash: 'c7a8f1b5e3f2g1h0j2k4l6m8n0p2q4r6s8t0u2v4',
    shortHash: 'c7a8f1b',
    branch: 'main',
    author: 'Marcus Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80',
    date: '2026-05-29 15:40',
    message: 'perf: rewrite feed sql join using index scan and materialized view hooks',
    metrics: {
      'api-feed-latency': 168.4,
      'bundle-size-main': 142.1,
      'test-coverage': 89.1,
      'db-pool-exhaustion': 14.1,
      'cache-hit-rate': 72.1,
      'llm-inference-cost': 0.078
    }
  }
];

export const INITIAL_SUGGESTIONS: MetricSuggestion[] = [
  {
    id: 'sugg-prisma-queries',
    name: 'Prisma DB Raw Queries Time',
    category: 'performance',
    description: 'Track the cumulative execution duration of unindexed Postgres queries run through Prisma Client.',
    rationale: 'Your codebase has 12 distinct uncooked prisma.$queryRaw invocations across src/db/ which are highly prone to scaling degradation.',
    direction: 'minimize',
    unit: 'ms',
    codeSnippet: `import { metrics } from '@lodestar/sdk';

export const prismaQueryTime = metrics.custom({
  name: 'Prisma Raw Query Duration',
  direction: 'minimize',
  unit: 'ms'
});

prisma.$use(async (params, next) => {
  const before = performance.now();
  const result = await next(params);
  if (params.action.includes('raw')) {
    prismaQueryTime.record(performance.now() - before);
  }
  return result;
});`,
    status: 'pending'
  },
  {
    id: 'sugg-openai-cost',
    name: 'Gemini Text Generation Cost',
    category: 'cost',
    description: 'Calculates the real-time monetary cost of Gemini API completions inside agent loops.',
    rationale: 'We found imports of @google/genai inside 4 server files. Monitoring token consumption helps set spend alerts.',
    direction: 'minimize',
    unit: 'USD',
    codeSnippet: `import { metrics } from '@lodestar/sdk';

export const geminiCost = metrics.cost({
  name: 'Gemini Input/Output Cost',
  direction: 'minimize',
  unit: 'USD'
});

// Capture tokens inside standard completion wrappers
geminiCost.record((inputTokens * 0.000075) + (outputTokens * 0.0003));`,
    status: 'pending'
  },
  {
    id: 'sugg-cls',
    name: 'Cumulative Layout Shift (CLS)',
    category: 'quality',
    description: 'Core Web Vital measuring the visual stability of client routes during content hydrate.',
    rationale: 'The bundle size is growing and some components are rendered dynamically, which could cause visual jumps for 3G clients.',
    direction: 'minimize',
    unit: 'cls',
    codeSnippet: `import { metrics } from '@lodestar/sdk';

// Automatically pipe Web-Vitals directly over to the dashboard
metrics.webVitals.on('CLS', (shiftVal) => {
  metrics.record('Cumulative Layout Shift', shiftVal);
});`,
    status: 'pending'
  },
  {
    id: 'sugg-mem-growth',
    name: 'Node heapUsed Growth Rate',
    category: 'performance',
    description: 'Tracks the average memory leak vector by sampling Node process RSS delta over persistent HTTP routines.',
    rationale: 'A long-running express server was detected in server.ts. Tracking process health safeguards against Docker OOM restarts.',
    direction: 'minimize',
    unit: 'MB/hr',
    codeSnippet: `import { metrics } from '@lodestar/sdk';

const memUsage = metrics.custom({
  name: 'Heap Growth Rate',
  direction: 'minimize',
  unit: 'MB/hr'
});

let prevHeap = process.memoryUsage().heapUsed;
setInterval(() => {
  const currHeap = process.memoryUsage().heapUsed;
  const growth = Math.max(0, (currHeap - prevHeap) / (1024 * 1024));
  memUsage.record(growth);
  prevHeap = currHeap;
}, 3600000);`,
    status: 'pending'
  }
];

export const INITIAL_AGENT_ACTIVITIES: AgentActivity[] = [
  {
    id: 'act-feed',
    timestamp: '2026-05-31 16:10',
    metricId: 'api-feed-latency',
    metricName: 'GET /api/v1/items Latency',
    status: 'idle',
    message: 'Agent finished optimization successfully inside PR #182. Latency improved from 152.0ms to 94.2ms representing a -38.0% regression reversal.',
    logLines: [
      '[16:10:02] [Lodestar AI] Triggered by Regression Warning on commit df84a0c ("feat: overhaul user recommendation carousel")',
      '[16:10:05] [Lodestar AI] Isolated spike source: GET /api/v1/items latency increased by +57.8ms (+61.3%).',
      '[16:11:15] [Lodestar AI] Analyzing git diffs. Found SQL query changes in "src/routes/items.ts" adding expensive sub-queries.',
      '[16:11:42] [Lodestar AI] Spun up sandbox environment branch "lodestar/opt-api-feed-latency".',
      '[16:12:10] [Lodestar AI] Initiating micro-benchmark framework on feed query.',
      '[16:12:55] [Lodestar AI] Hypothesis 1: Caching nested recommendation JSON blocks using Redis key-value stores.',
      '[16:13:30] [Lodestar AI] Implementing Cache wrapper patch inside "src/routes/items.ts".',
      '[16:14:05] [Lodestar AI] Hypothesis 2: Rewriting inefficient nested loops maps into a unified SQL hash table.',
      '[16:14:50] [Lodestar AI] Code patched successfully. Triggering performance baseline integration tests...',
      '[16:15:12] [Lodestar AI] Tests OK. Main suite coverage is stable at 88.5% (no regressions).',
      '[16:15:35] [Lodestar AI] Run micro-benchmarks [1000 requests concurrency=10]:',
      '            - Baseline: 152.0ms P95',
      '            - Experiment: 94.2ms P95 (Target: 80.0ms)',
      '[16:15:55] [Lodestar AI] Experiment verified. Latency shows a -38.0% improvement in performance.',
      '[16:16:12] [Lodestar AI] Creating git commit e3f1c9d ("🤖 [Lodestar AI] optimize: implement async memoized indexing on items feed").',
      '[16:16:15] [Lodestar AI] Lodestar automatically approved pull request #182 on GitHub. Merge verified.'
    ],
    codeDiff: `diff --git a/src/routes/items.ts b/src/routes/items.ts
--- a/src/routes/items.ts
+++ b/src/routes/items.ts
@@ -10,14 +10,23 @@
 app.get('/api/v1/items', async (req, res) => {
   const timer = feedLatency.startTimer();
-  // EXPENSIVE: recalculating carousel for every user without indexes
-  const recommendations = await db.recommendations.findMany({
-    where: { status: 'active' },
-  });
-  const items = await db.items.findMany();
-  const payload = items.map(item => {
-    return {
-      ...item,
-      related: recommendations.filter(r => r.category === item.category)
-    };
-  });
+  
+  // CHIP LEVEL OPTIMIZATION: Memoize filtered recommendations with Redis cache & optimize joins
+  const cacheKey = 'items:v2';
+  let payload = await redis.get(cacheKey);
+  if (!payload) {
+    const recommendations = await db.recommendations.findMany({
+      where: { status: 'active' },
+      select: { id: true, category: true, title: true, rating: true }
+    });
+    const items = await db.items.findMany();
+    payload = items.map(item => ({
+      ...item,
+      related: recommendations.filter(r => r.category === item.category).slice(0, 5)
+    }));
+    await redis.set(cacheKey, JSON.stringify(payload), 'EX', 300); // 5 min cache
+  } else {
+    payload = JSON.parse(payload);
+  }
+
   res.json(payload);
   timer.observe();
-});`,
    improvementStats: {
      metricName: 'GET /api/v1/items Latency',
      before: '152.0ms',
      after: '94.2ms',
      changePercent: '-38.0% ms'
    }
  },
  {
    id: 'act-redis',
    timestamp: '2026-05-31 19:40',
    metricId: 'cache-hit-rate',
    metricName: 'Redis Cache Hit Rate',
    status: 'idle',
    message: 'Finished warm up simulation on sandbox. Branch lodestar/opt-cache-hit-rate has been paused awaiting human guardrail authorization.',
    logLines: [
      '[19:40:02] [Lodestar AI] Starting Autonomous improvement sweep for Redis Cache Hit Rate (defined to Maximize, Current: 74.5%)',
      '[19:40:05] [Lodestar AI] Inspecting code paths in cache system "src/lib/cache.ts".',
      '[19:40:40] [Lodestar AI] Isolated issue: 22.4% of cache misses are generated by inconsistent key casing and timestamp query payloads.',
      '[19:41:15] [Lodestar AI] Created active optimization branch: lodestar/opt-cache-hit-rate.',
      '[19:41:40] [Lodestar AI] Proposal: Implement standard lowercase slug hashing prior to lookup cache key creation.',
      '[19:41:55] [Lodestar AI] Sandbox test suite execution: PASSED.',
      '[19:42:15] [Lodestar AI] Target improvement estimate: Increase hit rate from 74.5% upwards to 91.2% (exceeding target 95.0% threshold).',
      '[19:42:30] [Lodestar AI] Waiting for developer approval due to production write policies.'
    ]
  }
];

export const INITIAL_MCP_LOGS: McpSessionLog[] = [
  {
    timestamp: '2026-05-31 19:55:01',
    direction: 'sys',
    text: 'Client "Cursor AI Agent v2.4" connected to Lodestar MCP Server via stdio.'
  },
  {
    timestamp: '2026-05-31 19:55:02',
    direction: 'in',
    text: 'JSON-RPC: get_tools {}'
  },
  {
    timestamp: '2026-05-31 19:55:02',
    direction: 'out',
    text: 'Result: {\n  "tools": [\n    {\n      "name": "list_metrics",\n      "description": "Get current definitions and latest tracked values of all engineering codebase metrics."\n    },\n    {\n      "name": "get_metric_history",\n      "description": "Retrieve previous commit data values for a specific metric key."\n    },\n    {\n      "name": "record_benchmark",\n      "description": "Trigger an active sandbox run for a locally modified code structure to measure performance impact."\n    }\n  ]\n}'
  },
  {
    timestamp: '2026-05-31 19:55:12',
    direction: 'in',
    text: 'JSON-RPC: call_tool { "name": "list_metrics" }'
  },
  {
    timestamp: '2026-05-31 19:55:13',
    direction: 'out',
    text: 'Result: {\n  "metrics": [\n    { "id": "api-feed-latency", "name": "GET /api/v1/items Latency", "current": 94.2, "unit": "ms", "direction": "minimize" },\n    { "id": "bundle-size-main", "name": "main.js Bundle Size", "current": 184.2, "unit": "KB", "direction": "minimize" },\n    { "id": "test-coverage", "name": "Overall Code Coverage", "current": 88.5, "unit": "%", "direction": "maximize" }\n  ]\n}'
  },
  {
    timestamp: '2026-05-31 19:55:25',
    direction: 'in',
    text: 'JSON-RPC: call_tool { "name": "get_metric_history", "arguments": { "metricId": "api-feed-latency" } }'
  },
  {
    timestamp: '2026-05-31 19:55:26',
    direction: 'out',
    text: 'Result: {\n  "metricId": "api-feed-latency",\n  "history": [\n    { "commit": "c7a8f1b", "value": 168.4 },\n    { "commit": "a3d4f82", "value": 162.1 },\n    { "commit": "b5e6f98", "value": 153.2 },\n    { "commit": "df84a0c", "value": 152.0 },\n    { "commit": "e3f1c9d", "value": 94.2 }\n  ]\n}'
  }
];
