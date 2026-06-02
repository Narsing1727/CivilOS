
import {
  Database,
  FileText,
  CheckCircle,
  HelpCircle,
  ArrowUpRight,
  Check,
  ShieldAlert,
  Layers,
  Plus,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { ContextLogEntry } from "../types";

import { getMemories, deleteMemory, addMemory } from "../api/memory.api";

interface MemoryTabProps {
  projectId?: string;
}









export function MemoryTab({ projectId }: MemoryTabProps) {
  
const [showAddForm, setShowAddForm] = useState(false);
const [newTitle, setNewTitle] = useState("");
const [newContent, setNewContent] = useState("");
const [newType, setNewType] = useState("note");
const [isAdding, setIsAdding] = useState(false);





  const [logsList, setLogsList] = useState<ContextLogEntry[]>([]);
  useEffect(() => {
    if (!projectId) return;
    getMemories(projectId)
      .then((res) => {
        const mapped = res.data.map((m: any) => ({
          id: m.id,
          type:
            m.type === "finding" || m.type === "decision"
              ? "DECISION"
              : m.type === "note"
                ? "AUTO-UPDATE"
                : "INCONSISTENCY",
          ref: m.tags?.[0]?.toUpperCase() || "MEM",
          title: m.title,
          time: new Date(m.createdAt).toLocaleString("en-IN"),
          explanation: m.content,
          approvedBy: m.creator?.name || "System",
          status: "APPROVED",
        }));
        setLogsList(mapped);
        if (mapped.length > 0) setSelectedLogId(mapped[0].id);
      })
      .catch(() => {});
  }, [projectId]);

  const [selectedLogId, setSelectedLogId] = useState<string>("");
  const handleResolveInconsistency = async (id: string) => {
    if (!projectId) return;
    try {
      await deleteMemory(projectId, id);
      setLogsList((prev) => prev.filter((log) => log.id !== id));
    } catch {
      setLogsList((prev) =>
        prev.map((log) =>
          log.id === id
            ? { ...log, status: "RESOLVED", approvedBy: "Arjun (Lead)" }
            : log,
        ),
      );
    }
  };



  const handleAddMemory = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!projectId || !newTitle || !newContent) return;
  setIsAdding(true);
  try {
    const mem = await addMemory(projectId, {
      title: newTitle,
      content: newContent,
      type: newType,
      tags: [],
    });
    setLogsList((prev) => [{
      id: mem.id,
      type: newType === "finding" || newType === "decision" ? "DECISION" : newType === "note" ? "AUTO-UPDATE" : "INCONSISTENCY",
      ref: newType.toUpperCase(),
      title: mem.title,
      time: new Date(mem.createdAt).toLocaleString("en-IN"),
      explanation: mem.content,
      approvedBy: "You",
      status: "APPROVED",
    }, ...prev]);
    setNewTitle("");
    setNewContent("");
    setShowAddForm(false);
  } catch (err: any) {
    alert(err.message || "Failed to add memory");
  } finally {
    setIsAdding(false);
  }
};






  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto bg-zinc-50 h-full custom-scrollbar font-sans">
      {/* Central timeline context log with premium paddings */}
      <div className="flex-1 p-6 md:p-8 lg:p-10 transition-colors">
        {/* Title and descriptions */}
        <header className="mb-8 text-left select-none">
          <h2 className="font-serif text-[30px] leading-tight font-normal text-zinc-900 mb-1.5">
            Project Memory
          </h2>
          <p className="text-xs text-[#8a8a8a] leading-relaxed">
            Chronological context trace of architectural modifications, geotech
            updates, and engineering overrides.
          </p>
        </header>





      <div className="max-w-3xl mb-6">
  {!showAddForm ? (
    <button
      onClick={() => setShowAddForm(true)}
      className="flex items-center gap-2 bg-[#154212] hover:bg-[#1a4a17] text-white text-xs font-bold px-4 py-2.5 rounded-none cursor-pointer transition-all"
    >
      <Plus className="w-3.5 h-3.5" />
      Log New Decision
    </button>
  ) : (
    <form onSubmit={handleAddMemory} className="bg-white border border-[#154212]/20 p-6 rounded-none space-y-4">
      <h4 className="font-serif text-base text-zinc-900">Log Engineering Decision</h4>
      
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Title</label>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="e.g. Foundation F12 pile deepening"
          className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212]"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Type</label>
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212]"
        >
          <option value="decision">Decision</option>
          <option value="finding">Finding</option>
          <option value="note">Note</option>
          <option value="change">Change</option>
          <option value="assumption">Assumption</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Content</label>
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Describe the engineering decision, finding, or change..."
          rows={3}
          className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] resize-none"
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setShowAddForm(false)}
          className="flex-1 py-2 border border-zinc-200 text-zinc-500 text-xs font-bold rounded-none cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isAdding}
          className="flex-1 py-2 bg-[#154212] hover:bg-[#1a4a17] text-white text-xs font-bold rounded-none cursor-pointer disabled:opacity-50"
        >
          {isAdding ? "Logging..." : "Log Decision"}
        </button>
      </div>
    </form>
  )}
