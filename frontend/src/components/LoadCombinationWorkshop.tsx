import React, { useState, useEffect, useRef, useMemo } from "react";
import { extractMembers } from "../api/extract.api";
import { 
  ArrowLeft, 
  RotateCcw, 
  Check, 
  AlertTriangle, 
  Activity, 
  HelpCircle, 
  Database,
  Layers,
  Save,
  Trash2,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  FileText,
  ZoomIn,
  ZoomOut,
  Play,
  Pause,
  Filter
} from "lucide-react";
import * as d3 from "d3";



import { addMemory } from "../api/memory.api";



export interface LoadCombinationWorkshopProps {
  projectId: string;
  userName: string;
  onExit: () => void;
}

interface StructuralNode extends d3.SimulationNodeDatum {
  id: string;
  type: "Column" | "Beam" | "Girder" | "Foundation";
  baseVu: number;
  currentVc: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface StructuralEdge extends d3.SimulationLinkDatum<StructuralNode> {
  source: string | StructuralNode;
  target: string | StructuralNode;
  value: number; 
}

interface CascadeLogEntry {
  id: string;
  timestamp: string;
  text: string;
}

interface SavedCombination {
  id: string;
  label: string;
  timestamp: string;
  factors: {
    dl: number;
    ll: number;
    wlx: number;
    wly: number;
    eqx: number;
    eqy: number;
  };
  metrics: {
    failingCount: number;
    safetyFactor: number;
  };
}

export function LoadCombinationWorkshop({ projectId, userName, onExit }: LoadCombinationWorkshopProps) {
  // Sliders scale limits defined under IS 1893
  const [dl, setDl] = useState<number>(1.5);
  const [ll, setLl] = useState<number>(1.5);
  const [wlx, setWlx] = useState<number>(0.9);
  const [wly, setWly] = useState<number>(0.9);
  const [eqx, setEqx] = useState<number>(1.2);
  const [eqy, setEqy] = useState<number>(1.2);

  // New highly interactive 3D Bright Theme workspace feature states
  const [isSweeping, setIsSweeping] = useState<boolean>(false);
  const [memberFilter, setMemberFilter] = useState<"All" | "Column" | "Beam" | "Girder" | "Foundation">("All");
  const zoomBehaviorRef = useRef<any>(null);
  const curveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activePreset, setActivePreset] = useState<string>("Custom");
  const [combinationLabel, setCombinationLabel] = useState<string>("");
const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [cascadeLogs, setCascadeLogs] = useState<CascadeLogEntry[]>([]);
  const [savedCombinations, setSavedCombinations] = useState<SavedCombination[]>(() => {
    const saved = localStorage.getItem("civilos_saved_combos");
    return saved ? JSON.parse(saved) : [
      {
        id: "init-1",
        label: "DEFAULT DESIGN BASE CASE",
        timestamp: "May 29, 2026 – 08:15 AM",
        factors: { dl: 1.5, ll: 1.5, wlx: 0, wly: 0, eqx: 0, eqy: 0 },
        metrics: { failingCount: 0, safetyFactor: 1.0 }
      }
    ];
  });

const [nodes, setNodes] = useState<StructuralNode[]>([]);
const [links, setLinks] = useState<StructuralEdge[]>([]);
const [dataLoaded, setDataLoaded] = useState(false);
const [noData, setNoData] = useState(false);

useEffect(() => {
  if (!projectId) return;

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
      setNoData(true);
      setDataLoaded(true);
      return;
    }


    // Build edges from structural hierarchy
    const beams = members.filter((n: any) => n.type === "Beam" || n.type === "Girder");
    const columns = members.filter((n: any) => n.type === "Column");
    const foundations = members.filter((n: any) => n.type === "Foundation");

    const extractedEdges: StructuralEdge[] = [];
    beams.forEach((b: any, i: number) => {
      const col = columns[i % Math.max(columns.length, 1)];
      if (col) extractedEdges.push({ 
        source: b.id, 
        target: col.id, 
        value: b.baseVu / col.currentVc 
      });
    });
    columns.forEach((c: any, i: number) => {
      const found = foundations[i % Math.max(foundations.length, 1)];
      if (found) extractedEdges.push({ 
        source: c.id, 
        target: found.id, 
        value: c.baseVu / found.currentVc 
      });
    });

    setNodes(members);
    setLinks(extractedEdges);
    setDataLoaded(true);
  }).catch(() => {
    setNoData(true);
    setDataLoaded(true);
  });
}, [projectId]);


  // Keep a tracking map for previous structural status to prevent cascading duplicate logs
  const prevStatusesRef = useRef<Record<string, string>>({});

  // Formula handler for live recalculation
  const calculateMetrics = useMemo(() => {
    return (node: StructuralNode, customFactors?: typeof dl_comb) => {
      const activeDl = customFactors ? customFactors.dl : dl;
      const activeLl = customFactors ? customFactors.ll : ll;
      const activeWlx = customFactors ? customFactors.wlx : wlx;
      const activeWly = customFactors ? customFactors.wly : wly;
      const activeEqx = customFactors ? customFactors.eqx : eqx;
      const activeEqy = customFactors ? customFactors.eqy : eqy;

      const lateralFactor = Math.max(activeWlx, activeWly, activeEqx, activeEqy);
      const dlContrib = 0.6;
      const llContrib = 0.25;
      const eqContrib = 0.15;

      const newVu = node.baseVu * (activeDl * dlContrib + activeLl * llContrib + lateralFactor * eqContrib);
      const ratio = newVu / node.currentVc;

      let status: "pass" | "warn" | "fail" = "pass";
      if (newVu > node.currentVc) {
        status = "fail";
      } else if (newVu > node.currentVc * 0.85) {
        status = "warn";
      }

      return {
        newVu: Number(newVu.toFixed(1)),
        ratio: Number(ratio.toFixed(2)),
        status
      };
    };
  }, [dl, ll, wlx, wly, eqx, eqy]);

  const dl_comb = { dl, ll, wlx, wly, eqx, eqy };

  // Generate dynamic preset properties with precalculated failure badges
  const presets = [
    {
      name: "1.5(DL+LL)",
      label: "Gravity Dominant",
      factors: { dl: 1.5, ll: 1.5, wlx: 0, wly: 0, eqx: 0, eqy: 0 }
    },
    {
      name: "1.2(DL+LL+EQ)",
      label: "Seismic Case",
      factors: { dl: 1.2, ll: 1.2, wlx: 0, wly: 0, eqx: 1.2, eqy: 1.2 }
    },
    {
      name: "1.2(DL+LL+WL)",
      label: "Wind Case",
      factors: { dl: 1.2, ll: 1.2, wlx: 1.2, wly: 1.2, eqx: 0, eqy: 0 }
    },
    {
      name: "0.9DL+1.5EQ",
      label: "Uplift Seismic",
      factors: { dl: 0.9, ll: 0, wlx: 0, wly: 0, eqx: 1.5, eqy: 1.5 }
    },
    {
      name: "0.9DL+1.5WL",
      label: "Uplift Wind",
      factors: { dl: 0.9, ll: 0, wlx: 1.5, wly: 1.5, eqx: 0, eqy: 0 }
    },
    {
      name: "1.5(DL+EQ)",
      label: "No Live Seismic",
      factors: { dl: 1.5, ll: 0, wlx: 0, wly: 0, eqx: 1.5, eqy: 1.5 }
    }
  ];

  const presetFails = useMemo(() => {
    return presets.map((preset) => {
      let count = 0;
      nodes.forEach((node) => {
        const met = calculateMetrics(node, preset.factors);
        if (met.status === "fail") {
          count++;
        }
      });
      return count;
    });
  }, [calculateMetrics]);

  // Handle preset switching
  const applyPreset = (presetName: string, factors: typeof dl_comb) => {
    setActivePreset(presetName);
    setDl(factors.dl);
    setLl(factors.ll);
    setWlx(factors.wlx);
    setWly(factors.wly);
    setEqx(factors.eqx);
    setEqy(factors.eqy);
    setCombinationLabel(presetName.toUpperCase());
  };

  // Perform updates inside computed metrics loop
  const currentMetrics = useMemo(() => {
    let passing = 0;
    let failing = 0;
    let worstRatio = 0;
    let worstMemberName = "None";

    const evaluatedNodes = nodes.map((node) => {
      const calc = calculateMetrics(node);
      if (calc.status === "fail") {
        failing++;
      } else {
        passing++;
      }

      if (calc.ratio > worstRatio) {
        worstRatio = calc.ratio;
        worstMemberName = node.id;
      }

      return {
        ...node,
        computed: calc
      };
    });

    const globalSafetyFactor = nodes.length > 0 ? Number((passing / nodes.length).toFixed(3)) : 0;
const structuralHealth = nodes.length > 0 ? Math.round((passing / nodes.length) * 100) : 0;

    return {
      evaluatedNodes,
      passing,
      failing,
      worstRatio,
      worstMemberName,
      globalSafetyFactor,
      structuralHealth
    };
  }, [nodes, calculateMetrics]);

  // Information of selected node for details sidebar
  const selectedNodeWithMetrics = useMemo(() => {
    if (!selectedNodeId) return null;
    const baseNode = nodes.find(n => n.id === selectedNodeId);
    if (!baseNode) return null;
    const computed = calculateMetrics(baseNode);

    // Breakdown components contribution
    const latFactor = Math.max(wlx, wly, eqx, eqy);
    const dlShare = baseNode.baseVu * 0.6 * dl;
    const llShare = baseNode.baseVu * 0.25 * ll;
    const latShare = baseNode.baseVu * 0.15 * latFactor;

    let primaryTrigger = "N/A";
    if (computed.status === "fail" || computed.status === "warn") {
      if (latShare > dlShare && latShare > llShare) primaryTrigger = "Excessive lateral seismic/wind force factor";
      else if (llShare > dlShare && llShare > latShare) primaryTrigger = "High live load structural utilization";
      else primaryTrigger = "Dead load gravity structural mass concentrate";
    }

    return {
      ...baseNode,
      computed,
      shares: {
        dl: Number(dlShare.toFixed(1)),
        ll: Number(llShare.toFixed(1)),
        lat: Number(latShare.toFixed(1))
      },
      primaryTrigger
    };
  }, [selectedNodeId, dl, ll, wlx, wly, eqx, eqy, calculateMetrics]);

  // Watch for member status changes of state in order to append logs in real time
  useEffect(() => {
    currentMetrics.evaluatedNodes.forEach((node) => {
      const prevStatus = prevStatusesRef.current[node.id];
      const newStatus = node.computed.status;

      if (newStatus === "fail" && prevStatus !== "fail" && prevStatus !== undefined) {
        const curTime = new Date().toLocaleTimeString();
        const lateralMax = Math.max(wlx, wly, eqx, eqy);
        const textStr = `Member ${node.id} (${node.type}) exceeded designated shear capacity under DL=${dl}x, LL=${ll}x, LAT=${lateralMax}x (Vu/Vc = ${node.computed.ratio})`;
        
        setCascadeLogs((prev) => [
          {
            id: `log-${Date.now()}-${node.id}`,
            timestamp: curTime,
            text: textStr
          },
          ...prev
        ].slice(0, 15));
      }
    });

    // Save current states for next check
    const nextStatuses: Record<string, string> = {};
    currentMetrics.evaluatedNodes.forEach((n) => {
      nextStatuses[n.id] = n.computed.status;
    });
    prevStatusesRef.current = nextStatuses;
  }, [currentMetrics, dl, ll, wlx, wly, eqx, eqy]);

  // Dynamic automatic load factor sweeping engine (Feature 2)
  const sweepDirRef = useRef<number>(1);
  useEffect(() => {
    if (!isSweeping) return;
    const interval = setInterval(() => {
      setLl((prev) => {
        let next = prev + 0.1 * sweepDirRef.current;
        if (next >= 2.0) {
          next = 2.0;
          sweepDirRef.current = -1;
        } else if (next <= 0.0) {
          next = 0.0;
          sweepDirRef.current = 1;
        }
        return Number(next.toFixed(1));
      });
      setActivePreset("Simultaneous Sweep");
    }, 250);
    return () => clearInterval(interval);
  }, [isSweeping]);

  // Stress Yield Strain Curve Chart canvas renderer (Feature 3)
  useEffect(() => {
    if (!curveCanvasRef.current || !selectedNodeWithMetrics) return;
    const canvas = curveCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const ratio = selectedNodeWithMetrics.computed.ratio;
    
    // Draw canvas grid and parabolic-rectangular stress curves
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "#f4f4f5";
    ctx.lineWidth = 1;
    for (let x = 20; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height - 15);
      ctx.stroke();
    }
    for (let y = 15; y < canvas.height - 15; y += 20) {
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Capacity design curve representation
    ctx.beginPath();
    ctx.strokeStyle = "#a1a1aa";
    ctx.lineWidth = 2;
    
    const startX = 20;
    const endX = canvas.width - 20;
    const startY = canvas.height - 15;
    const peakY = 20;
    const curvePeakX = startX + (endX - startX) * 0.55;

    ctx.moveTo(startX, startY);
    for (let x = startX; x <= curvePeakX; x++) {
      const percentage = (x - startX) / (curvePeakX - startX);
      const factor = 2 * percentage - percentage * percentage;
      const y = startY - (startY - peakY) * factor;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(endX, peakY);
    ctx.stroke();

    // Fill capacity area
    ctx.fillStyle = "rgba(161, 161, 170, 0.05)";
    ctx.lineTo(endX, startY);
    ctx.lineTo(startX, startY);
    ctx.fill();

    // Plot dynamic user operating stress matching current ratio
    const dotX = startX + (endX - startX) * Math.min(1.0, ratio * 0.85);
    let dotY;
    if (dotX < curvePeakX) {
      const percentage = (dotX - startX) / (curvePeakX - startX);
      const factor = 2 * percentage - percentage * percentage;
      dotY = startY - (startY - peakY) * factor;
    } else {
      dotY = peakY;
    }

    const safeDotY = Math.max(10, Math.min(startY, dotY));
    const isFailing = ratio > 1.0;
    const isWarning = ratio > 0.85 && ratio <= 1.0;
    const colorTheme = isFailing ? "#e11d48" : isWarning ? "#d97706" : "#10b981";

    ctx.fillStyle = isFailing ? "rgba(225, 29, 72, 0.08)" : isWarning ? "rgba(217, 119, 6, 0.06)" : "rgba(16, 185, 129, 0.05)";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    for (let x = startX; x <= dotX; x++) {
      if (x <= curvePeakX) {
        const percentage = (x - startX) / (curvePeakX - startX);
        const factor = 2 * percentage - percentage * percentage;
        ctx.lineTo(x, startY - (startY - peakY) * factor);
      } else {
        ctx.lineTo(x, peakY);
      }
    }
    ctx.lineTo(dotX, startY);
    ctx.closePath();
    ctx.fill();

    // Plot operating stress level point marker
    ctx.beginPath();
    ctx.arc(dotX, safeDotY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = colorTheme;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw guidelines
    ctx.setLineDash([2, 3]);
    ctx.strokeStyle = colorTheme;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(dotX, safeDotY);
    ctx.lineTo(dotX, startY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw axes
    ctx.strokeStyle = "#71717a";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(startX, 5);
    ctx.lineTo(startX, startY);
    ctx.lineTo(canvas.width - 5, startY);
    ctx.stroke();

    // Titles
    ctx.fillStyle = "#71717a";
    ctx.font = "8px monospace";
    ctx.fillText("Stress (f_ck)", startX + 6, 12);
    ctx.fillText("Strain (ε_cu)", canvas.width - 65, canvas.height - 4);
  }, [selectedNodeWithMetrics]);

  // Set up the interactive D3 visual layout simulation
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
      if (!dataLoaded || nodes.length === 0) return;
    // Maintain consistent scale geometry dimensions inside SVG viewport frame
    const width = 360;
    const height = 260;

    d3.select(svgRef.current).selectAll("*").remove();

    // Copy initial node positions or assign stable values
    const d3Nodes: StructuralNode[] = nodes.map(n => ({ ...n }));
    const d3Links: StructuralEdge[] = links.map(l => ({
      source: d3Nodes.find(n => n.id === (typeof l.source === 'string' ? l.source : l.source.id)) || d3Nodes[0],
      target: d3Nodes.find(n => n.id === (typeof l.target === 'string' ? l.target : l.target.id)) || d3Nodes[0],
      value: l.value
    }));

    const simulation = d3.forceSimulation<StructuralNode>(d3Nodes)
      .force("link", d3.forceLink<StructuralNode, StructuralEdge>(d3Links).id(d => d.id).distance(65))
      .force("charge", d3.forceManyBody().strength(-150))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.12))
      .force("y", d3.forceY(height / 2).strength(0.12));

    const svg = d3.select(svgRef.current);

    // Create defs for flow arrow indicators
    const defs = svg.append("defs");
    
    // Pass radial 3D gradient
    const passGrad = defs.append("radialGradient")
      .attr("id", "pass-sphere-grad")
      .attr("cx", "30%")
      .attr("cy", "30%")
      .attr("r", "70%");
    passGrad.append("stop").attr("offset", "0%").attr("stop-color", "#f0fdf4");
    passGrad.append("stop").attr("offset", "35%").attr("stop-color", "#6ee7b7");
    passGrad.append("stop").attr("offset", "75%").attr("stop-color", "#10b981");
    passGrad.append("stop").attr("offset", "100%").attr("stop-color", "#047857");

    // Warn radial 3D gradient
    const warnGrad = defs.append("radialGradient")
      .attr("id", "warn-sphere-grad")
      .attr("cx", "30%")
      .attr("cy", "30%")
      .attr("r", "70%");
    warnGrad.append("stop").attr("offset", "0%").attr("stop-color", "#fffbeb");
    warnGrad.append("stop").attr("offset", "35%").attr("stop-color", "#fcd34d");
    warnGrad.append("stop").attr("offset", "75%").attr("stop-color", "#f59e0b");
    warnGrad.append("stop").attr("offset", "100%").attr("stop-color", "#92400e");

    // Fail radial 3D gradient
    const failGrad = defs.append("radialGradient")
      .attr("id", "fail-sphere-grad")
      .attr("cx", "30%")
      .attr("cy", "30%")
      .attr("r", "70%");
    failGrad.append("stop").attr("offset", "0%").attr("stop-color", "#fff5f5");
    failGrad.append("stop").attr("offset", "35%").attr("stop-color", "#fda4af");
    failGrad.append("stop").attr("offset", "75%").attr("stop-color", "#f43f5e");
    failGrad.append("stop").attr("offset", "100%").attr("stop-color", "#9f1239");

    defs.append("marker")
      .attr("id", "arrow-head-pass")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L10,0L0,4")
      .attr("fill", "#154212");

    defs.append("marker")
      .attr("id", "arrow-head-fail")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 22)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L10,0L0,4")
      .attr("fill", "#e11d48");

    // Root zoom container group wrapping (Feature 4)
    const zoomContainerG = svg.append("g").attr("class", "zoom-container-g");

    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4.0])
      .on("zoom", (event) => {
        zoomContainerG.attr("transform", event.transform);
      });

    svg.call(zoomBehavior).on("dblclick.zoom", null);
    zoomBehaviorRef.current = zoomBehavior;

    // Edges (links) group appended to zoomContainerG
    const linkGroup = zoomContainerG.append("g")
      .selectAll("g")
      .data(d3Links)
      .enter()
      .append("g");

    // Background track path
    const linkPath = linkGroup.append("line")
      .attr("stroke", "#e4e4e7")
      .attr("stroke-width", d => {
        // Edge thickness proportional to average load ratio
        return 2.5 + d.value * 0.8;
      });

    // Flow animated overlay line
    const flowPath = linkGroup.append("line")
      .attr("stroke", "#154212")
      .attr("stroke-width", d => 1.5 + d.value * 0.4)
      .attr("stroke-linecap", "round")
      .attr("class", "animate-load-flow")
      .style("stroke-dasharray", "6, 4")
      .attr("marker-end", "url(#arrow-head-pass)");

    // Nodes group appended to zoomContainerG with class tag 'node-element-group' for interactive filtering (Feature 5)
    const nodeElements = zoomContainerG.append("g")
      .selectAll("g")
      .data(d3Nodes)
      .enter()
      .append("g")
      .attr("class", "node-element-group")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNodeId(d.id);
      })
      .call(
        d3.drag<SVGGElement, StructuralNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.2).restart();
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
          })
      );

    // 1. Soft drop shadow underlay for 3D physics floating effect
    nodeElements.append("circle")
      .attr("class", "3d-shadow")
      .attr("r", 12)
      .attr("cy", 3.5)
      .attr("fill", "#09090b")
      .style("opacity", 0.09)
      .style("filter", "blur(1px)");

    // 2. Structural outer protective casing collar ring
    nodeElements.append("circle")
      .attr("class", "casing-collar")
      .attr("r", 14)
      .attr("fill", "none")
      .attr("stroke", "#e4e4e7")
      .attr("stroke-width", 1.8);

    // 3. Main spherical 3D volumetric node body
    nodeElements.append("circle")
      .attr("class", "sphere-body")
      .attr("r", 11)
      .attr("fill", "url(#pass-sphere-grad)")
      .attr("stroke", "#10b981")
      .attr("stroke-width", 1.0);

    // 4. Glow animated overflow pulse indicator
    nodeElements.append("circle")
      .attr("class", "fail-pulse")
      .attr("r", 18)
      .attr("fill", "none")
      .attr("stroke", "#f43f5e")
      .attr("stroke-width", 1.2)
      .style("opacity", 0);

    // 5. High contrast elevated floating identification badge pill
    const pillGroup = nodeElements.append("g")
      .attr("transform", "translate(0, -22)");

    pillGroup.append("rect")
      .attr("x", -12)
      .attr("y", -7)
      .attr("width", 24)
      .attr("height", 13)
      .attr("rx", 5)
      .attr("fill", "#ffffff")
      .attr("stroke", "#e4e4e7")
      .attr("stroke-width", 1.0);

    pillGroup.append("text")
      .text(d => d.id)
      .attr("font-family", "monospace")
      .attr("font-size", "7.5px")
      .attr("font-weight", "black")
      .attr("text-anchor", "middle")
      .attr("dy", "2.0px")
      .attr("fill", "#18181b");

    // Dynamic tick updates
    simulation.on("tick", () => {
      // Keep boundaries checked
      d3Nodes.forEach(d => {
        d.x = Math.max(20, Math.min(width - 20, d.x || 0));
        d.y = Math.max(30, Math.min(height - 20, d.y || 0));
      });

      linkPath
        .attr("x1", d => (d.source as StructuralNode).x || 0)
        .attr("y1", d => (d.source as StructuralNode).y || 0)
        .attr("x2", d => (d.target as StructuralNode).x || 0)
        .attr("y2", d => (d.target as StructuralNode).y || 0);

      flowPath
        .attr("x1", d => (d.source as StructuralNode).x || 0)
        .attr("y1", d => (d.source as StructuralNode).y || 0)
        .attr("x2", d => (d.target as StructuralNode).x || 0)
        .attr("y2", d => (d.target as StructuralNode).y || 0);

      nodeElements.attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`);
    });

   

    return () => {
      simulation.stop();
    };
  }, [dataLoaded]);

  // Update node colors and scale ticks reactively, using D3 selections directly on state shifts
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);

    // Update spherical body 3D radial gradients & corresponding stroke borders
    svg.selectAll("circle.sphere-body").each(function(d: any) {
      if (!d || !d.id) return;
      const evaluation = calculateMetrics(d);
      
      let fillGradId = "url(#pass-sphere-grad)";
      let strokeColor = "#10b981";
      if (evaluation.status === "fail") {
        fillGradId = "url(#fail-sphere-grad)";
        strokeColor = "#e11d48";
      } else if (evaluation.status === "warn") {
        fillGradId = "url(#warn-sphere-grad)";
        strokeColor = "#d97706";
      }

      d3.select(this)
        .transition()
        .duration(120)
        .attr("fill", fillGradId)
        .attr("stroke", strokeColor);
    });

    // Update outer structural casing indicator to match current status highlights
    svg.selectAll("circle.casing-collar").each(function(d: any) {
      if (!d || !d.id) return;
      const evaluation = calculateMetrics(d);
      
      let collarStroke = "#e4e4e7";
      if (evaluation.status === "fail") {
        collarStroke = "#fca5a5";
      } else if (evaluation.status === "warn") {
        collarStroke = "#fde68a";
      }

      d3.select(this)
        .transition()
        .duration(120)
        .attr("stroke", collarStroke);
    });

    // Update active glowing pulsators
    svg.selectAll("circle.fail-pulse").each(function(d: any) {
      if (!d || !d.id) return;
      const evaluation = calculateMetrics(d);
      const isFailing = evaluation.status === "fail";
      
      d3.select(this)
        .transition()
        .duration(150)
        .style("opacity", isFailing ? 0.8 : 0);
    });

    // Update lines color and marker endpoint
    svg.selectAll("line.animate-load-flow").each(function(d: any) {
      if (!d) return;
      const sourceEval = calculateMetrics(d.source);
      const targetEval = calculateMetrics(d.target);
      const isCritical = sourceEval.status === "fail" || targetEval.status === "fail";
      
      d3.select(this)
        .transition()
        .duration(150)
        .attr("stroke", isCritical ? "#e11d48" : "#154212")
        .attr("marker-end", isCritical ? "url(#arrow-head-fail)" : "url(#arrow-head-pass)");
    });

  }, [dl, ll, wlx, wly, eqx, eqy, calculateMetrics]);

  // Handle live member visual filtering state transitions on SVG (Feature 5)
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("g.node-element-group")
      .transition()
      .duration(200)
      .style("opacity", (d: any) => {
        if (!d) return 1.0;
        if (memberFilter === "All") return 1.0;
        return d.type === memberFilter ? 1.0 : 0.15;
      })
      .style("pointer-events", (d: any) => {
        if (!d) return "auto";
        if (memberFilter === "All") return "auto";
        return d.type === memberFilter ? "auto" : "none";
      });
  }, [memberFilter]);

  // Click handler wrapper for viewport panning & smooth incremental scaling
  const handleZoomClick = (direction: "in" | "out" | "reset") => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svgSelection = d3.select<SVGSVGElement, unknown>(svgRef.current);
    if (direction === "in") {
      svgSelection.transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.25);
    } else if (direction === "out") {
      svgSelection.transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.8);
    } else {
      svgSelection.transition().duration(250).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  // Clean log
  const handleClearLogs = () => {
    setCascadeLogs([]);
  };

  // Commit combination to memory storage
  const handleSaveCombo = async () => {
    if (!combinationLabel.trim()) return;

    const newCombo: SavedCombination = {
      id: "sav-" + Date.now(),
      label: combinationLabel.toUpperCase(),
      timestamp: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
      }) + " – " + new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      factors: { dl, ll, wlx, wly, eqx, eqy },
      metrics: {
        failingCount: currentMetrics.failing,
        safetyFactor: currentMetrics.globalSafetyFactor
      }
    };

    const nextList = [newCombo, ...savedCombinations];
    setSavedCombinations(nextList);
    localStorage.setItem("civilos_saved_combos", JSON.stringify(nextList));
    if (projectId) {
  try {
    await addMemory(projectId, {
      title: `Load Combo: ${combinationLabel}`,
      content: `DL:${dl}x LL:${ll}x WLX:${wlx}x WLY:${wly}x EQX:${eqx}x EQY:${eqy}x | Failing:${currentMetrics.failing} | SF:${currentMetrics.globalSafetyFactor}`,
      type: "decision",
      tags: ["load-combination", "IS-1893", "workshop"],
    });
  } catch {}
}
    setCombinationLabel("");
  };

  const handleApplySavedCombo = (combo: SavedCombination) => {
    setDl(combo.factors.dl);
    setLl(combo.factors.ll);
    setWlx(combo.factors.wlx);
    setWly(combo.factors.wly);
    setEqx(combo.factors.eqx);
    setEqy(combo.factors.eqy);
    setCombinationLabel(combo.label);
    setActivePreset("Custom");
  };

  const handleDeleteSavedCombo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextList = savedCombinations.filter(c => c.id !== id);
    setSavedCombinations(nextList);
    localStorage.setItem("civilos_saved_combos", JSON.stringify(nextList));
  };

  return (
    <div className="relative w-full min-h-screen bg-white text-zinc-900 select-text overflow-y-auto">
      {/* Background wireframe grids */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e2e1_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-75 pointer-events-none z-0" />
      <div className="absolute top-0 left-0 right-0 h-[650px] bg-gradient-to-b from-zinc-50 to-transparent pointer-events-none z-0 border-b border-zinc-200/10" />

      {/* Styled CSS animation in document head */}
      <style>{`
        @keyframes dashFlow {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-load-flow {
          stroke-dasharray: 6 4;
          animation: dashFlow 1.2s linear infinite;
        }
      `}</style>

      {/* Global Terminal Header Navigation */}
      <header className="relative z-20 border-b border-zinc-200 bg-white/95 backdrop-blur-md sticky top-0" id="workshop-top-nav">
        <div className="w-full max-w-7xl mx-auto px-6 py-4.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onExit}
              className="p-2 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 hover:text-zinc-950 transition-colors cursor-pointer flex items-center justify-center rounded-none shadow-3xs"
              title="Exit workshop"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="h-6 w-px bg-zinc-200"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9.5px] font-mono bg-[#154212]/10 text-[#154212] px-2 py-0.5 tracking-wider font-bold">WORKSPACE MODULE</span>
                <span className="text-[9.5px] font-mono text-zinc-400 font-bold tracking-wider uppercase">IS:1893-2016</span>
              </div>
              <h2 className="font-serif text-xl tracking-tight font-extrabold text-zinc-900 leading-none mt-1">Load Combination Workshop</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:block text-right font-mono">
              <p className="text-[9.5px] text-zinc-400 font-semibold uppercase tracking-wider">ACTIVE PROJECT</p>
              <p className="text-[11.5px] text-zinc-805 font-bold">{projectId}</p>
            </div>
            <div className="hidden md:block h-6 w-px bg-zinc-200"></div>
            <div className="text-right font-mono">
              <p className="text-[9.5px] text-zinc-400 font-semibold uppercase tracking-wider">VERIFYING OPERATOR</p>
              <p className="text-[11.5px] text-[#154212] font-bold">{userName}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Workshop Workspace Split */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COMPLIANCE VIEWPORT AREA */}
        <section className="lg:col-span-7 space-y-6 flex flex-col items-stretch">
          
          {/* Top HUD Card */}
          <div className="bg-zinc-900 text-white border border-zinc-850 p-5 shadow-sm flex flex-wrap gap-4 justify-between items-center relative select-none">
            <div className="space-y-1 text-left">
              <span className="text-[8.5px] font-mono text-emerald-350 tracking-widest uppercase font-black">ACTIVE COMPLIANCE HARMONY HUD</span>
              <p className="text-xs uppercase font-mono tracking-wider text-zinc-400">Current Combination Index:</p>
              <h3 className="text-lg font-serif italic text-white font-normal">{combinationLabel || "CUSTOM SLIDERS PARAMETER"}</h3>
            </div>
            <div className="flex gap-5 font-mono">
              <div className="text-left border-l border-zinc-700/60 pl-4">
                <span className="text-[9px] text-zinc-400 uppercase font-semibold">Failing Members</span>
                <p className={`text-xl font-bold mt-1 ${currentMetrics.failing > 0 ? "text-rose-500 animate-pulse" : "text-emerald-400"}`}>
                  {currentMetrics.failing}
                </p>
              </div>
              <div className="text-left border-l border-zinc-700/60 pl-4">
                <span className="text-[9px] text-zinc-400 uppercase font-semibold">Global Safety Ratio</span>
                <p className="text-xl font-bold mt-1 text-white">
                  {currentMetrics.globalSafetyFactor}
                </p>
              </div>
            </div>
          </div>

          {/* D3 FORCE GRAPH SYSTEM PORT */}
          <div className="bg-white border border-zinc-200 p-6 shadow-3xs flex flex-col justify-between" id="workshop-graph-viewport">
            <div className="text-left flex justify-between items-center mb-4 select-none">
              <div className="space-y-1">
                <span className="text-[9.5px] font-mono text-[#154212] font-bold uppercase tracking-widest block">STRUCTURE PLAN WIREFRAME</span>
                <h4 className="font-serif text-sm font-bold text-zinc-900 leading-none">Interactive Force-Directed Safety Mesh</h4>
              </div>
              <div className="flex gap-3 text-[9px] font-mono text-zinc-400 font-bold uppercase">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500 inline-block"></span> Pass</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500/20 border border-amber-500 inline-block"></span> Warning</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-500/20 border border-rose-500 inline-block"></span> Overload</span>
              </div>
            </div>

            {/* SVG Render Port with Floating Interactive HUD and Category Filters (Features 1 & 4) */}
            <div className="w-full bg-zinc-50 border border-zinc-200 flex items-center justify-center overflow-hidden h-[340px] relative" id="d3-sandbox-wrapper">
              
              {/* Category Filter bar float */}
              <div className="absolute top-3 left-3 flex gap-1 z-10 bg-white/90 backdrop-blur-xs border border-zinc-200 p-1 select-none shadow-3xs flex-wrap max-w-[80%]">
                {(["All", "Column", "Beam", "Girder", "Foundation"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setMemberFilter(filter)}
                    className={`px-2 py-1 text-[9px] font-mono font-bold uppercase transition-all tracking-tight cursor-pointer ${
                      memberFilter === filter
                        ? "bg-[#154212] text-white"
                        : "bg-transparent text-zinc-600 hover:bg-zinc-150"
                    }`}
                  >
                    {filter === "All" ? "All" : filter + "s"}
                  </button>
                ))}
              </div>

              {/* Viewport Zoom dials matrix */}
              <div className="absolute top-3 right-3 flex gap-1 z-10 select-none">
                <button
                  onClick={() => handleZoomClick("in")}
                  className="p-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 transition-colors cursor-pointer shadow-3xs"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleZoomClick("out")}
                  className="p-1.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 transition-colors cursor-pointer shadow-3xs"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleZoomClick("reset")}
                  className="p-1.5 bg-white border border-zinc-200 hover:bg-zinc-550 text-zinc-800 transition-colors cursor-pointer shadow-3xs"
                  title="Reset viewport orientation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

     {!dataLoaded ? (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <div className="w-6 h-6 border-2 border-[#154212] border-t-transparent rounded-full animate-spin mb-3" />
    <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Loading structural data...</p>
  </div>
) : noData ? (
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <Database className="w-8 h-8 text-zinc-300 mb-3" />
    <p className="text-sm font-bold text-zinc-500">No structural data found</p>
    <p className="text-xs text-zinc-400 mt-1 max-w-xs">Upload a structural report PDF to populate the workshop with real member data.</p>
  </div>
) : (
  <svg ref={svgRef} className="w-full h-full overflow-visible" viewBox="0 0 360 260" />
)}

              <div className="absolute bottom-3 left-3 text-[9px] font-mono text-zinc-400 bg-white border border-zinc-205 py-0.5 px-2 select-none shadow-4xs">
                ZOOM & DRAG MODEL MODEL REALIGNMENT
              </div>
            </div>

            {/* Clicked breakdown HUD */}
            {selectedNodeWithMetrics ? (
              <div className="mt-5 p-5 bg-zinc-50 border border-zinc-200 text-left space-y-4 font-sans max-w-full">
                <div className="flex justify-between items-start border-b border-zinc-205 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-400 uppercase">SELECTED MEMBER</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-zinc-200 text-zinc-700 font-bold">{selectedNodeWithMetrics.type}</span>
                    </div>
                    <h5 className="font-serif text-xl font-black text-zinc-900 mt-1">Component node: {selectedNodeWithMetrics.id}</h5>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[9.5px] text-zinc-400 font-semibold block uppercase">CURRENT Vu/Vc RATIO</span>
                    <span className={`text-[17px] font-bold tracking-tight inline-block ${
                      selectedNodeWithMetrics.computed.status === 'fail' 
                        ? "text-rose-600 font-black animate-pulse" 
                        : selectedNodeWithMetrics.computed.status === 'warn' 
                          ? "text-amber-600" 
                          : "text-emerald-700"
                    }`}>
                      {selectedNodeWithMetrics.computed.ratio}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-400 block font-bold uppercase">FACTORED SHEAR DEMAND (Vu)</span>
                    <p className="text-sm font-semibold text-zinc-900 font-mono">{selectedNodeWithMetrics.computed.newVu} kN</p>
                    <p className="text-[10px] text-zinc-400 font-medium font-sans">Base shear was: {selectedNodeWithMetrics.baseVu} kN</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-400 block font-bold uppercase">PERMISSIBLE CAPACITY (Vc)</span>
                    <p className="text-sm font-semibold text-zinc-900 font-mono">{selectedNodeWithMetrics.currentVc} kN</p>
                    <p className="text-[10px] text-zinc-400 font-medium font-sans">Concrete cover & reinforcement constant</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-zinc-400 block font-bold uppercase">MEMBER COMPLIANCE STATUS</span>
                    <p className={`text-sm font-bold uppercase flex items-center gap-1 ${
                      selectedNodeWithMetrics.computed.status === 'fail' 
                        ? "text-rose-600" 
                        : selectedNodeWithMetrics.computed.status === 'warn' 
                          ? "text-amber-600" 
                          : "text-emerald-700"
                    }`}>
                      {selectedNodeWithMetrics.computed.status === 'fail' && <AlertCircle className="w-4 h-4" />}
                      {selectedNodeWithMetrics.computed.status === 'warn' && <AlertTriangle className="w-4 h-4" />}
                      {selectedNodeWithMetrics.computed.status === 'pass' && <Check className="w-4 h-4" />}
                      <span>{selectedNodeWithMetrics.computed.status.toUpperCase()}</span>
                    </p>
                  </div>
                </div>

                {/* Contribution details */}
                <div className="pt-3 border-t border-zinc-200/80 grid grid-cols-1 md:grid-cols-12 gap-4 text-xs font-sans items-center">
                  <div className="md:col-span-5 space-y-1">
                    <span className="text-[10px] font-mono text-zinc-400 block font-bold uppercase">COMPONENTS FORCE BREAKDOWN</span>
                    <p className="text-[11px] text-zinc-550 leading-tight">
                      DL share: <strong className="text-zinc-800 font-mono">{selectedNodeWithMetrics.shares.dl} kN</strong> • 
                      LL share: <strong className="text-zinc-800 font-mono">{selectedNodeWithMetrics.shares.ll} kN</strong> • 
                      LAT share: <strong className="text-zinc-800 font-mono">{selectedNodeWithMetrics.shares.lat} kN</strong>
                    </p>
                  </div>
                  <div className="md:col-span-7 bg-white p-3 border border-zinc-200 font-serif flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider leading-none">PRIMARY COMPLIANCE THREAT</p>
                      <p className="text-[11.5px] font-semibold text-zinc-800 mt-0.5">{selectedNodeWithMetrics.primaryTrigger}</p>
                    </div>
                  </div>
                </div>

                {/* Advanced Stress curves & Live compliance formulas (Features 3 & 5) */}
                <div className="pt-4 border-t border-zinc-201 grid grid-cols-1 md:grid-cols-12 gap-5 z-10 relative">
                  
                  {/* Curve Canvas */}
                  <div className="md:col-span-5 space-y-2">
                    <span className="text-[10px] font-mono text-zinc-400 block font-bold uppercase">STRESS-STRAIN OPERATING POINT</span>
                    <div className="relative bg-white p-2 border border-zinc-200">
                      <canvas 
                        ref={curveCanvasRef} 
                        width="240" 
                        height="125" 
                        className="w-full h-auto block bg-zinc-50"
                        title="Limit State Strain Capacity envelope mapped with active shear strain loading ratio"
                      />
                    </div>
                  </div>

                  {/* Math compliance equations */}
                  <div className="md:col-span-7 space-y-2 text-left font-mono text-[10.5px]">
                    <span className="text-[10px] font-sans text-zinc-400 block font-bold uppercase">LIVE SHEAR CODE COMPLIANCE (IS 456)</span>
                    <div className="bg-white border border-zinc-200 p-3 space-y-2.5">
                      <div className="border-b border-zinc-100 pb-2">
                        <p className="text-[8.5px] text-zinc-400 uppercase font-black">1. NOMINAL SHEAR STRESS (τ_v)</p>
                        <p className="font-serif text-[11px] leading-tight text-zinc-900 mt-0.5">
                          τ_v = V_u / (b · d)
                        </p>
                        <p className="text-[9.5px] text-zinc-500 mt-1">
                          = ({selectedNodeWithMetrics.computed.newVu} kN · 10³) / (300mm · 450mm)
                        </p>
                        <p className="text-zinc-800 font-bold mt-0.5">
                          = {((selectedNodeWithMetrics.computed.newVu * 1000) / (300 * 450)).toFixed(3)} N/mm²
                        </p>
                      </div>

                      <div className="pb-1.5">
                        <p className="text-[8.5px] text-zinc-400 uppercase font-black">2. PERMISSIBLE SHEAR CAPACITY (τ_c)</p>
                        <p className="font-serif text-[11px] leading-tight text-zinc-900 mt-0.5">
                          τ_c = V_c / (b · d)
                        </p>
                        <p className="text-[9.5px] text-zinc-500 mt-1">
                          = ({selectedNodeWithMetrics.currentVc} kN · 10³) / (300mm · 450mm)
                        </p>
                        <p className="text-zinc-800 font-bold mt-0.5">
                          = {((selectedNodeWithMetrics.currentVc * 1000) / (300 * 450)).toFixed(3)} N/mm²
                        </p>
                      </div>

                      <div className="pt-2 border-t border-dashed border-zinc-200 flex justify-between items-center bg-zinc-50 px-2 py-1 select-none">
                        <span className="text-[9px] text-zinc-400 uppercase font-bold">Safety Multiplier Factor:</span>
                        <span className={`font-black tracking-tight text-[11.5px] ${selectedNodeWithMetrics.computed.ratio > 1.0 ? "text-rose-600 animate-pulse" : "text-[#154212]"}`}>
                          {selectedNodeWithMetrics.computed.ratio > 0 ? (1.0 / selectedNodeWithMetrics.computed.ratio).toFixed(3) : "∞"}x
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              <div className="mt-5 p-5 bg-zinc-50 border border-zinc-200 text-center text-xs text-zinc-400 select-none">
                CLICK A REPRESENTATIVE REINFORCED CONCRETE MEMBER NODE FOR VERIFYING FORMULA DATA SPLITS
              </div>
            )}
          </div>

        </section>

        {/* RIGHT CONTROLS PANEL AREA */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* Section 1 — IS 1893 LOAD FACTOR SLIDERS */}
          <div className="bg-white border border-zinc-200 p-6 shadow-3xs text-left text-sans space-y-4">
            <div className="border-b border-zinc-150 pb-2 flex justify-between items-center select-none">
              <div className="space-y-1">
                <span className="text-[9.5px] font-mono text-[#154212] font-bold uppercase tracking-widest block">SECTION 01</span>
                <h4 className="font-serif text-sm font-bold text-zinc-900 leading-none">IS 1893:2016 Load Factor Coefficients</h4>
              </div>
              {/* <HelpCircle className="w-4.5 h-4.5 text-zinc-400" title="Regulatory extreme conditions variables" /> */}
            </div>

            <div className="space-y-4">
              {/* Slider DL */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-zinc-700">Dead Load Coefficient (DL)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 border ${dl > 1.5 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-zinc-50 border-zinc-200 text-zinc-800"}`}>
                    {dl.toFixed(1)}x {dl > 1.5 && "• OUT OF RANGE"}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.5" 
                  max="2.0" 
                  step="0.1"
                  value={dl} 
                  onChange={(e) => { setDl(Number(e.target.value)); setActivePreset("Custom"); }}
                  className="w-full accent-[#154212] bg-zinc-100 h-1.5 cursor-ew-resize rounded-none"
                />
                <div className="flex justify-between text-[8.5px] text-zinc-400 font-mono">
                  <span>0.5x Min Limit</span>
                  <span>1.5x IS standard</span>
                  <span>2.0x Max Limit</span>
                </div>
              </div>

              {/* Slider LL */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-mono font-bold text-zinc-700">Live Load Coefficient (LL)</span>
                  <span className={`font-mono font-bold px-2 py-0.5 border ${ll > 1.5 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-zinc-50 border-zinc-200 text-zinc-800"}`}>
                    {ll.toFixed(1)}x {ll > 1.5 && "• HIGH INTENSITY"}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0.0" 
                  max="2.0" 
                  step="0.1"
                  value={ll} 
                  onChange={(e) => { setLl(Number(e.target.value)); setActivePreset("Custom"); }}
                  className="w-full accent-[#154212] bg-zinc-100 h-1.5 cursor-ew-resize rounded-none"
                />
                <div className="flex justify-between text-[8.5px] text-zinc-400 font-mono">
                  <span>0.0x Gravity Only</span>
                  <span>1.5x Overload Case</span>
                  <span>2.0x Limit Capacity</span>
                </div>
              </div>

              {/* Grid 4 Sliders for Lateral Forces */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Slider WLX */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="font-mono font-bold text-zinc-600">Wind Load X (WLX)</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${wlx > 1.2 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-zinc-50 border-zinc-200 text-zinc-805"}`}>
                      {wlx.toFixed(1)}x
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="1.5" 
                    step="0.1"
                    value={wlx} 
                    onChange={(e) => { setWlx(Number(e.target.value)); setActivePreset("Custom"); }}
                    className="w-full accent-[#154212] bg-zinc-100 h-1 cursor-ew-resize rounded-none"
                  />
                </div>

                {/* Slider WLY */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="font-mono font-bold text-zinc-600">Wind Load Y (WLY)</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${wly > 1.2 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-zinc-50 border-zinc-200 text-zinc-850"}`}>
                      {wly.toFixed(1)}x
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="1.5" 
                    step="0.1"
                    value={wly} 
                    onChange={(e) => { setWly(Number(e.target.value)); setActivePreset("Custom"); }}
                    className="w-full accent-[#154212] bg-zinc-100 h-1 cursor-ew-resize rounded-none"
                  />
                </div>

                {/* Slider EQX */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="font-mono font-bold text-zinc-600">Seismic Load X (EQX)</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${eqx > 1.5 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-zinc-50 border-zinc-200 text-zinc-850"}`}>
                      {eqx.toFixed(1)}x
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="2.0" 
                    step="0.1"
                    value={eqx} 
                    onChange={(e) => { setEqx(Number(e.target.value)); setActivePreset("Custom"); }}
                    className="w-full accent-[#154212] bg-zinc-100 h-1 cursor-ew-resize rounded-none"
                  />
                </div>

                {/* Slider EQY */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="font-mono font-bold text-zinc-600">Seismic Load Y (EQY)</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${eqy > 1.5 ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-zinc-50 border-zinc-200 text-zinc-850"}`}>
                      {eqy.toFixed(1)}x
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0.0" 
                    max="2.0" 
                    step="0.1"
                    value={eqy} 
                    onChange={(e) => { setEqy(Number(e.target.value)); setActivePreset("Custom"); }}
                    className="w-full accent-[#154212] bg-zinc-100 h-1 cursor-ew-resize rounded-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 — IS 1893 PRESET COMBINATIONS & SIMULATION SWEEP */}
          <div className="bg-white border border-zinc-200 p-6 shadow-3xs text-left text-sans space-y-4">
            <div className="border-b border-zinc-150 pb-2 select-none flex justify-between items-end">
              <div>
                <span className="text-[9.5px] font-mono text-[#154212] font-bold uppercase tracking-widest block">SECTION 02</span>
                <h4 className="font-serif text-sm font-bold text-zinc-900 leading-none">IS 1893:2016 Permutations Presets</h4>
              </div>
              <button
                onClick={() => setIsSweeping(!isSweeping)}
                className={`py-1.5 px-3 font-mono text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 rounded-none border ${
                  isSweeping
                    ? "bg-rose-600 border-rose-600 text-white animate-pulse"
                    : "bg-[#154212]/5 border-[#154212]/30 text-[#154212] hover:bg-[#154212]/10"
                }`}
                title="Start automated cyclic shear load factor sweep simulation"
              >
                {isSweeping ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isSweeping ? "STOP SWEEP" : "LIVE SWEEP"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {presets.map((preset, idx) => {
                const count = presetFails[idx];
                const isSelected = activePreset === preset.name;
                return (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.name, preset.factors)}
                    className={`p-3.5 border transition-all text-left flex justify-between items-center cursor-pointer rounded-none group ${
                      isSelected 
                        ? "border-[#154212] bg-[#154212]/5 ring-1 ring-[#154212]/20" 
                        : "border-zinc-200 bg-white hover:border-zinc-400"
                    }`}
                  >
                    <div>
                      <p className="font-mono text-[11px] font-extrabold text-zinc-900 leading-none">{preset.name}</p>
                      <p className="text-[9px] text-zinc-400 mt-1 uppercase tracking-wider font-semibold font-sans">{preset.label}</p>
                    </div>
                    {/* Badge showing how many members fail under this design combo */}
                    <span className={`px-2 py-0.5 text-[9px] font-mono tracking-tight font-extrabold border ${
                      count > 0 
                        ? "bg-rose-50 border-rose-250 text-rose-600 animate-pulse" 
                        : "bg-emerald-50 border-emerald-250 text-emerald-700"
                    }`}>
                      {count} {count === 1 ? "FAIL" : "FAILS"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3 — LIVE COMPLIANCE SUMMARY */}
          <div className="bg-white border border-zinc-200 p-6 shadow-3xs text-left text-sans space-y-4 select-none">
            <div className="border-b border-zinc-150 pb-2">
              <span className="text-[9.5px] font-mono text-[#154212] font-bold uppercase tracking-widest block">SECTION 03</span>
              <h4 className="font-serif text-sm font-bold text-zinc-900 leading-none">Global Structure Health Summary</h4>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-400 uppercase font-semibold text-[8px] block tracking-wide">TOTAL MEMBERS TRACKED</span>
                  <span className="text-base font-bold text-zinc-800">{nodes.length} members</span>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-400 uppercase font-semibold text-[8px] block tracking-wide">PASSING STATUS RATIO</span>
                  <span className="text-base font-bold text-emerald-700">{currentMetrics.passing} passing</span>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-150">
                  <span className="text-rose-450 uppercase font-semibold text-[8px] block tracking-wide">FAILING MEMBERS (CRITICAL)</span>
                  <span className={`text-base font-bold ${currentMetrics.failing > 0 ? "text-rose-600 animate-pulse" : "text-zinc-700"}`}>
                    {currentMetrics.failing} failing
                  </span>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200">
                  <span className="text-zinc-400 uppercase font-semibold text-[8px] block tracking-wide">WORST REINFORCED MEMBER</span>
                  <span className="text-base font-bold text-zinc-800 uppercase text-ellipsis overflow-hidden block">
                    {currentMetrics.worstMemberName} ({currentMetrics.worstRatio.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-sans font-semibold text-zinc-650">Compliance Structural Safety Health Index:</span>
                  <span className="font-mono font-bold text-zinc-900">{currentMetrics.structuralHealth}%</span>
                </div>
                <div className="w-full bg-zinc-150 h-3 border border-zinc-200 overflow-hidden rounded-none p-[1.5px]">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-600 to-[#154212] transition-all duration-300"
                    style={{ width: `${currentMetrics.structuralHealth}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-400 leading-snug">
                  Designed under the Limit State of Stress Collapse for structural engineering safety guidelines.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4 — FAILURE CASCADE LOG */}
          <div className="bg-white border border-zinc-200 p-6 shadow-3xs text-left text-sans space-y-4">
            <div className="border-b border-zinc-150 pb-2 flex justify-between items-center select-none">
              <div className="space-y-1">
                <span className="text-[9.5px] font-mono text-[#154212] font-bold uppercase tracking-widest block">SECTION 04</span>
                <h4 className="font-serif text-sm font-bold text-zinc-900 leading-none">Simulation Failure Cascade Log</h4>
              </div>
              <button 
                onClick={handleClearLogs}
                className="text-[9.5px] font-mono text-zinc-400 hover:text-zinc-850 uppercase font-bold flex items-center gap-1 cursor-pointer select-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Logs</span>
              </button>
            </div>

            <div className="border border-zinc-200 max-h-52 overflow-y-auto bg-zinc-50 font-mono text-[10.5px] p-4 space-y-2.5 custom-scrollbar h-44">
              {cascadeLogs.length > 0 ? (
                cascadeLogs.map((log) => (
                  <div key={log.id} className="border-b border-zinc-150/50 pb-2 flex items-start gap-2.5 leading-relaxed text-zinc-700">
                    <span className="text-zinc-400 font-bold tracking-tight shrink-0">[{log.timestamp}]</span>
                    <span>{log.text}</span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400 py-10 h-full text-center">
                  <Activity className="w-6 h-6 text-zinc-300 mb-2" />
                  <p className="font-sans text-[11px]">No cascading safety overflows registered yet in this trace cycle.</p>
                  <p className="text-[9px] mt-1 font-sans text-zinc-400 max-w-xs">Adjust gravity or lateral sliders past limits to test material yielding.</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 5 — COMMIT TO MEMORY */}
          <div className="bg-white border border-zinc-200 p-6 shadow-3xs text-left text-sans space-y-4">
            <div className="border-b border-[#e5e2e1] pb-2 select-none">
              <span className="text-[9.5px] font-mono text-[#154212] font-bold uppercase tracking-widest block">SECTION 05</span>
              <h4 className="font-serif text-sm font-bold text-zinc-900 leading-none">Commit Permutations to Project Memory</h4>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <input 
                  type="text"
                  placeholder="e.g. MONSOON EXTREME SHEAR CONFIG"
                  value={combinationLabel}
                  onChange={(e) => setCombinationLabel(e.target.value.toUpperCase())}
                  className="flex-1 bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs font-mono font-bold text-zinc-805 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] uppercase"
                />
                <button
                  onClick={handleSaveCombo}
                  disabled={!combinationLabel.trim()}
                  className="bg-[#154212] hover:bg-[#1a4a17] disabled:bg-zinc-200 text-white font-mono text-[10.5px] font-bold py-2.5 px-5 select-none rounded-none uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Configuration</span>
                </button>
              </div>

              {/* Memory storage contents list */}
              <div className="space-y-2 select-none">
                <span className="text-[9px] uppercase font-mono font-bold text-zinc-400 block tracking-wider">SAVED LOAD PERMUTATIONS LEDGER</span>
                <div className="divide-y divide-zinc-200 border border-zinc-200 max-h-36 overflow-y-auto bg-zinc-50/50 custom-scrollbar">
                  {savedCombinations.length > 0 ? (
                    savedCombinations.map((combo) => (
                      <div 
                        key={combo.id} 
                        onClick={() => handleApplySavedCombo(combo)}
                        className="p-3 bg-white hover:bg-zinc-50/80 transition-colors flex justify-between items-center cursor-pointer text-left font-mono"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[8.5px] text-zinc-400 font-bold">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{combo.timestamp}</span>
                          </div>
                          <h5 className="font-sans text-[11.5px] font-black text-zinc-900">{combo.label}</h5>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            DL:{combo.factors.dl}x • LL:{combo.factors.ll}x • LAT:{Math.max(combo.factors.wlx, combo.factors.wly, combo.factors.eqx, combo.factors.eqy)}x
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-[8.5px] font-semibold tracking-wider font-sans border ${
                            combo.metrics.failingCount > 0 
                              ? "bg-rose-50 border-rose-150 text-rose-600 font-bold" 
                              : "bg-emerald-50 border-emerald-150 text-[#154212] font-bold"
                          }`}>
                            {combo.metrics.failingCount} FAILING
                          </span>
                          <button
                            onClick={(e) => handleDeleteSavedCombo(combo.id, e)}
                            className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-zinc-50 rounded-none transition-colors cursor-pointer"
                            title="Delete configuration"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-zinc-400 text-[11px] font-sans">
                      No saved configurations in this browser ledger profile repository.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </section>

      </main>
      
      {/* Visual Regulatory Footnote block */}
      <footer className="relative z-10 w-full border-t border-zinc-200 mt-16 bg-white/40 py-10 select-none">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-zinc-400 font-sans gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#154212]" />
            <span>Verifying structure against IS 1893-2016 Zone V parameters. Calculations certified local-only.</span>
          </div>
          <div>
            <span>CivilOS Automated Calculations Ledger &bull; Standard Release C1893</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
