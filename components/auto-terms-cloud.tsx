"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TermCount } from "./terms-skills-generator";

interface AutoTermsCloudProps {
  terms: TermCount[];
}

export function AutoTermsCloud({ terms }: AutoTermsCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<
    "all" | "responsibilities" | "qualifications"
  >("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Extract unique roles from the terms data
  const availableRoles = Array.from(
    new Set(
      terms.flatMap((term) =>
        (term.sources || [])
          .filter((source) => source && typeof source === "object")
          .map((source) => String(source.role || "Unknown Role"))
      )
    )
  ).sort();

  const filteredTerms = terms.filter((term) => {
    // Filter by category (responsibilities/qualifications)
    const matchesCategory = filter === "all" || term.category === filter;

    // Filter by role
    let matchesRole = true;
    if (roleFilter !== "all") {
      matchesRole =
        term.sources?.some(
          (source) =>
            source &&
            typeof source === "object" &&
            String(source.role) === roleFilter
        ) || false;
    }

    return matchesCategory && matchesRole;
  });

  useEffect(() => {
    if (!containerRef.current || filteredTerms.length === 0) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const sanitizedTerms = filteredTerms.map((term) => ({
      ...term,
      term: String(term.term || "Unknown Term"),
      count: typeof term.count === "number" ? term.count : 1,
      category: term.category || "qualifications",
      sources: Array.isArray(term.sources) ? term.sources : [],
    }));

    const maxCount = Math.max(...sanitizedTerms.map((t) => t.count));
    const minFontSize = 6;

    // Use responsive font sizing with both a minimum base size and a responsive component
    const getResponsiveFontSize = (count: number) => {
      // Calculate the ratio (0 to 1) of this term's count to the max count
      const ratio = count / maxCount;

      // Base minimum font size in pixels
      const baseSize = minFontSize;

      // Responsive component that scales with viewport width
      // The ratio determines how much the term scales with the viewport
      const responsiveSize = `calc(${baseSize}px + ${ratio * 2.5}vw)`;

      return responsiveSize;
    };

    sanitizedTerms.slice(0, 100).forEach((term) => {
      const fontSize = getResponsiveFontSize(term.count);

      const span = document.createElement("span");
      span.textContent = term.term;
      span.style.fontSize = fontSize;
      span.style.padding = "12px";
      span.style.display = "inline-flex";
      span.style.alignItems = "center";
      span.style.justifyContent = "center";
      span.style.cursor = "pointer";
      span.style.transition = "all 0.3s ease";
      span.style.borderRadius = "8px";
      span.style.fontWeight = "600";
      span.style.position = "relative";

      // Create tooltip element
      const tooltip = document.createElement("span");
      tooltip.textContent = `Count: ${term.count}`;
      tooltip.style.position = "absolute";
      tooltip.style.bottom = "100%";
      tooltip.style.left = "50%";
      tooltip.style.transform = "translateX(-50%) translateY(-8px)";
      tooltip.style.padding = "4px 8px";
      tooltip.style.borderRadius = "4px";
      tooltip.style.fontSize = "12px";
      tooltip.style.fontWeight = "500";
      tooltip.style.opacity = "0";
      tooltip.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      tooltip.style.pointerEvents = "none";
      tooltip.style.whiteSpace = "nowrap";

      if (term.category === "responsibilities") {
        span.style.color = "#8b5cf6"; // Purple-600
        span.style.background =
          "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.15))";
        tooltip.style.backgroundColor = "#8b5cf6";
        tooltip.style.color = "white";
      } else {
        span.style.color = "#16a34a"; // Green-600
        span.style.background =
          "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.15))";
        tooltip.style.backgroundColor = "#16a34a";
        tooltip.style.color = "white";
      }

      // Add tooltip to the span
      span.appendChild(tooltip);

      span.addEventListener("mouseover", () => {
        span.style.transform = "scale(1.1) translateY(-2px)";
        span.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.15)";
        tooltip.style.opacity = "1";
        tooltip.style.transform = "translateX(-50%) translateY(-12px)";
        if (term.category === "responsibilities") {
          span.style.background =
            "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(124, 58, 237, 0.25))";
        } else {
          span.style.background =
            "linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.25))";
        }
      });

      span.addEventListener("mouseout", () => {
        span.style.transform = "scale(1) translateY(0)";
        span.style.boxShadow = "none";
        tooltip.style.opacity = "0";
        tooltip.style.transform = "translateX(-50%) translateY(-8px)";
        if (term.category === "responsibilities") {
          span.style.background =
            "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.15))";
        } else {
          span.style.background =
            "linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(22, 163, 74, 0.15))";
        }
      });

      container.appendChild(span);
    });
  }, [filteredTerms]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4"></div>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <div className="flex flex-col min-[437px]:flex-row max-[436px]:w-full gap-3">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            size="sm"
            className={
              filter === "all"
                ? "bg-gradient-to-r from-slate-600 to-slate-700 shadow-lg"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }
          >
            All ({terms.length})
          </Button>
          <Button
            variant={filter === "responsibilities" ? "default" : "outline"}
            onClick={() => setFilter("responsibilities")}
            size="sm"
            className={
              filter === "responsibilities"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg"
                : "text-purple-600 border-purple-300 hover:bg-purple-50"
            }
          >
            Responsibilities (
            {terms.filter((t) => t.category === "responsibilities").length})
          </Button>
          <Button
            variant={filter === "qualifications" ? "default" : "outline"}
            onClick={() => setFilter("qualifications")}
            size="sm"
            className={
              filter === "qualifications"
                ? "bg-gradient-to-r from-green-600 to-green-700 shadow-lg"
                : "text-green-600 border-green-400 hover:bg-green-50"
            }
          >
            Qualifications (
            {terms.filter((t) => t.category === "qualifications").length})
          </Button>
        </div>
        {availableRoles.length > 0 && (
          <div className="flex items-center gap-2 max-[436px]:w-full">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="max-[436px]:w-full min-[437px]:w-[200px] border-slate-300 text-slate-700 hover:bg-slate-50">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent className="w-64">
                <SelectItem value="all">All Roles</SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 border border-slate-300 min-h-[350px] text-center">
        {filteredTerms.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-slate-500 text-lg">
            {filter === "all" && roleFilter === "all"
              ? "No auto-generated terms to display. Use Auto Generate to research job listings."
              : `No ${filter === "responsibilities" ? "responsibilities" : filter === "qualifications" ? "skills" : "terms"} found${roleFilter !== "all" ? ` for role: ${roleFilter}` : ""}.`}
          </div>
        ) : (
          <div
            ref={containerRef}
            className="flex flex-wrap justify-center gap-3 leading-relaxed"
          ></div>
        )}
      </div>
    </div>
  );
}
