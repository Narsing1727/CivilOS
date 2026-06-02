import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Sparkles, 
  ArrowLeft, 
  ShieldCheck, 
  Zap, 
  Award, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Clock, 
  Compass, 
  Brain,
  MessageSquare,
  X,
  Send,
  Loader2,
  Sliders,
  Scaling,
  Hammer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface MaterialsSandboxProps {
  onBack: () => void;
  userName?: string;
  projectId?: string;
}

export function MaterialsSandbox({ onBack, userName = "Arjun R.", projectId = "NH-44 Bridge Design" }: MaterialsSandboxProps) {
  // Materials selection
  const [concreteGrade, setConcreteGrade] = useState<number>(30); // MPa fck (20, 25, 30, 35, 40, 50, 60)
  const [steelGrade, setSteelGrade] = useState<number>(500); // MPa fy (250, 415, 500, 550, 600)

  // Section Dimensions sliders
  const [beamWidth, setBeamWidth] = useState<number>(300); // mm (200 to 600)
  const [beamDepth, setBeamDepth] = useState<number>(450); // mm (300 to 1000)
  
  // Reinforcement configuration sliders
  const [rebarCount, setRebarCount] = useState<number>(4); // quantity (2, 3, 4, 6, 8)
  const [rebarSize, setRebarSize] = useState<number>(16); // mm diameter (12, 16, 20, 25, 32)
  const [nominalCover, setNominalCover] = useState<number>(40); // mm cover (20 to 60)

  // Live Shear Load demand slider
  const [shearDemand, setShearDemand] = useState<number>(120); // kN (0 to 400)

  // Ori chatbot variables 
  const [isOriOpen, setIsOriOpen] = useState(false);
  const [oriMessage, setOriMessage] = useState("");
  const [oriChatHistory, setOriChatHistory] = useState<Array<{ sender: "user" | "ori", text: string, list?: string[] }>>([
    { 
      sender: "ori", 
      text: `Hello ${userName}! I am **Ori**, your Materials and Cross-section Design Expert. I can assist you with optimizing the beam cross-section geometry under active loading demands.`,
      list: [
        "Ask me to explain the correlation between fck and permissible shear.",
        "Check how increasing the steel percentage changes the design shear capacity.",
        "Query advice on sizing a beam for a 350 kN shear loading."
      ]
    }
  ]);
  const [isOriLoading, setIsOriLoading] = useState(false);

  // Concrete Catalog Details
  const concreteCatalog = useMemo(() => [
    { grade: 20, description: "Nominal residential slabs and beams (Low load)", modulus: 22360, density: "24.5 kN/m³" },
    { grade: 25, description: "Standard reinforced concrete foundations and spans", modulus: 25000, density: "25.0 kN/m³" },
    { grade: 30, description: "Heavy infrastructure, medium-duty bridge decks", modulus: 27380, density: "25.0 kN/m³" },
    { grade: 40, description: "Prestressed bridge girders, high-performance slabs", modulus: 31620, density: "25.2 kN/m³" },
    { grade: 50, description: "Extreme load columns, urban expressways anchors", modulus: 35350, density: "25.5 kN/m³" },
    { grade: 60, description: "High-strength dense concrete piers (Specialist mix)", modulus: 38730, density: "26.0 kN/m³" }
  ], []);

  // Steel Rebar Catalog Details
  const steelCatalog = useMemo(() => [
    { grade: 250, name: "Mild Steel Fe250", description: "Ductile structural links and stirrups", strainLimit: "0.0031" },
    { grade: 415, name: "HYSD Rebar Fe415", description: "Standard structural concrete tension members", strainLimit: "0.0038" },
    { grade: 500, name: "TMT Rebar Fe500", description: "High strength thermal treated bridge/masonry rebars", strainLimit: "0.0042" },
    { grade: 550, name: "Super TMT Fe550", description: "Heavy seismic zones, corrosion resistant builds", strainLimit: "0.0044" },
    { grade: 600, name: "Ultra Rebar Fe600", description: "High strength piling joints and tall cores", strainLimit: "0.0046" }
  ], []);

  // Dynamic calculations as per IS 456 Code
  const sandboxCalculations = useMemo(() => {
    // 1. Calculate effective depth (d)
    const effectiveDepth = beamDepth - nominalCover - (rebarSize / 2);
    
    // 2. Cross-sectional Area
    const crossSectionArea = beamWidth * beamDepth; // mm²
    const crossSectionAreaM = crossSectionArea / 1000000; // m²

    // 3. Area of Steel Ast (tension face)
    const singleBarArea = Math.PI * (rebarSize * rebarSize) / 4;
    const totalAst = singleBarArea * rebarCount; // mm²

    // 4. Percentage of reinforcement pt = 100 * Ast / (b * d)
    const steelRatioPt = (100 * totalAst) / (beamWidth * effectiveDepth);

    // 5. Permissible Shear Stress capacity (tc) from IS 456 Table 19 limit values
    // Simplifed math approximation for Table 19 interpolating steel ratio and concrete strength
    let baseTc = 0.36; // M15 with nominal pt
    
    // Calculate factor based on concrete fck
    const fckFactor = Math.sqrt(concreteGrade / 25); // normalized around M25

    // Steel multiplier estimation
    let rationalSteelFactor = 0.36;
    if (steelRatioPt <= 0.15) rationalSteelFactor = 0.36;
    else if (steelRatioPt <= 0.25) rationalSteelFactor = 0.40;
    else if (steelRatioPt <= 0.50) rationalSteelFactor = 0.48;
    else if (steelRatioPt <= 0.75) rationalSteelFactor = 0.56;
    else if (steelRatioPt <= 1.00) rationalSteelFactor = 0.62;
    else if (steelRatioPt <= 1.50) rationalSteelFactor = 0.72;
    else if (steelRatioPt <= 2.00) rationalSteelFactor = 0.79;
    else rationalSteelFactor = 0.85;

    // Permissible shear stress
    const tcPermissible = Number((rationalSteelFactor * fckFactor).toFixed(3)); // N/mm²

    // Permissible Shear Force capacity of concrete block (Vc_allowable = tc * b * d / 15)
    // Convert to kN
    const VcConcreteCapacity = Number(((tcPermissible * beamWidth * effectiveDepth) / 1000).toFixed(1)); // kN

    // Yield strain limit
    const steelModulus = 200000; // MPa (2 * 10^5 N/mm²)
    const yieldStrain = Number(((steelGrade / (1.15 * steelModulus)) + 0.002).toFixed(5));

    // Dynamic warning evaluation
    const utilizationRatio = Number((shearDemand / VcConcreteCapacity).toFixed(3));
    let status: "SAFE" | "WARN" | "CRITICAL" = "SAFE";
    if (utilizationRatio > 1.0) status = "CRITICAL";
    else if (utilizationRatio > 0.8) status = "WARN";

    return {
      effectiveDepth,
      crossSectionArea,
      crossSectionAreaM,
      totalAst,
      steelRatioPt,
      tcPermissible,
      VcConcreteCapacity,
      yieldStrain,
      utilizationRatio,
      status
    };
  }, [concreteGrade, steelGrade, beamWidth, beamDepth, rebarCount, rebarSize, nominalCover, shearDemand]);

  // Handle Ori chatbot query
  const handleAskOri = async (presetPrompt?: string) => {
    const finalMsg = presetPrompt || oriMessage;
    if (!finalMsg.trim() || isOriLoading) return;

    setOriChatHistory(prev => [...prev, { sender: "user", text: finalMsg }]);
    setOriMessage("");
    setIsOriLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Materials Design Sandbox context: Active Concrete M${concreteGrade}, Active Steel Fe${steelGrade}, Beam dimensions ${beamWidth}x${beamDepth}mm with ${rebarCount} Nos rebar size ${rebarSize}mm. Ast = ${sandboxCalculations.totalAst.toFixed(0)}mm2. Steel percentage ratio = ${sandboxCalculations.steelRatioPt.toFixed(2)}%. Allowed shear Vc is ${sandboxCalculations.VcConcreteCapacity} kN under active shear demand load of ${shearDemand} kN. Utilization is ${(sandboxCalculations.utilizationRatio * 100).toFixed(1)}%. Answer this: ${finalMsg}`,
          chatHistory: []
        })
      });

      const data = await response.json();
      setOriChatHistory(prev => [
        ...prev, 
        { 
          sender: "ori", 
          text: data.text,
          list: data.sources ? ["Sources consulted:", ...data.sources] : undefined
        }
      ]);
    } catch (err) {
      setTimeout(() => {
        let text = "";
        let list: string[] = [];

        const query = finalMsg.toLowerCase();
        if (query.includes("fck") || query.includes("shear")) {
          text = `Based on your selected **M${concreteGrade} Concrete**, the shear capacity can be optimized by adjusting parameters:`;
          list = [
            `M${concreteGrade} provides high concrete truss strength, restricting the diagonal compression failure limit (Table 20) to ${concreteGrade >= 40 ? "4.0" : concreteGrade >= 30 ? "3.5" : "2.8"} N/mm².`,
            `Increasing the concrete grade to M50 or M60 would lift the shear permissible index from ${sandboxCalculations.tcPermissible} N/mm² higher.`,
            `Your calculated pure concrete shear capacity is **${sandboxCalculations.VcConcreteCapacity} kN**. If your load demand exceeds this, you must introduce shear stirrups (such as Fe${steelGrade} ties) to arrest diagonal cracks.`
          ];
        } else if (query.includes("steel") || query.includes("percentage") || query.includes("ast")) {
          text = `Tension steel ratio ($p_t$) heavily influences permissible shear strength ($\\tau_c$) because longitudinal rebars restrict crack width and help transfer shear via dowel action:`;
          list = [
            `Your steel Area ($A_{st}$) is **${sandboxCalculations.totalAst.toFixed(1)} mm²** yielding a steel ratio of **${sandboxCalculations.steelRatioPt.toFixed(3)}%**.`,
            `According to IS 456 Table 19, increasing the ratio to 1.00% or 1.20% by placing heavier rebars (e.g., 20mm or 25mm) will boost Concrete shear strength considerably.`,
            `Fe${steelGrade} Rebar yield strain is approximately **${sandboxCalculations.yieldStrain}** under factored limit load conditions, guaranteeing uniform tension transfer.`
          ];
        } else if (query.includes("beam") || query.includes("dimension") || query.includes("size")) {
          text = `Bending and shear capacities are inversely proportional to section sizing. I recommend the following section adjustments for load safety:`;
          list = [
            `Your beam section is **${beamWidth}mm x ${beamDepth}mm** (Area = ${sandboxCalculations.crossSectionAreaM.toFixed(3)} m²).`,
            `Increasing effective depth 'd' is the single most efficient way to boost shear capability (Vu limit runs on b · d).`,
            `Try sliding the beam depth to **550 mm** or **600 mm** to increase the permissible shear limit instantly and drop utilization well below 80% safety.`
          ];
        } else {
          text = `I have completed an engineering appraisal of the current design. The beam configuration is running at **${(sandboxCalculations.utilizationRatio * 100).toFixed(1)}% utilization** under a shear demand of ${shearDemand} kN. Feel free to adjust concrete grades, steel spacing, or dimensions to balance budget and safety!`;
          list = ["IS 456-2000 Material Guidelines", "CivilOS Mesh Compiler Logs"];
        }

        setOriChatHistory(prev => [...prev, { sender: "ori", text, list }]);
      }, 800);
    } finally {
      setIsOriLoading(false);
    }
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
              <Scaling className="w-3.5 h-3.5" />
              <span>CivilOS / Geometric sandbox</span>
            </div>
            <h1 className="font-serif text-[24px] md:text-[30px] font-bold tracking-tight text-zinc-950 mt-1">
              Structural Materials & Section Selector Sandbox
            </h1>
          </div>
        </div>

        <div className="mt-4 md:mt-0 flex gap-3 text-right font-mono text-[9.5px] items-center text-zinc-450">
          <div className="bg-white px-3 py-1.5 border border-zinc-200/80">
            <span>STRESS METRICS METHOD: </span>
            <strong className="text-zinc-800 font-bold">LIMIT STATE DESIGN</strong>
          </div>
          <div className="bg-zinc-900 text-white px-3 py-1.5 font-bold">
            GEOMETRIC SANDBOX
          </div>
        </div>
      </header>

      {/* ----------------- CORE WORKSPACE GRID ----------------- */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: DIMENSION CONFIGURATORS & CATALOGS (7 Columns) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          
          {/* MATERIAL CATALOG CHOOSER GRAPHICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Concrete fck Catalog */}
            <div className="bg-white p-5 border border-zinc-200 shadow-3xs text-left">
              <span className="text-[9px] font-mono text-[#154212] font-black uppercase tracking-wider block border-b pb-2">
                CONCRETE MIX STRENGTH CATALOG
              </span>
              
              <div className="grid grid-cols-3 gap-2 mt-4 select-none">
                {[20, 25, 30, 40, 50, 60].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setConcreteGrade(grade)}
                    className={`p-2.5 border transition-all text-center cursor-pointer ${
                      concreteGrade === grade 
                        ? "bg-[#154212] border-[#154212] text-white shadow-3xs" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <p className="font-serif text-sm font-extrabold leading-none">M {grade}</p>
                    <p className="text-[8.5px] font-mono mt-1 opacity-75">{grade} MPa</p>
                  </button>
                ))}
              </div>

              {/* Description of active mix */}
              {(() => {
                const activeMix = concreteCatalog.find(c => c.grade === concreteGrade) || concreteCatalog[0];
                return (
                  <div className="mt-4 p-3 bg-zinc-50/70 border border-zinc-150 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-900 font-sans">{activeMix.description}</p>
                    <div className="flex justify-between font-mono text-[9px] text-zinc-400 pt-1 border-t border-dashed border-zinc-200">
                      <span>ELASTIC MODULUS: ~{activeMix.modulus} MPa</span>
                      <span>DENSITY: {activeMix.density}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Steel fy Catalog */}
            <div className="bg-white p-5 border border-zinc-200 shadow-3xs text-left">
              <span className="text-[9px] font-mono text-zinc-400 font-black uppercase tracking-wider block border-b pb-2">
                STEEL REBAR GRADE CATALOG
              </span>

              <div className="grid grid-cols-3 gap-2 mt-4 select-none">
                {[250, 415, 500, 550, 600].map((grade) => (
                  <button
                    key={grade}
                    onClick={() => setSteelGrade(grade)}
                    className={`p-2.5 border transition-all text-center cursor-pointer ${
                      steelGrade === grade 
                        ? "bg-zinc-900 border-zinc-900 text-white shadow-3xs" 
                        : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    <p className="font-serif text-sm font-extrabold leading-none">Fe {grade}</p>
                    <p className="text-[8.5px] font-mono mt-1 opacity-75">{grade} MPa</p>
                  </button>
                ))}
              </div>

              {/* Description of steel rebar */}
              {(() => {
                const activeSteel = steelCatalog.find(s => s.grade === steelGrade) || steelCatalog[2];
                return (
                  <div className="mt-4 p-3 bg-zinc-50/70 border border-zinc-150 space-y-1">
                    <p className="text-[11px] font-bold text-zinc-900 font-sans">{activeSteel.name}</p>
                    <p className="text-[10.5px] text-zinc-400 font-sans">{activeSteel.description}</p>
                    <div className="pt-1 border-t border-dashed border-zinc-200 font-mono text-[9px] text-zinc-400">
                      LIMIT TENSION STRAIN CEILING: ≤ {activeSteel.strainLimit}
                    </div>
                  </div>
                );
              })()}
            </div>

          </div>

          {/* CUSTOM GEOMETRIC DIMENSION CONFIGURATORS */}
          <div className="bg-white border border-zinc-200 p-6 shadow-3xs text-left space-y-6">
            <span className="text-[10px] uppercase font-mono font-black text-[#154212] tracking-widest block border-b pb-2">
              BEAM CROSS-SECTION GEOMETRY CONTROLS
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Width (b) slider */}
              <div className="bg-zinc-50/60 p-4 border border-zinc-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-zinc-500 uppercase">1. BEAM WIDTH (b)</span>
                  <span className="text-sm font-bold text-zinc-900 bg-white border border-zinc-200 px-2 py-0.5">{beamWidth} mm</span>
                </div>
                <input 
                  type="range" min="200" max="600" step="25"
                  value={beamWidth}
                  onChange={(e) => setBeamWidth(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 cursor-pointer accent-[#154212]"
                />
                <div className="flex justify-between text-[8px] font-mono text-zinc-400">
                  <span>200 mm (Narrow stirrups)</span>
                  <span>400 mm</span>
                  <span>600 mm (Super Spreader Span)</span>
                </div>
              </div>

              {/* Depth (D) slider */}
              <div className="bg-zinc-50/60 p-4 border border-zinc-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-zinc-500 uppercase">2. OVERALL DEPTH (D)</span>
                  <span className="text-sm font-bold text-zinc-900 bg-white border border-zinc-200 px-2 py-0.5">{beamDepth} mm</span>
                </div>
                <input 
                  type="range" min="300" max="1000" step="50"
                  value={beamDepth}
                  onChange={(e) => setBeamDepth(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-zinc-200 cursor-pointer accent-[#154212]"
                />
                <div className="flex justify-between text-[8px] font-mono text-zinc-400">
                  <span>300 mm (Shallow beam)</span>
                  <span>650 mm</span>
                  <span>1000 mm (Prestressed girder block)</span>
                </div>
              </div>

              {/* Longitudinal Rebar count */}
              <div className="bg-zinc-50/60 p-4 border border-zinc-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-zinc-500 uppercase">3. REBAR COUNT (Tension Zone)</span>
                  <span className="text-sm font-bold text-zinc-900 bg-white border border-zinc-200 px-2 py-0.5">{rebarCount} Nos</span>
                </div>
                <div className="grid grid-cols-5 gap-2 select-none">
                  {[2, 3, 4, 6, 8].map((num) => (
                    <button
                      key={num}
                      onClick={() => setRebarCount(num)}
                      className={`text-center py-2 border transition-colors text-xs font-bold font-mono cursor-pointer ${
                        rebarCount === num 
                          ? "bg-[#154212] border-[#154212] text-white" 
                          : "bg-white border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rebar Diameter size */}
              <div className="bg-zinc-50/60 p-4 border border-zinc-200 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold text-zinc-500 uppercase">4. REBAR SIZE (Φ)</span>
                  <span className="text-sm font-bold text-zinc-900 bg-white border border-zinc-200 px-2 py-0.5">{rebarSize} mm</span>
                </div>
                <div className="grid grid-cols-5 gap-2 select-none">
                  {[12, 16, 20, 25, 32].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setRebarSize(sz)}
                      className={`text-center py-2 border transition-colors text-xs font-bold font-mono cursor-pointer ${
                        rebarSize === sz 
                          ? "bg-[#154212] border-[#154212] text-white" 
                          : "bg-white border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {sz}Φ
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* REBAR DATA LOGGING SUMMARIES */}
          <div className="bg-white border border-zinc-200 p-5 shadow-3xs text-left grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-[11px] leading-relaxed">
            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-400 block uppercase font-bold">STEEL AREA (As)</span>
              <p className="text-sm font-extrabold text-zinc-950 font-sans">
                {sandboxCalculations.totalAst.toFixed(1)} mm²
              </p>
              <p className="text-[10px] text-zinc-450 leading-tight">Calculated as {rebarCount} × π({rebarSize}²)/4</p>
            </div>

            <div className="space-y-1 border-y md:border-y-0 md:border-x border-zinc-150 py-3 md:py-0 md:px-6">
              <span className="text-[8.5px] text-zinc-400 block uppercase font-bold">STEEL RATIO (p_t)</span>
              <p className="text-sm font-extrabold text-zinc-950 font-sans">
                {sandboxCalculations.steelRatioPt.toFixed(3)} %
              </p>
              <p className="text-[10px] text-zinc-450 leading-tight">Mandated range 0.15% to 4.0% class bounds</p>
            </div>

            <div className="space-y-1 md:pl-3">
              <span className="text-[8.5px] text-zinc-400 block uppercase font-bold">CONCRETE VOL WEIGHT</span>
              <p className="text-sm font-extrabold text-zinc-800 font-sans">
                {(sandboxCalculations.crossSectionAreaM * 25).toFixed(2)} kN/m
              </p>
              <p className="text-[10px] text-zinc-450 leading-tight">Dead weight per meter at standard density</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: REAL-TIME GRAPHICS STRESS CAPACITY FEED (4 Columns) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          
          {/* BEAM DYNAMIC DRAWING COMPOSER */}
          <div className="bg-white border border-zinc-200 p-6 shadow-3xs text-left select-none relative">
            <span className="text-[9px] font-mono text-zinc-450 uppercase tracking-widest block border-b pb-2">
              REAL-TIME GEOMETRIC OUTLINE
            </span>
            
            {/* Drawing viewport canvas backgrid */}
            <div className="mt-4 p-4 bg-zinc-50 border border-zinc-200 flex flex-col justify-center items-center h-72 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1.2px,transparent_1.2px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

              {/* Rescaling 2D cross-section diagram SVG */}
              {(() => {
                // Outer boundaries base sizes, scaling within 180px
                const dScale = beamDepth / 850; // max around 1000
                const bScale = beamWidth / 550; // max around 600

                const svgH = Math.max(100, Math.min(200, 160 * dScale));
                const svgW = Math.max(60, Math.min(160, 100 * bScale));

                const x0 = 110 - svgW / 2;
                const y0 = 110 - svgH / 2;

                // Covers px estimation (scaled)
                const coverPx = (nominalCover / beamDepth) * svgH;

                // Rebar placement (ension zone bottom edge)
                const tensionRebarY = y0 + svgH - coverPx;

                // Color index for concrete density based on grade
                let concreteColor = "#ecebeb";
                if (concreteGrade === 40) concreteColor = "#dbdbdb";
                else if (concreteGrade === 50) concreteColor = "#cbcbcb";
                else if (concreteGrade === 60) concreteColor = "#bcbcbc";

                return (
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 220 220" fill="none">
                    {/* Beam Concrete block */}
                    <rect 
                      x={x0} y={y0} 
                      width={svgW} height={svgH} 
                      fill={concreteColor} 
                      stroke="#4b4b4b" 
                      strokeWidth="2.5" 
                    />
                    
                    {/* Cover guide lines (bottom tension) */}
                    <line 
                      x1={x0 + coverPx} y1={tensionRebarY} 
                      x2={x0 + svgW - coverPx} y2={tensionRebarY} 
                      stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="3,2" 
                    />

                    {/* Left & Right vertical lines representation for loops ties */}
                    <rect 
                      x={x0 + 8} y={y0 + 8} 
                      width={svgW - 16} height={svgH - 16} 
                      fill="none" 
                      stroke="#154212" strokeWidth="1.2" 
                    />

                    {/* Tension zone Longitudinal main rebar bubbles */}
                    {rebarCount >= 2 && (
                      <g fill="#154212" stroke="#ffffff" strokeWidth="1">
                        {/* Left corner */}
                        <circle cx={x0 + coverPx + 4} cy={tensionRebarY} r={Math.min(7, 3 + rebarSize / 6)} />
                        {/* Right corner */}
                        <circle cx={x0 + svgW - coverPx - 4} cy={tensionRebarY} r={Math.min(7, 3 + rebarSize / 6)} />
                        
                        {/* Intermediate rebar points */}
                        {rebarCount >= 3 && (
                          <circle cx={x0 + (svgW / 2)} cy={tensionRebarY} r={Math.min(7, 3 + rebarSize / 6)} />
                        )}
                        {rebarCount >= 4 && (
                          <>
                            <circle cx={x0 + coverPx + (svgW - coverPx * 2) * 0.33} cy={tensionRebarY} r={Math.min(7, 3 + rebarSize / 6)} />
                            <circle cx={x0 + coverPx + (svgW - coverPx * 2) * 0.66} cy={tensionRebarY} r={Math.min(7, 3 + rebarSize / 6)} />
                          </>
                        )}
                      </g>
                    )}

                    {/* Dimension arrows text labels */}
                    <text x="110" y={y0 - 8} fill="#27272a" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">b={beamWidth}mm</text>
                    
                    {/* Vertical depth annotation */}
                    <path d={`M${x0 - 15} ${y0} L${x0 - 15} ${y0 + svgH}`} stroke="#52525b" strokeWidth="0.7" />
                    <line x1={x0 - 18} y1={y0} x2={x0 - 12} y2={y0} stroke="#52525b" strokeWidth="0.8" />
                    <line x1={x0 - 18} y1={y0 + svgH} x2={x0 - 12} y2={y0 + svgH} stroke="#52525b" strokeWidth="0.8" />
                    <text x={x0 - 22} y={y0 + svgH / 2} fill="#27272a" fontSize="8" fontFamily="monospace" textAnchor="end" fontWeight="bold">D={beamDepth}</text>
                  </svg>
                );
              })()}

              <div className="absolute bottom-2 inset-x-2 bg-white/95 border px-2 py-1 text-[8px] font-mono text-zinc-500 rounded-none flex justify-between">
                <span>CONCRETE DENSITY LEVEL: CLASS M{concreteGrade}</span>
                <span>Ast REBAR: {rebarCount}Nos × {rebarSize}Φ</span>
              </div>
            </div>
          </div>

          {/* ACTIVE DISCREPANCY STRESS METERS AND SAFETY GAUGES (Feature 3) */}
          <div className="bg-white border border-zinc-200 p-5 shadow-3xs text-left space-y-4">
            
            <div className="border-b border-zinc-150 pb-2">
              <span className="text-[9px] font-mono text-[#154212] font-bold uppercase tracking-wider block">STRESS METERS & UTILIZATION</span>
              <h4 className="font-serif text-sm font-bold text-zinc-950 mt-0.5">Permissible Concrete Shear Limit</h4>
            </div>

            {/* Stress capacity permissible Tau_c text output */}
            <div className="flex justify-between items-baseline font-mono text-xs text-zinc-550 border-b border-dashed pb-2">
              <span>Permissible stress (τ_c Limit):</span>
              <span className="text-sm font-black text-zinc-950 bg-zinc-50 border border-zinc-250 px-2 py-0.5">
                {sandboxCalculations.tcPermissible} N/mm²
              </span>
            </div>

            {/* Structural Vc Capacity Force bar */}
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between font-bold">
                <span className="text-zinc-500 uppercase">Ultimate Concrete Capacity (Vc):</span>
                <span className="text-zinc-900">{sandboxCalculations.VcConcreteCapacity} kN</span>
              </div>
              <p className="text-[9.5px] leading-snug text-zinc-400 font-sans">
                Computed concrete safe threshold base force: {sandboxCalculations.tcPermissible}N/mm² × width × effDepth / 1000.
              </p>
            </div>

            {/* DYNAMIC VARIABLE DEMAND SLIDER */}
            <div className="bg-zinc-50 p-3.5 border border-zinc-200 space-y-3 font-mono">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Shear Loading demand (Vu)</span>
                <span className="text-xs font-black text-[#154212]">{shearDemand} kN</span>
              </div>
              <input 
                type="range" min="0" max="400" step="10"
                value={shearDemand}
                onChange={(e) => setShearDemand(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-200 accent-[#1a1c1c] cursor-pointer"
              />
            </div>

            {/* STRESS CAPACITY GAUGE PROGRESS BAR AND WARNING ALERT WINDOW */}
            <div className="space-y-2 font-mono text-[10px]">
              <div className="flex justify-between font-bold">
                <span>CAPACITY UTILIZATION GAUGE:</span>
                <span className={
                  sandboxCalculations.status === "CRITICAL" ? "text-rose-600 font-black" :
                  sandboxCalculations.status === "WARN" ? "text-amber-600 font-bold" : "text-emerald-700"
                }>
                  {(sandboxCalculations.utilizationRatio * 100).toFixed(1)}%
                </span>
              </div>

              {/* Stress Gauge Bar */}
              <div className="h-2.5 w-full bg-zinc-100 border border-zinc-200 rounded-none overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-300 relative ${
                    sandboxCalculations.status === "CRITICAL" ? "bg-rose-500" :
                    sandboxCalculations.status === "WARN" ? "bg-amber-500" : "bg-[#154212]"
                  }`}
                  style={{ width: `${Math.min(100, sandboxCalculations.utilizationRatio * 100)}%` }}
                />
              </div>

              {/* Warnings and compliance outputs */}
              <div className={`p-3 text-[10px] select-all leading-relaxed ${
                sandboxCalculations.status === "CRITICAL" ? "bg-rose-50 text-rose-800 border border-rose-200" :
                sandboxCalculations.status === "WARN" ? "bg-amber-50 text-amber-800 border border-amber-200" :
                "bg-emerald-50 text-emerald-800 border border-emerald-250"
              }`}>
                {sandboxCalculations.status === "CRITICAL" ? (
                  <p className="font-sans">
                    <strong>[DANGER EXCEEDED]:</strong> Shear active demand load ({shearDemand} kN) exceeds pure concrete strength limit ({sandboxCalculations.VcConcreteCapacity} kN). Beam will collapse in shear under limit state loads. You MUST increase concrete dimensions or specify closely spaced shear stirrups!
                  </p>
                ) : sandboxCalculations.status === "WARN" ? (
                  <p className="font-sans">
                    <strong>[WARNING LIMITS]:</strong> Capacity is running close to the critical threshold ({utilizationRatioPercent(sandboxCalculations.utilizationRatio)}%). Reinforcing steel optimization is advised to guarantee reliable structural safety margins.
                  </p>
                ) : (
                  <p className="font-sans">
                    <strong>[SECURE DESIGN]:</strong> Design cross-section behaves elastically and resists shear loads cleanly. Perfect concrete selection and volumetric integrity.
                  </p>
                )}
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
          className="w-14 h-14 rounded-full bg-zinc-950 text-white flex items-center justify-center shadow-lg hover:shadow-2xl hover:bg-neutral-850 cursor-pointer transition-all border-2 border-white animate-pulse"
          title="Open Ori AI Materials Advisor"
        >
          <div className="relative">
            <Brain className="w-6 h-6 text-white" />
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
                  <div className="w-7 h-7 bg-zinc-900 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <h5 className="font-serif text-sm font-bold text-zinc-950">Ori Materials Consult</h5>
                    <p className="text-[8.5px] uppercase tracking-wider text-zinc-400 font-mono font-bold">Concrete & Sections AI Co-Pilot</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsOriOpen(false)}
                  className="p-1 hover:bg-zinc-100 text-zinc-405 hover:text-zinc-800 cursor-pointer transition-colors"
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
                      {msg.sender === "user" ? "Designer (You)" : "Ori Material Assistant"}
                    </span>
                    
                    <div className={`p-3.5 text-xs h-auto select-text leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-[#154212] text-white" 
                        : "bg-zinc-50 border border-zinc-200 text-zinc-850"
                    }`}>
                      <p className="whitespace-pre-line leading-relaxed font-sans">{msg.text}</p>
                      
                      {msg.list && msg.list.length > 0 && (
                        <ul className="mt-2.5 space-y-1.5 border-t border-zinc-200 pt-2 text-[11px] font-sans">
                          {msg.list.map((li, i) => (
                            <li key={i} className="flex items-start gap-1 text-zinc-650">
                              <span className="text-[#154212] font-black shrink-0 mt-0.5">•</span>
                              <span>{li}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}

                {isOriLoading && (
                  <div className="flex gap-2 items-center text-xs text-zinc-400 font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Ori is calculating section stresses...</span>
                  </div>
                )}
              </div>

              {/* Quick Preset Prompts Buttons */}
              <div className="p-4 bg-zinc-50 border-t border-zinc-200/70 space-y-2 select-none">
                <span className="text-[8px] font-mono text-zinc-400 uppercase font-black tracking-widest block text-left">QUICK VARIABLE QUERY</span>
                <div className="flex gap-1.5 flex-wrap overflow-x-auto py-0.5 font-mono text-[8.5px]">
                  <button 
                    onClick={() => handleAskOri(`Calculate active concrete capacity under M${concreteGrade}?`)}
                    className="bg-white border border-zinc-200 py-1.5 px-2.5 text-zinc-650 hover:bg-zinc-100 uppercase tracking-tight cursor-pointer"
                  >
                    Concrete Stress
                  </button>
                  <button 
                    onClick={() => handleAskOri(`Explain how steel ratio Ast percentage affects shear strength?`)}
                    className="bg-white border border-zinc-200 py-1.5 px-2.5 text-zinc-650 hover:bg-zinc-100 uppercase tracking-tight cursor-pointer"
                  >
                    Ast Steel percentage
                  </button>
                  <button 
                    onClick={() => handleAskOri("Suggest dimensions to resist high shear force safely?")}
                    className="bg-white border border-zinc-200 py-1.5 px-2.5 text-zinc-650 hover:bg-zinc-100 uppercase tracking-tight cursor-pointer"
                  >
                    Beam Sizing design
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
                  placeholder="Ask Ori to analyze other section modifications..."
                  className="flex-1 bg-white border border-zinc-200 text-xs px-3 py-2 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212]"
                />
                <button
                  onClick={() => handleAskOri()}
                  className="px-3 py-2 bg-zinc-950 hover:bg-neutral-850 text-white flex items-center justify-center cursor-pointer rounded-none shadow-3xs"
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

// Utility formatting helper
function utilizationRatioPercent(ratio: number): string {
  return (ratio * 100).toFixed(1);
}
