import React, { useState } from 'react';
import { Commit, MetricDefinition } from '../types';
import {
  GitBranch, GitCommit, ChevronDown, Info, Clock,
  BarChart3, Sliders, Check
} from 'lucide-react';

interface GitGraphProps {
  commits: Commit[];
  metrics: MetricDefinition[];
}

const METRIC_COLORS: Record<string, string> = {
  'api-feed-latency':   '#8B5CF6',
  'bundle-size-main':   '#0EA5E9',
  'test-coverage':      '#10B981',
  'db-pool-exhaustion': '#F59E0B',
  'cache-hit-rate':     '#EF4444',
  'llm-inference-cost': '#14B8A6'
};

export default function GitGraph({ commits, metrics }: GitGraphProps) {
  const availableBranches = Array.from(
    new Set(commits.map(c => c.branch).filter(b => b !== 'main' && b !== 'master'))
  );

  const [selectedBranch, setSelectedBranch] = useState<string>(
    availableBranches.includes('feature/carousel-v2')
      ? 'feature/carousel-v2'
      : availableBranches[0] || 'feature/carousel-v2'
  );
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['api-feed-latency', 'bundle-size-main']);
  const [selectedCommitHash, setSelectedCommitHash] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'bars' | 'trend' | 'cards'>('bars');

  const handleToggleMetric = (metricId: string) => {
    setSelectedMetrics(prev => {
      if (prev.includes(metricId)) {
        if (prev.length <= 1) return prev;
        return prev.filter(id => id !== metricId);
      }
      return [...prev, metricId];
    });
  };

  const mainCommits = commits.filter(c => c.branch === 'main' || c.branch === 'master');
  const mainHeadCommit = [...mainCommits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || commits[0];
  const branchCommits = commits.filter(c => c.branch === selectedBranch);
  const branchHeadCommit = [...branchCommits].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] || null;

  const displayCommits = commits.filter(c => c.branch === 'main' || c.branch === 'master' || c.branch === selectedBranch);
  const chronologicalDisplay = [...displayCommits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const dNodes = chronologicalDisplay.map((commit, index) => {
    const isMain = commit.branch === 'main' || commit.branch === 'master';
    return {
      hash: commit.hash,
      short: commit.shortHash,
      x: 60 + index * 105,
      y: isMain ? 40 : 100,
      branch: commit.branch,
      color: isMain ? '#6366f1' : '#F59E0B',
      commitObj: commit
    };
  });

  const activeCommit = commits.find(c => c.hash === selectedCommitHash) || displayCommits[0] || commits[0];

  const getCommitDelta = (commit: Commit, metricId: string): { deltaVal: number; direction: 'improve' | 'regress' | 'neutral'; formatted: string } => {
    const targetMetric = metrics.find(m => m.id === metricId);
    if (!targetMetric) return { deltaVal: 0, direction: 'neutral', formatted: '0' };

    const currentVal = commit.metrics[metricId];
    if (currentVal === undefined) return { deltaVal: 0, direction: 'neutral', formatted: '—' };

    const branchCommitsFiltered = chronologicalDisplay.filter(c => c.branch === commit.branch || c.branch === 'main');
    const commitIdx = branchCommitsFiltered.findIndex(c => c.hash === commit.hash);
    if (commitIdx <= 0) return { deltaVal: 0, direction: 'neutral', formatted: 'Baseline' };

    const prevCommit = branchCommitsFiltered[commitIdx - 1];
    const prevVal = prevCommit.metrics[metricId];
    if (prevVal === undefined) return { deltaVal: 0, direction: 'neutral', formatted: '—' };

    const delta = currentVal - prevVal;
    if (Math.abs(delta) < 0.00001) return { deltaVal: 0, direction: 'neutral', formatted: 'no change' };

    const isImprovement = targetMetric.direction === 'minimize' ? delta < 0 : delta > 0;
    const pct = ((Math.abs(delta) / prevVal) * 100).toFixed(1);
    const sign = delta > 0 ? '+' : '';
    const formatted = `${sign}${parseFloat(delta.toFixed(4))} ${targetMetric.unit} (${delta > 0 ? '▲' : '▼'}${pct}%)`;

    return { deltaVal: delta, direction: isImprovement ? 'improve' : 'regress', formatted };
  };

  return (
    <div className="space-y-5 animate-fade-in text-left font-sans" id="git-graph-section">

      {/* HEADER CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 bg-[var(--surface)] border border-[var(--border)] rounded-lg items-start">

        <div className="md:col-span-4 space-y-1">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[var(--accent-text)]" />
            <h2 className="text-sm font-semibold text-[var(--text-1)]">Branch Divergence Telemetry</h2>
          </div>
          <p className="text-[11px] text-[var(--text-2)] leading-relaxed">
            Select a feature branch to compare alongside main and choose which telemetry metrics to plot.
          </p>

          <div className="pt-3 flex flex-col gap-2">
            <label className="text-[10px] uppercase font-semibold text-[var(--text-3)] tracking-wider">Comparison Branch</label>
            <div className="relative">
              <select
                value={selectedBranch}
                onChange={(e) => { setSelectedBranch(e.target.value); setSelectedCommitHash(null); }}
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-xs text-[var(--text-1)] px-3 py-2 pr-8 rounded font-medium focus:border-[var(--accent)] outline-none cursor-pointer appearance-none transition-colors"
              >
                {availableBranches.map(br => <option key={br} value={br}>{br}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-3 h-3.5 w-3.5 text-[var(--text-2)] pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="md:col-span-8 space-y-2 border-t md:border-t-0 md:border-l border-[var(--border)] pt-4 md:pt-0 md:pl-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-[var(--text-2)] tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-[var(--accent-text)]" /> Metrics to Compare
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <button onClick={() => setSelectedMetrics(metrics.map(m => m.id))} className="text-[var(--accent-text)] hover:underline font-medium cursor-pointer">All</button>
              <span className="text-[var(--border-2)]">|</span>
              <button onClick={() => metrics.length > 0 && setSelectedMetrics([metrics[0].id])} className="text-[var(--text-2)] hover:text-[var(--text-1)] cursor-pointer">Reset</button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {metrics.map(m => {
              const isSelected = selectedMetrics.includes(m.id);
              const color = METRIC_COLORS[m.id] || '#a1a1aa';
              return (
                <button
                  key={m.id}
                  onClick={() => handleToggleMetric(m.id)}
                  className={`p-2.5 rounded border text-left cursor-pointer transition-all flex flex-col justify-between gap-1 text-[11px] ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--text-1)]'
                      : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text-1)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium truncate pr-1">{m.name}</span>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${isSelected ? '' : 'opacity-40'}`} style={{ backgroundColor: color }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-3)]">
                    <span>{m.unit}</span>
                    {isSelected && <span className="text-[var(--accent-text)] flex items-center gap-0.5 text-[9px]"><Check className="w-2.5 h-2.5" /></span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* TWO COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

        {/* LEFT: COMPARATOR */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--border)] gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent-text)]" />
                <h3 className="text-xs font-semibold text-[var(--text-1)]">Branch Comparison Workspace</h3>
              </div>

              <div className="bg-[var(--bg)] border border-[var(--border)] p-0.5 rounded flex text-[10.5px]">
                {(['bars', 'trend', 'cards'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded transition-colors cursor-pointer font-medium capitalize ${
                      viewMode === mode
                        ? 'bg-[var(--accent)] text-white'
                        : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
                    }`}
                  >
                    {mode === 'bars' ? 'Delta Bars' : mode === 'trend' ? 'Time Series' : 'Side-by-Side'}
                  </button>
                ))}
              </div>
            </div>

            {/* BARS VIEW */}
            {viewMode === 'bars' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-2)]">
                  <span>Percentage deviation of <strong className="text-[var(--text-1)]">{selectedBranch}</strong> relative to <strong className="text-[var(--text-1)]">main HEAD</strong>.</span>
                  <span className="font-mono text-[10px] text-[var(--accent-text)] bg-[var(--accent-subtle)] border border-[var(--accent-border)] px-2 py-0.5 rounded shrink-0">
                    0% = main HEAD
                  </span>
                </div>

                <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 space-y-5">
                  {selectedMetrics.map((id) => {
                    const metric = metrics.find(m => m.id === id)!;
                    const mainVal = mainHeadCommit.metrics[id] ?? 0;
                    const branchVal = branchHeadCommit ? (branchHeadCommit.metrics[id] ?? 0) : mainVal;
                    const ratio = mainVal === 0 ? 0 : ((branchVal - mainVal) / mainVal) * 100;
                    const isImprovement = metric.direction === 'minimize' ? ratio < 0 : ratio > 0;
                    const displayRatio = Math.max(-100, Math.min(ratio, 100));
                    const isZero = Math.abs(ratio) < 0.0001;

                    return (
                      <div key={id} className="space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                          <span className="font-medium text-[var(--text-1)] flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: METRIC_COLORS[id] }} />
                            {metric.name}
                          </span>
                          <div className="font-mono text-[11px] flex gap-2 text-[var(--text-2)]">
                            <span>main: <strong className="text-[var(--text-1)] font-normal">{mainVal} {metric.unit}</strong></span>
                            <span className="text-[var(--border-2)]">•</span>
                            <span className="text-[var(--accent-text)]">{selectedBranch.split('/').pop()}: <strong className="text-[var(--text-1)]">{branchVal} {metric.unit}</strong></span>
                          </div>
                        </div>

                        <div className="relative h-7 bg-[var(--surface)] border border-[var(--border)] rounded overflow-hidden flex items-center px-4 justify-between">
                          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border-2)] z-10" />
                          {!isZero && (
                            <div
                              className={`absolute top-0 bottom-0 transition-all duration-300 ${
                                isImprovement ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                              }`}
                              style={{
                                left: displayRatio < 0 ? `${50 - Math.abs(displayRatio) / 2}%` : '50%',
                                width: `${Math.abs(displayRatio) / 2}%`,
                                borderRight: displayRatio > 0 ? `2px solid ${isImprovement ? '#10B981' : '#F43F5E'}` : 'none',
                                borderLeft: displayRatio < 0 ? `2px solid ${isImprovement ? '#10B981' : '#F43F5E'}` : 'none'
                              }}
                            />
                          )}
                          <span className="text-[10.5px] font-mono text-[var(--text-2)] z-20">
                            {ratio > 0 ? '+' : ''}{ratio.toFixed(1)}% {isImprovement ? 'improvement' : 'regression'}
                          </span>
                          <span className={`text-[10.5px] font-mono font-semibold z-20 shrink-0 ${
                            isZero ? 'text-[var(--text-2)]' : isImprovement ? 'text-emerald-500' : 'text-rose-500'
                          }`}>
                            {isZero ? 'No change' : isImprovement ? '▲ Better' : '▼ Worse'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TREND VIEW */}
            {viewMode === 'trend' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[var(--text-2)]">
                  <span>
                    Chronological series for <strong className="text-[var(--text-1)]">main</strong> (solid) and <strong className="text-[var(--text-1)]">{selectedBranch}</strong> (dashed).
                  </span>
                  <div className="flex gap-4 shrink-0 text-[10px] font-mono bg-[var(--bg)] border border-[var(--border)] rounded px-3 py-1 text-[var(--text-1)]">
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-[var(--accent)] inline-block rounded" /> Main</span>
                    <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 border-b border-dashed border-amber-400 inline-block" /> Feature</span>
                  </div>
                </div>

                <div className="h-56 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 relative overflow-hidden flex flex-col justify-end">
                  {(() => {
                    const getY = (val: number, id: string) => {
                      const values = chronologicalDisplay.map(c => c.metrics[id]).filter(v => v !== undefined) as number[];
                      if (values.length === 0) return 60;
                      const max = Math.max(...values) * 1.05;
                      const min = Math.min(...values) * 0.95;
                      const range = max - min || 1;
                      return 130 - ((val - min) / range) * 110;
                    };

                    return (
                      <svg width="600" height="160" className="overflow-visible w-full select-none">
                        <line x1="30" y1="20" x2="570" y2="20" stroke="var(--border)" strokeWidth="0.8" />
                        <line x1="30" y1="75" x2="570" y2="75" stroke="var(--border)" strokeWidth="0.8" />
                        <line x1="30" y1="130" x2="570" y2="130" stroke="var(--border)" strokeWidth="0.8" />

                        {selectedMetrics.map((metricId) => {
                          const color = METRIC_COLORS[metricId] || '#a1a1aa';
                          const mainPoints = chronologicalDisplay
                            .filter(c => c.branch === 'main' || c.branch === 'master')
                            .map(c => {
                              const node = dNodes.find(n => n.hash === c.hash)!;
                              return { x: node.x, y: getY(c.metrics[metricId] ?? 0, metricId), commit: node.short };
                            });

                          const featurePoints = chronologicalDisplay
                            .filter(c => c.branch === selectedBranch)
                            .map(c => {
                              const node = dNodes.find(n => n.hash === c.hash)!;
                              return { x: node.x, y: getY(c.metrics[metricId] ?? 0, metricId), commit: node.short };
                            });

                          const mainD = mainPoints.length > 0 ? `M ${mainPoints.map(p => `${p.x},${p.y}`).join(' L ')}` : '';

                          let featureD = '';
                          if (featurePoints.length > 0 && mainPoints.length > 0) {
                            const firstFeat = featurePoints[0];
                            const parentM = [...mainPoints].filter(p => p.x < firstFeat.x).pop();
                            if (parentM) {
                              const segPoints = [parentM, ...featurePoints];
                              const nextM = [...mainPoints].filter(p => p.x > firstFeat.x)[0];
                              if (nextM) segPoints.push(nextM);
                              featureD = `M ${segPoints.map(p => `${p.x},${p.y}`).join(' L ')}`;
                            }
                          }

                          return (
                            <g key={metricId}>
                              {mainD && <path d={mainD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />}
                              {featureD && <path d={featureD} fill="none" stroke={color} strokeWidth="1.8" strokeDasharray="4 3" strokeLinecap="round" className="opacity-80" />}
                              {mainPoints.map((p, pIdx) => <circle key={pIdx} cx={p.x} cy={p.y} r="3" fill={color} />)}
                              {featurePoints.map((p, pIdx) => <circle key={pIdx} cx={p.x} cy={p.y} r="3" fill={color} stroke="var(--bg)" strokeWidth="1.5" />)}
                            </g>
                          );
                        })}

                        {chronologicalDisplay.map((commit, cIdx) => {
                          const node = dNodes.find(n => n.hash === commit.hash)!;
                          const isFeature = commit.branch === selectedBranch;
                          return (
                            <text key={cIdx} x={node.x} y="152" fill={isFeature ? '#F59E0B' : 'var(--text-3)'}
                              className="text-[8.5px] font-mono" textAnchor="middle">
                              {node.short}
                            </text>
                          );
                        })}
                      </svg>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* CARDS VIEW */}
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedMetrics.map((id) => {
                  const metric = metrics.find(m => m.id === id)!;
                  const mainVal = mainHeadCommit.metrics[id] ?? 0;
                  const branchVal = branchHeadCommit ? (branchHeadCommit.metrics[id] ?? 0) : mainVal;
                  const ratio = mainVal === 0 ? 0 : ((branchVal - mainVal) / mainVal) * 100;
                  const isImprovement = metric.direction === 'minimize' ? ratio < 0 : ratio > 0;
                  const absDiff = Math.abs(branchVal - mainVal);

                  return (
                    <div key={id} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: METRIC_COLORS[id] }} />
                          <h4 className="text-xs font-semibold text-[var(--text-1)] truncate">{metric.name}</h4>
                        </div>
                        <span className="text-[10px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-2)] px-2 py-0.5 rounded font-mono uppercase shrink-0">
                          {metric.category}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[var(--surface)] p-2.5 rounded border border-[var(--border)]">
                          <div className="text-[9px] text-[var(--text-3)] uppercase">main</div>
                          <div className="text-sm font-bold text-[var(--text-1)] font-mono mt-1 font-tabular">
                            {mainVal} <span className="text-[10px] text-[var(--text-2)] font-normal">{metric.unit}</span>
                          </div>
                        </div>
                        <div className="bg-[var(--surface)] p-2.5 rounded border border-[var(--border)]">
                          <div className="text-[9px] text-[var(--text-3)] uppercase">{selectedBranch.split('/').pop()}</div>
                          <div className="text-sm font-bold text-[var(--accent-text)] font-mono mt-1 font-tabular">
                            {branchVal} <span className="text-[10px] text-[var(--text-2)] font-normal">{metric.unit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="h-1.5 bg-[var(--surface)] rounded overflow-hidden border border-[var(--border)]">
                          <div
                            className="h-full bg-[var(--accent)]/40 rounded-l"
                            style={{ width: `${Math.min(100, (mainVal / (Math.max(mainVal, branchVal) * 1.1)) * 100)}%` }}
                          />
                        </div>
                      </div>

                      <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-3)]">Divergence:</span>
                        {Math.abs(ratio) < 0.0001 ? (
                          <div className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] text-[10px] font-mono px-2 py-0.5 rounded font-tabular">No change</div>
                        ) : isImprovement ? (
                          <div className="bg-emerald-500/8 border border-emerald-500/20 text-emerald-500 font-mono text-[10.5px] px-2 py-0.5 rounded font-semibold font-tabular">
                            Improved −{absDiff.toFixed(2)} ({ratio.toFixed(1)}%)
                          </div>
                        ) : (
                          <div className="bg-rose-500/8 border border-rose-500/20 text-rose-500 font-mono text-[10.5px] px-2 py-0.5 rounded font-semibold font-tabular">
                            Regressed +{absDiff.toFixed(2)} ({ratio.toFixed(1)}%)
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

        {/* RIGHT: COMMIT INSPECTOR */}
        <div className="lg:col-span-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[var(--border)] pb-3">
              <div className="text-[10px] uppercase font-medium text-[var(--text-3)] tracking-wider">Commit Inspector</div>
              <h3 className="text-sm font-semibold text-[var(--text-1)] mt-0.5">Telemetry Impact</h3>
            </div>

            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-1.5">
              <label className="text-[10px] uppercase font-medium text-[var(--text-2)] tracking-wider flex items-center gap-1">
                <GitCommit className="w-3.5 h-3.5 text-[var(--accent-text)]" /> Select Commit
              </label>
              <div className="relative">
                <select
                  value={activeCommit.hash}
                  onChange={(e) => setSelectedCommitHash(e.target.value)}
                  className="w-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-1)] px-3 py-2 pr-8 rounded font-medium focus:border-[var(--accent)] outline-none cursor-pointer appearance-none transition-colors"
                >
                  {displayCommits.map(c => {
                    const isMain = c.branch === 'main' || c.branch === 'master';
                    return (
                      <option key={c.hash} value={c.hash}>
                        [{isMain ? 'main' : c.branch.split('/').pop()}] {c.shortHash} — {c.message.substring(0, 22)}...
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-2.5 top-3.5 h-3.5 w-3.5 text-[var(--text-2)] pointer-events-none" />
              </div>
            </div>

            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeCommit.avatarUrl}
                  alt={activeCommit.author}
                  className="w-8 h-8 rounded-full border border-[var(--border)] object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-[var(--text-1)] truncate">{activeCommit.author}</div>
                  <div className="text-[10px] text-[var(--text-2)] font-mono truncate">{activeCommit.shortHash}</div>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-2 space-y-1">
                <div className="text-[10px] text-[var(--text-3)] font-mono uppercase">Commit message</div>
                <div className="text-xs text-[var(--text-1)] leading-relaxed select-text">{activeCommit.message}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-[var(--border)] pt-2 text-[10px]">
                <div>
                  <div className="text-[var(--text-3)] font-mono uppercase">Branch</div>
                  <div className="text-[var(--text-1)] mt-0.5 flex items-center gap-1 font-medium truncate">
                    <GitBranch className="w-3 h-3 text-[var(--accent-text)] shrink-0" />
                    <span className="truncate">{activeCommit.branch}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[var(--text-3)] font-mono uppercase">Timestamp</div>
                  <div className="text-[var(--text-1)] mt-0.5 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-[var(--text-3)] shrink-0" />
                    <span className="truncate">{activeCommit.date}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Metric deltas */}
            <div className="space-y-2">
              <div className="text-[10px] font-medium text-[var(--text-2)] uppercase tracking-wider flex items-center justify-between">
                <span>Metric Deltas</span>
                <span className="font-mono text-[9px] text-[var(--text-3)]">vs parent</span>
              </div>

              <div className="space-y-2">
                {selectedMetrics.map((mid) => {
                  const metric = metrics.find(m => m.id === mid)!;
                  const commitVal = activeCommit.metrics[mid];
                  const diffObj = getCommitDelta(activeCommit, mid);

                  return (
                    <div key={mid} className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] text-[var(--text-2)] truncate">{metric.name}</span>
                        <span className="font-mono text-xs font-semibold text-[var(--text-1)] font-tabular shrink-0">
                          {commitVal !== undefined ? `${commitVal} ${metric.unit}` : 'N/A'}
                        </span>
                      </div>
                      <div className="border-t border-[var(--border)] pt-1.5 flex items-center justify-between gap-1">
                        <span className="text-[9.5px] text-[var(--text-3)] shrink-0">Change:</span>
                        {diffObj.direction === 'improve' ? (
                          <div className="bg-emerald-500/8 border border-emerald-500/15 text-emerald-500 font-mono text-[10px] px-2 py-0.5 rounded font-semibold font-tabular truncate max-w-[170px]">
                            {diffObj.formatted}
                          </div>
                        ) : diffObj.direction === 'regress' ? (
                          <div className="bg-rose-500/8 border border-rose-500/15 text-rose-500 font-mono text-[10px] px-2 py-0.5 rounded font-semibold font-tabular truncate max-w-[170px]">
                            {diffObj.formatted}
                          </div>
                        ) : (
                          <div className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] font-mono text-[9.5px] px-2 py-0.5 rounded font-tabular shrink-0">
                            {diffObj.formatted}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Full snapshot */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-medium text-[var(--text-2)] uppercase tracking-wider">Commit Snapshot</div>
              <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
                {metrics.map(m => {
                  const mVal = activeCommit.metrics[m.id];
                  return (
                    <div key={m.id} className="p-2 flex items-center justify-between text-[10.5px]">
                      <span className="text-[var(--text-2)] truncate pr-2">{m.name}</span>
                      <span className="font-mono text-[var(--text-1)] shrink-0 font-tabular">
                        {mVal !== undefined ? `${mVal} ${m.unit}` : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4 mt-5 flex items-center text-[10px] text-[var(--text-3)]">
            <Info className="w-3.5 h-3.5 mr-1.5 shrink-0" /> Regression checks active on all branch nodes
          </div>
        </div>

      </div>
    </div>
  );
}
