import React, { useState, useEffect } from 'react';
import {
  INITIAL_METRICS,
  GIT_COMMITS,
  INITIAL_SUGGESTIONS,
  INITIAL_AGENT_ACTIVITIES,
  INITIAL_MCP_LOGS
} from './data';
import { MetricDefinition, Commit, MetricSuggestion, AgentActivity, McpSessionLog } from './types';
import Dashboard from './components/Dashboard';
import GitGraph from './components/GitGraph';
import Suggestions from './components/Suggestions';
import McpServer from './components/McpServer';
import AgentConsole from './components/AgentConsole';
import {
  Cpu, LayoutDashboard, Sparkles, Terminal, GitBranch,
  Sun, Moon
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gitgraph' | 'suggestions' | 'agent' | 'mcp'>('dashboard');
  const [metrics, setMetrics] = useState<MetricDefinition[]>(INITIAL_METRICS);
  const [commits, setCommits] = useState<Commit[]>(GIT_COMMITS);
  const [suggestions, setSuggestions] = useState<MetricSuggestion[]>(INITIAL_SUGGESTIONS);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>(INITIAL_AGENT_ACTIVITIES);
  const [mcpLogs, setMcpLogs] = useState<McpSessionLog[]>(INITIAL_MCP_LOGS);
  const [selectedMetricId, setSelectedMetricId] = useState<string>('api-feed-latency');
  const [isDark, setIsDark] = useState<boolean>(false);

  // Interactive Live Simulation States for the Autonomous Agent
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<string>('analyzing');
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simDiff, setSimDiff] = useState<string>('');

  // Apply dark class to html element (light is the default)
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const handleToggleAgent = (metricId: string) => {
    setMetrics(prev => prev.map(m => m.id === metricId ? { ...m, enabledForAgent: !m.enabledForAgent } : m));
  };

  const handleAddMcpLog = (log: McpSessionLog) => {
    setMcpLogs(prev => [log, ...prev]);
  };

  const handleAcceptSuggestion = (suggId: string) => {
    const suggestion = suggestions.find(s => s.id === suggId);
    if (!suggestion) return;

    setSuggestions(prev => prev.map(s => s.id === suggId ? { ...s, status: 'accepted' } : s));

    const newMetric: MetricDefinition = {
      id: suggestion.id.replace('sugg-', 'metric-'),
      name: suggestion.name,
      category: suggestion.category,
      description: suggestion.description,
      direction: suggestion.direction,
      unit: suggestion.unit,
      currentVal: suggestion.category === 'cost' ? 0.082 : suggestion.category === 'performance' ? 42.1 : 0.08,
      previousVal: suggestion.category === 'cost' ? 0.091 : suggestion.category === 'performance' ? 45.4 : 0.08,
      enabledForAgent: false,
      codeSnippet: suggestion.codeSnippet,
      history: [
        { commitHash: 'c7a8f1b', value: suggestion.category === 'cost' ? 0.091 : 45.4 },
        { commitHash: 'df84a0c', value: suggestion.category === 'cost' ? 0.082 : 42.1 }
      ]
    };

    setMetrics(prev => {
      if (prev.some(m => m.id === newMetric.id)) return prev;
      return [...prev, newMetric];
    });

    const commitHashStr = Math.random().toString(16).substring(2, 42);
    const newCommit: Commit = {
      hash: commitHashStr,
      shortHash: commitHashStr.substring(0, 7),
      branch: 'main',
      author: 'Lodestar Framework',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      message: `chore: integrate telemetry trackers for ${suggestion.name}`,
      metrics: { [newMetric.id]: newMetric.currentVal }
    };

    setCommits(prev => [newCommit, ...prev]);
    setSelectedMetricId(newMetric.id);
  };

  const handleIgnoreSuggestion = (suggId: string) => {
    setSuggestions(prev => prev.map(s => s.id === suggId ? { ...s, status: 'ignored' } : s));
  };

  const handleTriggerAgentSim = (metricId: string) => {
    if (isSimRunning) return;

    setActiveTab('agent');
    setIsSimRunning(true);
    setSimStep('analyzing');
    setSimLogs([
      `[20:01:12] [Lodestar AI] Optimization pass requested for GET /api/v1/items Latency`,
      `[20:01:13] [Lodestar AI] Analyzing Git HEAD commit history... Loaded df84a0c ("feat: overhaul user recommendation carousel")`,
      `[20:01:15] [Lodestar AI] Regression isolated: Metric spiked by +57.8ms (+61.3%)`
    ]);

    setTimeout(() => {
      setSimStep('hypothesizing');
      setSimLogs(prev => [
        ...prev,
        `[20:01:17] [Lodestar AI] Scanning call stacks in "src/routes/items.ts"`,
        `[20:01:19] [Lodestar AI] Found bottleneck: double nested db.recommendations.findMany query inside loop mapping.`,
        `[20:01:21] [Lodestar AI] Hypothesis formulated: implement index select pre-fetch matching + Redis caches mapping`
      ]);
    }, 1500);

    setTimeout(() => {
      setSimStep('testing');
      setSimLogs(prev => [
        ...prev,
        `[20:01:24] [Lodestar AI] Provisioning isolated test sandbox container...`,
        `[20:01:26] [Lodestar AI] Writing patched integration files (git target branch: lodestar/opt-api-feed-latency)`,
        `[20:01:29] [Lodestar AI] Executing local benchmark suite [concurrency=50, total_req=1000]...`,
        `            - Baseline: 152.0ms (P95)`,
        `            - Experimental code patch: 94.2ms (P95)`,
        `            - Verification outcome: -38.0% improvement verified`
      ]);

      setSimDiff(`diff --git a/src/routes/items.ts b/src/routes/items.ts
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
-});`);
    }, 3500);

    setTimeout(() => {
      setSimStep('verifying');
      setSimLogs(prev => [
        ...prev,
        `[20:01:32] [Lodestar AI] Compiling complete module index... Done.`,
        `[20:01:34] [Lodestar AI] Executing full CI guardrail regression audit specs:`,
        `    - Unit checks: PASSED (24/24)`,
        `    - Coverage delta: +0.1% line margin`,
        `    - Companion metrics impact check: NO REGRESSIONS IN MAIN BUNDLE SIZE (184.2KB)`,
        `[20:01:37] [Success] Created production git commit e3f1c9d. Self-approved PR #182. Merged.`
      ]);

      setIsSimRunning(false);

      setMetrics(prev => prev.map(m => {
        if (m.id === 'api-feed-latency') return { ...m, currentVal: 94.2, previousVal: 152.0 };
        return m;
      }));

      const patchedCommit: Commit = {
        hash: 'e3f1c9d2a09f3e46b14d24a6e5b6c7a8d9f0e1a2',
        shortHash: 'e3f1c9d',
        branch: 'main',
        author: 'Lodestar Autonomous Optimizer',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        message: '[Lodestar AI] optimize: implement async memoized indexing on items feed & pool connections',
        metrics: {
          'api-feed-latency': 94.2, 'bundle-size-main': 184.2,
          'test-coverage': 88.5, 'db-pool-exhaustion': 4.8,
          'cache-hit-rate': 91.2, 'llm-inference-cost': 0.048
        },
        regressions: []
      };

      setCommits(prev => {
        if (prev.some(c => c.shortHash === 'e3f1c9d')) return prev;
        return [patchedCommit, ...prev];
      });

      const newAct: AgentActivity = {
        id: `act-feed-sim-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        metricId: 'api-feed-latency',
        metricName: 'GET /api/v1/items Latency',
        status: 'completed',
        message: 'Live Optimization simulator pass. Improved latency metric from 152.0ms down to 94.2ms.',
        logLines: ['Automatic simulator sweep finished cleanly.', 'Optimized feed loops pre-mapped with Redis.']
      };
      setAgentActivities(prev => [newAct, ...prev]);
    }, 5500);
  };

  const tabs = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'gitgraph' as const, label: 'Git Graph', icon: GitBranch },
    { id: 'suggestions' as const, label: 'Suggestions', icon: Sparkles, badge: suggestions.filter(s => s.status === 'pending').length },
    { id: 'agent' as const, label: 'Agent Console', icon: Cpu, pulse: isSimRunning },
    { id: 'mcp' as const, label: 'MCP Server', icon: Terminal },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] flex flex-col font-sans" id="main-container">

      {/* HEADER */}
      <header className="border-b border-[var(--border)] px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)]">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-md bg-[var(--accent)] flex items-center justify-center text-white font-bold text-sm select-none shadow-sm">
            L
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[var(--text-1)] tracking-tight">Lodestar</h1>
              <span className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-3)] font-mono text-[9px] px-1.5 py-0.5 rounded">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-3)] mt-0.5 tracking-wide">Continuous Telemetry Control Surface</p>
          </div>
        </div>

        <div className="flex items-center gap-5 flex-wrap">
          <div className="flex items-center gap-5">
            <div>
              <div className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-wider mb-0.5">Objectives</div>
              <div className="text-xs font-semibold text-[var(--text-1)] font-mono font-tabular">{metrics.length}</div>
            </div>
            <div>
              <div className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-wider mb-0.5">Agent</div>
              <div className="text-xs text-[var(--accent-text)] font-mono font-semibold flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${isSimRunning ? 'bg-[var(--accent)] animate-ping' : 'bg-[var(--text-3)]'}`} />
                {isSimRunning ? 'Running' : 'Idle'}
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsDark(!isDark)}
            className="p-1.5 rounded border border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--hover)] transition-colors"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* NAV */}
      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="max-w-7xl w-full mx-auto px-6 flex">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-[var(--accent)] text-[var(--text-1)] font-semibold'
                    : 'border-transparent text-[var(--text-2)] hover:text-[var(--text-1)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge != null && tab.badge > 0 && (
                  <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 bg-[var(--accent)] text-white rounded-full leading-none">
                    {tab.badge}
                  </span>
                )}
                {tab.pulse && (
                  <span className="h-1.5 w-1.5 bg-[var(--accent)] rounded-full animate-ping" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-5 sm:p-6">
        <main className="min-h-[500px]">
          {activeTab === 'dashboard' && (
            <Dashboard
              metrics={metrics}
              commits={commits}
              onToggleAgent={handleToggleAgent}
              selectedMetricId={selectedMetricId}
              setSelectedMetricId={setSelectedMetricId}
              onTriggerAgentSim={handleTriggerAgentSim}
              isSimulating={isSimRunning}
            />
          )}
          {activeTab === 'gitgraph' && <GitGraph commits={commits} metrics={metrics} />}
          {activeTab === 'suggestions' && (
            <Suggestions
              suggestions={suggestions}
              onAcceptSuggestion={handleAcceptSuggestion}
              onIgnoreSuggestion={handleIgnoreSuggestion}
            />
          )}
          {activeTab === 'mcp' && <McpServer logs={mcpLogs} onAddLog={handleAddMcpLog} />}
          {activeTab === 'agent' && (
            <AgentConsole
              activities={agentActivities}
              onTriggerAgentSim={handleTriggerAgentSim}
              isSimRunning={isSimRunning}
              simLogs={simLogs}
              simStep={simStep}
              simDiff={simDiff}
            />
          )}
        </main>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-4 px-6 shrink-0 mt-8">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--text-3)] font-mono">
          <span>© 2026 Lodestar — Continuous Telemetry Control Surface</span>
          <div className="flex items-center gap-4">
            <a
              href="#mcp"
              onClick={(e) => { e.preventDefault(); setActiveTab('mcp'); }}
              className="hover:text-[var(--text-2)] transition-colors"
            >
              MCP Configuration
            </a>
            <span className="text-[var(--accent-text)]">docs/sdk-spec</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
