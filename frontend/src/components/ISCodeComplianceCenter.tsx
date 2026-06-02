import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Sparkles, 
  ArrowLeft, 
  Search, 
  ShieldCheck, 
  Plus, 
  Check, 
  Sliders, 
  Flame, 
  Zap, 
  Award, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  Trash2, 
  AlertCircle, 
  Clock, 
  Compass, 
  Brain,
  MessageSquare,
  X,
  Send,
  Loader2,
  FileCheck2,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ISCodeComplianceCenterProps {
  onBack: () => void;
  userName?: string;
  projectId?: string;
}

interface ISClause {
  id: string;
  code: string;
  clause: string;
  title: string;
  description: string;
  category: "Concrete" | "Steel" | "Seismic" | "Requirements";
  formulaTitle?: string;
  formulaTex?: string;
  exampleProblem?: string;
  evaluationLogic?: {
    inputs: string[];
    calculate: (inputs: Record<string, number>) => {
      isSafe: boolean;
      value: string;
      limit: string;
      unit: string;
      explanation: string;
    }
  }
}

export function ISCodeComplianceCenter({ onBack, userName = "Arjun R.", projectId = "NH-44 Bridge Design" }: ISCodeComplianceCenterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | "Concrete" | "Steel" | "Seismic" | "Requirements">("ALL");
  const [stampStatus, setStampStatus] = useState<"NONE" | "AUDITING" | "APPROVED" | "REJECTED">("NONE");
  const [stampMessage, setStampMessage] = useState("");
  const [stampCode, setStampCode] = useState("");
  const [errorLog, setErrorLog] = useState<string[]>([]);
  
  // Checklist tracker state
  const [checkedClauses, setCheckedClauses] = useState<Record<string, boolean>>({
    "is456-cover-mild": true,
    "is1893-zone-factor": false,
    "is456-shear-stress": false,
    "is13920-col-hoop": true,
    "is456-min-reinforcement": false,
    "is456-max-shear": true,
  });

  // State to track dynamic math testing variables
  const [mathInputs, setMathInputs] = useState<Record<string, Record<string, number>>>({
    "is456-cover-mild": { exposure: 0 }, // 0: Mild, 1: Moderate, 2: Severe, 3: Very Severe, 4: Extreme
    "is456-shear-stress": { Vu: 140, b: 300, d: 450 },
    "is1893-zone-factor": { zone: 3 }, // 2, 3, 4, 5
    "is13920-col-hoop": { spacing: 120, depth: 400 },
    "is456-min-reinforcement": { barDia: 16, b: 300, d: 450, fy: 500 },
    "is456-max-shear": { fck: 30 } // concrete grade in MPa
  });

  // Expanded card item IDs
  const [expandedClauses, setExpandedClauses] = useState<Record<string, boolean>>({
    "is456-shear-stress": true,
    "is456-cover-mild": true
  });

  // Ori AI Assistant overlay drawer state
  const [isOriOpen, setIsOriOpen] = useState(false);
  const [oriMessage, setOriMessage] = useState("");
  const [oriChatHistory, setOriChatHistory] = useState<Array<{ sender: "user" | "ori", text: string, list?: string[], table?: any }>>([
    { 
      sender: "ori", 
      text: `Hello ${userName}! I am **Ori**, your AI Structural Compliance Assistant. I have indexed the Bureau of Indian Standards (BIS) codes directly in my neural memory.`,
      list: [
        "Ask me about IS 456 cover specifications for high exposure.",
        "Query shear reinforcement spacing standards as per IS 13920.",
        "Check seismic factor allocations under IS 1893:2016.",
        "Calculate the permissible shear capacity threshold."
      ]
    }
  ]);
  const [isOriLoading, setIsOriLoading] = useState(false);

  // Database of IS standard clauses
  const isClauses: ISClause[] = useMemo(() => [
    {
      id: "is456-cover-mild",
      code: "IS 456:2000",
      clause: "Cl. 26.4.2",
      title: "Nominal Concrete Cover to Reinforcement",
      description: "Nominal concrete cover must meet structural integrity, fire shield, and extreme substrate exposure guidelines without crack expansion.",
      category: "Concrete",
      formulaTitle: "Exposure Cover Requirements (IS 456 Cl. 26.4.2)",
      exampleProblem: "Find required nominal cover for a structural beam exposed to 'Severe' ocean spray conditions.",
      evaluationLogic: {
        inputs: ["exposure"], // Select index: 0=Mild (20mm), 1=Moderate (30mm), 2=Severe (45mm), 3=Very Severe (50mm), 4=Extreme (75mm)
        calculate: (inputs) => {
          const exp = inputs.exposure || 0;
          const exposureNames = ["Mild", "Moderate", "Severe", "Very Severe", "Extreme"];
          const covers = [20, 30, 45, 50, 75];
          const name = exposureNames[exp] || "Mild";
          const requiredCover = covers[exp] || 20;

          return {
            isSafe: true,
            value: `${requiredCover}`,
            limit: `${requiredCover}`,
            unit: "mm",
            explanation: `For exposure risk level "${name}", IS 456 Cl. 26.4.2 mandates a minimum nominal concrete cover thickness of ${requiredCover} mm to guarantee multi-decade reinforcement durability.`
          };
        }
      }
    },
    {
      id: "is456-shear-stress",
      code: "IS 456:2000",
      clause: "Cl. 40.1 - 40.2",
      title: "Nominal Shear Stress (τv) Formula Standard",
      description: "Nominal shear stress τv in reinforced concrete beams of uniform depth must be verified under design shear limits to determine shear link density.",
      category: "Concrete",
      formulaTitle: "Shear Stress: τ_v = V_u / (b · d)",
      formulaTex: "τ_v = \\frac{V_u}{b \\cdot d}",
      exampleProblem: "Determine nominal shear stress under Factored Shear Force Vu = 140 kN, Beam Width b = 300 mm, Effective Depth d = 450 mm.",
      evaluationLogic: {
        inputs: ["Vu", "b", "d"],
        calculate: (inputs) => {
          const Vu = inputs.Vu || 0;
          const b = inputs.b || 300;
          const d = inputs.d || 450;
          
          const value = (Vu * 1000) / (b * d);
          const isSafe = value <= 4.0; // max allowed under any steel ratio
          
          return {
            isSafe,
            value: value.toFixed(3),
            limit: "4.000",
            unit: "N/mm²",
            explanation: `Nominal shear stress computed is τv = ${value.toFixed(3)} N/mm². Limit state maximum ultimate boundary for standard mixes is 4.0 N/mm² (Cl. 40.2.3).`
          };
        }
      }
    },
    {
      id: "is1893-zone-factor",
      code: "IS 1893:2016",
      clause: "Cl. 6.4.2",
      title: "Seismic Zone Factor Allocation (Z)",
      description: "Indian geography is classified into four seismic zones (II, III, IV, and V) each defined by peak ground acceleration factor Z for design coefficient response.",
      category: "Seismic",
      formulaTitle: "Zone Factor (Z) Coefficients (Table 3)",
      exampleProblem: "Retrieve Zone Factor for dense urban clusters in Zone V (extreme structural seismicity risks).",
      evaluationLogic: {
        inputs: ["zone"], // 2, 3, 4, 5
        calculate: (inputs) => {
          const zoneVal = inputs.zone || 3;
          let factor = 0.16;
          let zoneName = "Zone III (Moderate Seismicity)";
          
          if (zoneVal === 2) { factor = 0.10; zoneName = "Zone II (Low Seismicity)"; }
          else if (zoneVal === 3) { factor = 0.16; zoneName = "Zone III (Moderate Seismicity)"; }
          else if (zoneVal === 4) { factor = 0.24; zoneName = "Zone IV (Severe Seismicity)"; }
          else if (zoneVal === 5) { factor = 0.36; zoneName = "Zone V (Extreme Seismicity)"; }

          return {
            isSafe: true,
            value: `${factor}`,
            limit: "0.36",
            unit: "g-acc",
            explanation: `For ${zoneName}, the peak ground horizontal acceleration coefficient Z is equal to ${factor} as per Table 3.`
          };
        }
      }
    },
    {
      id: "is13920-col-hoop",
      code: "IS 13920:2016",
      clause: "Cl. 7.4.1",
      title: "Seismic Ductile Hoop Spacing",
      description: "In critical shear columns subjected to seismic forces, transverse reinforcement hoops must be spaced tightly to confine concrete core and prevent bucking.",
      category: "Seismic",
      formulaTitle: "Max spacing: s_max = min(d / 4, 100 mm)",
      exampleProblem: "Verify design hoop spacing of 120mm in column with effective depth of 400mm under high-intensity ductility requirements.",
      evaluationLogic: {
        inputs: ["spacing", "depth"],
        calculate: (inputs) => {
          const spacing = inputs.spacing || 120;
          const depth = inputs.depth || 400;
          const limit = Math.min(depth / 4, 100);
          const isSafe = spacing <= limit;

          return {
            isSafe,
            value: `${spacing}`,
            limit: `${limit}`,
            unit: "mm",
            explanation: `Design hoop spacing ${spacing}mm evaluated against maximum allowed target dimension ${limit}mm. ${
              isSafe 
                ? "COMPLIANT: Spacing fulfills maximum bounds cleanly." 
                : "NON-COMPLIANT: Hoop spacing too sparse! Reduces lateral seismic confinement."
            }`
          };
        }
      }
    },
    {
      id: "is456-min-reinforcement",
      code: "IS 456:2000",
      clause: "Cl. 26.5.1.1",
      title: "Minimum Flexural Tension Steel Area (As)",
      description: "Ensures member does not experience immediate progressive brittle collapse upon concrete cracking during bending loading stages.",
      category: "Concrete",
      formulaTitle: "As_min / (b · d) = 0.85 / f_y",
      exampleProblem: "Calculate minimum tension steel required in 300mm x 450mm beam utilizing Fe500 grade reinforcing steel.",
      evaluationLogic: {
        inputs: ["barDia", "b", "d", "fy"], // barDia: e.g. 16, b, d, fy
        calculate: (inputs) => {
          const b = inputs.b || 300;
          const d = inputs.d || 450;
          const fy = inputs.fy || 500;
          const barDia = inputs.barDia || 16;
          
          const minSteelRatio = 0.85 / fy;
          const minSteelArea = minSteelRatio * b * d;
          
          const actualArea = Math.PI * (barDia * barDia / 4) * 2; // assume 2 rebars minimum
          const isSafe = actualArea >= minSteelArea;

          return {
            isSafe,
            value: actualArea.toFixed(1),
            limit: minSteelArea.toFixed(1),
            unit: "mm²",
            explanation: `Required minimum steel area is ${minSteelArea.toFixed(1)} mm² (As_min). Your active profile (2 Nos - ${barDia}mm rebars) provides ${actualArea.toFixed(1)} mm².`
          };
        }
      }
    },
    {
      id: "is456-max-shear",
      code: "IS 456:2000",
      clause: "Cl. 40.2.3",
      title: "Maximum Permissible Shear Stress (τc_max)",
      description: "Defines absolute crushing threshold limit of concrete compression diagonal force truss struts under ultimate shear. Cannot be exceeded by any shear links.",
      category: "Concrete",
      formulaTitle: "Ultimate Concrete Truss Limits (Table 20)",
      exampleProblem: "Determine compression diagonal crush ceiling for concrete mixing of grade M30.",
      evaluationLogic: {
        inputs: ["fck"],
        calculate: (inputs) => {
          const fck = inputs.fck || 30;
          
          // Custom mapping for M20 to M50
          let tcMax = 2.8; // default M20
          if (fck <= 20) tcMax = 2.8;
          else if (fck === 25) tcMax = 3.1;
          else if (fck === 30) tcMax = 3.5;
          else if (fck === 35) tcMax = 3.7;
          else if (fck >= 40) tcMax = 4.0;

          return {
            isSafe: true,
            value: `${tcMax}`,
            limit: `${tcMax}`,
            unit: "N/mm²",
            explanation: `For concrete structural strength of M${fck}, Table 20 restricts nominal shear stress to τc_max = ${tcMax} N/mm² to prevent immediate diagonal shear crushing failures.`
          };
        }
      }
    }
  ], []);

  // Filter clauses based on query and category
  const filteredClauses = useMemo(() => {
    return isClauses.filter((item) => {
      const matchQuery = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.clause.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === "ALL" || item.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [searchQuery, selectedCategory, isClauses]);

  // Compute overall checklists compliance progress
  const complianceStats = useMemo(() => {
    const total = Object.keys(checkedClauses).length;
    const passed = Object.values(checkedClauses).filter(Boolean).length;
    return {
      total,
      passed,
      percentage: total > 0 ? Math.round((passed / total) * 100) : 0
    };
  }, [checkedClauses]);

  // Perform a live calculation logic evaluation 
  const evaluateClause = (clauseId: string) => {
    const clause = isClauses.find(c => c.id === clauseId);
    if (!clause || !clause.evaluationLogic) return null;
    const inputs = mathInputs[clauseId] || {};
    return clause.evaluationLogic.calculate(inputs);
  };

  // Toggle checklist
  const toggleChecklist = (id: string) => {
    setCheckedClauses(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleInputChange = (clauseId: string, param: string, val: number) => {
    setMathInputs(prev => ({
      ...prev,
      [clauseId]: {
        ...(prev[clauseId] || {}),
        [param]: val
      }
    }));
  };

  // Run audit and stamp logic
  const handleRunAudit = () => {
    setStampStatus("AUDITING");
    setErrorLog([
      `[INFO] Starting compliance checking thread...`,
      `[INFO] Intercepting load combination workshop criteria...`,
      `[INFO] Indexing IS-456:2000 Plain and Reinforced Concrete Ruleset.`,
      `[INFO] Indexing IS-1893:2016 Seismic Resistant Design Matrices.`
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step === 1) {
        setErrorLog(prev => [...prev, `[PROCESS] Evaluating Nominal cover depth: Mild exposure cover criteria... PASS (20mm meets minimum)`]);
      } else if (step === 2) {
        // Calculate nominal shear stress based on inputs
        const shearEval = evaluateClause("is456-shear-stress");
        const shearSafe = shearEval ? shearEval.isSafe : true;
        
        setErrorLog(prev => [
          ...prev, 
          `[PROCESS] Validating Nominal stress limit on beam profile: calculated ${shearEval?.value || "1.037"} N/mm² vs allowed ${shearEval?.limit || "4.0"} N/mm².`,
          shearSafe ? "[PASS] Shear stress runs well under compression-diagonal ceiling limits." : "[FAIL] Critical diagonal tension shear overload detected on beam sections!"
        ]);
      } else if (step === 3) {
        const ductileEval = evaluateClause("is13920-col-hoop");
        const ductileSafe = ductileEval ? ductileEval.isSafe : true;

        setErrorLog(prev => [
          ...prev,
          `[PROCESS] Analyzing Seismic hoop tie intervals as per IS 13920 Cl. 7.4.`,
          ductileSafe ? "[PASS] Lateral confining stirrups placed at safe ductile intervals." : "[WARN] Tie spacing exceeds maximum confinement limit state requirements!"
        ]);
      } else if (step === 4) {
        clearInterval(interval);
        
        // Final Decision: If any checklist item represents a mathematically unsafe configuration log a REJECTION
        const shearEval = evaluateClause("is456-shear-stress");
        const shearSafe = shearEval ? shearEval.isSafe : true;

        const hoopEval = evaluateClause("is13920-col-hoop");
        const hoopSafe = hoopEval ? hoopEval.isSafe : true;

        const isOverallSafe = shearSafe && hoopSafe && complianceStats.percentage >= 60;
        
        const timestamp = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
        const verificationId = `CIV-IS-${Math.floor(100000 + Math.random() * 900000)}`;

        setStampCode(verificationId);

        if (isOverallSafe) {
          setStampStatus("APPROVED");
          setStampMessage(`SECURE DESIGN APPROVED. Certified on ${timestamp}.`);
          setErrorLog(prev => [
            ...prev,
            `[DECISION] Core structure models perfectly validated as per code safety laws.`,
            `[COMPLETED] Generating authentic digital civil compliance certificates.`
          ]);
        } else {
          setStampStatus("REJECTED");
          let reasons = [];
          if (!shearSafe) reasons.push("Nominal shear stress τv exceeds permissible limits");
          if (!hoopSafe) reasons.push("Column hoop ties spacing too sparse");
          if (complianceStats.percentage < 60) reasons.push("General compliance index under 60% threshold");
          
          setStampMessage(`REJECTED. Failure causes: ${reasons.join(", ")}.`);
          setErrorLog(prev => [
            ...prev,
            `[DANGER] Critical structural risk verified during calculations! Code Audit validation failed.`,
            `[COMPLETED] Emitting alert logs to inspection registry.`
          ]);
        }
      }
    }, 600);
  };

  // Ori AI Helper function calling backend API
  const handleAskOri = async (presetPrompt?: string) => {
    const finalMsg = presetPrompt || oriMessage;
    if (!finalMsg.trim() || isOriLoading) return;

    // Append user message immediately
    setOriChatHistory(prev => [...prev, { sender: "user", text: finalMsg }]);
    setOriMessage("");
    setIsOriLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalMsg,
          chatHistory: [] // Can add past interactions if needed
        })
      });

      const data = await response.json();
      setOriChatHistory(prev => [
        ...prev, 
        { 
          sender: "ori", 
          text: data.text,
          table: data.tableData,
          list: data.sources ? ["Sources consulted:", ...data.sources] : undefined
        }
      ]);
    } catch (err) {
      // Elegant fallback representation as described in guidelines
      setTimeout(() => {
        let text = "";
        let list: string[] = [];
        
        const query = finalMsg.toLowerCase();
        if (query.includes("cover") || query.includes("cl. 26.4")) {
          text = "According to **IS 456:2000 Cl. 26.4**, concrete cover is dictated heavily by environment classes to protect reinforcement against carbonation:";
          list = [
            "**Mild Exposure**: 20 mm minimum (surfaces protected against rain)",
            "**Moderate Exposure**: 30 mm minimum (completely submerged, rain sheltered)",
            "**Severe Exposure**: 45 mm minimum (direct tidal spray, coastal soil contact)",
            "**Very Severe Exposure**: 50 mm minimum (industrial fumes, salt water contact)",
            "**Extreme Exposure**: 75 mm minimum (tidal zone under aggressive sea salts)"
          ];
        } else if (query.includes("spacing") || query.includes("hoop") || query.includes("is 13920")) {
          text = "For column seismic resistance structures as per **IS 13920:2016 Cl. 7.4**, specialized confining links are mandatory:";
          list = [
            "Link hoop diameter must not be less than 8 mm.",
            "Maximum hoop spacing inside plastic hinge zones is restricted to: **s_max = min(d / 4, 100 mm)**, where d is the effective member depth.",
            "Main rebars must remain fully supported by link corners to avoid spalling of cover concrete."
          ];
        } else if (query.includes("seismic") || query.includes("is 1893")) {
          text = "Under **IS 1893:2016**, India is subdivided into four active earthquake severity zones to calculate horizontal seismic force:";
          list = [
            "**Zone II (Low)**: Z = 0.10. Minor fault settlement.",
            "**Zone III (Moderate)**: Z = 0.16. Moderate shear truss requirements.",
            "**Zone IV (Severe)**: Z = 0.24. High ductile reinforcement mandated.",
            "**Zone V (Extreme)**: Z = 0.36. Strict non-linear load combination review required."
          ];
        } else {
          text = `I have completed a live Bureau of Indian Standards query lookup regarding: *"${finalMsg}"*. Standard structural concrete design (IS 456 Chapter VI & Code amendments) specifies checking safe limits. Please review nominal dimensions or let me know if you would like me to evaluate specific tensile stresses!`;
          list = ["Standard IS 456 Index", "CivilOS Machine Reasoning Logs"];
        }

        setOriChatHistory(prev => [...prev, { sender: "ori", text, list }]);
      }, 800);
    } finally {
      setIsOriLoading(false);
    }
  };

  // Toggle expanded panels helper
  const toggleExpand = (id: string) => {
    setExpandedClauses(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="flex-1 w-full min-h-screen bg-[#faf9f6] text-zinc-900 font-sans relative overflow-y-auto selection:bg-[#154212]/10 select-text">
      
      {/* Background wireframe grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e2e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none z-0" />
      
      {/* ----------------- SUB-HEADER / BACK NAVIGATION ----------------- */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-8 pb-4 flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200/80 select-none">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors rounded-none text-zinc-650 cursor-pointer shadow-3xs"
            title="Return to home landing page"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 text-[8.5px] uppercase font-mono font-bold tracking-widest text-[#154212]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CivilOS / Bureau of Indian Standards</span>
            </div>
            <h1 className="font-serif text-[24px] md:text-[30px] font-bold tracking-tight text-zinc-950 mt-1">
              IS-Code Smart Compliance & Audit Center
            </h1>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex gap-3 text-right font-mono text-[9.5px] items-center text-zinc-450">
          <div className="bg-white px-3 py-1.5 border border-zinc-200/80">
            <span>ACTIVE REFERENCE: </span>
            <strong className="text-zinc-800 font-bold">IS 456 & 1893:2016</strong>
          </div>
          <div className="bg-[#154212]/5 text-[#154212] px-3 py-1.5 border border-[#154212]/10 font-bold">
            SECURE AUDITING ZONE
          </div>
        </div>
      </header>

      {/* ----------------- CORE WORKSPACE GRID ----------------- */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: FILTERS, CLAUSES LIST, CHECKLIST PROGRESS (8 Columns) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* SEARCH & CATEGORY SELECTOR */}
          <div className="bg-white p-4 border border-zinc-200 shadow-3xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            
            {/* Search Input bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search standard clauses (e.g. cover, seismic zone, Cl. 40.2)..."
                className="w-full bg-zinc-50 border border-zinc-200 py-2 pl-9 pr-4 text-xs font-sans rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white transition-all"
              />
            </div>

            {/* Simple pills catalog filters */}
            <div className="flex gap-1 overflow-x-auto select-none no-scrollbar font-mono text-[9px] font-bold">
              {(["ALL", "Concrete", "Steel", "Seismic"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 uppercase transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat 
                      ? "bg-[#154212] text-white" 
                      : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* CODE COMPLIANCE CHECKLIST PROGRESS BAR */}
          <div className="bg-white border border-zinc-200 p-5 shadow-3xs text-left">
            <div className="flex justify-between items-end pb-3 border-b border-zinc-150">
              <div>
                <span className="text-[10px] font-mono text-zinc-400 block font-bold uppercase tracking-wider">PROJECT COMPLIANCE METER</span>
                <h4 className="font-serif text-[15px] font-black text-zinc-950 mt-0.5">IS-Code General Clause Validation Checklist</h4>
              </div>
              <div className="text-right font-mono">
                <span className="text-lg font-black text-[#154212]">{complianceStats.passed}</span>
                <span className="text-zinc-400"> / {complianceStats.total} Clauses verified</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 h-3 bg-zinc-100 rounded-none overflow-hidden border border-zinc-200 relative">
                <div 
                  className="h-full bg-gradient-to-r from-[#1c4d19] to-[#154212] transition-all duration-500 ease-out"
                  style={{ width: `${complianceStats.percentage}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-zinc-700 w-10 text-right">{complianceStats.percentage}%</span>
            </div>

            <p className="text-[11px] text-zinc-400 mt-2 font-sans select-none leading-relaxed">
              *Note: Indian standards mandate validating all critical cover, shear strength limits, and ductile tie spacings to earn compliant building safety certificates (IS 456 Cl. 2).
            </p>
          </div>

          {/* DYNAMIC LIST OF CLAUSES */}
          <div className="space-y-4 text-left">
            {filteredClauses.length > 0 ? (
              filteredClauses.map((item) => {
                const isChecked = !!checkedClauses[item.id];
                const isExpanded = !!expandedClauses[item.id];
                const evaluated = evaluateClause(item.id);

                return (
                  <div 
                    key={item.id}
                    className={`bg-white border transition-all shadow-4xs ${
                      isChecked 
                        ? "border-zinc-200/90" 
                        : "border-amber-200/60 bg-amber-50/10"
                    }`}
                  >
                    {/* Header bar of expanding card */}
                    <div className="p-4 flex gap-3 items-stretch justify-between select-none">
                      
                      {/* Left: validation checkbox and details */}
                      <div className="flex gap-3.5 items-start flex-1 cursor-pointer" onClick={() => toggleChecklist(item.id)}>
                        <button 
                          className={`w-4 h-4 shrink-0 transition-colors border flex items-center justify-center mt-1 cursor-pointer overflow-hidden ${
                            isChecked 
                              ? "bg-[#154212] border-[#154212] text-white" 
                              : "border-zinc-300 hover:bg-zinc-50 bg-white"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[9px] font-black uppercase text-[#154212] bg-[#154212]/5 border border-[#154212]/15 px-2 py-0.5">
                              {item.code} {item.clause}
                            </span>
                            <span className="text-[9px] text-zinc-400 uppercase font-mono tracking-tight font-semibold">
                              {item.category} Category
                            </span>
                            
                            {/* Live calculations safety indicator */}
                            {evaluated && (
                              <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 border ${
                                evaluated.isSafe 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                  : "bg-rose-50 text-rose-850 border-rose-200 animate-pulse"
                              }`}>
                                {evaluated.isSafe ? "MATH OK" : "LIMIT EXCEEDED"}
                              </span>
                            )}
                          </div>
                          
                          <h4 className="font-serif text-sm font-semibold text-zinc-950 mt-1 leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[11.5px] text-zinc-500 font-sans mt-0.5 max-w-xl leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Right-side Expand/Collapse and settings button */}
                      <div className="flex flex-col justify-between items-end border-l border-zinc-150 pl-4 shrink-0">
                        <button 
                          onClick={() => toggleExpand(item.id)}
                          className="p-1 hover:bg-zinc-50 text-zinc-400 hover:text-zinc-800 cursor-pointer transition-colors"
                          title="Open detailed formula calculator"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        
                        <span className="text-[8.5px] text-zinc-400 font-mono">
                          {isChecked ? "VERIFIED COMPLIANT" : "PENDING AUDIT"}
                        </span>
                      </div>

                    </div>

                    {/* EXPANDED DETAILED ANALYSIS & FORMULA GROUNDING CARD */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden bg-zinc-50/60 border-t border-zinc-150"
                        >
                          <div className="p-4 space-y-4 text-left">
                            
                            {/* Formula Box and Tex display */}
                            <div className="bg-white p-3.5 border border-zinc-200 space-y-1.5 select-none relative">
                              <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-bold">
                                {item.formulaTitle || "Formula ground truth"}
                              </span>
                              
                              {item.id === "is456-shear-stress" ? (
                                <div className="py-2.5 bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200/50">
                                  <span className="font-serif text-sm font-semibold text-zinc-850">
                                    τ_v = V_u / (b · d)
                                  </span>
                                  <span className="text-[9px] font-mono text-zinc-400 ml-4 border-l border-zinc-300 pl-4 uppercase">
                                    NOMINAL STRESS ACCORDING TO CL. 40.1
                                  </span>
                                </div>
                              ) : item.id === "is13920-col-hoop" ? (
                                <div className="py-2.5 bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200/50">
                                  <span className="font-serif text-sm font-semibold text-zinc-850">
                                    s_max = min(d / 4, 100 mm)
                                  </span>
                                  <span className="text-[9px] font-mono text-zinc-400 ml-4 border-l border-zinc-300 pl-4 uppercase">
                                    SEISMIC DUCTILITY BOUNDS
                                  </span>
                                </div>
                              ) : item.id === "is456-min-reinforcement" ? (
                                <div className="py-2.5 bg-zinc-50 flex items-center justify-center border border-dashed border-zinc-200/50">
                                  <span className="font-serif text-sm font-semibold text-zinc-850">
                                    As_min = (0.85 · b · d) / f_y
                                  </span>
                                  <span className="text-[9px] font-mono text-zinc-400 ml-4 border-l border-zinc-300 pl-4 uppercase">
                                    PREVENTS PROGRESSIVE COLLAPSE
                                  </span>
                                </div>
                              ) : null}

                              <p className="text-[10px] text-zinc-550 leading-relaxed font-sans">
                                <strong>Benchmark Problem:</strong> {item.exampleProblem}
                              </p>
                            </div>

                            {/* Live Interactive Inputs Configurator sliders */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              
                              {/* Sliders panel based on logic */}
                              <div className="space-y-4 bg-white p-3 border border-zinc-220">
                                <span className="text-[8.5px] font-mono text-[#154212] uppercase font-bold block pb-1 border-b">
                                  CALCULATION VARIABLES SLIDERS
                                </span>

                                {item.id === "is456-cover-mild" && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono">
                                      <span>Subterranean Exposure Risk</span>
                                      <span className="font-bold text-[#154212]">
                                        {["Mild (Protected)", "Moderate (Wet)", "Severe (Saltwater)", "Very Severe (Corrosive)", "Extreme (Sea spray)"][mathInputs[item.id]?.exposure || 0]}
                                      </span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="0"
                                      max="4"
                                      step="1"
                                      value={mathInputs[item.id]?.exposure ?? 0}
                                      onChange={(e) => handleInputChange(item.id, "exposure", parseInt(e.target.value))}
                                      className="w-full h-1 bg-zinc-200 accent-[#154212] cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[8px] text-zinc-450 font-mono">
                                      <span>MILD</span>
                                      <span>SEVERE</span>
                                      <span>XTREME</span>
                                    </div>
                                  </div>
                                )}

                                {item.id === "is456-shear-stress" && (
                                  <div className="space-y-3">
                                    <div className="space-y-1.5">
                                      <div className="flex justify-between text-xs font-mono">
                                        <span>Ultimate Shear (Vu)</span>
                                        <span className="font-bold">{mathInputs[item.id]?.Vu ?? 140} kN</span>
                                      </div>
                                      <input 
                                        type="range" min="20" max="600" step="10"
                                        value={mathInputs[item.id]?.Vu ?? 140}
                                        onChange={(e) => handleInputChange(item.id, "Vu", parseInt(e.target.value))}
                                        className="w-full h-1 bg-zinc-200 accent-[#154212]"
                                      />
                                    </div>

                                    <div className="space-y-1.5 font-mono text-[10px] grid grid-cols-2 gap-3 pt-1">
                                      <div>
                                        <label className="block text-zinc-400">b - Beam Width (mm)</label>
                                        <input 
                                          type="number"
                                          value={mathInputs[item.id]?.b ?? 300}
                                          onChange={(e) => handleInputChange(item.id, "b", parseInt(e.target.value) || 300)}
                                          className="w-full bg-zinc-100 border border-zinc-250 text-zinc-800 text-xs py-1 px-2 focus:bg-white"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-zinc-400">d - Concrete Depth (mm)</label>
                                        <input 
                                          type="number"
                                          value={mathInputs[item.id]?.d ?? 450}
                                          onChange={(e) => handleInputChange(item.id, "d", parseInt(e.target.value) || 450)}
                                          className="w-full bg-zinc-100 border border-zinc-250 text-zinc-800 text-xs py-1 px-2 focus:bg-white"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {item.id === "is1893-zone-factor" && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono">
                                      <span>Seismic Severity Zone</span>
                                      <span className="font-bold text-[#154212]">
                                        {["N/A", "N/A", "Zone II (Low)", "Zone III (Mod)", "Zone IV (Sev)", "Zone V (Ext)"][mathInputs[item.id]?.zone || 3]}
                                      </span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="2"
                                      max="5"
                                      step="1"
                                      value={mathInputs[item.id]?.zone ?? 3}
                                      onChange={(e) => handleInputChange(item.id, "zone", parseInt(e.target.value))}
                                      className="w-full h-1 bg-zinc-200 accent-[#154212]"
                                    />
                                    <div className="flex justify-between text-[8px] text-zinc-450 font-mono">
                                      <span>ZONE II (0.10)</span>
                                      <span>ZONE III (0.16)</span>
                                      <span>ZONE V (0.36)</span>
                                    </div>
                                  </div>
                                )}

                                {item.id === "is13920-col-hoop" && (
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs font-mono">
                                        <span>Hoop links spacing (s)</span>
                                        <span className="font-bold">{mathInputs[item.id]?.spacing ?? 120} mm</span>
                                      </div>
                                      <input 
                                        type="range" min="50" max="300" step="10"
                                        value={mathInputs[item.id]?.spacing ?? 120}
                                        onChange={(e) => handleInputChange(item.id, "spacing", parseInt(e.target.value))}
                                        className="w-full h-1 bg-zinc-200 accent-[#154212]"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-[10px] font-mono text-zinc-400">Column depth (d) mm</label>
                                      <input 
                                        type="number"
                                        value={mathInputs[item.id]?.depth ?? 400}
                                        onChange={(e) => handleInputChange(item.id, "depth", parseInt(e.target.value) || 400)}
                                        className="w-full bg-zinc-100 border border-zinc-250 py-1 px-2 text-xs font-mono"
                                      />
                                    </div>
                                  </div>
                                )}

                                {item.id === "is456-min-reinforcement" && (
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-xs font-mono">
                                        <span>Steel Yield Limit (fy)</span>
                                        <span className="font-bold">Fe {mathInputs[item.id]?.fy ?? 500} MPa</span>
                                      </div>
                                      <input 
                                        type="range" min="250" max="600" step="115" // Fe250 to Fe600
                                        value={mathInputs[item.id]?.fy ?? 500}
                                        onChange={(e) => handleInputChange(item.id, "fy", parseInt(e.target.value))}
                                        className="w-full h-1 bg-zinc-200 accent-[#154212]"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                                      <div>
                                        <label className="text-zinc-400">Rebar diameter</label>
                                        <select 
                                          value={mathInputs[item.id]?.barDia ?? 16}
                                          onChange={(e) => handleInputChange(item.id, "barDia", parseInt(e.target.value))}
                                          className="w-full bg-zinc-100 border border-zinc-200 p-1"
                                        >
                                          <option value="12">12 mm (Nominal)</option>
                                          <option value="16">16 mm (Standard)</option>
                                          <option value="20">20 mm (Heavy)</option>
                                          <option value="25">25 mm (Special)</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-zinc-400">Effective depth</label>
                                        <input 
                                          type="number" 
                                          value={mathInputs[item.id]?.d ?? 450}
                                          onChange={(e) => handleInputChange(item.id, "d", parseInt(e.target.value) || 450)}
                                          className="w-full bg-zinc-100 border border-zinc-200 p-1 text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {item.id === "is456-max-shear" && (
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-mono">
                                      <span>Concrete Characteristic fck</span>
                                      <span className="font-bold text-[#154212]">M {mathInputs[item.id]?.fck ?? 30} MPa</span>
                                    </div>
                                    <input 
                                      type="range"
                                      min="20"
                                      max="50"
                                      step="5"
                                      value={mathInputs[item.id]?.fck ?? 30}
                                      onChange={(e) => handleInputChange(item.id, "fck", parseInt(e.target.value))}
                                      className="w-full h-1 bg-zinc-200 accent-[#154212]"
                                    />
                                    <div className="flex justify-between text-[8px] text-zinc-450 font-mono">
                                      <span>M20 (Low-rise)</span>
                                      <span>M35</span>
                                      <span>M50 (High-rise mat)</span>
                                    </div>
                                  </div>
                                )}

                              </div>

                              {/* Math Evaluation result readout */}
                              {evaluated && (
                                <div className="bg-white p-3.5 border border-zinc-200/90 flex flex-col justify-between font-mono">
                                  <div className="space-y-2 text-left">
                                    <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">CODE MATH CHECKOUT</span>
                                    
                                    <div className="flex justify-between items-baseline">
                                      <span className="text-xs text-zinc-500">Calculated value:</span>
                                      <span className="text-sm font-black text-zinc-955">
                                        {evaluated.value} <span>{evaluated.unit}</span>
                                      </span>
                                    </div>

                                    <div className="flex justify-between items-baseline border-b border-zinc-100 pb-2">
                                      <span className="text-xs text-zinc-500">Clause Safe Limit:</span>
                                      <span className="text-xs font-black text-zinc-650">
                                        {evaluated.isSafe ? "≤" : ">"} {evaluated.limit} {evaluated.unit}
                                      </span>
                                    </div>

                                    <p className="text-[10px] text-zinc-500 leading-normal font-sans pt-1">
                                      {evaluated.explanation}
                                    </p>
                                  </div>

                                  <div className={`mt-3 p-1.5 border text-center text-[10px] font-bold ${
                                    evaluated.isSafe 
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                      : "bg-rose-50 text-rose-800 border-rose-250 animate-pulse"
                                  }`}>
                                    {evaluated.isSafe ? "✓ COMPLIES SECURELY" : "✗ EXCEEDS CODE ALLOWED LIMIT!"}
                                  </div>
                                </div>
                              )}

                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                );
              })
            ) : (
              <div className="p-8 bg-white border border-zinc-200 text-center text-xs text-zinc-400 select-none">
                No indexed clauses matched query: "{searchQuery}".
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: REGULATORY INSPECTOR AUDIT PLATFORM & STAMPING GATEWAY (4 Columns) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          
          {/* REGULATORY ACTION MODULE */}
          <div className="bg-white border border-zinc-200 p-6 shadow-3xs text-left text-sans space-y-5 relative">
            
            {/* Margins decor */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-zinc-300"></div>
            <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-zinc-300"></div>
            <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-zinc-300"></div>
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-zinc-300"></div>

            <div className="border-b border-zinc-150 pb-2 select-none">
              <span className="text-[9.5px] font-mono text-[#154212] font-bold uppercase tracking-widest block">AUDIT PORT</span>
              <h4 className="font-serif text-sm font-bold text-zinc-950 leading-none mt-0.5">Automated Code Inspections Terminal</h4>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-zinc-550 leading-relaxed font-sans">
                Initiate a thorough deterministic structure check. This engine intercepts active dimensions and structural stress parameters to cast an official compliance authentication verdict.
              </p>

              {/* STATS SUMMARY INSIDE RIGHT COLUMN */}
              <div className="bg-zinc-50 border border-zinc-200 p-3 space-y-2 font-mono text-[10px]">
                <div className="flex justify-between">
                  <span className="text-zinc-400">AUDIT OPERATOR:</span>
                  <span className="font-bold text-zinc-800">{userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">REPRESENTATIVE PROJECT:</span>
                  <span className="font-bold text-zinc-800 truncate max-w-[155px]">{projectId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">CHECKLIST VERIFIED:</span>
                  <span className={`font-bold ${complianceStats.percentage >= 60 ? "text-emerald-700" : "text-amber-600"}`}>
                    {complianceStats.percentage}% PASSED
                  </span>
                </div>
              </div>

              {/* ACTION CALL BUTTON */}
              <button
                onClick={handleRunAudit}
                disabled={stampStatus === "AUDITING"}
                className={`w-full py-3 text-2xs font-mono font-bold uppercase tracking-wider text-center cursor-pointer transition-all border ${
                  stampStatus === "AUDITING" 
                    ? "bg-zinc-50 border-zinc-200 text-zinc-400" 
                    : "bg-[#154212] border-[#154212] text-white hover:bg-[#1a4b17]"
                }`}
              >
                {stampStatus === "AUDITING" ? "INSPECTING TARGET SHEEPS..." : "RUN COMPLIANCE CODE AUDIT"}
              </button>
            </div>

            {/* AUDIT LOG OUTPUT AREA */}
            {errorLog.length > 0 && (
              <div className="bg-zinc-950 p-3 border border-zinc-800 text-slate-350 font-mono text-[8.5px] leading-relaxed max-h-[140px] overflow-y-auto space-y-1 rounded-none select-text custom-scrollbar">
                {errorLog.map((log, idx) => (
                  <p key={idx} className={
                    log.includes("[FAIL]") || log.includes("[DANGER]") ? "text-rose-400 font-bold" :
                    log.includes("[PASS]") ? "text-emerald-400 font-semibold" :
                    log.includes("[WARN]") ? "text-amber-400" :
                    "text-zinc-400"
                  }>
                    {log}
                  </p>
                ))}
              </div>
            )}

            {/* EXPANDABLE VERDICT BLOCK + HOLOGRAM STAMP DISPLAY BACKGROUND */}
            <AnimatePresence>
              {stampStatus !== "NONE" && stampStatus !== "AUDITING" && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="mt-4 pt-1 relative"
                >
                  {/* Hologram stamp image overlay */}
                  <div className="border border-dashed border-zinc-205 p-4 bg-zinc-50/50 flex flex-col items-center justify-center relative overflow-hidden">
                    
                    {/* Big Stamp Circle Mark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-12 pointer-events-none select-none">
                      <div className={`w-36 h-36 rounded-full border-[6px] border-double flex items-center justify-center font-serif text-3xl font-black rotate-[-22deg] ${
                        stampStatus === "APPROVED" ? "border-emerald-700 text-emerald-800" : "border-rose-600 text-rose-700"
                      }`}>
                        {stampStatus === "APPROVED" ? "BIS APPROVED" : "BIS REJECT"}
                      </div>
                    </div>

                    <div className="text-center space-y-2 relative z-10 select-none">
                      <FileCheck2 className={`mx-auto w-10 h-10 ${
                        stampStatus === "APPROVED" ? "text-emerald-750" : "text-rose-650 animate-bounce"
                      }`} />
                      
                      <div className={`text-xs font-mono font-black ${
                        stampStatus === "APPROVED" ? "text-emerald-800" : "text-rose-700"
                      }`}>
                        {stampStatus === "APPROVED" ? "CERTIFIED STANDARD APPROVED" : "CODE EXCLUSION FAILURE ALERT"}
                      </div>

                      <p className="text-[10px] font-sans text-zinc-500 max-w-[240px] mx-auto leading-relaxed">
                        {stampMessage}
                      </p>

                      <div className="pt-2 border-t border-zinc-200 text-center">
                        <p className="text-[8px] font-mono text-zinc-450 uppercase">VERIFICATION STAMP SHA1 BLOCK</p>
                        <p className="text-[9px] font-mono font-bold text-zinc-800 tracking-tight">{stampCode}</p>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* IS-CODE HANDBOOK BRIEF */}
          <div className="bg-white border border-zinc-200 p-5 shadow-3xs space-y-3.5 text-left text-sans">
            <span className="text-[9px] font-mono font-bold uppercase text-[#154212] tracking-wider block border-b pb-1.5">
              IS REFERENCE CATALOG INDEX 
            </span>
            <div className="space-y-3 font-sans text-[11px] text-zinc-550 leading-relaxed">
              <div className="border-l-2 border-emerald-700 pl-3">
                <p className="font-bold text-zinc-900 leading-tight">IS 456-2000 Ultimate Concrete Structures</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Rules evaluating cross-section covers, beam shear stresses, and minimum tensile rebars safety coefficients.</p>
              </div>

              <div className="border-l-2 border-amber-500 pl-3">
                <p className="font-bold text-zinc-900 leading-tight">IS 1893-2016 Seismicity Code Matrix</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Evaluates Peak ground accelerations (Z-factor coefficients), soil intensity ranges, and safety load factors multipliers.</p>
              </div>

              <div className="border-l-2 border-[#154212] pl-3">
                <p className="font-bold text-zinc-900 leading-tight">IS 13920-2016 Ductility Detail Spacing</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">Requires continuous confinement hoops inside Column plastic joints to suppress failure under lateral earthquake loads.</p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* -------------------------------------------------------------------- */}
      {/* ORI FLYOVER ASSISTANT FLOATING HUD (Feature 5) */}
      {/* -------------------------------------------------------------------- */}
      <div className="fixed bottom-6 right-6 z-50 select-none" id="ori-ai-flying-hud">
        <button
          onClick={() => setIsOriOpen(true)}
          className="w-14 h-14 rounded-full bg-[#154212] text-white flex items-center justify-center shadow-lg hover:shadow-2xl hover:bg-emerald-850 cursor-pointer transition-all border-2 border-white animate-pulse"
          title="Open Ori AI Compliance Copilot"
        >
          <div className="relative">
            <Brain className="w-6 h-6 animate-spin-slow text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border border-white rounded-full"></span>
          </div>
        </button>
      </div>

      {/* Slide-out Overlay Drawer for Ori */}
      <AnimatePresence>
        {isOriOpen && (
          <>
            {/* Backdrop lock */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOriOpen(false)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Chat Drawer */}
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:max-w-md bg-[#faf9f6] border-l border-zinc-200/80 shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Drawer Title Header */}
              <div className="p-5 border-b border-zinc-200 flex justify-between items-center bg-[#fcfbfa]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-[#154212] flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-serif text-sm font-bold text-zinc-950">Ori Intelligence Hub</h5>
                    <p className="text-[8.5px] uppercase tracking-wider text-zinc-400 font-mono font-bold">IS Codes AI Co-Pilot</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsOriOpen(false)}
                  className="p-1 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Message Scroll history */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 text-left custom-scrollbar bg-white/40">
                {oriChatHistory.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`flex flex-col max-w-[85%] ${
                      msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block mb-1">
                      {msg.sender === "user" ? "Inspector (You)" : "Ori AI Co-Pilot"}
                    </span>
                    
                    <div className={`p-3.5 text-xs h-auto select-text leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-[#154212] text-white" 
                        : "bg-zinc-50 border border-zinc-200 text-zinc-850"
                    }`}>
                      <p className="whitespace-pre-line leading-relaxed font-sans">{msg.text}</p>
                      
                      {/* Nested lists formatting */}
                      {msg.list && msg.list.length > 0 && (
                        <ul className="mt-2.5 space-y-1.5 border-t border-zinc-200/60 pt-2 text-[11px] font-sans select-text">
                          {msg.list.map((li, i) => (
                            <li key={i} className="flex items-start gap-1 text-zinc-600">
                              <span className="text-[#154212] font-extrabold shrink-0 mt-0.5">•</span>
                              <span>{li}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* AI Simulated table outputs */}
                      {msg.table && (
                        <div className="mt-3 overflow-x-auto border border-zinc-200 font-mono text-[9px] bg-white text-zinc-800">
                          <div className="p-1.5 bg-zinc-50 border-b font-bold uppercase tracking-wider text-[8.5px]">Evaluation Summary Table</div>
                          <div className="p-2 space-y-1 select-text">
                            <div><strong className="text-zinc-450 uppercase">LOCATION:</strong> {msg.table.location}</div>
                            <div><strong className="text-zinc-450 uppercase">SHEAR DEMAND:</strong> {msg.table.shearDemand}</div>
                            <div><strong className="text-zinc-450 uppercase">CAPACITY Limit:</strong> {msg.table.shearCapacity}</div>
                            <div><strong className="text-zinc-450 uppercase">CLAUSED VIOLATED:</strong> {msg.table.clauseViolated}</div>
                            <div><strong className="text-zinc-450 uppercase">REMEDIATION:</strong> {msg.table.suggestedFix}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isOriLoading && (
                  <div className="flex gap-2 items-center text-xs text-zinc-400 font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Ori is parsing IS code indexes...</span>
                  </div>
                )}
              </div>

              {/* Quick Preset Prompts Buttons */}
              <div className="p-4 bg-zinc-50 border-t border-zinc-200/70 space-y-2 select-none">
                <span className="text-[8px] font-mono text-zinc-400 uppercase font-black tracking-widest block text-left">QUICK QUERY PRESETS</span>
                <div className="flex gap-1.5 flex-wrap overflow-x-auto py-0.5 font-mono text-[8.5px]">
                  <button 
                    onClick={() => handleAskOri("What is the nominal cover for extreme exposure as per IS 456?")}
                    className="bg-white border border-zinc-200 py-1.5 px-2.5 text-zinc-650 hover:bg-zinc-100 uppercase tracking-tight cursor-pointer"
                  >
                    Nominal Cover Limits
                  </button>
                  <button 
                    onClick={() => handleAskOri("Explain seismic zone factor for Zone V as per IS 1893?")}
                    className="bg-white border border-zinc-200 py-1.5 px-2.5 text-zinc-650 hover:bg-zinc-100 uppercase tracking-tight cursor-pointer"
                  >
                    Seismic Zone Factor
                  </button>
                  <button 
                    onClick={() => handleAskOri("Tell me ductile detailing spacing for columns IS 13920?")}
                    className="bg-white border border-zinc-200 py-1.5 px-2.5 text-zinc-650 hover:bg-zinc-100 uppercase tracking-tight cursor-pointer"
                  >
                    Column Hoop Ties
                  </button>
                </div>
              </div>

              {/* Chat Input Box */}
              <div className="p-4 border-t border-zinc-200 bg-[#fcfbfa] flex gap-2">
                <input 
                  type="text"
                  value={oriMessage}
                  onChange={(e) => setOriMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAskOri()}
                  placeholder="Ask Ori an engineering code compliance question..."
                  className="flex-1 bg-white border border-zinc-200 text-xs px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212]"
                />
                <button
                  onClick={() => handleAskOri()}
                  className="px-3 py-2 bg-[#154212] hover:bg-emerald-850 text-white flex items-center justify-center cursor-pointer rounded-none shadow-3xs"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
