"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export function SmallScreenWarning() {
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 330);
    };

    // Check on initial render
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!isSmallScreen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4">
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <h3 className="text-lg font-semibold text-amber-700">
            Screen Size Notice
          </h3>
          <p className="text-sm text-amber-600">
            This application is designed to be viewed on screens 330px and
            larger. Please switch to a larger device.
          </p>
        </div>
      </div>
    </div>
  );
}
