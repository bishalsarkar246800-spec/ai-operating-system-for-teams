"use client";

import React, { useState } from "react";
import { Bot, Check, X, ShieldAlert, History, Clock, FileCheck } from "lucide-react";
import { AgentAction, AuditLogItem } from "@/lib/types";

interface ActionApprovalDrawerProps {
  actions: AgentAction[];
  auditLogs: AuditLogItem[];
  onApprove: (actionId: string) => Promise<void>;
  onReject: (actionId: string) => Promise<void>;
  isProcessing?: boolean;
}

export const ActionApprovalDrawer: React.FC<ActionApprovalDrawerProps> = ({
  actions,
  auditLogs,
  onApprove,
  onReject,
  isProcessing = false,
}) => {
  const [activeTab, setActiveTab] = useState<"pending" | "audit">("pending");

  const pendingActions = actions.filter((a) => a.status === "pending");
  const historicalActions = actions.filter((a) => a.status !== "pending");

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header & Sub-Tabs */}
      <div className="p-4 border-b-2 border-slate-900 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-indigo-600" />
            <h3 className="font-mono font-bold text-sm uppercase text-slate-900">
              HITL Agent Approval Gateway
            </h3>
          </div>
          {pendingActions.length > 0 && (
            <span className="font-mono text-xs bg-indigo-600 text-white font-bold px-2 py-0.5 rounded border border-slate-900">
              {pendingActions.length} Pending
            </span>
          )}
        </div>

        {/* Sub-Tabs: Pending vs Audit Logs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-1.5 px-3 rounded font-mono text-xs font-bold uppercase tracking-wider border-2 border-slate-900 transition-all ${
              activeTab === "pending"
                ? "bg-slate-900 text-white shadow-neo-sm"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Pending Actions ({pendingActions.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`flex-1 py-1.5 px-3 rounded font-mono text-xs font-bold uppercase tracking-wider border-2 border-slate-900 transition-all ${
              activeTab === "audit"
                ? "bg-slate-900 text-white shadow-neo-sm"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            Audit Log ({auditLogs.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === "pending" ? (
          pendingActions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono text-xs">
              <FileCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No actions pending human approval.</p>
              <p className="text-[11px] mt-1 text-slate-500">
                When team chatter introduces downstream risk, remedial agent proposals will appear here.
              </p>
            </div>
          ) : (
            pendingActions.map((action) => (
              <div
                key={action.id}
                className="p-3.5 rounded-lg border-2 border-slate-900 bg-white shadow-neo space-y-2.5 font-mono text-xs"
              >
                {/* Action Card Top */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                      Proposed Remediation
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">
                      {action.title}
                    </h4>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {action.id}
                  </span>
                </div>

                {/* Target Task info */}
                {action.task_title && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                    <span className="text-slate-400 font-bold">Target Task: </span>
                    <span className="font-bold text-slate-800">{action.task_title}</span>
                  </div>
                )}

                {/* Proposed schedule impact */}
                {action.proposed_shift_days > 0 && (
                  <div className="flex items-center space-x-1.5 text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-300 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Proposed shift: <strong>+{action.proposed_shift_days} days</strong> on affected schedule
                    </span>
                  </div>
                )}

                {/* Rationale & Impact summary */}
                <p className="text-slate-600 font-sans text-xs leading-relaxed">
                  {action.rationale}
                </p>

                {action.impact_summary && (
                  <p className="text-[11px] text-slate-500 italic font-sans">
                    {action.impact_summary}
                  </p>
                )}

                {/* Action Buttons: Approve & Reject */}
                <div className="flex space-x-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => onApprove(action.id)}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center space-x-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold border-2 border-slate-900 rounded shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Approve Intervention</span>
                  </button>

                  <button
                    onClick={() => onReject(action.id)}
                    disabled={isProcessing}
                    className="flex items-center justify-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border-2 border-slate-900 rounded shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>
                </div>
              </div>
            ))
          )
        ) : (
          /* Audit Logs Tab */
          auditLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-mono text-xs">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>No audit records logged yet.</p>
            </div>
          ) : (
            auditLogs.map((log) => {
              const isApproved = log.decision === "approved";
              const timestamp = new Date(log.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border-2 border-slate-900 bg-slate-50 font-mono text-xs shadow-neo-sm space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] border ${
                        isApproved
                          ? "bg-emerald-100 text-emerald-900 border-emerald-400"
                          : "bg-slate-200 text-slate-800 border-slate-400"
                      }`}
                    >
                      {log.decision}
                    </span>
                    <span className="text-[10px] text-slate-400">{timestamp}</span>
                  </div>

                  <p className="text-slate-800 font-bold">
                    By: {log.actor}
                  </p>

                  {log.details && (
                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {log.details}
                    </p>
                  )}
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
};
