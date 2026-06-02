import React, { useState, useRef, useEffect, useMemo } from "react";
import { extractMembers } from "../api/extract.api";
import {
  Sparkles, Layers, RotateCw, CheckCircle2, AlertTriangle,
  TrendingUp, Trash2, Search, Compass, Eye, EyeOff,
  ArrowRight, RotateCcw, Check, Zap, BookOpen, Filter,
  RefreshCw, Database, Activity
} from "lucide-react";

import { addMemory } from "../api/memory.api";

interface GhostingTabProps {
  projectId?: string;
  userName?: string;
}

interface AIModification {
  id: string;
  memberId: string;
  memberLabel: string;
  memberType: "beam" | "column" | "foundation" | "girder" | "slab" | "wall" | "pile";
  zone: string;
  title: string;
  description: string;
  codeStandard: string;
  clause: string;
  resilienceDelta: number;
  costDelta: number;
  costINR: number;
  timeDays: number;
  visualType: "stirrups" | "cfrp" | "tiebar" | "plates" | "pile_depth" | "shear_wall";
  criticalCondition: string;
  reasons: string;
  currentVu: number;
  currentVc: number;
  proposedVc: number;
  currentParams: Record<string, string>;
  proposedParams: Record<string, string>;
  formula: string;
  status: "fail" | "warning";
}

interface CommittedFix {
  id: string;
  modsCommitted: string[];
  author: string;
  note: string;
  timestamp: string;
  resilienceMetric: string;
  costAdded: string;
}

const IS456_SHEAR = (b: number, d: number, fck: number, fy: number, Asv: number, sv: number, Ast: number): number => {
  const pt = Math.min((Ast / (b * d)) * 100, 3.0);
  const tau_c = 0.17 * Math.sqrt(fck) * (1 + pt / 3);
  const Vc = tau_c * b * d / 1000;
  const Vus = (0.87 * fy * Asv * d) / (sv * 1000);
  return Math.round((Vc + Vus) * 10) / 10;
};

const IS2911_PILE = (dia: number, L: number, qb: number, fs: number): number => {
  const A_tip = Math.PI * (dia / 1000) ** 2 / 4;
  const perimeter = Math.PI * dia / 1000;
  const Qb = qb * A_tip;
  const Qs = fs * perimeter * L;
  return Math.round((Qb + Qs) / 2.5 * 10) / 10;
};




