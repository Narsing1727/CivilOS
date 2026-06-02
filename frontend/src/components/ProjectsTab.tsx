import { useState } from "react";
import {
  Calendar,
  HardDrive,
  Users,
  CheckCircle,
  Activity,
  Play,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Server,
  FileText,
  FileCode,
} from "lucide-react";
import { getProjects, createProject, getProjectSnapshot } from "../api/project.api";
import { ActiveProject, AppTab } from "../types";
import { useEffect } from "react";

interface ProjectsTabProps {
  onSuggestTabChange: (tab: AppTab) => void;
  onSetProject: (id: string, name: string) => void;
}

export function ProjectsTab({
  onSuggestTabChange,
  onSetProject,
}: ProjectsTabProps) {
  const [projectsList, setProjectsList] = useState<ActiveProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
const [newProjectName, setNewProjectName] = useState("");


  const [platformStats, setPlatformStats] = useState({
  totalProjects: 0,
  totalFiles: 0,
  totalMembers: 0,
  failingCount: 0,
  passingCount: 0,
});


useEffect(() => {
  const fetchData = async () => {
    try {
      const res = await getProjects();
      
      const mapped = res.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        sector: p.description || "No description",
        discipline: p.type,
        status: p.status === "active" ? "Modeling" : "Approved",
        progress: 10,
        deadline: new Date(p.createdAt).toLocaleDateString("en-IN"),
        dataSize: "—",
        engineersCount: 1,
        image: "https://images.unsplash.com/photo-1545624446-43a77ab96788?auto=format&fit=crop&w=600&q=80",
      }));
      setProjectsList(mapped);

   const snapshots = await Promise.all(
  res.data.map((p: any) =>
    getProjectSnapshot(p.id)
      .catch(() => ({ stats: { file_count: 0, member_count: 0 } }))
  )
);

const totalFiles = snapshots.reduce((a: number, s: any) => a + (s?.stats?.file_count || 0), 0);
const totalMembers = snapshots.reduce((a: number, s: any) => a + (s?.stats?.member_count || 0), 0);

      setPlatformStats({
        totalProjects: res.data.length,
        totalFiles,
        totalMembers,
        failingCount: 0,
        passingCount: res.data.length,
      });
    } catch {
    }
    finally {
      setLoading(false);
    }
  };

  fetchData();
}, []);

const handleCreateProject = async () => {
  if (!newProjectName.trim()) return;
  try {
    const proj = await createProject({ name: newProjectName, type: "other" });
    const newProj: ActiveProject = {
      id: proj.id,
      name: proj.name,
      sector: proj.description || "No description",
      discipline: proj.type,
      status: "Modeling",
      progress: 5,
      deadline: new Date(proj.createdAt).toLocaleDateString("en-IN"),
      dataSize: "—",
      engineersCount: 1,
      image: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=600&q=80",
    };
    setProjectsList((prev) => [...prev, newProj]);
    setNewProjectName("");
    setShowCreateModal(false);
  } catch {
    alert("Failed to create project");
  }
};

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto bg-zinc-50 h-full custom-scrollbar font-sans">
      {/* Scrollable Center Pane with premium paddings */}
      <div className="flex-1 p-6 md:p-8 lg:p-10 transition-colors">
        {/* Tab Title */}
        <header className="mb-8 text-left select-none">
          <h2 className="font-serif text-[30px] leading-tight font-normal text-zinc-900 mb-1.5">
            Active Projects
          </h2>
          <p className="text-xs text-[#8a8a8a] leading-relaxed">
            Overview of active infrastructure assets under regulatory and
            mechanical review.
          </p>
        </header>

        {/* Layout Grid with comfortable gaps */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Main List items */}
          <div className="md:col-span-8 space-y-8">
            {/* Project List - larger gap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {projectsList.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => {
                    onSetProject(proj.id, proj.name);
                    onSuggestTabChange("home");
                  }}
                  className="bg-white border border-zinc-200 rounded-none overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
                  style={{ minHeight: "400px" }}
                >
                  <div className="h-48 bg-zinc-200 relative select-none">
                    <img
                      src={"logo.png"}
                      alt={proj.name}
                      className="w-full h-full object-cover filter grayscale contrast-125 group-hover:grayscale-0 transition-all duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 select-none">
                      <span className="bg-[#154212]/15 backdrop-blur-xs text-[#154212] border border-[#154212]/20 px-3 py-1 text-[9px] font-bold uppercase tracking-wider">
                        {proj.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between text-left">
                    <div>
                      <h3 className="font-serif text-[19px] font-normal text-zinc-900 group-hover:text-[#154212] transition-colors leading-snug">
                        {proj.name}
                      </h3>
                      <p className="text-xs text-[#42493e] mt-2 font-medium">
                        {proj.sector} • {proj.discipline}
                      </p>
                    </div>

                   

                    {/* Metadata stats */}
                    <div className="mt-6 pt-5 border-t border-zinc-100 grid grid-cols-3 gap-2 text-[10px] text-zinc-500 font-medium select-none text-left">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate">{proj.deadline}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate">{proj.dataSize}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate">
                          {proj.engineersCount} Eng
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* DASHED CREATION CARD */}
           <div
  onClick={() => setShowCreateModal(true)}
                className="bg-transparent border border-dashed border-zinc-300 rounded-none flex flex-col justify-center items-center p-10 hover:bg-zinc-100/50 cursor-pointer transition-all hover:border-[#154212] select-none text-center"
                style={{ minHeight: "400px" }}
              >
                <div className="w-14 h-14 rounded-none bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-[#154212] mb-5 shadow-3xs transition-colors border border-zinc-150">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-zinc-700">
                  Initialize New Project
                </h3>
                <p className="text-xs text-[#42493e] mt-3 px-6 leading-relaxed">
                  Start a fresh engineering intelligence context, ingest STAAD
                  files, and build code validations.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Mini column card */}
          <div className="md:col-span-4 select-none">
            <div className="bg-[#154212] text-white rounded-none p-8 flex flex-col justify-between h-auto shadow-md">
              <div className="text-left">
                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-85 mb-2.5">
                  Platform Engine Health
                </h4>
                <p className="font-serif text-[22px] font-light leading-snug">
                  All Systems Live
                </p>
              </div>

              <div className="mt-8 space-y-5">
             <div className="flex justify-between items-center border-b border-[#2d5a27] pb-3 text-xs">
  <span className="opacity-80">Total Projects</span>
  <span className="font-mono font-bold">{platformStats.totalProjects}</span>
