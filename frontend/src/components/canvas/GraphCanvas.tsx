"use client";

import React, { useMemo, useCallback } from "react";
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
import { ReactFlowNodeItem, ReactFlowEdgeItem } from "@/lib/types";

interface GraphCanvasProps {
  nodes: ReactFlowNodeItem[];
  edges: ReactFlowEdgeItem[];
  onNodeClick?: (nodeId: string) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes: initialNodes,
  edges: initialEdges,
  onNodeClick,
}) => {
  const nodeTypes = useMemo(() => ({ taskNode: TaskNode as any }), []);

  const flowNodes: Node[] = useMemo(() => {
    return initialNodes.map((n) => ({
      id: n.id,
      type: "taskNode",
      position: n.position,
      data: n.data,
    }));
  }, [initialNodes]);

  const flowEdges: Edge[] = useMemo(() => {
    return initialEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated,
      style: e.style || { strokeWidth: 2, stroke: "#64748b" },
      data: e.data,
      type: "smoothstep",
    }));
  }, [initialEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Sync with prop updates
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
