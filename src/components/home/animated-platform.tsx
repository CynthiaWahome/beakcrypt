"use client";

import { useEffect, useState } from "react";

const platforms = ["slack", "discord", "teams", "email"];

export default function AnimatedPlatform() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % platforms.length);
        setIsAnimating(false);
      }, 300);
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
