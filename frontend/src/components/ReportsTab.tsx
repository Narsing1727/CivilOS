import { useState } from "react";
import { Copy, FileDown, CheckSquare, Sparkles, RefreshCw, FileText, CheckCircle2, CloudDownload, Terminal } from "lucide-react";
import { useEffect } from "react";
import { generateReport, getReports, downloadReportUrl } from "../api/reports.api";

interface ReportsTabProps {
  projectId?: string;
}


export function ReportsTab({ projectId }: ReportsTabProps) {
  const [reportType, setReportType] = useState("compliance");
  const [includeCodes, setIncludeCodes] = useState({
    is456: true,
    is800: true,
    is1893: true
  });
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);





const [generatedReports, setGeneratedReports] = useState<any[]>([]);
useEffect(() => {
  if (!projectId) return;
  getReports(projectId).then((res) => {
    const mapped = res.data.map((r: any) => ({
      id: r.id,
      title: r.title,
      date: new Date(r.createdAt).toLocaleDateString("en-IN"),
      size: "—",
      type: r.type,
      status: r.status,
    }));
    setGeneratedReports(mapped);
  }).catch(() => {});
}, [projectId]);





  const [toastMessage, setToastMessage] = useState<string | null>(null);

const handleGenerateReport = async () => {
  if (!projectId) return;
  setIsSynthesizing(true);
  setProgress(30);
  try {
    const title = `CivilOS_${reportType.toUpperCase()}_Report_${Date.now()}`;
    const report = await generateReport(projectId, { title, type: reportType });
    setProgress(100);
    setTimeout(() => {
      setIsSynthesizing(false);
      setGeneratedReports((prev) => [{
        id: report.id,
        title: report.title,
        date: "Just now",
        size: "—",
        type: report.type,
        status: report.status,
      }, ...prev]);
      setToastMessage("Draft structural report synthesized successfully!");
      setTimeout(() => setToastMessage(null), 3000);
    }, 500);
  } catch (err: any) {
    setIsSynthesizing(false);
    setToastMessage("Failed: " + err.message);
  }
};






