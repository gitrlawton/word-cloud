"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ChevronDown, ChevronUp, Search } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type TermSource = {
  company: string
  role: string
  count: number
}

type TermCount = {
  term: string
  count: number
  category: "responsibilities" | "qualifications"
  sources: TermSource[]
}

interface TermsTableProps {
  terms: TermCount[]
}

export function TermsTable({ terms }: TermsTableProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterValue, setFilterValue] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | "responsibilities" | "qualifications">("all")
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set())

  // Filter and sort the terms
  const filteredTerms = terms.filter((term) => {
    const matchesSearch = term.term.toLowerCase().includes(filterValue.toLowerCase())
    const matchesCategory = categoryFilter === "all" || term.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const sortedTerms = [...filteredTerms].sort((a, b) => {
    return sortOrder === "asc" ? a.count - b.count : b.count - a.count
  })

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const toggleExpanded = (term: string) => {
    const newExpanded = new Set(expandedTerms)
    if (newExpanded.has(term)) {
      newExpanded.delete(term)
    } else {
      newExpanded.add(term)
    }
    setExpandedTerms(newExpanded)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter terms..."
            className="pl-8"
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={categoryFilter === "all" ? "default" : "outline"}
            onClick={() => setCategoryFilter("all")}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={categoryFilter === "responsibilities" ? "default" : "outline"}
            onClick={() => setCategoryFilter("responsibilities")}
            size="sm"
          >
            Responsibilities
          </Button>
          <Button
            variant={categoryFilter === "qualifications" ? "default" : "outline"}
            onClick={() => setCategoryFilter("qualifications")}
            size="sm"
          >
            Skills
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]"></TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[100px]">
                <Button variant="ghost" size="sm" onClick={toggleSortOrder} className="font-medium">
                  Count
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTerms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              sortedTerms.map((term, index) => (
                <Collapsible
                  key={index}
                  open={expandedTerms.has(term.term)}
                  onOpenChange={() => toggleExpanded(term.term)}
                  asChild
                >
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {expandedTerms.has(term.term) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                            <span className="sr-only">Toggle details</span>
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="font-medium">{term.term}</TableCell>
                      <TableCell>
                        <span className={term.category === "responsibilities" ? "text-primary" : "text-destructive"}>
                          {term.category === "responsibilities" ? "Responsibility" : "Qualification"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{term.count}</TableCell>
                    </TableRow>
                    <CollapsibleContent asChild>
                      <TableRow>
                        <TableCell colSpan={4} className="bg-muted/30 p-0">
                          <div className="p-4">
                            <h4 className="text-sm font-medium mb-2">Sources:</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Company</TableHead>
                                  <TableHead>Role</TableHead>
                                  <TableHead className="text-right">Count</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {term.sources.map((source, sourceIndex) => (
                                  <TableRow key={sourceIndex}>
                                    <TableCell>{source.company}</TableCell>
                                    <TableCell>{source.role}</TableCell>
                                    <TableCell className="text-right">{source.count}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    </CollapsibleContent>
                  </>
                </Collapsible>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {sortedTerms.length} of {terms.length} terms
      </div>
    </div>
  )
}
