"use client";

import { TermsSkillsGenerator } from "@/components/terms-skills-generator";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState<"manual" | "auto">("manual");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Terms & Skills Cloud
            </h1>
            <p className="text-slate-600 mt-2 text-lg">
              Analyze job listings to discover the most in-demand skills and
              responsibilities
            </p>
            {/* Mode Selection */}

            <div className="flex justify-center gap-4 mt-4">
              <Button
                variant={mode === "manual" ? "default" : "outline"}
                onClick={() => setMode("manual")}
                className={
                  mode === "manual"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }
              >
                Manual Input
              </Button>
              <Button
                variant={mode === "auto" ? "default" : "outline"}
                onClick={() => setMode("auto")}
                className={
                  mode === "auto"
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }
              >
                Auto Generate
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <TermsSkillsGenerator mode={mode} onModeChange={setMode} />
      </div>
    </div>
  );
}
