import React, { useState } from 'react';
import { AgentActivity } from '../types';
import {
  Play, Terminal, Cpu, CheckCircle2,
  GitPullRequest, ArrowDownRight, RefreshCw, Shield
} from 'lucide-react';

interface AgentConsoleProps {
  activities: AgentActivity[];
  onTriggerAgentSim: (metricId: string) => void;
  isSimRunning: boolean;
  simLogs: string[];
  simStep: string;
  simDiff?: string;
  simImprovement?: { before: string; after: string; percent: string };
}

export default function AgentConsole({
  activities,
  onTriggerAgentSim,
  isSimRunning,
  simLogs,
  simStep,
  simDiff,
}: AgentConsoleProps) {
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || '');
  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  const SIM_STEPS = ['analyzing', 'hypothesizing', 'testing', 'verifying'] as const;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-fade-in text-left font-sans" id="agent-console-view">

      {/* HEADER */}
      <div className="lg:col-span-12 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
              <Cpu className="w-4 h-4 text-[var(--accent-text)]" />
            </div>
            <h2 className="text-sm font-semibold text-[var(--text-1)]">Autonomous Researcher & Optimizer</h2>
          </div>
          <p className="text-[11px] text-[var(--text-2)] leading-relaxed max-w-2xl">
            Configure objectives and step back. The Lodestar Researcher continuously writes sandbox code changes, tests compile viability, measures regressions, and pushes verified improvements to main.
          </p>
        </div>

        <div className="shrink-0">
          <button
            onClick={() => onTriggerAgentSim('api-feed-latency')}
            disabled={isSimRunning}
            className={`text-[11px] font-semibold py-2 px-4 rounded transition-all flex items-center gap-2 border cursor-pointer ${
              isSimRunning
                ? 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-3)] cursor-not-allowed'
                : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] border-[var(--accent)] text-white'
            }`}
          >
            {isSimRunning ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running...</>
            ) : (
              <><Play className="w-3.5 h-3.5 fill-current" /> Trigger Live Simulation</>
            )}
          </button>
        </div>
      </div>

      {/* LEFT COLUMN */}
      <div className="lg:col-span-7 space-y-4">

        {/* Live simulation panel */}
        {isSimRunning && (
          <div className="bg-[var(--surface)] border border-[var(--accent-border)] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-ping" />
                <span className="font-mono text-xs font-semibold text-[var(--text-1)]">opt-api-feed-latency</span>
              </div>
              <span className="bg-[var(--accent-subtle)] border border-[var(--accent-border)] text-[var(--accent-text)] px-2 py-0.5 rounded text-[10px] font-mono uppercase">
                {simStep}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
              {SIM_STEPS.map((step) => {
                const mapIdx = SIM_STEPS.indexOf(step);
                const currentIdx = SIM_STEPS.indexOf(simStep as typeof SIM_STEPS[number]);
                const isCurrent = step === simStep;
                const isDone = mapIdx < currentIdx;
                return (
                  <div
                    key={step}
                    className={`py-1.5 rounded border transition-colors ${
                      isCurrent ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[var(--accent-border)]' :
                      isDone ? 'bg-emerald-500/8 text-emerald-500 border-emerald-500/20' :
                      'bg-[var(--bg)] text-[var(--text-3)] border-[var(--border)]'
                    }`}
                  >
                    {step.toUpperCase()}
                  </div>
                );
              })}
            </div>

            <div className="bg-[var(--bg)] border border-[var(--border)] rounded p-4 h-64 overflow-y-auto font-mono text-[10.5px] text-[var(--text-2)] space-y-1.5">
              {simLogs.map((log, i) => (
                <div key={i} className={
                  log.includes('Verified') || log.includes('approved') ? 'text-emerald-500 font-semibold' :
                  log.includes('Hypothesis') ? 'text-[var(--accent-text)]' :
                  'text-[var(--text-2)]'
                }>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity log */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-[var(--text-2)] tracking-wider">Optimization Registry</h3>
            <span className="text-[10px] text-[var(--text-3)]">Select to review diff</span>
          </div>

          <div className="space-y-2">
            {activities.map(act => (
              <div
                key={act.id}
                onClick={() => setSelectedActivityId(act.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
                  selectedActivityId === act.id
                    ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)]'
                    : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--hover)]'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <h4 className="text-xs font-semibold text-[var(--text-1)]">{act.metricName}</h4>
                  </div>
                  <p className="text-[11px] text-[var(--text-2)] truncate pl-6">{act.message}</p>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-[var(--text-3)] pl-6 pt-0.5">
                    <span>{act.timestamp}</span>
                    <span>·</span>
                    <span>{act.id}</span>
                  </div>
                </div>
                {act.improvementStats && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/8 text-emerald-500 border border-emerald-500/20 px-2.5 py-1 rounded text-xs font-mono shrink-0 font-bold font-tabular">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>{act.improvementStats.changePercent}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Code diff */}
      <div className="lg:col-span-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase text-[var(--text-2)] tracking-wider">Sandbox Inspection</h3>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 space-y-4">
          {selectedActivity && (selectedActivity.codeDiff || simDiff) ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono text-[var(--text-2)]">
                <span className="flex items-center gap-1.5"><GitPullRequest className="w-3.5 h-3.5" /> GIT PATCH</span>
                <span>Unified diff</span>
              </div>

              {selectedActivity.improvementStats && (
                <div className="grid grid-cols-3 gap-px bg-[var(--border)] border border-[var(--border)] rounded overflow-hidden font-mono text-xs text-center font-tabular">
                  <div className="bg-[var(--bg)] p-2">
                    <div className="text-[9px] text-[var(--text-3)] uppercase">Baseline</div>
                    <div className="text-[var(--text-2)] mt-0.5 line-through">{selectedActivity.improvementStats.before}</div>
                  </div>
                  <div className="bg-[var(--bg)] p-2">
                    <div className="text-[9px] text-[var(--text-3)] uppercase">Optimized</div>
                    <div className="text-emerald-500 mt-0.5 font-bold">{selectedActivity.improvementStats.after}</div>
                  </div>
                  <div className="bg-[var(--bg)] p-2">
                    <div className="text-[9px] text-[var(--text-3)] uppercase">Delta</div>
                    <div className="text-emerald-500 font-bold mt-0.5">{selectedActivity.improvementStats.changePercent}</div>
                  </div>
                </div>
              )}

              <pre className="text-[10px] font-mono bg-[var(--bg)] p-4 rounded border border-[var(--border)] overflow-x-auto text-[var(--text-1)] leading-relaxed max-h-[380px]">
                <code>
                  {(simDiff || selectedActivity.codeDiff || '').split('\n').map((line, idx) => {
                    let cls = 'text-[var(--text-2)]';
                    if (line.startsWith('-') && !line.startsWith('---')) cls = 'text-rose-500 bg-rose-500/8 px-1 rounded';
                    if (line.startsWith('+') && !line.startsWith('+++')) cls = 'text-emerald-500 bg-emerald-500/8 px-1 rounded';
                    if (line.startsWith('@@')) cls = 'text-[var(--accent-text)] opacity-70';
                    return <div key={idx} className={cls}>{line}</div>;
                  })}
                </code>
              </pre>

              <div className="bg-[var(--bg)] p-3 rounded border border-[var(--border)] text-[11px] text-[var(--text-2)] flex items-start gap-2 leading-relaxed">
                <Shield className="w-4 h-4 text-[var(--accent-text)] shrink-0 mt-0.5" />
                <span>Auto-generated by research agent after concurrency sweep. All unit tests passed.</span>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <Terminal className="w-8 h-8 text-[var(--text-3)] mx-auto" />
              <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto leading-relaxed">
                Select an optimization entry from the registry or trigger a live simulation to inspect the sandbox code diff.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
