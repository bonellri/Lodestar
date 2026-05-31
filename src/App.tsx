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
import Suggestions from './components/Suggestions';
import McpServer from './components/McpServer';
import AgentConsole from './components/AgentConsole';
import { 
  Cpu, LayoutDashboard, Sparkles, Terminal, Shield, GitBranch, GitPullRequest, 
  Settings, Activity, AlertTriangle, ExternalLink, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'suggestions' | 'mcp' | 'agent'>('dashboard');
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

  const [simImprovement, setSimImprovement] = useState<{ before: string; after: string; percent: string } | undefined>(undefined);

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
      // Check if already mapped
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
    }, 1505);

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
    }, 3804);

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

      // Complete simulation & actually update dashboard data in memory!
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

      // Update Git history by making the agent commit the first item
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
        // Replace or prepend the commit on top so it reflects the agent win
        if (prev.some(c => c.shortHash === 'e3f1c9d')) {
          return prev; // Already there
        }
        return [patchedCommit, ...prev];
      });

      // Update active list of agent activities with a new verified log
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

    }, 6005);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans selection:bg-blue-600/30 selection:text-white" id="main-container">
      
      {/* Dynamic top alert if there are pending suggestions */}
      {suggestions.filter(s => s.status === 'pending').length > 0 && (
        <div className="bg-gradient-to-r from-blue-900/60 via-purple-950/40 to-zinc-950 px-4 py-2 border-b border-blue-900/40 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span className="text-zinc-300">
              Lodestar found <strong className="text-blue-400">{suggestions.filter(s=>s.status==='pending').length} core telemetry gap(s)</strong> in your active controllers codebase files. Recommended integrations ready.
            </span>
          </div>
          <button 
            onClick={() => setActiveTab('suggestions')} 
            className="text-[11px] underline text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1 cursor-pointer"
          >
            Review Gaps →
          </button>
        </div>
      )}

      {/* Global Header */}
      <header className="border-b border-zinc-900 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30" id="lodestar-header">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-gradient-to-tr from-blue-600 to-indigo-700 rounded flex items-center justify-center text-white shadow-lg font-bold text-lg select-none">
            🜲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-zinc-50 tracking-tight font-sans">Lodestar</h1>
              <span className="bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider">
                v1.0.4-beta
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">THE CODEBASE OBJECTIVE FUNCTION LAYER</p>
          </div>
        </div>

        {/* Global state gauges */}
        <div className="flex items-center gap-5 sm:gap-8 flex-wrap">
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-zinc-500 uppercase">Tracked Metrics</div>
            <div className="font-mono text-xs font-medium text-zinc-200">{metrics.length} Objectives</div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-zinc-500 uppercase">Git Context</div>
            <div className="font-mono text-xs text-zinc-300 flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-zinc-400" /> main
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-zinc-500 uppercase">MCP Active Channels</div>
            <div className="font-mono text-xs text-blue-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> 1 Agent Loop
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="text-[9px] font-mono text-zinc-500 uppercase">Researcher State</div>
            <div className="font-mono text-xs text-purple-400 flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${isSimRunning ? 'bg-blue-500 animate-ping' : 'bg-purple-400'}`} />
              <span>{isSimRunning ? 'Optimizing...' : 'Watching'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Tab Controller & Nav */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6" id="inner-stage">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-900 pb-px" id="tabs-navigation">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'border-blue-500 text-white font-semibold' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
              id="navigation-tab-dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Objectives Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('suggestions')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all relative cursor-pointer ${
                activeTab === 'suggestions' 
                  ? 'border-blue-500 text-white font-semibold' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
              id="navigation-tab-suggestions"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Suggestion Engine</span>
              {suggestions.filter(s => s.status === 'pending').length > 0 && (
                <span className="absolute -top-1.5 -right-1 text-[8.5px] font-bold font-mono px-1.5 py-0.2 rounded-full bg-blue-600 text-white animate-pulse">
                  {suggestions.filter(s=>s.status==='pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('mcp')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'mcp' 
                  ? 'border-blue-500 text-white font-semibold' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
              id="navigation-tab-mcp"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>MCP Server (AI Bridge)</span>
            </button>

            <button
              onClick={() => setActiveTab('agent')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === 'agent' 
                  ? 'border-blue-500 text-white font-semibold' 
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
              id="navigation-tab-agent"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Autonomous Researcher</span>
              {isSimRunning && (
                <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce ml-1 shrink-0" />
              )}
            </button>
          </div>
        </div>

        {/* Tab content renderer */}
        <main className="min-h-[500px]" id="tab-outlet">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.15 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  metrics={metrics}
                  commits={commits}
                  onToggleAgent={handleToggleAgent}
                  selectedMetricId={selectedMetricId}
                  setSelectedMetricId={setSelectedMetricId}
                  onTriggerAgentSim={handleTriggerAgentSim}
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
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/65 py-5 px-6 shrink-0 mt-20" id="lodestar-footer">
        <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            <span>© 2026 Lodestar Inc.</span>
            <span>•</span>
            <span className="text-zinc-400">continuous-research-engine=enabled</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#mcp" onClick={(e) => { e.preventDefault(); setActiveTab('mcp'); }} className="hover:text-zinc-300">mcp configuration schema</a>
            <a href="#dashboard" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }} className="hover:text-zinc-300 font-semibold text-blue-500">docs/sdk-reference</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
