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
import { Briefcase } from "lucide-react";
import type { TermCount } from "./terms-skills-generator";

interface TermsCloudProps {
  terms: TermCount[];
}

export function TermsCloud({ terms }: TermsCloudProps) {
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
    const minFontSize = 16;
    const maxFontSize = 48;

    sanitizedTerms.slice(0, 100).forEach((term) => {
      const fontSize =
        minFontSize + (term.count / maxCount) * (maxFontSize - minFontSize);

      const span = document.createElement("span");
      span.textContent = term.term;
      span.style.fontSize = `${fontSize}px`;
      span.style.padding = "12px";
      span.style.display = "inline-block";
      span.style.cursor = "pointer";
      span.style.transition = "all 0.3s ease";
      span.style.borderRadius = "8px";
      span.style.fontWeight = "600";

      if (term.category === "responsibilities") {
        span.style.color = "#2563eb"; // Blue-600
        span.style.background =
          "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.15))";
      } else {
        span.style.color = "#dc2626"; // Red-600
        span.style.background =
          "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.15))";
      }

      // let tooltipText = `${term.term}: ${term.count} occurrences (${term.category === "responsibilities" ? "Responsibility" : "Skill"})`
      // if (term.sources && term.sources.length > 0) {
      //   tooltipText += `\nSources: ${term.sources
      //     .filter((s) => s && typeof s === "object")
      //     .map((s) => `${String(s.company || "Unknown Company")} - ${String(s.role || "Unknown Role")}`)
      //     .join(", ")}`
      // }
      // span.title = tooltipText

      span.addEventListener("mouseover", () => {
        span.style.transform = "scale(1.1) translateY(-2px)";
        span.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.15)";
        if (term.category === "responsibilities") {
          span.style.background =
            "linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.25))";
        } else {
          span.style.background =
            "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.25))";
        }
      });

      span.addEventListener("mouseout", () => {
        span.style.transform = "scale(1) translateY(0)";
        span.style.boxShadow = "none";
        if (term.category === "responsibilities") {
          span.style.background =
            "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.15))";
        } else {
          span.style.background =
            "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.15))";
        }
      });

      container.appendChild(span);
    });
  }, [filteredTerms]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        {/* Category Filter Buttons */}
        <div className="flex gap-3">
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
                ? "bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg"
                : "text-blue-600 border-blue-300 hover:bg-blue-50"
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
                ? "bg-gradient-to-r from-red-600 to-red-700 shadow-lg"
                : "text-red-600 border-red-300 hover:bg-red-50"
            }
          >
            Skills (
            {terms.filter((t) => t.category === "qualifications").length})
          </Button>
        </div>

        {/* Role Filter Dropdown */}
        {availableRoles.length > 0 && (
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-slate-600" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[200px] border-slate-300 text-slate-700 hover:bg-slate-50">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
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

      {/* Legend for colors */}
      <div className="flex justify-center gap-8 text-sm font-medium">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm"></div>
          <span className="text-slate-700">Responsibilities</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-red-600 shadow-sm"></div>
          <span className="text-slate-700">Skills</span>
        </div>
      </div>

      <div className="p-8 bg-gradient-to-br from-slate-50 via-white to-blue-50 border border-slate-300 min-h-[350px] text-center">
        {filteredTerms.length === 0 ? (
          <div className="flex items-center justify-center h-[350px] text-slate-500 text-lg">
            {filter === "all" && roleFilter === "all"
              ? "No terms to display. Add job listings to build your cloud."
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
