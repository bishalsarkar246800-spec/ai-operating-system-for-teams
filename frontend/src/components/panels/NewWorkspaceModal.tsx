"use client";

import React, { useState } from "react";
import { X, Plus, Layers } from "lucide-react";

interface NewWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (id: string, name: string, seedSample: boolean) => Promise<void>;
  isCreating?: boolean;
}

export const NewWorkspaceModal: React.FC<NewWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  isCreating = false,
}) => {
  const [workspaceId, setWorkspaceId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [seedSample, setSeedSample] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = workspaceId.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
    if (!cleanId || !workspaceName.trim() || isCreating) return;
    await onCreate(cleanId, workspaceName.trim(), seedSample);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-slate-900 rounded-lg shadow-neo-lg w-full max-w-md p-5 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm uppercase text-slate-900">
              Create New Workspace
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded border border-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Workspace Name
            </label>
            <input
              type="text"
              required
              value={workspaceName}
              onChange={(e) => {
                setWorkspaceName(e.target.value);
                if (!workspaceId) {
                  setWorkspaceId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"));
                }
              }}
              placeholder="e.g. FinTech Mobile Core"
              className="w-full px-3 py-2 border-2 border-slate-900 rounded font-mono text-xs focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Workspace ID (Slug)
            </label>
            <input
              type="text"
              required
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "-"))}
              placeholder="e.g. fintech-mobile-core"
              className="w-full px-3 py-2 border-2 border-slate-900 rounded font-mono text-xs focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="seedSample"
              checked={seedSample}
              onChange={(e) => setSeedSample(e.target.checked)}
              className="rounded border-slate-900 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="seedSample" className="font-bold text-slate-700 select-none">
              Pre-populate with sample 8-node DAG
            </label>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t-2 border-slate-900">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-900 rounded font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !workspaceName.trim() || !workspaceId.trim()}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider border-2 border-slate-900 rounded shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? "Creating..." : "Create Workspace"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

