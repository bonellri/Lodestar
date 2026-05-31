import React, { useState } from 'react';
import { MetricDefinition, Commit } from '../types';
import { 
  Search, Play, GitBranch, GitCommit, ArrowUpRight, ArrowDownRight, CheckCircle2, 
  AlertTriangle, Code, PlaySquare, Shield, HelpCircle, Activity, ChevronRight, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  metrics: MetricDefinition[];
  commits: Commit[];
  onToggleAgent: (metricId: string) => void;
  selectedMetricId: string;
  setSelectedMetricId: (id: string) => void;
  onTriggerAgentSim: (metricId: string) => void;
}

export default function Dashboard({
  metrics,
  commits,
  onToggleAgent,
  selectedMetricId,
  setSelectedMetricId,
  onTriggerAgentSim
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'performance' | 'quality' | 'size' | 'cost'>('all');
  const [selectedBranch, setSelectedBranch] = useState<'all' | 'main' | 'feature/carousel-v2'>('all');

  const selectedMetric = metrics.find(m => m.id === selectedMetricId) || metrics[0];

  // Filters
  const filteredMetrics = metrics.filter(metric => {
    const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          metric.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || metric.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const filteredCommits = commits.filter(commit => {
    if (selectedBranch === 'all') return true;
    return commit.branch === selectedBranch;
  });

  // Calculate trends for a metric
  const getTrendData = (metric: MetricDefinition) => {
    if (!metric.history || metric.history.length < 2) return { direction: 'flat', percentage: 0 };
    const values = metric.history.map(h => h.value);
    const first = values[0];
    const last = values[values.length - 1];
    
    // Invert interpretation if minimize is desired
    const rawDiff = last - first;
    const percent = Math.abs((rawDiff / first) * 100);
    
    let isPositiveForUser = false;
    if (metric.direction === 'minimize') {
      isPositiveForUser = rawDiff < 0; // Less is better
    } else {
      isPositiveForUser = rawDiff > 0; // More is better
    }

    return {
      rawDiff,
      percent: percent.toFixed(1),
      isImprovement: rawDiff === 0 ? null : isPositiveForUser,
      valueDiffStr: `${rawDiff > 0 ? '+' : ''}${rawDiff.toLocaleString(undefined, { maximumFractionDigits: 4 })}`
    };
  };

  // SVG Line Path calculation for history
  const generateChartPath = (history: { value: number }[], width: number, height: number, minVal: number, maxVal: number) => {
    if (!history || history.length < 2) return '';
    const points = history.map((pt, i) => {
      const x = (i / (history.length - 1)) * width;
      // y is inverted in SVG coordinates
      const valRange = maxVal - minVal || 1;
      const y = height - ((pt.value - minVal) / valRange) * (height - 16) - 8;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-layout">
      {/* LEFT: Metrics Discovery List */}
      <div className="lg:col-span-12 xl:col-span-7 space-y-4" id="metrics-browser-pane">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pb-2">
          {/* Category tabs */}
          <div className="flex bg-[#09090b]/40 p-1 rounded-lg border border-zinc-800/80 w-auto self-start">
            {(['all', 'performance', 'quality', 'size', 'cost'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 text-xs rounded-md transition-all font-sans font-medium capitalize cursor-pointer ${
                  categoryFilter === cat 
                    ? 'bg-zinc-800 text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                id={`filter-tab-${cat}`}
              >
                {cat === 'quality' ? 'Quality' : cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search objective metrics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#18181b]/50 border border-zinc-800/80 rounded-md pl-9 pr-4 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500 font-sans transition-colors"
              id="metric-search-input"
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="metrics-grid">
          {filteredMetrics.map((metric) => {
            const trend = getTrendData(metric);
            const isSelected = metric.id === selectedMetricId;
            const historyVals = metric.history.map(h => h.value);
            const minH = Math.min(...historyVals);
            const maxH = Math.max(...historyVals);
            
            // Build sparkline path representation
            const sparklinePath = generateChartPath(metric.history, 80, 28, minH, maxH);

            return (
              <div
                key={metric.id}
                onClick={() => setSelectedMetricId(metric.id)}
                className={`p-4 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between h-40 ${
                  isSelected 
                    ? 'bg-[#18181b]/90 border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.15)]' 
                    : 'bg-[#121214]/60 border-zinc-850 hover:bg-[#18181b]/40 hover:border-zinc-800'
                }`}
                id={`metric-card-${metric.id}`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[10px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ${
                        metric.category === 'performance' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' :
                        metric.category === 'cost' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                        metric.category === 'size' ? 'bg-purple-950/40 text-purple-400 border border-purple-900/30' :
                        'bg-zinc-900 text-zinc-400 border border-zinc-800/50'
                      }`}>
                        {metric.category}
                      </span>
                      <h3 className="text-[13px] font-medium text-zinc-100 mt-2 font-sans truncate pr-4">{metric.name}</h3>
                    </div>
                    {/* Sparkline */}
                    <div className="w-20 h-8 opacity-70">
                      <svg width="100%" height="100%" viewBox="0 0 80 28" className="overflow-visible">
                        <path
                          d={sparklinePath}
                          stroke={trend.isImprovement ? '#10b981' : trend.isImprovement === false ? '#ef4444' : '#a1a1aa'}
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans line-clamp-2 mt-1.5 min-h-[32px]">
                    {metric.description}
                  </p>
                </div>

                <div className="flex items-end justify-between pt-1 border-t border-zinc-900">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-base font-semibold text-zinc-100">{metric.currentVal}</span>
                    <span className="font-mono text-[10px] text-zinc-500">{metric.unit}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {trend.isImprovement !== null && (
                      <span className={`flex items-center font-mono text-[11px] font-medium ${
                        trend.isImprovement ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {trend.isImprovement ? <ArrowDownRight className="w-3 w-3 mr-0.5" /> : <ArrowUpRight className="w-3 w-3 mr-0.5" />}
                        {trend.percent}%
                      </span>
                    )}
                    {metric.enabledForAgent && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" title="Autonomous Agent Attached" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Git Commits Log */}
        <div className="bg-[#121214]/60 border border-zinc-850 rounded-lg p-5 space-y-4" id="recent-commits-feed">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-zinc-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Commit Metrics Pipeline</h2>
            </div>
            
            {/* Branch selector */}
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-[11px] py-1 px-2.5 rounded hover:border-zinc-700 outline-none cursor-pointer"
            >
              <option value="all">All Branches</option>
              <option value="main">main</option>
              <option value="feature/carousel-v2">feature/carousel-v2</option>
            </select>
          </div>

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredCommits.map((commit) => (
              <div 
                key={commit.hash} 
                className="group flex items-start justify-between p-3 rounded-lg border border-transparent hover:border-zinc-850 bg-zinc-900/20 hover:bg-[#18181b]/30 transition-all"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                  <img 
                    src={commit.avatarUrl} 
                    alt={commit.author} 
                    className="w-6 h-6 rounded-full border border-zinc-800 mt-0.5 object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 space-y-1">
                    <p className="text-[12px] text-zinc-200 font-sans line-clamp-1">
                      {commit.message}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500">
                      <span className="text-zinc-400 font-medium">{commit.author}</span>
                      <span>•</span>
                      <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.2 rounded text-[9px] flex items-center gap-0.5 font-sans">
                        <GitBranch className="w-2.5 h-2.5 inline" /> {commit.branch}
                      </span>
                      <span>•</span>
                      <span>{commit.shortHash}</span>
                      <span>•</span>
                      <span>{commit.date}</span>
                    </div>
                  </div>
                </div>

                {/* Metrics on Commit */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* If regression is recorded */}
                  {commit.regressions && commit.regressions.length > 0 ? (
                    <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-950/60 px-2 py-1 rounded text-[11px] font-mono">
                      <AlertTriangle className="w-3 w-3 shrink-0 animate-bounce" />
                      <span>{commit.regressions.length} Regression Warning</span>
                    </div>
                  ) : commit.shortHash === 'e3f1c9d' ? (
                    <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-950/60 px-2 by-1 rounded text-[10px] font-mono">
                      <CheckCircle2 className="w-3.5 w-3.5 shrink-0" />
                      <span>Agent Fixed</span>
                    </div>
                  ) : (
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
                      <span className="text-[10px] text-zinc-500 font-mono">Telemetry Safe</span>
                    </div>
                  )}

                  <ChevronRight className="w-4 h-4 text-zinc-650 group-hover:text-zinc-400 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT: Metric Deep Dive and AI Agent Control */}
      <div className="lg:col-span-12 xl:col-span-5 space-y-6" id="dashboard-details-pane">
        <div className="bg-[#121214]/60 border border-zinc-850 rounded-lg p-5 space-y-6 sticky top-4">
          
          {/* Section Header */}
          <div className="flex items-start justify-between border-b border-zinc-900 pb-3">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Selected Telemetry Objective</p>
              <h2 className="text-sm font-semibold text-zinc-100 font-sans flex items-center gap-2 mt-1">
                {selectedMetric.name}
              </h2>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-mono text-zinc-400">{selectedMetric.currentVal} <span className="text-[10px] text-zinc-500">{selectedMetric.unit}</span></span>
              <span className="text-[9px] text-zinc-500 font-mono mt-0.5">Target: {selectedMetric.targetVal || 'none'} {selectedMetric.unit}</span>
            </div>
          </div>

          {/* Historical SVG Graph */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>Historical Trend (Git History)</span>
              <span>{selectedMetric.direction === 'minimize' ? 'Lower is Better 🡫' : 'Higher is Better 🡩'}</span>
            </div>
            <div className="h-44 bg-zinc-950/80 rounded border border-zinc-900 relative flex items-center justify-center p-4 overflow-hidden">
              {/* Background grid lines */}
              <div className="absolute inset-x-0 top-1/4 border-t border-zinc-900/40" />
              <div className="absolute inset-x-0 top-2/4 border-t border-zinc-900/40" />
              <div className="absolute inset-x-0 top-3/4 border-t border-zinc-900/40" />
              
              <svg width="100%" height="100%" className="overflow-visible select-none pointer-events-auto">
                {(() => {
                  const values = selectedMetric.history.map(h => h.value);
                  const min = Math.min(...values) * 0.9;
                  const max = Math.max(...values) * 1.1;
                  const range = max - min || 1;
                  const path = generateChartPath(selectedMetric.history, 400, 150, min, max);

                  return (
                    <>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      
                      {/* Area projection */}
                      <path
                        d={`${path} L 400,150 L 0,150 Z`}
                        fill="url(#chartGradient)"
                        className="opacity-70 transition-all duration-300"
                      />
                      {/* Line projection */}
                      <path
                        d={path}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-300"
                      />

                      {/* Points markup with hover annotations */}
                      {selectedMetric.history.map((pt, idx) => {
                        const x = (idx / (selectedMetric.history.length - 1)) * 360 + 20;
                        const y = 144 - ((pt.value - min) / range) * 120 - 10;
                        const commitInfo = commits.find(c => c.shortHash === pt.commitHash);

                        return (
                          <g key={pt.commitHash} className="group cursor-help">
                            <circle
                              cx={x}
                              cy={y}
                              r="4.5"
                              fill="#09090b"
                              stroke="#60a5fa"
                              strokeWidth="2"
                            />
                            {/* Monospace tooltip simulation on hover */}
                            <foreignObject x={idx === 0 ? x : x - 70} y={y - 50} width="140" height="40" className="overflow-visible pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
                              <div className="bg-zinc-900 border border-zinc-850 px-2 py-1 rounded shadow-xl text-[9px] font-mono text-zinc-300">
                                <div className="text-white font-semibold truncate leading-none mb-0.5">Commit {pt.commitHash}</div>
                                <div className="flex justify-between">
                                  <span>Value:</span> 
                                  <span className="text-blue-400 font-bold">{pt.value}</span>
                                </div>
                              </div>
                            </foreignObject>
                          </g>
                        );
                      })}
                    </>
                  );
                })()}
              </svg>
            </div>
            
            {/* Git hashes along the x-axis */}
            <div className="flex justify-between px-2 text-[9px] font-mono text-zinc-500">
              {selectedMetric.history.map(h => (
                <span key={h.commitHash} className="hover:text-zinc-300 cursor-pointer">{h.commitHash}</span>
              ))}
            </div>
          </div>

          {/* Autonomous Optimization Control Shield */}
          <div className="bg-[#18181b]/40 border border-zinc-800/80 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-zinc-400" />
                <div>
                  <h3 className="text-xs font-semibold text-zinc-100 font-sans">Autonomous AI Research Agent</h3>
                  <p className="text-[10px] text-zinc-400 font-sans mt-0.5">Let agents hypothesize, test, and patch this metric</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedMetric.enabledForAgent}
                  onChange={() => onToggleAgent(selectedMetric.id)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:left-[3px] after:bg-zinc-400 peer-checked:after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {selectedMetric.enabledForAgent ? (
              <div className="space-y-3 pt-2 text-[11px] border-t border-zinc-850">
                <div className="flex items-center justify-between text-zinc-300 font-sans">
                  <span>Guardrail State</span>
                  <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Protected
                  </span>
                </div>
                <div className="text-zinc-500 font-sans leading-relaxed text-[10px]">
                  Guardrail rules enforced: Unit/integration tests must pass perfectly in sandbox; bundle size must not increase by &gt; 1%; no regressive movement allowed on companion metrics.
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                  <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900">
                    <div className="text-zinc-500">regression ceiling</div>
                    <div className="text-zinc-300 font-semibold mt-0.5">2.5% max</div>
                  </div>
                  <div className="bg-zinc-950 p-1.5 rounded border border-zinc-900">
                    <div className="text-zinc-500">mcp authority</div>
                    <div className="text-zinc-300 font-semibold mt-0.5">READ-WRITE</div>
                  </div>
                </div>

                {selectedMetric.id === 'api-feed-latency' ? (
                  <button
                    onClick={() => onTriggerAgentSim(selectedMetric.id)}
                    className="w-full bg-[#18181b] border border-blue-500/40 text-blue-400 text-[10.5px] hover:bg-blue-500/10 cursor-pointer transition-colors py-1.5 rounded font-mono font-medium flex items-center justify-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-blue-400" /> Run Autonomous Optimizer Simulator
                  </button>
                ) : (
                  <div className="p-2 bg-blue-950/20 text-blue-400 rounded-md border border-blue-900/30 text-[10px] font-sans flex items-start gap-1.5">
                    <Activity className="w-3.5 h-3.5 shrink-0 mt-0.5 animate-pulse" />
                    <span>Attached to continuous optimization pipeline. Lodestar AI scans for improvement hypotheses daily.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[10px] text-zinc-500 font-sans pt-1">
                Autonomous writing agent is disabled. This metric can only be monitored or read by developers or agent loops inside Cursor/v0 via MCP.
              </div>
            )}
          </div>

          {/* Metric SDK Declaration Code Block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span className="flex items-center gap-1.5"><Code className="w-3.5 h-3.5" /> SDK INSTRUMENTATION</span>
              <span>TypeScript</span>
            </div>
            <pre className="text-[10.5px] font-mono bg-zinc-950 p-4 rounded-lg border border-zinc-900 overflow-x-auto text-zinc-300 leading-relaxed max-h-[170px]">
              <code>{selectedMetric.codeSnippet}</code>
            </pre>
          </div>

        </div>
      </div>
    </div>
  );
}
