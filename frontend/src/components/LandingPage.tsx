import React, { useState, useMemo } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Database, 
  ChevronRight, 
  Activity, 
  FileText, 
  CheckCircle2, 
  Zap, 
  Bookmark, 
  AlertTriangle, 
  Scale, 
  BookOpen, 
  GitBranch, 
  HelpCircle,
  Settings,
  X,
  Lock,
  Compass,
  FileCheck,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenAuth: (presetAcc?: any) => void;
  isLoggedIn: boolean;
  onOpenWorkshop?: () => void;
  onOpenComplianceAudit?: () => void;
  onOpenMaterialsSandbox?: () => void;
}

export function LandingPage({ 
  onEnterApp, 
  onOpenAuth, 
  isLoggedIn, 
  onOpenWorkshop,
  onOpenComplianceAudit,
  onOpenMaterialsSandbox
}: LandingPageProps) {
  // Active states for interactive RCC Isolated Footing playground (Option 3)
  const [axialLoad, setAxialLoad] = useState<number>(1200); // kN (500 to 2500)
  const [soilSBC, setSoilSBC] = useState<number>(180); // kN/m2 (100 to 300)
  const [footingWidth, setFootingWidth] = useState<number>(2.4); // meters (1.5 to 4.0)
  const [footingThickness, setFootingThickness] = useState<number>(450); // mm (200 to 800)
  const [sandboxView, setSandboxView] = useState<"PLAN" | "SECTION">("PLAN");

  // Active states for Hero Column cross-section interactive sandbox
  const [colRebarCount, setColRebarCount] = useState<number>(6); // 4, 6, 8
  const [colRebarDia, setColRebarDia] = useState<number>(20); // 12, 16, 20, 25
  const [colCover, setColCover] = useState<number>(40); // 30, 40, 50 mm
  const [colConcreteGrade, setColConcreteGrade] = useState<string>("M25"); // M25, M30, M40

  const colMetrics = useMemo(() => {
    const grossArea = 300 * 300; // mm2
    const singleBarArea = Math.PI * Math.pow(colRebarDia / 2, 2);
    const totalSteelArea = Number((colRebarCount * singleBarArea).toFixed(1));
    const steelRatio = Number(((totalSteelArea / grossArea) * 100).toFixed(2));
    
    // Limits: min 0.8% of cross section, max 4.0%
    const minReq = grossArea * 0.008; // 720 mm2
    const maxReq = grossArea * 0.04; // 3600 mm2
    
    let isCompliant = true;
    let message = "PASS: Structure complies fully with IS 456 Clause 26.5.3.1.";
    
    if (steelRatio < 0.8) {
      isCompliant = false;
      message = `NON-COMPLIANT: Steel ratio (${steelRatio}%) is below nominal IS 456 limit of 0.8% (min 720 mm² required).`;
    } else if (steelRatio > 4.0) {
      isCompliant = false;
      message = `NON-COMPLIANT: Steel ratio (${steelRatio}%) exceeds maximum density of 4.0% (congested layout).`;
    }
    
    return {
      grossArea,
      totalSteelArea,
      steelRatio,
      isCompliant,
      message,
      minReq,
      maxReq
    };
  }, [colRebarCount, colRebarDia]);

  // Active FAQ accordion state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Active RCC Code News feed filter state
  const [activeNewsTab, setActiveNewsTab] = useState<string>("ALL UPDATES");

  // Computed metrics for our interactive structural compliance visualizer (RCC Footing Design under Axial Load)
  const playpenMetrics = useMemo(() => {
    // Column dimension is assumed 300mm x 300mm
    const colSide = 300; // mm
    const colSideM = 0.3; // m

    // Concrete cover in footing is assumed 50mm (IS 456 Clause 26.4.2.2 requirements for durability)
    const cover = 50; // mm
    const d_effective = footingThickness - cover; // mm
    const d_effective_m = d_effective / 1000;

    // Footing area
    const area = Number((footingWidth * footingWidth).toFixed(2)); // m2

    // Volume of concrete in footing
    const concreteVol = footingWidth * footingWidth * (footingThickness / 1000);
    // Weight of concrete (density 25 kN/m3)
    const selfWeight = Number((concreteVol * 25).toFixed(1));

    // Total vertical load including self weight
    const totalVerticalLoad = axialLoad + selfWeight;

    // Actual soil intensity pressure (Service load condition)
    const soilPressure = Number((totalVerticalLoad / area).toFixed(1));

    // Ultimate factored load for limit state checks
    const factoredLoad = axialLoad * 1.5;
    // Ultimate net upward soil pressure (for punching and one-way shear structural design checks)
    const factoredNetSoilPressure = Number((factoredLoad / area).toFixed(1));

    // 1. Check Soil bearing capacity (Clause 34.1.2)
    let state: "SECURE" | "WARNING" | "NON-COMPLIANT" = "SECURE";
    const violations: string[] = [];
    const guidance: string[] = [];

    if (soilPressure > soilSBC) {
      state = "NON-COMPLIANT";
      violations.push(`Soil stress (${soilPressure} kN/m²) exceeds Soil Safe Bearing Capacity of ${soilSBC} kN/m². Soil will suffer plastic settlement failure.`);
    }

    // 2. Check Punching Shear (Two-way Shear) - Clause 31.6
    // Critical perimeter is at d_effective/2 from column face
    const criticalPunchingSide = colSide + d_effective; // mm
    const criticalPunchingSideM = colSideM + d_effective_m; // m
    
    // Shear perimeter b0
    const b0 = 4 * criticalPunchingSide; // mm
    // Punching shear force V_up
    // Net pressure inside punching parameters is discounted
    const punchingArea = criticalPunchingSideM * criticalPunchingSideM;
    const V_up = factoredNetSoilPressure * (area - punchingArea); // kN
    
    // Punching stress tau_vp
    const tau_vp = Number(((V_up * 1000) / (b0 * d_effective)).toFixed(3)); // N/mm2
    // Allowable limit for M25 concrete = 0.25 * sqrt(25) = 1.25 N/mm2
    const permissiblePunching = 1.25;

    if (tau_vp > permissiblePunching) {
      state = "NON-COMPLIANT";
      violations.push(`Punching shear stress (${tau_vp} N/mm²) exceeds permissible tensile limit of ${permissiblePunching} N/mm² (Clause 31.6.2.1). footing will punch through.`);
    } else if (tau_vp > permissiblePunching * 0.8) {
      if (state !== "NON-COMPLIANT") state = "WARNING";
      guidance.push(`Punching shear runs high (${tau_vp} N/mm²). Increase footing depth to avoid punching failure.`);
    }

    // 3. One-Way Shear check at distance 'd' from column face
    const distance_from_face = (footingWidth - colSideM) / 2;
    const oneWayCriticalDist = distance_from_face - d_effective_m;
    
    let V_u1 = 0;
    let tau_v1 = 0;
    const permissibleOneWay = 0.36; // N/mm2 (for M25 with nominal footing steel)
    
    if (oneWayCriticalDist > 0) {
      V_u1 = factoredNetSoilPressure * footingWidth * oneWayCriticalDist; // kN
      const sectionArea = footingWidth * 1000 * d_effective; // mm2
      tau_v1 = Number(((V_u1 * 1000) / sectionArea).toFixed(3)); // N/mm2
      if (tau_v1 > permissibleOneWay) {
        state = "NON-COMPLIANT";
        violations.push(`One-way shear stress (${tau_v1} N/mm²) exceeds one-way shear capacity threshold of ${permissibleOneWay} N/mm² (Clause 34.2.4).`);
      }
    }

    return {
      area,
      selfWeight,
      totalVerticalLoad,
      soilPressure,
      factoredNetSoilPressure,
      criticalPunchingSide,
      colSide,
      cover,
      d_effective,
      V_up,
      tau_vp,
      permissiblePunching,
      oneWayCriticalDist,
      V_u1,
      tau_v1,
      permissibleOneWay,
      state,
      violations,
      guidance
    };
  }, [axialLoad, soilSBC, footingWidth, footingThickness]);



  const valueProps = [
    {
      icon: Cpu,
      title: "Real-time Clause Checking",
      description: "Convert static regulatory language (IS 456, IS 800, Eurocode) into native mathematical constraints checked directly within CAD/STAAD meshes."
    },
    {
      icon: Layers,
      title: "Generative Retrofit Overlays",
      description: "Superimpose optimal localized carbon fiber (CFRP) wraps or steel plates to mitigate design discrepancies, visually mapped over original assets."
    },
    {
      icon: FileCheck,
      title: "Deterministic Code Auditing",
      description: "Produce pristine compliance sheets showing safety factor ratios, specific rule crossings, and traceable reasoning notes with total accuracy."
    }
  ];

  const rccNewsList = [
    {
      title: "BIS Committee Circulates Draft Amendment 5 for IS 456-2000",
      category: "IS CODE REVISIONS",
      date: "24 MAY 2026",
      source: "Bureau of Indian Standards",
      description: "Proposals introduce highly refined elastic modulus equations for high-strength concrete mixes exceeding design grade M60. Focuses on minimizing long-term shrinkage deflection under sustained high axial loads.",
      actionText: "Download Draft Amendment Preview"
    },
    {
      title: "Implementation of Ductile Detailing Code IS 13920:2016 for High-Rise Foundation Mats",
      category: "IS CODE REVISIONS",
      date: "18 APR 2026",
      source: "National Building Code Committee",
      description: "New directives mandate continuous transverse reinforcement in perimeter columns anchoring to thick isolated footings. Intended to control severe diagonal cracking in high-intensity seismic zones.",
      actionText: "Check Seismic Guidelines"
    },
    {
      title: "Comparative Performance Analysis: Geopolymer RCC vs. Standard Portland Concrete",
      category: "RESEARCH & CIRCULARS",
      date: "05 APR 2026",
      source: "Indian Concrete Institute Journal",
      description: "Academic studies show geopolymer RCC structures exhibit a 35% higher resistance to sulfate atmospheric ingress in subterranean pile caps over a twenty-year accelerated modeling cycle.",
      actionText: "Review Comparative Data"
    },
    {
      title: "Adoption of Corrugated Steel Web Systems in Urban Elevated Highway Spans",
      category: "INDUSTRY DISPATCHES",
      date: "12 MAR 2026",
      source: "Indian Roads Congress",
      description: "State infrastructure authorities report standard prestressed concrete girder spans are increasingly replaced by lighter composite corrugated steel-concrete systems to limit heavy pier foundations.",
      actionText: "View Girder Standard Layouts"
    },
    {
      title: "Revised Partial Safety Factors for Reinforced Concrete Member Deflection Checks",
      category: "IS CODE REVISIONS",
      date: "02 FEB 2026",
      source: "Civil Engineering Core Council",
      description: "A technical advisory notes that real-world material variance justifies an increase in the partial safety factor for steel reinforcement under limit states of serviceability.",
      actionText: "View Limit State Formulae"
    },
    {
      title: "Smart Concrete Embedded Core Sensors for Lifetime Tension Monitoring",
      category: "RESEARCH & CIRCULARS",
      date: "15 JAN 2026",
      source: "Structural Health Review",
      description: "Real-time inductive loop sensor tests verify the long-term reliability of concrete-embedded strain gauges when positioned at the absolute tension fiber of flexural girder reinforcement bars.",
      actionText: "Examine Research Publications"
    }
  ];



  const faqData = [
    {
      q: "Which building codes and standards are integrated natively in CivilOS?",
      a: "CivilOS currently supports the Indian standard Bureau of Indian Standards (including IS 456 for concrete, IS 800 for structural steel structures), Indian Roads Congress guide directives (such as IRC:83 for elastomeric bearings), as well as foundational Eurocodes 2 & 8 for design and seismic safety."
    },
    {
      q: "Can I synchronize my existing STAAD or custom CAD files directly?",
      a: "Yes. CivilOS supports direct uploads of STAAD project decks and standard drawing tables. It parses the nodes, cross-sectional boundaries, and materials to construct a real-time compliance review without altering your raw source files."
    },
    {
      q: "Describe the 'Generative Ghosting' technology.",
      a: "Generative ghosting overlays optimal retrofit designs (such as CFRP confinement jackets or supplementary steel stay lines) directly on your original 3D asset schematic. This allows engineers to compare the remedial performance before initiating physical engineering orders."
    },
    {
      q: "What credentials are required to operate the test simulator runtime?",
      a: "To simulate a real project workspace environment, you can register a custom credentials key on the spot in the login portal or utilize the terminal login."
    }
  ];

  return (
    <div id="civilos-landing-root" className="min-h-screen bg-[#faf9f6] text-[#1a1c1c] font-sans antialiased overflow-x-hidden relative flex flex-col justify-between">
      
      {/* BACKGROUND GRID WIREFRAME */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e2e1_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-75 pointer-events-none z-0" />
      
      {/* DECORATIVE TOP GRADIENT */}
      <div className="absolute top-0 left-0 right-0 h-[650px] bg-gradient-to-b from-zinc-100/60 to-transparent pointer-events-none z-0 border-b border-zinc-200/20" />

      {/* -------------------------------------------------------------------- */}
      {/* PRODUCT NAVBAR */}
      {/* -------------------------------------------------------------------- */}
      <nav id="landing-navbar" className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between select-none">
        
        {/* Brand Logo and Title */}
        <div className="flex items-center gap-3">
         <img src="/logo.png" className="w-25" alt="" />
          <div>
            <h1 className="font-serif text-[24px] tracking-tight font-extrabold text-zinc-900 leading-none">CivilOS</h1>
            <p className="text-[9px] uppercase tracking-[0.16em] text-zinc-500 font-bold mt-1.5 font-mono">Structural Compliance System</p>
          </div>
        </div>

        {/* Navigation jump points */}
        <div className="hidden lg:flex items-center gap-1 bg-white/80 border border-zinc-200/80 p-1 rounded-none font-mono text-[10px] font-bold shadow-3xs">
          <a href="#product-features" className="px-4 py-2 hover:bg-zinc-50 transition-colors uppercase tracking-wider text-zinc-650">Features</a>
          {onOpenComplianceAudit && (
            <button 
              onClick={onOpenComplianceAudit}
              className="px-4 py-2 hover:bg-zinc-50 text-[#154212] font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Screen 2: IS-Code Compliance
            </button>
          )}
          {onOpenMaterialsSandbox && (
            <button 
              onClick={onOpenMaterialsSandbox}
              className="px-4 py-2 hover:bg-zinc-50 text-zinc-850 font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              Screen 3: Materials Sandbox
            </button>
          )}
          {onOpenWorkshop && (
            <button 
              onClick={onOpenWorkshop} 
              className="px-4 py-2 hover:bg-zinc-100 text-zinc-650 uppercase tracking-wider transition-colors cursor-pointer border-l border-zinc-200"
            >
              Workshop
            </button>
          )}
        </div>

        {/* Active Access Terminal action */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onOpenAuth()}
            className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-mono font-bold uppercase tracking-wider rounded-none cursor-pointer transition-colors shadow-sm"
          >
            Terminal Login
          </button>
        </div>
      </nav>



      {/* -------------------------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* -------------------------------------------------------------------- */}
      <section id="landing-hero" className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-12 pb-20 md:py-24 text-left select-text grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* HERO COPY PANEL */}
        <div className="lg:col-span-6 space-y-6 lg:sticky lg:top-8">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 bg-[#154212]/5 border border-[#154212]/20 text-[#154212] font-mono text-[9px] font-bold uppercase tracking-wider leading-none rounded-none select-none">
            <span className="w-1.5 h-1.5 bg-[#154212] rounded-full animate-pulse inline-block"></span>
            Bureau of Indian Standards Code Compliance Grounding
          </div>

          <h2 className="font-serif text-[44px] md:text-[56px] lg:text-[62px] leading-[1.05] font-normal tracking-tight text-zinc-900">
            Integrity check <br />
            your structural designs, <br />
            <span className="italic font-light text-[#154212]">instantly</span>.
          </h2>

          <p className="text-sm md:text-base text-zinc-600 leading-relaxed font-sans max-w-xl">
            CivilOS introduces a systematic machine-reasoning environment for structural engineering. Cross-reference drawings, STAAD meshes, and calculated safety specifications against IS 456, IS 800, and seismic criteria in real-time.
          </p>

          <div className="pt-4 select-none flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onOpenAuth()}
              className="py-3 px-6 bg-[#154212] hover:bg-[#0f300c] text-white font-mono text-xs font-semibold uppercase tracking-wider rounded-none shadow-xs transition-colors flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>Initialize Workspace Application</span>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </button>
            {onOpenWorkshop && (
              <button
                onClick={onOpenWorkshop}
                className="py-3 px-6 bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs font-semibold uppercase tracking-wider rounded-none shadow-xs transition-colors flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Combination Workshop</span>
                <ArrowRight className="w-4 h-4 text-zinc-400" />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 select-none">
            {onOpenComplianceAudit && (
              <button
                onClick={onOpenComplianceAudit}
                className="py-2 px-4 bg-white hover:bg-zinc-50 text-[#154212] border border-[#154212]/30 font-mono text-[11px] font-semibold uppercase tracking-wider rounded-none shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch IS-456 Audit Center</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#154212]" />
              </button>
            )}
            {onOpenMaterialsSandbox && (
              <button
                onClick={onOpenMaterialsSandbox}
                className="py-2 px-4 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 font-mono text-[11px] font-semibold uppercase tracking-wider rounded-none shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Launch Materials Sandbox</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
              </button>
            )}
          </div>

          {/* Standards tags strip */}
          <div className="pt-6 border-t border-zinc-200/80 flex flex-wrap items-center gap-x-5 gap-y-2.5 font-mono text-[10px] text-zinc-400 select-none">
            <span className="font-bold text-zinc-450 uppercase tracking-widest">STANDARD LIBS:</span>
            <span className="font-semibold text-zinc-700 bg-white border border-zinc-200 px-2.5 py-1">BIS IS 456</span>
            <span className="font-semibold text-zinc-700 bg-white border border-zinc-200 px-2.5 py-1">IS 800 (STEEL)</span>
            <span className="font-semibold text-zinc-700 bg-white border border-zinc-200 px-2.5 py-1">IRC CODES</span>
            <span className="font-semibold text-zinc-700 bg-white border border-zinc-200 px-2.5 py-1">EUROCODE 2 / 8</span>
          </div>
        </div>

        {/* HERO VISUAL METAPHOR BLOCK */}
        <div id="hero-cad-metaphor" className="lg:col-span-6 relative flex justify-center">
          <div className="w-full max-w-lg bg-white p-6 border border-zinc-200 shadow-md relative select-none">
            {/* Fine outer margin corner marks */}
            <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-zinc-400"></div>
            <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-zinc-400"></div>
            <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-zinc-400"></div>
            <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-zinc-400"></div>

            {/* Title & Interactive Toggle header */}
            <div className="flex justify-between items-center pb-4 border-b border-zinc-200 select-none">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-[#154212] tracking-wider block">IS 456 detailing standard</span>
                <h4 className="font-serif text-[15px] font-bold text-zinc-900 mt-0.5">RCC Column Cross-Section</h4>
              </div>
              <span className="text-[9.5px] font-mono bg-[#154212]/5 border border-[#154212]/20 text-[#154212] px-2.5 py-1 font-bold uppercase tracking-wider">
                Fe 500 Steel Grade
              </span>
            </div>

            {/* LIVE REACTIVE CAD CANVAS */}
            {(() => {
              // Convert mm parameters to dynamic SVG dimensions
              const cpx = colCover * 0.5; // pixel representation (scale 1mm = 0.5px)
              
              // Rebar radius pixel value
              const rpx = colRebarDia === 12 ? 4.5 : colRebarDia === 16 ? 6 : colRebarDia === 20 ? 7.5 : 9.5;
              
              // Coordinates
              const xMin = 75 + cpx + rpx;
              const xMax = 75 + 150 - cpx - rpx;
              const yMin = 35 + cpx + rpx;
              const yMax = 35 + 150 - cpx - rpx;
              const xMid = (xMin + xMax) / 2;
              const yMid = (yMin + yMax) / 2;

              interface Pt { x: number; y: number }
              let rebarPts: Pt[] = [];
              if (colRebarCount === 4) {
                rebarPts = [
                  { x: xMin, y: yMin },
                  { x: xMax, y: yMin },
                  { x: xMin, y: yMax },
                  { x: xMax, y: yMax }
                ];
              } else if (colRebarCount === 6) {
                rebarPts = [
                  { x: xMin, y: yMin },
                  { x: xMax, y: yMin },
                  { x: xMin, y: yMax },
                  { x: xMax, y: yMax },
                  { x: xMid, y: yMin },
                  { x: xMid, y: yMax }
                ];
              } else {
                rebarPts = [
                  { x: xMin, y: yMin },
                  { x: xMax, y: yMin },
                  { x: xMin, y: yMax },
                  { x: xMax, y: yMax },
                  { x: xMid, y: yMin },
                  { x: xMid, y: yMax },
                  { x: xMin, y: yMid },
                  { x: xMax, y: yMid }
                ];
              }

              return (
                <div>
                  <div className="py-6 flex flex-col items-center justify-center bg-zinc-50 border border-zinc-200 mt-4 relative overflow-hidden">
                    {/* Architectural coordinate details backdrops */}
                    <div className="absolute top-2 left-2 text-[8px] text-zinc-300 font-mono select-none">
                      REF_PLANE_Z=0.00
                    </div>
                    <div className="absolute top-2 right-2 text-[8px] text-zinc-300 font-mono select-none">
                      COORD: 300x300
                    </div>

                    <svg className="w-full h-56 max-w-[320px] overflow-visible" viewBox="0 0 300 220" fill="none">
                      {/* Grid backdrop */}
                      <g opacity="0.3" stroke="#d4d4d8" strokeWidth="0.5">
                        <path d="M0 20 H300 M0 60 H300 M0 100 H300 M0 140 H300 M0 180 H300" />
                        <path d="M40 0 V220 M100 0 V220 M160 0 V220 M220 0 V220 M280 0 V220" />
                      </g>

                      {/* Main Concrete Column Boundary (300mm x 300mm ratio) */}
                      <rect x="75" y="35" width="150" height="150" fill="#f4f4f5" stroke="#18181b" strokeWidth="2.5" />
                      
                      {/* Nominal Concrete Cover shaded boundary (Cover thickness scaled) */}
                      <rect x={75 + cpx} y={35 + cpx} width={150 - 2 * cpx} height={150 - 2 * cpx} fill="none" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="3,3" />

                      {/* Shear Stirrup / Lateral Tie (8mm) */}
                      <rect x={75 + cpx} y={35 + cpx} width={150 - 2 * cpx} height={150 - 2 * cpx} fill="none" stroke="#4b5320" strokeWidth="2" strokeLinejoin="miter" />
                      
                      {/* Stirrup dynamic anchorage hooks at upper-left corner */}
                      <path d={`M ${75 + cpx} ${35 + cpx + 20} L ${75 + cpx} ${35 + cpx} L ${75 + cpx + 20} ${35 + cpx} M ${75 + cpx} ${35 + cpx} L ${75 + cpx - 10} ${35 + cpx + 10}`} stroke="#4b5320" strokeWidth="2" strokeLinecap="round" />

                      {/* Longitudinal Reinforcement Rebars drawn dynamically based on count */}
                      {rebarPts.map((p, pIdx) => (
                        <g key={pIdx}>
                          <circle cx={p.x} cy={p.y} r={rpx} fill="#154212" stroke="#ffffff" strokeWidth="1.5" />
                          <circle cx={p.x} cy={p.y} r={Math.max(1, rpx - 4.5)} fill="#ffffff" />
                        </g>
                      ))}

                      {/* Dimension Arrows and Annotations on Drawing */}
                      {/* Concrete Cover dimension */}
                      <g stroke="#df2a2a" strokeWidth="1">
                        <line x1="75" y1="110" x2={75 + cpx} y2="110" />
                        <line x1="75" y1="106" x2="75" y2="114" />
                        <line x1={75 + cpx} y1="106" x2={75 + cpx} y2="114" />
                      </g>
                      <text x="36" y="102" fill="#df2a2a" fontSize="7" fontFamily="monospace" fontWeight="bold">COVER: {colCover}mm</text>

                      {/* Stirrup diameter pointer */}
                      <path d="M140 54 L158 22 H184" stroke="#71717a" strokeWidth="1" />
                      <circle cx="140" cy="54" r="1.5" fill="#18181b" />
                      <text x="188" y="25" fill="#404040" fontSize="8" fontFamily="sans-serif" fontWeight="bold">Lateral Tie 10Φ</text>

                      {/* Main reinforcement pointer */}
                      <path d={`M ${xMax} ${yMax} L 220 188 H 255`} stroke="#154212" strokeWidth="1" />
                      <circle cx={xMax} cy={yMax} r="1.5" fill="#154212" />
                      <text x="258" y="191" fill="#154212" fontSize="8.5" fontFamily="sans-serif" fontWeight="black">{colRebarCount} Nos - {colRebarDia}Φ</text>

                      {/* Cross section total width annotation */}
                      <line x1="75" y1="200" x2="225" y2="200" stroke="#71717a" strokeWidth="1" />
                      <line x1="75" y1="196" x2="75" y2="204" stroke="#71717a" strokeWidth="1" />
                      <line x1="225" y1="196" x2="225" y2="204" stroke="#71717a" strokeWidth="1" />
                      <text x="110" y="212" fill="#52525b" fontSize="8" fontFamily="sans-serif" fontWeight="semibold">Gross Core Cross-Section: 300 x 300 mm</text>
                    </svg>
                  </div>

                  {/* HIGH-DENSITY BRUTALIST CONSOLE SELECTORS */}
                  <div className="mt-4 border border-zinc-200 p-4 space-y-4 bg-zinc-50/50">
                    <p className="font-mono text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      DRAFTING CONSOLE / REINFORCEMENT SELECTORS
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Bar Count selection */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-zinc-500 block uppercase">Bar Count</label>
                        <div className="flex border border-zinc-200 bg-white">
                          {[4, 6, 8].map((num) => (
                            <button
                              key={num}
                              onClick={() => setColRebarCount(num)}
                              className={`flex-1 py-1 text-[10.5px] font-mono font-bold transition-colors cursor-pointer ${
                                colRebarCount === num
                                  ? "bg-[#154212] text-white"
                                  : "text-zinc-700 hover:bg-zinc-100"
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Bar Diameter */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-zinc-500 block uppercase">Diameter (Φ)</label>
                        <div className="flex border border-zinc-200 bg-white">
                          {[12, 16, 20, 25].map((dia) => (
                            <button
                              key={dia}
                              onClick={() => setColRebarDia(dia)}
                              className={`flex-1 py-1 text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                                colRebarDia === dia
                                  ? "bg-[#154212] text-white"
                                  : "text-zinc-600 hover:bg-zinc-150"
                              }`}
                            >
                              {dia}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clear Cover */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono font-bold text-zinc-500 block uppercase">Clear Cover</label>
                        <div className="flex border border-zinc-200 bg-white">
                          {[30, 40, 50].map((cov) => (
                            <button
                              key={cov}
                              onClick={() => setColCover(cov)}
                              className={`flex-1 py-1 text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                                colCover === cov
                                  ? "bg-[#154212] text-white"
                                  : "text-zinc-600 hover:bg-zinc-100"
                              }`}
                            >
                              {cov}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* DYNAMIC COMPLIANCE LEDGER */}
                    <div className="pt-3 border-t border-zinc-200 space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between items-center text-zinc-500 font-bold">
                        <span>TOTAL STEEL AREA (Ast):</span>
                        <span className="text-zinc-900 font-black">{colMetrics.totalSteelArea} mm²</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-500">
                        <span>REINFORCEMENT RATIO (%):</span>
                        <div className="flex items-center gap-1">
                          <span className="text-zinc-900 font-black">{colMetrics.steelRatio}%</span>
                          <span className="text-zinc-400 text-[9px]">(Limit: 0.8% - 4.0%)</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1 font-sans text-xs">
                        {/* <span className={`w-2.5 h-2.5 inline-block shrink-0 border border-zinc-400 ${colMetrics.isCompliant ? "bg-emerald-600" : "bg-rose-600 animate-pulse"}`}></span> */}
                        <span className={`font-mono text-[10.5px] font-bold ${colMetrics.isCompliant ? "text-emerald-800" : "text-rose-700"}`}>
                          {colMetrics.message}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* SECTION: PRODUCT SPECIFICATIONS & VALUES */}
      {/* -------------------------------------------------------------------- */}
      <section id="product-features" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-zinc-200 select-text text-left scroll-mt-6">
        <div className="space-y-3 mb-12">
          <span className="text-[10px] uppercase font-mono font-black text-[#154212] tracking-widest block">SYSTEM METRICS</span>
          <h3 className="font-serif text-[32px] md:text-[38px] font-normal tracking-tight text-zinc-900 leading-none">
            Architectural honesty at every code crossing.
          </h3>
          <p className="text-sm text-zinc-500 max-w-2xl font-sans">
            Designed directly around structural inspection requirements. We ensure high-fidelity checking and compliance tracking across localized and national civil databases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 select-none">
          {valueProps.map((prop, idx) => {
            const IconComp = prop.icon;
            return (
              <div 
                key={idx} 
                className="p-8 bg-white border border-zinc-200 rounded-none shadow-xs hover:border-[#154212]/40 hover:shadow-md transition-all duration-200 relative flex flex-col justify-between overflow-hidden group"
              >
                {/* Visual coordinate locator */}
                <div className="absolute top-2 right-2 font-mono text-[8.5px] text-zinc-400 select-none group-hover:text-[#154212] transition-colors">
                  [ GRID_R-0{idx + 1} ]
                </div>
                
                {/* Engineering corner marks */}
                <div className="absolute bottom-1.5 left-1.5 w-1 h-1 border-b border-l border-zinc-300"></div>
                <div className="absolute bottom-1.5 right-1.5 w-1 h-1 border-b border-r border-zinc-300"></div>

                <div className="space-y-5">
                  <div className="w-10 h-10 bg-[#154212]/5 border border-[#154212]/30 text-[#154212] flex items-center justify-center rounded-none group-hover:scale-105 transition-transform">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif text-lg font-bold text-zinc-950">{prop.title}</h4>
                  <p className="text-xs text-zinc-550 leading-relaxed font-sans">{prop.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>


      <section id="interactive-preview" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 select-text text-left scroll-mt-6">
        <div className="bg-white border border-zinc-200 p-6 md:p-10 space-y-10 shadow-md relative" id="sandbox-wrapper-card">
          
          {/* Engineering visual cross mark decorations */}
          <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-zinc-500"></div>
          <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-zinc-500"></div>
          <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-zinc-500"></div>
          <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-zinc-500"></div>

          {/* Section banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 pb-6 select-none" id="sandbox-banner-block">
            <div className="space-y-2">
              <span className="text-[10px] bg-[#154212]/5 text-[#154212] border border-[#154212]/20 px-3 py-1 uppercase tracking-widest font-mono font-bold" id="sandbox-tag">
                IS 456 Detailing Simulator
              </span>
              <h3 className="font-serif text-[28px] md:text-[34px] font-normal tracking-tight text-zinc-900 leading-tight">
                Interactive RCC Isolated Footing Solver
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xl font-sans font-medium">
                Adjust foundation dimensions, bearing capacities, and axial column loads. Instantly analyze multi-hazard limit states for punching shear, soil pressure, and flexural checks page-wide.
              </p>
            </div>

            <div className="text-right font-mono text-[10px] shrink-0 text-zinc-400" id="sandbox-code-indicator">
              <p>OPERATIONAL TARGET CODE: IS 456-2000</p>
              <p className="text-zinc-650 font-bold font-sans">CHAPTER VII: FOUNDATIONS</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* SIMULATOR CONTROLS */}
            <div className="lg:col-span-4 space-y-6 bg-zinc-50/50 border border-zinc-200 p-5 shadow-xs" id="sandbox-sliders-panel">
              <p className="font-mono text-[9px] font-bold text-[#154212] tracking-widest uppercase block border-b border-zinc-200 pb-2">
                FOUNDATION DESIGN VARIABLES
              </p>
              
              {/* Column Load slider */}
              <div className="bg-white border border-zinc-200 hover:border-zinc-400 p-4 space-y-3 transition-colors" id="slider-axial-load-box">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-zinc-650 uppercase text-[10px]">Column Axial Load (P)</span>
                  <span className="text-xs font-black text-white bg-zinc-900 px-2 py-0.5">{axialLoad} kN</span>
                </div>
                
                <input 
                  type="range"
                  min="500"
                  max="2500"
                  step="50"
                  value={axialLoad}
                  onChange={(e) => setAxialLoad(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 cursor-pointer accent-[#154212]"
                  id="range-axial-load"
                />

                <div className="flex justify-between text-[8px] font-mono text-zinc-400">
                  <span>500 kN (Light Col)</span>
                  <span>1500 kN</span>
                  <span>2500 kN (Heavy G+4)</span>
                </div>
              </div>

              {/* SBC of Soil slider */}
              <div className="bg-white border border-zinc-200 hover:border-zinc-400 p-4 space-y-3 transition-colors" id="slider-soil-sbc-box">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-zinc-650 uppercase text-[10px]">Soil Safe Bearing (SBC)</span>
                  <span className="text-xs font-black text-white bg-zinc-900 px-2 py-0.5">{soilSBC} kN/m²</span>
                </div>
                
                <input 
                  type="range"
                  min="100"
                  max="300"
                  step="10"
                  value={soilSBC}
                  onChange={(e) => setSoilSBC(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 cursor-pointer accent-[#154212]"
                  id="range-soil-sbc"
                />

                <div className="flex justify-between text-[8px] font-mono text-zinc-400">
                  <span>100 kN/m² (Soft Clay)</span>
                  <span>200 kN/m²</span>
                  <span>300 kN/m² (Dense Sand)</span>
                </div>
              </div>

              {/* Footing Size (Width) slider */}
              <div className="bg-white border border-zinc-200 hover:border-zinc-400 p-4 space-y-3 transition-colors" id="slider-footing-width-box">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-zinc-650 uppercase text-[10px]">Footing Width 'B'</span>
                  <span className="text-xs font-black text-white bg-zinc-900 px-2 py-0.5">{footingWidth} x {footingWidth} m</span>
                </div>
                
                <input 
                  type="range"
                  min="1.5"
                  max="4.0"
                  step="0.1"
                  value={footingWidth}
                  onChange={(e) => setFootingWidth(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 cursor-pointer accent-[#154212]"
                  id="range-footing-width"
                />

                <div className="flex justify-between text-[8px] font-mono text-zinc-400">
                  <span>1.5 meters</span>
                  <span>2.7 m</span>
                  <span>4.0 m (Spreader)</span>
                </div>
              </div>

              {/* Footing Thickness slider */}
              <div className="bg-white border border-zinc-200 hover:border-zinc-400 p-4 space-y-3 transition-colors" id="slider-footing-thickness-box">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-zinc-650 uppercase text-[10px]">Footing Depth 'D'</span>
                  <span className="text-xs font-black text-white bg-zinc-900 px-2 py-0.5">{footingThickness} mm</span>
                </div>
                
                <input 
                  type="range"
                  min="200"
                  max="800"
                  step="25"
                  value={footingThickness}
                  onChange={(e) => setFootingThickness(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 cursor-pointer accent-[#154212]"
                  id="range-footing-thickness"
                />

                <div className="flex justify-between text-[8px] font-mono text-zinc-400">
                  <span>200 mm (Shallow)</span>
                  <span>500 mm</span>
                  <span>800 mm (Rigid Block)</span>
                </div>
              </div>

              {/* VIEW SELECTOR BUTTON GROUP */}
              <div className="flex border border-zinc-200 rounded-none overflow-hidden select-none bg-white font-mono" id="view-mode-tabs">
                <button
                  onClick={() => setSandboxView("PLAN")}
                  className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider transition-colors cursor-pointer text-center ${
                    sandboxView === "PLAN"
                      ? "bg-[#154212] text-white"
                      : "text-zinc-600 hover:bg-zinc-100"
                  }`}
                  id="btn-tab-plan"
                >
                  PLAN (PUNCHING)
                </button>
                <button
                  onClick={() => setSandboxView("SECTION")}
                  className={`flex-1 py-1.5 text-[10px] font-bold tracking-wider transition-colors cursor-pointer text-center ${
                    sandboxView === "SECTION"
                      ? "bg-[#154212] text-white"
                      : "text-zinc-600 hover:bg-zinc-100 border-l border-zinc-200"
                  }`}
                  id="btn-tab-section"
                >
                  ELEVATION (SBC)
                </button>
              </div>

            </div>

            {/* STRUCTURAL VIEWPORT GRAPHIC - PREMIUM LIGHT THEME */}
            <div className="lg:col-span-8 bg-zinc-50/50 border border-zinc-200 relative flex flex-col justify-between p-6 select-none shadow-3xs overflow-hidden min-h-[430px]" id="sandbox-viewport">
              
              {/* Subtle visual guide dots */}
              <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-80 pointer-events-none" />

              {/* Simple title strip */}
              <div className="flex justify-between items-center text-[9.5px] font-mono text-zinc-500 relative z-10 p-1.5 px-2.5 border border-zinc-200 bg-white/80 backdrop-blur-xs select-none" id="viewport-header-strip">
                <span className="font-bold tracking-wider text-zinc-650 uppercase">
                  {sandboxView === "PLAN" ? "STRUCTURAL PLAN & PUNCHING CRITICAL ZONE" : "ELEVATION PRESSURE GRADIENT MAPPING"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="font-medium text-zinc-400">IS 456 SAFETY REPORT:</span>
                  <span className={`font-bold uppercase tracking-wider ${
                    playpenMetrics.state === "SECURE" ? "text-emerald-700" :
                    playpenMetrics.state === "WARNING" ? "text-amber-600 font-bold" : "text-rose-600 font-black animate-pulse"
                  }`}>
                    {playpenMetrics.state === "SECURE" ? "PASS" : playpenMetrics.state}
                  </span>
                </span>
              </div>

              {/* DYNAMIC DRAWING COMPOSER */}
              <div className="h-72 w-full relative flex items-center justify-center py-2" id="rcc-svg-interactive-canvas">
                {sandboxView === "PLAN" ? (
                  // PLAN VIEW DRAWING
                  (() => {
                    // Footing outer box scales from width 1.5m to 4.0m, normalized around 200px
                    const baseWidthPx = 180;
                    const scaleFactor = footingWidth / 2.5; // normalized ratio around width=2.5m
                    const widthPx = Math.max(120, Math.min(240, baseWidthPx * scaleFactor));
                    
                    const leftX = 160 - widthPx / 2;
                    const topY = 110 - widthPx / 2;

                    // Column is always representing 300x300mm at center
                    // On scale: 300mm = 0.3m. Compared to width B
                    const colWidthPx = (0.3 / footingWidth) * widthPx;
                    const colLeftX = 160 - colWidthPx / 2;
                    const colTopY = 110 - colWidthPx / 2;

                    // Punching zone: Column size + d_effective (overall size in m: 0.3m + d_effective_m)
                    const d_m = playpenMetrics.d_effective / 1000;
                    const punchingWidthM = 0.3 + d_m;
                    const punchingWidthPx = (punchingWidthM / footingWidth) * widthPx;
                    const punchLeftX = 160 - punchingWidthPx / 2;
                    const punchTopY = 110 - punchingWidthPx / 2;

                    const isPunchingViolated = playpenMetrics.tau_vp > playpenMetrics.permissiblePunching;

                    return (
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 320 220" fill="none" id="live-rcc-composite-svg">
                        {/* Anchor background crosshair lines */}
                        <g stroke="#e4e4e7" strokeWidth="0.5" strokeDasharray="3,3">
                          <line x1="160" y1="0" x2="160" y2="220" />
                          <line x1="0" y1="110" x2="320" y2="110" />
                        </g>

                        {/* Concrete Footing Outer Square */}
                        <rect 
                          x={leftX} 
                          y={topY} 
                          width={widthPx} 
                          height={widthPx} 
                          fill="rgba(244,244,245,0.7)" 
                          stroke="#71717a" 
                          strokeWidth="2.5" 
                          rx="2" 
                        />

                        {/* Flexural Reinforcement Steel mesh grid lines inside footing (represenational outer ring) */}
                        <rect 
                          x={leftX + 8} 
                          y={topY + 8} 
                          width={widthPx - 16} 
                          height={widthPx - 16} 
                          fill="none" 
                          stroke="#154212" 
                          strokeWidth="1" 
                          strokeDasharray="4,2" 
                          opacity="0.6"
                        />

                        {/* Punching Shear Critical Zone boundary at d/2 */}
                        <rect 
                          x={punchLeftX} 
                          y={punchTopY} 
                          width={punchingWidthPx} 
                          height={punchingWidthPx} 
                          fill={isPunchingViolated ? "rgba(244,63,94,0.08)" : "none"} 
                          stroke={isPunchingViolated ? "#f43f5e" : "#eab308"} 
                          strokeWidth="1.5" 
                          strokeDasharray="4,4" 
                        />

                        {/* Concrete Column Block at Center */}
                        <rect 
                          x={colLeftX} 
                          y={colTopY} 
                          width={colWidthPx} 
                          height={colWidthPx} 
                          fill="#d4d4d8" 
                          stroke="#18181b" 
                          strokeWidth="2" 
                        />

                        {/* Technical dimension marks */}
                        {/* Footing width dimension label */}
                        <line x1={leftX} y1={topY + widthPx + 12} x2={leftX + widthPx} y2={topY + widthPx + 12} stroke="#71717a" strokeWidth="1" />
                        <line x1={leftX} y1={topY + widthPx + 8} x2={leftX} y2={topY + widthPx + 16} stroke="#71717a" strokeWidth="1" />
                        <line x1={leftX + widthPx} y1={topY + widthPx + 8} x2={leftX + widthPx} y2={topY + widthPx + 16} stroke="#71717a" strokeWidth="1" />
                        <text x="120" y={topY + widthPx + 24} fill="#52525b" fontSize="8.5" fontFamily="monospace" fontWeight="bold">Width B: {footingWidth.toFixed(1)}m</text>

                        {/* Punching zone dimension tag */}
                        <path d={`M ${punchLeftX} ${punchTopY} L 28 42 H 58`} stroke={isPunchingViolated ? "#ef4444" : "#eab308"} strokeWidth="1" />
                        <circle cx={punchLeftX} cy={punchTopY} r="2.5" fill={isPunchingViolated ? "#ef4444" : "#eab308"} />
                        <text x="10" y="34" fill={isPunchingViolated ? "#ef4444" : "#854d0e"} fontSize="8" fontFamily="monospace" fontWeight="bold">Punch perimeter (d/2)</text>

                        {/* Column dimension tag */}
                        <path d={`M ${colLeftX + colWidthPx} ${colTopY} L 285 45 H 245`} stroke="#27272a" strokeWidth="1" />
                        <circle cx={colLeftX + colWidthPx} cy={colTopY} r="2" fill="#27272a" />
                        <text x="248" y="37" fill="#18181b" fontSize="8.5" fontFamily="sans-serif" fontWeight="bold">300mm Col</text>
                      </svg>
                    );
                  })()
                ) : (
                  // ELEVATION VIEW DRAWING (SECTION)
                  (() => {
                    const isBearingViolated = playpenMetrics.soilPressure > soilSBC;
                    const depthScale = (footingThickness / 800) * 45;
                    
                    return (
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 320 220" fill="none" id="live-rcc-composite-svg-elevation">
                        {/* Anchor background crosshair lines */}
                        <g stroke="#e4e4e7" strokeWidth="0.5" strokeDasharray="3,3">
                          <line x1="160" y1="0" x2="160" y2="220" />
                          <line x1="0" y1="120" x2="320" y2="120" />
                        </g>

                        {/* Ground/Soil fill region */}
                        <rect x="10" y="120" width="300" height="90" fill="none" stroke="#e4e4e7" strokeWidth="0.5" />
                        <path d="M 10 120 H 310" stroke="#a1a1aa" strokeWidth="1" strokeDasharray="6,4" />

                        {/* Concrete Footing Elevation Block */}
                        {/* thickness scales relative to parameters */}
                        <rect 
                          x="50" 
                          y={120 - depthScale} 
                          width="220" 
                          height={depthScale} 
                          fill="rgba(244,244,245,0.85)" 
                          stroke="#71717a" 
                          strokeWidth="2.5" 
                        />

                        {/* Reinforcement Mesh bar line near the bottom */}
                        <line 
                          x1="58" 
                          y1={120 - 10} 
                          x2="262" 
                          y2={120 - 10} 
                          stroke="#154212" 
                          strokeWidth="2" 
                        />
                        {/* represent stirrup hook dots representing continuous distribution bars */}
                        <circle cx="70" cy={120 - 10} r="2.5" fill="#154212" />
                        <circle cx="110" cy={120 - 10} r="2.5" fill="#154212" />
                        <circle cx="160" cy={120 - 10} r="2.5" fill="#154212" />
                        <circle cx="210" cy={120 - 10} r="2.5" fill="#154212" />
                        <circle cx="250" cy={120 - 10} r="2.5" fill="#154212" />

                        {/* Column profile landing onto footing */}
                        <rect x="140" y="20" width="40" height={120 - depthScale - 20} fill="#e4e4e7" stroke="#3f3f46" strokeWidth="1.5" />

                        {/* Column Axial Load Force Vector Arrow pointing down */}
                        <line x1="160" y1="10" x2="160" y2={110 - depthScale} stroke="#df2a2a" strokeWidth="2.2" />
                        <polygon points={`156,${105 - depthScale} 160,${115 - depthScale} 164,${105 - depthScale}`} fill="#df2a2a" />
                        <text x="170" y="25" fill="#df2a2a" fontSize="8.5" fontFamily="monospace" fontWeight="bold">P = {axialLoad} kN</text>

                        {/* Soil Reacting Pressure upward vectors of soil upward resistance */}
                        {/* If soil stress exceeds safe capacity, vectors turn crimson warning red */}
                        <g stroke={isBearingViolated ? "#f43f5e" : "#154212"} strokeWidth="1.5">
                          {/* 7 Upward arrows */}
                          {[70, 100, 130, 160, 190, 220, 250].map((ptX, idx) => (
                            <g key={idx}>
                              <line x1={ptX} y1="150" x2={ptX} y2="123" />
                              <polygon points={`${ptX - 3},127 ${ptX},121 ${ptX + 3},127`} fill={isBearingViolated ? "#f43f5e" : "#154212"} />
                            </g>
                          ))}
                        </g>
                        <text x="75" y="165" fill={isBearingViolated ? "#df2a2a" : "#154212"} fontSize="8" fontFamily="monospace" fontWeight="bold">
                          Upward Reaction q: {playpenMetrics.soilPressure} kN/m²
                        </text>
                        <text x="75" y="177" fill="#52525b" fontSize="7.5" fontFamily="sans-serif">
                          (SBC Safe Limit: {soilSBC} kN/m²)
                        </text>

                        {/* Dimension tag for thickness D of concrete block */}
                        <line x1="38" y1={120 - depthScale} x2="38" y2="120" stroke="#71717a" strokeWidth="1" />
                        <line x1="34" y1={120 - depthScale} x2="42" y2={120 - depthScale} stroke="#71717a" strokeWidth="1" />
                        <line x1="34" y1="120" x2="42" y2="120" stroke="#71717a" strokeWidth="1" />
                        <text x="12" y="116" fill="#404040" fontSize="8" fontFamily="sans-serif">D: {footingThickness}mm</text>
                      </svg>
                    );
                  })()
                )}
              </div>

              {/* Interactive status alerts box */}
              <div className="bg-white border border-zinc-200 p-4 space-y-2 relative z-10 text-left" id="sandbox-verdict-box">
                <p className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5" id="verdict-header">
                  <BookOpen className="w-3.5 h-3.5 text-[#154212]" />
                  IS 456 SAFETY CALCULATION BALANCING
                </p>

                {playpenMetrics.state === "SECURE" ? (
                  <div className="text-[11.5px] leading-relaxed text-zinc-650 font-sans pl-3 border-l-2 border-emerald-500" id="secured-verdict">
                    <span className="font-bold text-emerald-800">Foundation fully safe!</span> Upward soil stress <span className="font-mono bg-zinc-100 text-zinc-900 px-1 font-bold">{playpenMetrics.soilPressure} kN/m²</span> complies with Safe Bearing Capacity. Punching shear ratio stress evaluates at <span className="font-mono bg-zinc-100 text-zinc-900 px-1 font-bold">{playpenMetrics.tau_vp} N/mm²</span> (<span className="text-zinc-400">Permissible: 1.25</span>).
                  </div>
                ) : (
                  <div className="space-y-1.5" id="alert-verdicts-list">
                    {playpenMetrics.violations.map((violation, vIdx) => (
                      <div key={vIdx} className="text-[11.5px] leading-relaxed text-rose-700 font-sans pl-3 border-l-2 border-rose-500 font-semibold">
                        ⚠️ Violation: {violation}
                      </div>
                    ))}
                    {playpenMetrics.guidance.map((guid, gIdx) => (
                      <div key={gIdx} className="text-[11.5px] leading-relaxed text-amber-700 font-sans pl-3 border-l-2 border-amber-500 font-medium">
                        💡 Guidance: {guid}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* TWO EXPLANATORY CARDS INSPIRED BY HERO INFO FOR PREMIUM FEEL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none pt-4" id="sandbox-informational-cards">
            <div className="p-5 bg-zinc-50 border border-zinc-200 space-y-2 text-left text-xs font-sans">
              <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#eab308]"></span>
                Clause 31.6.2.1 - Punching Shear Perimeter Safety
              </p>
              <p className="text-zinc-500 leading-relaxed text-[11.5px]">
                Isolated RCC footings under severe concentrated loading remain highly susceptible to two-way punching failures. The critical boundary is evaluated at half the effective depth (d/2) of the footing. Shear resistance must scale with your footing thickness.
              </p>
            </div>

            <div className="p-5 bg-zinc-50 border border-zinc-200 space-y-2 text-left text-xs font-sans">
              <p className="font-bold text-zinc-900 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#154212]"></span>
                Clause 34.1.2 - Bearing Base Distribution & Settlements
              </p>
              <p className="text-zinc-500 leading-relaxed text-[11.5px]">
                Foundations must cleanly dissipate superstructural stress down onto supporting soils without generating excessive pressure peaks. Actual bearing stress must remain comfortably below soil Safe Bearing Capacities (SBC) to prevent differential failure.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* FREQUENTLY ASKED QUESTIONS */}
      {/* -------------------------------------------------------------------- */}
      <section id="faq-section" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-zinc-200 select-text text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-4 space-y-4">
            <span className="text-[10px] uppercase font-mono font-black text-[#154212] tracking-widest block select-none">KNOWLEDGE INDEX</span>
            <h3 className="font-serif text-[30px] leading-tight font-normal text-zinc-900">
              Guideline & Platform FAQs
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans mr-4">
              Review how our structural reasoning parser matches constraints, checks CAD geometries, and handles developer API access keys.
            </p>
            <div className="select-none inline-flex items-center gap-2 text-zinc-400 font-mono text-[10px] uppercase font-bold pt-2.5 border-t border-zinc-150 w-full">
              <Lock className="w-3.5 h-3.5 text-[#154212]" />
              <span>Identity Protection Checked</span>
            </div>
          </div>

          {/* Accordion List */}
          <div className="lg:col-span-8 space-y-4 font-sans select-none">
            {faqData.map((faq, idx) => {
              const works = expandedFaq === idx;
              return (
                <div key={idx} className="bg-white border border-zinc-200 overflow-hidden transition-all">
                  <button
                    onClick={() => setExpandedFaq(works ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left font-serif text-[15.5px] font-bold text-zinc-900 cursor-pointer hover:bg-zinc-50/50 transition-colors"
                  >
                    <span className="pr-4 leading-tight">{faq.q}</span>
                    <span className="text-lg font-mono font-medium text-zinc-400 shrink-0">
                      {works ? "—" : "+"}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {works && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                      >
                        <div className="p-5 pt-0 text-xs md:text-sm text-zinc-550 leading-relaxed font-sans border-t border-zinc-100 select-text">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* FINAL CALL TO ACTION: GATEWAY PORTAL */}
      {/* -------------------------------------------------------------------- */}
      <section id="launch-cta" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 md:py-20 select-text text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-[#154212]/10 to-transparent p-10 md:p-14 border border-[#154212]/20 relative">
          
          <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-[#154212]"></div>
          <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-[#154212]"></div>
          <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-[#154212]"></div>
          <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-[#154212]"></div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-[#154212] font-mono select-none block">CERTIFIED WORKSPACE PORTAL</span>
          <h2 className="font-serif text-[34px] md:text-[40px] leading-tight font-normal text-zinc-900 mt-2.5">
            Initialize CivilOS engine.
          </h2>
          <p className="text-zinc-500 text-xs md:text-sm mt-3 leading-relaxed max-w-xl mx-auto font-sans">
            Ready to review structural models and prevent compliance drift? Register a credentials key to initialize the workspace instantly.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 select-none">
            <button
              onClick={() => onOpenAuth()}
              className="py-4 px-10 bg-zinc-950 hover:bg-zinc-850 text-white text-xs font-bold uppercase tracking-widest cursor-pointer transition-colors shadow-lg w-full sm:w-auto font-mono"
            >
              Verify Credentials Key
            </button>
          </div>

        </div>
      </section>

      {/* -------------------------------------------------------------------- */}
      {/* FOOTER */}
      {/* -------------------------------------------------------------------- */}
      <footer id="landing-footer" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 border-t border-zinc-200 select-none text-center">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 font-mono text-[10px] text-zinc-400">
          <div className="flex items-center gap-2.5 text-zinc-500">
            <ShieldCheck className="w-4 h-4 text-[#154212]" />
            <span className="font-bold uppercase tracking-wide">256-Bit TLS Regulation Certificate Secured</span>
          </div>
          <div className="text-zinc-500 uppercase font-black">
            CivilOS Technology Corp • Grounded Bureau of Indian Standards
          </div>
        </div>
      </footer>

    </div>
  );
}
