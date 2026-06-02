import React, { useState, useRef, useEffect } from "react";
import { FolderPlus, FileSpreadsheet, FileCode, Trash2, Database, Layers, Cpu, Eye } from "lucide-react";
import { ProjectDoc } from "../types";
import { uploadFiles, getFiles, deleteFile as deleteFileAPI } from "../api/files.api";

interface FilesTabProps {
  projectId?: string;
}

export function FilesTab({ projectId }: FilesTabProps) {
  const [documents, setDocuments] = useState<ProjectDoc[]>([]);
  const [uploadCategory, setUploadCategory] = useState<string>("other");
  const [filterType, setFilterType] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!projectId) return;
    getFiles(projectId).then((res) => {
      const mapped = res.data.map((f: any) => ({
        id: f.id,
        filename: f.original_name,
        type: f.file_type === "staad" ? "Model"
          : f.category === "drawing" ? "Drawing"
          : f.file_type === "pdf" ? "Spec"
          : f.file_type === "excel" ? "Calc Sheet"
          : "Spec",
        size: f.size_mb ? f.size_mb + " MB" : "—",
        status: f.parse_status.toUpperCase(),
        statusColor: f.parse_status === "done" ? "green" : f.parse_status === "failed" ? "red" : "blue",
        lastEdited: new Date(f.createdAt).toLocaleDateString("en-IN"),
      }));
      setDocuments(mapped);
    }).catch(() => {});
  }, [projectId]);

  const totalDocs = documents.length;
  const doneDocs = documents.filter(d => d.status === "DONE").length;
  const failedDocs = documents.filter(d => d.statusColor === "red").length;
  const accuracy = totalDocs > 0 ? Math.round((doneDocs / totalDocs) * 100) : 0;

  const filteredDocs = filterType === "all"
    ? documents
    : documents.filter(doc => doc.type === filterType);

  const handleUploadSimulate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !projectId) return;
    setIsUploading(true);
    setUploadProgress(30);
    try {
      const uploaded = await uploadFiles(projectId, files, uploadCategory);
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        const newDocs = uploaded.map((f: any) => ({
          id: f.id,
          filename: f.original_name,
          type: f.file_type === "staad" ? "Model"
            : uploadCategory === "drawing" ? "Drawing"
            : f.file_type === "pdf" ? "Spec"
            : f.file_type === "excel" ? "Calc Sheet"
            : "Spec",
          size: f.size_mb ? f.size_mb + " MB" : "—",
          status: "PENDING",
          statusColor: "blue" as const,
          lastEdited: "Just now",
        }));
        setDocuments((prev) => [...newDocs, ...prev]);
      }, 600);
    } catch {
      setIsUploading(false);
      alert("Upload failed");
    }
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId) return;
    try {
      await deleteFileAPI(projectId, id);
      setDocuments((prev) => prev.filter(doc => doc.id !== id));
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto bg-zinc-50 h-full custom-scrollbar font-sans">
      <div className="flex-1 p-6 md:p-8 lg:p-10 transition-colors">
        <header className="mb-8 text-left select-none">
          <h2 className="font-serif text-[30px] leading-tight font-normal text-zinc-900 mb-1.5">Project Documents</h2>
          <p className="text-xs text-[#8a8a8a] leading-relaxed">Ingest models, CAD specs, concrete guidelines and formulas into CivilOS parsing pipelines.</p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10 select-none">
          <div className="bg-white border border-[#e5e2e1] p-6 rounded-none text-left hover:shadow-sm transition-all shadow-3xs flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Models</span>
              <FileCode className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="font-serif text-2xl font-normal text-zinc-800">{documents.filter(d => d.type === "Model").length} Ingested</p>
              <p className="text-[10px] text-zinc-400 mt-2 font-medium">STAAD models, steel structures</p>
            </div>
          </div>

          <div className="bg-white border border-[#e5e2e1] p-6 rounded-none text-left hover:shadow-sm transition-all shadow-3xs flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Drawings</span>
              <Layers className="w-5 h-5 text-sky-500" />
            </div>
            <div>
              <p className="font-serif text-2xl font-normal text-zinc-800">{documents.filter(d => d.type === "Drawing").length} Ingested</p>
              <p className="text-[10px] text-zinc-400 mt-2 font-medium">General arrangements, layouts</p>
            </div>
          </div>

          <div className="bg-white border border-[#e5e2e1] p-6 rounded-none text-left hover:shadow-sm transition-all shadow-3xs flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Specs</span>
              <Database className="w-5 h-5 text-[#154212]" />
            </div>
            <div>
              <p className="font-serif text-2xl font-normal text-zinc-800">{documents.filter(d => d.type === "Spec").length} Ingested</p>
              <p className="text-[10px] text-zinc-400 mt-2 font-medium">IS standards, concrete guidelines</p>
            </div>
          </div>

          <div className="bg-white border border-[#e5e2e1] p-6 rounded-none text-left hover:shadow-sm transition-all shadow-3xs flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Calc Sheets</span>
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="font-serif text-2xl font-normal text-zinc-800">{documents.filter(d => d.type === "Calc Sheet").length} Ingested</p>
              <p className="text-[10px] text-zinc-400 mt-2 font-medium">Wind, stress formulas, geotech logs</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-dashed border-zinc-300 rounded-none p-10 mb-10 select-none text-center hover:border-zinc-400 transition-all">
          <input type="file" ref={fileInputRef} onChange={handleUploadSimulate} className="hidden" accept=".std,.dwg,.pdf,.xlsx,.docx,.stdx" />
          {isUploading ? (
            <div className="py-8 max-w-md mx-auto">
              <Cpu className="w-10 h-10 text-[#154212] animate-spin mx-auto mb-5" />
              <h4 className="text-sm font-bold text-zinc-800 leading-relaxed">Parsing and Extracting Engineering Entities...</h4>
              <div className="w-full bg-zinc-100 h-2 rounded-none mt-5 overflow-hidden relative">
                <div className="bg-[#154212] h-full rounded-none transition-all duration-150" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-[10px] text-zinc-400 mt-3 font-mono">Completed: {uploadProgress}% (Neural parser active)</p>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center">
              <div className="flex items-center gap-3 mb-6" onClick={(e) => e.stopPropagation()}>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">File Type:</span>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="bg-zinc-50 border border-zinc-200 text-xs text-zinc-800 px-3 py-1.5 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] cursor-pointer"
                >
                  <option value="other">Report / Document (Text PDF)</option>
                  <option value="drawing">Structural Drawing (Vision AI)</option>
                  <option value="specification">Specification</option>
                  <option value="calculation">Calculation Sheet</option>
                  <option value="model">STAAD Model</option>
                </select>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer group flex flex-col items-center">
                <div className="w-14 h-14 rounded-none bg-zinc-50 hover:bg-[#154212]/10 flex items-center justify-center text-zinc-400 group-hover:text-[#154212] transition-colors mb-5 shadow-3xs border border-zinc-100">
                  <FolderPlus className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-zinc-800 mb-2 font-sans group-hover:text-zinc-900 transition-colors">Click to Upload reference drawing, model or spec sheet</h4>
                <p className="text-xs text-[#42493e] leading-relaxed max-w-lg mx-auto">Supports STAAD (.std), AutoCAD (.dwg), Specifications (PDF/DOCX), and Calc formulas (XLSX). Zero-configuration mechanical parsing.</p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border border-[#e5e2e1] rounded-none overflow-hidden shadow-xs">
          <div className="px-6 py-5 border-b border-zinc-100 flex flex-wrap gap-4 items-center justify-between select-none">
            <span className="text-sm font-bold text-zinc-800">Ingested Assets Ledger</span>
            <div className="flex gap-2">
              {["all", "Model", "Drawing", "Spec", "Calc Sheet"].map((tag) => (
                <button key={tag} onClick={() => setFilterType(tag)}
                  className={`px-4 py-2 text-xs font-semibold rounded-none cursor-pointer transition-all ${filterType === tag ? "bg-[#e2dfde] text-[#1a1c1c]" : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-800"}`}>
                  {tag === "all" ? "All Files" : tag === "Calc Sheet" ? "Calcs" : tag}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none text-xs">
              <thead>
                <tr className="bg-zinc-50/70 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider text-[9px]">
                  <th className="p-5 pl-6">Filename</th>
                  <th className="p-5">Type</th>
                  <th className="p-5">Filesize</th>
                  <th className="p-5">Ingestion Flag</th>
                  <th className="p-5">Last Sync</th>
                  <th className="p-5 text-right pr-6">Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-16 text-center text-zinc-400 font-sans">No matching documents found in state ledger.</td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => {
                    let badgeClass = "bg-transparent border border-zinc-205 text-zinc-500 font-medium";
                    if (doc.statusColor === "green") badgeClass = "bg-zinc-100 border border-zinc-300 text-zinc-850 font-bold";
                    if (doc.statusColor === "blue") badgeClass = "bg-zinc-50 border border-zinc-200 text-zinc-600";
                    if (doc.statusColor === "red") badgeClass = "bg-zinc-200 border border-zinc-400 text-zinc-900 font-bold";
                    return (
                      <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-5 pl-6 font-medium text-zinc-900 font-sans">{doc.filename}</td>
                        <td className="p-5 font-sans font-semibold text-zinc-400 text-[11px]">{doc.type}</td>
                        <td className="p-5 font-mono font-medium text-zinc-600">{doc.size}</td>
                        <td className="p-5">
                          <span className={`px-2.5 py-1 rounded-none text-[9px] font-bold uppercase tracking-widest ${badgeClass}`}>{doc.status}</span>
                        </td>
                        <td className="p-5 text-zinc-500">{doc.lastEdited}</td>
                        <td className="p-5 text-right pr-6 space-x-2">
                          <button className="p-1.5 hover:bg-zinc-100 rounded-none text-zinc-400 hover:text-zinc-950 transition-colors cursor-pointer" title="View file">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={(e) => handleDeleteDoc(doc.id, e)} className="p-1.5 hover:bg-red-50 rounded-none text-zinc-400 hover:text-red-600 transition-colors cursor-pointer" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-[#e5e2e1] flex flex-col bg-white p-6 md:p-8 lg:p-10 space-y-8 min-w-[340px] transition-colors shrink-0">
        <div className="bg-[#fcfcfa] border border-[#e5e2e1]/40 p-5 rounded-none text-left select-none shadow-3xs mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-[#154212] shrink-0" />
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Parsing Engine Snapshot</span>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-3xl font-serif font-bold text-zinc-800">{accuracy}%</span>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase">Extract Accuracy</p>
              <p className="text-[10px] text-zinc-400">{doneDocs} of {totalDocs} files parsed successfully</p>
            </div>
          </div>
          <div className="space-y-3 pt-3 border-t border-zinc-100 text-[10px] text-zinc-500">
            <div className="flex justify-between">
              <span>Successfully Parsed</span>
              <span className="font-mono font-bold">{doneDocs}</span>
            </div>
            <div className="flex justify-between text-[#ba1a1a]">
              <span>Failed / Needs Attention</span>
              <span className="font-mono font-bold">{failedDocs}</span>
            </div>
          </div>
        </div>

        <div className="text-left font-sans select-none flex-1">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-4">Parse Failure Log</h3>
          <div className="space-y-4">
            {documents.filter(d => d.statusColor === "red").length === 0 ? (
              <div className="p-6 text-center border border-dashed border-zinc-200">
                <p className="text-xs text-zinc-400">No parsing failures detected.</p>
                <p className="text-[10px] text-zinc-400 mt-1">All uploaded files parsed successfully.</p>
              </div>
            ) : (
              documents.filter(d => d.statusColor === "red").map(doc => (
                <div key={doc.id} className="p-4 border border-zinc-100 bg-[#fbfdfa] rounded-none">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border bg-red-50 border-red-200 text-red-700">
                      PARSE FAILED
                    </span>
                    <span className="text-[9px] text-zinc-400 font-mono">{doc.lastEdited}</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-800 truncate">{doc.filename}</p>
                  <p className="text-[10px] text-zinc-400 leading-relaxed mt-1">
                    File parsing failed. Try re-uploading or check file format compatibility.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 text-[10px] font-bold py-1.5 px-3 bg-[#e2dfde] text-zinc-700 hover:bg-[#154212] hover:text-white rounded-none transition-colors w-full cursor-pointer"
                  >
                    Re-upload File
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}