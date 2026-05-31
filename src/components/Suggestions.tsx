import React, { useState } from 'react';
import { MetricSuggestion } from '../types';
import { Sparkles, Plus, Check, FileText, X, Cpu, Clock } from 'lucide-react';
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

const PR_STEPS = ['analyzing', 'writing', 'committing', 'verified'] as const;

export default function Suggestions({ suggestions, onAcceptSuggestion, onIgnoreSuggestion }: SuggestionsProps) {
  const [activePr, setActivePr] = useState<PrFlowState>({ id: null, step: 'idle', logs: [] });

  const handleStartTracking = (sugg: MetricSuggestion) => {
    setActivePr({
      id: sugg.id,
      step: 'analyzing',
      logs: [
        `[1] Scanning repository for insertion hotspots...`,
        `[2] Found integration targets for "${sugg.name}".`
      ]
    });

    setTimeout(() => {
      setActivePr(prev => ({
        ...prev, step: 'writing',
        logs: [...prev.logs,
          `[3] Synthesizing SDK declaration:`,
          `    "export const ${sugg.id.replace('sugg-', '')} = metrics.${sugg.category}(...)"`,
          `[4] Creating branch "lodestar/add-${sugg.id}"`
        ]
      }));
    }, 1200);

    setTimeout(() => {
      setActivePr(prev => ({
        ...prev, step: 'committing',
        logs: [...prev.logs,
          `[5] Injecting instrumentation hook into server controllers.`,
          `[6] Compiling & running unit suite...`,
          `    - Vitest: 14 tests [PASSED]`,
          `[7] Pushing commit & opening Pull Request.`
        ]
      }));
    }, 2550);

    setTimeout(() => {
      setActivePr(prev => ({
        ...prev, step: 'verified',
        logs: [...prev.logs,
          `[8] [Success] Pull Request auto-approved and merged!`,
          `[9] Metric "${sugg.name}" is now live and tracking.`
        ]
      }));
      onAcceptSuggestion(sugg.id);
    }, 4200);
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted');

  return (
    <div className="space-y-5" id="suggestion-engine-view">

      {/* HEADER */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
              <Sparkles className="w-4 h-4 text-[var(--accent-text)]" />
            </div>
            <h2 className="text-sm font-semibold text-[var(--text-1)]">Suggestion Engine</h2>
          </div>
          <p className="text-[11px] text-[var(--text-2)] leading-relaxed">
            By parsing your codebase AST, database schemas, and workspace packages, Lodestar recommends additional metrics worth tracking to prevent silent performance degradation.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
          <div className="bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 rounded">
            <span className="text-[var(--text-2)]">pending</span>
            <span className="text-[var(--accent-text)] font-semibold ml-2 font-tabular">{pendingSuggestions.length}</span>
          </div>
          <div className="bg-[var(--bg)] border border-[var(--border)] px-3 py-1.5 rounded">
            <span className="text-[var(--text-2)]">tracked</span>
            <span className="text-emerald-500 font-semibold ml-2 font-tabular">{acceptedSuggestions.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT: Suggestion list */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-4">
          <h3 className="text-xs font-semibold uppercase text-[var(--text-2)] tracking-wider">Recommended Objectives</h3>

          {pendingSuggestions.length === 0 ? (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-10 text-center space-y-2">
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-xs text-[var(--text-1)] font-medium">All recommendations implemented!</p>
              <p className="text-[11px] text-[var(--text-2)]">Lodestar scans code changes continuously for new proposals.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingSuggestions.map(sugg => (
                <div
                  key={sugg.id}
                  className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-2)] rounded-lg p-5 transition-colors space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono bg-[var(--bg)] px-1.5 py-0.5 rounded text-[var(--text-2)] border border-[var(--border)] uppercase">
                          {sugg.category}
                        </span>
                        <h4 className="text-sm font-semibold text-[var(--text-1)] truncate">{sugg.name}</h4>
                      </div>
                      <p className="text-[11.5px] text-[var(--text-2)] leading-relaxed">{sugg.description}</p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => onIgnoreSuggestion(sugg.id)}
                        className="px-2.5 py-1.5 hover:bg-[var(--hover)] text-[var(--text-2)] hover:text-[var(--text-1)] text-[11px] rounded transition-colors cursor-pointer border border-transparent hover:border-[var(--border)]"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleStartTracking(sugg)}
                        className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-[11px] px-3 py-1.5 rounded font-medium transition-colors flex items-center gap-1 cursor-pointer border border-[var(--accent)]"
                      >
                        <Plus className="w-3.5 h-3.5" /> Track Objective
                      </button>
                    </div>
                  </div>

                  <div className="bg-[var(--accent-subtle)] border border-[var(--accent-border)] rounded-md p-3 text-[11px] text-[var(--accent-text)] flex items-start gap-2">
                    <Cpu className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Rationale: </span>{sugg.rationale}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Proposed integration</span>
                    <pre className="text-[10.5px] font-mono bg-[var(--bg)] p-3.5 border border-[var(--border)] rounded text-[var(--text-1)] overflow-x-auto max-h-[140px]">
                      <code>{sugg.codeSnippet}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}

          {acceptedSuggestions.length > 0 && (
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-semibold uppercase text-[var(--text-3)] tracking-wider">Installed Tracks</h3>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg divide-y divide-[var(--border)]">
                {acceptedSuggestions.map(sugg => (
                  <div key={sugg.id} className="p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-[var(--text-1)] font-medium">{sugg.name}</span>
                      <span className="text-[10px] font-mono text-[var(--text-3)]">({sugg.category})</span>
                    </div>
                    <span className="font-mono text-[10px] text-[var(--text-3)]">lodestar/add-{sugg.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Integration portal */}
        <div className="lg:col-span-12 xl:col-span-5">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 space-y-4 sticky top-4">
            <h3 className="text-xs font-semibold uppercase text-[var(--text-2)] tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[var(--text-3)]" /> Integration Portal
            </h3>

            {activePr.id ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[var(--bg)] px-3 py-2 rounded border border-[var(--border)] font-mono text-[11px]">
                  <span className="text-[var(--text-2)] truncate max-w-[170px]">
                    {suggestions.find(s => s.id === activePr.id)?.name}
                  </span>
                  <span className={`font-semibold capitalize px-2 py-0.5 rounded text-[10px] ${
                    activePr.step === 'verified'
                      ? 'bg-emerald-500/8 text-emerald-500 border border-emerald-500/20'
                      : 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border border-[var(--accent-border)] animate-pulse'
                  }`}>
                    {activePr.step}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-center">
                  {PR_STEPS.map((step) => {
                    const stepsOrder = [...PR_STEPS];
                    const currentIdx = stepsOrder.indexOf(activePr.step as typeof PR_STEPS[number]);
                    const stepIdx = stepsOrder.indexOf(step);
                    const isActive = step === activePr.step;
                    const isPassed = stepIdx < currentIdx;
                    return (
                      <div
                        key={step}
                        className={`py-1.5 rounded border transition-colors ${
                          isActive ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)] border-[var(--accent-border)]' :
                          isPassed ? 'bg-emerald-500/8 text-emerald-500 border-emerald-500/20' :
                          'bg-[var(--bg)] text-[var(--text-3)] border-[var(--border)]'
                        }`}
                      >
                        {step.toUpperCase()}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-[var(--bg)] border border-[var(--border)] rounded p-4 h-60 overflow-y-auto font-mono text-[10.5px] leading-relaxed text-[var(--text-2)] space-y-2">
                  {activePr.logs.map((log, i) => (
                    <div key={i} className={
                      log.includes('Success') || log.includes('passed') ? 'text-emerald-500' :
                      log.includes('SDK') || log.includes('synthesizing') || log.includes('Synthesizing') ? 'text-[var(--text-3)]' :
                      'text-[var(--text-1)]'
                    }>
                      {log}
                    </div>
                  ))}
                  {activePr.step !== 'verified' && (
                    <div className="flex items-center gap-1.5 text-[var(--accent-text)] mt-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-ping" />
                      <span>Processing...</span>
                    </div>
                  )}
                </div>

                {activePr.step === 'verified' && (
                  <button
                    onClick={() => setActivePr({ id: null, step: 'idle', logs: [] })}
                    className="w-full bg-[var(--surface-2)] hover:bg-[var(--hover)] border border-[var(--border)] text-[var(--text-1)] text-xs py-1.5 rounded transition-colors cursor-pointer"
                  >
                    Close Portal
                  </button>
                )}
              </div>
            ) : (
              <div className="py-14 text-center space-y-3">
                <FileText className="w-9 h-9 text-[var(--text-3)] mx-auto" />
                <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto leading-relaxed">
                  Click <strong className="text-[var(--accent-text)]">"Track Objective"</strong> on any suggestion to watch the autonomous code generator inject metrics and create a Pull Request in real time.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