</div>
<div className="flex justify-between items-center border-b border-[#2d5a27] pb-3 text-xs">
  <span className="opacity-80">Total Files Uploaded</span>
  <span className="font-mono font-bold">{String(platformStats.totalFiles).padStart(2, "0")}</span>
</div>

                {/* Ring dial gauge */}
                <div className="flex flex-col items-center pt-8">
                  <div className="w-36 h-36 border-4 border-emerald-400/40 rounded-full flex items-center justify-center relative">
                    <div className="absolute inset-0 border-t-4 border-l-4 border-emerald-400 rounded-full animate-spin duration-3000"></div>
                    <div className="text-center z-10">
                    <span className="text-2xl font-bold block font-mono">
  {platformStats.totalProjects > 0
    ? Math.round((platformStats.passingCount / platformStats.totalProjects) * 100)
    : 0}%
</span>
<span className="text-[8px] uppercase tracking-wider opacity-90 font-medium">
  Active
</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Active Instances, Cloud storage metadata */}
      <aside className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-[#e5e2e1] flex flex-col bg-white p-6 md:p-8 lg:p-10 space-y-8 min-w-[340px] transition-colors shrink-0">
        {/* Project Metadata container */}
        <div className="bg-zinc-50 border border-zinc-100 rounded-none p-6 text-left h-full flex flex-col justify-between shadow-3xs">
          <div>
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-6">
              Asset Meta Registry
            </h3>

            <div className="space-y-8">
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
                  Active Instances
                </label>
             <p className="font-mono font-bold text-base text-zinc-800">
  {platformStats.totalProjects} Project{platformStats.totalProjects !== 1 ? "s" : ""} Active
</p>
                <div className="text-[9px] text-[#42493e] mt-1">
                  Continuous code scanning enabled
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
                  Total Cloud Storage
                </label>
              <p className="font-mono font-bold text-base text-zinc-800">
  {platformStats.totalFiles} Files · {platformStats.totalMembers} Members
</p>
<div className="w-full bg-zinc-200 h-1.5 rounded-none mt-2.5 overflow-hidden">
  <div
    className="bg-[#154212] h-full rounded-none"
    style={{ width: `${Math.min(100, platformStats.totalFiles * 10)}%` }}
  />
</div>
                </div>
              

              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">
                  Audit Status Flags
                </label>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex -space-x-1.5">
                   <div className="w-6 h-6 rounded-none bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold border border-white">
  {String(platformStats.passingCount).padStart(2, "0")}
</div>
<div className="w-6 h-6 rounded-none bg-red-100 text-red-800 flex items-center justify-center text-[10px] font-bold border border-white">
  {String(platformStats.failingCount).padStart(2, "0")}
</div>
                  </div>
                  <span className="text-xs text-zinc-700">
                    Requires immediate action
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-200/50 select-none">
            <button
              onClick={() => onSuggestTabChange("compliance")}
              className="w-full py-2.5 border border-zinc-800 text-zinc-800 font-bold hover:bg-zinc-800 hover:text-white rounded-none text-xs transition-colors flex items-center justify-center gap-2"
            >
              <FileCode className="w-3.5 h-3.5" />
              Download Full Compliance Audit
            </button>
          </div>
        </div>
      </aside>
      {showCreateModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white border border-zinc-200 w-full max-w-md p-8 shadow-xl relative">
      <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-zinc-300"></div>
      <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-zinc-300"></div>
      <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-zinc-300"></div>
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-zinc-300"></div>
      <h3 className="font-serif text-xl text-zinc-900 mb-1">Initialize New Project</h3>
      <p className="text-xs text-zinc-500 mb-6">Create a fresh engineering intelligence context.</p>
      <div className="space-y-1.5 mb-6">
        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">
          Project Name
        </label>
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
          placeholder="e.g. NH-44 Bridge Design"
          autoFocus
          className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white"
        />
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => { setShowCreateModal(false); setNewProjectName(""); }}
          className="flex-1 py-2.5 border border-zinc-200 text-zinc-600 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-zinc-50"
        >
          Cancel
        </button>
        <button
          onClick={handleCreateProject}
          disabled={!newProjectName.trim()}
          className="flex-1 py-2.5 bg-[#154212] hover:bg-[#1a4b17] disabled:bg-zinc-200 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
        >
          Create Project
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
