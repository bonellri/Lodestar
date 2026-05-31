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
  simImprovement
}: AgentConsoleProps) {
  const [selectedActivityId, setSelectedActivityId] = useState<string>(activities[0]?.id || '');

  const selectedActivity = activities.find(a => a.id === selectedActivityId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-fade-in text-left font-sans" id="agent-console-view">
      
      {/* Overview Block */}
      <div className="lg:col-span-12 bg-[#13161B] border border-[#22262B] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-[#22262B] border border-[#31373E]">
              <Cpu className="w-4 h-4 text-violet-400" />
            </div>
            <h2 className="text-sm font-semibold text-[#E2E8F0] font-sans">Autonomous Researcher & Optimizer</h2>
          </div>
          <p className="text-[11px] text-[#8A94A6] font-sans leading-relaxed">
            Configure objectives and step back. The Lodestar Researcher continuously writes sandbox code changes, tests compile viability, measures latency regressions, and pushes verified performance improvements to main.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTriggerAgentSim('api-feed-latency')}
            disabled={isSimRunning}
            className={`cursor-pointer text-[11px] font-semibold py-2 px-4 rounded font-sans transition-all flex items-center gap-2 border ${
              isSimRunning 
                ? 'bg-[#1E232B] border-transparent text-[#4F5B70] cursor-not-allowed' 
                : 'bg-violet-600 hover:bg-violet-500 border-violet-500 text-white shadow shadow-violet-500/10'
            }`}
          >
            {isSimRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Optimization Sweep Running...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Trigger Live Optimizer Simulation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid left */}
      <div className="lg:col-span-7 space-y-4">
        {/* Live Simulation Progress (visible when simulation is running) */}
        {isSimRunning && (
          <div className="bg-[#13161B] border border-violet-500/40 rounded-lg p-5 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500 animate-ping" />
                <span className="font-mono text-xs font-semibold text-[#E2E8F0]">Active Pipeline Instance: opt-api-feed-latency</span>
              </div>
              <span className="bg-violet-950/40 border border-violet-900/30 text-violet-400 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase">
                {simStep}
              </span>
            </div>

            {/* Steps Progress Visuals */}
            <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
              {(['analyzing', 'hypothesizing', 'testing', 'verifying'] as const).map((step) => {
                const states = ['analyzing', 'hypothesizing', 'testing', 'verifying'];
                const mapIdx = states.indexOf(step);
                const currentIdx = states.indexOf(simStep);
                const isCurrent = step === simStep;
                const isDone = mapIdx < currentIdx;

                return (
                  <div 
                    key={step} 
                    className={`py-1 rounded border transition-colors ${
                      isCurrent ? 'bg-violet-950/40 text-violet-400 border-violet-900/40' :
                      isDone ? 'bg-emerald-950/20 text-emerald-400 border-emerald-950/30' :
                      'bg-[#0B0D10] text-[#4F5B70] border-[#22262B]'
                    }`}
                  >
                    {step.toUpperCase()}
                  </div>
                );
              })}
            </div>

            {/* Log Stream */}
            <div className="bg-[#0B0D10] border border-[#22262B] rounded p-4 h-64 overflow-y-auto font-mono text-[10.5px] text-[#A7B1C1] space-y-1.5 scroll-smooth">
              {simLogs.map((log, index) => (
                <div key={index} className={log.includes('Verified') || log.includes('approved') ? 'text-emerald-400 font-semibold' : log.includes('Hypothesis') ? 'text-violet-400' : 'text-[#8A94A6]'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optimizations History List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-[#8A94A6] tracking-wider">Optimization Logs Registry</h3>
            <span className="text-[10px] text-[#4F5B70] font-sans">Select logs to review source diff code</span>
          </div>

          <div className="space-y-2.5">
            {activities.map(act => (
              <div
                key={act.id}
                onClick={() => setSelectedActivityId(act.id)}
                className={`p-4 rounded-lg border text-left cursor-pointer transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
                  selectedActivityId === act.id
                    ? 'bg-violet-500/5 border-violet-500/50'
                    : 'bg-[#13161B] border-[#22262B] hover:bg-[#1C2026]'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold text-[#E2E8F0] mt-0.5">{act.metricName}</h4>
                  </div>
                  <p className="text-[11px] text-[#8A94A6] truncate">{act.message}</p>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-[#4F5B70] pt-1">
                    <span>{act.timestamp}</span>
                    <span>•</span>
                    <span>UUID: {act.id}</span>
                  </div>
                </div>

                {/* Reduction metrics stats badge */}
                {act.improvementStats && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/5 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded text-xs font-mono shrink-0 font-bold font-tabular">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>{act.improvementStats.changePercent}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Code Diffs & Details */}
      <div className="lg:col-span-5 space-y-3">
        <h3 className="text-xs font-semibold uppercase text-[#8A94A6] tracking-wider">Researcher Sandbox Inspection</h3>

        <div className="bg-[#13161B] border border-[#22262B] rounded-lg p-5 space-y-4">
          {/* Display code diff or default info */}
          {selectedActivity && (selectedActivity.codeDiff || simDiff) ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono text-[#8A94A6]">
                <span className="flex items-center gap-1.5"><GitPullRequest className="w-3.5 h-3.5" /> GIT CODE PATCH</span>
                <span>Unified Diff Format</span>
              </div>

              {/* Side-by-side outcome indicators */}
              {selectedActivity.improvementStats && (
                <div className="grid grid-cols-3 gap-px bg-[#22262B] border border-[#22262B] rounded overflow-hidden font-mono text-xs text-center font-tabular">
                  <div className="bg-[#0B0D10] p-2">
                    <div className="text-[9px] text-[#4F5B70] uppercase">Baseline</div>
                    <div className="text-[#8A94A6] mt-0.5 line-through">{selectedActivity.improvementStats.before}</div>
                  </div>
                  <div className="bg-[#0B0D10] p-2">
                    <div className="text-[9px] text-[#4F5B70] uppercase">Optimized</div>
                    <div className="text-emerald-400 mt-0.5 font-bold">{selectedActivity.improvementStats.after}</div>
                  </div>
                  <div className="bg-[#0B0D10] p-2">
                    <div className="text-[9px] text-[#4F5B70] uppercase">Net Delta</div>
                    <div className="text-emerald-400 font-bold mt-0.5">{selectedActivity.improvementStats.changePercent}</div>
                  </div>
                </div>
              )}

              {/* Diff terminal */}
              <pre className="text-[10px] font-mono bg-[#0B0D10] p-4 rounded border border-[#22262B] overflow-x-auto text-[#D4D9E2] leading-relaxed max-h-[380px]">
                <code>
                  {(simDiff || selectedActivity.codeDiff || '').split('\n').map((line, idx) => {
                    let color = 'text-[#8A94A6]';
                    if (line.startsWith('-') && !line.startsWith('---')) color = 'text-rose-450 bg-rose-950/20 px-1 rounded';
                    if (line.startsWith('+') && !line.startsWith('+++')) color = 'text-emerald-400 bg-emerald-950/20 px-1 rounded';
                    if (line.startsWith('@@')) color = 'text-violet-400 opacity-60';

                    return (
                      <div key={idx} className={color}>
                        {line}
                      </div>
                    );
                  })}
                </code>
              </pre>

              <div className="bg-[#0B0D10] p-3 rounded-lg border border-[#22262B] text-[11px] text-[#8A94A6] flex items-start gap-2 leading-relaxed">
                <Shield className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>
                  This patch was auto-generated by the research agent after executing concurrency test sweeps. All unit tests compiled perfectly.
                </span>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <Terminal className="w-8 h-8 text-[#4F5B70] mx-auto" />
              <p className="text-xs text-[#8A94A6] font-sans max-w-xs mx-auto leading-relaxed">
                Select an optimization registry log from the list or trigger a live simulation sweep to inspect the sandbox git modification code-diff models.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
