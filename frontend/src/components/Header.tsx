import {
  Bell,
  ChevronDown,
  Search,
  Mic,
  Menu,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  LogOut,
  User,
  FolderArchive,
  HelpCircle,
  Layers, 
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState, useRef, MouseEvent } from "react";
import { getProjects } from "../api/project.api";
import { getActivityFeed } from "../api/project.api";
interface HeaderProps {
  currentProject: string;
  currentProjectId?: string;
  onProjectChange?: (project: string) => void;
  onSetProject?: (id: string, name: string) => void;
  onSearch?: (query: string) => void;
  onNewAction?: () => void;
  actionText?: string;
  userProfile: {
    name: string;
    role: string;
    avatarInitials: string;
    email: string;
  };
  onSignOut?: () => void;
  setMobileOpen: (open: boolean) => void;
  mobileOpen: boolean;
  onNavigateTab?: (tab: "profile" | "archives" | "guide") => void;
  onOpenWorkshop?: () => void;
  onOpenComplianceCenter?:() => void;
  onOpenMaterialsSandbox?:() => void;
}

export function Header({
  currentProject,
  onProjectChange,
  onSetProject,
  onSearch,
  onNewAction,
  actionText,
  userProfile,
  onSignOut,
  setMobileOpen,
  mobileOpen,
  onNavigateTab,
  currentProjectId,
  onOpenWorkshop,
  onOpenComplianceCenter,
  onOpenMaterialsSandbox,

}: HeaderProps) {
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getProjects()
      .then((res) => {
        setProjects(res.data.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchDatabase = [
    {
      title: "IS 456:2000 Plain and Reinforced Concrete",
      category: "Concrete Design",
      ref: "Cl. 26-40",
      url: "https://archive.org/download/gov.in.is.456.2000/is.456.2000.pdf",
    },
    {
      title: "IS 800:2007 General Construction in Steel",
      category: "Steel Design",
      ref: "Cl. 7-12",
      url: "https://archive.org/download/gov.in.is.800.2007/is.800.2007.pdf",
    },
    {
      title: "IS 1893:2016 Earthquake Resistant Design",
      category: "Seismic Design",
      ref: "Cl. 6-7",
      url: "https://archive.org/download/gov.in.is.1893.2016/is.1893.2016.pdf",
    },
    {
      title: "IS 875 Part 1 Dead Loads",
      category: "Load Standards",
      ref: "Part 1",
      url: "https://archive.org/download/gov.in.is.875.1.1987/is.875.1.1987.pdf",
    },
    {
      title: "IS 875 Part 2 Live Loads",
      category: "Load Standards",
      ref: "Part 2",
      url: "https://archive.org/download/gov.in.is.875.2.1987/is.875.2.1987.pdf",
    },
    {
      title: "IS 875 Part 3 Wind Loads",
      category: "Load Standards",
      ref: "Part 3",
      url: "https://archive.org/download/gov.in.is.875.3.2015/is.875.3.2015.pdf",
    },
    {
      title: "IS 13920:2016 Ductile Detailing of RC Structures",
      category: "Seismic Detailing",
      ref: "Cl. 5-10",
      url: "https://archive.org/download/gov.in.is.13920.2016/is.13920.2016.pdf",
    },
    {
      title: "IS 2911 Pile Foundation Design",
      category: "Foundation Design",
      ref: "Part 1-4",
      url: "https://archive.org/download/gov.in.is.2911.1.1.2010/is.2911.1.1.2010.pdf",
    },
    {
      title: "IRC 6:2017 Standard Specifications for Road Bridges",
      category: "Bridge Design",
      ref: "Section 2",
      url: "https://law.resource.org/pub/in/bis/irc/irc.6.2000.pdf",
    },
    {
      title: "IS 3370 Water Retaining Structures",
      category: "Special Structures",
      ref: "Part 1-4",
      url: "https://archive.org/download/gov.in.is.3370.1.2009/is.3370.1.2009.pdf",
    },
  ];

  const filteredSearch =
    searchQuery.trim() === ""
      ? searchDatabase
      : searchDatabase.filter(
          (item) =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase()),
        );

  const [showNotifications, setShowNotifications] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!currentProjectId) return;
    getActivityFeed(currentProjectId)
      .then((res) => {
        const mapped = res.data.slice(0, 5).map((a: any) => ({
          id: a.id,
          title: a.action
            .replace(/_/g, " ")
            .replace(/\b\w/g, (c: string) => c.toUpperCase()),
          type: a.action.includes("compliance") ? "CRITICAL" : "SYSTEM",
          time: new Date(a.createdAt).toLocaleDateString("en-IN"),
          read: false,
        }));
        setNotifications(mapped);
      })
      .catch(() => {});
  }, [currentProjectId]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchFocused(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (url: string) => {
    window.open(url, "_blank");
    setSearchFocused(false);
    setSearchQuery("");
  };
  return (
    <header className="h-16 border-b border-[#e5e2e1] flex items-center justify-between px-4 md:px-8 shrink-0 bg-white z-30 w-full transition-colors relative font-sans">
      <div className="flex items-center gap-2 select-none">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 hover:bg-zinc-100 text-zinc-650 rounded-none transition-colors mr-1 cursor-pointer"
          aria-label="Toggle Side Drawer Menu"
        >
          <Menu className="w-5 h-5 text-zinc-800" />
        </button>

        <div className="hidden sm:flex items-center text-zinc-400 mr-1.5">
          <Mic className="w-4 h-4 text-zinc-500" />
        </div>

        <div className="relative group">
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-none hover:bg-zinc-50 border border-transparent hover:border-zinc-200 cursor-pointer transition-all text-[#1a1c1c]">
            <span className="font-serif text-[14px] md:text-[15px] font-normal tracking-tight">
              {currentProject}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 ml-1.5" />
          </button>

          {onProjectChange && (
            <div className="absolute left-0 mt-1 w-64 bg-white border border-[#e5e2e1] rounded-none shadow-lg opacity-0 pointer-events-none group-hover:opacity-105 group-hover:pointer-events-auto z-50 transition-all text-left">
              <div className="py-1">
                <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 px-4 py-2 bg-zinc-50 border-b border-zinc-100">
                  Switch Active Unit
                </p>
                {projects.map((proj: { id: string; name: string }) => (
                  <button
                    key={proj.id}
                    onClick={() => {
                      if (onSetProject) onSetProject(proj.id, proj.name);
                      if (onProjectChange) onProjectChange(proj.name);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-[#154212]/5 hover:text-[#154212] block transition-colors border-b last:border-0 border-zinc-100 ${
                      currentProject === proj.name
                        ? "font-bold text-[#154212] bg-[#154212]/5"
                        : "text-zinc-700 font-medium"
                    }`}
                  >
                    {proj.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="flex-1 max-w-sm md:max-w-md mx-6 relative hidden md:block"
        ref={searchContainerRef}
      >
        <div
          className={`flex items-center border ${searchFocused ? "border-[#154212] bg-white ring-1 ring-[#154212]/10" : "border-[#e5e2e1] bg-zinc-50"} transition-all duration-200`}
        >
          <Search className="w-4 h-4 text-zinc-400 ml-3 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            placeholder="Search & download IS codes, BIS standards, IRC references..."
            className="w-full bg-transparent border-0 text-xs px-2.5 py-1.5 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-0"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-2 text-[10px] text-zinc-400 hover:text-zinc-700 cursor-pointer font-bold select-none text-right font-mono"
            >
              CLEAR
            </button>
          )}
        </div>

        {searchFocused && (
          <div className="absolute left-0 right-0 mt-1 bg-white border border-[#e5e2e1] shadow-lg z-50 animate-fadeIn text-left max-h-80 overflow-y-auto">
            <div className="p-2.5 bg-zinc-50 border-b border-zinc-100 flex justify-between items-center select-none text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
              <span>IS Codes & BIS Standards Library</span>
              <span>Click to download PDF</span>
            </div>

            <div className="divide-y divide-zinc-100">
              {filteredSearch.length > 0 ? (
                filteredSearch.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionClick(item.url)}
                    className="p-3 hover:bg-zinc-50/80 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="max-w-[78%]">
                      <p className="text-xs font-semibold text-zinc-800 group-hover:text-[#154212] transition-colors truncate">
                        {item.title}
                      </p>
                      <span className="text-[9px] text-zinc-400 uppercase tracking-wider font-mono block mt-0.5">
                        {item.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#154212] bg-[#154212]/10 px-1.5 py-0.5 font-bold flex items-center gap-1">
                      ↓ {item.ref}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-5 text-center text-zinc-400 text-xs">
                  No matching civil engineering indexes found for{" "}
                  <span className="font-mono text-zinc-700">
                    "{searchQuery}"
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 md:gap-5 select-none shrink-0">
        {/* <button
          onClick={() => setSearchFocused(true)}
          className="md:hidden p-1.5 hover:bg-zinc-100 text-zinc-500 rounded-none transition-colors cursor-pointer"
          title="Search databases"
        >
          <Search className="w-4.5 h-4.5" />
        </button> */}
        {onOpenComplianceCenter && (
  <button onClick={onOpenComplianceCenter}
    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-900 hover:text-white text-zinc-700 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none">
    <ShieldCheck className="w-3.5 h-3.5" />
    <span>IS Audit</span>
  </button>
)}
{onOpenMaterialsSandbox && (
  <button onClick={onOpenMaterialsSandbox}
    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-900 hover:text-white text-zinc-700 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none">
    <Layers className="w-3.5 h-3.5" />
    <span>Materials</span>
  </button>
)}


        {onOpenWorkshop && (
  <button
    onClick={onOpenWorkshop}
    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-[#154212]/30 bg-[#154212]/5 hover:bg-[#154212] hover:text-white text-[#154212] text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none"
  >
    <Layers className="w-3.5 h-3.5" />
    <span>Workshop</span>
  </button>
)}

        <div className="relative" ref={notificationRef}>

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-1.5 rounded-none transition-all cursor-pointer relative ${
              showNotifications
                ? "bg-zinc-100 text-[#154212]"
                : "hover:bg-zinc-50 text-zinc-550 hover:text-zinc-950"
            }`}
            title="Real-Time System Alerts"
          >
            <Bell className="w-4.5 h-4.5" strokeWidth={2.2} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-650 rounded-none border border-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white border border-[#e5e2e1] shadow-xl z-50 text-left animate-fadeIn">
              <div className="p-4 bg-zinc-50 border-b border-zinc-150 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
                    CivilOS Notification Feed
                  </h4>
                  <p className="text-[9px] text-[#8a8a8a] mt-0.5">
                    {unreadCount} unread system flags
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[9px] font-bold text-[#154212] hover:opacity-80 border border-[#154212]/20 px-2 py-0.5 cursor-pointer uppercase tracking-wider"
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => {
                    let icon = (
                      <CheckCircle2 className="w-4 h-4 text-zinc-400" />
                    );
                    let badgeColor = "border-zinc-200 text-zinc-650 bg-zinc-50";
                    if (n.type === "CRITICAL") {
                      icon = (
                        <ShieldAlert className="w-4 h-4 text-zinc-605 text-zinc-600 animate-pulse" />
                      );
                      badgeColor =
                        "border-zinc-300 text-zinc-800 bg-zinc-100 font-bold";
                    } else if (n.type === "REGULATORY") {
                      icon = (
                        <AlertTriangle className="w-4 h-4 text-zinc-500" />
                      );
                      badgeColor = "border-zinc-200 text-zinc-650 bg-zinc-50";
                    }

                    return (
                      <div
                        key={n.id}
                        className={`p-4 flex gap-3 transition-colors hover:bg-zinc-50/60 relative ${
                          !n.read ? "bg-[#154212]/2" : ""
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[8px] font-bold border px-1.5 py-0.2 uppercase tracking-wide ${badgeColor}`}
                            >
                              {n.type}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-mono">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-zinc-800 mt-1 leading-normal pr-5">
                            {n.title}
                          </p>
                        </div>

                        <button
                          onClick={(e) => clearNotification(n.id, e)}
                          className="absolute right-3 top-4 text-zinc-300 hover:text-zinc-700 text-[11px] font-bold cursor-pointer"
                          title="Dismiss notification"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-zinc-400 text-xs italic">
                    All notifications completed. Safe structural trace
                    confirmed.
                  </div>
                )}
              </div>

              <div className="p-3 bg-zinc-50 border-t border-zinc-100 text-center select-none">
                <span className="text-[10px] text-zinc-500 font-medium">
                  Continuous telemetry scanner fully active
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-1.5 focus:outline-none cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-none bg-zinc-100 hover:bg-[#154212] hover:text-white flex items-center justify-center text-zinc-700 text-xs font-bold font-sans border border-zinc-200 shadow-3xs transition-all select-none">
              {userProfile.avatarInitials}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors hidden sm:block" />
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white border border-[#e5e2e1] shadow-xl z-50 text-left animate-fadeIn">
              <div className="p-4 border-b border-zinc-150 bg-zinc-50 select-none">
                <p className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 font-mono">
                  Current Session User
                </p>
                <h4 className="text-xs font-bold text-zinc-900 mt-1">
                  {userProfile.name}
                </h4>
                <p className="text-[9px] text-zinc-500 truncate mt-0.5 select-all">
                  {userProfile.email}
                </p>
                <span className="inline-block border border-zinc-200 text-zinc-650 text-zinc-600 font-semibold text-[8px] uppercase tracking-wider px-2 py-0.5 mt-2 rounded-none bg-zinc-100">
                  {userProfile.role}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("profile");
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-50 text-zinc-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  Operator Profile Settings
                </button>
                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("archives");
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-50 text-zinc-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <FolderArchive className="w-3.5 h-3.5 text-zinc-400" />
                  Your Active Archives
                </button>
                <button
                  onClick={() => {
                    if (onNavigateTab) onNavigateTab("guide");
                    setShowProfileDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-zinc-50 text-zinc-700 flex items-center gap-2.5 transition-colors cursor-pointer border-b border-zinc-100"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                  Standard User Guide
                </button>

                {onSignOut && (
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-red-50 text-red-700 font-bold flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    Sign Out (Auth Screen)
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
