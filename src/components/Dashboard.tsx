import React, { useState } from 'react';
import { MetricDefinition, Commit } from '../types';
import {
  Search, Play, ArrowUpRight, ArrowDownRight, Check,
  Code, Shield, Activity, CheckCircle2
} from 'lucide-react';

interface DashboardProps {
  metrics: MetricDefinition[];
  commits: Commit[];
  onToggleAgent: (metricId: string) => void;
  selectedMetricId: string;
  setSelectedMetricId: (id: string) => void;
  onTriggerAgentSim: (metricId: string) => void;
  isSimulating: boolean;
}

export default function Dashboard({
  metrics,
  commits,
  onToggleAgent,
  selectedMetricId,
  setSelectedMetricId,
  onTriggerAgentSim,
  isSimulating
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'performance' | 'quality' | 'size' | 'cost'>('all');
  const [sortField, setSortField] = useState<'name' | 'current' | 'trend'>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const selectedMetric = metrics.find(m => m.id === selectedMetricId) || metrics[0];

  const filteredMetrics = metrics.filter(metric => {
    const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          metric.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || metric.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getTrendData = (metric: MetricDefinition) => {
    if (!metric.history || metric.history.length < 2) {
      return { isImprovement: false, isRegression: false, percent: '0.0', rawDiff: 0, valueDiffStr: '0' };
    }
    const values = metric.history.map(h => h.value);
    const first = values[0];
    const last = values[values.length - 1];
    const rawDiff = last - first;
    const percent = first === 0 ? 0 : Math.abs((rawDiff / first) * 100);
    let isImprovement = false;
    let isRegression = false;

    if (rawDiff !== 0) {
      if (metric.direction === 'minimize') {
        isImprovement = rawDiff < 0;
        isRegression = rawDiff > 0;
      } else if (metric.direction === 'maximize') {
        isImprovement = rawDiff > 0;
        isRegression = rawDiff < 0;
      }
    }

    return {
      isImprovement, isRegression,
      percent: percent.toFixed(1),
      rawDiff,
      valueDiffStr: `${rawDiff > 0 ? '+' : ''}${parseFloat(rawDiff.toFixed(4)).toString()}`
    };
  };

  const generateSparkline = (history: { value: number }[], width: number, height: number) => {
    if (!history || history.length < 2) return '';
    const vals = history.map(h => h.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const range = maxVal - minVal || 1;
    const points = history.map((pt, i) => {
      const x = (i / (history.length - 1)) * width;
      const y = height - ((pt.value - minVal) / range) * (height - 6) - 3;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const sortedMetrics = [...filteredMetrics].sort((a, b) => {
    if (sortField === 'name') return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (sortField === 'current') return sortAsc ? a.currentVal - b.currentVal : b.currentVal - a.currentVal;
    if (sortField === 'trend') {
      const tA = parseFloat(getTrendData(a).percent) * (getTrendData(a).isRegression ? 1 : -1);
      const tB = parseFloat(getTrendData(b).percent) * (getTrendData(b).isRegression ? 1 : -1);
      return sortAsc ? tA - tB : tB - tA;
    }
    return 0;
  });

  const handleSort = (field: 'name' | 'current' | 'trend') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const categoryDot: Record<string, string> = {
    performance: 'bg-amber-400',
    size: 'bg-sky-400',
    cost: 'bg-emerald-400',
    quality: 'bg-blue-400',
  };

  return (
    <div className="space-y-5" id="dashboard-root-view">

      {/* STAT STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--border)] border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="bg-[var(--surface)] p-4">
          <div className="text-[10px] font-medium text-[var(--text-3)] uppercase tracking-wider">Active Objectives</div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="font-mono text-xl font-semibold text-[var(--text-1)]">{metrics.length}</span>
            <span className="text-[11px] text-[var(--text-3)]">tracked</span>
          </div>
          <div className="text-[10px] text-[var(--text-3)] mt-0.5">Coverage, latency, costs</div>
        </div>

        <div className="bg-[var(--surface)] p-4">
          <div className="text-[10px] font-medium text-[var(--text-3)] uppercase tracking-wider">Target Branch</div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="font-mono text-sm font-semibold text-[var(--accent-text)] bg-[var(--accent-subtle)] px-2 py-0.5 rounded border border-[var(--accent-border)]">main</span>
          </div>
          <div className="text-[10px] text-[var(--text-3)] mt-0.5">Evaluating pull-requests</div>
        </div>

        <div className="bg-[var(--surface)] p-4">
          <div className="text-[10px] font-medium text-[var(--text-3)] uppercase tracking-wider">Autonomous Pipelines</div>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="font-mono text-xl font-semibold text-emerald-500">
              {metrics.filter(m => m.enabledForAgent).length}
            </span>
            <span className="text-[11px] text-[var(--text-3)]">active</span>
          </div>
          <div className="text-[10px] text-[var(--text-3)] mt-0.5">Auto-optimization loops</div>
        </div>

        <div className="bg-[var(--surface)] p-4">
          <div className="text-[10px] font-medium text-[var(--text-3)] uppercase tracking-wider">Researcher Daemon</div>
          <div className="mt-1.5">
            <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
              isSimulating
                ? 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                : 'text-[var(--text-2)] bg-[var(--surface-2)] border-[var(--border)]'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isSimulating ? 'bg-amber-400 animate-ping' : 'bg-[var(--text-3)]'}`} />
              {isSimulating ? 'Running patch' : 'Idle'}
            </span>
          </div>
          <div className="text-[10px] text-[var(--text-3)] mt-1">Monitoring regressions</div>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">

        {/* OBJECTIVES TABLE */}
        <div className="xl:col-span-7 bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden flex flex-col">
          {/* Table header */}
          <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              <h2 className="text-xs font-semibold text-[var(--text-1)]">Codebase Objectives</h2>
              <span className="text-[10px] bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded font-mono text-[var(--text-3)]">v1.0.4</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[var(--text-3)]" />
                <input
                  type="text"
                  placeholder="Filter objectives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[var(--bg)] border border-[var(--border)] rounded pl-8 pr-3 py-1.5 text-xs text-[var(--text-1)] placeholder-[var(--text-3)] outline-none focus:border-[var(--accent)] w-full sm:w-44 transition-colors"
                />
              </div>

              <div className="flex bg-[var(--bg)] border border-[var(--border)] p-0.5 rounded gap-0.5">
                {(['all', 'performance', 'quality', 'size', 'cost'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize cursor-pointer transition-colors ${
                      categoryFilter === cat
                        ? 'bg-[var(--surface-2)] text-[var(--text-1)]'
                        : 'text-[var(--text-2)] hover:text-[var(--text-1)]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[350px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg)]">
                  <th onClick={() => handleSort('name')} className="p-3 text-[11px] font-medium text-[var(--text-2)] select-none cursor-pointer hover:text-[var(--text-1)] transition-colors">
                    Objective {sortField === 'name' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th className="p-3 text-[11px] font-medium text-[var(--text-2)] text-center">Direction</th>
                  <th className="p-3 text-[11px] font-medium text-[var(--text-2)]">Trend</th>
                  <th onClick={() => handleSort('current')} className="p-3 text-[11px] font-medium text-[var(--text-2)] select-none cursor-pointer hover:text-[var(--text-1)] transition-colors text-right">
                    Current {sortField === 'current' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('trend')} className="p-3 text-[11px] font-medium text-[var(--text-2)] select-none cursor-pointer hover:text-[var(--text-1)] transition-colors text-right">
                    Delta {sortField === 'trend' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th className="p-3 text-[11px] font-medium text-[var(--text-2)] text-center">Auto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {sortedMetrics.map(metric => {
                  const isSelected = metric.id === selectedMetricId;
                  const trend = getTrendData(metric);
                  const path = generateSparkline(metric.history, 75, 18);

                  return (
                    <tr
                      key={metric.id}
                      onClick={() => setSelectedMetricId(metric.id)}
                      className={`hover:bg-[var(--hover)] transition-colors cursor-pointer text-xs ${
                        isSelected ? 'bg-[var(--accent-subtle)]' : ''
                      }`}
                    >
                      <td className="p-3 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${categoryDot[metric.category] || 'bg-zinc-400'}`} />
                          <div className="truncate">
                            <div className="text-[var(--text-1)] font-medium truncate">{metric.name}</div>
                            <div className="text-[var(--text-3)] text-[10.5px] truncate mt-0.5">{metric.description}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className="text-[10px] font-mono text-[var(--text-2)] bg-[var(--bg)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                          {metric.direction === 'minimize' ? 'min' : metric.direction === 'maximize' ? 'max' : 'hold'}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="w-[80px] h-[20px]">
                          <svg width="100%" height="100%" viewBox="0 0 75 18" className="overflow-visible">
                            <path
                              d={path}
                              stroke={trend.isImprovement ? '#10B981' : trend.isRegression ? '#F43F5E' : 'var(--text-3)'}
                              strokeWidth="1.2"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[var(--text-1)] text-right font-tabular">
                        {metric.currentVal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
                        <span className="text-[var(--text-3)] text-[10px] ml-0.5">{metric.unit}</span>
                      </td>

                      <td className="p-3 text-right">
                        {trend.rawDiff !== 0 ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className={`font-mono text-[11px] font-semibold font-tabular ${
                              trend.isImprovement ? 'text-emerald-500' : 'text-rose-500'
                            }`}>
                              {trend.isImprovement ? '-' : '+'}{trend.percent}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--text-3)] font-mono font-tabular">—</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-block h-2 w-2 rounded-full transition-colors ${
                          metric.enabledForAgent ? 'bg-emerald-400' : 'bg-[var(--border-2)]'
                        }`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sortedMetrics.length === 0 && (
              <div className="p-8 text-center text-xs text-[var(--text-3)]">
                No objectives match the current filters.
              </div>
            )}
          </div>
        </div>

        {/* DRILL DOWN PANEL */}
        <div className="xl:col-span-5 bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden flex flex-col sticky top-4">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-medium text-[var(--text-3)] uppercase tracking-wider">Metric Details</div>
              <h3 className="text-sm font-semibold text-[var(--text-1)] mt-0.5">{selectedMetric.name}</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-[var(--accent-subtle)] text-[var(--accent-text)] rounded border border-[var(--accent-border)] capitalize">
              {selectedMetric.category}
            </span>
          </div>

          <div className="p-4 space-y-5">
            {/* Stats box */}
            <div className="grid grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded overflow-hidden">
              <div className="bg-[var(--bg)] p-2.5 text-center">
                <div className="text-[10px] text-[var(--text-3)]">Current</div>
                <div className="font-mono text-sm font-semibold text-[var(--text-1)] mt-0.5 font-tabular">
                  {selectedMetric.currentVal}
                  <span className="text-[10px] text-[var(--text-3)] font-normal ml-0.5">{selectedMetric.unit}</span>
                </div>
              </div>
              <div className="bg-[var(--bg)] p-2.5 text-center">
                <div className="text-[10px] text-[var(--text-3)]">Previous</div>
                <div className="font-mono text-sm text-[var(--text-2)] mt-0.5 font-tabular">
                  {selectedMetric.previousVal}
                  <span className="text-[10px] text-[var(--text-3)] ml-0.5">{selectedMetric.unit}</span>
                </div>
              </div>
              <div className="bg-[var(--bg)] p-2.5 text-center">
                <div className="text-[10px] text-[var(--text-3)]">Target</div>
                <div className="font-mono text-sm font-semibold text-[var(--accent-text)] mt-0.5 font-tabular">
                  {selectedMetric.targetVal !== undefined ? selectedMetric.targetVal : '—'}
                  <span className="text-[10px] text-[var(--text-3)] font-normal ml-0.5">{selectedMetric.unit}</span>
                </div>
              </div>
            </div>

            {/* Trend chart */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-2)]">
                <span>Historical Telemetry</span>
                <span className="text-[10px] text-[var(--text-3)]">Hover nodes for details</span>
              </div>

              <div className="h-44 bg-[var(--bg)] rounded border border-[var(--border)] relative p-3 overflow-hidden select-none">
                <div className="absolute inset-x-0 top-1/4 border-t border-[var(--border)]/50 pointer-events-none" />
                <div className="absolute inset-x-0 top-2/4 border-t border-[var(--border)]/50 pointer-events-none" />
                <div className="absolute inset-x-0 top-3/4 border-t border-[var(--border)]/50 pointer-events-none" />

                {selectedMetric.targetVal !== undefined && (() => {
                  const values = selectedMetric.history.map(h => h.value);
                  const min = Math.min(...values) * 0.9;
                  const max = Math.max(...values) * 1.1;
                  const range = max - min || 1;
                  const targetY = 150 - ((selectedMetric.targetVal - min) / range) * 115 - 12;
                  if (targetY > 0 && targetY < 150) {
                    return (
                      <div
                        className="absolute inset-x-0 border-t border-dashed border-[var(--accent)]/40 pointer-events-none flex justify-end pr-2"
                        style={{ top: `${targetY}px` }}
                      >
                        <span className="bg-[var(--bg)] px-1 text-[9px] font-mono text-[var(--accent-text)]/80 -translate-y-2">target</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <svg width="100%" height="90%" className="overflow-visible pointer-events-auto">
                  {(() => {
                    const values = selectedMetric.history.map(h => h.value);
                    const min = Math.min(...values) * 0.9;
                    const max = Math.max(...values) * 1.1;
                    const range = max - min || 1;
                    const svgWidth = 320;
                    const svgHeight = 110;
                    const points = selectedMetric.history.map((pt, i) => {
                      const x = (i / (selectedMetric.history.length - 1)) * svgWidth + 20;
                      const y = svgHeight - ((pt.value - min) / range) * (svgHeight - 20) - 10;
                      return { x, y, pt };
                    });
                    const pathd = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

                    return (
                      <>
                        <defs>
                          <linearGradient id="detailGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.12" />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d={`${pathd} L ${points[points.length - 1].x},${svgHeight} L ${points[0].x},${svgHeight} Z`}
                          fill="url(#detailGradient)"
                        />
                        <path
                          d={pathd}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {points.map((p, idx) => {
                          const commitInfo = commits.find(c => c.shortHash === p.pt.commitHash);
                          return (
                            <g key={p.pt.commitHash} className="group cursor-default">
                              <circle cx={p.x} cy={p.y} r="4" fill="var(--bg)" stroke="#818cf8" strokeWidth="2" />
                              <foreignObject
                                x={idx > 2 ? p.x - 170 : p.x + 10}
                                y={p.y - 45}
                                width="180"
                                height="110"
                                className="overflow-visible pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30"
                              >
                                <div className="bg-[var(--surface)] border border-[var(--border)] p-2.5 rounded shadow-lg space-y-1">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-mono text-[var(--accent-text)] font-bold">{p.pt.commitHash}</span>
                                    <span className="text-[var(--text-3)] text-[9px] font-mono">{commitInfo?.date || ''}</span>
                                  </div>
                                  <div className="text-[10px] font-medium text-[var(--text-1)] truncate">
                                    {commitInfo?.message || 'Snapshot'}
                                  </div>
                                  <div className="border-t border-[var(--border)] pt-1 flex justify-between items-baseline text-[10px] text-[var(--text-2)]">
                                    <span>Val: <b className="font-mono text-[var(--text-1)] font-tabular">{p.pt.value} {selectedMetric.unit}</b></span>
                                    {commitInfo?.author && <span className="truncate max-w-[80px]">{commitInfo.author}</span>}
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
                <div className="absolute left-2.5 bottom-1 text-[9px] font-mono text-[var(--text-3)]">commit progression</div>
              </div>

              <div className="flex justify-between px-1 text-[10px] font-mono text-[var(--text-2)]">
                {selectedMetric.history.map(h => (
                  <span key={h.commitHash} className="hover:text-[var(--accent-text)] transition-colors cursor-default">{h.commitHash}</span>
                ))}
              </div>
            </div>

            {/* AI Optimizer Toggle */}
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[var(--text-2)]" />
                  <div>
                    <h4 className="text-xs font-semibold text-[var(--text-1)]">Autonomous AI Optimizer</h4>
                    <p className="text-[10px] text-[var(--text-2)] mt-0.5">Continuous improvement with sandbox verification</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedMetric.enabledForAgent}
                    onChange={() => onToggleAgent(selectedMetric.id)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4.5 bg-[var(--border-2)] border border-[var(--border-2)] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[var(--text-3)] peer-checked:after:bg-white after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-[var(--accent)] peer-checked:border-[var(--accent)]" />
                </label>
              </div>

              {selectedMetric.enabledForAgent ? (
                <div className="space-y-3 pt-2 text-[var(--text-2)] text-xs border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <span>Guardrail constraints</span>
                    <span className="text-emerald-500 text-[10px] font-semibold font-mono flex items-center gap-1 bg-emerald-500/8 px-1.5 py-0.5 rounded border border-emerald-500/15">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sandboxed
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-[var(--text-2)]">
                    The autonomous system evaluates commits in isolated cloud sandboxes. Code is merged only when all unit tests pass and companion metrics remain within nominal ranges.
                  </p>

                  {selectedMetric.id === 'api-feed-latency' ? (
                    <button
                      onClick={() => onTriggerAgentSim(selectedMetric.id)}
                      disabled={isSimulating}
                      className="w-full bg-[var(--accent)] border border-[var(--accent)] text-white font-mono text-[11px] font-semibold py-2 rounded hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                      {isSimulating ? 'Patch Running...' : 'Simulate Autonomous Patch'}
                    </button>
                  ) : (
                    <div className="p-2 bg-[var(--accent-subtle)] text-[var(--accent-text)] rounded border border-[var(--accent-border)] text-[10px] leading-relaxed flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
                      <span>Attached to daemon scheduler. Active during nightly git cycles.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[10.5px] text-[var(--text-3)] pt-1 leading-relaxed border-t border-[var(--border)]">
                  Autonomous sandbox is offline. Changes must be implemented as manual commits or via MCP terminal instructions.
                </div>
              )}
            </div>

            {/* SDK Declarations */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-3)]">
                <span className="flex items-center gap-1.5 font-medium"><Code className="w-3.5 h-3.5" /> SDK Declaration</span>
                <span className="font-mono text-[10px]">typescript</span>
              </div>
              <pre className="text-[11px] font-mono bg-[var(--bg)] p-3 rounded border border-[var(--border)] text-[var(--text-1)] overflow-x-auto leading-relaxed select-text max-h-[145px]">
                <code>{selectedMetric.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
