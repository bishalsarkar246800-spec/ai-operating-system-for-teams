"use client";

import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
  Code2,
  Palette,
  Briefcase,
  Megaphone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  User,
  Zap,
} from "lucide-react";
import { TaskNodeData } from "@/lib/types";

const domainConfig: Record<
  string,
  { icon: React.ReactNode; bg: string; text: string; border: string }
> = {
  Engineering: {
    icon: <Code2 className="w-3.5 h-3.5" />,
    bg: "bg-blue-100",
    text: "text-blue-900",
    border: "border-blue-900",
  },
  Design: {
    icon: <Palette className="w-3.5 h-3.5" />,
    bg: "bg-purple-100",
    text: "text-purple-900",
    border: "border-purple-900",
  },
  Product: {
    icon: <Briefcase className="w-3.5 h-3.5" />,
    bg: "bg-emerald-100",
    text: "text-emerald-900",
    border: "border-emerald-900",
  },
  Marketing: {
    icon: <Megaphone className="w-3.5 h-3.5" />,
    bg: "bg-orange-100",
    text: "text-orange-900",
    border: "border-orange-900",
  },
};

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  on_track: {
    label: "On Track",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-600",
    dot: "bg-emerald-500",
  },
  at_risk: {
    label: "At Risk",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-600",
    dot: "bg-amber-500 animate-pulse",
  },
  blocked: {
    label: "Blocked",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-600",
    dot: "bg-red-600 animate-ping",
  },
  completed: {
    label: "Completed",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-500",
    dot: "bg-blue-600",
  },
};

export const TaskNode = memo((props: any) => {
  const nodeData = props.data as TaskNodeData;
  const domain = domainConfig[nodeData.domain] || domainConfig["Engineering"];
  const status = statusConfig[nodeData.status] || statusConfig["on_track"];

  const isBlocked = nodeData.status === "blocked";
  const isAtRisk = nodeData.status === "at_risk";
  const isCriticalPath = Boolean(nodeData.is_critical_path);

  return (
    <div
      className={`relative w-72 bg-white rounded-lg border-2 border-slate-900 transition-all ${
        isBlocked
          ? "shadow-[4px_4px_0px_0px_#ef4444] border-red-900 ring-2 ring-red-400"
          : isAtRisk
          ? "shadow-[4px_4px_0px_0px_#f59e0b] border-amber-900"
          : isCriticalPath
          ? "shadow-[4px_4px_0px_0px_#3b82f6] border-blue-900"
          : "shadow-neo"
      }`}
    >
      {/* Target Handles (incoming dependencies) */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-white"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-white"
      />

      {/* Card Header: Domain Tag & ID */}
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-slate-900 bg-slate-50 rounded-t-[6px]">
        <div className="flex items-center space-x-1.5">
          <span
            className={`flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${domain.bg} ${domain.text} ${domain.border}`}
          >
            {domain.icon}
            <span>{nodeData.domain}</span>
          </span>
          <span className="font-mono text-xs font-bold text-slate-500">
            {nodeData.id}
          </span>
        </div>

        {/* Critical Path Badge */}
        {isCriticalPath && (
          <span className="flex items-center space-x-1 bg-blue-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-800">
            <Zap className="w-2.5 h-2.5 text-yellow-300" />
            <span>CRIT PATH</span>
          </span>
        )}
      </div>

      {/* Card Body: Title & Status */}
      <div className="p-3">
        <h4 className="font-bold text-sm text-slate-900 leading-snug mb-1">
          {nodeData.title}
        </h4>
        {nodeData.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-2.5">
            {nodeData.description}
          </p>
        )}

        {/* Status Pill & Delay Reason */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-bold font-mono border ${status.bg} ${status.text} ${status.border}`}
          >
            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
            <span>{status.label}</span>
          </div>

          <div className="flex items-center space-x-1 text-xs font-mono text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{nodeData.duration_days}d</span>
          </div>
        </div>

        {/* Cumulative Delay Callout */}
        {nodeData.cumulative_delay_days > 0 && (
          <div className="flex items-start space-x-1.5 bg-red-50 border border-red-400 text-red-900 p-1.5 rounded text-[11px] font-mono mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">+{nodeData.cumulative_delay_days}d delay</span>
              {nodeData.delay_reason && (
                <p className="text-[10px] text-red-700 leading-tight">
                  {nodeData.delay_reason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Card Footer: Assignee */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center space-x-1.5 truncate">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
              {nodeData.owner ? nodeData.owner[0] : "?"}
            </div>
            <span className="truncate font-medium">{nodeData.owner || "Unassigned"}</span>
          </div>
        </div>
      </div>

      {/* Source Handles (outgoing dependencies) */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-white"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-3 !h-3 !bg-slate-900 !border-2 !border-white"
      />
    </div>
  );
});

TaskNode.displayName = "TaskNode";
