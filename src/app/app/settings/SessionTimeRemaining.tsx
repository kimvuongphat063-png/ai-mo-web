"use client";

import { useEffect, useState } from "react";

export function SessionTimeRemaining({ exp }: { exp: number }) {
  const [label, setLabel] = useState("—");

  useEffect(() => {
    function tick() {
      const remainingMs = exp * 1000 - Date.now();
      if (remainingMs <= 0) {
        setLabel("Đã hết hạn");
        return;
      }
      const totalMinutes = Math.floor(remainingMs / 1000 / 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      if (hours > 0) {
        setLabel(`${hours} giờ ${minutes} phút`);
      } else {
        setLabel(`${minutes} phút`);
      }
    }

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [exp]);

  return <span className="tabular-nums">{label}</span>;
}
