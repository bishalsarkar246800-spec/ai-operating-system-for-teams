"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { MetricsBanner } from "@/components/MetricsBanner";
import { GraphCanvas } from "@/components/canvas/GraphCanvas";
import { TimelineView } from "@/components/canvas/TimelineView";
import { RightPanel } from "@/components/panels/RightPanel";
import { DecomposeModal } from "@/components/panels/DecomposeModal";
import { TaskDetailsModal } from "@/components/canvas/TaskDetailsModal";
import { NewWorkspaceModal } from "@/components/panels/NewWorkspaceModal";
import { CreateTaskModal } from "@/components/panels/CreateTaskModal";
import {
  fetchGraph,
  fetchActions,
  fetchAuditLogs,
  fetchEvents,
  fetchWorkspaces,
  createWorkspace,
  createTask,
  ingestEvent,
  approveAction,
  rejectAction,
  resetAndSeedWorkspace,
  decomposeBrief,
  updateNodeStatus,
} from "@/lib/api";
import { useWorkspaceSocket } from "@/hooks/useWorkspaceSocket";
import {
  GraphStateResponse,
  AgentAction,
  WorkspaceEventItem,
  AuditLogItem,
  WorkspaceMetrics,
  WorkspaceItem,
  TaskNodeData,
  TaskStatus,
} from "@/lib/types";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function WorkspacePage() {
  const [workspaceId, setWorkspaceId] = useState<string>("apex-launch");
  const [workspaceName, setWorkspaceName] = useState<string>("Project Apex: Platform Launch");
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  
  const [graphState, setGraphState] = useState<GraphStateResponse | null>(null);
  const [events, setEvents] = useState<WorkspaceEventItem[]>([]);
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // View Mode: Canvas vs Timeline
  const [viewMode, setViewMode] = useState<"canvas" | "timeline">("canvas");

  // Modals & Drawers
  const [selectedTask, setSelectedTask] = useState<TaskNodeData | null>(null);
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState<boolean>(false);
  const [isDecomposeOpen, setIsDecomposeOpen] = useState<boolean>(false);
  const [isNewWorkspaceOpen, setIsNewWorkspaceOpen] = useState<boolean>(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState<boolean>(false);

  // Loading States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState<boolean>(false);

  // Transient Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "info" | "warning" | "success" } | null>(null);

  const showToast = (text: string, type: "info" | "warning" | "success" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Load all initial data for current workspace
  const loadWorkspaceData = useCallback(async (wsId: string) => {
    try {
      setIsLoading(true);
      const [g, a, logs, evts, wsList] = await Promise.all([
        fetchGraph(wsId),
        fetchActions(wsId),
        fetchAuditLogs(wsId),
        fetchEvents(wsId),
        fetchWorkspaces().catch(() => []),
      ]);
      setGraphState(g);
      setActions(a);
      setAuditLogs(logs);
      setEvents(evts);
      if (wsList && wsList.length > 0) {
        setWorkspaces(wsList);
      }
      if (g.metrics?.workspace_name) {
        setWorkspaceName(g.metrics.workspace_name);
      }
    } catch (err) {
      console.error("Error loading workspace data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspaceData(workspaceId);
  }, [workspaceId, loadWorkspaceData]);

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
        showToast("⚡ Team event ingested & risk propagated to downstream DAG", "warning");
        fetchActions(workspaceId).then(setActions).catch(console.error);
      } else if (event.type === "agent_action_created") {
        fetchActions(workspaceId).then(setActions).catch(console.error);
        showToast("🤖 New HITL remediation proposed for review", "info");
      } else if (event.type === "action_approved" || event.type === "action_rejected") {
        if (event.fresh_graph) {
          setGraphState(event.fresh_graph);
        }
        fetchActions(workspaceId).then(setActions).catch(console.error);
        fetchAuditLogs(workspaceId).then(setAuditLogs).catch(console.error);
        showToast(event.message || "Action updated", "success");
      } else if (event.type === "brief_decomposed" || event.type === "workspace_reset") {
        if (event.data) {
          setGraphState(event.data);
        }
        loadWorkspaceData(workspaceId);
      }
    },
    [workspaceId, loadWorkspaceData]
  );

  const { isConnected: isWsConnected } = useWorkspaceSocket(workspaceId, handleSocketEvent);

  // User Actions
  const handleNodeClick = (nodeId: string) => {
    const matched = graphState?.nodes.find((n) => n.id === nodeId);
    if (matched) {
      setSelectedTask(matched.data);
      setIsTaskDetailsOpen(true);
    }
  };

  const handleUpdateTaskStatus = async (
    nodeId: string,
    status: TaskStatus,
    cumulativeDelayDays?: number,
    delayReason?: string
  ) => {
    try {
      setIsUpdatingTask(true);
      const updated = await updateNodeStatus(
        workspaceId,
        nodeId,
        status,
        cumulativeDelayDays,
        delayReason
      );
      setGraphState(updated);
      showToast(`Task ${nodeId} status updated to ${status}`, "success");
    } catch (err) {
      console.error("Error updating task status:", err);
      showToast(`Failed to update task ${nodeId}`, "warning");
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleSendEvent = async (text: string, author: string = "Team Member") => {
    try {
      setIsIngesting(true);
      await ingestEvent(workspaceId, text, author);
    } catch (err) {
      console.error("Error ingesting event:", err);
      showToast("Error processing team event", "warning");
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
      await loadWorkspaceData(workspaceId);
      showToast("Workspace reset to standard 8-node baseline", "info");
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
      await loadWorkspaceData(workspaceId);
      showToast("Brief successfully decomposed into dependency graph!", "success");
    } catch (err) {
      console.error("Error decomposing brief:", err);
      showToast("Failed to decompose brief", "warning");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async (id: string, name: string, seedSample: boolean) => {
    try {
      const created = await createWorkspace(id, name, undefined, seedSample);
      setWorkspaces((prev) => [...prev, created]);
      setWorkspaceId(id);
      setWorkspaceName(name);
      showToast(`Workspace '${name}' created!`, "success");
    } catch (err) {
      console.error("Error creating workspace:", err);
      showToast("Failed to create workspace", "warning");
    }
  };

  const handleCreateTask = async (payload: {
    title: string;
    description?: string;
    domain: string;
    owner: string;
    duration_days: number;
    depends_on_task_id?: string;
  }) => {
    try {
      setIsLoading(true);
      const updated = await createTask(workspaceId, payload);
      setGraphState(updated);
      showToast(`Task '${payload.title}' added to graph!`, "success");
    } catch (err) {
      console.error("Error creating task:", err);
      showToast("Failed to create task", "warning");
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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 bg-slate-900 text-white font-mono text-xs px-4 py-2 rounded-lg border-2 border-slate-900 shadow-neo animate-in fade-in slide-in-from-top-2">
          {toastMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          {toastMessage.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Top Header */}
      <Header
        activeWorkspaceId={workspaceId}
        workspaceName={workspaceName}
        workspaces={workspaces}
        isWsConnected={isWsConnected}
        onSelectWorkspace={(id) => setWorkspaceId(id)}
        onCreateWorkspace={() => setIsNewWorkspaceOpen(true)}
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

          {/* Top-right View Switcher: DAG Canvas vs Timeline */}
          <div className="absolute top-4 right-6 z-10 flex space-x-1 bg-white/95 backdrop-blur-sm border-2 border-slate-900 rounded-lg p-1 shadow-neo font-mono text-xs">
            <button
              onClick={() => setViewMode("canvas")}
              className={`px-3 py-1 rounded font-bold transition-all ${
                viewMode === "canvas"
                  ? "bg-slate-900 text-white shadow-neo-sm"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              🗺 DAG Canvas
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1 rounded font-bold transition-all ${
                viewMode === "timeline"
                  ? "bg-slate-900 text-white shadow-neo-sm"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
            >
              📊 Timeline Schedule
            </button>
          </div>

          {viewMode === "canvas" ? (
            <GraphCanvas
              nodes={graphState?.nodes || []}
              edges={graphState?.edges || []}
              onNodeClick={handleNodeClick}
              onOpenCreateTask={() => setIsCreateTaskOpen(true)}
              onOpenDecompose={() => setIsDecomposeOpen(true)}
              onResetDemo={handleReset}
            />
          ) : (
            <TimelineView
              nodes={graphState?.nodes.map((n) => n.data) || []}
              edges={graphState?.edges || []}
              onTaskClick={handleNodeClick}
            />
          )}
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

      {/* 4. Task Details / Manual Override Modal */}
      <TaskDetailsModal
        task={selectedTask}
        isOpen={isTaskDetailsOpen}
        onClose={() => {
          setIsTaskDetailsOpen(false);
          setSelectedTask(null);
        }}
        edges={graphState?.edges || []}
        allTasks={graphState?.nodes.map((n) => n.data) || []}
        onUpdateStatus={handleUpdateTaskStatus}
        isUpdating={isUpdatingTask}
      />

      {/* 5. Decompose Brief Modal */}
      <DecomposeModal
        isOpen={isDecomposeOpen}
        onClose={() => setIsDecomposeOpen(false)}
        onDecompose={handleDecompose}
        isSubmitting={isLoading}
      />

      {/* 6. New Workspace Modal */}
      <NewWorkspaceModal
        isOpen={isNewWorkspaceOpen}
        onClose={() => setIsNewWorkspaceOpen(false)}
        onCreate={handleCreateWorkspace}
      />

      {/* 7. Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        existingTasks={graphState?.nodes.map((n) => n.data) || []}
        onCreate={handleCreateTask}
        isCreating={isLoading}
      />
    </div>
  );
}
