"use client";

import React, { useState } from "react";
import { X, Plus, Sparkles, User, Clock, Link2 } from "lucide-react";
import { TaskNodeData } from "@/lib/types";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTasks: TaskNodeData[];
  onCreate: (payload: {
    title: string;
    description?: string;
    domain: string;
    owner: string;
    duration_days: number;
    depends_on_task_id?: string;
  }) => Promise<void>;
  isCreating?: boolean;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  existingTasks,
  onCreate,
  isCreating = false,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("Engineering");
  const [owner, setOwner] = useState("Alex Chen");
  const [duration, setDuration] = useState(3);
  const [dependsOn, setDependsOn] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isCreating) return;
    await onCreate({
      title: title.trim(),
      description: description.trim(),
      domain,
      owner,
      duration_days: duration,
      depends_on_task_id: dependsOn || undefined,
    });
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-slate-900 rounded-lg shadow-neo-lg w-full max-w-md p-5 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900 mb-4">
          <div className="flex items-center space-x-2">
            <Plus className="w-4 h-4 text-emerald-600 stroke-[3]" />
            <h3 className="font-bold text-sm uppercase text-slate-900">
              Add New Deliverable / Task
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded border border-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Task Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Payment Gateway"
              className="w-full px-3 py-2 border-2 border-slate-900 rounded font-mono text-xs focus:ring-2 focus:ring-blue-600 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the deliverable..."
              className="w-full px-3 py-2 border-2 border-slate-900 rounded font-mono text-xs focus:ring-2 focus:ring-blue-600 outline-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Domain
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-2 py-1.5 border-2 border-slate-900 rounded font-mono text-xs bg-white font-bold"
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                className="w-full px-2 py-1.5 border-2 border-slate-900 rounded font-mono text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Owner / Assignee
            </label>
            <input
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g. Sarah Jenkins (Lead)"
              className="w-full px-3 py-2 border-2 border-slate-900 rounded font-mono text-xs outline-none"
            />
          </div>

          {existingTasks.length > 0 && (
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Depends On (Prerequisite Task)</span>
              </label>
              <select
                value={dependsOn}
                onChange={(e) => setDependsOn(e.target.value)}
                className="w-full px-2 py-1.5 border-2 border-slate-900 rounded font-mono text-xs bg-white"
              >
                <option value="">None (Independent Root Node)</option>
                {existingTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id}: {t.title} ({t.domain})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              disabled={isCreating || !title.trim()}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider border-2 border-slate-900 rounded shadow-neo-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreating ? "Adding..." : "Add to Graph"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

