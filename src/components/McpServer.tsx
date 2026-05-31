import React, { useState } from 'react';
import { McpSessionLog } from '../types';
import { Terminal, Send, Server, Shield } from 'lucide-react';

interface McpServerProps {
  logs: McpSessionLog[];
  onAddLog: (log: McpSessionLog) => void;
}

export default function McpServer({ logs, onAddLog }: McpServerProps) {
  const [activeMcpCommand, setActiveMcpCommand] = useState<string>('list_metrics');

  const COMMAND_SCHEMAS: Record<string, { desc: string; jsonReq: string; jsonResp: string }> = {
    list_metrics: {
      desc: 'Retrieves current definitions, status, targets, and active values of all configured codebase metrics.',
      jsonReq: `{\n  "jsonrpc": "2.0",\n  "method": "tools/call",\n  "params": {\n    "name": "list_metrics"\n  },\n  "id": 1\n}`,
      jsonResp: `{\n  "result": {\n    "content": [\n      {\n        "type": "text",\n        "text": "Found 6 active telemetry metrics: api-feed-latency (94.2ms), bundle-size-main (184.2KB), test-coverage (88.5%), db-pool-exhaustion (4.8ms), cache-hit-rate (91.2%), llm-inference-cost ($0.048)."\n      }\n    ]\n  }\n}`
    },
    get_metric_history: {
      desc: 'Retrieve previous commit telemetry data for a specific metric key to inspect regressions.',
      jsonReq: `{\n  "jsonrpc": "2.0",\n  "method": "tools/call",\n  "params": {\n    "name": "get_metric_history",\n    "arguments": {\n      "metricId": "api-feed-latency",\n      "limit": 3\n    }\n  },\n  "id": 2\n}`,
      jsonResp: `{\n  "result": {\n    "content": [\n      {\n        "type": "text",\n        "text": "History for api-feed-latency:\\n  Commit df84a0c: 152.0ms\\n  Commit b5e6f98: 153.2ms\\n  Commit e3f1c9d (Latest): 94.2ms"\n      }\n    ]\n  }\n}`
    },
    run_benchmark: {
      desc: 'Instructs the sandbox runner to execute local file targets under simulated concurrency to check for regressions.',
      jsonReq: `{\n  "jsonrpc": "2.0",\n  "method": "tools/call",\n  "params": {\n    "name": "run_benchmark",\n    "arguments": {\n      "filePath": "src/routes/items.ts",\n      "concurrency": 25\n    }\n  },\n  "id": 3\n}`,
      jsonResp: `{\n  "result": {\n    "content": [\n      {\n        "type": "text",\n        "text": "Sandbox benchmark completed.\\n  Mean Latency: 92.1ms (no regression vs baseline 94.2ms)"\n      }\n    ]\n  }\n}`
    }
  };

  const handleExecuteCommand = (cmdKey: string) => {
    const reqLog: McpSessionLog = {
      timestamp: new Date().toLocaleTimeString(),
      direction: 'in',
      text: `cursor-agent → lodestar_mcp: tools/call { "name": "${cmdKey}" }`
    };
    onAddLog(reqLog);

    setTimeout(() => {
      const respLog: McpSessionLog = {
        timestamp: new Date().toLocaleTimeString(),
        direction: 'out',
        text: `lodestar_mcp → cursor-agent: ${
          cmdKey === 'list_metrics' ? '6 metrics returned' :
          cmdKey === 'get_metric_history' ? 'history results returned' :
          'benchmark OK (92.1ms)'
        }`
      };
      onAddLog(respLog);
    }, 600);
  };

  return (
    <div className="space-y-5 animate-fade-in text-left font-sans" id="mcp-server-view">

      {/* INTRO */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[var(--surface-2)] border border-[var(--border)]">
              <Server className="w-4 h-4 text-[var(--accent-text)]" />
            </div>
            <h2 className="text-sm font-semibold text-[var(--text-1)]">Model Context Protocol (MCP) Server</h2>
          </div>
          <p className="text-[11px] text-[var(--text-2)] leading-relaxed">
            Exposing Lodestar over MCP allows AI coding agents (Cursor, Windsurf, Claude Code, etc.) to list objectives, read regression history, and run performance benchmarks on-the-fly while generating code.
          </p>
        </div>
        <div className="md:col-span-4 bg-[var(--bg)] rounded-lg p-4 border border-[var(--border)] flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono text-[var(--text-3)]">Connection Status</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-[var(--text-1)]">mcp://localhost:4040</span>
          </div>
          <p className="text-[9px] text-[var(--text-3)] mt-1.5">stdio + websocket transport active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* LEFT: Tool directory */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-semibold uppercase text-[var(--text-2)] tracking-wider">Available MCP Tools</h3>

          <div className="space-y-2">
            {Object.keys(COMMAND_SCHEMAS).map((cmdKey) => {
              const cmd = COMMAND_SCHEMAS[cmdKey];
              const isSelected = activeMcpCommand === cmdKey;
              return (
                <div
                  key={cmdKey}
                  onClick={() => setActiveMcpCommand(cmdKey)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)]'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-[var(--accent-text)]">{cmdKey}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleExecuteCommand(cmdKey); }}
                      className="bg-[var(--surface-2)] hover:bg-[var(--hover)] text-[10.5px] text-[var(--text-1)] font-mono py-1.5 px-3 rounded border border-[var(--border)] transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3 h-3 text-[var(--text-2)]" /> Execute
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--text-2)] mt-2">{cmd.desc}</p>
                </div>
              );
            })}
          </div>

          {/* JSON Schemas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Client Request</span>
              <pre className="text-[10.5px] font-mono bg-[var(--bg)] p-4 border border-[var(--border)] rounded text-[var(--text-1)] overflow-x-auto min-h-[170px] leading-relaxed select-text">
                <code>{COMMAND_SCHEMAS[activeMcpCommand].jsonReq}</code>
              </pre>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-[var(--text-3)] uppercase">Server Response</span>
              <pre className="text-[10.5px] font-mono bg-[var(--bg)] p-4 border border-[var(--border)] rounded text-[var(--accent-text)] overflow-x-auto min-h-[170px] leading-relaxed select-text">
                <code>{COMMAND_SCHEMAS[activeMcpCommand].jsonResp}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* RIGHT: Live stream */}
        <div className="lg:col-span-5">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-[var(--text-2)]" />
                <h3 className="text-xs font-semibold uppercase text-[var(--text-2)] tracking-wider">Connection Stream</h3>
              </div>
              <span className="text-[10px] font-mono text-[var(--text-3)]">pipe trace</span>
            </div>

            <div className="bg-[var(--bg)] border border-[var(--border)] rounded p-4 h-[440px] overflow-y-auto font-mono text-[10.5px] leading-relaxed space-y-3">
              {logs.map((log, i) => {
                const colorCls =
                  log.direction === 'in' ? 'text-emerald-500' :
                  log.direction === 'out' ? 'text-[var(--accent-text)]' :
                  'text-[var(--text-3)]';
                return (
                  <div key={i} className="space-y-0.5 border-b border-[var(--border)]/50 pb-2">
                    <div className="text-[9px] text-[var(--text-3)]">{log.timestamp}</div>
                    <pre className={`whitespace-pre-wrap font-mono ${colorCls}`}>{log.text}</pre>
                  </div>
                );
              })}
              <div className="flex items-center gap-1.5 text-[var(--text-3)] mt-1">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono">Listening on stdio transport...</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
