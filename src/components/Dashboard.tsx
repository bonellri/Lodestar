import React, { useState } from 'react';
import { MetricDefinition, Commit } from '../types';
import { 
  Search, Play, GitBranch, GitCommit, ArrowUpRight, ArrowDownRight, Check,
  AlertTriangle, Code, Shield, Activity, ChevronRight, CheckCircle2, SlidersHorizontal,
  Plus, HelpCircle
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

  // Filters
  const filteredMetrics = metrics.filter(metric => {
    const matchesSearch = metric.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          metric.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || metric.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate trends for a metric
  const getTrendData = (metric: MetricDefinition) => {
    if (!metric.history || metric.history.length < 2) {
      return { isImprovement: false, isRegression: false, percent: '0.0', rawDiff: 0, valueDiffStr: '0' };
    }
    const values = metric.history.map(h => h.value);
    const first = values[0];
    const last = values[values.length - 1];
    
    // Percent difference
    const rawDiff = last - first;
    const percent = first === 0 ? 0 : Math.abs((rawDiff / first) * 100);
    
    let isImprovement = false;
    let isRegression = false;

    if (rawDiff === 0) {
      // flat
    } else if (metric.direction === 'minimize') {
      if (rawDiff < 0) {
        isImprovement = true;
      } else {
        isRegression = true;
      }
    } else if (metric.direction === 'maximize') {
      if (rawDiff > 0) {
        isImprovement = true;
      } else {
        isRegression = true;
      }
    }

    return {
      isImprovement,
      isRegression,
      percent: percent.toFixed(1),
      rawDiff,
      valueDiffStr: `${rawDiff > 0 ? '+' : ''}${parseFloat(rawDiff.toFixed(4)).toString()}`
    };
  };

  // SVG Line Path calculation for sparkline
  const generateSparkline = (history: { value: number }[], width: number, height: number) => {
    if (!history || history.length < 2) return '';
    const vals = history.map(h => h.value);
    const minVal = Math.min(...vals);
    const maxVal = Math.max(...vals);
    const range = maxVal - minVal || 1;

    const points = history.map((pt, i) => {
      const x = (i / (history.length - 1)) * width;
      // y is inverted in SVG, offset by padding
      const y = height - ((pt.value - minVal) / range) * (height - 6) - 3;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  // Sorting
  const sortedMetrics = [...filteredMetrics].sort((a, b) => {
    if (sortField === 'name') {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else if (sortField === 'current') {
      return sortAsc ? a.currentVal - b.currentVal : b.currentVal - a.currentVal;
    } else if (sortField === 'trend') {
      const trendA = parseFloat(getTrendData(a).percent) * (getTrendData(a).isRegression ? 1 : -1);
      const trendB = parseFloat(getTrendData(b).percent) * (getTrendData(b).isRegression ? 1 : -1);
      return sortAsc ? trendA - trendB : trendB - trendA;
    }
    return 0;
  });

  const handleSort = (field: 'name' | 'current' | 'trend') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="space-y-6" id="dashboard-root-view">
      
      {/* 1. TOP DENSE STAT STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#22262B] border border-[#22262B] rounded-lg overflow-hidden shrink-0" id="stat-strip">
        <div className="bg-[#13161B] p-4 text-left">
          <div className="text-[11px] font-medium text-[#8A94A6] uppercase tracking-wider font-sans">Active Objectives</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-xl font-semibold text-[#E2E8F0]">{metrics.length}</span>
            <span className="text-[11px] text-[#4F5B70] font-sans">tracked</span>
          </div>
          <div className="text-[10px] text-[#4F5B70] font-sans mt-0.5">Coverage metric, API speed, costs</div>
        </div>

        <div className="bg-[#13161B] p-4 text-left">
          <div className="text-[11px] font-medium text-[#8A94A6] uppercase tracking-wider font-sans">Branch Targets</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-base font-semibold text-violet-400 bg-violet-400/5 px-2 py-0.5 rounded border border-violet-500/10">main</span>
            <span className="text-[11px] text-[#4F5B70] font-sans">active</span>
          </div>
          <div className="text-[10px] text-[#4F5B70] font-sans mt-0.5">Evaluating pull-requests dynamically</div>
        </div>

        <div className="bg-[#13161B] p-4 text-left">
          <div className="text-[11px] font-medium text-[#8A94A6] uppercase tracking-wider font-sans">Autonomous Pipelines</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-xl font-semibold text-emerald-400">
              {metrics.filter(m => m.enabledForAgent).length}
            </span>
            <span className="text-[11px] text-[#4F5B70] font-sans">active loops</span>
          </div>
          <div className="text-[10px] text-[#4F5B70] font-sans mt-0.5">Continuous auto-optimization auto-enabled</div>
        </div>

        <div className="bg-[#13161B] p-4 text-left">
          <div className="text-[11px] font-medium text-[#8A94A6] uppercase tracking-wider font-sans">Researcher Daemon</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-xs font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full bg-amber-400 ${isSimulating ? 'animate-ping' : ''}`} />
              {isSimulating ? 'simulating patch' : 'idle daemon'}
            </span>
          </div>
          <div className="text-[10px] text-[#4F5B70] font-sans mt-0.5">Monitoring commit regressions</div>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: TABLES ON LEFT (60%), HIGH-DENSITY DRILL DOWN ON RIGHT (40%) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        
        {/* OBJECTIVES TABLE WINDOW */}
        <div className="xl:col-span-7 bg-[#13161B] border border-[#22262B] rounded-lg overflow-hidden flex flex-col" id="objectives-table-container">
          
          {/* Header Actions */}
          <div className="p-4 border-b border-[#22262B] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[#13161B]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#E2E8F0] font-sans">Codebase Objectives</h2>
              <span className="text-[10px] bg-[#1E232B] px-1.5 py-0.5 rounded font-mono text-[#4F5B70]">v1.0.4</span>
            </div>

            {/* Filter Group */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-[#4F5B70]" />
                <input
                  type="text"
                  placeholder="Filter objectives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#0B0D10] border border-[#22262B] rounded pl-8 pr-3 py-1 text-xs text-[#E2E8F0] placeholder-[#4F5B70] outline-none focus:border-violet-500/50 w-full sm:w-44 transition-all font-sans"
                />
              </div>

              <div className="flex bg-[#0B0D10] border border-[#22262B] p-0.5 rounded">
                {(['all', 'performance', 'quality', 'size', 'cost'] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium capitalize cursor-pointer transition-colors ${
                      categoryFilter === cat 
                        ? 'bg-[#22262B] text-[#E2E8F0]' 
                        : 'text-[#8A94A6] hover:text-[#E2E8F0]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Element */}
          <div className="overflow-x-auto min-h-[350px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#22262B] bg-[#0E1114]">
                  <th onClick={() => handleSort('name')} className="p-3 text-[11px] font-semibold text-[#8A94A6] select-none cursor-pointer hover:text-[#E2E8F0] font-sans">
                    Objective Name {sortField === 'name' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th className="p-3 text-[11px] font-semibold text-[#8A94A6] font-sans text-center">Direction</th>
                  <th className="p-3 text-[11px] font-semibold text-[#8A94A6] font-sans">Sparkline</th>
                  <th onClick={() => handleSort('current')} className="p-3 text-[11px] font-semibold text-[#8A94A6] select-none cursor-pointer hover:text-[#E2E8F0] font-sans text-right">
                    Current {sortField === 'current' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('trend')} className="p-3 text-[11px] font-semibold text-[#8A94A6] select-none cursor-pointer hover:text-[#E2E8F0] font-sans text-right">
                    TrendDelta {sortField === 'trend' && (sortAsc ? '↑' : '↓')}
                  </th>
                  <th className="p-3 text-[11px] font-semibold text-[#8A94A6] font-sans text-center">Auto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1D2128]">
                {sortedMetrics.map(metric => {
                  const isSelected = metric.id === selectedMetricId;
                  const trend = getTrendData(metric);
                  const path = generateSparkline(metric.history, 75, 18);

                  return (
                    <tr
                      key={metric.id}
                      onClick={() => setSelectedMetricId(metric.id)}
                      className={`hover:bg-[#1D2128]/40 transition-colors cursor-pointer text-xs ${
                        isSelected ? 'bg-violet-500/5 font-medium' : ''
                      }`}
                    >
                      <td className="p-3 font-sans max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                            metric.category === 'performance' ? 'bg-amber-400' :
                            metric.category === 'size' ? 'bg-fuchsia-400' :
                            metric.category === 'cost' ? 'bg-emerald-400' :
                            metric.category === 'quality' ? 'bg-blue-400' :
                            'bg-zinc-400'
                          }`} />
                          <div className="truncate">
                            <div className="text-[#E2E8F0] font-medium truncate">{metric.name}</div>
                            <div className="text-[#4E5664] text-[10.5px] truncate font-sans">{metric.description}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <span className="text-[10px] font-mono text-[#8A94A6] bg-[#0E1114] px-1.5 py-0.5 rounded border border-[#22262B]">
                          {metric.direction === 'minimize' ? 'min' : metric.direction === 'maximize' ? 'max' : 'hold'}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="w-[80px] h-[20px]">
                          <svg width="100%" height="100%" viewBox="0 0 75 18" className="overflow-visible">
                            <path
                              d={path}
                              stroke={trend.isImprovement ? '#10B981' : trend.isRegression ? '#EF4444' : '#8A94A6'}
                              strokeWidth="1.2"
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[#E2E8F0] text-right font-tabular">
                        {metric.currentVal.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 4 })}
                        <span className="text-[#4F5B70] text-[10px] ml-0.5 font-sans">{metric.unit}</span>
                      </td>

                      <td className="p-3 text-right">
                        {trend.rawDiff !== 0 ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className={`font-mono text-[11px] font-semibold font-tabular ${
                              trend.isImprovement ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {trend.isImprovement ? '-' : '+'}{trend.percent}%
                            </span>
                            <span className="text-[#4F5B70] text-[10px] font-mono">
                              ({trend.valueDiffStr})
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#4F5B70] font-mono font-tabular">-</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-block h-2 w-2 rounded-full ${metric.enabledForAgent ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-[#22262B]'}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {sortedMetrics.length === 0 && (
              <div className="p-8 text-center text-xs text-[#4F5B70] font-sans">
                No telemetry objectives fit the search criteria.
              </div>
            )}
          </div>
        </div>

        {/* DETAILED DRILL DOWN PANEL ON RIGHT (40%) */}
        <div className="xl:col-span-5 bg-[#13161B] border border-[#22262B] rounded-lg overflow-hidden flex flex-col sticky top-4" id="drilldown-detail-pane">
          <div className="p-4 border-b border-[#22262B] flex items-center justify-between bg-[#13161B]">
            <div>
              <div className="text-[10px] font-bold text-[#8A94A6] uppercase tracking-wider font-sans">Focus Metric Details</div>
              <h3 className="text-sm font-semibold text-[#E2E8F0] font-sans mt-0.5">{selectedMetric.name}</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-violet-600/10 text-violet-400 rounded-full border border-violet-500/20 font-sans capitalize">
              {selectedMetric.category}
            </span>
          </div>

          <div className="p-4 space-y-5">
            {/* Real Stats Box */}
            <div className="grid grid-cols-3 gap-px bg-[#22262B] border border-[#22262B] rounded overflow-hidden">
              <div className="bg-[#0B0D10] p-2.5 text-center">
                <div className="text-[10px] text-[#8A94A6] font-sans">Current Value</div>
                <div className="font-mono text-sm font-semibold text-[#E2E8F0] mt-0.5 font-tabular">
                  {selectedMetric.currentVal}
                  <span className="text-[10px] font-sans text-[#4F5B70] font-normal ml-0.5">{selectedMetric.unit}</span>
                </div>
              </div>
              <div className="bg-[#0B0D10] p-2.5 text-center">
                <div className="text-[10px] text-[#8A94A6] font-sans">Previous Value</div>
                <div className="font-mono text-sm text-[#8A94A6] mt-0.5 font-tabular">
                  {selectedMetric.previousVal}
                  <span className="text-[10.5px] font-sans text-[#4F5B70] ml-0.5">{selectedMetric.unit}</span>
                </div>
              </div>
              <div className="bg-[#0B0D10] p-2.5 text-center">
                <div className="text-[10px] text-[#8A94A6] font-sans">Target Goal</div>
                <div className="font-mono text-sm font-semibold text-violet-400 mt-0.5 font-tabular">
                  {selectedMetric.targetVal !== undefined ? selectedMetric.targetVal : 'None'}
                  <span className="text-[10.5px] font-sans text-[#4F5B70] font-normal ml-0.5">{selectedMetric.unit}</span>
                </div>
              </div>
            </div>

            {/* HIGH PRECISION GIT TREND GRAPH */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-sans text-[#8A94A6]">
                <span>Historical Telemetry (Git Commit Flow)</span>
                <span className="text-[10px] text-[#4F5B70]">Hover nodes for details</span>
              </div>
              
              <div className="h-44 bg-[#0B0D10] rounded border border-[#22262B] relative p-3 overflow-hidden select-none">
                {/* 3 Gridlines */}
                <div className="absolute inset-x-0 top-1/4 border-t border-[#22262B]/50 pointer-events-none" />
                <div className="absolute inset-x-0 top-2/4 border-t border-[#22262B]/50 pointer-events-none" />
                <div className="absolute inset-x-0 top-3/4 border-t border-[#22262B]/50 pointer-events-none" />

                {/* Target line if set */}
                {selectedMetric.targetVal !== undefined && (() => {
                  const values = selectedMetric.history.map(h => h.value);
                  const min = Math.min(...values) * 0.9;
                  const max = Math.max(...values) * 1.1;
                  const range = max - min || 1;
                  const targetY = 150 - ((selectedMetric.targetVal - min) / range) * 115 - 12;
                  
                  if (targetY > 0 && targetY < 150) {
                    return (
                      <div 
                        className="absolute inset-x-0 border-t border-dashed border-violet-500/50 pointer-events-none flex justify-end pr-2"
                        style={{ top: `${targetY}px` }}
                      >
                        <span className="bg-[#0B0D10] px-1 text-[9px] font-mono text-violet-400/90 tracking-tight -translate-y-2">Goal Limit</span>
                      </div>
                    );
                  }
                  return null;
                })()}

                <svg width="100%" height="90%" className="overflow-visible overflow-y-visible pointer-events-auto">
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
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        <path
                          d={`${pathd} L ${points[points.length - 1].x},${svgHeight} L ${points[0].x},${svgHeight} Z`}
                          fill="url(#detailGradient)"
                        />
                        <path
                          d={pathd}
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {points.map((p, idx) => {
                          const commitInfo = commits.find(c => c.shortHash === p.pt.commitHash);
                          return (
                            <g key={p.pt.commitHash} className="group cursor-default">
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r="4.5"
                                fill="#0B0D10"
                                stroke="#A78BFA"
                                strokeWidth="2.5"
                              />
                              {/* Hover Card */}
                              <foreignObject 
                                x={idx > 2 ? p.x - 170 : p.x + 10} 
                                y={p.y - 45} 
                                width="180" 
                                height="110" 
                                className="overflow-visible pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-30"
                              >
                                <div className="bg-[#13161B] border border-[#22262B] p-2.5 rounded shadow-2xl relative space-y-1">
                                  <div className="flex justify-between items-center text-[10px]">
                                    <span className="font-mono text-violet-400 font-bold">{p.pt.commitHash}</span>
                                    <span className="text-[#4F5B70] text-[9px] font-mono">{commitInfo?.date || 'unknown'}</span>
                                  </div>
                                  <div className="text-[10px] font-medium text-[#E2E8F0] truncate font-sans">
                                    {commitInfo?.message || 'Codebase state snapshot'}
                                  </div>
                                  <div className="border-t border-[#22262B] pt-1 flex justify-between items-baseline font-sans text-[10px] text-[#8A94A6]">
                                    <span>Val: <b className="font-mono text-white text-[11px] font-tabular">{p.pt.value} {selectedMetric.unit}</b></span>
                                    {commitInfo?.author && <span className="truncate max-w-[80px] font-medium">By {commitInfo.author}</span>}
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

                {/* Legend and Axis limits inside card */}
                <div className="absolute left-2.5 bottom-1 text-[9px] font-mono text-[#4F5B70]">
                  Git commit progression
                </div>
              </div>

              {/* Hash labels on X-axis */}
              <div className="flex justify-between px-2 text-[10px] font-mono text-[#8A94A6]">
                {selectedMetric.history.map(h => (
                  <span key={h.commitHash} className="hover:text-violet-400 transition-colors uppercase cursor-default">{h.commitHash}</span>
                ))}
              </div>
            </div>

            {/* AI DECISION FLOWNET AND TOGGLE */}
            <div className="bg-[#0B0D10] border border-[#22262B] rounded-lg p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-[#8A94A6]" />
                  <div>
                    <h4 className="text-xs font-semibold text-[#E2E8F0] font-sans">Autonomous AI Optimizer Daemon</h4>
                    <p className="text-[10px] text-[#8A94A6] font-sans">Continuous code improvement with safe sandboxing</p>
                  </div>
                </div>
                
                {/* Switch toggling agent loop participation on server */}
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedMetric.enabledForAgent}
                    onChange={() => onToggleAgent(selectedMetric.id)}
                    className="sr-only peer"
                    id={`toggle-agent-${selectedMetric.id}`}
                  />
                  <div className="w-8 h-4.5 bg-[#22262B] border border-[#31373E] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[#808896] peer-checked:after:bg-white after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-violet-600 peer-checked:border-violet-500"></div>
                </label>
              </div>

              {selectedMetric.enabledForAgent ? (
                <div className="space-y-3 pt-2 text-[#8A94A6] font-sans text-xs border-t border-[#22262B]">
                  <div className="flex items-center justify-between">
                    <span>Guardrail Constraints</span>
                    <span className="text-emerald-400 text-[10px] font-semibold font-mono flex items-center gap-1 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sandboxed Safe
                    </span>
                  </div>
                  <p className="text-[10px] leading-relaxed text-[#8A94A6]">
                    Our autonomous system evaluates non-disruptive commits in temporary cloud sandboxes. Code is strictly committed and merged only when unit tests check out perfectly green and companion metrics remain in nominal spec levels.
                  </p>

                  {selectedMetric.id === 'api-feed-latency' ? (
                    <button
                      onClick={() => onTriggerAgentSim(selectedMetric.id)}
                      disabled={isSimulating}
                      className="w-full bg-violet-600 border border-violet-500 text-white font-mono text-[11px] font-semibold py-2 rounded hover:bg-violet-500 disabled:bg-[#1E232B] disabled:border-transparent disabled:text-[#4F5B70] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Activity className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                      {isSimulating ? 'Continuous Patch Executing...' : 'Simulate Autonomous Patch Run'}
                    </button>
                  ) : (
                    <div className="p-2 bg-violet-600/5 text-violet-400 rounded-md border border-violet-500/10 text-[10px] leading-relaxed flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-violet-400 animate-ping shrink-0" />
                      <span>Attached to daemon scheduler. Scopes suggestions during nightly automated git cycles.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[10.5px] text-[#4F5B70] font-sans pt-1 leading-relaxed">
                  Autonomous sandbox is offline. Changes to this metric must be implemented as manual commits or driven via direct MCP terminal instructions from your Cursor / VSCode workspace.
                </div>
              )}
            </div>

            {/* SDK DECLARATION */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11.5px] font-sans text-[#4F5B70]">
                <span className="flex items-center gap-1.5 font-medium"><Code className="w-3.5 h-3.5" /> SDK Declarations</span>
                <span className="font-mono text-[10.5px]">typescript/node</span>
              </div>
              <pre className="text-[11px] font-mono bg-[#0B0D10] p-3 rounded border border-[#22262B] text-[#D4D9E2] overflow-x-auto leading-relaxed select-text max-h-[145px]">
                <code>{selectedMetric.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
