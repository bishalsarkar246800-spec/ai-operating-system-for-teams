"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  BackgroundVariant,
  Node,
  Edge,
} from "@xyflow/react";
import { TaskNode } from "./TaskNode";
import { Legend } from "./Legend";
import { ReactFlowNodeItem, ReactFlowEdgeItem, TaskDomain } from "@/lib/types";
import { Search, Filter, Zap, Plus, FileText, RefreshCw, Sparkles } from "lucide-react";

interface GraphCanvasProps {
  nodes: ReactFlowNodeItem[];
  edges: ReactFlowEdgeItem[];
  onNodeClick?: (nodeId: string) => void;
  onOpenCreateTask?: () => void;
  onOpenDecompose?: () => void;
  onResetDemo?: () => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
  onOpenCreateTask,
  onOpenDecompose,
  onResetDemo,
}) => {
  const nodeTypes = useMemo(() => ({ taskNode: TaskNode as any }), []);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");
  const [criticalPathOnly, setCriticalPathOnly] = useState<boolean>(false);

  // Filter nodes based on user controls
  const filteredNodes = useMemo(() => {
    return initialNodes.filter((n) => {
      const data = n.data;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = data.id.toLowerCase().includes(q);
        const matchesTitle = data.title.toLowerCase().includes(q);
        const matchesOwner = data.owner.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesOwner) return false;
      }

      if (selectedDomain !== "ALL" && data.domain !== selectedDomain) {
        return false;
      }

      if (criticalPathOnly && !data.is_critical_path) {
        return false;
      }

      return true;
    });
  }, [initialNodes, searchQuery, selectedDomain, criticalPathOnly]);

  const visibleNodeIds = useMemo(() => {
    return new Set(filteredNodes.map((n) => n.id));
  }, [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return initialEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [initialEdges, visibleNodeIds]);

  const flowNodes: Node[] = useMemo(() => {
    return filteredNodes.map((n) => ({
      id: n.id,
      type: "taskNode",
      position: n.position,
      data: n.data,
    }));
  }, [filteredNodes]);

  const flowEdges: Edge[] = useMemo(() => {
    return filteredEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated,
      style: e.style || { strokeWidth: 2, stroke: "#64748b" },
      data: e.data,
      type: "smoothstep",
    }));
  }, [filteredEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync with prop & filter updates
  React.useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  React.useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (onNodeClick) {
        onNodeClick(node.id);
      }
    },
    [onNodeClick]
  );

  return (
    <div className="relative w-full h-full bg-[#f8fafc]">
      {/* Top Floating Filter & Search Bar */}
      <div className="absolute top-4 left-6 z-10 flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-sm border-2 border-slate-900 rounded-lg p-2 shadow-neo font-mono text-xs">
        {/* Add Task Button */}
        {onOpenCreateTask && (
          <button
            onClick={onOpenCreateTask}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-400 hover:bg-emerald-500 text-slate-900 font-bold text-[11px] rounded border-2 border-slate-900 shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Add Task</span>
          </button>
        )}

        {/* Search */}
        <div className="flex items-center space-x-1.5 px-2 py-1 bg-slate-50 border border-slate-900 rounded">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-28 md:w-36 bg-transparent text-xs outline-none font-mono"
          />
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center space-x-1">
          {["ALL", "Engineering", "Design", "Product", "Marketing"].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDomain(d)}
              className={`px-2 py-1 rounded text-[11px] font-bold border transition-all ${
                selectedDomain === d
                  ? "bg-slate-900 text-white border-slate-900 shadow-neo-sm"
                  : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
              }`}
            >
              {d === "ALL" ? "All Domains" : d}
            </button>
          ))}
        </div>

        {/* Critical Path Toggle */}
        <button
          onClick={() => setCriticalPathOnly(!criticalPathOnly)}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-bold border-2 border-slate-900 transition-all ${
            criticalPathOnly
              ? "bg-blue-600 text-white shadow-neo-sm"
              : "bg-white text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span>Critical Path</span>
        </button>
      </div>

      {/* Empty State Overlay */}
      {initialNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="bg-white border-2 border-slate-900 rounded-xl shadow-neo-lg p-6 max-w-md text-center font-mono pointer-events-auto">
            <div className="w-12 h-12 bg-blue-100 border-2 border-slate-900 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-neo-sm">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-base text-slate-900 uppercase">
              Workspace is Empty
            </h3>
            <p className="text-xs text-slate-500 font-sans mt-1.5 mb-5 leading-relaxed">
              Choose how you want to build this workspace: use AI to decompose an unstructured PRD brief, add deliverables manually, or pre-load a sample project.
            </p>

            <div className="flex flex-col space-y-2.5">
              {onOpenDecompose && (
                <button
                  onClick={onOpenDecompose}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs rounded border-2 border-slate-900 shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Decompose Brief with AI</span>
                </button>
              )}

              {onOpenCreateTask && (
                <button
                  onClick={onOpenCreateTask}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase text-xs rounded border-2 border-slate-900 shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Deliverable Manually</span>
                </button>
              )}

              {onResetDemo && (
                <button
                  onClick={onResetDemo}
                  className="w-full py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold uppercase text-xs rounded border-2 border-slate-900 shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center justify-center space-x-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Load 8-Node Sample Project</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background
          color="#cbd5e1"
          gap={24}
          size={1.5}
          variant={BackgroundVariant.Dots}
        />
        <Controls
          className="!bg-white !border-2 !border-slate-900 !rounded-lg !shadow-neo font-bold"
          showInteractive={false}
        />
        <MiniMap
          nodeStrokeColor="#0f172a"
          nodeColor={(n: any) => {
            if (n.data?.status === "blocked") return "#ef4444";
            if (n.data?.status === "at_risk") return "#f59e0b";
            if (n.data?.status === "completed") return "#3b82f6";
            return "#10b981";
          }}
          className="!bg-white !border-2 !border-slate-900 !rounded-lg !shadow-neo"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Floating Canvas Legend */}
      <Legend />
    </div>
  );
};
