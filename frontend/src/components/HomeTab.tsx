import { useState, useEffect, useRef } from "react";
import { MessageSquare, UploadCloud, ShieldCheck, ClipboardList, Database, Paperclip, Sparkles, Send, FileCode, CheckCircle2, AlertTriangle, ArrowRight, Quote } from "lucide-react";
import { io } from "socket.io-client";
import { getProjectSnapshot, getActivityFeed } from "../api/project.api";
import { ChatMessage, AppTab } from "../types";
import { sendMessage as sendChatMessage } from "../api/chat.api";
interface HomeTabProps {
  onSuggestTabChange: (tab: AppTab) => void;
  currentProject: string;
  projectId: string;
  userName: string,
}

export function HomeTab({ onSuggestTabChange, currentProject, projectId , userName}: HomeTabProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatTimelineRef = useRef<HTMLDivElement>(null);



  const socketRef = useRef<any>(null);
useEffect(() => {
  if (!projectId) return;

  const socket = io("http://localhost:5000", {
    auth: { token: localStorage.getItem("civilos_token") },
  });

  socketRef.current = socket;

  socket.on("connect", () => {
    socket.emit("join_project", projectId);
  });

  socket.on("ori_typing", ({ messageId }: any) => {
    setIsTyping(true);
    setChatMessages((prev) => {
      const exists = prev.find((m) => m.id === messageId);
      if (exists) return prev;
      return [...prev, {
        id: messageId,
        sender: "ori",
        text: "",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isStreaming: true,
      }];
    });
  });

  socket.on("ori_token", ({ messageId, token }: any) => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, text: m.text + token } : m
      )
    );
  });

  socket.on("ori_done", ({ messageId, content, sources }: any) => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, text: content, isStreaming: false, sources: sources?.map((s: any) => s.filename).filter(Boolean) || [] }
          : m
      )
    );
    setIsTyping(false);
  });

  return () => {
    socket.disconnect();
  };
}, [projectId]);



  const [snapshot, setSnapshot] = useState<any>(null);
