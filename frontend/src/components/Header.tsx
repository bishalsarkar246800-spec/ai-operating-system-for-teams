"use client";

import React from "react";
import { Activity, RefreshCw, FileText, GitBranch, ShieldAlert } from "lucide-react";

interface HeaderProps {
  workspaceName: string;
  isWsConnected: boolean;
  onReset: () => void;
  onOpenDecompose: () => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  workspaceName,
  isWsConnected,
  onReset,
  onOpenDecompose,
  isResetting = false,
}) => {
  return (
    <header className="w-full bg-white border-b-2 border-slate-900 px-6 py-3 flex items-center justify-between shadow-neo-sm z-30">
      {/* Brand & Workspace Name */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-900 text-white px-3 py-1.5 rounded border border-slate-900 font-mono text-sm tracking-wider shadow-neo-sm">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold">AI TEAMS OS</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-xs px-1.5 py-0.5 rounded border border-emerald-500/40 font-mono">
            v1.0.0
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-2 text-slate-700 font-semibold text-sm">
          <span className="text-slate-400">/</span>
          <span className="bg-slate-100 border border-slate-900 px-2.5 py-1 rounded text-slate-900 shadow-neo-sm">
            {workspaceName || "Project Apex Workspace"}
          </span>
        </div>
      </div>

      {/* Real-time Connection & Controls */}
      <div className="flex items-center space-x-3">
        {/* WebSocket Status Indicator */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-50 border border-slate-900 rounded text-xs font-mono">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isWsConnected ? "bg-emerald-500 shadow-[0_0_8px_#10b981]" : "bg-amber-500 animate-ping"
            }`}
          />
          <span className="font-bold text-slate-800">
            {isWsConnected ? "WS SYNC ACTIVE" : "CONNECTING..."}
          </span>
        </div>

        {/* Decompose Brief Button */}
        <button
          onClick={onOpenDecompose}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide border-2 border-slate-900 rounded shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Decompose Brief</span>
        </button>

        {/* Reset / Seed Demo Workspace */}
        <button
          onClick={onReset}
          disabled={isResetting}
          title="Reset graph to default 8-node baseline"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs uppercase tracking-wide border-2 border-slate-900 rounded shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? "animate-spin" : ""}`} />
          <span>{isResetting ? "Resetting..." : "Reset Demo"}</span>
        </button>
      </div>
    </header>
  );
};

