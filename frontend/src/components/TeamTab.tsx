import { useState, FormEvent } from "react";
import { Users, Mail, Phone, Calendar, ArrowUpRight, MessageSquare, Briefcase, PlusCircle } from "lucide-react";
import { TeamMember } from "../types";
import { useEffect } from "react";
import { getTeam, inviteMember } from "../api/team.api";


interface TeamTabProps {
  projectId?: string;
}

export function TeamTab({ projectId }: TeamTabProps) {
const [teamList, setTeamList] = useState<TeamMember[]>([]);
useEffect(() => {
  if (!projectId) return;
  getTeam(projectId).then((data) => {
    const mapped = data.map((m: any) => ({
      id: m.id,
      name: m.user?.name || "Unknown",
      role: m.role,
      email: m.user?.email || "",
      activeProjects: 1,
      assignedViolations: 0,
      avatarInitials: (m.user?.name || "UN").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
    }));
    setTeamList(mapped);
  }).catch(() => {});
}, [projectId]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");

  const handleMessageSimulate = (name: string) => {
    setToastMessage(`Opening direct secure channel with ${name}...`);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };






const submitAddMember = async (e: FormEvent) => {
  e.preventDefault();
  if (!newName || !newRole || !projectId) return;
  try {
    await inviteMember(projectId, { email: newName, role: "viewer" });
    setShowAddModal(false);
    setNewName("");
    setNewRole("");
    setToastMessage(`Partner invited successfully!`);
    getTeam(projectId).then((data) => {
      const mapped = data.map((m: any) => ({
        id: m.id,
        name: m.user?.name || "Unknown",
        role: m.role,
        email: m.user?.email || "",
        activeProjects: 1,
        assignedViolations: 0,
        avatarInitials: (m.user?.name || "UN").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
      }));
      setTeamList(mapped);
    });
  } catch (err: any) {
    setToastMessage(err.message || "Failed to invite member");
  }
  setTimeout(() => setToastMessage(null), 3000);
};






  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto bg-zinc-50 h-full custom-scrollbar font-sans">

      <div className="flex-1 p-6 md:p-8 lg:p-10 transition-colors">
        
        {/* Title & Info */}
        <header className="mb-8 flex flex-wrap gap-4 items-center justify-between select-none">
          <div className="text-left font-sans">
            <h2 className="font-serif text-[30px] leading-tight font-normal text-zinc-900 mb-1.5">Collaborators</h2>
            <p className="text-xs text-[#8a8a8a] leading-relaxed">Manage infrastructure engineers, specialists and BIS regulatory reviewers synchronized with CivilOS.</p>
          </div>
 
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#154212] hover:bg-[#1a4b17] text-white text-xs font-bold py-3 px-5 rounded-none shadow-2xs active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Invite Partner
          </button>
        </header>
 
        {/* Directory Card list layout with wider gaps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamList.map((tm) => (
            <div 
              key={tm.id}
              className="bg-white border border-[#e5e2e1] rounded-none p-6 hover:shadow-md transition-all text-left flex flex-col justify-between"
              style={{ minHeight: "240px" }}
            >
              <div>
                {/* Upper line */}
                <div className="flex justify-between items-start mb-5 select-none">
                  <div className="w-12 h-12 rounded-none bg-zinc-800 font-serif flex items-center justify-center text-white font-bold text-sm shadow-3xs border border-zinc-650">
                    {tm.avatarInitials}
                  </div>
                  
                  <button 
                    onClick={() => handleMessageSimulate(tm.name)}
                    className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-none text-zinc-400 hover:text-[#154212] transition-colors cursor-pointer"
                    title="Send secure message"
                  >
                    <MessageSquare className="w-4.5 h-4.5" />
                  </button>
                </div>
 
                <h3 className="text-base font-bold text-zinc-900 leading-snug">{tm.name}</h3>
                <p className="text-xs text-[#154212] font-semibold mt-1">{tm.role}</p>
                <p className="text-[10px] text-zinc-400 font-medium mt-1.5 select-all">{tm.email}</p>
              </div>
 
              {/* Stats totals */}
              <div className="mt-5 pt-4 border-t border-zinc-150 grid grid-cols-2 gap-2 text-[10px] text-zinc-500 select-none">
                <div>
                  <span className="block font-bold mt-0.5 font-mono text-zinc-755">{tm.activeProjects} Projects</span>
                </div>
                <div>
                  <span className={`block font-bold mt-0.5 font-mono ${tm.assignedViolations > 0 ? "text-[#ba1a1a]" : "text-[#154212]"}`}>
                    {tm.assignedViolations} Compliance Tasks
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
 
      </div>
 
      {/* Right Sidebar - Staff highlights panel (no internal scroll, shared outer scroll) */}
      <aside className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-[#e5e2e1] flex flex-col bg-white p-6 md:p-8 lg:p-10 space-y-8 min-w-[340px] transition-colors justify-between select-none shrink-0 font-sans mt-auto">
        
        {/* Statistics highlights container */}
        <div className="text-left font-sans">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4.5 h-4.5 text-[#154212]" />
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Collaborators Total</span>
          </div>

          <div className="bg-zinc-50 border border-zinc-105 rounded-none p-4 space-y-3 font-mono text-[11px] text-zinc-600 shadow-3xs">
            <div className="flex justify-between border-b border-zinc-50 pb-1.5">
              <span>Total Active Personnel:</span>
              <span className="font-bold">{teamList.length} Headcount</span>
            </div>
           <div className="flex justify-between border-b border-zinc-50 pb-1.5">
  <span>Engineers:</span>
  <span className="font-bold">{teamList.filter(m => m.role !== "viewer").length} Active</span>
</div>
<div className="flex justify-between font-bold text-[#154212]">
  <span>Viewers / Reviewers:</span>
  <span>{teamList.filter(m => m.role === "viewer").length} Members</span>
</div>
          </div>
        </div>

        {/* Informational Guidelines Card */}
        <div className="bg-[#154212] text-white p-5 rounded-none text-left select-none shadow-3xs mt-auto">
          <h4 className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-2">Team Security Sync</h4>
          <p className="text-xs leading-relaxed opacity-95">
            Personnel are validated against civil design registers automatically. Modifications require official e-sign hashes linked to state infrastructures.
          </p>
        </div>

      </aside>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-800 text-white px-5 py-3 shadow-md flex items-center gap-2.5 z-50 text-xs font-semibold animate-fadeIn rounded-none">
          <span className="w-2 h-2 bg-[#154212] rounded-none inline-block"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Add Teammate absolute backdrop Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn select-none p-4">
          <div className="bg-white border border-[#e5e2e1] p-8 max-w-sm w-full shadow-lg rounded-none text-left">
            <h3 className="font-serif text-[20px] font-normal text-zinc-900 mb-1.5 border-b border-zinc-100 pb-2 uppercase tracking-wide">Invite Partner</h3>
            <p className="text-[11px] text-[#8a8a8a] mb-5 leading-relaxed">Add a certified structural engineer, analyst or compliance authority teammate to this active project.</p>
            
            <form onSubmit={submitAddMember} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider font-mono">Teammate Email</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Vikram Das" 
                  className="w-full bg-zinc-50 border border-[#e5e2e1] py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider font-mono">Professional Role</label>
                <input 
                  type="text" 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g. Concrete Specialist" 
                  className="w-full bg-zinc-55 border border-[#e5e2e1] py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-zinc-400 bg-white"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 select-none">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-3 border border-zinc-200 text-zinc-500 hover:bg-zinc-50 font-bold text-xs rounded-none cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2 px-3 bg-[#154212] hover:bg-[#1f561b] text-white font-bold text-xs rounded-none cursor-pointer transition-all shadow-3xs"
                >
                  Invite Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
