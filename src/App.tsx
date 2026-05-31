import React, { useState } from 'react';
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
  Settings, Activity, Info
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'gitgraph' | 'suggestions' | 'agent' | 'mcp'>('dashboard');
  const [metrics, setMetrics] = useState<MetricDefinition[]>(INITIAL_METRICS);
  const [commits, setCommits] = useState<Commit[]>(GIT_COMMITS);
  const [suggestions, setSuggestions] = useState<MetricSuggestion[]>(INITIAL_SUGGESTIONS);
  const [agentActivities, setAgentActivities] = useState<AgentActivity[]>(INITIAL_AGENT_ACTIVITIES);
  const [mcpLogs, setMcpLogs] = useState<McpSessionLog[]>(INITIAL_MCP_LOGS);
  const [selectedMetricId, setSelectedMetricId] = useState<string>('api-feed-latency');

  // Interactive Live Simulation States for the Autonomous Agent
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<string>('analyzing');
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [simDiff, setSimDiff] = useState<string>('');

  // Toggle agent enablement
  const handleToggleAgent = (metricId: string) => {
    setMetrics(prev => prev.map(m => {
      if (m.id === metricId) {
        return { ...m, enabledForAgent: !m.enabledForAgent };
      }
      return m;
    }));
  };

  // Add custom log on MCP execution
  const handleAddMcpLog = (log: McpSessionLog) => {
    setMcpLogs(prev => [log, ...prev]);
  };

  // Accept suggestions
  const handleAcceptSuggestion = (suggId: string) => {
    const suggestion = suggestions.find(s => s.id === suggId);
    if (!suggestion) return;

    // Shift suggestion status to accepted
    setSuggestions(prev => prev.map(s => s.id === suggId ? { ...s, status: 'accepted' } : s));

    // Simulate appending new live tracked metric
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

    // Post Git Commit to show injection was made in codebase
    const commitHashStr = Math.random().toString(16).substring(2, 42);
    const newCommit: Commit = {
      hash: commitHashStr,
      shortHash: commitHashStr.substring(0, 7),
      branch: 'main',
      author: 'Lodestar Framework',
      avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      message: `chore: integrate telemetry trackers for ${suggestion.name}`,
      metrics: {
        [newMetric.id]: newMetric.currentVal
      }
    };

    setCommits(prev => [newCommit, ...prev]);
    setSelectedMetricId(newMetric.id);
  };

  // Dismiss suggestion
  const handleIgnoreSuggestion = (suggId: string) => {
    setSuggestions(prev => prev.map(s => s.id === suggId ? { ...s, status: 'ignored' } : s));
  };

  // Trigger Autonomous Research Agent simulation pass
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

    // Step 2: Hypothesizing
    setTimeout(() => {
      setSimStep('hypothesizing');
      setSimLogs(prev => [
        ...prev,
        `[20:01:17] [Lodestar AI] Scanning call stacks in "src/routes/items.ts"`,
        `[20:01:19] [Lodestar AI] Found bottleneck: double nested db.recommendations.findMany query inside loop mapping.`,
        `[20:01:21] [Lodestar AI] Hypothesis formulated: implement index select pre-fetch matching + Redis caches mapping`
      ]);
    }, 1500);

    // Step 3: Testing
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

    // Step 4: Verifying & Completing
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
      
      // Update feed-latency metric values
      setMetrics(prev => prev.map(m => {
        if (m.id === 'api-feed-latency') {
          return {
            ...m,
            currentVal: 94.2,
            previousVal: 152.0
          };
        }
        return m;
      }));

      // Update Git history
      const patchedCommit: Commit = {
        hash: 'e3f1c9d2a09f3e46b14d24a6e5b6c7a8d9f0e1a2',
        shortHash: 'e3f1c9d',
        branch: 'main',
        author: 'Lodestar Autonomous Optimizer',
        avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
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
      };

      setCommits(prev => {
        if (prev.some(c => c.shortHash === 'e3f1c9d')) {
          return prev;
        }
        return [patchedCommit, ...prev];
      });

      const newAct: AgentActivity = {
        id: `act-feed-sim-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        metricId: 'api-feed-latency',
        metricName: 'GET /api/v1/items Latency',
        status: 'completed',
        message: 'Live Optimization simulator pass. Improved latency metric count from 152.0ms down to 94.2ms.',
        logLines: [
          'Automatic simulator sweep finished cleanly.',
          'Optimized feed loops pre-mapped with Redis.'
        ]
      };
      setAgentActivities(prev => [newAct, ...prev]);

    }, 5500);
  };

  return (
    <div className="min-h-screen bg-[#0B0D10] text-[#E2E8F0] flex flex-col font-sans selection:bg-violet-600/30 selection:text-white" id="main-container">
      
      {/* 1. QUIET HEADER CHROME (NO CHUTNEY, SECURE & TRANQUIL) */}
      <header className="border-b border-[#22262B] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#13161B]" id="lodestar-header">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 bg-violet-600 rounded flex items-center justify-center text-white shadow-lg font-bold text-base select-none">
            ◈
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#E2E8F0] tracking-tight font-sans">Lodestar</h1>
              <span className="bg-[#0B0D10] border border-[#22262B] text-[#8A94A6] font-mono text-[9px] px-1.5 py-0.2 rounded font-medium">
                mainline-v1.0
              </span>
            </div>
            <p className="text-[10px] text-[#4F5B70] font-sans mt-0.5 uppercase tracking-wider font-semibold">Continuous Telemetry Control Surface</p>
          </div>
        </div>

        {/* Global state gauges */}
        <div className="flex items-center gap-6 flex-wrap font-sans">
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-[#8A94A6] uppercase">Tracked Objectives</div>
            <div className="text-xs font-semibold text-[#E2E8F0] font-mono font-tabular">{metrics.length}</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-[#8A94A6] uppercase">Dynamic Targets</div>
            <div className="text-xs font-semibold text-[#E2E8F0] font-mono font-tabular">
              {metrics.filter(m => m.targetVal !== undefined).length}
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-[#8A94A6] uppercase">Autonomous State</div>
            <div className="text-xs text-violet-400 font-mono font-semibold flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${isSimRunning ? 'bg-violet-400 animate-ping' : 'bg-[#4F5B70]'}`} />
              <span>{isSimRunning ? 'Optimizing' : 'Active'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. NAVIGATION SUBBAR TABS */}
      <div className="border-b border-[#22262B] bg-[#13161B]/40">
        <div className="max-w-7xl w-full mx-auto px-6 flex gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'border-violet-500 text-white font-semibold' 
                : 'border-transparent text-[#8A94A6] hover:text-[#E2E8F0]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Objectives Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('gitgraph')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'gitgraph' 
                ? 'border-violet-500 text-white font-semibold' 
                : 'border-transparent text-[#8A94A6] hover:text-[#E2E8F0]'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Git Network Graph</span>
          </button>

          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all relative cursor-pointer ${
              activeTab === 'suggestions' 
                ? 'border-violet-500 text-white font-semibold' 
                : 'border-transparent text-[#8A94A6] hover:text-[#E2E8F0]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gaps Suggestion Link</span>
            {suggestions.filter(s => s.status === 'pending').length > 0 && (
              <span className="absolute top-1 right-1 text-[8px] font-bold font-mono px-1.5 py-0.1 bg-violet-600 text-white rounded-full">
                {suggestions.filter(s=>s.status==='pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('agent')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all cursor-pointer relative ${
              activeTab === 'agent' 
                ? 'border-violet-500 text-white font-semibold' 
                : 'border-transparent text-[#8A94A6] hover:text-[#E2E8F0]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Researcher Console</span>
            {isSimRunning && (
              <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-ping ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'mcp' 
                ? 'border-violet-500 text-white font-semibold' 
                : 'border-transparent text-[#8A94A6] hover:text-[#E2E8F0]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>MCP Server</span>
          </button>
        </div>
      </div>

      {/* 3. CONTENT STAGE */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-5 sm:p-6" id="inner-stage">
        <main className="min-h-[500px]" id="tab-outlet">
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

          {activeTab === 'gitgraph' && (
            <GitGraph 
              commits={commits}
              metrics={metrics}
            />
          )}

          {activeTab === 'suggestions' && (
            <Suggestions 
              suggestions={suggestions}
              onAcceptSuggestion={handleAcceptSuggestion}
              onIgnoreSuggestion={handleIgnoreSuggestion}
            />
          )}

          {activeTab === 'mcp' && (
            <McpServer 
              logs={mcpLogs}
              onAddLog={handleAddMcpLog}
            />
          )}

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

      {/* 4. FOOTER */}
      <footer className="border-t border-[#22262B] bg-[#13161B]/30 py-5 px-6 shrink-0 mt-16" id="lodestar-footer">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#4F5B70] font-mono">
          <div className="flex items-center gap-1.5">
            <span>© 2026 Lodestar Control Surface.</span>
            <span>•</span>
            <span className="text-[#8A94A6]">continuous-research-engine=active</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#mcp" onClick={(e) => { e.preventDefault(); setActiveTab('mcp'); }} className="hover:text-zinc-350">mcp configuration standard</a>
            <span>•</span>
            <span className="text-violet-400">docs/sdk-spec</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
