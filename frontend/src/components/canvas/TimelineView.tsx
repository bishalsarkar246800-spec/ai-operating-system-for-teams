"use client";

import React, { useMemo } from "react";
import { TaskNodeData, ReactFlowEdgeItem, TaskDomain, TaskStatus } from "@/lib/types";
import { Clock, AlertTriangle, Zap, CheckCircle2 } from "lucide-react";

interface TimelineViewProps {
  nodes: TaskNodeData[];
  edges: ReactFlowEdgeItem[];
  onTaskClick?: (taskId: string) => void;
}

interface ScheduledTask extends TaskNodeData {
  startDay: number;
  endDay: number;
  originalEndDay: number;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  nodes,
  edges,
  onTaskClick,
}) => {
  // Compute start day and end day for each task using topological dependencies
  const scheduledTasks = useMemo(() => {
    const taskMap = new Map<string, TaskNodeData>(nodes.map((n) => [n.id, n]));
    const parentMap = new Map<string, string[]>();

    edges.forEach((e) => {
      if (!parentMap.has(e.target)) {
        parentMap.set(e.target, []);
      }
      parentMap.get(e.target)!.push(e.source);
    });

    const schedule = new Map<string, { startDay: number; endDay: number; origEndDay: number }>();

    // Helper to recursively compute start day
    const getStartDay = (taskId: string, visited = new Set<string>()): number => {
      if (visited.has(taskId)) return 0;
      visited.add(taskId);

      const parents = parentMap.get(taskId) || [];
      if (parents.length === 0) return 0;

      let maxParentEnd = 0;
      parents.forEach((pId) => {
        const pTask = taskMap.get(pId);
        if (pTask) {
          const pStart = getStartDay(pId, new Set(visited));
          const pDuration = pTask.duration_days;
          const pDelay = pTask.cumulative_delay_days || 0;
          const pEnd = pStart + pDuration + pDelay;
          if (pEnd > maxParentEnd) {
            maxParentEnd = pEnd;
          }
        }
      });

      return maxParentEnd;
    };

    const result: ScheduledTask[] = nodes.map((task) => {
      const startDay = getStartDay(task.id);
      const originalEndDay = startDay + task.duration_days;
      const endDay = originalEndDay + (task.cumulative_delay_days || 0);

      return {
        ...task,
        startDay,
        endDay,
        originalEndDay,
      };
    });

    // Sort by startDay ascending
    return result.sort((a, b) => a.startDay - b.startDay || a.duration_days - b.duration_days);
  }, [nodes, edges]);

  const maxTotalDays = useMemo(() => {
    const maxEnd = Math.max(...scheduledTasks.map((t) => t.endDay), 18);
    return Math.max(maxEnd + 2, 20);
  }, [scheduledTasks]);

  const dayColumns = useMemo(() => {
    return Array.from({ length: maxTotalDays }, (_, i) => i + 1);
  }, [maxTotalDays]);

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "blocked":
        return "bg-red-500 border-red-900 text-white";
      case "at_risk":
        return "bg-amber-400 border-amber-900 text-slate-900";
      case "completed":
        return "bg-blue-600 border-blue-900 text-white";
      default:
        return "bg-emerald-400 border-emerald-900 text-slate-900";
    }
  };

  return (
    <div className="w-full h-full bg-[#f8fafc] flex flex-col p-6 overflow-hidden">
      {/* Timeline Controls & Header */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg border-2 border-slate-900 shadow-neo font-mono text-xs">
        <div className="flex items-center space-x-3">
          <Clock className="w-4 h-4 text-purple-600" />
          <span className="font-bold text-slate-900 uppercase">
            Schedule & Critical Path Timeline View
          </span>
          <span className="text-slate-500">
            (Total Horizon: <strong>{maxTotalDays} Days</strong>)
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[11px]">
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span>On Track</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>At Risk</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Blocked</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span>Completed</span>
          </span>
        </div>
      </div>

      {/* Main Gantt Grid */}
      <div className="flex-1 bg-white border-2 border-slate-900 rounded-lg shadow-neo overflow-auto">
        <div className="min-w-[900px] p-4">
          {/* Day Headers */}
          <div className="grid grid-cols-[240px_1fr] border-b-2 border-slate-900 pb-2 mb-3 font-mono text-[11px] font-bold text-slate-600">
            <div>DELIVERABLE</div>
            <div className="grid" style={{ gridTemplateColumns: `repeat(${maxTotalDays}, minmax(0, 1fr))` }}>
              {dayColumns.map((day) => (
                <div key={day} className="text-center border-l border-slate-200">
                  d{day}
                </div>
              ))}
            </div>
          </div>

          {/* Task Rows */}
          <div className="space-y-2.5 font-mono text-xs">
            {scheduledTasks.map((task) => {
              const startPct = (task.startDay / maxTotalDays) * 100;
              const baseWidthPct = (task.duration_days / maxTotalDays) * 100;
              const delayDays = task.cumulative_delay_days || 0;
              const delayWidthPct = (delayDays / maxTotalDays) * 100;

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick && onTaskClick(task.id)}
                  className="grid grid-cols-[240px_1fr] items-center hover:bg-slate-50 p-1 rounded transition-colors cursor-pointer group"
                >
                  {/* Left Label */}
                  <div className="flex items-center space-x-2 pr-3 truncate">
                    <span className="font-bold text-slate-900 truncate">
                      {task.id}
                    </span>
                    <span className="text-[11px] text-slate-600 truncate">
                      {task.title}
                    </span>
                    {task.is_critical_path && (
                      <span title="On Critical Path" className="shrink-0">
                        <Zap className="w-3 h-3 text-blue-600 fill-blue-600" />
                      </span>
                    )}
                  </div>

                  {/* Right Bar Area */}
                  <div className="relative h-8 bg-slate-50 rounded border border-slate-200 flex items-center">
                    {/* Scheduled Base Bar */}
                    <div
                      style={{
                        left: `${startPct}%`,
                        width: `${baseWidthPct}%`,
                      }}
                      className={`absolute top-1 bottom-1 rounded border-2 border-slate-900 px-2 flex items-center justify-between overflow-hidden shadow-neo-sm ${getStatusColor(
                        task.status
                      )}`}
                    >
                      <span className="truncate font-bold text-[10px]">
                        {task.duration_days}d
                      </span>
                    </div>

                    {/* Delay Extension Bar */}
                    {delayDays > 0 && (
                      <div
                        style={{
                          left: `${startPct + baseWidthPct}%`,
                          width: `${delayWidthPct}%`,
                        }}
                        className="absolute top-1 bottom-1 rounded-r border-2 border-l-0 border-slate-900 bg-red-400/80 repeating-stripes px-1 flex items-center justify-center font-bold text-[9px] text-red-950 animate-pulse"
                        title={`+${delayDays} days cumulative delay`}
                      >
                        +{delayDays}d
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