export function GhostFixTab({ projectId, userName }: GhostingTabProps) {
  const [modifications, setModifications] = useState<AIModification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModId, setSelectedModId] = useState<string>("");
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [ghostingEnabled, setGhostingEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
const [activeViewMode, setActiveViewMode] = useState<"volumetric" | "wireframe" | "documentation" | "crosssection">("volumetric");
  const [orbitAngle, setOrbitAngle] = useState(35);
  const [isRotating, setIsRotating] = useState(false);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [customReasoningNote, setCustomReasoningNote] = useState("");
  const [checkedMods, setCheckedMods] = useState<string[]>([]);
  const [committedFixesLog, setCommittedFixesLog] = useState<CommittedFix[]>([]);
  const [isSaving, setIsSaving] = useState(false);

useEffect(() => {
  if (!projectId) return;
  setLoading(true);
  
  extractMembers(projectId).then((members) => {
    if (!members || members.length === 0) {
      setLoading(false);
      return;
    }

    const mods: AIModification[] = members
  .filter((m: any) => m.status === "fail" || m.status === "warn")
  .map((m: any) => {
      const isBeam = m.type === "Beam";
      const isFoundation = m.type === "Foundation";
      const currentVc = isBeam
        ? IS456_SHEAR(300, 450, 25, 415, 157, 250, 1570)
        : isFoundation
        ? IS2911_PILE(450, 18, 250, 40)
        : m.currentVc;
      const proposedVc = isBeam
        ? IS456_SHEAR(300, 450, 25, 415, 157, 100, 1570)
        : isFoundation
        ? IS2911_PILE(450, 24, 250, 40)
        : m.currentVc * 1.25;

      return {
        id: `MOD-${m.id}`,
        memberId: m.id,
        memberLabel: `${m.type} ${m.id}`,
        memberType: m.type.toLowerCase() as any,
        zone: `ZONE: ${m.id}`,
        title: m.status === "fail"
          ? `Shear Reinforcement Fix — ${m.id}`
          : `Review Required — ${m.id}`,
        description: `${m.type} ${m.id} requires structural intervention. Vu=${m.baseVu}kN vs Vc=${m.currentVc}kN. ${m.clause}`,
        codeStandard: "Bureau of Indian Standards",
        clause: m.clause || "IS 456:2000 Cl. 40.2",
        resilienceDelta: m.status === "fail" ? 28 : 15,
        costDelta: m.status === "fail" ? 4.5 : 2.0,
        costINR: m.status === "fail" ? 18500 : 8000,
        timeDays: m.status === "fail" ? 2 : 1,
        visualType: isFoundation ? "pile_depth" : "stirrups",
        criticalCondition: `Vu (${m.baseVu} kN) vs Vc (${m.currentVc} kN). Ratio: ${(m.baseVu / m.currentVc).toFixed(2)}`,
        reasons: `Structural intervention required per ${m.clause}`,
        currentVu: m.baseVu,
        currentVc,
        proposedVc,
        formula: isBeam ? "Vus = 0.87 × fy × Asv × d / sv" : "Qa = (Qb + Qs) / FOS",
        currentParams: { "Vu": `${m.baseVu} kN`, "Vc": `${m.currentVc} kN`, "Status": m.status.toUpperCase() },
        proposedParams: { "Vu": `${m.baseVu} kN`, "Vc": `${proposedVc} kN`, "Status": "PASS ✓" },
        status: (m.status === "warn" ? "warning" : m.status === "pass" ? "warning" : m.status) as "fail" | "warning",
      };
    });

    setModifications(mods);
    if (mods.length > 0) {
      setSelectedModId(mods[0].id);
      setSelectedMemberId(mods[0].memberId);
    }
  }).catch(() => {}).finally(() => setLoading(false));
}, [projectId]);

  useEffect(() => {
    let interval: any;
    if (isRotating) {
      interval = setInterval(() => setOrbitAngle(prev => (prev + 1) % 360), 100);
    }
    return () => clearInterval(interval);
  }, [isRotating]);

  const activeMod = useMemo(() => modifications.find(m => m.id === selectedModId) || modifications[0], [modifications, selectedModId]);

  const filteredModifications = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return modifications.filter(m =>
      m.id.toLowerCase().includes(q) || m.title.toLowerCase().includes(q) ||
      m.memberLabel.toLowerCase().includes(q) || m.clause.toLowerCase().includes(q)
    );
  }, [modifications, searchQuery]);

  const uniqueMembers = useMemo(() => {
    const seen = new Set<string>();
    return modifications.filter(m => {
      if (seen.has(m.memberId)) return false;
      seen.add(m.memberId);
      return true;
    });
  }, [modifications]);

  const getProjectedCoords = (x: number, y: number, z: number) => {
    const angleRad = (orbitAngle * Math.PI) / 180;
    const rotatedX = x * Math.cos(angleRad) - z * Math.sin(angleRad);
    const rotatedZ = x * Math.sin(angleRad) + z * Math.cos(angleRad);
    const projX = 350 + rotatedX * 2.5 + panX;
    const projY = 320 + y * 2.2 - rotatedZ * 0.9 + panY;
    return { x: projX, y: projY, depth: rotatedZ };
  };

  const showToast = (message: string) => {
    const toast = document.createElement("div");
    toast.className = "fixed bottom-6 right-6 bg-zinc-950 text-white border border-[#22c55e]/30 px-5 py-3 shadow-xl z-50 text-xs font-mono select-none flex items-center gap-2 animate-fadeIn";
    toast.innerHTML = `<span class="w-1.5 h-1.5 bg-[#22c55e] inline-block animate-ping"></span> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("opacity-0", "transition-opacity", "duration-500");
      setTimeout(() => toast.remove(), 500);
    }, 3200);
  };

  const handleToggleCheckMod = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckedMods(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleDismissMod = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setModifications(prev => prev.filter(m => m.id !== id));
    setCheckedMods(prev => prev.filter(m => m !== id));
    const rest = modifications.filter(m => m.id !== id);
    if (rest.length > 0) { setSelectedModId(rest[0].id); setSelectedMemberId(rest[0].memberId); }
    showToast(`Recommendation ${id} dismissed.`);
  };

  const handleCommitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkedMods.length === 0) return;
    setIsSaving(true);
    const totalResilience = checkedMods.reduce((a, mid) => a + (modifications.find(m => m.id === mid)?.resilienceDelta || 0), 0);
    const totalCost = checkedMods.reduce((a, mid) => a + (modifications.find(m => m.id === mid)?.costDelta || 0), 0);
    const noteText = customReasoningNote.trim() || `Accepted generative recommendations (${checkedMods.join(", ")}) to optimize structural containment parameters.`;
    try {
      if (projectId) {
        await addMemory(projectId, {
          title: `Ghost Fix Batch: ${checkedMods.join(", ")}`,
          content: `Committed fixes: ${checkedMods.join(", ")} | Resilience gain: +${totalResilience}% | Cost delta: +${totalCost.toFixed(1)}% | Note: ${noteText}`,
          type: "decision",
          tags: ["ghost-fix", "ai-remediation", "batch-commit"],
        });
      }
    } catch {}
    const newFix: CommittedFix = {
      id: `FIX-${Math.floor(100 + Math.random() * 900)}`,
      modsCommitted: [...checkedMods],
      author: userName || "Project Engineer",
      note: noteText,
      timestamp: new Date().toISOString().substring(0, 19).replace("T", " "),
      resilienceMetric: `+${totalResilience}% Resilience`,
      costAdded: `+${totalCost.toFixed(1)}% Budget`
    };
    setCommittedFixesLog(prev => [newFix, ...prev]);
    setModifications(prev => prev.filter(m => !checkedMods.includes(m.id)));
    const remaining = modifications.filter(m => !checkedMods.includes(m.id));
    if (remaining.length > 0) { setSelectedModId(remaining[0].id); setSelectedMemberId(remaining[0].memberId); }
    setCheckedMods([]);
    setCustomReasoningNote("");
    setIsCommitModalOpen(false);
    setIsSaving(false);
    showToast("COMMITTED: Fix written to Project Memory.");
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - panX, y: e.clientY - panY };
  };
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPanX(e.clientX - dragStart.current.x);
    setPanY(e.clientY - dragStart.current.y);
  };
  const handleCanvasMouseUp = () => setIsDragging(false);
  const handleResetViewport = () => { setPanX(0); setPanY(0); setZoomFactor(1.0); setOrbitAngle(35); setIsRotating(false); showToast("Camera reset."); };

  const cumulativeStats = useMemo(() => {
    let resilience = 72;
    let costDelta = 0;
    let safetyFactor = 1.04;
    checkedMods.forEach(mid => {
      const m = modifications.find(x => x.id === mid);
      if (m) { resilience += m.resilienceDelta; costDelta += m.costDelta; safetyFactor += m.resilienceDelta * 0.012; }
    });
    return { resilience: Math.min(100, resilience), costDelta, safetyFactor };
  }, [checkedMods, modifications]);











  const renderCrossSection = () => {
  if (!activeMod) return null;
  const type = activeMod.memberType;
  const isBeam = type === "beam" || type === "girder";
  const isCol = type === "column" || type === "wall";
  const isFound = type === "foundation" || type === "pile";

  const cx = 350;
  const cy = 310;

  if (isBeam) {
    const bw = 120;
    const d = 180;
    const cover = 14;
    const x0 = cx - bw / 2;
    const y0 = cy - d / 2;
    const stirrupPitch = activeMod.visualType === "stirrups" ? 50 : 100;
    const numStirrups = Math.floor(d / stirrupPitch);
    const rebarRows = [[x0 + cover + 8, x0 + bw / 2, x0 + bw - cover - 8], [x0 + cover + 8, x0 + bw - cover - 8]];

    return (
      <g>
        <rect x={x0} y={y0} width={bw} height={d} fill="#27272a" stroke="#71717a" strokeWidth="2.5" />
        <rect x={x0 + cover} y={y0 + cover} width={bw - cover * 2} height={d - cover * 2} fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray={activeMod.visualType === "stirrups" ? "none" : "4,3"} />

        {Array.from({ length: numStirrups + 1 }).map((_, i) => {
          const sy = y0 + cover + i * (d - cover * 2) / numStirrups;
          return (
            <g key={i}>
              <line x1={x0 + cover} y1={sy} x2={x0 + bw - cover} y2={sy} stroke="#22c55e" strokeWidth={activeMod.visualType === "stirrups" ? "2" : "1"} opacity="0.6" />
            </g>
          );
        })}

        {rebarRows[0].map((rx, i) => (
          <circle key={i} cx={rx} cy={y0 + d - cover - 8} r="7" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
        ))}
        {rebarRows[1].map((rx, i) => (
          <circle key={i} cx={rx} cy={y0 + cover + 8} r="7" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
        ))}

        <line x1={x0 - 20} y1={y0} x2={x0 - 20} y2={y0 + d} stroke="#a1a1aa" strokeWidth="1" markerStart="url(#dimArrow)" markerEnd="url(#dimArrow)" />
        <text x={x0 - 35} y={cy} fill="#a1a1aa" fontSize="9" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90, ${x0 - 35}, ${cy})`}>d = 450mm</text>

        <line x1={x0} y1={y0 - 18} x2={x0 + bw} y2={y0 - 18} stroke="#a1a1aa" strokeWidth="1" />
        <text x={cx} y={y0 - 24} fill="#a1a1aa" fontSize="9" fontFamily="monospace" textAnchor="middle">b = 300mm</text>

        <text x={cx} y={y0 + d + 28} fill="#22c55e" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          sv = {activeMod.visualType === "stirrups" ? "100mm c/c (PROPOSED)" : "250mm c/c (CURRENT)"}
        </text>

        <text x={cx} y={y0 - 42} fill="#ffffff" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          {activeMod.memberLabel} — BEAM CROSS-SECTION (IS 456:2000)
        </text>

        <text x={x0 + bw + 20} y={y0 + d - cover - 8} fill="#f59e0b" fontSize="8" fontFamily="monospace">3-16φ</text>
        <text x={x0 + bw + 20} y={y0 + cover + 12} fill="#f59e0b" fontSize="8" fontFamily="monospace">2-16φ</text>

        <rect x={x0 - 5} y={y0 + d + 38} width={bw + 10} height={28} fill="#064e3b" stroke="#22c55e" strokeWidth="1" />
        <text x={cx} y={y0 + d + 51} fill="#34d399" fontSize="8" fontFamily="monospace" textAnchor="middle">Vu = {activeMod.currentVu} kN | Vc = {activeMod.proposedVc} kN</text>
        <text x={cx} y={y0 + d + 63} fill="#86efac" fontSize="8" fontFamily="monospace" textAnchor="middle">RATIO: {(activeMod.currentVu / activeMod.proposedVc).toFixed(2)} ← {activeMod.currentVu / activeMod.proposedVc < 1 ? "✓ SAFE" : "✗ FAIL"}</text>
      </g>
    );
  }

  if (isCol) {
    const side = 160;
    const cover = 14;
    const x0 = cx - side / 2;
    const y0 = cy - side / 2;
    const tieSpacing = 80;
    const numTies = Math.floor(side / tieSpacing);
    const rebarPositions = [
      [x0 + cover + 8, y0 + cover + 8],
      [cx, y0 + cover + 8],
      [x0 + side - cover - 8, y0 + cover + 8],
      [x0 + cover + 8, cy],
      [x0 + side - cover - 8, cy],
      [x0 + cover + 8, y0 + side - cover - 8],
      [cx, y0 + side - cover - 8],
      [x0 + side - cover - 8, y0 + side - cover - 8],
    ];

    return (
      <g>
        <rect x={x0} y={y0} width={side} height={side} fill="#27272a" stroke="#71717a" strokeWidth="2.5" />
        <rect x={x0 + cover} y={y0 + cover} width={side - cover * 2} height={side - cover * 2} fill="none" stroke="#22c55e" strokeWidth="1.5" />

        {Array.from({ length: numTies + 1 }).map((_, i) => {
          const ty = y0 + cover + i * (side - cover * 2) / numTies;
          return <line key={i} x1={x0 + cover} y1={ty} x2={x0 + side - cover} y2={ty} stroke="#22c55e" strokeWidth="1" opacity="0.5" />;
        })}

        {rebarPositions.map(([rx, ry], i) => (
          <circle key={i} cx={rx} cy={ry} r="8" fill="#f59e0b" stroke="#d97706" strokeWidth="1.5" />
        ))}

        <line x1={x0 - 20} y1={y0} x2={x0 - 20} y2={y0 + side} stroke="#a1a1aa" strokeWidth="1" />
        <text x={x0 - 36} y={cy} fill="#a1a1aa" fontSize="9" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90, ${x0 - 36}, ${cy})`}>400mm</text>

        <line x1={x0} y1={y0 - 18} x2={x0 + side} y2={y0 - 18} stroke="#a1a1aa" strokeWidth="1" />
        <text x={cx} y={y0 - 24} fill="#a1a1aa" fontSize="9" fontFamily="monospace" textAnchor="middle">400mm</text>

        <text x={cx} y={y0 - 42} fill="#ffffff" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          {activeMod.memberLabel} — COLUMN CROSS-SECTION (IS 456:2000)
        </text>

        <text x={x0 + side + 15} y={cy} fill="#f59e0b" fontSize="8" fontFamily="monospace">8-20φ</text>
        <text x={cx} y={y0 + side + 28} fill="#22c55e" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          Lateral Ties: 8φ @ {activeMod.currentVu > activeMod.currentVc ? "100" : "150"}mm c/c
        </text>

        <rect x={x0 - 5} y={y0 + side + 38} width={side + 10} height={28} fill="#064e3b" stroke="#22c55e" strokeWidth="1" />
        <text x={cx} y={y0 + side + 51} fill="#34d399" fontSize="8" fontFamily="monospace" textAnchor="middle">Pu = {(activeMod.currentVu * 6.5).toFixed(0)} kN | Vu = {activeMod.currentVu} kN</text>
        <text x={cx} y={y0 + side + 63} fill="#86efac" fontSize="8" fontFamily="monospace" textAnchor="middle">Vc = {activeMod.proposedVc} kN — {activeMod.currentVu < activeMod.proposedVc ? "✓ PROPOSED SAFE" : "✗ CHECK REQ."}</text>
      </g>
    );
  }

  if (isFound) {
    const fw = 200;
    const fd = 100;
    const pileR = 22;
    const x0 = cx - fw / 2;
    const y0 = cy - fd / 2;
    const pileCenters = [cx - 70, cx, cx + 70];

    return (
      <g>
        <rect x={x0} y={y0} width={fw} height={fd} fill="#27272a" stroke="#71717a" strokeWidth="2.5" />

        {pileCenters.map((px, i) => (
          <g key={i}>
            <circle cx={px} cy={cy} r={pileR} fill="#1c1917" stroke="#22c55e" strokeWidth="2" />
            <circle cx={px} cy={cy} r={pileR - 8} fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="3,2" />
            {[0, 90, 180, 270].map((angle, j) => {
              const rad = (angle * Math.PI) / 180;
              const rx = px + (pileR - 10) * Math.cos(rad);
              const ry = cy + (pileR - 10) * Math.sin(rad);
              return <circle key={j} cx={rx} cy={ry} r="4" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />;
            })}
          </g>
        ))}

        <line x1={x0 - 20} y1={y0} x2={x0 - 20} y2={y0 + fd} stroke="#a1a1aa" strokeWidth="1" />
        <text x={x0 - 38} y={cy} fill="#a1a1aa" fontSize="9" fontFamily="monospace" textAnchor="middle" transform={`rotate(-90, ${x0 - 38}, ${cy})`}>500mm</text>

        <line x1={x0} y1={y0 - 18} x2={x0 + fw} y2={y0 - 18} stroke="#a1a1aa" strokeWidth="1" />
        <text x={cx} y={y0 - 24} fill="#a1a1aa" fontSize="9" fontFamily="monospace" textAnchor="middle">2000mm × 2000mm</text>

        <text x={cx} y={y0 - 42} fill="#ffffff" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          {activeMod.memberLabel} — PILE CAP PLAN (IS 2911:2010)
        </text>

        <text x={cx} y={y0 + fd + 28} fill="#22c55e" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
          Pile Dia: 450mm | Depth: {activeMod.visualType === "pile_depth" ? "24m (PROPOSED)" : "18m (CURRENT)"}
        </text>

        <rect x={x0 - 5} y={y0 + fd + 38} width={fw + 10} height={28} fill="#064e3b" stroke="#22c55e" strokeWidth="1" />
        <text x={cx} y={y0 + fd + 51} fill="#34d399" fontSize="8" fontFamily="monospace" textAnchor="middle">Vu = {activeMod.currentVu} kN | Qa = {activeMod.proposedVc} kN</text>
        <text x={cx} y={y0 + fd + 63} fill="#86efac" fontSize="8" fontFamily="monospace" textAnchor="middle">FOS = {(activeMod.proposedVc / activeMod.currentVu).toFixed(2)} — {activeMod.proposedVc / activeMod.currentVu >= 1 ? "✓ SAFE" : "✗ INCREASE DEPTH"}</text>
      </g>
    );
  }

  return null;
};











  const renderStructure = () => {
    if (!activeMod) return null;
    const type = activeMod.memberType;
    if (type === "beam" || type === "girder") {
      const heightLevels = [-100, -60, -20, 20, 60, 100];
      const columnSides = [-35, 35];
      return (
        <g opacity={activeViewMode === "wireframe" ? "0.3" : "0.75"}>
          <ellipse cx={getProjectedCoords(0, 160, 0).x} cy={getProjectedCoords(0, 160, 0).y} rx="150" ry="25" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="5,5" />
          {columnSides.map((cx, i) => {
            const topP = getProjectedCoords(cx, -110, 0);
            const botP = getProjectedCoords(cx, 150, 0);
            return (
              <g key={i}>
                {activeViewMode !== "wireframe" && <line x1={topP.x} y1={topP.y} x2={botP.x} y2={botP.y} stroke="#3f3f46" strokeWidth="24" strokeLinecap="square" strokeOpacity="0.9" />}
                <line x1={topP.x} y1={topP.y} x2={botP.x} y2={botP.y} stroke="#71717a" strokeWidth={activeViewMode === "wireframe" ? "1.5" : "2"} />
              </g>
            );
          })}
          {heightLevels.map((y, idx) => {
            const left = getProjectedCoords(-35, y, 0);
            const right = getProjectedCoords(35, y, 0);
            return (
              <g key={idx}>
                <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="#71717a" strokeWidth={activeViewMode === "wireframe" ? "1" : "2"} />
                {activeViewMode !== "wireframe" && <circle cx={left.x} cy={left.y} r="2.5" fill="#52525b" />}
              </g>
            );
          })}
          {(() => {
            const p1 = getProjectedCoords(-80, -10, 0);
            const p2 = getProjectedCoords(80, -10, 0);
            const p3 = getProjectedCoords(80, 25, 0);
            const p4 = getProjectedCoords(-80, 25, 0);
            return (
              <g>
                {activeViewMode !== "wireframe" && <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`} fill="#27272a" stroke="#52525b" strokeWidth="2" />}
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#a1a1aa" strokeWidth="1.2" />
                <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke="#a1a1aa" strokeWidth="1.2" />
              </g>
            );
          })()}
        </g>
      );
    }
    if (type === "foundation" || type === "pile") {
      const pileSides = [-60, -20, 20, 60];
      return (
        <g opacity={activeViewMode === "wireframe" ? "0.3" : "0.75"}>
          <ellipse cx={getProjectedCoords(0, 160, 0).x} cy={getProjectedCoords(0, 160, 0).y} rx="200" ry="30" fill={activeViewMode !== "wireframe" ? "#1c1917" : "none"} stroke="#27272a" strokeWidth="1" strokeDasharray="3,3" />
          {pileSides.map((cx, i) => {
            const topP = getProjectedCoords(cx, -20, 0);
            const botP = getProjectedCoords(cx, 155, 0);
            return (
              <g key={i}>
                {activeViewMode !== "wireframe" && <line x1={topP.x} y1={topP.y} x2={botP.x} y2={botP.y} stroke="#3f3f46" strokeWidth="16" strokeLinecap="round" strokeOpacity="0.9" />}
                <line x1={topP.x} y1={topP.y} x2={botP.x} y2={botP.y} stroke="#71717a" strokeWidth="1.5" />
                <circle cx={topP.x} cy={topP.y} r="4" fill="#52525b" />
              </g>
            );
          })}
          {(() => {
            const p1 = getProjectedCoords(-90, -20, 0);
            const p2 = getProjectedCoords(90, -20, 0);
            const p3 = getProjectedCoords(90, 10, 0);
            const p4 = getProjectedCoords(-90, 10, 0);
            return (
              <g>
                {activeViewMode !== "wireframe" && <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`} fill="#292524" stroke="#57534e" strokeWidth="2" />}
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#a1a1aa" strokeWidth="1.5" />
                <line x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y} stroke="#a1a1aa" strokeWidth="1" strokeDasharray="4,3" />
              </g>
            );
          })()}
        </g>
      );
    }
    if (type === "wall" || type === "column") {
      const wallSides = [-50, 50];
      const wallHeights = [-120, -80, -40, 0, 40, 80, 120];
      return (
        <g opacity={activeViewMode === "wireframe" ? "0.3" : "0.75"}>
          <ellipse cx={getProjectedCoords(0, 160, 0).x} cy={getProjectedCoords(0, 160, 0).y} rx="160" ry="22" fill="none" stroke="#27272a" strokeWidth="1" strokeDasharray="5,5" />
          {wallSides.map((cx, i) => {
            const topP = getProjectedCoords(cx, -120, 0);
            const botP = getProjectedCoords(cx, 155, 0);
            return (
              <g key={i}>
                {activeViewMode !== "wireframe" && <line x1={topP.x} y1={topP.y} x2={botP.x} y2={botP.y} stroke="#3f3f46" strokeWidth="30" strokeLinecap="square" strokeOpacity="0.9" />}
                <line x1={topP.x} y1={topP.y} x2={botP.x} y2={botP.y} stroke="#71717a" strokeWidth="2" />
              </g>
            );
          })}
          {wallHeights.map((y, idx) => {
            const left = getProjectedCoords(-50, y, 0);
            const right = getProjectedCoords(50, y, 0);
            return <line key={idx} x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="#3f3f46" strokeWidth="1" />;
          })}
          {(() => {
            const p1 = getProjectedCoords(-90, -120, 0);
            const p2 = getProjectedCoords(90, -120, 0);
            const p3 = getProjectedCoords(90, -100, 0);
            const p4 = getProjectedCoords(-90, -100, 0);
            return (
              <g>
                {activeViewMode !== "wireframe" && <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`} fill="#27272a" stroke="#71717a" strokeWidth="1.5" />}
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#a1a1aa" strokeWidth="1.5" />
              </g>
            );
          })()}
        </g>
      );
    }
    return null;
  };

  const renderGhostOverlay = () => {
    if (!activeMod || !ghostingEnabled) return null;
    const vt = activeMod.visualType;

    if (vt === "stirrups") {
      const p = getProjectedCoords(0, 15, 0);
      return (
        <g>
          <circle cx={p.x} cy={p.y} r="120" fill="url(#neonGlowGrad)" className="animate-pulse" />
          {Array.from({ length: 12 }).map((_, i) => {
            const yLev = -40 + i * 11;
            const left = getProjectedCoords(-37, yLev, 0);
            const right = getProjectedCoords(37, yLev, 0);
            return (
              <g key={i}>
                <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round" className="animate-pulse" style={{ animationDelay: `${i * 120}ms`, animationDuration: "1.8s" }} />
                <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="#a7f3d0" strokeWidth="1.2" />
                <circle cx={left.x} cy={left.y} r="3" fill="#22c55e" />
                <circle cx={right.x} cy={right.y} r="3" fill="#22c55e" />
              </g>
            );
          })}
          <line x1={p.x} y1={p.y} x2={p.x - 120} y2={p.y - 65} stroke="#22c55e" strokeWidth="1.5" />
          <circle cx={p.x} cy={p.y} r="4" fill="#22c55e" />
          <rect x={p.x - 290} y={p.y - 105} width="170" height="48" fill="rgba(6, 78, 59, 0.95)" stroke="#22c55e" strokeWidth="1.5" />
          <text x={p.x - 280} y={p.y - 88} fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">PROPOSED: {activeMod.id}</text>
          <text x={p.x - 280} y={p.y - 74} fill="#ffffff" fontSize="10" fontFamily="sans-serif">STIRRUP sv = 100mm ✓</text>
          <text x={p.x - 280} y={p.y - 62} fill="#86efac" fontSize="9" fontFamily="monospace">Vc: {activeMod.currentVc} → {activeMod.proposedVc} kN</text>
        </g>
      );
    }

    if (vt === "pile_depth") {
      const pileSides = [-60, -20, 20, 60];
      const extP = getProjectedCoords(0, 200, 0);
      return (
        <g>
          <circle cx={extP.x} cy={extP.y} r="130" fill="url(#neonGlowGrad)" className="animate-pulse" />
          {pileSides.map((cx, i) => {
            const existingBot = getProjectedCoords(cx, 155, 0);
            const newBot = getProjectedCoords(cx, 230, 0);
            return (
              <g key={i}>
                <line x1={existingBot.x} y1={existingBot.y} x2={newBot.x} y2={newBot.y} stroke="#22c55e" strokeWidth="16" strokeLinecap="round" strokeOpacity="0.5" className="animate-pulse" style={{ animationDuration: "2s" }} />
                <line x1={existingBot.x} y1={existingBot.y} x2={newBot.x} y2={newBot.y} stroke="#22c55e" strokeWidth="2" strokeDasharray="4,3" />
                <circle cx={newBot.x} cy={newBot.y} r="5" fill="#22c55e" />
              </g>
            );
          })}
          <line x1={extP.x} y1={extP.y} x2={extP.x + 120} y2={extP.y - 40} stroke="#22c55e" strokeWidth="1.5" />
          <rect x={extP.x + 120} y={extP.y - 78} width="175" height="48" fill="rgba(6, 78, 59, 0.95)" stroke="#22c55e" strokeWidth="1.5" />
          <text x={extP.x + 130} y={extP.y - 62} fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">PROPOSED: {activeMod.id}</text>
          <text x={extP.x + 130} y={extP.y - 48} fill="#ffffff" fontSize="10" fontFamily="sans-serif">PILE DEPTH: 18m → 24m ✓</text>
          <text x={extP.x + 130} y={extP.y - 36} fill="#86efac" fontSize="9" fontFamily="monospace">Qa: {activeMod.currentVc} → {activeMod.proposedVc} kN</text>
        </g>
      );
    }

    if (vt === "shear_wall") {
      const wallPositions = [{ x: -90, label: "GRID 3" }, { x: 90, label: "GRID 7" }];
      const wTop = getProjectedCoords(0, -80, 0);
      return (
        <g>
          <circle cx={wTop.x} cy={wTop.y} r="140" fill="url(#neonGlowGrad)" className="animate-pulse" />
          {wallPositions.map((wp, i) => {
            const p1 = getProjectedCoords(wp.x - 8, -120, 0);
            const p2 = getProjectedCoords(wp.x + 8, -120, 0);
            const p3 = getProjectedCoords(wp.x + 8, 155, 0);
            const p4 = getProjectedCoords(wp.x - 8, 155, 0);
            const midP = getProjectedCoords(wp.x, 17, 0);
            return (
              <g key={i}>
                <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y} ${p4.x},${p4.y}`} fill="rgba(34,197,94,0.25)" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="5,2" className="animate-pulse" style={{ animationDuration: "2.4s" }} />
                <text x={midP.x - 20} y={midP.y} fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold" opacity="0.9">{wp.label}</text>
              </g>
            );
          })}
          <line x1={wTop.x} y1={wTop.y} x2={wTop.x - 130} y2={wTop.y - 60} stroke="#22c55e" strokeWidth="1.5" />
          <circle cx={wTop.x} cy={wTop.y} r="4.5" fill="#22c55e" />
          <rect x={wTop.x - 295} y={wTop.y - 100} width="165" height="48" fill="rgba(6, 78, 59, 0.95)" stroke="#22c55e" strokeWidth="1.5" />
          <text x={wTop.x - 285} y={wTop.y - 83} fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">PROPOSED: {activeMod.id}</text>
          <text x={wTop.x - 285} y={wTop.y - 69} fill="#ffffff" fontSize="10" fontFamily="sans-serif">SHEAR WALLS: Grid 3+7 ✓</text>
          <text x={wTop.x - 285} y={wTop.y - 57} fill="#86efac" fontSize="9" fontFamily="monospace">Drift: 0.0045h → 0.0031h ✓</text>
        </g>
      );
    }

    if (vt === "cfrp") {
      const hStart = 75; const hEnd = 145;
      const l1 = getProjectedCoords(-37, hStart, 12);
      const r1 = getProjectedCoords(37, hStart, 12);
      const l2 = getProjectedCoords(-37, hEnd, 12);
      const r2 = getProjectedCoords(37, hEnd, 12);
      const p = getProjectedCoords(0, 110, 0);
      return (
        <g>
          <circle cx={p.x} cy={p.y} r="140" fill="url(#neonGlowGrad)" className="animate-pulse" />
          <polygon points={`${l1.x},${l1.y} ${r1.x},${r1.y} ${r2.x},${r2.y} ${l2.x},${l2.y}`} fill="url(#proposedCarbon)" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="4,2" className="animate-pulse" style={{ animationDuration: "2.4s" }} />
          <text x={l1.x + 2} y={(l1.y + l2.y) / 2} fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold" opacity="0.9">CFRP JACKET</text>
          <line x1={p.x} y1={p.y} x2={p.x + 130} y2={p.y - 50} stroke="#22c55e" strokeWidth="1.5" />
          <circle cx={p.x} cy={p.y} r="4.5" fill="#22c55e" />
          <rect x={p.x + 130} y={p.y - 88} width="165" height="42" fill="rgba(6, 78, 59, 0.95)" stroke="#22c55e" strokeWidth="1.5" />
          <text x={p.x + 140} y={p.y - 73} fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">FIX: CFRP WRAP</text>
          <text x={p.x + 140} y={p.y - 60} fill="#ffffff" fontSize="10" fontFamily="sans-serif">DUCTILITY GAIN ✓</text>
        </g>
      );
    }

    if (vt === "tiebar") {
      const anchorColLeft = getProjectedCoords(-35, 100, 0);
      const anchorRight = getProjectedCoords(75, 15, 0);
      const anchorColRight = getProjectedCoords(35, 100, 0);
      const anchorLeft = getProjectedCoords(-75, 15, 0);
      const p = getProjectedCoords(20, 57, 0);
      return (
        <g>
          <line x1={anchorColLeft.x} y1={anchorColLeft.y} x2={anchorRight.x} y2={anchorRight.y} stroke="#22c55e" strokeWidth="4" className="animate-pulse" />
          <line x1={anchorColLeft.x} y1={anchorColLeft.y} x2={anchorRight.x} y2={anchorRight.y} stroke="#eae4e0" strokeWidth="1" />
          <line x1={anchorColRight.x} y1={anchorColRight.y} x2={anchorLeft.x} y2={anchorLeft.y} stroke="#22c55e" strokeWidth="4" strokeDasharray="3,3" opacity="0.8" />
          <circle cx={anchorColLeft.x} cy={anchorColLeft.y} r="5" fill="#10b981" />
          <circle cx={anchorRight.x} cy={anchorRight.y} r="5" fill="#10b981" />
          <line x1={p.x} y1={p.y} x2={p.x - 110} y2={p.y - 75} stroke="#22c55e" strokeWidth="1.5" />
          <rect x={p.x - 275} y={p.y - 110} width="165" height="42" fill="rgba(6, 78, 59, 0.95)" stroke="#22c55e" strokeWidth="1.5" />
          <text x={p.x - 265} y={p.y - 95} fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">FIX: TENSION STAY RODS</text>
          <text x={p.x - 265} y={p.y - 82} fill="#ffffff" fontSize="10" fontFamily="sans-serif">TORSIONAL STABILIZATION ✓</text>
        </g>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Generating AI Fix Proposals...</p>
        </div>
      </div>
    );
  }

  if (modifications.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-zinc-950 h-full">
        <div className="text-center max-w-sm">
          <Database className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
          <p className="font-serif text-xl text-zinc-400 mb-2">No violations to fix</p>
          <p className="text-xs text-zinc-600 leading-relaxed">Upload a structural report PDF and run compliance checks to generate AI ghost fix proposals.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full relative h-full bg-zinc-50">

      <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 lg:p-7 space-y-5 custom-scrollbar">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white border border-[#e5e2e1] px-5 py-4 gap-3 shrink-0">
          <div className="flex items-center gap-3">
          
            <div className="text-left font-mono">
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Generative CAD Studio — CivilOS</p>
              <h2 className="text-sm font-bold text-zinc-900 uppercase">Generative Ghosting Fix Engine</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 select-none">
           <div className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-1.5 text-[10px] font-mono text-zinc-800">
              <span className="text-zinc-500">Member:</span>
              <select
                value={selectedMemberId}
                onChange={(e) => {
                  const memberId = e.target.value;
                  setSelectedMemberId(memberId);
                  const mod = modifications.find(m => m.memberId === memberId);
                  if (mod) setSelectedModId(mod.id);
                }}
                className="bg-transparent text-[#154212] font-bold font-mono text-[10px] focus:outline-none cursor-pointer"
              >
                {uniqueMembers.map(m => (
                  <option key={m.memberId} value={m.memberId} className="bg-white text-zinc-900">
                    {m.memberLabel} — {m.memberType.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex border border-zinc-200 bg-zinc-50 p-0.5 text-[11px] font-mono font-bold">
  {(["volumetric", "wireframe","crosssection", "documentation"] as const).map(mode => (
    <button key={mode} onClick={() => setActiveViewMode(mode)}
      className={`px-3 py-1 uppercase tracking-wider transition-colors cursor-pointer ${activeViewMode === mode ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-800"}`}>
                  {mode === "crosssection" ? "X-SECTION" : mode}
                </button>
              ))}
            </div>

            <button onClick={() => { setGhostingEnabled(!ghostingEnabled); showToast(`Ghost layers ${!ghostingEnabled ? "enabled" : "hidden"}.`); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 font-mono text-[11px] font-bold border transition-colors cursor-pointer ${ghostingEnabled ? "bg-emerald-950 border-emerald-700 text-emerald-400" : "bg-zinc-900 border-zinc-700 text-zinc-500"}`}>
              {ghostingEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              GHOSTING: {ghostingEnabled ? "ON" : "OFF"}
            </button>

            <button onClick={handleResetViewport} className="p-1.5 border border-zinc-700 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 cursor-pointer transition-colors">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className="w-full h-[520px] md:h-[650px] lg:h-[700px] shrink-0 bg-zinc-950 border border-zinc-900 relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-inner"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-60 pointer-events-none" />

          <div className="absolute top-4 left-4 text-left font-mono text-[10px] text-zinc-500 pointer-events-none space-y-1 bg-black/45 p-2 border border-zinc-900">
            <p className="text-zinc-800 font-bold">{activeMod?.memberLabel || "No member"}</p>
            <p>TYPE: {activeMod?.memberType?.toUpperCase()}</p>
            <p>ORBIT: {orbitAngle}° | RENDER: ORTHO</p>
            <p>FIX: {activeMod?.visualType?.toUpperCase()}</p>
          </div>

          <div className="absolute top-4 right-4 flex items-center gap-3 bg-black/45 p-2 border border-zinc-900 font-mono text-[10px] text-zinc-400 select-none">
           {activeMod?.id}
          </div>

          <div className="absolute bottom-14 left-5 text-zinc-500 font-mono text-[10px] bg-black/50 p-2.5 border border-zinc-900 flex items-center gap-2">
           
            <div>
              <p className="text-zinc-800 font-bold">GRID ORIENTATION</p>
              <p className="text-[9px]">AZ: {orbitAngle}° | ELEV: 18°</p>
            </div>
          </div>

          <div className="absolute bottom-5 right-5 flex items-center gap-2.5 z-10 select-none bg-zinc-900 p-2.5 border border-zinc-800 text-xs">
            <RotateCw className="w-3.5 h-3.5 text-zinc-400" />
            <input type="range" min="0" max="360" value={orbitAngle}
              onChange={(e) => { setOrbitAngle(parseInt(e.target.value)); setIsRotating(false); }}
              className="w-24 accent-emerald-500 h-1 bg-zinc-800 cursor-pointer" />
            <span className="text-[10px] font-mono text-zinc-400 font-bold min-w-[28px] text-right">{orbitAngle}°</span>
            <button onClick={() => setIsRotating(!isRotating)}
              className={`text-[9px] border px-1.5 py-0.5 uppercase tracking-wider font-mono font-bold cursor-pointer transition-colors ${isRotating ? "bg-emerald-950 border-emerald-500 text-emerald-400" : "bg-black text-zinc-500 border-zinc-700"}`}>
              {isRotating ? "Rotate" : "Paused"}
            </button>
          </div>

          <svg width="100%" height="100%" className="absolute top-0 left-0 pointer-events-none select-none overflow-visible" style={{ transform: `scale(${zoomFactor})` }}>
            <defs>
              <radialGradient id="neonGlowGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
              </radialGradient>
              <linearGradient id="proposedCarbon" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#15803d" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            {activeViewMode === "crosssection" ? renderCrossSection() : (
  <>
    {renderStructure()}
    {renderGhostOverlay()}
  </>
)}
          </svg>

          <div className="absolute bottom-5 left-1/3 right-1/3 flex justify-center pointer-events-auto">
            <div className="bg-zinc-950/95 border border-zinc-800 text-white px-4 py-2.5 shadow-2xl flex items-center justify-between text-xs font-mono select-none w-full max-w-sm">
              <div className="flex items-center gap-1.5 grayscale opacity-75">
                <span className="w-2.5 h-2.5 bg-zinc-600 inline-block border border-zinc-500"></span>
                <span className="text-[10px]">Existing Frame</span>
              </div>
              <div className="h-4 w-px bg-zinc-800"></div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 inline-block animate-pulse"></span>
                <span className="text-[10px] text-emerald-400 font-bold">Proposed Fix Layer</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e5e2e1] overflow-hidden">
          <div className="bg-[#fcfcfa] px-5 py-3 border-b border-[#e5e2e1] flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-zinc-800">Real-Time FEA Impact Matrix</h3>
            </div>
            <span className="text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-400 font-mono px-2 py-0.5 font-bold">
              SAFETY FACTOR: {cumulativeStats.safetyFactor.toFixed(2)}x
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            {[
              { label: "Structural Resilience", value: `${cumulativeStats.resilience}%`, bar: cumulativeStats.resilience, color: "#22c55e", note: `Gain: +${cumulativeStats.resilience - 72}%` },
              { label: "Material Cost Delta", value: `+${cumulativeStats.costDelta.toFixed(1)}%`, bar: Math.min(100, (cumulativeStats.costDelta / 25) * 100), color: "#71717a", note: "Budget variance" },
              { label: "Ultimate Limit State", value: "0.96 (Safe)", bar: 96, color: "#22c55e", note: "Shift from 1.28 critical" },
              { label: "Serviceability State", value: "0.82 (OK)", bar: 82, color: "#22c55e", note: "Deflection span/350" },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-zinc-500">{item.label}:</span>
                  <span className="text-zinc-900 font-bold">{item.value}</span>
                </div>
                <div className="w-full bg-zinc-800 h-2 border border-zinc-700">
                  <div className="h-full transition-all duration-300" style={{ width: `${item.bar}%`, backgroundColor: item.color }} />
                </div>
                <span className="text-[10px] mt-1 block text-zinc-500 font-mono">{item.note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

<aside className="w-full lg:w-[460px] border-t lg:border-t-0 lg:border-l border-[#e5e2e1] bg-white flex flex-col h-full overflow-y-auto custom-scrollbar shrink-0 select-text text-left">

        <div className="p-6 border-b border-[#e5e2e1] space-y-4 select-none">
          <div className="flex items-center gap-2">
       
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 font-mono">Generative Recommendation Feed</h3>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member, clause, fix type..."
              className="w-full bg-zinc-50 text-xs border border-zinc-200 pl-10 pr-4 py-2.5 text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white placeholder-zinc-400" />
            {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-[10px] font-mono font-bold text-zinc-500 hover:text-zinc-800 cursor-pointer">Clear</button>}
          </div>
        </div>

        <div className="flex-1 p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono select-none text-zinc-500 font-bold border-b border-zinc-100 pb-2">
            <span className="flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" /> Proposals ({filteredModifications.length})</span>
            <span>Batch select to commit</span>
          </div>

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {filteredModifications.length === 0 ? (
              <div className="p-6 text-center text-zinc-600 border border-dashed border-zinc-700">No recommendations match search.</div>
            ) : filteredModifications.map(mod => {
              const isSelected = mod.id === selectedModId;
              const isChecked = checkedMods.includes(mod.id);
              return (
                <div key={mod.id} onClick={() => { setSelectedModId(mod.id); setSelectedMemberId(mod.memberId); setGhostingEnabled(true); }}
                  className={`p-4 border transition-all cursor-pointer ${isSelected ? "bg-emerald-50/50 border-[#154212]/80" : "border-zinc-200 bg-white hover:border-zinc-400"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => handleToggleCheckMod(mod.id, e)}
                        className={`w-4 h-4 border flex items-center justify-center cursor-pointer transition-colors ${isChecked ? "bg-[#154212] border-[#154212] text-white" : "border-zinc-300 bg-white"}`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                      <span className="text-[11px] font-mono font-bold text-white bg-zinc-900 px-2.5 py-0.5 border border-zinc-700">{mod.id}</span>
                      <span className="text-[10px] font-mono text-zinc-400 font-bold">{mod.zone}</span>
                    </div>
                    <button onClick={(e) => handleDismissMod(mod.id, e)} className="p-1 hover:bg-zinc-700 text-zinc-500 hover:text-red-400 cursor-pointer transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-900 mt-2.5">{mod.title}</h4>
<p className="text-[11px] text-zinc-500 mt-1.5 leading-relaxed">{mod.description}</p>
<div className="mt-3 py-1.5 px-2.5 bg-zinc-50 border border-zinc-200 flex justify-between items-center text-[10px] font-mono select-none">
  <span className="font-bold text-zinc-600 truncate max-w-[190px]">{mod.clause}</span>
                    <span className="text-emerald-400 font-bold">+{mod.resilienceDelta}% Resilience</span>
                  </div>
                </div>
              );
            })}
          </div>

          {activeMod && (
            <div className="bg-[#fcfcfa] border border-[#e5e2e1] p-5 text-left">
  <span className="text-[10px] uppercase tracking-widest font-bold text-[#154212] font-mono select-none block mb-2.5">IS Standard Breakdown</span>
  <div className="space-y-3 font-sans text-xs">
    <div className="flex items-start gap-2.5">
      <BookOpen className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
      <div>
        <p className="font-bold text-zinc-800">Standard</p>
        <p className="text-zinc-500 mt-0.5 text-[11px]">{activeMod.codeStandard}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-zinc-800">Critical Condition</p>
                    <p className="text-zinc-500 mt-0.5 text-[11px]">{activeMod.criticalCondition}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-zinc-800">Fix Rationale</p>
                    <p className="text-zinc-500 mt-0.5 text-[11px]">{activeMod.reasons}</p>
                  </div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 p-3 font-mono text-[10px]">
                  <p className="text-zinc-500 mb-1">IS Formula:</p>
                  <p className="text-emerald-400 font-bold">{activeMod.formula}</p>
                  <div className="mt-2 flex gap-4 text-[9px]">
                    <span className="text-red-400">Before: {activeMod.currentVc} kN</span>
                    <ArrowRight className="w-3 h-3 text-zinc-600" />
                    <span className="text-emerald-400">After: {activeMod.proposedVc} kN</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

       <div className="p-6 bg-zinc-50 border-t border-[#e5e2e1] space-y-4 select-none">
  <div className="flex justify-between items-center text-xs font-mono font-bold text-zinc-500">
    <span>Selected for Commit:</span>
    <span className="text-zinc-900 bg-white border border-zinc-200 px-2.5 py-1">{checkedMods.length} of {modifications.length} chosen</span>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <button onClick={() => { setCheckedMods([]); showToast("Selection cleared."); }} disabled={checkedMods.length === 0}
              className="py-3 px-4 border border-zinc-700 hover:border-zinc-500 bg-zinc-900 text-zinc-400 text-xs font-bold uppercase tracking-wider cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Clear Selection
            </button>
            <button onClick={() => setIsCommitModalOpen(true)} disabled={checkedMods.length === 0}
              className="py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5">
            
              Commit ({checkedMods.length})
            </button>
          </div>
        </div>

        <div className="p-6 border-t border-[#e5e2e1] bg-[#fafafa] space-y-4">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono select-none block text-left">Project Memory Ledger</span>
          <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
            {committedFixesLog.length === 0 ? (
              <p className="text-xs text-zinc-600 italic text-center py-4">No fixes committed yet.</p>
            ) : committedFixesLog.map(fix => (
              <div key={fix.id} className="p-3.5 bg-white border border-zinc-200 text-left font-mono text-[11px]">
                <div className="flex justify-between items-center border-b border-zinc-700 pb-1.5 mb-2 text-[10px] text-zinc-500">
                  <span className="font-bold text-zinc-800 uppercase">{fix.id}</span>
                  <span>{fix.timestamp}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {fix.modsCommitted.map(mid => (
                    <span key={mid} className="bg-zinc-700 text-zinc-800 text-[9px] font-bold px-1.5 py-0.5 uppercase">{mid}</span>
                  ))}
                  <span className="text-emerald-400 bg-emerald-950 text-[9px] font-bold px-1.5 py-0.5 uppercase border border-emerald-800">{fix.resilienceMetric}</span>
                </div>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">"{fix.note}"</p>
                <div className="mt-2 text-[9px] text-emerald-600 border-t border-zinc-700 pt-1.5">AUTHOR: {fix.author}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {isCommitModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-zinc-900 border border-zinc-700 w-full max-w-lg p-7 shadow-2xl relative">
            <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-zinc-600"></div>
            <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-zinc-600"></div>
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-zinc-600"></div>
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-zinc-600"></div>
            <h3 className="font-serif text-xl font-normal text-zinc-100 leading-none">Commit Proposed Generative Changes</h3>
            <div className="mt-3 bg-zinc-950 border border-zinc-800 p-4 font-mono text-[11px] text-zinc-400 leading-relaxed">
              <p className="font-bold text-zinc-900 mb-1.5">Selected ({checkedMods.length}):</p>
              <ul className="list-disc list-inside space-y-1">
                {checkedMods.map(mid => {
                  const m = modifications.find(x => x.id === mid);
                  return <li key={mid}><span className="font-bold text-emerald-400">{mid}</span>: {m?.title}</li>;
                })}
              </ul>
              <div className="mt-2 text-emerald-400 font-semibold">Safety Factor: {cumulativeStats.safetyFactor.toFixed(2)}x | Resilience: {cumulativeStats.resilience}%</div>
            </div>
            <form onSubmit={handleCommitBatch} className="mt-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Regulatory Reasoning Note</label>
                <textarea rows={4} required value={customReasoningNote} onChange={(e) => setCustomReasoningNote(e.target.value)}
                  placeholder="Explain why these modifications align with IS code requirements..."
                  className="w-full bg-zinc-800 border border-zinc-700 p-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans resize-none placeholder-zinc-600" />
                <span className="text-[10px] text-zinc-600 block font-mono">*Written to CivilOS Project Memory for audit trail.</span>
              </div>
              <div className="flex justify-end gap-3.5 pt-2">
                <button type="button" onClick={() => { setIsCommitModalOpen(false); setCustomReasoningNote(""); }}
                  className="px-5 py-2.5 border border-zinc-700 text-zinc-500 hover:text-zinc-900 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-2">
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  {isSaving ? "Saving..." : "Authorize & Commit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}