const handleDownload = async (id: string, title: string) => {
  if (!projectId) return;
  try {
    const token = localStorage.getItem("civilos_token");
    const url = downloadReportUrl(projectId, id);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      setToastMessage("Report not ready yet — try again in a moment");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const blob = await res.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.pdf`;
    link.click();
    setToastMessage(`Downloading ${title}...`);
  } catch {
    setToastMessage("Download failed");
  }
  setTimeout(() => setToastMessage(null), 3000);
};




  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto bg-zinc-50 h-full custom-scrollbar font-sans">
      {/* Central reports controls with premium paddings */}
      <div className="flex-1 p-6 md:p-8 lg:p-10 transition-colors">
        
        {/* Title and Descriptions */}
        <header className="mb-8 text-left select-none">
          <h2 className="font-serif text-[30px] leading-tight font-normal text-zinc-900 mb-1.5">Report Generator</h2>
          <p className="text-xs text-[#8a8a8a] leading-relaxed">Synthesize deep engineering compliance documentation, structural calculations, and mechanical reviews.</p>
        </header>
 
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          
          {/* Controls Box with generous spacing */}
          <div className="md:col-span-7 bg-white border border-[#e5e2e1] p-8 md:p-10 rounded-none space-y-8">
            <h3 className="font-serif text-xl font-normal text-zinc-900 mb-4">Draft Assembly Scope</h3>
 
            {/* Selection dropdown */}
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-2.5 font-mono tracking-wider">Report Template</label>
              <select 
                value={reportType} 
                onChange={(e) => setReportType(e.target.value)} 
                className="w-full bg-zinc-50 text-xs text-zinc-700 border border-zinc-200 rounded-none px-4 py-3 outline-none focus:ring-1 focus:ring-[#154212]"
              >
            <option value="compliance">IS Code Compliance Checklist Draft</option>
  <option value="structural">Full Structural Assembly Report</option>
  <option value="summary">Project Summary Report</option>
  <option value="custom">Custom Engineering Report</option>
              </select>
            </div>
 
            {/* Checkbox toggles for standards */}
            <div>
              <label className="text-[10px] uppercase font-bold text-zinc-400 block mb-3.5 font-mono tracking-wider">Include Code Guidelines</label>
              <div className="space-y-3 p-4 bg-zinc-50/50 border border-zinc-100 select-none">
                <label className="flex items-center gap-3 text-xs text-zinc-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeCodes.is456} 
                    onChange={(e) => setIncludeCodes({...includeCodes, is456: e.target.checked})} 
                    className="w-4 h-4 accent-[#154212]" 
                  />
                  <span>IS 456:2000 Concrete Reinforcement Rules</span>
                </label>
 
                <label className="flex items-center gap-3 text-xs text-zinc-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeCodes.is800} 
                    onChange={(e) => setIncludeCodes({...includeCodes, is800: e.target.checked})} 
                    className="w-4 h-4 accent-[#154212]" 
                  />
                  <span>IS 800:2007 Structural Steel Guidelines</span>
                </label>
 
                <label className="flex items-center gap-3 text-xs text-zinc-700 font-medium cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={includeCodes.is1893} 
                    onChange={(e) => setIncludeCodes({...includeCodes, is1893: e.target.checked})} 
                    className="w-4 h-4 accent-[#154212]" 
                  />
                  <span>IS 1893:2016 Seismic Soil & Infill Drift checks</span>
                </label>
              </div>
            </div>
 
            {/* Synthesizing button */}
            <div className="pt-6 border-t border-zinc-150">
              {isSynthesizing ? (
                <div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 mb-2.5 font-mono uppercase">
                     <span>Compiling PDF Draft layout...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-100 h-2 rounded-none overflow-hidden">
                    <div className="bg-[#154212] h-full rounded-none transition-all duration-150" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleGenerateReport}
                  className="w-full bg-[#154212] hover:bg-[#235120] text-white py-3.5 rounded-none font-sans font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-98 cursor-pointer"
                >
                
                  Synthesize Academic Code-Compliance Report
                </button>
              )}
            </div>
 
          </div>
 
          {/* Generated Reports Log Table List */}
          <div className="md:col-span-5 bg-white border border-[#e5e2e1] p-8 md:p-10 rounded-none flex flex-col justify-between">
            <div>
              <h3 className="font-serif text-lg font-bold text-zinc-900 mb-4">Export Registry Log</h3>
              <p className="text-[11px] text-[#42493e] mb-6 leading-relaxed">Download official PDF reports which list shear load violations, geotech log checks, soil drilling logs, and compliance histories.</p>
              
              <div className="divide-y divide-zinc-100 space-y-4 pt-2">
                {generatedReports.map((r) => (
                  <div key={r.id} className="pt-4 flex justify-between items-center group select-none">
                    <div className="text-left font-sans">
                      <p className="text-[11px] font-bold text-zinc-800 group-hover:text-[#154212] transition-colors truncate max-w-[180px]">{r.title}</p>
                      <p className="text-[9px] text-zinc-400 mt-1 font-medium">{r.date} • {r.size} • <span className="text-zinc-500 font-bold">{r.type}</span></p>
                    </div>
 
                    <button 
                      onClick={() => handleDownload(r.id , r.title)}
                      className="p-2.5 hover:bg-zinc-100 text-zinc-400 hover:text-[#154212] rounded-none transition-colors cursor-pointer"
                      title="Download PDF"
                    >
                      <CloudDownload className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
 
            <div className="pt-6 border-t border-zinc-100 text-[10px] text-zinc-400 italic">
              * Reports conform strictly to BIS design ledger rules. Safe metadata encryption enabled.
            </div>
          </div>
 
        </div>
 
      </div>
 
      {/* Right Sidebar - Output stream terminal */}
      <aside className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-[#e5e2e1] flex flex-col bg-white p-6 md:p-8 lg:p-10 space-y-8 min-w-[340px] transition-colors shrink-0 select-none">
        
        {/* CLI status */}
        <div className="text-left font-sans h-full flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4.5 h-4.5 text-[#154212]" />
              <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Engineering Output log</span>
            </div>

            <p className="text-[11px] text-zinc-500 leading-relaxed mb-4">
              Live stdout report parser logs:
            </p>

            <div className="bg-zinc-955 bg-black p-4 rounded-none font-mono text-[10px] text-emerald-400 space-y-2 h-72 overflow-y-auto custom-scrollbar select-text text-left">
              <div>&gt; CivilOS_Parser initialized</div>
              <div>&gt; loading database records...</div>
              <div>&gt; checking STAAD nodal loads...</div>
              <div>&gt; cross checking IS 456 codes (shear limit)</div>
              <div className="text-amber-500">&gt; Warning: Beam B12 shear Vu exceeding safe margin limits.</div>
              <div>&gt; PDF generation buffer active</div>
              <div className="text-zinc-500">&gt; idle... listening to trigger query.</div>
            </div>
          </div>

          <div className="bg-[#fcfcfa] border border-[#e5e2e1]/40 p-5 rounded-none text-left select-none shadow-3xs mt-6">
            <span className="text-[9px] font-bold text-zinc-405 uppercase tracking-wider block mb-2 font-mono">Documentation Lock</span>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Upon approval, generated reports lock permanently inside the Context memory stream ensuring absolute safety audits.
            </p>
          </div>
        </div>

      </aside>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-850 text-white px-5 py-3 shadow-md flex items-center gap-2.5 z-50 text-xs font-semibold animate-fadeIn rounded-none">
          <span className="w-2 h-2 bg-[#154212] rounded-none inline-block"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
