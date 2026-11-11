"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Clock,
  User,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Save,
} from "lucide-react";
import { TaskNodeData, TaskStatus, ReactFlowEdgeItem } from "@/lib/types";

interface TaskDetailsModalProps {
  task: TaskNodeData | null;
  isOpen: boolean;
  onClose: () => void;
  edges: ReactFlowEdgeItem[];
  allTasks: TaskNodeData[];
  onUpdateStatus: (
    nodeId: string,
    status: TaskStatus,
    cumulativeDelayDays?: number,
    delayReason?: string
  ) => Promise<void>;
  isUpdating?: boolean;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  edges,
  allTasks,
  onUpdateStatus,
  isUpdating = false,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>("on_track");
  const [delayDays, setDelayDays] = useState<number>(0);
  const [delayReason, setDelayReason] = useState<string>("");

  useEffect(() => {
    if (task) {
      setSelectedStatus(task.status);
      setDelayDays(task.cumulative_delay_days || 0);
      setDelayReason(task.delay_reason || "");
    }
  }, [task]);

  if (!isOpen || !task) return null;

  // Find incoming (parents) and outgoing (children) dependencies
  const incomingEdges = edges.filter((e) => e.target === task.id);
  const outgoingEdges = edges.filter((e) => e.source === task.id);

  const parentTasks = incomingEdges
    .map((e) => allTasks.find((t) => t.id === e.source))
    .filter(Boolean) as TaskNodeData[];

  const childTasks = outgoingEdges
    .map((e) => allTasks.find((t) => t.id === e.target))
    .filter(Boolean) as TaskNodeData[];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateStatus(task.id, selectedStatus, delayDays, delayReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-slate-900 rounded-lg shadow-neo-lg w-full max-w-lg font-mono text-xs max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-slate-900 bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="bg-slate-900 text-white px-2 py-0.5 rounded font-bold">
              {task.id}
            </span>
            <span className="font-bold text-slate-700 uppercase">
              Task Details & Manual Override
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 border border-slate-900 rounded transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500">
              Domain: {task.domain}
            </span>
            <h3 className="font-bold text-base text-slate-900 mt-0.5">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-slate-600 font-sans text-xs mt-1 leading-relaxed">
                {task.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded">
            <div>
              <span className="text-[10px] text-slate-500 block font-bold uppercase">Assignee</span>
              <div className="flex items-center space-x-1.5 mt-1 font-bold text-slate-800">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>{task.owner || "Unassigned"}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block font-bold uppercase">Duration</span>
              <div className="flex items-center space-x-1.5 mt-1 font-bold text-slate-800">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{task.duration_days} Days</span>
                {task.is_critical_path && (
                  <span className="bg-blue-600 text-white text-[9px] px-1 py-0.2 rounded font-bold">
                    CRIT
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dependencies Breakdown */}
          <div className="space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center space-x-1">
                <ArrowLeft className="w-3 h-3 text-slate-600" />
                <span>Depends On ({parentTasks.length}):</span>
              </span>
              {parentTasks.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No incoming dependencies (Root Node)</p>
              ) : (
                <div className="space-y-1 mt-1">
                  {parentTasks.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-1.5 bg-slate-100 border border-slate-300 rounded text-[11px]"
                    >
                      <span className="font-bold">{p.id}: {p.title}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-600">[{p.status}]</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center space-x-1">
                <ArrowRight className="w-3 h-3 text-slate-600" />
                <span>Unblocks Downstream ({childTasks.length}):</span>
              </span>
              {childTasks.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No dependent child tasks (Leaf Node)</p>
              ) : (
                <div className="space-y-1 mt-1">
                  {childTasks.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-1.5 bg-slate-100 border border-slate-300 rounded text-[11px]"
                    >
                      <span className="font-bold">{c.id}: {c.title}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-600">[{c.status}]</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Manual Status & Delay Adjustment */}
          <div className="p-3 bg-white border-2 border-slate-900 rounded space-y-3">
            <span className="font-bold text-slate-900 uppercase block text-[11px]">
              Manual Status & Risk Override
            </span>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Update Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["on_track", "at_risk", "blocked", "completed"] as TaskStatus[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatus(st)}
                    className={`py-1.5 px-2 rounded font-bold uppercase text-[11px] border-2 border-slate-900 transition-all ${
                      selectedStatus === st
                        ? st === "blocked"
                          ? "bg-red-500 text-white shadow-neo-sm"
                          : st === "at_risk"
                          ? "bg-amber-400 text-slate-900 shadow-neo-sm"
                          : st === "completed"
                          ? "bg-blue-600 text-white shadow-neo-sm"
                          : "bg-emerald-400 text-slate-900 shadow-neo-sm"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Cumulative Delay (Days)
              </label>
              <input
                type="number"
                min={0}
                max={30}
                value={delayDays}
                onChange={(e) => setDelayDays(parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 border border-slate-900 rounded font-mono"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                Reason / Note
              </label>
              <input
                type="text"
                value={delayReason}
                onChange={(e) => setDelayReason(e.target.value)}
                placeholder="e.g. Waiting on third-party security audit"
                className="w-full px-2.5 py-1.5 border border-slate-900 rounded font-mono"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-900 rounded font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 rounded font-bold shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isUpdating ? "Saving..." : "Apply & Recalculate"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

