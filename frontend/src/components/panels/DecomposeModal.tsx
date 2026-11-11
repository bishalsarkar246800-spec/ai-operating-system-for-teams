"use client";

import React, { useState } from "react";
import { X, Sparkles, FileText, ArrowRight } from "lucide-react";

interface DecomposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDecompose: (briefText: string, title?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const DecomposeModal: React.FC<DecomposeModalProps> = ({
  isOpen,
  onClose,
  onDecompose,
  isSubmitting = false,
}) => {
  const [briefText, setBriefText] = useState("");
  const [initiativeName, setInitiativeName] = useState("Enterprise AI Platform");

  const sampleBrief = `# Launch Plan: Enterprise AI Platform V2

## Product Deliverables
- Finalize Product Requirement Document (PRD) and acceptance criteria
- Define telemetry metrics and instrumentation plan

## Engineering Deliverables
- Core PostgreSQL relational schema & pgvector index configuration
- FastAPI backend microservices & real-time WebSocket connection pool
- Interactive React Flow DAG canvas with real-time risk propagation
- iOS and Android mobile push notifications gateway

## Design Deliverables
- Neo-Brutalist design tokens and theme specification in Figma
- User flow prototypes for task dependency creation and inspection

## Marketing Deliverables
- Product Hunt launch campaign assets and press release distribution
- Documentation portal & interactive developer demo walkthrough`;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!briefText.trim() || isSubmitting) return;
    await onDecompose(briefText.trim(), initiativeName);
    onClose();
  };

  const loadSample = () => {
    setBriefText(sampleBrief);
    setInitiativeName("Enterprise AI Platform V2");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-slate-900 rounded-lg shadow-neo-lg w-full max-w-2xl max-h-[90vh] flex flex-col font-mono text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-slate-900 bg-slate-50">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm uppercase text-slate-900">
              Decompose Unstructured Brief into DAG
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded border border-slate-900 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Initiative / Workspace Title
            </label>
            <input
              type="text"
              value={initiativeName}
              onChange={(e) => setInitiativeName(e.target.value)}
              className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="e.g. Mobile Banking App Launch"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-slate-700 uppercase">
                Raw Markdown Brief / PRD Text
              </label>
              <button
                type="button"
                onClick={loadSample}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold underline"
              >
                Insert Sample PRD
              </button>
            </div>
            <textarea
              rows={12}
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              placeholder="Paste raw markdown brief, meeting notes, or deliverables list..."
              className="w-full p-3 bg-white border-2 border-slate-900 rounded font-mono text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t-2 border-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border-2 border-slate-900 rounded shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !briefText.trim()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider border-2 border-slate-900 rounded shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 flex items-center space-x-1.5"
            >
              <span>{isSubmitting ? "Decomposing..." : "Generate Graph"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
