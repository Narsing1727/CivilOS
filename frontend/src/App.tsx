import { useState, useEffect, FormEvent } from "react";

import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { HomeTab } from "./components/HomeTab";
import { ProjectsTab } from "./components/ProjectsTab";
import { FilesTab } from "./components/FilesTab";
import { ComplianceTab } from "./components/ComplianceTab";
import { ReportsTab } from "./components/ReportsTab";
import { MemoryTab } from "./components/MemoryTab";
import { TeamTab } from "./components/TeamTab";
import { ProfileView } from "./components/ProfileView";
import { ArchivesView } from "./components/ArchivesView";
import { GuideView } from "./components/GuideView";

import { AppTab } from "./types";
import { Lock } from "lucide-react";

import { getProjects } from "./api/project.api";
import { login, register, logout, getMe } from "./api/auth.api";
import {
  setCurrentProject,
  getCurrentProject,
  clearTokens,
} from "./api/client";

import { ReasoningTab } from "./components/ReasoningTab";
import { GhostFixTab } from "./components/GhostFixTab";
import { LandingPage } from "./components/LandingPage";
import { LoadCombinationWorkshop } from "./components/LoadCombinationWorkshop";
import { MaterialSandbox } from "./components/MaterialSandbox";

import { ISCodeComplianceCenter } from "./components/ISCodeComplianceCenter";
import { LoadingScreen } from "./components/LoadingScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [currentProjectId, setCurrentProjectId] = useState<string>(
    getCurrentProject() || "",
  );
  const [currentProject, setCurrentProject_] = useState<string>("");
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showLoader, setShowLoader] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [authError, setAuthError] = useState<string | null>(null);









  const [showLanding, setShowLanding] = useState(true);




  const [userProfile, setUserProfile] = useState({
    name: "Arjun R.",
    role: "Project Engineer",
    avatarInitials: "AR",
    email: "arjun.r@civilos.net",
  });

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("Project Inspector");
  const [formPass, setFormPass] = useState("");

  useEffect(() => {
    document.documentElement.classList.remove("dark");
    const token = localStorage.getItem("civilos_token");
    if (token) {
      getMe()
        .then((user) => {
          setUserProfile({
            name: user.name,
            role: user.designation || "Engineer",
            avatarInitials: user.name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2),
            email: user.email,
          });
          setIsLoggedIn(true);
          return getProjects();
        })
        .then((res) => {
          if (res?.data?.length > 0) {
            const first = res.data[0];
            setCurrentProjectId(first.id);
            setCurrentProject_(first.name);
            setCurrentProject(first.id);
          }
        })
        .catch(() => {
          clearTokens();
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      let data;
      if (authTab === "login") {
        data = await login({ email: formEmail, password: formPass });
      } else {
        data = await register({
          name: formName,
          email: formEmail,
          password: formPass,
          designation: formRole,
        });
      }
      setUserProfile({
        name: data.user.name,
        role: data.user.designation || formRole,
        avatarInitials: data.user.name
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        email: data.user.email,
      });
      setIsLoggedIn(true);
      showToast(`Welcome to CivilOS, ${data.user.name}!`);
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    }
  };

const handleSignOut = async () => {
  try {
    await logout();
  } catch {}
  setIsLoggedIn(false);
  setShowLanding(true);
  showToast("Logged out successfully.");
};

  const handleSetProject = (id: string, name: string) => {
    console.log("setting project", id, name);

    setCurrentProjectId(id);
    setCurrentProject_(name);

    setCurrentProject(id);
  };

  const handleCreateNewAction = () => {
    const msgs: Record<string, string> = {
      projects: "Formulating new structural asset configuration card...",
      files: "Opening reference document stream loader zone...",
      compliance: "Syncing regulatory code database indexes...",
      reports: "Initializing drafting templates compiler queue...",
    };
    showToast(
      msgs[activeTab] ||
        `Preparing queue trace for: ${activeTab.toUpperCase()}`,
    );
  };

  const getActionText = () => {
    const map: Record<string, string> = {
      projects: "Create Asset",
      files: "Upload Spec",
      compliance: "Verify Codes",
      reports: "Draft Report",
      memory: "Log Decision",
      team: "Invite Partner",
    };
    return map[activeTab] || "Initialize Scan";
  };

if (isLoading) {
  return <LoadingScreen onComplete={() => {}} />;
}

if (showLoader) {
  return <LoadingScreen onComplete={() => setShowLoader(false)} />;
}

  if (showLanding && !isLoggedIn) {
  return (
    <LandingPage
      onEnterApp={() => setShowLanding(false)}
      onOpenAuth={() => setShowLanding(false)}
      isLoggedIn={isLoggedIn}
      onOpenWorkshop={() => setShowLanding(false)}
      onOpenComplianceAudit={() => setShowLanding(false)}
      onOpenMaterialsSandbox={() => setShowLanding(false)}
    />
  );
}


  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-800 font-sans antialiased text-left">
      {!isLoggedIn ? (
        <div className="flex-1 w-full min-h-screen bg-[#faf9f8] flex flex-col justify-between p-6 md:p-10 relative overflow-y-auto font-sans select-none">
          <div className="absolute inset-0 bg-[radial-gradient(#e5e2e1_1px,transparent_1px)] [background-size:24px_24px] opacity-45 pointer-events-none" />

          <div className="absolute top-8 left-8 w-6 h-6 border-t border-l border-zinc-300 pointer-events-none"></div>
          <div className="absolute top-8 right-8 w-6 h-6 border-t border-r border-zinc-300 pointer-events-none"></div>
          <div className="absolute bottom-8 left-8 w-6 h-6 border-b border-l border-zinc-300 pointer-events-none"></div>
          <div className="absolute bottom-8 right-8 w-6 h-6 border-b border-r border-zinc-300 pointer-events-none"></div>

          <div className="flex items-center gap-3 z-10 self-start">
            {/* <div className="w-10 h-10 bg-[#154212] flex items-center justify-center rounded-none shadow-3xs">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 21h18M5 21V8a2 2 0 012-2h10a2 2 0 012 2v13M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4M9 10h1M14 10h1"
                />
              </svg>
            </div> */}
            <img
              src="/logo.png"
              alt="CivilOS Logo"
              className="w-25 rounded-none"
            />
            <div className="text-left">
              <span className="font-serif text-[21px] font-bold text-zinc-900 tracking-tight block leading-none">
                CivilOS
              </span>
              <p className="text-[9px] uppercase tracking-[0.15em] text-[#8a8a8a] font-bold mt-1">
                Infrastructure Regulations Terminal
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm md:max-w-md mx-auto my-12 bg-white border border-[#e5e2e1] p-6 md:p-10 shadow-lg relative z-10 rounded-none">
            <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-zinc-300"></div>
            <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-zinc-300"></div>
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-zinc-300"></div>
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-zinc-300"></div>

            <div className="mb-6 text-left">
              <span className="text-[10px] uppercase font-bold text-[#154212] tracking-widest font-mono">
                Access Authorized Zone
              </span>
              <h2 className="font-serif text-[24px] font-normal text-zinc-900 mt-1 leading-snug">
                Developer Credentials Portal
              </h2>
              <p className="text-xs text-[#8a8a8a] mt-1.5 leading-relaxed">
                Sign in to sync your active IS civil databases, drawing sheets,
                and neural audit queues.
              </p>
            </div>

            <div className="grid grid-cols-2 border-b border-zinc-150 mb-6">
              <button
                onClick={() => {
                  setAuthTab("login");
                  setAuthError(null);
                }}
                className={`py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${authTab === "login" ? "border-[#154212] text-[#154212]" : "border-transparent text-zinc-400 hover:text-zinc-700"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthTab("signup");
                  setAuthError(null);
                }}
                className={`py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 ${authTab === "signup" ? "border-[#154212] text-[#154212]" : "border-transparent text-zinc-400 hover:text-zinc-700"}`}
              >
                Register
              </button>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-none">
                {authError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {authTab === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Arjun R."
                    className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="engineer@civilos.net"
                  className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white"
                />
              </div>

              {authTab === "signup" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">
                    Role
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-[#1a1c1c] rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white cursor-pointer"
                  >
                    <option value="Project Engineer">Project Engineer</option>
                    <option value="Bridge Design Analyst">
                      Bridge Design Analyst
                    </option>
                    <option value="Concrete Cover Analyst">
                      Concrete Cover Analyst
                    </option>
                    <option value="Regulatory Officer">
                      Regulatory Officer
                    </option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block font-mono">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={formPass}
                  onChange={(e) => setFormPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#154212] hover:bg-[#1a4b17] text-white text-xs font-bold py-3 uppercase tracking-wider rounded-none shadow-xs mt-3 cursor-pointer transition-colors"
              >
                {authTab === "login"
                  ? "Verify Security Token & Enter"
                  : "Establish Certified Account"}
              </button>
            </form>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 z-10 select-none text-center sm:text-left">
            <div className="flex items-center gap-2 text-zinc-400">
              <Lock className="w-3.5 h-3.5 text-[#154212]" />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold">
                256-Bit SHA Regulation Cryptography Verified
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 uppercase font-bold">
              CivilOS Terminal v4.8 — Standard BIS 456-875
            </span>
          </div>
        </div>
      )  : activeTab === "workshop" ? (
  <LoadCombinationWorkshop
    projectId={currentProjectId}
    userName={userProfile.name}
    onExit={() => setActiveTab("home")}
  />
) : activeTab === "compliance-center" ? (
  <ISCodeComplianceCenter
    onBack={() => setActiveTab("home")}
    userName={userProfile.name}
    projectId={currentProject}
  />
) : activeTab === "materials-sandbox" ? (
  <MaterialSandbox
    onBack={() => setActiveTab("home")}
    userName={userProfile.name}
    projectId={currentProject}
  />
) : (
        <div className="flex h-screen w-screen overflow-hidden bg-white text-zinc-850 font-sans antialiased relative">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userProfile={userProfile}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            onSignOut={handleSignOut}
          />

          <div className="flex-1 flex flex-col overflow-hidden max-w-full relative">
            <Header
              currentProject={currentProject}
              currentProjectId={currentProjectId}
               onOpenComplianceCenter={() => setActiveTab("compliance-center")}
  onOpenMaterialsSandbox={() => setActiveTab("materials-sandbox")}
              onOpenWorkshop={() => setActiveTab("workshop")}
              onProjectChange={(proj) => {
                setCurrentProject_(proj);
                showToast(`Switched Civil Asset Standard: ${proj}`);
              }}
              onSetProject={handleSetProject}
              onSearch={(query) => {
                showToast(`Database lookup completed for query: ${query}`);
              }}
              onNewAction={handleCreateNewAction}
              actionText={getActionText()}
              userProfile={userProfile}
              onSignOut={handleSignOut}
              mobileOpen={mobileOpen}
              setMobileOpen={setMobileOpen}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />

            <main className="flex-1 flex overflow-hidden w-full relative">
              {activeTab === "home" && (
                <HomeTab
                  onSuggestTabChange={(tab: AppTab) => setActiveTab(tab)}
                  userName={userProfile.name}
                  currentProject={currentProject}
                  projectId={currentProjectId}
                />
              )}
              {activeTab === "projects" && (
                <ProjectsTab
                  onSuggestTabChange={(tab: AppTab) => setActiveTab(tab)}
                  onSetProject={handleSetProject}
                />
              )}
              {activeTab === "files" && (
                <FilesTab projectId={currentProjectId} />
              )}
              {activeTab === "compliance" && (
                <ComplianceTab projectId={currentProjectId} />
              )}
              {activeTab === "reports" && (
                <ReportsTab projectId={currentProjectId} />
              )}
              {activeTab === "reasoning" && (
                <ReasoningTab projectId={currentProjectId} />
              )}
              {activeTab === "memory" && (
                <MemoryTab projectId={currentProjectId} />
              )}
              {activeTab === "ghostfix" && <GhostFixTab projectId={currentProjectId} />}
              {activeTab === "team" && <TeamTab projectId={currentProjectId} />}
              {activeTab === "profile" && (
                <ProfileView
                  userProfile={userProfile}
                  onUpdateProfile={(updated) => {
                    setUserProfile((prev) => ({
                      ...prev,
                      ...updated,
                      avatarInitials:
                        updated.name
                          .split(" ")
                          .map((w: string) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2) || "EN",
                    }));
                  }}
                />
              )}
              {activeTab === "archives" && (
                <ArchivesView projectId={currentProjectId} />
              )}
              {activeTab === "guide" && <GuideView />}
            </main>
          </div>

          {toastMsg && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900 border border-zinc-800 text-white px-6 py-3 shadow-lg flex items-center gap-3 z-50 text-xs font-semibold animate-fadeIn rounded-none">
              <span className="w-2 h-2 bg-[#154212] rounded-none inline-block"></span>
              <span>{toastMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
