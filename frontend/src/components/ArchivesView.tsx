import {
  FolderArchive,
  Search,
  RotateCcw,
  Download,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import { useState, useEffect } from "react";
import { getFiles } from "../api/files.api";

interface ArchivesViewProps {
  projectId?: string;
}

export function ArchivesView({ projectId }: ArchivesViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArchiveType, setSelectedArchiveType] = useState("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [archiveDatabase, setArchiveDatabase] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId) return;
    getFiles(projectId)
      .then((res) => {
        const mapped = res.data.map((f: any) => ({
          id: f.id,
          title: f.original_name,
          category:
            f.category === "other"
              ? "Documents"
              : f.category.charAt(0).toUpperCase() + f.category.slice(1),
          date: new Date(f.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          }),
          hash: `sha-${f.id.slice(0, 6)}`,
          size: f.size_mb + " MB",
          status:
            f.parse_status === "done"
              ? "VERIFIED"
              : f.parse_status === "pending"
                ? "STORED"
                : "SUPERSEDED",
        }));
        setArchiveDatabase(mapped);
      })
      .catch(() => {});
  }, [projectId]);

  const filteredArchives = archiveDatabase.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.hash.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedArchiveType === "all" || item.category === selectedArchiveType;
    return matchesSearch && matchesCategory;
  });

  // const triggerRestore = (title: string) => {
  //   setToastMessage(
  //     `Restoring archived artifact ${title} into active document index...`,
  //   );
  //   setTimeout(() => {
  //     setToastMessage(null);
  //   }, 2800);
  // };

const triggerDownload = async (id: string, title: string) => {
  try {
    const token = localStorage.getItem("civilos_token");
    const res = await fetch(`http://localhost:5000/api/v1/projects/${projectId}/files/${id}/download`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = title;
    link.click();
    setToastMessage(`Downloading ${title}...`);
  } catch {
    setToastMessage(`Failed to download ${title}`);
  }
  setTimeout(() => setToastMessage(null), 3000);
};

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 h-full font-sans select-none">
      <div className="max-w-6xl mx-auto p-6 md:p-8 lg:p-10">
        <header className="mb-8 border-b border-[#e5e2e1] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#154212] bg-[#154212]/5 px-2.5 py-0.5 border border-[#154212]/10">
                Regulatory Archives
              </span>
             <span className="font-mono text-[9px] text-zinc-400">Total files: {archiveDatabase.length}</span>
            </div>
            <h1 className="font-serif text-[28px] md:text-[32px] font-normal tracking-tight text-zinc-900 leading-tight">
              Historic Active Archives
            </h1>
            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
              Browse, trace, and restore superseded drawings, old geotech logs,
              and signed compliance reports.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div className="md:col-span-8 flex items-center border border-[#e5e2e1] bg-white px-3.5">
            <Search className="w-4 h-4 text-zinc-400 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by archived file credentials, sha-commit hashes, structural names..."
              className="w-full bg-transparent border-0 text-xs px-3 py-3 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-0"
            />
          </div>

          <div className="md:col-span-4 flex">
            <select
              value={selectedArchiveType}
              onChange={(e) => setSelectedArchiveType(e.target.value)}
              className="w-full bg-white border border-[#e5e2e1] px-4 py-3 text-xs text-[#1a1c1c] font-semibold rounded-none focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
            >
              <option value="all">All Category Modules</option>
              <option value="Model">Models Only</option>
              <option value="Drawing">Drawings Only</option>
              <option value="Specification">Specifications Only</option>
              <option value="Calculation">Calculations Only</option>
              <option value="Report">Reports Only</option>
              <option value="Documents">Documents Only</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-[#e5e2e1] rounded-none overflow-hidden relative">
          <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-zinc-300"></div>
          <div className="absolute top-2 right-2 w-1 h-1 border-t border-r border-zinc-300"></div>
          <div className="absolute bottom-2 left-2 w-1 h-1 border-b border-l border-zinc-300"></div>
          <div className="absolute bottom-2 right-2 w-1 h-1 border-b border-r border-zinc-300"></div>

          <div className="p-4 bg-zinc-50 border-b border-zinc-150 flex items-center justify-between select-none">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 font-mono">
              Archived Document Data Set
            </span>
            <span className="text-[10px] font-mono text-zinc-500 font-semibold">
              {filteredArchives.length} files detected
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-[#e5e2e1] text-zinc-400 select-none uppercase font-bold text-[9px] tracking-wider font-mono">
                  <th className="py-3 px-5">Document Name</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Commit Hash</th>
                  <th className="py-3 px-5">Archive Date</th>
                  <th className="py-3 px-5">Size</th>
                  <th className="py-3 px-5">Safety Status</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredArchives.length > 0 ? (
                  filteredArchives.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2.5">
                          <FolderArchive className="w-4 h-4 text-zinc-400 shrink-0" />
                          <span className="text-zinc-800 font-bold truncate max-w-[280px]">
                            {item.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-zinc-500 font-semibold">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[10px] text-[#154212] font-semibold">
                        {item.hash}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-400 font-mono text-[10px]">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-5 text-zinc-500 font-mono text-[10px]">
                        {item.size}
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-block border px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                            item.status === "VERIFIED"
                              ? "bg-zinc-100 border-zinc-300 text-zinc-900"
                              : item.status === "STORED"
                                ? "bg-zinc-50 border-zinc-200 text-zinc-600"
                                : "bg-zinc-50 border-zinc-200 text-zinc-500"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex gap-2.5 justify-end">
                          {/* <button
                            onClick={() => triggerRestore(item.title)}
                            className="text-[#154212] hover:bg-[#154212]/5 font-bold uppercase tracking-wider text-[9px] border border-[#154212]/20 px-2 py-1 select-none transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Restore
                          </button> */}
                          <button
                            onClick={() => triggerDownload(item.id , item.title)}
                            className="text-zinc-500 hover:bg-zinc-100 font-bold uppercase tracking-wider text-[9px] border border-zinc-200 px-2 py-1 select-none transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            Fetch
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-zinc-400 text-xs italic"
                    >
                      No matching historical archive recordings located in
                      repository.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-800 text-white px-5 py-3 shadow-md flex items-center gap-2.5 z-50 text-xs font-semibold animate-fadeIn rounded-none">
          <span className="w-2 h-2 bg-[#154212] rounded-none inline-block"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
