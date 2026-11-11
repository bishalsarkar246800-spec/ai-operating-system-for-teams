"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, ShieldAlert, GitCommit, Clock, CheckCircle2, Bot } from "lucide-react";
import { WorkspaceMetrics } from "@/lib/types";

interface MetricsBannerProps {
  metrics: WorkspaceMetrics;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ metrics }) => {
  const isHealthy = metrics.health_status === "healthy";
  const isAtRisk = metrics.health_status === "at_risk";
  const isCritical = metrics.health_status === "critical";

  return (
    <div className="w-full bg-slate-100 border-b-2 border-slate-900 px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 z-20">
      {/* Left: Overall Health Badge */}
      <div className="flex items-center space-x-3">
        <span className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
          Workspace Health:
        </span>
        <div
          className={`flex items-center space-x-2 px-3 py-1 rounded border-2 border-slate-900 font-mono font-black text-xs uppercase tracking-wide shadow-neo-sm ${
            isHealthy
              ? "bg-emerald-400 text-slate-900"
              : isAtRisk
              ? "bg-amber-400 text-slate-900"
              : "bg-red-500 text-white animate-pulse"
          }`}
        >
          {isHealthy && <ShieldCheck className="w-4 h-4" />}
          {isAtRisk && <AlertTriangle className="w-4 h-4" />}
          {isCritical && <ShieldAlert className="w-4 h-4" />}
          <span>
            {isHealthy ? "STATUS: ON TRACK" : isAtRisk ? "STATUS: AT RISK" : "STATUS: CRITICAL BLOCKER"}
          </span>
        </div>
      </div>

      {/* Middle: Key Metric Pills */}
      <div className="flex items-center flex-wrap gap-2.5">
        {/* Progress % */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded border-2 border-slate-900 shadow-neo-sm font-mono text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-600 font-bold">Progress:</span>
          <span className="font-black text-slate-900">{metrics.completion_percentage}%</span>
          <span className="text-slate-400">({metrics.completed_tasks}/{metrics.total_tasks} done)</span>
        </div>

        {/* Critical Path Duration */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded border-2 border-slate-900 shadow-neo-sm font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-slate-600 font-bold">Critical Path:</span>
          <span className="font-black text-slate-900">{metrics.critical_path_duration_days} Days</span>
        </div>

        {/* Blocked Count */}
        {metrics.blocked_tasks > 0 && (
          <div className="flex items-center space-x-1.5 bg-red-100 text-red-900 px-3 py-1 rounded border-2 border-slate-900 shadow-neo-sm font-mono text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-red-600" />
            <span>{metrics.blocked_tasks} Blocked</span>
          </div>
        )}

        {/* At Risk Count */}
        {metrics.at_risk_tasks > 0 && (
          <div className="flex items-center space-x-1.5 bg-amber-100 text-amber-900 px-3 py-1 rounded border-2 border-slate-900 shadow-neo-sm font-mono text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{metrics.at_risk_tasks} At Risk</span>
          </div>
        )}

        {/* Total Delayed Days */}
        {metrics.total_delayed_days > 0 && (
          <div className="flex items-center space-x-1 bg-white px-2.5 py-1 rounded border-2 border-slate-900 shadow-neo-sm font-mono text-xs">
            <span className="text-slate-500 font-bold">Cumulative Delay:</span>
            <span className="font-black text-red-600">+{metrics.total_delayed_days}d</span>
          </div>
        )}

        {/* Pending Actions Alert */}
        {metrics.pending_actions_count > 0 && (
          <div className="flex items-center space-x-1.5 bg-indigo-600 text-white px-3 py-1 rounded border-2 border-slate-900 shadow-neo-sm font-mono text-xs font-black animate-bounce">
            <Bot className="w-3.5 h-3.5 text-yellow-300" />
            <span>{metrics.pending_actions_count} HITL Action Pending</span>
          </div>
        )}
      </div>
    </div>
  );
};
