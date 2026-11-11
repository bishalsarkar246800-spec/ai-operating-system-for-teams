"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronUp, ChevronDown } from "lucide-react";

export const Legend: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <div className="absolute bottom-6 left-6 z-10 bg-white border-2 border-slate-900 rounded-lg shadow-neo p-3 max-w-xs font-mono text-xs">
      <div
        className="flex items-center justify-between cursor-pointer select-none pb-1"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-1.5 font-bold text-slate-900 uppercase">
          <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>DAG Legend & Rules</span>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2 border-t border-slate-200 pt-2 text-[11px]">
          {/* Status Indicators */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>On Track</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>At Risk</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
              <span>Blocked</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Completed</span>
            </div>
          </div>

          {/* Risk Cascading explanation */}
          <div className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-600">
            <p className="font-bold text-slate-800 mb-0.5">⚡ Risk Propagation:</p>
            <p className="text-[10px] leading-tight">
              When an upstream task blocks, <span className="font-bold text-red-600">NetworkX.descendants()</span> traverses child paths and cascades downstream schedule delays.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

