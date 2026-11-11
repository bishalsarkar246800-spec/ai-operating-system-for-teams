"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { MetricsBanner } from "@/components/MetricsBanner";
import { GraphCanvas } from "@/components/canvas/GraphCanvas";
import { RightPanel } from "@/components/panels/RightPanel";
import { DecomposeModal } from "@/components/panels/DecomposeModal";
import {
  fetchGraph,
  fetchActions,
  fetchAuditLogs,
  fetchEvents,
  ingestEvent,
  approveAction,
  rejectAction,
  resetAndSeedWorkspace,
  decomposeBrief,
} from "@/lib/api";
import { useWorkspaceSocket } from "@/hooks/useWorkspaceSocket";
import {
  GraphStateResponse,
  AgentAction,
  WorkspaceEventItem,
  AuditLogItem,
  WorkspaceMetrics,
} from "@/lib/types";

export default function WorkspacePage() {
  const [workspaceId] = useState<string>("apex-launch");
  const [workspaceName, setWorkspaceName] = useState<string>("Project Apex: Platform Launch");
  
  const [graphState, setGraphState] = useState<GraphStateResponse | null>(null);
  const [events, setEvents] = useState<WorkspaceEventItem[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [isDecomposeOpen, setIsDecomposeOpen] = useState<boolean>(false);

  // Load all initial data
  const loadWorkspaceData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [g, a, logs, evts] = await Promise.all([
        fetchGraph(workspaceId),
        fetchActions(workspaceId),
        fetchAuditLogs(workspaceId),
        fetchEvents(workspaceId),
      ]);
      setGraphState(g);
      setActions(a);
      setAuditLogs(logs);
      setEvents(evts);
      if (g.metrics?.workspace_name) {
        setWorkspaceName(g.metrics.workspace_name);
      }
    } catch (err) {
      console.error("Error loading workspace data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadWorkspaceData();
  }, [loadWorkspaceData]);

  // Handle incoming real-time WebSocket events
  const handleSocketEvent = useCallback(
    (event: { type: string; [key: string]: any }) => {
      console.log("[WS Incoming Event]", event.type, event);

      if (event.type === "graph_updated" && event.data) {
        setGraphState(event.data);
      } else if (event.type === "event_ingested") {
        if (event.fresh_graph) {
          setGraphState(event.fresh_graph);
        }
        if (event.event) {
          setEvents((prev) => [event.event, ...prev]);
        }
        // Refresh actions list
        fetchActions(workspaceId).then(setActions).catch(console.error);
      } else if (event.type === "agent_action_created") {
        fetchActions(workspaceId).then(setActions).catch(console.error);
      } else if (event.type === "action_approved" || event.type === "action_rejected") {
        if (event.fresh_graph) {
          setGraphState(event.fresh_graph);
        }
        fetchActions(workspaceId).then(setActions).catch(console.error);
        fetchAuditLogs(workspaceId).then(setAuditLogs).catch(console.error);
      } else if (event.type === "brief_decomposed" || event.type === "workspace_reset") {
        if (event.data) {
          setGraphState(event.data);
        }
        loadWorkspaceData();
      }
    },
    [workspaceId, loadWorkspaceData]
  );

  const { isConnected: isWsConnected } = useWorkspaceSocket(workspaceId, handleSocketEvent);

  // User Actions
  const handleSendEvent = async (text: string, author: string = "Team Member") => {
    try {
      setIsIngesting(true);
      const res = await ingestEvent(workspaceId, text, author);
      // Data will refresh via WebSocket broadcast
    } catch (err) {
      console.error("Error ingesting event:", err);
    } finally {
      setIsIngesting(false);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    try {
      setIsProcessingAction(true);
      await approveAction(actionId, "Human Operator", "Approved via HITL drawer");
    } catch (err) {
      console.error("Error approving action:", err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectAction = async (actionId: string) => {
    try {
      setIsProcessingAction(true);
      await rejectAction(actionId, "Human Operator", "Dismissed via HITL drawer");
    } catch (err) {
      console.error("Error rejecting action:", err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      const fresh = await resetAndSeedWorkspace(workspaceId);
      setGraphState(fresh);
      await loadWorkspaceData();
    } catch (err) {
      console.error("Error resetting workspace:", err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleDecompose = async (briefText: string, title?: string) => {
    try {
      setIsLoading(true);
      await decomposeBrief(workspaceId, briefText, title);
      await loadWorkspaceData();
    } catch (err) {
      console.error("Error decomposing brief:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const defaultMetrics: WorkspaceMetrics = {
    workspace_id: workspaceId,
    workspace_name: workspaceName,
    health_status: "healthy",
    total_tasks: 0,
    completed_tasks: 0,
    at_risk_tasks: 0,
    blocked_tasks: 0,
    completion_percentage: 0,
    critical_path_duration_days: 0,
    total_delayed_days: 0,
    pending_actions_count: actions.filter((a) => a.status === "pending").length,
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* 1. Top Header */}
      <Header
        workspaceName={workspaceName}
        isWsConnected={isWsConnected}
        onReset={handleReset}
        onOpenDecompose={() => setIsDecomposeOpen(true)}
        isResetting={isResetting}
      />

      {/* 2. Top Metrics & Health Banner */}
      <MetricsBanner metrics={graphState?.metrics || defaultMetrics} />

      {/* 3. Main Workspace Canvas & Side Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Center: React Flow Interactive DAG Canvas */}
        <main className="flex-1 h-full relative">
          {isLoading && !graphState ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
              <div className="text-center font-mono">
                <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Initializing Graph Engine...
                </p>
              </div>
            </div>
          ) : null}

          <GraphCanvas
            nodes={graphState?.nodes || []}
            edges={graphState?.edges || []}
          />
        </main>

        {/* Right: Side Panel (Chat Activity & HITL Action Gateway) */}
        <RightPanel
          events={events}
          actions={actions}
          auditLogs={auditLogs}
          onSendEvent={handleSendEvent}
          onApproveAction={handleApproveAction}
          onRejectAction={handleRejectAction}
          isIngesting={isIngesting}
          isProcessingAction={isProcessingAction}
        />
      </div>

      {/* 4. Decompose Brief Modal */}
      <DecomposeModal
        isOpen={isDecomposeOpen}
        onClose={() => setIsDecomposeOpen(false)}
        onDecompose={handleDecompose}
        isSubmitting={isLoading}
      />
    </div>
  );
}

