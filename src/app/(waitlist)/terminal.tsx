"use client";

import { Card, CardContent } from "~/components/ui/card";
import { useEffect, useState, useEffectEvent } from "react";

interface TerminalLine {
  prefix: string;
  prefixColor: string;
  content: string;
  delay: number;
}

const terminalLines: TerminalLine[] = [
  {
    prefix: "$",
    prefixColor: "#5eead4",
    content: " beakcrypt init",
    delay: 400,
  },
  {
    prefix: "→",
    prefixColor: "#5eead4",
    content: " Project detected: acme-app",
    delay: 800,
  },
  {
    prefix: "✓",
    prefixColor: "#22c55e",
    content: " Vault created successfully",
    delay: 1200,
  },
  {
    prefix: "$",
    prefixColor: "#5eead4",
    content: " beakcrypt invite user@acme.com",
    delay: 800,
  },
  {
    prefix: "✓",
    prefixColor: "#22c55e",
    content: " Invitation sent to user@acme.com",
    delay: 1200,
  },
  {
    prefix: "$",
    prefixColor: "#5eead4",
    content: " beakcrypt push .env.local",
    delay: 800,
  },
  {
    prefix: "→",
    prefixColor: "#5eead4",
    content: " Encrypting 12 variables...",
    delay: 1200,
  },
  {
    prefix: "✓",
    prefixColor: "#22c55e",
    content: " Synced to vault",
    delay: 1200,
  },
];

const LOOP_PAUSE = 3000;

export default function AnimatedTerminal() {
  const [visibleCount, setVisibleCount] = useState(0);

  const runAnimation = useEffectEvent(() => {
    setVisibleCount(0);

    let cumulativeDelay = 0;
    terminalLines.forEach((line, index) => {
      cumulativeDelay += line.delay;
      setTimeout(() => {
        setVisibleCount(index + 1);
      }, cumulativeDelay);
    });
  });

  useEffect(() => {
    runAnimation();

    const totalDuration =
      terminalLines.reduce((sum, line) => sum + line.delay, 0) + LOOP_PAUSE;
    const interval = setInterval(runAnimation, totalDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-0 border-white/10 bg-[#0c0c0f] w-full max-w-3xl overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/5 px-6 py-3">
        <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
        <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
        <span className="ml-2 text-xs text-white/30">terminal</span>
        <div className="ml-auto flex items-center gap-1.5 animate-pulse">
          <div className="w-1.5 h-1.5 rounded-full bg-[#5eead4]" />
          <span className="text-xs text-[#5eead4]/60">live</span>
        </div>
      </div>

      <CardContent className="px-6 pb-6 font-mono text-sm leading-loose min-h-57">
        {terminalLines.map((line, index) => (
          <div
            key={index}
            className={`text-white/40 transition-all duration-300 ${
              index < visibleCount
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-1"
            }`}
          >
            <span style={{ color: line.prefixColor }}>{line.prefix}</span>
            {line.content}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
