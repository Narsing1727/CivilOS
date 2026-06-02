import { Home, FolderOpen, Gavel, FileText, Users, Briefcase, OctagonMinus, Cpu, Zap } from "lucide-react";
import { AppTab } from "../types";

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  userProfile: {
    avatarInitials: string;
    name: string;
    role: string;
    email: string;
  };
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onSignOut?: () => void;
}

export function Sidebar({ activeTab, setActiveTab, userProfile, mobileOpen, setMobileOpen, onSignOut }: SidebarProps) {
  const menuItems = [
    { id: "home" as AppTab, label: "Home", icon: Home },
    { id: "projects" as AppTab, label: "Projects", icon: Briefcase },
    { id: "files" as AppTab, label: "Files", icon: FolderOpen },
    { id: "compliance" as AppTab, label: "Compliance", icon: Gavel },
    { id: "reports" as AppTab, label: "Reports", icon: FileText },
    { id: "memory" as AppTab, label: "Project Memory", icon: FileText },
    { id: "team" as AppTab, label: "Team", icon: Users },
      { id: "reasoning" as AppTab, label: "Reasoning Engine", icon: Cpu },
      { id: "ghostfix" as AppTab, label: "Ghost Fix", icon: Zap },
  ];

  return (
    <>
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 z-30 transition-opacity animate-fadeIn"
        />
      )}

      <aside 
        className={`fixed inset-y-0 left-0 w-72 border-r border-[#e5e2e1] flex flex-col h-full bg-[#fcfbfa] shrink-0 z-40 lg:z-20 font-sans transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static`}
      >
        <div className="p-6 py-7 flex items-center justify-between border-b border-[#e5e2e1]/50">
          <div className="flex items-center gap-3">
        <img 
  src="/logo.png" 
  alt="CivilOS Logo"
  className="w-25 rounded-none"
/>
            <div className="text-left select-none">
              <h1 className="font-serif text-[19px] tracking-tight font-bold text-zinc-900 leading-none">CivilOS</h1>
              <p className="text-[8px] uppercase tracking-[0.15em] text-[#8a8a8a] font-bold mt-1">Project Intelligence</p>
            </div>
          </div>
          
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 hover:bg-zinc-100 text-zinc-500 rounded-none transition-colors cursor-pointer"
            header-purpose="close-sidebar"
          >
            <svg className="w-4.5 h-4.5" stroke="currentColor" strokeWidth="2.2" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-5 py-5 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-semibold rounded-none transition-all duration-200 cursor-pointer border ${
                  isActive
                    ? "bg-white border-[#e5e2e1] text-[#1a1c1c] font-bold shadow-3xs scale-[0.99] border-l-[3px] border-l-[#154212]"
                    : "border-transparent text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#154212]" : "text-zinc-400"}`} />
                <span className="text-left font-sans">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 md:p-5 border-t border-[#e5e2e1]/50 mt-auto bg-[#fafafa]/80 shrink-0">
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-none bg-[#154212] flex items-center justify-center text-white text-[11px] font-bold shadow-3xs border border-[#154212]/30 select-none">
                {userProfile.avatarInitials}
              </div>
              <div className="overflow-hidden text-left select-none max-w-[140px]">
                <p className="text-xs font-bold text-[#1a1c1c] truncate">{userProfile.name}</p>
                <p className="text-[8px] text-[#8a8a8a] uppercase tracking-widest truncate">{userProfile.role}</p>
              </div>
            </div>
            {onSignOut && (
              <button 
                onClick={onSignOut}
                className="text-[9px] font-bold text-zinc-400 hover:text-red-700 transition-colors cursor-pointer border border-zinc-200 hover:border-red-200 px-2 py-0.5"
                title="Sign Out of CivilOS"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
