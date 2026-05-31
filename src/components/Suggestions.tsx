import React, { useState } from 'react';
import { MetricSuggestion } from '../types';
import { Sparkles, Plus, Check, Play, FileText, ArrowRight, X, Cpu, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuggestionsProps {
  suggestions: MetricSuggestion[];
  onAcceptSuggestion: (id: string) => void;
  onIgnoreSuggestion: (id: string) => void;
}

export interface PrFlowState {
  id: string | null;
  step: 'idle' | 'analyzing' | 'writing' | 'committing' | 'verified';
  logs: string[];
}

export default function Suggestions({
  suggestions,
  onAcceptSuggestion,
  onIgnoreSuggestion
}: SuggestionsProps) {
  const [activePr, setActivePr] = useState<PrFlowState>({
    id: null,
    step: 'idle',
    logs: []
  });

  const handleStartTracking = (sugg: MetricSuggestion) => {
    // Start automated code injection simulation
    setActivePr({
      id: sugg.id,
      step: 'analyzing',
      logs: [
        `[1] Scanning repository assets for insertion hotspots...`,
        `[2] Found exact integration targets for tracking "${sugg.name}".`
      ]
    });

    // Step 2: writing code (after 1s)
    setTimeout(() => {
      setActivePr(prev => ({
        ...prev,
        step: 'writing',
        logs: [
          ...prev.logs,
          `[3] Synthesizing SDK structure declaration:`,
          `    "export const ${sugg.id.replace('sugg-', '')} = metrics.${sugg.category}(...)"`,
          `[4] Creating codebase branch "lodestar/add-${sugg.id}"`
        ]
      }));
    }, 1200);

    // Step 3: committing & testing (after 2.5s)
    setTimeout(() => {
      setActivePr(prev => ({
        ...prev,
        step: 'committing',
        logs: [
          ...prev.logs,
          `[5] Injecting instrumentation hook inside server controllers.`,
          `[6] Verification: compiling module targets & executing fast unit suites...`,
          `    - Vitest execution: 14 tests [PASSED]`,
          `[7] Pushing index commit & creating GitHub Pull Request.`
        ]
      }));
    }, 2550);

    // Step 4: verified & completed (after 4.2s)
    setTimeout(() => {
      setActivePr(prev => ({
        ...prev,
        step: 'verified',
        logs: [
          ...prev.logs,
          `[8] [Success] Pull Request approved automatically!`,
          `[9] Merged to main. Metric "${sugg.name}" is now online and tracking.`
        ]
      }));
      // Call parent acceptance to add to live metrics list
      onAcceptSuggestion(sugg.id);
    }, 4200);
  };

  const closePortal = () => {
    setActivePr({ id: null, step: 'idle', logs: [] });
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');

  return (
    <div className="space-y-6" id="suggestion-engine-view">
      {/* Overview Block */}
      <div className="bg-[#121214]/60 border border-zinc-850 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 font-sans">Lodestar Code Suggestion Engine</h2>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            By continually parsing your codebase AST files, database schema mappings, and workspace packages, Lodestar recommends additional custom vectors worth measuring to prevent silent performance scaling degradation.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded">
            <span className="text-zinc-500">pending</span>
            <span className="text-blue-400 font-semibold ml-2">{pendingSuggestions.length}</span>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded">
            <span className="text-zinc-500">tracked</span>
            <span className="text-emerald-400 font-semibold ml-2">{acceptedSuggestions.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Suggestion list */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-4">
          <h3 className="text-xs font-semibold uppercase text-zinc-500 font-mono tracking-wider">Recommended Objectives</h3>
          
          {pendingSuggestions.length === 0 ? (
            <div className="bg-[#121214]/40 border border-zinc-850 rounded-lg p-10 text-center space-y-2">
              <Check className="w-8 h-8 text-emerald-400 mx-auto bg-emerald-500/10 p-1.5 rounded-full border border-emerald-500/20" />
              <p className="text-xs text-zinc-300 font-sans font-medium">All recommendations implemented!</p>
              <p className="text-[11px] text-zinc-500 font-sans">Lodestar scans code changes continuously to generate new proposals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSuggestions.map(sugg => (
                <div 
                  key={sugg.id} 
                  className="bg-[#121214]/60 border border-zinc-850 hover:border-zinc-805 rounded-lg p-5 transition-all space-y-4"
                  id={`suggestion-${sugg.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-zinc-905 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">
                          {sugg.category}
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-100 font-sans">{sugg.name}</h4>
                      </div>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">{sugg.description}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onIgnoreSuggestion(sugg.id)}
                        className="p-1 px-2 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[10.5px] font-sans rounded transition-colors cursor-pointer"
                        title="Dismiss recommendation"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleStartTracking(sugg)}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[10.5px] px-3 py-1.5 rounded font-sans font-medium transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Fast Track Objective
                      </button>
                    </div>
                  </div>

                  {/* Rationale box */}
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-md p-3 text-[11px] font-sans text-blue-300 flex items-start gap-2">
                    <Cpu className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-blue-200">Lodestar Rationale:</span> {sugg.rationale}
                    </div>
                  </div>

                  {/* Code snippet suggestion */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">PROPOSED INTEGRATION SYNTAX</span>
                    <pre className="text-[10.5px] font-mono bg-zinc-950 p-3.5 rounded border border-zinc-900 text-zinc-300 overflow-x-auto max-h-[140px]">
                      <code>{sugg.codeSnippet}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Historical / Integrated Suggestions Panel */}
          {acceptedSuggestions.length > 0 && (
            <div className="space-y-2 pt-4">
              <h3 className="text-xs font-semibold uppercase text-zinc-500 font-mono tracking-wider">Recently Installed Tracks</h3>
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg divide-y divide-zinc-900">
                {acceptedSuggestions.map(sugg => (
                  <div key={sugg.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-zinc-200 font-sans font-medium">{sugg.name}</span>
                        <span className="text-[10px] font-mono text-zinc-500 ml-2">({sugg.category})</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-zinc-500">Merged via lodestar/add-{sugg.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Pull Request simulated terminal popup during integration */}
        <div className="lg:col-span-12 xl:col-span-5">
          <div className="bg-[#121214]/60 border border-zinc-850 rounded-lg p-5 space-y-4 sticky top-4">
            <h3 className="text-xs font-semibold uppercase text-zinc-400 font-mono tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-500" /> Live Integration Portal
            </h3>

            {activePr.id ? (
              <div className="space-y-4">
                {/* Visual state headers */}
                <div className="flex justify-between items-center bg-zinc-950 px-3 py-2 rounded-md border border-zinc-900 font-mono text-[11px]">
                  <span className="text-zinc-400">Target: {suggestions.find(s=>s.id === activePr.id)?.name}</span>
                  <span className={`font-semibold capitalize px-2 py-0.5 rounded text-[10px] ${
                    activePr.step === 'verified' ? 'bg-emerald-950 text-emerald-400' : 'bg-blue-950 text-blue-400 animate-pulse'
                  }`}>{activePr.step}...</span>
                </div>

                {/* Progress Visual Tracker */}
                <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
                  {(['analyzing', 'writing', 'committing', 'verified'] as const).map((step, idx) => {
                    const stepsOrder = ['analyzing', 'writing', 'committing', 'verified'];
                    const currentIdx = stepsOrder.indexOf(activePr.step);
                    const stepIdx = stepsOrder.indexOf(step);
                    const isActive = step === activePr.step;
                    const isPassed = stepIdx < currentIdx;

                    return (
                      <div 
                        key={step} 
                        className={`py-1 rounded border transition-colors ${
                          isActive ? 'bg-blue-950/50 text-blue-400 border-blue-900/60' : 
                          isPassed ? 'bg-emerald-950/20 text-emerald-400 border-emerald-950/40' : 
                          'bg-zinc-900/40 text-zinc-650 border-zinc-900'
                        }`}
                      >
                        {step.toUpperCase()}
                      </div>
                    );
                  })}
                </div>

                {/* Log screen */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-md p-4 h-60 max-h-60 overflow-y-auto font-mono text-[10.5px] leading-relaxed text-zinc-400 space-y-2 scroll-smooth">
                  {activePr.logs.map((log, lIdx) => (
                    <div key={lIdx} className={log.includes('Success') || log.includes('passed') ? 'text-emerald-400' : log.includes('SDK') ? 'text-zinc-500' : 'text-zinc-300'}>
                      {log}
                    </div>
                  ))}
                  {activePr.step !== 'verified' && (
                    <div className="flex items-center gap-1.5 text-blue-400 mt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                      <span>In progress...</span>
                    </div>
                  )}
                </div>

                {/* If verified button to dismiss */}
                {activePr.step === 'verified' && (
                  <button
                    onClick={closePortal}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs py-1.5 rounded transition-colors font-sans font-medium cursor-pointer"
                  >
                    Close Integration Portal
                  </button>
                )}
              </div>
            ) : (
              <div className="py-14 text-center space-y-3">
                <FileText className="w-10 h-10 text-zinc-600 mx-auto" />
                <p className="text-xs text-zinc-400 font-sans max-w-xs mx-auto leading-relaxed">
                  Click <strong className="text-blue-400">"Fast Track Objective"</strong> on any suggestion to see the autonomous code generator inject metrics and issue automated Pull Requests in real time.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
