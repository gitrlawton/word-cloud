"use client"

import { useEffect, useRef } from "react"

type TermCount = {
  term: string
  count: number
  category: "responsibilities" | "qualifications"
}

interface TermsCloudProps {
  terms: TermCount[]
}

export function TermsCloud({ terms }: TermsCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || terms.length === 0) return

    const container = containerRef.current
    container.innerHTML = ""

    // Find the maximum count to scale the font sizes
    const maxCount = Math.max(...terms.map((t) => t.count))
    const minFontSize = 14
    const maxFontSize = 42

    // Create and position the terms
    terms.slice(0, 100).forEach((term) => {
      const fontSize = minFontSize + (term.count / maxCount) * (maxFontSize - minFontSize)

      const span = document.createElement("span")
      span.textContent = term.term
      span.style.fontSize = `${fontSize}px`
      span.style.padding = "8px"
      span.style.display = "inline-block"
      span.style.cursor = "pointer"
      span.style.transition = "transform 0.2s ease"
      span.style.color = term.category === "responsibilities" ? "var(--primary)" : "var(--destructive)"
      span.title = `${term.term}: ${term.count} occurrences (${term.category})`

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
