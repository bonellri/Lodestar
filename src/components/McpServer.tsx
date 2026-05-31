import React, { useState } from 'react';
import { McpSessionLog } from '../types';
import { Terminal, Send, Server, Shield, Layers, Code, PlaySquare, ArrowRight, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
      jsonResp: `{\n  "result": {\n    "content": [\n      {\n        "type": "text",\n        "text": "Sandbox benchmark run completed successfully!\\n  Mean Latency: 92.1ms (no regression detected against baseline 94.2ms)"\n      }\n    ]\n  }\n}`
    }
  };

  const handleExecuteCommand = (cmdKey: string) => {
    // Post JSON Request log
    const reqLog: McpSessionLog = {
      timestamp: new Date().toLocaleTimeString(),
      direction: 'in',
      text: `cursor-agent --> lodestar_mcp: tools/call { "name": "${cmdKey}" }`
    };
    onAddLog(reqLog);

    // After 600ms, reply with mock response
    setTimeout(() => {
      const respLog: McpSessionLog = {
        timestamp: new Date().toLocaleTimeString(),
        direction: 'out',
        text: `lodestar_mcp --> cursor-agent: ${cmdKey === 'list_metrics' ? '6 metrics list' : cmdKey === 'get_metric_history' ? 'History results' : 'Benchmark run OK (92.1ms)'} response returned.`
      };
      onAddLog(respLog);
    }, 600);
  };

  return (
    <div className="space-y-6" id="mcp-server-view">
      
      {/* Intro explain card */}
      <div className="bg-[#121214]/60 border border-zinc-850 rounded-lg p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-8 space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20">
              <Server className="w-4 h-4 text-blue-400" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-100 font-sans">Model Context Protocol (MCP) Server</h2>
          </div>
          <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
            AI writing agents need clear objectives. Exposing Lodestar over the standard Model Context Protocol allows client models (such as Cursor, Windsurf, or custom workspace workflows) to automatically list objectives, read regression history, and run performance benchmarks on-the-fly *while* synthesizing code blocks.
          </p>
        </div>
        <div className="md:col-span-4 bg-zinc-950/80 rounded p-4 border border-zinc-900 flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono text-zinc-500">MCP Status</div>
          <div className="flex items-center gap-2 mt-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-zinc-200">mcp-server://localhost:4040</span>
          </div>
          <p className="text-[9px] text-zinc-500 mt-1 font-sans">Active bindings: stdio & websocket transport layers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tools directory & JSON Builder */}
        <div className="lg:col-span-12 xl:col-span-7 space-y-4">
          <h3 className="text-xs font-semibold uppercase text-zinc-500 font-mono tracking-wider">Available MCP Tool Specifications</h3>

          <div className="space-y-2">
            {Object.keys(COMMAND_SCHEMAS).map((cmdKey) => {
              const cmd = COMMAND_SCHEMAS[cmdKey];
              const isSelected = activeMcpCommand === cmdKey;

              return (
                <div
                  key={cmdKey}
                  onClick={() => setActiveMcpCommand(cmdKey)}
                  className={`p-4 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-[#18181b]/90 border-blue-500/80 shadow-[0_0_8px_rgba(59,130,246,0.1)]' 
                      : 'bg-[#121214]/60 border-zinc-850 hover:bg-[#18181b]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold text-blue-400">{cmdKey}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExecuteCommand(cmdKey);
                      }}
                      className="bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 font-mono py-1 px-2.5 rounded border border-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3 h-3 text-zinc-400" /> Execute Call
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-sans mt-2">{cmd.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Interactive JSON schemas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">CLIENT REQUEST (JSON-RPC)</span>
              <pre className="text-[10.5px] font-mono bg-zinc-950 p-4 rounded-lg border border-zinc-900 text-zinc-300 overflow-x-auto min-h-[170px] leading-relaxed">
                <code>{COMMAND_SCHEMAS[activeMcpCommand].jsonReq}</code>
              </pre>
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-zinc-500 uppercase">LODESTAR SERVER RESPONSE</span>
              <pre className="text-[10.5px] font-mono bg-zinc-950 p-4 rounded-lg border border-zinc-900 text-blue-400 overflow-x-auto min-h-[170px] leading-relaxed">
                <code>{COMMAND_SCHEMAS[activeMcpCommand].jsonResp}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Right: Live MCP stream terminal */}
        <div className="lg:col-span-12 xl:col-span-5">
          <div className="bg-[#121214]/60 border border-zinc-850 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <div className="flex items-center gap-1.5">
                <Terminal className="w-4 h-4 text-zinc-400" />
                <h3 className="text-xs font-semibold uppercase text-zinc-400 font-mono tracking-wider">MCP Connection Stream</h3>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Live logs</span>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-md p-4 h-[420px] max-h-[420px] overflow-y-auto font-mono text-[10.5px] leading-relaxed text-zinc-405 space-y-3">
              {logs.map((log, index) => {
                let colorClass = 'text-zinc-400';
                if (log.direction === 'in') colorClass = 'text-emerald-450';
                if (log.direction === 'out') colorClass = 'text-blue-400';
                if (log.direction === 'sys') colorClass = 'text-zinc-500';

                return (
                  <div key={index} className="space-y-0.5 border-b border-zinc-900/30 pb-2">
                    <div className="text-[9px] text-zinc-600 block">{log.timestamp}</div>
                    <pre className={`whitespace-pre-wrap font-mono ${colorClass}`}>
                      {log.text}
                    </pre>
                  </div>
                );
              })}
              <div className="flex items-center gap-1.5 text-zinc-500 mt-2">
                <span className="h-1 w-1 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[9px] font-mono">Listening on transport pipe...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
