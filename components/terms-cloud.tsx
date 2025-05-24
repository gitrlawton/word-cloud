"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import type { TermCount } from "./terms-skills-generator"

interface TermsCloudProps {
  terms: TermCount[]
}

export function TermsCloud({ terms }: TermsCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [filter, setFilter] = useState<"all" | "responsibilities" | "qualifications">("all")

  // Filter terms based on selected filter
  const filteredTerms = terms.filter((term) => {
    if (filter === "all") return true
    return term.category === filter
  })

  useEffect(() => {
    if (!containerRef.current || filteredTerms.length === 0) return

    const container = containerRef.current
    container.innerHTML = ""

    // Sanitize terms to ensure all have valid properties
    const sanitizedTerms = filteredTerms.map((term) => ({
      ...term,
      term: String(term.term || "Unknown Term"),
      count: typeof term.count === "number" ? term.count : 1,
      category: term.category || "qualifications",
      sources: Array.isArray(term.sources) ? term.sources : [],
    }))

    // Find the maximum count to scale the font sizes
    const maxCount = Math.max(...sanitizedTerms.map((t) => t.count))
    const minFontSize = 14
    const maxFontSize = 42

    // Create and position the terms
    sanitizedTerms.slice(0, 100).forEach((term) => {
      const fontSize = minFontSize + (term.count / maxCount) * (maxFontSize - minFontSize)

      const span = document.createElement("span")
      span.textContent = term.term
      span.style.fontSize = `${fontSize}px`
      span.style.padding = "8px"
      span.style.display = "inline-block"
      span.style.cursor = "pointer"
      span.style.transition = "transform 0.2s ease"

      // Set color based on category
      if (term.category === "responsibilities") {
        span.style.color = "hsl(var(--primary))" // Blue for responsibilities
      } else {
        span.style.color = "hsl(var(--destructive))" // Red for skills/qualifications
      }

      // Create tooltip text with sources if available
      let tooltipText = `${term.term}: ${term.count} occurrences (${term.category === "responsibilities" ? "Responsibility" : "Skill"})`
      if (term.sources && term.sources.length > 0) {
        tooltipText += `\nSources: ${term.sources
          .filter((s) => s && typeof s === "object")
          .map((s) => `${String(s.company || "Unknown Company")} - ${String(s.role || "Unknown Role")}`)
          .join(", ")}`
      }
      span.title = tooltipText

      span.addEventListener("mouseover", () => {
        span.style.transform = "scale(1.1)"
      })

      span.addEventListener("mouseout", () => {
        span.style.transform = "scale(1)"
      })

      container.appendChild(span)
    })
  }, [filteredTerms])

  return (
    <div className="space-y-4">
      {/* Filter buttons */}
      <div className="flex justify-center gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")} size="sm">
          All ({terms.length})
        </Button>
        <Button
          variant={filter === "responsibilities" ? "default" : "outline"}
          onClick={() => setFilter("responsibilities")}
          size="sm"
          className={
            filter === "responsibilities"
              ? ""
              : "text-primary border-primary hover:bg-primary hover:text-primary-foreground"
          }
        >
          Responsibilities ({terms.filter((t) => t.category === "responsibilities").length})
        </Button>
        <Button
          variant={filter === "qualifications" ? "default" : "outline"}
          onClick={() => setFilter("qualifications")}
          size="sm"
          className={
            filter === "qualifications"
              ? ""
              : "text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
          }
        >
          Skills ({terms.filter((t) => t.category === "qualifications").length})
        </Button>
      </div>

      {/* Color legend */}
      <div className="flex justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span>Responsibilities</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive"></div>
          <span>Skills</span>
        </div>
      </div>

      {/* Cloud display */}
      <div className="p-4 bg-muted/50 rounded-lg min-h-[300px] text-center">
        {filteredTerms.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            {filter === "all"
              ? "No terms to display. Add job listings to build your cloud."
              : `No ${filter === "responsibilities" ? "responsibilities" : "skills"} to display.`}
          </div>
        ) : (
          <div ref={containerRef} className="flex flex-wrap justify-center gap-2"></div>
        )}
      </div>
    </div>
  )
}
