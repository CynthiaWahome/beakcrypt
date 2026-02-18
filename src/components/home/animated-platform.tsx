"use client";

import { useEffect, useReducer } from "react";

const platforms = ["slack", "discord", "teams", "email"];

type AnimState = { currentIndex: number; isAnimating: boolean };
type AnimAction = "animate-out" | "animate-in";

function animReducer(state: AnimState, action: AnimAction): AnimState {
  if (action === "animate-out") return { ...state, isAnimating: true };
  return {
    currentIndex: (state.currentIndex + 1) % platforms.length,
    isAnimating: false,
  };
}

export default function AnimatedPlatform() {
  const [{ currentIndex, isAnimating }, dispatch] = useReducer(animReducer, {
    currentIndex: 0,
    isAnimating: false,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch("animate-out");
      setTimeout(() => dispatch("animate-in"), 300);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-block min-w-30 md:min-w-37.5">
      <span
        className={`inline-block text-[#5eead4] transition-all duration-200 ease-out ${
          isAnimating ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {platforms[currentIndex]}
      </span>
    </span>
  );
}
