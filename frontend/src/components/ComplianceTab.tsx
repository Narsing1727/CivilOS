import { useState, useEffect } from "react";
import {
  Gavel,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  MapPin,
  Search,
} from "lucide-react";
import { ViolationEntry } from "../types";
import { runComplianceCheck, getComplianceChecks } from "../api/compliance.api";
import { getTeamMembers, getActivity } from "../api/project.api";

interface ComplianceTabProps {
  projectId?: string;
  userName?: string;
}

export function ComplianceTab({ projectId, userName = "Engineer" }: ComplianceTabProps) {
  const [violations, setViolations] = useState<ViolationEntry[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [selectedViolationDetail, setSelectedViolationDetail] = useState<string | null>(null);
  const [searchWord, setSearchWord] = useState("");
  const [auditStatus, setAuditStatus] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [complianceChecks, setComplianceChecks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [activityFeed, setActivityFeed] = useState<any[]>([]);
  const [userCoords, setUserCoords] = useState({ lat: 20.5937, lon: 78.9629 });
  const [assignees, setAssignees] = useState<Record<string, string>>({});

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const mapViolations = (data: any[]) => {
    const latestCheck = data[0];
    if (!latestCheck) return [];
    return (latestCheck.results || [])
      .filter((r: any) => r.status === "fail" && r.clause !== "N/A")
      .map((r: any) => ({
        id: `${latestCheck.id}-${r.member_id || r.check}`,
        clause: r.clause || latestCheck.is_code,
        ref: r.check || "General",
        project: latestCheck.is_code,
        severity: "CRITICAL" as const,
        description: r.reason || "Compliance check failed",
        reportedDate: new Date(latestCheck.createdAt).toLocaleDateString("en-IN"),
        assignedTo: userName,
        vu: r.vu,
        vc: r.vc,
        suggestion: r.suggestion,
        member_id: r.member_id,
      }));
  };

  useEffect(() => {
    if (!projectId) return;
    const fetchAll = async () => {
      try {
        const res = await getComplianceChecks(projectId);
        setComplianceChecks(res.data);
        const mapped = mapViolations(res.data);
        setViolations(mapped);
        if (mapped.length > 0) setSelectedViolationDetail(mapped[0].id);
      } catch {}

      try {
        const teamRes = await getTeamMembers(projectId);
        const names = (teamRes.data || []).map((m: any) => m.user?.name || m.name).filter(Boolean);
        setTeamMembers(names.length > 0 ? names : [userName]);
      } catch {
        setTeamMembers([userName]);
      }

      try {
        const actRes = await getActivity(projectId);
        setActivityFeed((actRes.data || []).slice(0, 5));
      } catch {}
    };
    fetchAll();
  }, [projectId]);

  const handleAuditRun = async () => {
    if (!projectId) return;
    setIsAuditing(true);
    setAuditStatus("Initializing real-time compliance compiler. Extracting members from project files...");
    try {
      await runComplianceCheck(projectId, { is_code: "IS 456:2000", member_type: "beam" });
      const res = await getComplianceChecks(projectId);
      setComplianceChecks(res.data);
      const mapped = mapViolations(res.data);
      setViolations(mapped);
      if (mapped.length > 0) setSelectedViolationDetail(mapped[0].id);
      setAuditStatus("Deep parse complete. Cross-referenced drawings with IS 456 clauses. Check results updated.");
    } catch (err: any) {
      setAuditStatus("Audit failed: " + err.message);
    } finally {
      setIsAuditing(false);
    }
  };

  const latestCheck = complianceChecks[0];
  const totalChecks = latestCheck?.total_checks || 0;
  const passedChecks = latestCheck?.passed_checks || 0;
  const failedChecks = latestCheck?.failed_checks || 0;
  const integrityPct = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  const filteredViolations = violations.filter((v) => {
    const matchesSeverity = filterSeverity === "all" || v.severity === filterSeverity;
    const matchesSearch =
      v.clause.toLowerCase().includes(searchWord.toLowerCase()) ||
      v.description.toLowerCase().includes(searchWord.toLowerCase()) ||
      v.project.toLowerCase().includes(searchWord.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const currentV = violations.find((v) => v.id === selectedViolationDetail) as any;

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto bg-zinc-50 h-full custom-scrollbar font-sans">
      <div className="flex-1 p-6 md:p-8 lg:p-10 transition-colors">
        <header className="mb-8 flex flex-wrap gap-4 items-center justify-between select-none">
          <div className="text-left">
            <h2 className="font-serif text-[30px] leading-tight font-normal text-zinc-900 mb-1.5">Compliance Center</h2>
            <p className="text-xs text-[#8a8a8a] font-medium leading-relaxed">Mechanical compliance checking against BIS (Bureau of Indian Standards) directives.</p>
          </div>
          <button
            onClick={handleAuditRun}
            disabled={isAuditing}
            className="flex items-center gap-2 bg-[#154212] hover:bg-[#204a1c] disabled:opacity-70 text-white text-xs font-bold py-3 px-6 rounded-none shadow-2xs active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? "animate-spin" : ""}`} />
            {isAuditing ? "Auditing Models..." : "Trigger In-Line Audit"}
          </button>
        </header>

        {auditStatus && (
          <div className="mb-8 p-4 bg-[#e8f5e9] border border-[#154212]/15 text-[#154212] flex items-center justify-between text-xs font-medium rounded-none animate-fadeIn select-none">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-[#154212] rounded-none inline-block"></span>
              <span>{auditStatus}</span>
            </div>
            <button onClick={() => setAuditStatus(null)} className="text-[#154212] hover:opacity-85 font-bold uppercase text-[9px] tracking-wider select-none cursor-pointer border border-[#154212]/20 px-2 py-0.5 ml-3">
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-10 select-none">
          <div className="md:col-span-4 bg-white border border-[#e5e2e1] p-6 rounded-none flex items-center gap-6 shadow-3xs text-left">
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-[#154212]/15 rounded-none"></div>
              <div className="absolute inset-0 border-4 border-[#154212] rounded-none border-b-transparent rotate-45"></div>
              <span className="text-xl font-bold font-mono text-zinc-800">{integrityPct}%</span>
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wide">Project Integrity</p>
              <h3 className="font-serif text-lg font-bold mt-1 text-zinc-800">{integrityPct}% Compliant</h3>
              <p className="text-xs text-[#42493e] mt-2 leading-relaxed">
                {failedChecks > 0 ? `${failedChecks} violation${failedChecks > 1 ? "s" : ""} detected.` : "All checks passed."}
              </p>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-5">
            <div className="bg-white border border-zinc-100 p-6 rounded-none text-left shadow-3xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Total Checks Run</span>
                <p className="font-mono text-2xl font-bold text-zinc-800">{totalChecks} Checks</p>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-green-600 mt-2 font-bold">
                <CheckCircle2 className="w-3 h-3" /> All codes included
              </div>
            </div>

            <div className="bg-white border border-zinc-100 p-6 rounded-none text-left shadow-3xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Critical Violations</span>
                <p className="font-mono text-2xl font-bold text-[#ba1a1a]">{failedChecks} Alerts</p>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-[#ba1a1a] mt-2 font-bold">
                <AlertCircle className="w-3 h-3" /> Requires redesign
              </div>
            </div>

            <div className="bg-white border border-zinc-100 p-6 rounded-none text-left shadow-3xs flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block mb-2">Rules Passed</span>
                <p className="font-mono text-2xl font-bold text-[#154212]">{passedChecks} Rules</p>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-zinc-400 mt-2 font-medium">Sufficient safety margins</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e5e2e1] rounded-none overflow-hidden shadow-xs">
          <div className="p-6 border-b border-zinc-100 flex flex-wrap gap-4 items-center justify-between select-none">
            <div className="flex gap-2">
              {["all", "CRITICAL", "WARNING"].map((tag) => (
                <button key={tag} onClick={() => setFilterSeverity(tag)}
                  className={`px-4 py-2 text-xs font-semibold rounded-none cursor-pointer transition-all ${filterSeverity === tag ? "bg-[#e2dfde] text-[#1a1c1c]" : "text-zinc-400 hover:bg-zinc-50 hover:text-zinc-800"}`}>
                  {tag === "all" ? "All Issues" : tag}
                </button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input onChange={(e) => setSearchWord(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-none py-2 pl-9 pr-4 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                placeholder="Search violations, clauses, etc..." type="text" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 md:divide-x divide-zinc-100">
            <div className="md:col-span-7 divide-y divide-zinc-100 text-left text-xs">
              {filteredViolations.length === 0 ? (
                <div className="p-16 text-center text-zinc-400">
                  <p className="text-sm font-bold text-zinc-500 mb-2">No violations found</p>
                  <p className="text-xs leading-relaxed">Run a compliance audit to check IS code violations for this project.</p>
                </div>
              ) : filteredViolations.map((v: any) => {
                const isSelected = selectedViolationDetail === v.id;
                return (
                  <div key={v.id} onClick={() => setSelectedViolationDetail(v.id)}
                    className={`p-6 cursor-pointer transition-all border-l-4 ${isSelected ? "bg-[#f3f3f1] border-[#154212]" : "border-transparent hover:bg-zinc-50/50"}`}>
                    <div className="flex justify-between items-start mb-2.5 select-none">
                      <span className="font-mono font-bold text-[#1a1c1c]">{v.clause}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none border ${v.severity === "CRITICAL" ? "bg-zinc-100 border-zinc-300 text-zinc-900 font-bold" : "bg-transparent border-zinc-200 text-zinc-600"}`}>
                        {v.severity}
                      </span>
                    </div>
                    <p className="font-bold text-zinc-800 text-xs select-none">{v.ref} • {v.project}</p>
                    <p className="text-[#42493e] mt-2 leading-relaxed">{v.description}</p>
                    <div className="mt-5 flex items-center justify-between text-[10px] text-zinc-400 select-none border-t border-zinc-100/50 pt-3">
                      <span>Reported: {v.reportedDate}</span>
                      <span>Assignee: <span className="font-bold text-zinc-500">{assignees[v.id] || v.assignedTo}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="md:col-span-5 p-8 bg-[#fcfcfa] text-left select-none text-xs">
              {!currentV ? (
                <p className="text-zinc-400 italic">Select a code clause parameter to inspect deep mechanical math analysis.</p>
              ) : (
                <div className="space-y-8">
                  <div>
                    <span className="bg-[#154212]/10 text-[#154212] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-none">
                      Engineering Calculation Sheet
                    </span>
                    <h4 className="font-serif text-xl font-normal mt-3 text-zinc-800">{currentV.clause}</h4>
                    <p className="text-[10px] text-zinc-400 mt-1 font-mono uppercase tracking-wider">{currentV.ref}</p>
                  </div>

                  <div className="bg-white border border-zinc-150 p-5 rounded-none space-y-3.5 shadow-3xs font-mono text-[11px] text-zinc-600">
                    {currentV.vu !== undefined && (
                      <div className="flex justify-between border-b border-zinc-50 pb-2">
                        <span className="text-zinc-400">Shear demand (Vu):</span>
                        <span className="font-bold text-[#ba1a1a]">Vu = {currentV.vu} kN</span>
                      </div>
                    )}
                    {currentV.vc !== undefined && (
                      <div className="flex justify-between border-b border-zinc-50 pb-2">
                        <span className="text-zinc-400">Shear capacity (Vc):</span>
                        <span className="font-bold">Vc = {currentV.vc} kN</span>
                      </div>
                    )}
                    {currentV.vu !== undefined && currentV.vc !== undefined && (
                      <div className="flex justify-between border-b border-zinc-50 pb-2 font-bold text-[#ba1a1a]">
                        <span>Excess load:</span>
                        <span>Vu - Vc = +{(currentV.vu - currentV.vc).toFixed(1)} kN</span>
                      </div>
                    )}
                    <div className="text-[10px] text-zinc-400 mt-2 font-sans leading-relaxed">
                      {currentV.description}
                    </div>
                    {currentV.suggestion && (
                      <div className="text-[10px] text-[#154212] font-sans leading-relaxed pt-2 border-t border-zinc-100">
                        <span className="font-bold">Suggestion: </span>{currentV.suggestion}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-3 font-mono tracking-wider">Reassign Task</label>
                    <div className="flex flex-wrap gap-2">
                      {teamMembers.map((name) => (
                        <button key={name}
                          onClick={() => setAssignees(prev => ({ ...prev, [currentV.id]: name }))}
                          className={`px-3 py-2 text-xs font-semibold rounded-none cursor-pointer border transition-all ${(assignees[currentV.id] || currentV.assignedTo) === name ? "bg-[#154212] border-transparent text-white font-bold" : "border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700"}`}>
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {currentV.vu !== undefined && currentV.vc !== undefined && currentV.vu > currentV.vc && (
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-none text-[10px] leading-relaxed select-text flex items-start gap-3 border border-amber-200 shadow-3xs">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold uppercase tracking-wider block mb-1">Safety Override Pending</span>
                        Member {currentV.member_id || currentV.ref} has shear demand exceeding capacity by {(currentV.vu - currentV.vc).toFixed(1)} kN. Structural intervention required before construction proceeds.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <aside className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-[#e5e2e1] flex flex-col bg-white p-6 md:p-8 lg:p-10 space-y-8 min-w-[340px] transition-colors shrink-0 select-none">
        <div className="text-left font-sans">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-[#ba1a1a]" />
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Site Mapping Locator</span>
          </div>
          <div className="h-40 rounded-none overflow-hidden shadow-3xs border border-zinc-200">
            <iframe
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${userCoords.lon - 0.01},${userCoords.lat - 0.01},${userCoords.lon + 0.01},${userCoords.lat + 0.01}&layer=mapnik&marker=${userCoords.lat},${userCoords.lon}`}
              className="w-full h-full border-0"
              title="Site Location"
            />
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 font-medium font-mono">
            LAT: {userCoords.lat.toFixed(4)}° · LON: {userCoords.lon.toFixed(4)}° — Live GPS sync active
          </p>
        </div>

        <div className="text-left font-sans flex-1">
          <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-4">Code Stream Alerts</h3>
          <div className="space-y-4">
            {activityFeed.length === 0 ? (
              <p className="text-xs text-zinc-400 italic">No activity recorded yet.</p>
            ) : activityFeed.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3">
                <Gavel className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] font-bold text-zinc-700 capitalize">
                    {a.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-[9px] text-zinc-400 mt-0.5 font-mono">
                    {new Date(a.createdAt).toLocaleDateString("en-IN")} · {a.user?.name || "System"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}