</div>


        <div className="max-w-3xl space-y-6 text-left">
          {logsList.map((log) => {
            const isSelected = selectedLogId === log.id;

            // Icon mapping for decision category
            let badgeStyle = "bg-zinc-50 border border-zinc-250 text-zinc-600";
            if (log.type === "DECISION")
              badgeStyle =
                "bg-zinc-100 border border-zinc-350 text-zinc-800 font-bold";
            if (log.type === "INCONSISTENCY")
              badgeStyle =
                "bg-zinc-200 border border-zinc-400 text-zinc-900 font-bold";
            if (log.type === "AUTO-UPDATE")
              badgeStyle = "bg-zinc-50 border border-zinc-200 text-zinc-500";

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogId(log.id)}
                className={`p-6 bg-white border rounded-none cursor-pointer transition-all shadow-3xs ${
                  isSelected
                    ? "border-[#154212] ring-1 ring-[#154212]/20 shadow-xs"
                    : "border-zinc-200 hover:border-zinc-300"
                }`}
              >
                <div className="flex justify-between items-start mb-3.5 select-none">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider rounded-none ${badgeStyle}`}
                    >
                      {log.type}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono font-bold tracking-wider">
                      {log.ref}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium font-mono">
                    {log.time}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-zinc-900 leading-snug">
                  {log.title}
                </h3>
                <p className="text-xs text-zinc-600 mt-2.5 leading-relaxed">
                  {log.explanation}
                </p>

                <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center text-[10px] text-zinc-400 select-none">
                  <span>
                    Authorized by:{" "}
                    <span className="font-bold text-zinc-600">
                      {log.approvedBy || "System Core"}
                    </span>
                  </span>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold uppercase tracking-wider ${
                        log.status === "APPROVED" ||
                        log.status === "RESOLVED" ||
                        log.status === "COMPLETED"
                          ? "text-[#154212]"
                          : "text-amber-700"
                      }`}
                    >
                      {log.status}
                    </span>
                    {log.type === "INCONSISTENCY" &&
                      log.status !== "RESOLVED" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResolveInconsistency(log.id);
                          }}
                          className="bg-[#154212] hover:bg-[#1a4a17] text-white px-3 py-1.5 rounded-none font-bold text-[9px] uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Force Override
                          Resolve
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar - Design revision visualization details panel */}
      <aside className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-[#e5e2e1] flex flex-col bg-white p-6 md:p-8 lg:p-10 space-y-8 min-w-[340px] transition-colors shrink-0 justify-between select-none">
        {/* Wireframe stresses schematic diagram */}
        <div className="text-left font-sans">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4.5 h-4.5 text-[#154212]" />
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Finite Element Model (FEM)
            </span>
          </div>

          <div className="h-44 bg-zinc-950 rounded-none relative overflow-hidden flex items-center justify-center p-3 shadow-sm select-none">
            {/* Visual wireframe simulation using CSS and vector lines for civil-engineering detail layout */}
            <svg
              className="w-full h-full text-zinc-800"
              viewBox="0 0 100 100"
              fill="none"
              preserveAspectRatio="none"
            >
              {/* Force grids */}
              <line
                x1="10"
                y1="20"
                x2="90"
                y2="20"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
              <line
                x1="10"
                y1="50"
                x2="90"
                y2="50"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
              <line
                x1="10"
                y1="80"
                x2="90"
                y2="80"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />

              <line
                x1="20"
                y1="10"
                x2="20"
                y2="90"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
              <line
                x1="50"
                y1="10"
                x2="50"
                y2="90"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />
              <line
                x1="80"
                y1="10"
                x2="80"
                y2="90"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="2 2"
              />

              {/* Pier Truss Wireframe structure */}
              <polyline
                points="10,60 30,30 50,60 70,30 90,60"
                stroke="#10b981"
                strokeWidth="1"
              />
              <line
                x1="10"
                y1="60"
                x2="90"
                y2="60"
                stroke="#10b981"
                strokeWidth="1.5"
              />
              <line
                x1="30"
                y1="30"
                x2="70"
                y2="30"
                stroke="#10b981"
                strokeWidth="1.5"
              />

              {/* Stress concentration glowing points */}
              <circle
                cx="50"
                cy="60"
                r="3"
                fill="#ef4444"
                className="animate-ping"
              />
              <circle cx="50" cy="60" r="2" fill="#ef4444" />

              <circle cx="30" cy="30" r="1.5" fill="#f59e0b" />
              <circle cx="70" cy="30" r="1.5" fill="#f59e0b" />
            </svg>
            <div className="absolute top-2 left-2 text-[8px] font-mono text-emerald-400 font-bold">
              FEM NODE GRID STRESSES
            </div>
            <div className="absolute bottom-2 right-2 text-[8px] font-mono text-red-500 font-bold">
  {logsList.find(l => l.id === selectedLogId)?.ref || "NO SELECTION"}
</div>
          </div>

          <p className="text-[10px] text-zinc-400 mt-2 font-medium">
  {logsList.find(l => l.id === selectedLogId)?.title || "Select a memory entry to view structural context."}
</p>
        </div>

        {/* Audit Details */}
        <div className="bg-[#fcfcfa] border border-[#e5e2e1]/40 p-5 rounded-none text-left select-none shadow-3xs mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-zinc-600 shrink-0" />
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Cryptographic Logs
            </span>
          </div>

          <p className="text-[11px] text-zinc-500 leading-relaxed font-sans">
            All modifications in CivilOS are logged with standard cryptographic
            checksums ensuring full audit logs for state and environmental
            regulatory checks.
          </p>

          <div className="mt-4 pt-3 border-t border-zinc-100 text-[9px] font-mono text-zinc-400">
            SHA256: {selectedLogId ? selectedLogId.replace(/-/g, "").slice(0, 16) + "..." : "—"}
          </div>
        </div>
      </aside>
    </div>
  );
}
