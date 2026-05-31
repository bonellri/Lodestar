import React, { useState, useEffect } from 'react';
import { AgentActivity } from '../types';
import { 
  Play, Settings, Terminal, ShieldAlert, Cpu, CheckCircle2, ChevronRight,
  GitPullRequest, GitBranch, ArrowDownRight, RefreshCw, Layers, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="agent-console-view">
      
      {/* Overview Block */}
      <div className="lg:col-span-12 bg-[#121214]/60 border border-zinc-850 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20">
              <Cpu className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 font-sans">Autonomous Researcher & Optimizer</h2>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            Configure objectives and step back. The Lodestar Researcher continuously writes sandbox code changes, tests compile viability, measures latency regressions, and pushes verified performance improvements to main.
          </p>
        </div>
        
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => onTriggerAgentSim('api-feed-latency')}
            disabled={isSimRunning}
            className={`cursor-pointer text-[11px] py-2 px-4 rounded font-sans font-medium transition-all flex items-center gap-2 ${
              isSimRunning 
                ? 'bg-blue-900/30 text-blue-400 border border-blue-905 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-500/10'
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

      {/* Main Grid */}
      <div className="lg:col-span-12 xl:col-span-7 space-y-4">
        {/* Live Simulation Progress (visible when simulation is running) */}
        <AnimatePresence>
          {isSimRunning && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-zinc-950 border border-blue-500/40 rounded-lg p-5 space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                  <span className="font-mono text-xs font-semibold text-zinc-200">Active Pipeline Instance: opt-api-feed-latency</span>
                </div>
                <span className="bg-blue-950/60 border border-blue-900/50 text-blue-400 px-2 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase">
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
                        isCurrent ? 'bg-blue-950 text-blue-400 border-blue-800' :
                        isDone ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40' :
                        'bg-zinc-900 text-zinc-650 border-zinc-900'
                      }`}
                    >
                      {step.toUpperCase()}
                    </div>
                  );
                })}
              </div>

              {/* Log Stream */}
              <div className="bg-[#09090b] border border-zinc-900 rounded p-4 h-64 overflow-y-auto font-mono text-[10.5px] text-zinc-300 space-y-2">
                {simLogs.map((log, index) => (
                  <div key={index} className={log.includes('Verified') ? 'text-emerald-400 font-semibold' : log.includes('Hypothesis') ? 'text-blue-400' : 'text-zinc-400'}>
                    {log}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optimizations History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase text-zinc-500 font-mono tracking-wider">Optimization Logs Registry</h3>
            <span className="text-[10px] text-zinc-500 font-mono">Select log to view diffs</span>
          </div>

          <div className="space-y-2.5">
            {activities.map(act => (
              <div
                key={act.id}
                onClick={() => setSelectedActivityId(act.id)}
                className={`p-4 rounded-lg border text-left cursor-pointer transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-3 ${
                  selectedActivityId === act.id
                    ? 'bg-[#18181b]/90 border-blue-500/80'
                    : 'bg-[#121214]/60 border-zinc-850 hover:bg-[#18181b]/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-semibold text-zinc-200 mt-0.5">{act.metricName}</h4>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-1">{act.message}</p>
                  <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-500 pt-1">
                    <span>{act.timestamp}</span>
                    <span>•</span>
                    <span>ID: {act.id}</span>
                  </div>
                </div>

                {/* Reduction metrics stats badge */}
                {act.improvementStats && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-950/60 px-2.5 py-1 rounded text-xs font-mono shrink-0">
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
      <div className="lg:col-span-12 xl:col-span-5 space-y-4">
        <h3 className="text-xs font-semibold uppercase text-zinc-500 font-mono tracking-wider">Researcher Sandbox Inspection</h3>

        <div className="bg-[#121214]/60 border border-zinc-850 rounded-lg p-5 space-y-4">
          {/* Display code diff or default info */}
          {selectedActivity && (selectedActivity.codeDiff || simDiff) ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                <span className="flex items-center gap-1.5"><GitPullRequest className="w-3.5 h-3.5" /> GIT CODE PATCH</span>
                <span>Unified Diff</span>
              </div>

              {/* Side-by-side outcome indicators */}
              {selectedActivity.improvementStats && (
                <div className="grid grid-cols-3 gap-3 bg-zinc-950 p-3 rounded-lg border border-zinc-900 font-mono text-xs text-center">
                  <div>
                    <div className="text-[9px] text-zinc-500 uppercase">Baseline</div>
                    <div className="text-zinc-400 mt-0.5 line-through">{selectedActivity.improvementStats.before}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-500 uppercase">Optimized</div>
                    <div className="text-emerald-400 mt-0.5 font-bold">{selectedActivity.improvementStats.after}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-500 uppercase">Net Delta</div>
                    <div className="text-emerald-400 font-bold mt-0.5">{selectedActivity.improvementStats.changePercent}</div>
                  </div>
                </div>
              )}

              {/* Diff terminal */}
              <pre className="text-[10px] font-mono bg-zinc-950 p-4 rounded-lg border border-zinc-900 overflow-x-auto text-zinc-350 leading-relaxed max-h-[380px]">
                <code>
                  {(simDiff || selectedActivity.codeDiff || '').split('\n').map((line, idx) => {
                    let color = 'text-zinc-400';
                    if (line.startsWith('-') && !line.startsWith('---')) color = 'text-rose-400 bg-rose-950/20';
                    if (line.startsWith('+') && !line.startsWith('+++')) color = 'text-emerald-450 bg-emerald-990/20';
                    if (line.startsWith('@@')) color = 'text-blue-400 opacity-60';

                    return (
                      <div key={idx} className={`${color} px-1 rounded`}>
                        {line}
                      </div>
                    );
                  })}
                </code>
              </pre>

              <div className="bg-zinc-950 p-3 rounded border border-zinc-900 text-[11px] text-zinc-400 flex items-start gap-1.5 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  This patch was auto-generated by the research agent after executing 1000 iteration sweeps of performance testing. All guardrails and tests complied perfectly.
                </span>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center space-y-3">
              <Terminal className="w-8 h-8 text-zinc-650 mx-auto" />
              <p className="text-xs text-zinc-405 font-sans max-w-xs mx-auto">
                Select an optimization registry log from the checklist or trigger a live simulation sweep to inspect the sandbox git modification code-diff models.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
