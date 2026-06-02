import { useState } from "react";
import { HelpCircle, ChevronRight, BookOpen, Scroll, FileCheck2, Database } from "lucide-react";

export function GuideView() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  const guideSections = [
    {
      title: "IS 456 Concrete Cover Standard Regulations",
      icon: Scroll,
      clauses: [
        { key: "Cl. 26.4.1", desc: "Defines nominal concrete cover requirements based on environmental exposure severity (Mild, Moderate, Severe, Extreme) ranging from 20mm up to 75mm." },
        { key: "Cl. 35.1", desc: "Outlines limit states design methodologies incorporating structural partial safety factors for concrete stress distributions." }
      ]
    },
    {
      title: "IS 875 Structural Wind & Gravity Loads",
      icon: Database,
      clauses: [
        { key: "Part 3 Cl. 5.3", desc: "Basic seismic and wind velocity calculation formulas considering regional topographic factors, structural class, and terrain height parameters." },
        { key: "Part 2 Cl. 3.1", desc: "Specifies live loads for various building structures of design grids." }
      ]
    }
  ];

  const faqs = [
    {
      q: "How does the CivilOS Real-time Neural Inspector execute code verification?",
      a: "CivilOS parses geometry logs and member files from CAD drawings and STAAD structures, maps node reactions, and queries the codified regulatory engine to find safety margin discrepancies."
    },
    {
      q: "Can I customize compliance criteria for non-standard territorial codes?",
      a: "Yes. Use the Projects Asset tab to select alignment presets or alter nominal limit thresholds inside individual structure models dynamically."
    },
    {
      q: "How are file mismatch conflicts resolved?",
      a: "The Files module identifies grade deviations and coefficient discrepancies between spreadsheets and documents, allowing operators to execute instant auto-formula corrections."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 h-full font-sans select-none">
      <div className="max-w-4xl mx-auto p-6 md:p-8 lg:p-10">
        
        <header className="mb-8 border-b border-[#e5e2e1] pb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#154212] bg-[#154212]/5 px-2 py-0.5 border border-[#154212]/10">Operational Manual</span>
            <span className="font-mono text-[9px] text-[#8a8a8a]">Codified Verification Handbook v4</span>
          </div>
          <h1 className="font-serif text-[28px] md:text-[32px] font-normal tracking-tight text-zinc-900 leading-tight">Standard Regulatory Guide</h1>
          <p className="text-zinc-500 text-xs mt-1 leading-relaxed">A certified handbook outlining civil compliance procedures, regulatory code references (BIS), and live auditing operations.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {guideSections.map((sec, i) => {
            const Icon = sec.icon;
            return (
              <div key={i} className="bg-white border border-[#e5e2e1] p-6 rounded-none relative">
                <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-zinc-200"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-zinc-200"></div>
                <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-zinc-200"></div>
                <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-zinc-200"></div>

                <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#154212]" />
                  {sec.title}
                </h3>

                <div className="space-y-4">
                  {sec.clauses.map((cl, idx) => (
                    <div key={idx} className="border-l-2 border-[#154212] pl-3 py-1 bg-zinc-50/50">
                      <span className="text-[10px] font-mono font-bold text-[#154212] uppercase tracking-wide">{cl.key}</span>
                      <p className="text-[11px] text-[#5e5e5e] leading-relaxed mt-1 font-medium">{cl.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-[#e5e2e1] p-6 rounded-none relative">
          <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-zinc-200"></div>
          <div className="absolute top-2 right-2 w-1.5 h-1.5 border-t border-r border-zinc-200"></div>
          <div className="absolute bottom-2 left-2 w-1.5 h-1.5 border-b border-l border-zinc-200"></div>
          <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-zinc-200"></div>

          <h3 className="font-serif text-[18px] text-zinc-900 mb-6 pb-2 border-b border-zinc-100 flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-[#154212]" />
            Operator Interactive FAQ Matrix
          </h3>

          <div className="divide-y divide-zinc-100">
            {faqs.map((faq, index) => (
              <div key={index} className="py-4">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full text-left font-sans flex items-center justify-between gap-3 text-xs font-bold text-[#1a1c1c] hover:text-[#154212] cursor-pointer transition-colors"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-zinc-400 shrink-0 transform transition-transform duration-200 ${
                    activeFaq === index ? "rotate-90 text-[#154212]" : ""
                  }`} />
                </button>
                {activeFaq === index && (
                  <p className="text-[11px] font-medium text-zinc-500 mt-2 ml-1 leading-relaxed border-l border-zinc-300 pl-3">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
