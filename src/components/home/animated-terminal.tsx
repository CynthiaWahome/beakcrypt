"use client";

import { useEffect, useState, useEffectEvent, useRef } from "react";
import { Confetti, type ConfettiRef } from "~/components/ui/confetti";

interface TerminalLine {
  prefix: string;
  prefixColor: string;
  content: string;
  delay: number;
}

const commandLine = {
  prefix: "$",
  prefixColor: "#5eead4",
  content: " npx beakcrypt pull --env production",
  delay: 400,
};

const terminalLines: TerminalLine[] = [
  {
    prefix: "→",
    prefixColor: "#5eead4",
    content: " Connecting to vault...",
    delay: 600,
  },
  {
    prefix: "→",
    prefixColor: "#5eead4",
    content: " Fetching encrypted bundle...",
    delay: 800,
  },
  {
    prefix: "→",
    prefixColor: "#5eead4",
    content: " Decrypting with local key...",
    delay: 700,
  },
  {
    prefix: "✓",
    prefixColor: "#22c55e",
    content: " Written 18 variables to .env.local",
    delay: 600,
  },
];

const LOOP_PAUSE = 3000;

export default function AnimatedTerminal() {
  const [commandVisible, setCommandVisible] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const confettiRef = useRef<ConfettiRef>(null);

  const runAnimation = useEffectEvent(() => {
    setCommandVisible(false);
    setVisibleCount(0);
    setShowSuccess(false);

    setTimeout(() => {
      setCommandVisible(true);
    }, commandLine.delay);

    let cumulativeDelay = commandLine.delay + 400;
    terminalLines.forEach((line, index) => {
      cumulativeDelay += line.delay;
      setTimeout(() => {
        setVisibleCount(index + 1);
      }, cumulativeDelay);
    });

    setTimeout(() => {
      setShowSuccess(true);
      confettiRef.current?.fire({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }, cumulativeDelay + 500);
  });

  useEffect(() => {
    runAnimation();

    const totalDuration =
      commandLine.delay +
      400 +
      terminalLines.reduce((sum, line) => sum + line.delay, 0) +
      500 +
      LOOP_PAUSE;
    const interval = setInterval(runAnimation, totalDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0c0c0f] w-full max-w-3xl">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]"></div>
        <span className="ml-2 text-xs text-white/30">terminal</span>
      </div>
      <div className="p-5 font-mono text-[13px] leading-relaxed min-h-50">
        <div
          className={`text-white/40 transition-all duration-300 ${
            commandVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1"
          }`}
        >
          <span style={{ color: commandLine.prefixColor }}>
            {commandLine.prefix}
          </span>
          {commandLine.content}
        </div>

        <div className="mt-4 space-y-1.5 text-white/50">
          {terminalLines.map((line, index) => (
            <div
              key={line.content}
              className={`transition-all duration-300 ${
                index < visibleCount
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-1"
              }`}
            >
              <span style={{ color: line.prefixColor }}>{line.prefix}</span>
              {line.content}
            </div>
          ))}
        </div>

        <div
          className={`relative mt-5 rounded border border-[#22c55e]/20 bg-[#22c55e]/5 p-3 text-sm transition-all duration-300 ${
            showSuccess
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-1"
          }`}
        >
          <span className="text-[#22c55e]">Success!</span>
          <span className="text-white/50"> Environment synced in 1.2s</span>
          <Confetti
            ref={confettiRef}
            manualstart
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    </div>
  );
}