const [activityFeed, setActivityFeed] = useState<any[]>([]);
 useEffect(() => {
  if (!projectId) return;
  getProjectSnapshot(projectId).then((data) => setSnapshot(data)).catch(() => {});
  getActivityFeed(projectId).then((res) => setActivityFeed(res.data)).catch(() => {});
}, [projectId]);




  useEffect(() => {
    if (chatTimelineRef.current) {
      chatTimelineRef.current.scrollTop = chatTimelineRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);
try {
  await sendChatMessage(projectId, textToSend);
} catch (e) {
  console.error(e);
  setIsTyping(false);
  const fallbackMsg: ChatMessage = {
    id: "msg-ori-err-" + Date.now(),
    sender: "ori",
    text: "I encountered an error. Please try again.",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
  setChatMessages((prev) => [...prev, fallbackMsg]);
} finally {
  
}
  };

  const handleQuickAction = (action: string) => {
    switch(action) {
      case "ask":
        handleSendMessage("Are there any pending shear violations?");
        break;
      case "upload":
        onSuggestTabChange('files');
        break;
      case "compliance":
        onSuggestTabChange('compliance');
        break;
      case "report":
        onSuggestTabChange('reports');
        break;
      case "memory":
        onSuggestTabChange('memory');
        break;
    }
  };

  const suggestedPrompts = [
    "Are there any pending shear violations?",
    "Summarize the latest STAAD model changes",
    "Check Cl. 40.2 against recent drawings"
  ];
if (!projectId) {
  return (
    <div className="flex-1 flex items-center justify-center bg-zinc-50 h-full">
      <div className="text-center">
        <p className="font-serif text-xl text-zinc-700 mb-2">No project selected</p>
        <p className="text-xs text-zinc-400 mb-4">Go to Projects and select one to get started.</p>
        <button
          onClick={() => onSuggestTabChange('projects')}
          className="bg-[#154212] text-white text-xs font-bold px-5 py-2.5"
        >
          Go to Projects
        </button>
      </div>
    </div>
  );
}
  return (


    
    <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto bg-zinc-50 h-full custom-scrollbar">
    


      <div className="flex-1 p-6 md:p-8 lg:p-10 transition-colors flex flex-col">
        
        {/* Upper Dashboard half with larger gaps */}
        <div className="space-y-8">
          {/* Engineering Greeting */}
          <div className="text-left">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#8a8a8a] tracking-widest uppercase mb-2 select-none">
              <span className="w-1.5 h-1.5 bg-[#154212] rounded-full"></span>
              Ori • Your Engineering Copilot
            </div>
            <h2 className="font-serif text-[30px] md:text-[36px] leading-tight font-normal text-[#1a1c1c]">Good morning, {userName.split(" ")[0]}.</h2>
            <h2 className="font-serif text-[30px] md:text-[36px] leading-tight font-normal text-[#1a1c1c] mt-1.5">
              What shall we <span className="italic">solve</span> today?
            </h2>
          </div>
 
          {/* 5 primary action cards styled spacious & elegant */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 select-none font-sans">
            {/* Card 1: Ask Anything */}
            <div 
              onClick={() => handleQuickAction("ask")}
              className="border border-[#e5e2e1] bg-white p-5 rounded-none shadow-3xs flex flex-col justify-between hover:border-[#154212] hover:shadow-md transition-all duration-300 cursor-pointer group text-left min-h-[165px] relative overflow-hidden"
            >
         
         
              <div className="absolute top-1.5 left-1.5 w-1 h-1 border-t border-l border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute top-1.5 right-1.5 w-1 h-1 border-t border-r border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute bottom-1.5 left-1.5 w-1 h-1 border-b border-l border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute bottom-1.5 right-1.5 w-1 h-1 border-b border-r border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              
              <div className="w-9 h-9 bg-[#e8f5e9] rounded-none flex items-center justify-center border border-zinc-100 group-hover:scale-105 transition-transform duration-300">
                <MessageSquare className="w-4 h-4 text-[#154212]" />
               </div>
              <div className="mt-5">
                <h3 className="text-[11px] font-bold text-[#1a1c1c] uppercase tracking-wider mb-1 group-hover:text-[#154212] transition-colors">Ask Anything</h3>
                <p className="text-[10px] text-[#8a8a8a] leading-relaxed font-medium">Chat with your project data</p>
              </div>
            </div>

            {/* Card 2: Upload Files */}
            <div 
              onClick={() => handleQuickAction("upload")}
              className="border border-[#e5e2e1] bg-white p-5 rounded-none shadow-3xs flex flex-col justify-between hover:border-[#154212] hover:shadow-md transition-all duration-300 cursor-pointer group text-left min-h-[165px] relative overflow-hidden"
            >
              {/* Engineering Ticks */}
              <div className="absolute top-1.5 left-1.5 w-1 h-1 border-t border-l border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute top-1.5 right-1.5 w-1 h-1 border-t border-r border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute bottom-1.5 left-1.5 w-1 h-1 border-b border-l border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute bottom-1.5 right-1.5 w-1 h-1 border-b border-r border-zinc-300 group-hover:border-[#154212] transition-colors"></div>

              <div className="w-9 h-9 bg-zinc-50 rounded-none flex items-center justify-center border border-zinc-100 group-hover:scale-105 transition-transform duration-300">
                <UploadCloud className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="mt-5">
                <h3 className="text-[11px] font-bold text-[#1a1c1c] uppercase tracking-wider mb-1 group-hover:text-[#154212] transition-colors">Upload Files</h3>
                <p className="text-[10px] text-[#8a8a8a] leading-relaxed font-medium">Add models, drawings & specs</p>
              </div>
            </div>

            {/* Card 3: Check Compliance */}
            <div 
              onClick={() => handleQuickAction("compliance")}
              className="border border-[#e5e2e1] bg-white p-5 rounded-none shadow-3xs flex flex-col justify-between hover:border-[#154212] hover:shadow-md transition-all duration-300 cursor-pointer group text-left min-h-[165px] relative overflow-hidden"
            >
              {/* Engineering Ticks */}
              <div className="absolute top-1.5 left-1.5 w-1 h-1 border-t border-l border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute top-1.5 right-1.5 w-1 h-1 border-t border-r border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute bottom-1.5 left-1.5 w-1 h-1 border-b border-l border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute bottom-1.5 right-1.5 w-1 h-1 border-b border-r border-zinc-300 group-hover:border-[#154212] transition-colors"></div>

              <div className="w-9 h-9 bg-[#e8f5e9]/70 rounded-none flex items-center justify-center border border-zinc-100 group-hover:scale-105 transition-transform duration-300">
                <ShieldCheck className="w-4 h-4 text-[#154212]" />
              </div>
              <div className="mt-5">
                <h3 className="text-[11px] font-bold text-[#1a1c1c] uppercase tracking-wider mb-1 group-hover:text-[#154212] transition-colors">Check Codes</h3>
                <p className="text-[10px] text-[#8a8a8a] leading-relaxed font-medium">Run IS code checks</p>
              </div>
            </div>

            {/* Card 4: Generate Report */}
            <div 
              onClick={() => handleQuickAction("report")}
              className="border border-[#e5e2e1] bg-white p-5 rounded-none shadow-3xs flex flex-col justify-between hover:border-[#154212] hover:shadow-md transition-all duration-300 cursor-pointer group text-left min-h-[165px] relative overflow-hidden"
            >
              {/* Engineering Ticks */}
              <div className="absolute top-1.5 left-1.5 w-1 h-1 border-t border-l border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute top-1.5 right-1.5 w-1 h-1 border-t border-r border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute bottom-1.5 left-1.5 w-1 h-1 border-b border-l border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute bottom-1.5 right-1.5 w-1 h-1 border-b border-r border-zinc-300 group-hover:border-[#154212] transition-colors"></div>

              <div className="w-9 h-9 bg-zinc-50 rounded-none flex items-center justify-center border border-zinc-100 group-hover:scale-105 transition-transform duration-300">
                <ClipboardList className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="mt-5">
                <h3 className="text-[11px] font-bold text-[#1a1c1c] uppercase tracking-wider mb-1 group-hover:text-[#154212] transition-colors">Generate PDF</h3>
                <p className="text-[10px] text-[#8a8a8a] leading-relaxed font-medium">Create project reports</p>
              </div>
            </div>

            {/* Card 5: Search Memory */}
            <div 
              onClick={() => handleQuickAction("memory")}
              className="border border-[#e5e2e1] bg-white p-5 rounded-none shadow-3xs flex flex-col justify-between hover:border-[#154212] hover:shadow-md transition-all duration-300 cursor-pointer group text-left min-h-[165px] relative overflow-hidden"
            >
              {/* Engineering Ticks */}
              <div className="absolute top-1.5 left-1.5 w-1 h-1 border-t border-l border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute top-1.5 right-1.5 w-1 h-1 border-t border-r border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute bottom-1.5 left-1.5 w-1 h-1 border-b border-l border-zinc-300 group-hover:border-[#154212] transition-colors"></div>
              <div className="absolute bottom-1.5 right-1.5 w-1 h-1 border-b border-r border-zinc-300 group-hover:border-[#154212] transition-colors"></div>

              <div className="w-9 h-9 bg-zinc-50 rounded-none flex items-center justify-center border border-zinc-100 group-hover:scale-105 transition-transform duration-300">
                <Database className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="mt-5">
                <h3 className="text-[11px] font-bold text-[#1a1c1c] uppercase tracking-wider mb-1 group-hover:text-[#154212] transition-colors">Search Memory</h3>
                <p className="text-[10px] text-[#8a8a8a] leading-relaxed font-medium">Find decision traces</p>
              </div>
            </div>
          </div>
        </div>
 
        {/* Dynamic Interactive Ori Copilot Chatbot Panel with higher height */}
        <div className="border border-[#e5e2e1] bg-white rounded-none shadow-xs my-8 md:my-10 flex flex-col min-h-[440px] h-[480px]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <span className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">Ori Copilot Engine</span>
            <div className="flex items-center gap-3 select-none">
              <div className="flex items-center gap-2 px-2 py-0.5 rounded-none">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-none inline-block animate-pulse"></span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wide">READY</span>
              </div>
            </div>
          </div>
 
          {/* Chat Timeline */}
          <div ref={chatTimelineRef} className="flex-1 p-6 space-y-5 overflow-y-auto bg-white custom-scrollbar select-text text-zinc-800">
            {chatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-6">
                <div className="w-10 h-10 bg-zinc-100 rounded-none flex items-center justify-center mb-3 text-zinc-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="font-sans text-xs font-semibold text-zinc-805">How can I help with {currentProject}?</h4>
                <p className="text-[11px] text-[#8a8a8a] mt-1 max-w-md mx-auto leading-relaxed">
                  Ask me about structural violations, cross-reference IS codes, or summarize recent changes in the project memory.
                </p>
                {/* Suggested Prompt Chips */}
                <div className="mt-4 flex flex-wrap justify-center gap-1.5 max-w-xl">
                  {suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSendMessage(p)}
                      className="px-2.5 py-1 text-[10px] font-bold bg-zinc-100 hover:bg-[#e2dfde] text-zinc-700 rounded-none cursor-pointer transition-all active:scale-95"
                    >
                      "{p}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-3 rounded-none max-w-2xl leading-relaxed text-xs shadow-3xs text-left relative ${
                    msg.sender === "user"
                      ? "bg-[#f3f1ee] text-zinc-805 font-sans"
                      : "bg-zinc-50 text-zinc-800 border border-zinc-200/50"
                  }`}>
                    <p className="text-[9px] uppercase tracking-wide opacity-50 font-bold mb-1 select-none">
                      {msg.sender === "user" ? "You" : "Ori Copilot"}
                    </p>
                    <p className="whitespace-pre-line leading-relaxed font-sans pr-5">{msg.text}</p>
                    {msg.sender === "user" && (
                      <span className="absolute bottom-2 right-3 text-[#154212] font-bold text-[10px] select-none flex items-center">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    )}

                    {/* Rich Breakdown Table if safety criteria match */}
                    {msg.tableData && (
                      <div className="mt-3 border border-zinc-200 rounded-none overflow-hidden shadow-3xs bg-white">
                        <table className="w-full text-left text-[11px] text-zinc-800">
                          <thead>
                            <tr className="bg-zinc-50 border-b border-zinc-100">
                              <th className="p-2 font-bold uppercase text-[8px] tracking-wider text-zinc-500 w-1/3">Parameter</th>
                              <th className="p-2 font-bold uppercase text-[8px] tracking-wider text-zinc-700">Analysis Metrics</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100">
                            {msg.tableData.location && (
                              <tr>
                                <td className="p-2 font-semibold text-zinc-500 bg-zinc-50/50">Location</td>
                                <td className="p-2 font-sans">{msg.tableData.location}</td>
                              </tr>
                            )}
                            {msg.tableData.shearDemand && (
                              <tr>
                                <td className="p-2 font-semibold text-zinc-500 bg-zinc-50/50">Shear Demand (Vu)</td>
                                <td className="p-2 font-sans font-semibold text-[#ba1a1a]">{msg.tableData.shearDemand}</td>
                              </tr>
                            )}
                            {msg.tableData.shearCapacity && (
                              <tr>
                                <td className="p-2 font-semibold text-zinc-500 bg-zinc-50/50">Shear Capacity (Vc)</td>
                                <td className="p-2 font-sans">{msg.tableData.shearCapacity}</td>
                              </tr>
                            )}
                            {msg.tableData.clauseViolated && (
                              <tr>
                                <td className="p-2 font-semibold text-zinc-500 bg-zinc-50/50">Clause Violated</td>
                                <td className="p-2 font-mono font-bold text-amber-700 text-[10px]">{msg.tableData.clauseViolated}</td>
                              </tr>
                            )}
                            {msg.tableData.reason && (
                              <tr>
                                <td className="p-2 font-semibold text-zinc-500 bg-zinc-50/50">Reason</td>
                                <td className="p-2 font-sans font-medium text-zinc-700">{msg.tableData.reason}</td>
                              </tr>
                            )}
                            {msg.tableData.suggestedFix && (
                              <tr>
                                <td className="p-2 font-semibold text-zinc-500 bg-zinc-50/50">Suggested Fix</td>
                                <td className="p-2 font-sans font-semibold text-[#154212]">{msg.tableData.suggestedFix}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Citations list for engineers */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-zinc-200/50">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Sources Referenced</p>
                        <div className="flex flex-wrap gap-1 select-none">
                          {msg.sources.map((src, idx) => (
                            <span 
                              key={idx} 
                              className="px-2 py-0.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-none text-[9px] font-medium text-zinc-600 inline-flex items-center gap-1 shadow-3xs"
                            >
                              <FileCode className="w-2.5 h-2.5 text-zinc-400" />
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-zinc-400 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex gap-1.5 items-center text-zinc-400 text-[11px] font-sans italic bg-zinc-50 p-2 rounded-none w-32 select-none">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce delay-200"></span>
                Ori analyzing...
              </div>
            )}
          </div>

          {/* Typing Input */}
          <div className="p-3 bg-zinc-50/60 border-t border-zinc-100 mt-auto">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="relative bg-white border border-[#e5e2e1] rounded-none flex items-center p-1 focus-within:ring-1 focus-within:ring-zinc-400 transition-all font-sans"
            >
              <div className="flex items-center gap-1.5 px-2 border-r border-[#e5e2e1]">
                <button 
                  type="button" 
                  onClick={() => onSuggestTabChange('files')}
                  className="p-1.5 hover:bg-zinc-100 rounded-none text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer"
                  title="Attach Design specs"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-transparent border-0 outline-none text-xs text-zinc-850 placeholder:text-zinc-400 px-2.5 select-text w-full py-1.5"
                placeholder="Ask Ori Chat anything about structural checks or code clauses..."
                disabled={isTyping}
              />
              <button 
                type="submit" 
                disabled={!inputText.trim() || isTyping}
                className="bg-zinc-900 hover:bg-zinc-800 text-white p-1.5 text-xs rounded-none transition-all disabled:opacity-40 disabled:hover:bg-zinc-400 active:scale-95 cursor-pointer flex items-center justify-center w-7 h-7 shrink-0 mr-0.5"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Recent Activity quick grids */}
        <div className="text-left mt-10 select-none">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[10px] font-bold text-[#42493e] uppercase tracking-widest text-[#42493e]">Recent Actions</span>
            <div className="flex-1 border-t border-zinc-200"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button 
              onClick={() => handleQuickAction("upload")}
              className="border border-[#e5e2e1] bg-white p-5 rounded-none text-left flex items-start gap-5 hover:shadow-sm transition-all shadow-3xs cursor-pointer"
            >
              <div className="w-10 h-10 bg-zinc-50 flex items-center justify-center rounded-none shrink-0 border border-zinc-200/40">
                <UploadCloud className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-800">Upload Files</h4>
                <p className="text-[9px] text-zinc-400 leading-normal">Add models, drawings, specs and more</p>
              </div>
            </button>

            <button 
              onClick={() => handleQuickAction("compliance")}
              className="border border-[#e5e2e1] bg-white p-5 rounded-none text-left flex items-start gap-4 hover:shadow-sm transition-all shadow-3xs cursor-pointer"
            >
              <div className="w-10 h-10 bg-zinc-50 flex items-center justify-center rounded-none shrink-0 border border-zinc-200/40">
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-800">Run Compliance</h4>
                <p className="text-[9px] text-zinc-400 leading-normal">Check structural alignment with code guidelines</p>
              </div>
            </button>

            <button 
              onClick={() => handleQuickAction("report")}
              className="border border-[#e5e2e1] bg-white p-5 rounded-none text-left flex items-start gap-4 hover:shadow-sm transition-all shadow-3xs cursor-pointer"
            >
              <div className="w-10 h-10 bg-zinc-50 flex items-center justify-center rounded-none shrink-0 border border-zinc-200/40">
                <ClipboardList className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-800">Generate Report</h4>
                <p className="text-[9px] text-zinc-400 leading-normal">Synthesize draft structural report</p>
              </div>
            </button>

            <button 
              onClick={() => handleQuickAction("memory")}
              className="border border-[#e5e2e1] bg-white p-5 rounded-none text-left flex items-start gap-4 hover:shadow-sm transition-all shadow-3xs cursor-pointer"
            >
              <div className="w-10 h-10 bg-zinc-50 flex items-center justify-center rounded-none shrink-0 border border-zinc-200/40">
                <Database className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-zinc-800">Decision Registry</h4>
                <p className="text-[9px] text-zinc-400 leading-normal">Browse past redesign justifications and logs</p>
              </div>
            </button>
          </div>
        </div>

      </div>

      {/* Right Sidebar - High density project snapshot & activity feeds */}
      <aside className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-[#e5e2e1] flex flex-col bg-white p-6 md:p-8 lg:p-10 space-y-8 min-w-[340px] transition-colors shrink-0 justify-between">
        
        {/* Project Snapshot */}
        <div className="text-left font-sans select-none">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Project Snapshot</h3>
            <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-none font-bold">Active</span>
          </div>

         <div className="space-y-4">
  {snapshot?.recent_files?.length > 0 ? (
    snapshot.recent_files.map((f: any) => (
      <div key={f.id} className="flex items-start gap-4 p-3 bg-zinc-50 rounded-none border border-zinc-200/40">
        <FileCode className="w-5 h-5 text-zinc-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-zinc-800">{f.category.toUpperCase()}</p>
          <p className="text-[10px] font-mono text-zinc-400">{f.original_name}</p>
        </div>
      </div>
    ))
  ) : (
    <p className="text-xs text-zinc-400 italic">No files uploaded yet.</p>
  )}
</div>

          <button 
            onClick={() => onSuggestTabChange('files')}
            className="w-full mt-8 py-3 px-4 border border-[#e5e2e1] rounded-none text-xs font-bold text-[#1a1c1c] flex items-center justify-between hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            View All Reference Files
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Timeline Activities */}
        <div className="text-left font-sans select-none">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-widest">Live Activity Log</h3>
          </div>

         <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-1.5 before:bottom-1.5 before:w-[1.5px] before:bg-zinc-100">
  {activityFeed.length > 0 ? (
    activityFeed.slice(0, 4).map((a: any) => (
      <div key={a.id} className="relative">
        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 bg-white border-2 border-zinc-300 rounded-none"></div>
        <p className="text-[11px] font-bold text-zinc-700">{a.action.replace(/_/g, " ")}</p>
        <p className="text-[9px] text-zinc-400 mt-0.5">{new Date(a.createdAt).toLocaleDateString("en-IN")}</p>
      </div>
    ))
  ) : (
    <p className="text-xs text-zinc-400 italic">No activity yet.</p>
  )}
</div>

          <button 
            onClick={() => onSuggestTabChange('compliance')}
            className="w-full mt-8 text-xs font-bold text-[#154212] hover:underline flex items-center justify-center gap-1 hover:translate-x-1 transition-transform cursor-pointer"
          >
            Review Compliance Board
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Testimonial Banner */}
        <div className="mt-auto bg-[#F9F9F4] border border-[#e5e2e1]/40 p-5 rounded-none relative overflow-hidden flex flex-col justify-between h-48 select-none shadow-3xs">
          <div className="relative z-10 text-left">
            <Quote className="w-5 h-5 text-[#154212]/30 mb-2 rotate-180" />
            <p className="font-serif text-[12px] leading-relaxed text-zinc-800 font-medium">
              Great projects are not just built, they are remembered.
            </p>
            <p className="text-[10px] text-zinc-400 mt-2 font-bold">– CivilOS Team</p>
          </div>
          
          {/* Bridge SVG Overlay strictly complying with original HTML design */}
          <div className="absolute bottom-0 right-0 left-0 h-20 opacity-20 pointer-events-none select-none text-zinc-400">
            <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 300 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 80 Q150 20 300 80" stroke="currentColor" strokeWidth="1.5"></path>
              <path d="M0 90 Q150 30 300 90" stroke="currentColor" strokeWidth="1.5"></path>
              <line stroke="currentColor" strokeWidth="0.5" x1="50" x2="50" y1="50" y2="85"></line>
              <line stroke="currentColor" strokeWidth="0.5" x1="100" x2="100" y1="35" y2="82"></line>
              <line stroke="currentColor" strokeWidth="0.5" x1="150" x2="150" y1="30" y2="80"></line>
              <line stroke="currentColor" strokeWidth="0.5" x1="200" x2="200" y1="35" y2="82"></line>
              <line stroke="currentColor" strokeWidth="0.5" x1="250" x2="250" y1="50" y2="85"></line>
            </svg>
          </div>
        </div>

      </aside>
    </div>
  );
}
