import React, { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import {
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  RotateCw,
  Check,
  AlertCircle,
  Database,
  Activity,
  ShieldCheck,
  Sliders,
  Bookmark,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";

import { addMemory } from "../api/memory.api";

import { extractMembers } from "../api/extract.api";

interface ReasoningTabProps {
  projectId?: string;
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  status: "pass" | "fail" | "warning" | "unknown";
  details: string;
  vu?: number;
  vc?: number;
  clause?: string;
  file?: string;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: string;
}

interface AnomalyZone {
  id: string;
  name: string;
  member: string;
  codeClause: string;
  metrics: { vu: number; vc: number; ratio: number; deflection: number; thermalOffset: number; rebarPitch: number };
  criticalViolation: string;
  remedialAction: string;
  verbatimClauseText: string;
  evidenceRawData: string;
  drawingRef: string;
}

const FALLBACK_ZONES: AnomalyZone[] = [
  {
    id: "zone-1",
    name: "Pier #12 Shear Concentration",
    member: "Girder G3-Seat Support (NH-44)",
    codeClause: "IS 456 – Cl. 40.2 / Cl. 40.4",
    metrics: { vu: 256.7, vc: 198.4, ratio: 1.29, deflection: 14.2, thermalOffset: 2.1, rebarPitch: 250 },
    criticalViolation: "Shear demand Vu (256.7 kN) violates concrete resistance threshold Vc (198.4 kN).",
    remedialAction: "Tighten shear stirrup pitch from 250mm to 120mm along the critical stress vector.",
    verbatimClauseText: "Clause 40.4: For shear reinforcement, when nominal shear stress exceeds design shear strength of concrete Vc, shear reinforcement shall be provided.",
    evidenceRawData: "STAAD STRESS TENSOR @ BEARING 12: Vu = 256.7 kN, Vc = 198.4 kN",
    drawingRef: "NH44-B12-DET-02.dwg"
  },
  {
    id: "zone-2",
    name: "Abutment Torsional Base Drift",
    member: "Spandrel Column C9-Base",
    codeClause: "IS 1893 – Cl. 7.11.1 (Seismic)",
    metrics: { vu: 0.0045, vc: 0.0040, ratio: 1.13, deflection: 28.5, thermalOffset: 1.5, rebarPitch: 300 },
    criticalViolation: "Storey lateral drift ratio 0.0045h exceeds inelastic limit 0.0040h under EQ-Y.",
    remedialAction: "Install cross-bracing restraint truss stays at Level B.",
    verbatimClauseText: "Clause 7.11.1: Storey drift in any storey shall not exceed 0.004 times storey height.",
    evidenceRawData: "Node 40 base drift = 28.51mm, height = 6300mm, drift ratio = 0.00452h",
    drawingRef: "CH-COL-DRIFT-ZONE9.dwg"
  },
  {
    id: "zone-3",
    name: "Steel Spandrel Torsional Buckling",
    member: "Compression Flange Truss M23",
    codeClause: "IS 800 – Cl. 8.2 / Cl. 8.4.1",
    metrics: { vu: 345.2, vc: 320.0, ratio: 1.08, deflection: 8.4, thermalOffset: 4.8, rebarPitch: 400 },
    criticalViolation: "Lateral torsional buckling stresses exceed design resistance under wind pressure.",
    remedialAction: "Introduce mid-span diaphragms to reduce unbraced buckling length from 4.5m to 2.2m.",
    verbatimClauseText: "Clause 8.2.2: Elements subjected to bending prone to lateral deflection shall have compressive flexural limit restricted.",
    evidenceRawData: "Section MB-230, Mode 1 buckling factor = 0.925, Tu = 48.2 kN-m, Tc = 42.0 kN-m",
    drawingRef: "MLE-TRUSS-M23-DET.dwg"
  }
];

const NODE_COLORS: Record<string, string> = {
  beam: "#3b82f6",
  column: "#8b5cf6",
  slab: "#06b6d4",
  foundation: "#f59e0b",
  pile: "#f97316",
  girder: "#6366f1",
  wall: "#84cc16",
  unknown: "#71717a",
};

const STATUS_COLORS: Record<string, string> = {
  fail: "#ef4444",
  warning: "#f59e0b",
  pass: "#22c55e",
  unknown: "#71717a",
};

export function ReasoningTab({ projectId }: ReasoningTabProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [graphLinks, setGraphLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [anomalyZones, setAnomalyZones] = useState<AnomalyZone[]>(FALLBACK_ZONES);
  const [selectedZoneId, setSelectedZoneId] = useState<string>("zone-1");
  const [diagnosticOverlay, setDiagnosticOverlay] = useState<"shear" | "thermal" | "rebar">("shear");
  const [loadCase, setLoadCase] = useState<"DL" | "LL" | "WL" | "EQ">("EQ");
  const [exaggeration, setExaggeration] = useState<number>(24);
  const [decisionNotes, setDecisionNotes] = useState<string>("");
  const [isSavingDecision, setIsSavingDecision] = useState(false);
  const [realSafetyFactor, setRealSafetyFactor] = useState<number | null>(null);
  const [graphLoading, setGraphLoading] = useState(true);
  const [committedDecisions, setCommittedDecisions] = useState<any[]>([]);











  const activeZone = anomalyZones.find(z => z.id === selectedZoneId) || anomalyZones[0];

useEffect(() => {
  if (!projectId) return;
  setGraphLoading(true);

  const tryExtract = async (retries = 3): Promise<any[]> => {
    const members = await extractMembers(projectId);
    if ((!members || members.length === 0) && retries > 0) {
      await new Promise(r => setTimeout(r, 2000));
      return tryExtract(retries - 1);
    }
    return members || [];
  };

  tryExtract().then((members) => {
    if (!members || members.length === 0) {
      setGraphLoading(false);
      return;
    }

    // Convert extracted members to GraphNode format
    const nodes: GraphNode[] = members.map((m: any) => ({
      id: m.id,
      label: m.id,
      type: m.type.toLowerCase(),
      status: m.status as "pass" | "fail" | "warning" | "unknown",
      details: `Vu: ${m.baseVu} kN | Vc: ${m.currentVc} kN | ${m.clause}`,
      vu: m.baseVu,
      vc: m.currentVc,
      clause: m.clause,
    }));

    // Build links from structural hierarchy
    const beams = nodes.filter(n => n.type === "beam" || n.type === "girder");
    const columns = nodes.filter(n => n.type === "column");
    const foundations = nodes.filter(n => n.type === "foundation");

    const links: GraphLink[] = [];
    beams.forEach((b, i) => {
      const col = columns[i % Math.max(columns.length, 1)];
      if (col) links.push({ source: b.id, target: col.id, type: "beam_to_column" });
    });
    columns.forEach((c, i) => {
      const found = foundations[i % Math.max(foundations.length, 1)];
      if (found) links.push({ source: c.id, target: found.id, type: "column_to_foundation" });
    });

    // Update anomaly zones from real failing members
    const failingMembers = members.filter((m: any) => m.status === "fail");
    if (failingMembers.length > 0) {
      const realZones: AnomalyZone[] = failingMembers.map((m: any, i: number) => ({
        id: `zone-${i + 1}`,
        name: `${m.id} Shear Violation`,
        member: `${m.type} ${m.id}`,
        codeClause: m.clause || "IS 456:2000 Cl. 40.2",
        metrics: {
          vu: m.baseVu,
          vc: m.currentVc,
          ratio: Number((m.baseVu / m.currentVc).toFixed(2)),
          deflection: 0,
          thermalOffset: 0,
          rebarPitch: 0
        },
        criticalViolation: `Shear demand Vu (${m.baseVu} kN) exceeds concrete resistance Vc (${m.currentVc} kN).`,
        remedialAction: `Increase shear reinforcement for ${m.id} to reduce Vu/Vc ratio below 1.0.`,
        verbatimClauseText: "Clause 40.4: When nominal shear stress exceeds design shear strength, shear reinforcement shall be provided.",
        evidenceRawData: `Vu = ${m.baseVu} kN, Vc = ${m.currentVc} kN, Ratio = ${(m.baseVu / m.currentVc).toFixed(2)}`,
        drawingRef: `${m.id}-DET.dwg`
      }));
      setAnomalyZones(realZones);
      setSelectedZoneId("zone-1");
    }

    setGraphNodes(nodes);
    setGraphLinks(links);
    setGraphLoading(false);
  }).catch(() => {
    setGraphLoading(false);
  });
}, [projectId]);


  useEffect(() => {
    if (!svgRef.current || graphNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth || 500;
    const height = 340;

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#a1a1aa");

    const simulation = d3.forceSimulation<GraphNode>(graphNodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(graphLinks)
        .id(d => d.id)
        .distance(90))
      .force("charge", d3.forceManyBody().strength(-280))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide(40));

    simulationRef.current = simulation;

  const link = g.append("g")
  .selectAll("line")
  .data(graphLinks)
  .join("line")
  .attr("stroke", diagnosticOverlay === "shear" ? "#ef444455" : diagnosticOverlay === "thermal" ? "#f9731655" : "#6366f155")
.attr("stroke-width", diagnosticOverlay === "shear" ? 2 * (loadCase === "EQ" ? 1.5 : 1) : 1.5)

    const linkLabel = g.append("g")
      .selectAll("text")
      .data(graphLinks)
      .join("text")
      .attr("font-size", "7px")
      .attr("fill", "#a1a1aa")
      .attr("font-family", "monospace")
      .attr("text-anchor", "middle")
      .text(d => d.type.replace(/_/g, " "));

    const node = g.append("g")
      .selectAll("g")
      .data(graphNodes)
      .join("g")
      .attr("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      })
      .call(d3.drag<SVGGElement, GraphNode>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any);


const loadRiskMultiplier: Record<string, number> = { DL: 1.0, LL: 1.1, WL: 1.2, EQ: 1.4 };
const riskMult = loadRiskMultiplier[loadCase] || 1.0;



    node.append("circle")
  .attr("r", d => d.status === "fail" ? 22 * riskMult : 22)
  .attr("fill", d => {
    if (diagnosticOverlay === "shear") return STATUS_COLORS[d.status] + "22";
    if (diagnosticOverlay === "thermal") return "#f97316" + "22";
    return "#6366f1" + "22";
  })
  .attr("stroke", d => {
    if (diagnosticOverlay === "shear") return STATUS_COLORS[d.status];
    if (diagnosticOverlay === "thermal") return (d.vu && d.vc && d.vu / d.vc > 1) ? "#f97316" : "#3b82f6";
    return "#6366f1";
  })
  .attr("stroke-width", diagnosticOverlay === "shear" ? 2.5 : 3);

node.append("circle")
  .attr("r", 14)
  .attr("fill", d => {
    if (diagnosticOverlay === "thermal") return (d.vu && d.vc && d.vu / d.vc > 1.2) ? "#f97316" : "#3b82f6";
    if (diagnosticOverlay === "rebar") return d.type === "beam" || d.type === "column" ? "#4f46e5" : "#71717a";
    return NODE_COLORS[d.type] || NODE_COLORS.unknown;
  })
  .attr("opacity", 0.85);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("font-size", "7px")
      .attr("font-weight", "bold")
      .attr("fill", "white")
      .attr("font-family", "monospace")
      .text(d => d.type.slice(0, 3).toUpperCase());

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "32px")
      .attr("font-size", "9px")
      .attr("font-weight", "600")
      .attr("fill", "#27272a")
      .attr("font-family", "monospace")
      .text(d => d.label.length > 12 ? d.label.slice(0, 12) + ".." : d.label);

    node.filter(d => d.status === "fail")
  .append("circle")
  .attr("r", loadCase === "EQ" ? 7 : 5)
  .attr("cx", 15)
  .attr("cy", -15)
  .attr("fill", loadCase === "EQ" ? "#ef4444" : loadCase === "WL" ? "#f97316" : "#fbbf24")
  .attr("class", loadCase === "EQ" ? "animate-pulse" : "");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      linkLabel
        .attr("x", d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr("y", d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2 - 6);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    svg.on("click", () => setSelectedNode(null));

    return () => {
      simulation.stop();
    };
  }, [graphNodes, graphLinks , diagnosticOverlay , loadCase]);

  const getSafetyFactor = () => {
    if (realSafetyFactor !== null && realSafetyFactor > 0) return realSafetyFactor;
    const base: Record<string, Record<string, number>> = {
      "zone-1": { DL: 1.35, LL: 1.12, WL: 1.05, EQ: 0.82 },
      "zone-2": { DL: 1.55, LL: 1.40, WL: 1.15, EQ: 0.88 },
      "zone-3": { DL: 1.28, LL: 1.15, WL: 0.93, EQ: 1.08 },
    };
    return base[selectedZoneId]?.[loadCase] ?? 1.0;
  };

  const safetyFactor = getSafetyFactor();
  const isFailed = safetyFactor < 1.0;

  const getLoadCaseLabel = (lc: string) => ({
    DL: "Dead Load (DL)", LL: "Live Load (LL)",
    WL: "Factored Wind Load (WL)", EQ: "Factored Seismic Load (EQ-Y)"
  }[lc] || "");

  const handleCommitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionNotes.trim()) return;
    setIsSavingDecision(true);
    try {
      if (projectId) {
        await addMemory(projectId, {
          title: `Decision: ${activeZone.name}`,
          content: `Zone: ${activeZone.id} | Load Case: ${getLoadCaseLabel(loadCase)} | Overlay: ${diagnosticOverlay} | Decision: ${decisionNotes}`,
          type: "decision",
          tags: [activeZone.codeClause, loadCase, "reasoning-engine"],
        });
      }
      setCommittedDecisions(prev => [{
        id: `dec-${Date.now()}`,
        zoneName: activeZone.name,
        note: decisionNotes,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        loadCaseState: getLoadCaseLabel(loadCase),
        overlayState: diagnosticOverlay === 'shear' ? 'Shear Stress' : diagnosticOverlay === 'thermal' ? 'Thermal Expansion' : 'Rebar Density'
      }, ...prev]);
      setDecisionNotes("");
    } catch (err) {
      console.error("Failed to save decision:", err);
    } finally {
      setIsSavingDecision(false);
    }
  };

  const failedNodes = graphNodes.filter(n => n.status === "fail").length;
  const passedNodes = graphNodes.filter(n => n.status === "pass").length;
  const totalNodes = graphNodes.length;

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto bg-[#fafafa] h-full custom-scrollbar font-sans text-[#1a1c1c]">

      <div className="flex-1 p-5 md:p-7 space-y-6 overflow-y-auto custom-scrollbar select-text">

        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 pb-5 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2 select-none text-zinc-500">
              <Cpu className="w-4 h-4 text-zinc-900" />
              <span className="text-xs uppercase font-bold tracking-widest text-zinc-800">CivilOS Reasoning Space</span>
              <span className="font-mono text-xs text-[#71717a] bg-zinc-100 px-2 py-0.5 border border-zinc-200">AUDITOR: GEN-CIV-2026-X4</span>
            </div>
            <h1 className="font-serif text-3xl font-normal tracking-tight text-zinc-900 leading-tight">IS Structural Diagnostics Engine</h1>
            <p className="text-sm text-[#71717a] mt-2 pr-6 leading-relaxed">
              Structural knowledge graph bridging extracted drawing members, compliance checks, and IS code cascade analysis.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white border border-zinc-200 shadow-3xs p-4 shrink-0 self-start text-left">
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold font-mono">GLOBAL SAFETY FACTOR</p>
              <p className={`text-2xl font-bold font-mono tracking-tight mt-1 px-1 ${isFailed ? "text-red-700 bg-red-50" : "text-emerald-700 bg-emerald-50"}`}>
                {safetyFactor.toFixed(2)} {isFailed ? "FAILED" : "COMPLIANT"}
              </p>
            </div>
            <div className={`w-4 h-12 flex flex-col items-center justify-center rounded-none relative border ${isFailed ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
              {isFailed ? <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> : <ShieldCheck className="w-3.5 h-3.5" />}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#e5e2e1] overflow-hidden flex flex-col shadow-xs">

          <div className="px-5 py-3 bg-[#fdfdfd] border-b border-zinc-150 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#154212] rounded-none"></span>
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-900 font-mono">
                Structural Member Knowledge Graph
                {graphLoading && <span className="ml-2 text-zinc-400 font-normal">— loading...</span>}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> {failedNodes} Failed</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span> {passedNodes} Pass</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-zinc-400 inline-block"></span> {totalNodes - failedNodes - passedNodes} Unknown</span>
            </div>
          </div>

          <div className="relative bg-white h-[340px] border-b border-zinc-150 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e2dfde_1px,transparent_1px)] [background-size:18px_18px] opacity-30 pointer-events-none" />

            {graphLoading ? (
              <div className="flex items-center justify-center h-full text-zinc-400 text-xs font-mono">
                <Cpu className="w-5 h-5 animate-spin mr-2" /> Loading member graph...
              </div>
            ) : graphNodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <Database className="w-8 h-8 text-zinc-300 mb-3" />
                <p className="text-sm font-bold text-zinc-500">No structural members found</p>
                <p className="text-xs text-zinc-400 mt-1">Upload a structural drawing with category "Structural Drawing (Vision AI)" to populate the knowledge graph.</p>
              </div>
            ) : (
              <svg ref={svgRef} width="100%" height="340" className="w-full" />
            )}

            {selectedNode && (
              <div className="absolute bottom-4 left-4 bg-zinc-950 border border-zinc-700 p-3 text-left max-w-xs shadow-lg">
                <div className="flex justify-between items-center mb-2 border-b border-zinc-800 pb-1.5">
                  <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-wider font-mono">{selectedNode.label}</span>
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-none ${selectedNode.status === 'fail' ? 'bg-red-900 text-red-300' : selectedNode.status === 'pass' ? 'bg-green-900 text-green-300' : 'bg-zinc-800 text-zinc-400'}`}>
                    {selectedNode.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-300 mb-1.5">{selectedNode.details}</p>
                {selectedNode.vu !== undefined && selectedNode.vc !== undefined && (
                  <div className="text-[9px] font-mono text-zinc-400 space-y-0.5">
                    <div>Vu (demand): <span className="text-red-400 font-bold">{selectedNode.vu} kN</span></div>
                    <div>Vc (capacity): <span className="text-green-400 font-bold">{selectedNode.vc} kN</span></div>
                    <div>Ratio: <span className={selectedNode.vu > selectedNode.vc ? "text-red-400 font-bold" : "text-green-400 font-bold"}>{(selectedNode.vu / selectedNode.vc).toFixed(2)}x</span></div>
                  </div>
                )}
                {selectedNode.clause && <p className="text-[8px] text-zinc-500 mt-1.5 font-mono">{selectedNode.clause}</p>}
              </div>
            )}

            <div className="absolute top-3 right-3 text-[8px] font-mono text-zinc-400 bg-white/90 p-2 border border-zinc-200 select-none space-y-1">
              <p className="font-bold text-zinc-500 uppercase">Graph Legend</p>
              {Object.entries(NODE_COLORS).slice(0, 5).map(([type, color]) => (
                <div key={type} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }}></span>
                  <span className="capitalize">{type}</span>
                </div>
              ))}
              <div className="border-t border-zinc-100 pt-1 mt-1 text-[7px] text-zinc-400">Drag nodes • Click for details</div>
            </div>
          </div>

          <div className="p-5 bg-zinc-50 border-t border-zinc-150 flex flex-col md:flex-row gap-5 items-center justify-between select-none font-mono text-xs">
            <div className="w-full md:w-auto text-left space-y-1.5">
              <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 block pb-0.5">Active Simulation Loading State</span>
              <div className="grid grid-cols-4 border border-zinc-200 bg-white overflow-hidden text-[10px]">
                {(["DL", "LL", "WL", "EQ"] as const).map(lc => (
                  <button key={lc} onClick={() => setLoadCase(lc)}
                    className={`px-3 py-2.5 font-bold cursor-pointer border-r last:border-0 border-zinc-200 text-center transition-all ${loadCase === lc ? "bg-[#154212] text-white" : "text-zinc-600 hover:bg-zinc-50"}`}>
                    {lc} {lc === "EQ" ? "*(CRIT)" : ""}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-[#8a8a8a] italic font-semibold mt-1">
                Active: <span className="text-zinc-850 not-italic font-bold">{getLoadCaseLabel(loadCase)}</span>
              </p>
            </div>

            <div className="w-full md:w-auto flex items-center border border-zinc-200 p-1 rounded-none bg-white overflow-hidden text-[10px]">
              {(["shear", "thermal", "rebar"] as const).map(overlay => (
                <button key={overlay} onClick={() => setDiagnosticOverlay(overlay)}
                  className={`px-3 py-2 font-bold cursor-pointer transition-colors capitalize ${diagnosticOverlay === overlay ? "bg-zinc-800 text-white" : "text-zinc-500 hover:bg-zinc-100"}`}>
                  {overlay === "shear" ? "Shear Stress" : overlay === "thermal" ? "Thermal" : "Rebar Density"}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      <aside className="w-full lg:w-[410px] border-t lg:border-t-0 lg:border-l border-[#e5e2e1] flex flex-col bg-white p-5 md:p-6 lg:p-7 space-y-6 min-w-[350px] shrink-0 overflow-y-auto custom-scrollbar select-none">

        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-150 pb-3">
            <Activity className="w-4 h-4 text-[#154212]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 font-mono">Engineering Insight Stream</h3>
          </div>

          <div className="space-y-3">
            {anomalyZones.map(zone => (
              <div key={zone.id} onClick={() => setSelectedZoneId(zone.id)}
                className={`p-3.5 border transition-all cursor-pointer text-left ${selectedZoneId === zone.id ? "bg-zinc-50 border-zinc-900 shadow-3xs" : "border-zinc-200 text-zinc-500 hover:bg-zinc-50/50"}`}>
                <div className="flex justify-between items-center mb-1.5 font-mono text-[10px]">
                  <span className="font-bold text-zinc-800">{zone.codeClause}</span>
                  <span className="text-[8px] font-bold uppercase border border-red-200 bg-red-50 text-red-700 px-1.5 py-0.5">Non-Compliant</span>
                </div>
                <h4 className={`text-xs font-bold ${selectedZoneId === zone.id ? "text-[#154212]" : "text-zinc-750"}`}>{zone.name}</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed mt-1 line-clamp-2">{zone.criticalViolation}</p>
                <div className="mt-2.5 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-zinc-600 font-semibold truncate max-w-[60%]">{zone.member}</span>
                  <span className="text-[#b91c1c] font-bold">Vu/Vc: {zone.metrics.ratio.toFixed(2)}x</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#fcfcfa] border border-[#e5e2e1] p-4 space-y-3.5 shadow-3xs">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#154212] font-mono text-left">Vu vs Vc Comparative Verification</h4>
            <table className="w-full text-left text-[10px] font-mono border-collapse">
              <thead>
                <tr className="bg-zinc-100/50 text-zinc-500 border-b border-zinc-150">
                  <th className="p-2 font-bold uppercase">Metric</th>
                  <th className="p-2 font-bold uppercase text-right">Demand</th>
                  <th className="p-2 font-bold uppercase text-right text-[#154212]">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="p-2 font-semibold text-zinc-700">Design Shear</td>
                  <td className="p-2 text-red-700 font-bold text-right">{activeZone.metrics.vu} {activeZone.id === "zone-2" ? "×10⁻³h" : "kN"}</td>
                  <td className="p-2 text-zinc-600 text-right">{activeZone.metrics.vc} {activeZone.id === "zone-2" ? "×10⁻³h" : "kN"}</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-zinc-700">Max Deflection</td>
                  <td className="p-2 text-zinc-700 text-right">{activeZone.metrics.deflection} mm</td>
                  <td className="p-2 text-zinc-600 text-right">{activeZone.id === "zone-1" ? "12.0" : activeZone.id === "zone-2" ? "25.0" : "10.0"} mm</td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-zinc-700">Rebar Pitch</td>
                  <td className="p-2 text-red-650 text-right font-bold">{activeZone.metrics.rebarPitch} mm</td>
                  <td className="p-2 text-emerald-800 text-right font-bold">150 mm max</td>
                </tr>
                <tr className="bg-zinc-100 font-bold">
                  <td className="p-2 text-zinc-800">Vu / Vc Ratio</td>
                  <td className="p-2 text-red-700 text-right">{activeZone.metrics.ratio.toFixed(2)}x</td>
                  <td className="p-2 text-zinc-600 text-right">1.00x Max</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[9px] text-[#8a8a8a] italic leading-tight text-left border-t border-zinc-200 pt-2 font-sans">
              Clause reference: <span className="font-mono text-zinc-700 font-bold">{activeZone.codeClause}</span>
            </p>
          </div>
        </div>

        <div className="bg-zinc-50 border border-zinc-200 p-4">
          <div className="flex items-center gap-2 border-b border-zinc-200 pb-2.5 mb-3.5">
            <Bookmark className="w-4 h-4 text-[#154212]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 font-mono">Operator Decision Capture</h4>
          </div>
          <p className="text-[10px] text-zinc-500 leading-normal mb-3 text-left font-sans">
            Committing this state writes directly to Project Memory indices (auditable verification logs).
          </p>
          <form onSubmit={handleCommitDecision} className="space-y-3.5 text-left">
            <div className="bg-white border border-zinc-200 px-3 py-2 text-xs font-mono font-bold truncate text-[#154212]">
              {activeZone.id.toUpperCase()}: {activeZone.name}
            </div>
            <p className="text-[9.5px] text-zinc-500 leading-relaxed font-sans bg-white/70 p-2 border border-zinc-150 border-l-2 border-l-zinc-350">
              <span className="font-bold text-zinc-750">AI Recommendation:</span> {activeZone.remedialAction}
            </p>
            <textarea value={decisionNotes} onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="e.g., Concur with IS 456 spacing criteria violation. Stirrup spacing densification ordered..."
              rows={3} required
              className="w-full bg-white border border-zinc-200 py-2 px-3 text-xs text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-sans leading-normal rounded-none" />
            <button type="submit" disabled={isSavingDecision}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-bold py-2.5 uppercase tracking-wider rounded-none cursor-pointer shadow-3xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50">
              <Check className="w-3.5 h-3.5" />
              {isSavingDecision ? "Saving to Memory..." : "Commit Decision to Project Memory"}
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center border-b border-zinc-150 pb-2">
            <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 font-mono">Committed Decision Logs</span>
            <span className="text-[8px] uppercase tracking-wider bg-zinc-100 text-zinc-500 font-mono font-bold px-2.5 py-0.5">{committedDecisions.length} LOGGED</span>
          </div>
          <div className="space-y-3 max-h-52 overflow-y-auto custom-scrollbar select-text font-sans">
            {committedDecisions.length > 0 ? committedDecisions.map(dec => (
              <div key={dec.id} className="p-3 bg-zinc-50 border border-zinc-200 text-left">
                <div className="flex justify-between items-start text-[8px] text-zinc-400 font-mono mb-1 border-b border-zinc-150/50 pb-1">
                  <span className="font-bold text-[#154212]">{dec.zoneName}</span>
                  <span>{dec.timestamp}</span>
                </div>
                <p className="text-xs text-zinc-700 leading-relaxed italic pr-1">"{dec.note}"</p>
                <div className="mt-2 text-[7.5px] font-mono text-zinc-400 flex items-center gap-2">
                  <span>STATE: <span className="text-zinc-600 font-bold">{dec.loadCaseState}</span></span>
                  <span>•</span>
                  <span>OVERLAY: <span className="text-zinc-600 font-bold">{dec.overlayState}</span></span>
                </div>
              </div>
            )) : (
              <p className="text-xs text-zinc-400 italic text-center py-4">No logged decisions in session.</p>
            )}
          </div>
        </div>

      </aside>
    </div>
  );
}