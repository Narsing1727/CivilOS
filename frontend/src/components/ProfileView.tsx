import { useState, FormEvent } from "react";
import { User, Shield, Key, BadgeAlert, Sparkles, Check } from "lucide-react";

import { updateProfile } from "../api/user.api";

interface ProfileViewProps {
  userProfile: {
    name: string;
    role: string;
    email: string;
    avatarInitials: string;
  };
  onUpdateProfile: (profile: {
    name: string;
    role: string;
    email: string;
  }) => void;
}

export function ProfileView({
  userProfile,
  onUpdateProfile,
}: ProfileViewProps) {
  const [name, setName] = useState(userProfile.name);
  const [role, setRole] = useState(userProfile.role);
  const [email, setEmail] = useState(userProfile.email);
  const [certId, setCertId] = useState("CERT-BIS-902241-INFRA");
  const [licenseType, setLicenseType] = useState(
    "Class A Structural Inspector",
  );
  const [sealActive, setSealActive] = useState(true);
  const [showSavedMsg, setShowSavedMsg] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name, designation: role });
      onUpdateProfile({ name, role, email });
      setShowSavedMsg(true);
      setTimeout(() => setShowSavedMsg(false), 2800);
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 h-full font-sans select-none">
      <div className="max-w-4xl mx-auto p-6 md:p-8 lg:p-10">
        <header className="mb-8 border-b border-[#e5e2e1] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              
            </div>
            <h1 className="font-serif text-[28px] md:text-[32px] font-normal tracking-tight text-zinc-900 leading-tight">
              Operator Profile Settings
            </h1>
            <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
              Administer credential authority signature certificates, regulatory
              licenses and biometric authentication tokens.
            </p>
          </div>
        </header>

        {showSavedMsg && (
          <div className="mb-6 p-4 bg-[#e8f5e9] border border-[#154212]/15 text-[#154212] flex items-center justify-between text-xs font-semibold rounded-none animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <Check className="w-4 h-4" />
              <span>
                Operator authority profiles updated successfully. Security
                tokens refreshed.
              </span>
            </div>
            <button
              onClick={() => setShowSavedMsg(false)}
              className="text-[9px] uppercase tracking-wider font-bold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white border border-[#e5e2e1] p-6 md:p-8 rounded-none relative">
            <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-zinc-300"></div>
            <div className="absolute top-2 right-2 w-1 h-1 border-t border-r border-zinc-300"></div>
            <div className="absolute bottom-2 left-2 w-1 h-1 border-b border-l border-zinc-300"></div>
            <div className="absolute bottom-2 right-2 w-1 h-1 border-b border-r border-zinc-300"></div>

            <h3 className="font-serif text-[18px] text-zinc-900 mb-6 pb-2 border-b border-zinc-100 flex items-center gap-2">
              <User className="w-4 h-4 text-[#154212]" />
              Signature & Personal Credentials
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
                    Certified Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
                    Operational Role Title
                  </label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
                  Regulatory Registered Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
                    BIS Inspector Certificate ID
                  </label>
                  <input
                    type="text"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white transition-all font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
                    License Authority Classification
                  </label>
                  <select
                    value={licenseType}
                    onChange={(e) => setLicenseType(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 py-2.5 px-3.5 text-xs text-zinc-900 rounded-none focus:outline-none focus:ring-1 focus:ring-[#154212] focus:bg-white cursor-pointer"
                  >
                    <option value="Class A Structural Inspector">
                      Class A Structural Inspector
                    </option>
                    <option value="Associate Geotech Reviewer">
                      Associate Geotech Reviewer
                    </option>
                    <option value="Principal Regulations Analyst">
                      Principal Regulations Analyst
                    </option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  className="bg-[#154212] hover:bg-[#1f561b] text-white text-xs font-bold py-2.5 px-5 rounded-none shadow-3xs cursor-pointer transition-colors"
                >
                  Commit Security Session Profile
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#e5e2e1] p-5 rounded-none relative">
              <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-zinc-300"></div>
              <div className="absolute top-2 right-2 w-1 h-1 border-t border-r border-zinc-300"></div>
              <div className="absolute bottom-2 left-2 w-1 h-1 border-b border-l border-zinc-300"></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 border-b border-r border-zinc-300"></div>

              <h4 className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider font-mono mb-4 flex items-center gap-1.5">

                Verification Seal Active
              </h4>

              <div className="flex flex-col items-center py-6 border border-dashed border-zinc-200 bg-zinc-50/50 select-none">
                <div className="w-20 h-20 bg-zinc-100 border border-zinc-200 text-[#154212] font-serif font-bold text-xl flex items-center justify-center relative rounded-none shadow-3xs">
                  {userProfile.avatarInitials}
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#154212] text-white flex items-center justify-center rounded-none text-[8px]">
                    ✓
                  </div>
                </div>

                <span className="text-[10px] font-bold text-[#1a1c1c] uppercase mt-4 tracking-wider">
                  {userProfile.name}
                </span>
                <span className="text-[8px] font-mono text-zinc-400 block mt-0.5">
                  {certId}
                </span>

                <div className="mt-5 w-full px-4 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-zinc-500">
                    Enable PDF auto-stamping
                  </span>
                  <button
                    onClick={() => setSealActive(!sealActive)}
                    className={`w-9 h-5 rounded-none p-0.5 transition-colors focus:outline-none cursor-pointer border ${
                      sealActive
                        ? "bg-[#154212] border-[#154212]"
                        : "bg-zinc-200 border-zinc-300"
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 bg-white shadow-3xs transition-transform transform ${
                        sealActive ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#e5e2e1] p-5 rounded-none relative">
              <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-zinc-300"></div>
              <div className="absolute top-2 right-2 w-1 h-1 border-t border-r border-zinc-300"></div>
              <div className="absolute bottom-2 left-2 w-1 h-1 border-b border-l border-zinc-300"></div>
              <div className="absolute bottom-2 right-2 w-1 h-1 border-b border-r border-zinc-300"></div>

              <h4 className="text-[11px] uppercase font-bold text-zinc-400 tracking-wider font-mono mb-3.5 flex items-center gap-1.5">

                Auth Token Telemetry
              </h4>

              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500 font-semibold text-left">
                    Token Status
                  </span>
                  <span className="text-emerald-700 font-bold">
                    VALID & REFRESHED
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-zinc-100">
                  <span className="text-zinc-500 font-semibold text-left">
                    Cipher Hash
                  </span>
                  <span
                    className="text-zinc-700 truncate max-w-[120px] font-semibold text-right"
                    title="8a2e1d7cf991b3ec"
                  >
                    8a2e1d7cf991b3ec
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-500 font-semibold text-left">
                    Session Limit
                  </span>
                  <span className="text-zinc-700 font-semibold text-right">
                    05:43 remaining
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
