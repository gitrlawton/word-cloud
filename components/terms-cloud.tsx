"use client"

import { useEffect, useRef } from "react"
import type { TermCount } from "./terms-skills-generator"

interface TermsCloudProps {
  terms: TermCount[]
}

export function TermsCloud({ terms }: TermsCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || terms.length === 0) return

    const container = containerRef.current
    container.innerHTML = ""

    // Sanitize terms to ensure all have valid properties
    const sanitizedTerms = terms.map((term) => ({
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
      span.style.color = term.category === "responsibilities" ? "var(--primary)" : "var(--destructive)"

      // Create tooltip text with sources if available
      let tooltipText = `${term.term}: ${term.count} occurrences (${term.category})`
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
  }, [terms])

  return (
    <div className="p-4 bg-muted/50 rounded-lg min-h-[300px] text-center">
      {terms.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-muted-foreground">
          No terms to display. Add job listings to build your cloud.
        </div>
      ) : (
        <div ref={containerRef} className="flex flex-wrap justify-center gap-2"></div>
      )}
    </div>
  )
}
