"use client";

import React, { useState } from "react";
import { Send, Sparkles, AlertCircle, Clock, User, Zap } from "lucide-react";
import { WorkspaceEventItem } from "@/lib/types";

interface ActivityFeedProps {
  events: WorkspaceEventItem[];
  onSendEvent: (text: string, author?: string) => Promise<void>;
  isIngesting?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  events,
  onSendEvent,
  isIngesting = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [author, setAuthor] = useState("Sarah (Eng Lead)");

  const presetUpdates = [
    { label: "Auth Migration +3d Delay", text: "Auth0 & SSO migration delayed by 3 days due to external identity provider credential refresh." },
    { label: "DB Migration Critical Blocker", text: "Database schema migration blocked due to lock contention on legacy tenant table." },
    { label: "Design System V2 Done", text: "Design System V2 & Canvas Spec completed and signed off." },
    { label: "Mobile Beta +4d Slip", text: "Mobile App Beta delayed by 4 days awaiting App Store review approval." },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isIngesting) return;
    await onSendEvent(inputText.trim(), author);
    setInputText("");
  };

  const handlePresetClick = async (presetText: string) => {
    if (isIngesting) return;
    await onSendEvent(presetText, author);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Feed Header */}
      <div className="p-4 border-b-2 border-slate-900 bg-slate-50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h3 className="font-mono font-bold text-sm uppercase text-slate-900">
              Team Chatter & Event Stream
            </h3>
          </div>
          <span className="font-mono text-xs bg-slate-200 px-2 py-0.5 rounded border border-slate-400">
            {events.length} events
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Simulate team chatter or Slack updates. The system uses semantic embedding to locate the task node and cascades downstream delays.
        </p>

        {/* Preset Quick Chips */}
        <div className="mt-3">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1.5">
            Quick Simulation Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presetUpdates.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isIngesting}
                onClick={() => handlePresetClick(preset.text)}
                className="text-[11px] font-mono font-bold px-2 py-1 bg-white hover:bg-amber-50 text-slate-800 border border-slate-900 rounded shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 text-left"
              >
                ⚡ {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs font-mono">
            No events ingested yet. Try clicking a preset above or posting an update.
          </div>
        ) : (
          events.map((evt) => {
            const isCritical = evt.severity === "critical";
            const isWarning = evt.severity === "warning";
            const dateStr = new Date(evt.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={evt.id}
                className={`p-3 rounded-lg border-2 border-slate-900 text-xs font-mono shadow-neo-sm ${
                  isCritical
                    ? "bg-red-50 border-red-900"
                    : isWarning
                    ? "bg-amber-50 border-amber-900"
                    : "bg-slate-50 border-slate-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5 font-bold text-slate-800">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{evt.author}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{dateStr}</span>
                </div>

                <p className="text-slate-800 font-sans text-xs leading-relaxed mb-2">
                  "{evt.raw_text}"
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200 text-[10px]">
                  {evt.matched_task_id && (
                    <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded font-bold">
                      → {evt.matched_task_id}
                    </span>
                  )}
                  {evt.delay_impact_days > 0 && (
                    <span className="bg-red-600 text-white px-1.5 py-0.5 rounded font-bold">
                      +{evt.delay_impact_days}d Delay
                    </span>
                  )}
                  <span
                    className={`font-bold uppercase px-1.5 py-0.5 rounded ${
                      isCritical
                        ? "bg-red-200 text-red-900"
                        : isWarning
                        ? "bg-amber-200 text-amber-900"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {evt.severity}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Event Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 border-t-2 border-slate-900 bg-slate-50">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-[10px] font-mono font-bold text-slate-500">Posting as:</span>
          <select
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="text-xs font-mono font-bold bg-white border border-slate-900 rounded px-2 py-0.5"
          >
            <option>Sarah (Eng Lead)</option>
            <option>Alex Chen (Tech Lead)</option>
            <option>Devon Vance (Backend)</option>
            <option>Mia Sato (Design)</option>
            <option>Marcus Aurel (Product)</option>
          </select>
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type team update (e.g. 'Auth migration delayed by 3 days')..."
            disabled={isIngesting}
            className="flex-1 text-xs px-3 py-2 bg-white border-2 border-slate-900 rounded font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            type="submit"
            disabled={isIngesting || !inputText.trim()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs uppercase tracking-wider border-2 border-slate-900 rounded shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 flex items-center space-x-1"
          >
            <span>{isIngesting ? "..." : "Send"}</span>
            <Send className="w-3 h-3" />
          </button>
        </div>
      </form>
    </div>
  );
};
