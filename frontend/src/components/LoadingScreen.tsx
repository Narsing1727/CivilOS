import { useState, useEffect } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const remaining = 100 - prev;
        const step = Math.max(1, Math.floor(Math.random() * (remaining > 50 ? 15 : 8)));
        const next = prev + step;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onComplete();
          }, 150);
          return 100;
        }
        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#fafafa] flex flex-col items-center justify-center select-none z-50">
      <div className="w-48 space-y-4">
        <div className="flex flex-col items-center gap-3 mb-2">
          <img src="/logo.png" alt="CivilOS" className="w-25 object-contain" />
          <div className="text-center">
            <span className="font-serif text-lg font-bold text-zinc-900 tracking-tight block leading-none">CivilOS</span>
            <p className="text-[8px] uppercase tracking-[0.15em] text-zinc-400 font-bold mt-1">Infrastructure Regulations Terminal</p>
          </div>
        </div>

        <div className="h-[2px] w-full bg-zinc-200/60 overflow-hidden">
          <div
            style={{ width: `${progress}%` }}
            className="bg-[#154212] h-full transition-all duration-75 ease-out"
          />
        </div>

        <div className="flex justify-between items-center text-[9px] font-mono tracking-widest text-zinc-400 font-bold uppercase">
          <span>CivilOS Core</span>
          <span className="text-zinc-600 tabular-nums">{progress}%</span>
        </div>
      </div>
    </div>
  );
}