"use client";

import React, { useState } from "react";
import { MessageSquare, ShieldCheck, ChevronRight, ChevronLeft } from "lucide-react";
import { ActivityFeed } from "./ActivityFeed";
import { ActionApprovalDrawer } from "./ActionApprovalDrawer";
import { WorkspaceEventItem, AgentAction, AuditLogItem } from "@/lib/types";

interface RightPanelProps {
  events: WorkspaceEventItem[];
  actions: AgentAction[];
  auditLogs: AuditLogItem[];
  onSendEvent: (text: string, author?: string) => Promise<void>;
  onApproveAction: (actionId: string) => Promise<void>;
  onRejectAction: (actionId: string) => Promise<void>;
  isIngesting?: boolean;
  isProcessingAction?: boolean;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  events,
  actions,
  auditLogs,
  onSendEvent,
  onApproveAction,
  onRejectAction,
  isIngesting,
  isProcessingAction,
}) => {
  const [activeTab, setActiveTab] = useState<"activity" | "actions">("activity");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const pendingActionsCount = actions.filter((a) => a.status === "pending").length;

  if (isCollapsed) {
    return (
      <div className="h-full bg-white border-l-2 border-slate-900 flex flex-col items-center py-4 px-2 space-y-4 shadow-neo-sm z-20">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-slate-900 rounded shadow-neo-sm transition-all"
          title="Expand Panel"
        >
          <ChevronLeft className="w-4 h-4 text-slate-800" />
        </button>

        <button
          onClick={() => {
            setIsCollapsed(false);
            setActiveTab("activity");
          }}
          className="p-2 hover:bg-slate-100 rounded border border-transparent hover:border-slate-900 transition-all relative"
          title="Team Activity"
        >
          <MessageSquare className="w-4 h-4 text-slate-700" />
        </button>

        <button
          onClick={() => {
            setIsCollapsed(false);
            setActiveTab("actions");
          }}
          className="p-2 hover:bg-slate-100 rounded border border-transparent hover:border-slate-900 transition-all relative"
          title="HITL Approvals"
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          {pendingActionsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-600 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center">
              {pendingActionsCount}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <aside className="w-96 md:w-[420px] h-full bg-white border-l-2 border-slate-900 flex flex-col shadow-neo z-20 shrink-0">
      {/* Top Tab Switcher */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b-2 border-slate-900 bg-slate-100">
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider border-2 border-slate-900 transition-all ${
              activeTab === "activity"
                ? "bg-slate-900 text-white shadow-neo-sm"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Activity Feed</span>
          </button>

          <button
            onClick={() => setActiveTab("actions")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs font-bold uppercase tracking-wider border-2 border-slate-900 transition-all relative ${
              activeTab === "actions"
                ? "bg-slate-900 text-white shadow-neo-sm"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>HITL Actions</span>
            {pendingActionsCount > 0 && (
              <span className="bg-red-500 text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                {pendingActionsCount}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-slate-200 border border-slate-900 rounded transition-all"
          title="Collapse Panel"
        >
          <ChevronRight className="w-4 h-4 text-slate-700" />
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "activity" ? (
          <ActivityFeed
            events={events}
            onSendEvent={onSendEvent}
            isIngesting={isIngesting}
          />
        ) : (
          <ActionApprovalDrawer
            actions={actions}
            auditLogs={auditLogs}
            onApprove={onApproveAction}
            onReject={onRejectAction}
            isProcessing={isProcessingAction}
          />
        )}
      </div>
    </aside>
  );
};

