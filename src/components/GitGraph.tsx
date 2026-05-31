import React, { useState } from 'react';
import { Commit, MetricDefinition } from '../types';
import { 
  GitBranch, GitCommit, GitMerge, ChevronDown, CheckCircle2, 
  XCircle, AlertTriangle, ArrowRight, User, Calendar, Clock, BarChart3, Info,
  TrendingUp, Layers, ListFilter, Sliders, Check, RefreshCw
} from 'lucide-react';

interface GitGraphProps {
  commits: Commit[];
  metrics: MetricDefinition[];
}

const METRIC_COLORS: Record<string, string> = {
  'api-feed-latency': '#8B5CF6',     // Violet
  'bundle-size-main': '#0EA5E9',     // Sky Blue
  'test-coverage': '#10B981',        // Emerald
  'db-pool-exhaustion': '#F59E0B',   // Dark Amber
  'cache-hit-rate': '#EF4444',       // Rose Red
  'llm-inference-cost': '#14B8A6'    // Teal
};

export default function GitGraph({ commits, metrics }: GitGraphProps) {
  // Determine all available feature branches dynamically
  const availableBranches = Array.from(
    new Set(commits.map(c => c.branch).filter(b => b !== 'main' && b !== 'master'))
  );

  // States
  const [selectedBranch, setSelectedBranch] = useState<string>(
    availableBranches.includes('feature/carousel-v2') 
      ? 'feature/carousel-v2' 
      : availableBranches[0] || 'feature/carousel-v2'
  );

  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'api-feed-latency',
    'bundle-size-main'
  ]);

  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'bars' | 'trend' | 'cards'>('bars');

  // Multi-select metrics toggling helper
  const handleToggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricId)) {
        // Prevent clearing all selections so we always have at least 1 metric shown
        if (prev.length <= 1) return prev;
        return prev.filter(id => id !== metricId);
      } else {
        return [...prev, metricId];
      }
    });
  };

  const handleSelectAllMetrics = () => {
    setSelectedMetrics(metrics.map(m => m.id));
  };

  const handleClearMetrics = () => {
    // Keep at least the first one
    if (metrics.length > 0) {
      setSelectedMetrics([metrics[0].id]);
    }
  };

  // Get active HEAD commits for main and selected comparison branch
  const mainCommits = commits.filter(c => c.branch === 'main' || c.branch === 'master');
  const mainHeadCommit = [...mainCommits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || commits[0];

  const branchCommits = commits.filter(c => c.branch === selectedBranch);
  const branchHeadCommit = [...branchCommits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;

  // Filter commits for DAG display based on main + selected branch
  const displayCommits = commits.filter(
    c => c.branch === 'main' || c.branch === 'master' || c.branch === selectedBranch
  );

  // Oldest to newest commits for sequential mapping in the DAG Layout
  const chronologicalDisplay = [...displayCommits].sort((a, b) => {
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Calculate coordinates dynamically in chronological order
  const dNodes = chronologicalDisplay.map((commit, index) => {
    const isMain = commit.branch === 'main' || commit.branch === 'master';
    return {
      hash: commit.hash,
      short: commit.shortHash,
      x: 60 + index * 105,
      y: isMain ? 40 : 100,
      branch: commit.branch,
      color: isMain ? '#8B5CF6' : '#F59E0B',
      commitObj: commit
    };
  });

  const activeCommit = commits.find(c => c.hash === selectedCommitHash) || displayCommits[0] || commits[0];

  // Calculate dynamic delta helper for selected commit vs parent
  const getCommitDelta = (commit: Commit, metricId: string): { deltaVal: number; direction: 'improve' | 'regress' | 'neutral'; formatted: string } => {
    const targetMetric = metrics.find(m => m.id === metricId);
    if (!targetMetric) return { deltaVal: 0, direction: 'neutral', formatted: '0' };

    const currentVal = commit.metrics[metricId];
    if (currentVal === undefined) return { deltaVal: 0, direction: 'neutral', formatted: '—' };

    // Find chronological predecessor on same branch or parent branch
    const branchCommitsFiltered = chronologicalDisplay.filter(c => c.branch === commit.branch || c.branch === 'main');
    const commitIdx = branchCommitsFiltered.findIndex(c => c.hash === commit.hash);
    
    if (commitIdx <= 0) {
      return { deltaVal: 0, direction: 'neutral', formatted: 'Baseline' };
    }

    const prevCommit = branchCommitsFiltered[commitIdx - 1];
    const prevVal = prevCommit.metrics[metricId];
    if (prevVal === undefined) return { deltaVal: 0, direction: 'neutral', formatted: '—' };

    const delta = currentVal - prevVal;
    if (Math.abs(delta) < 0.00001) {
      return { deltaVal: 0, direction: 'neutral', formatted: 'no change' };
    }

    const direction = targetMetric.direction;
    const isImprovement = direction === 'minimize' ? delta < 0 : delta > 0;
    const pct = ((Math.abs(delta) / prevVal) * 100).toFixed(1);
    const sign = delta > 0 ? '+' : '';
    const formatted = `${sign}${parseFloat(delta.toFixed(4))} ${targetMetric.unit} (${delta > 0 ? '▲' : '▼'}${pct}%)`;

    return {
      deltaVal: delta,
      direction: isImprovement ? 'improve' : 'regress',
      formatted
    };
  };

  // We've removed the divergent commit graph lanes, but we still keep the metric analysis workspace below.

  return (
    <div className="space-y-6 animate-fade-in text-left font-sans" id="git-graph-section">
      
      {/* HEADER CONTROLS CARD */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 bg-[#13161B] border border-[#22262B] rounded-lg items-start">
        
        {/* Left explanation block */}
        <div className="md:col-span-4 space-y-1">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-semibold tracking-tight text-[#E2E8F0]">Branch Divergence Telemetry</h2>
          </div>
          <p className="text-[11px] text-[#8A94A6] leading-relaxed">
            Select a target comparison feature branch to render alongside the main track, and choose which telemetry metrics to plot and compare side-by-side.
          </p>
          
          <div className="pt-3 flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-[#4F5B70]">Comparison Branch</label>
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => {
                  setSelectedBranch(e.target.value);
                  setSelectedCommitHash(null);
                }}
                className="w-full bg-[#0B0D10] border border-[#22262B] text-xs text-[#E2E8F0] px-3 py-2 pr-8 rounded font-semibold focus:border-violet-500/80 outline-none cursor-pointer appearance-none"
              >
                {availableBranches.map(br => (
                  <option key={br} value={br}>{br}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-[#8A94A6] pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Right metrics multi-selector checklist */}
        <div className="md:col-span-8 space-y-2 border-t md:border-t-0 md:border-l border-[#22262B] pt-4 md:pt-0 md:pl-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-violet-400" /> Choose Telemetry Metrics to Compare
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <button onClick={handleSelectAllMetrics} className="text-violet-400 hover:text-violet-300 font-semibold cursor-pointer">Select All</button>
              <span className="text-[#31373E]">|</span>
              <button onClick={handleClearMetrics} className="text-[#8A94A6] hover:text-[#E2E8F0] font-semibold cursor-pointer">Reset</button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {metrics.map(m => {
              const isSelected = selectedMetrics.includes(m.id);
              const color = METRIC_COLORS[m.id] || '#808896';
              
              return (
                <button
                  key={m.id}
                  onClick={() => handleToggleMetric(m.id)}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-all flex flex-col justify-between gap-1 text-[11px] ${
                    isSelected 
                      ? 'bg-[#1C1625] border-violet-500/40 text-white' 
                      : 'bg-[#0B0D10] border-[#22262B] text-[#8A94A6] hover:bg-[#13161B] hover:text-[#E2E8F0]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold truncate pr-1">{m.name}</span>
                    <span 
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        isSelected ? 'ring-2 ring-violet-500/30' : 'opacity-40'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#4F5B70]">
                    <span>{m.unit}</span>
                    {isSelected && (
                      <span className="text-violet-400 flex items-center gap-0.5 text-[9px] font-semibold">
                        <Check className="w-2.5 h-2.5" /> Checked
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* TWO COLUMN GRID : METRIC NETWORK + DETAIL DRAWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: COMPARATOR WORKSPACE */}
        <div className="lg:col-span-8 flex flex-col gap-5">

          {/* DYNAMIC METRIC COMPARATOR BLOCK (Unified View Modes) */}
          <div className="bg-[#13161B] border border-[#22262B] rounded-lg p-5 space-y-4">
            
            {/* Tab switch header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#22262B] gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-400 animate-pulse" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#E2E8F0] font-sans">
                  Branch Comparison Metrics Workspace
                </h3>
              </div>

              {/* Graphical mode selectors */}
              <div className="bg-[#0B0D10] border border-[#22262B] p-0.5 rounded flex text-[10.5px]">
                <button
                  onClick={() => setViewMode('bars')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer font-medium ${
                    viewMode === 'bars' 
                      ? 'bg-violet-600 text-white font-semibold' 
                      : 'text-[#8A94A6] hover:text-[#E2E8F0]'
                  }`}
                >
                  Percent Delta Bars
                </button>
                <button
                  onClick={() => setViewMode('trend')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer font-medium ${
                    viewMode === 'trend'
                      ? 'bg-violet-600 text-white font-semibold'
                      : 'text-[#8A94A6] hover:text-[#E2E8F0]'
                  }`}
                >
                  Chronological Series
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded transition-all cursor-pointer font-medium ${
                    viewMode === 'cards'
                      ? 'bg-violet-600 text-white font-semibold'
                      : 'text-[#8A94A6] hover:text-[#E2E8F0]'
                  }`}
                >
                  Side-By-Side Grid
                </button>
              </div>
            </div>

            {/* MAIN CHART OUTPUT AREA based on active tab state */}
            {viewMode === 'bars' && (
              <div className="space-y-4" id="view-mode-bars">
                <div className="text-[11px] text-[#8A94A6] leading-relaxed flex items-center justify-between">
                  <span>
                    Horizontal bars illustrate key **percentage deviations** of the <strong>{selectedBranch} HEAD</strong> relative to the baseline <strong>main HEAD</strong>.
                  </span>
                  <span className="font-mono text-[10px] text-violet-400 bg-violet-950/20 border border-violet-900/30 px-2 py-0.2 rounded shrink-0">
                    Baseline (0%) = main HEAD
                  </span>
                </div>

                <div className="bg-[#0B0D10] border border-[#22262B] rounded-lg p-5 space-y-5">
                  {selectedMetrics.map((id) => {
                    const metric = metrics.find(m => m.id === id)!;
                    const mainVal = mainHeadCommit.metrics[id] ?? 0;
                    const branchVal = branchHeadCommit ? (branchHeadCommit.metrics[id] ?? 0) : mainVal;

                    // Calculate delta percentage relative to main
                    const ratio = mainVal === 0 ? 0 : ((branchVal - mainVal) / mainVal) * 100;
                    const isImprovement = metric.direction === 'minimize' ? ratio < 0 : ratio > 0;
                    
                    // Visual bar settings Cap ratio physically for robust rendering
                    const displayRatio = Math.max(-100, Math.min(ratio, 100));
                    const isZero = Math.abs(ratio) < 0.0001;

                    return (
                      <div key={id} className="space-y-1.5 font-sans">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                          <span className="font-semibold text-white flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: METRIC_COLORS[id] }} />
                            {metric.name}
                          </span>
                          <div className="font-mono text-[11px] flex gap-2">
                            <span className="text-[#8A94A6]">main: <strong className="text-zinc-250 font-normal">{mainVal} {metric.unit}</strong></span>
                            <span className="text-[#31373E]">•</span>
                            <span className="text-violet-400">{selectedBranch}: <strong className="text-white font-bold">{branchVal} {metric.unit}</strong></span>
                          </div>
                        </div>

                        {/* Bidirectional bar representing delta */}
                        <div className="relative h-7 bg-[#13161B] border border-[#22262B]/75 rounded overflow-hidden flex items-center px-4 justify-between">
                          
                          {/* Centered vertical 0% timeline guideline */}
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-700/40 z-10" />

                          {/* Dynamic bar left or right */}
                          {!isZero && (
                            <div 
                              className={`absolute top-0 bottom-0 transition-all duration-300 ${
                                isImprovement ? 'bg-emerald-500/10 border-y border-emerald-500/30' : 'bg-rose-500/10 border-y border-rose-500/30'
                              }`}
                              style={{
                                left: displayRatio < 0 ? `${50 - Math.abs(displayRatio) / 2}%` : '50%',
                                right: displayRatio > 0 ? `${50 - Math.abs(displayRatio) / 2}%` : '50%',
                                width: `${Math.abs(displayRatio) / 2}%`,
                                borderRight: displayRatio > 0 ? `2.5px solid ${isImprovement ? '#10B981' : '#EF4444'}` : 'none',
                                borderLeft: displayRatio < 0 ? `2.5px solid ${isImprovement ? '#10B981' : '#EF4444'}` : 'none'
                              }}
                            />
                          )}

                          {/* Detail indicators */}
                          <span className="text-[10.5px] font-mono text-[#8A94A6] select-all truncate max-w-[200px] sm:max-w-xs z-20">
                            {ratio > 0 ? '+' : ''}{ratio.toFixed(1)}% {isImprovement ? 'improvement' : 'regression'}
                          </span>

                          <span className={`text-[10.5px] font-mono font-bold z-20 shrink-0 ${
                            isZero ? 'text-[#8A94A6]' : isImprovement ? 'text-emerald-450' : 'text-rose-450'
                          }`}>
                            {isZero ? 'No Change' : isImprovement ? '▲ Improvement' : '▼ Regression'}
                          </span>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {viewMode === 'trend' && (
              <div className="space-y-4" id="view-mode-trend">
                <div className="text-[11px] text-[#8A94A6] leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    Chronological line sequences overlaying both <strong>main</strong> (solid lines) and <strong>{selectedBranch}</strong> (dashed segments) telemetry values.
                  </span>
                  <div className="flex gap-4 shrink-0 text-[10px] font-mono bg-[#0B0D10] border border-[#22262B] rounded px-3 py-1 text-[#E2E8F0]">
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-6 bg-violet-500 inline-block" /> Solid = Main</span>
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-6 border-b border-dashed border-amber-500 inline-block" /> Dashed = Feature</span>
                  </div>
                </div>

                <div className="h-56 bg-[#0B0D10] border border-[#22262B] rounded-lg p-4 relative overflow-hidden flex flex-col justify-end">
                  {/* Dynamic Multi-Line Graph plotting */}
                  {(() => {
                    // Create normalized coordinates for lines, avoiding scale overlapping on different dimensions
                    const getY = (val: number, id: string) => {
                      const values = chronologicalDisplay
                        .map(c => c.metrics[id])
                        .filter(v => v !== undefined) as number[];

                      if (values.length === 0) return 60;
                      const max = Math.max(...values) * 1.05;
                      const min = Math.min(...values) * 0.95;
                      const range = max - min || 1;
                      // scale y coordinate to fall between 20 (top) and 130 (bottom) in a 150 SVG frame
                      return 130 - ((val - min) / range) * 110;
                    };

                    return (
                      <svg width="600" height="160" className="overflow-visible w-full select-none">
                        {/* Horizontal guide rows */}
                        <line x1="30" y1="20" x2="570" y2="20" stroke="#1D2128" strokeWidth="0.8" />
                        <line x1="30" y1="75" x2="570" y2="75" stroke="#1D2128" strokeWidth="0.8" />
                        <line x1="30" y1="130" x2="570" y2="130" stroke="#1D2128" strokeWidth="0.8" />

                        {selectedMetrics.map((metricId) => {
                          const color = METRIC_COLORS[metricId] || '#A7B1C1';
                          
                          // Segment 1: Main trend (continuous line)
                          const mainPoints = chronologicalDisplay
                            .filter(c => c.branch === 'main' || c.branch === 'master')
                            .map(c => {
                              const node = dNodes.find(n => n.hash === c.hash)!;
                              const val = c.metrics[metricId] ?? 0;
                              return { x: node.x, y: getY(val, metricId), commit: node.short, val };
                            });

                          // Segment 2: Feature branch fork out and line
                          const featurePoints = chronologicalDisplay
                            .filter(c => c.branch === selectedBranch)
                            .map(c => {
                              const node = dNodes.find(n => n.hash === c.hash)!;
                              const val = c.metrics[metricId] ?? 0;
                              return { x: node.x, y: getY(val, metricId), commit: node.short, val };
                            });

                          // Create SVG line structures
                          const mainD = mainPoints.length > 0 
                            ? `M ${mainPoints.map(p => `${p.x},${p.y}`).join(' L ')}` 
                            : '';

                          // Plot connections for feature branch
                          let featureD = '';
                          if (featurePoints.length > 0 && mainPoints.length > 0) {
                            // find chronological parent on main path
                            const firstFeat = featurePoints[0];
                            const parentM = [...mainPoints].filter(p => p.x < firstFeat.x).pop();
                            
                            if (parentM) {
                              const segmentPoints = [parentM, ...featurePoints];
                              const nextM = [...mainPoints].filter(p => p.x > firstFeat.x)[0];
                              if (nextM) segmentPoints.push(nextM);
                              featureD = `M ${segmentPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
                            }
                          }

                          return (
                            <g key={metricId}>
                              {/* Main Line */}
                              {mainD && (
                                <path 
                                  d={mainD} 
                                  fill="none" 
                                  stroke={color} 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  className="transition-all"
                                />
                              )}

                              {/* Feature Line */}
                              {featureD && (
                                <path 
                                  d={featureD} 
                                  fill="none" 
                                  stroke={color} 
                                  strokeWidth="1.8" 
                                  strokeDasharray="4 3" 
                                  strokeLinecap="round" 
                                  className="opacity-90"
                                />
                              )}

                              {/* Point circles */}
                              {mainPoints.map((p, pIdx) => (
                                <circle 
                                  key={`main-circle-${pIdx}`}
                                  cx={p.x} 
                                  cy={p.y} 
                                  r="3" 
                                  fill={color} 
                                  className="hover:r-5 cursor-pointer transition-all"
                                />
                              ))}

                              {featurePoints.map((p, pIdx) => (
                                <circle 
                                  key={`feat-circle-${pIdx}`}
                                  cx={p.x} 
                                  cy={p.y} 
                                  r="3" 
                                  fill={color} 
                                  stroke="#0B0D10"
                                  strokeWidth="1"
                                  className="hover:r-5 cursor-pointer transition-all"
                                />
                              ))}
                            </g>
                          );
                        })}

                        {/* Chart Bottom Label Indexes */}
                        {chronologicalDisplay.map((commit, cIdx) => {
                          const node = dNodes.find(n => n.hash === commit.hash)!;
                          const isFeature = commit.branch === selectedBranch;

                          return (
                            <g key={`lbl-${cIdx}`}>
                              <text 
                                x={node.x} 
                                y="152" 
                                fill={isFeature ? '#F59E0B' : '#8A94A6'} 
                                className="text-[8.5px] font-mono tracking-tight" 
                                textAnchor="middle"
                              >
                                {node.short}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </div>
            )}

            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="view-mode-cards">
                {selectedMetrics.map((id) => {
                  const metric = metrics.find(m => m.id === id)!;
                  const mainVal = mainHeadCommit.metrics[id] ?? 0;
                  const branchVal = branchHeadCommit ? (branchHeadCommit.metrics[id] ?? 0) : mainVal;

                  const ratio = mainVal === 0 ? 0 : ((branchVal - mainVal) / mainVal) * 100;
                  const isImprovement = metric.direction === 'minimize' ? ratio < 0 : ratio > 0;
                  const absDiff = Math.abs(branchVal - mainVal);

                  return (
                    <div key={id} className="bg-[#0B0D10] border border-[#22262B] rounded-lg p-4 flex flex-col justify-between space-y-4">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: METRIC_COLORS[id] }} />
                          <h4 className="text-xs font-semibold text-[#E2E8F0] truncate my-0">{metric.name}</h4>
                        </div>
                        <span className="text-[10px] bg-[#13161B] border border-[#22262B] text-[#8A94A6] px-2 py-0.5 rounded font-mono uppercase shrink-0">
                          {metric.category}
                        </span>
                      </div>

                      {/* Score comparison gauge */}
                      <div className="grid grid-cols-2 gap-4 pt-1 font-sans">
                        <div className="bg-[#13161B] p-2.5 rounded border border-[#22262B]/50">
                          <div className="text-[9px] text-[#4F5B70] uppercase">main HEAD</div>
                          <div className="text-sm font-extrabold text-[#E2E8F0] font-mono mt-1 font-tabular">
                            {mainVal} <span className="text-[10px] text-[#8A94A6] font-normal font-sans">{metric.unit}</span>
                          </div>
                        </div>

                        <div className="bg-[#13161B] p-2.5 rounded border border-[#22262B]/50">
                          <div className="text-[9px] text-[#4F5B70] uppercase">{selectedBranch}</div>
                          <div className="text-sm font-extrabold text-violet-400 font-mono mt-1 font-tabular">
                            {branchVal} <span className="text-[10px] text-[#8A94A6] font-normal font-sans">{metric.unit}</span>
                          </div>
                        </div>
                      </div>

                      {/* Meter gauge representation */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-mono text-[#4F5B70]">
                          <span>0 {metric.unit}</span>
                          <span>Max Scale</span>
                        </div>
                        <div className="h-2 bg-[#13161B] rounded overflow-hidden relative border border-[#22262B]/50">
                          {/* Main baseline marker */}
                          <div 
                            className="absolute top-0 bottom-0 bg-violet-600/40 border-r border-violet-500 transition-all rounded-l"
                            style={{ width: `${Math.min(100, (mainVal / (Math.max(mainVal, branchVal) * 1.1)) * 100)}%` }}
                          />
                          {/* Feature point pin */}
                          <div 
                            className="absolute top-0 bottom-0 border-r-2 border-amber-500 transition-all z-10"
                            style={{ left: `${Math.min(100, (branchVal / (Math.max(mainVal, branchVal) * 1.1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Comparative Delta Indicators */}
                      <div className="border-t border-[#1D2128] pt-3 flex items-center justify-between">
                        <span className="text-[10.5px] text-[#4F5B70]">Sequence Divergence:</span>

                        {Math.abs(ratio) < 0.0001 ? (
                          <div className="bg-[#1E232B] border border-[#22262B] text-[#8A94A6] text-[10px] font-mono px-2 py-0.5 rounded font-tabular">No Change</div>
                        ) : isImprovement ? (
                          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10.5px] px-2.5 py-0.5 rounded font-semibold font-tabular">
                            <span>Improved: -{absDiff.toFixed(2)} ({ratio.toFixed(1)}%)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10.5px] px-2.5 py-0.5 rounded font-semibold font-tabular">
                            <span>Regressed: +{absDiff.toFixed(2)} (+{ratio.toFixed(1)}%)</span>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* RIGHT COLUMN: SIDE DETAIL BOX FOR SELECTED COMMIT */}
        <div className="lg:col-span-4 bg-[#13161B] border border-[#22262B] rounded-lg p-5 flex flex-col justify-between" id="commit-inspect-drawer">
          
          <div className="space-y-4">
            <div className="border-b border-[#22262B] pb-3">
              <div className="text-[10px] uppercase font-bold text-[#8A94A6] tracking-wider font-sans">Commit Inspector</div>
              <h3 className="text-sm font-semibold text-[#E2E8F0] font-sans mt-0.5">Telemetry Impact Analysis</h3>
            </div>

            {/* SELECT COMMIT DROPDOWN */}
            <div className="bg-[#0B0D10] border border-[#22262B] rounded-lg p-3 space-y-1.5 font-sans">
              <label className="text-[10px] uppercase font-semibold text-[#8A94A6] tracking-wider flex items-center gap-1">
                <GitCommit className="w-3.5 h-3.5 text-violet-400 font-bold" /> Select Commit to Inspect
              </label>
              <div className="relative">
                <select
                  value={activeCommit.hash}
                  onChange={(e) => setSelectedCommitHash(e.target.value)}
                  className="w-full bg-[#13161B] border border-[#22262B] text-xs text-[#E2E8F0] px-3 py-2 pr-8 rounded font-semibold focus:border-violet-500/80 outline-none cursor-pointer appearance-none"
                >
                  {displayCommits.map(c => {
                    const isMain = c.branch === 'main' || c.branch === 'master';
                    return (
                      <option key={c.hash} value={c.hash}>
                        [{isMain ? 'main' : c.branch.split('/').pop()}] {c.shortHash} — {c.message.substring(0, 24)}...
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-2.5 top-3.5 h-3.5 w-3.5 text-[#8A94A6] pointer-events-none" />
              </div>
            </div>

            <div className="bg-[#0B0D10] border border-[#22262B] rounded-lg p-3 space-y-3 font-sans">
              
              <div className="flex items-center gap-2.5">
                <img 
                  src={activeCommit.avatarUrl} 
                  alt={activeCommit.author} 
                  className="w-8 h-8 rounded-full border border-[#22262B] object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[#E2E8F0] truncate">{activeCommit.author}</div>
                  <div className="text-[10px] text-[#8A94A6] font-mono truncate">{activeCommit.hash}</div>
                </div>
              </div>

              <div className="border-t border-[#1E232B] pt-2 space-y-1">
                <div className="text-[10px] text-[#8A94A6] font-mono uppercase">Git Log Message</div>
                <div className="text-xs text-[#E2E8F0] leading-relaxed select-text font-sans">
                  {activeCommit.message}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-[#1E232B] pt-2 text-[10px]">
                <div>
                  <div className="text-[#8A94A6] font-mono uppercase">Branch Context</div>
                  <div className="text-[#E2E8F0] mt-0.5 flex items-center gap-1 font-semibold truncate">
                    <GitBranch className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="truncate">{activeCommit.branch}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[#8A94A6] font-mono uppercase">Timestamp</div>
                  <div className="text-[#E2E8F0] mt-0.5 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-[#4F5B70] shrink-0" />
                    <span className="truncate">{activeCommit.date}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* SELECTION DELTA STATUS BADGES FOR EVERY CHECKED METRIC ON THIS SPECIFIC COMMIT */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider font-sans flex items-center justify-between">
                <span>Selected Metrics Deltas</span>
                <span className="font-mono text-[9px] text-[#4F5B70]">vs parent node</span>
              </div>

              <div className="space-y-2.5">
                {selectedMetrics.map((mid) => {
                  const metric = metrics.find(m => m.id === mid)!;
                  const commitVal = activeCommit.metrics[mid];
                  const diffObj = getCommitDelta(activeCommit, mid);

                  return (
                    <div key={mid} className="bg-[#0B0D10] border border-[#22262B] rounded-lg p-3 flex flex-col justify-between gap-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] text-[#8A94A6] truncate">{metric.name}</span>
                        <span className="font-mono text-xs font-semibold text-white font-tabular shrink-0">
                          {commitVal !== undefined ? `${commitVal} ${metric.unit}` : 'N/A'}
                        </span>
                      </div>

                      <div className="border-t border-[#22262B]/50 pt-2 flex items-center justify-between gap-1">
                        <span className="text-[9.5px] text-[#4F5B70] shrink-0">Step Change:</span>
                        
                        {diffObj.direction === 'improve' ? (
                          <div className="flex items-center gap-1 bg-emerald-500/5 border border-emerald-500/15 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded font-semibold font-tabular truncate max-w-[170px]">
                            <span>Improved: {diffObj.formatted}</span>
                          </div>
                        ) : diffObj.direction === 'regress' ? (
                          <div className="flex items-center gap-1 bg-rose-500/5 border border-rose-500/15 text-rose-400 font-mono text-[10px] px-2 py-0.5 rounded font-semibold font-tabular truncate max-w-[170px]">
                            <span>Regressed: {diffObj.formatted}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-[#1E232B] border border-[#22262B] text-[#8A94A6] font-mono text-[9.5px] px-2 py-0.5 rounded font-tabular shrink-0">
                            <span>{diffObj.formatted}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FULL COMPACT TELEMETRY MAP */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider font-sans">Commit Telemetry Snapshot</div>
              <div className="bg-[#0B0D10] border border-[#22262B] rounded-lg overflow-hidden divide-y divide-[#1E232B]/55">
                {metrics.map(m => {
                  const mVal = activeCommit.metrics[m.id];
                  return (
                    <div key={m.id} className="p-2 flex items-center justify-between text-[10.5px] font-sans">
                      <span className="text-[#8A94A6] truncate pr-2">{m.name}</span>
                      <span className="font-mono text-white shrink-0 font-tabular">
                        {mVal !== undefined ? `${mVal} ${m.unit}` : 'Not Tracked'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          <div className="border-t border-[#22262B] pt-4 mt-6 flex items-center justify-between text-[10px] text-[#4F5B70] font-sans">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" /> regression checks active on branch nodes
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
