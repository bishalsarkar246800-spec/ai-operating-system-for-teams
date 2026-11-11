"use client";

import React, { useState } from "react";
import { Activity, RefreshCw, FileText, ChevronDown, Plus, Layers } from "lucide-react";
import { WorkspaceItem } from "@/lib/types";

interface HeaderProps {
  activeWorkspaceId: string;
  workspaceName: string;
  workspaces: WorkspaceItem[];
  isWsConnected: boolean;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: () => void;
  onReset: () => void;
  onOpenDecompose: () => void;
  isResetting?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeWorkspaceId,
  workspaceName,
  workspaces,
  isWsConnected,
  onSelectWorkspace,
  onCreateWorkspace,
  onReset,
  onOpenDecompose,
  isResetting = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b-2 border-slate-900 px-6 py-2.5 flex items-center justify-between shadow-neo-sm z-30">
      {/* Brand & Workspace Selector */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-slate-900 text-white px-3 py-1.5 rounded border border-slate-900 font-mono text-sm tracking-wider shadow-neo-sm">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="font-bold">AI TEAMS OS</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-xs px-1.5 py-0.5 rounded border border-emerald-500/40 font-mono">
            v1.0.0
          </span>
        </div>

        {/* Workspace Dropdown Switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 px-3 py-1.5 rounded text-xs font-mono font-bold text-slate-900 shadow-neo-sm transition-all"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span className="max-w-[180px] truncate">{workspaceName || activeWorkspaceId}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border-2 border-slate-900 rounded-lg shadow-neo-lg py-1.5 z-50 font-mono text-xs">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                Switch Workspace
              </div>
              <div className="max-h-48 overflow-y-auto py-1">
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      onSelectWorkspace(w.id);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center justify-between transition-colors ${
                      w.id === activeWorkspaceId ? "bg-blue-50 font-bold text-blue-900" : "text-slate-800"
                    }`}
                  >
                    <span className="truncate">{w.name}</span>
                    <span className="text-[10px] text-slate-400">({w.total_tasks}t)</span>
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-200 pt-1 px-1.5">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onCreateWorkspace();
                  }}
                  className="w-full text-left px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold rounded flex items-center space-x-1.5 text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-700" />
                  <span>New Workspace...</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Connection & Global Actions */}
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
