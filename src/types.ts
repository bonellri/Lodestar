export type MetricDirection = 'minimize' | 'maximize' | 'hold';

export interface MetricDefinition {
  id: string;
  name: string;
  category: 'performance' | 'quality' | 'size' | 'cost' | 'custom';
  description: string;
  direction: MetricDirection;
  unit: string;
  currentVal: number;
  previousVal: number;
  targetVal?: number;
  enabledForAgent: boolean;
  codeSnippet: string;
  history: { commitHash: string; value: number }[];
}

export interface Commit {
  hash: string;
  shortHash: string;
  branch: string;
  author: string;
  avatarUrl: string;
  date: string;
  message: string;
  metrics: Record<string, number>;
  regressions?: { metricId: string; delta: number; rawDelta: string }[];
}

export interface AgentActivity {
  id: string;
  timestamp: string;
  metricId: string;
  metricName: string;
  status: 'idle' | 'analyzing' | 'hypothesizing' | 'patching' | 'benchmarking' | 'completed' | 'failed';
  message: string;
  logLines: string[];
  codeDiff?: string;
  improvementStats?: {
    metricName: string;
    before: string;
    after: string;
    changePercent: string;
  };
}

export interface MetricSuggestion {
  id: string;
  name: string;
  category: 'performance' | 'quality' | 'size' | 'cost' | 'custom';
  description: string;
  rationale: string;
  direction: MetricDirection;
  unit: string;
  codeSnippet: string;
  status: 'pending' | 'accepted' | 'ignored';
}

export interface McpSessionLog {
  timestamp: string;
  direction: 'in' | 'out' | 'sys';
  text: string;
}
