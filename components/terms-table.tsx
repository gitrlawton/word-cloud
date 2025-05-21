"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ChevronDown, ChevronUp, Search, Building, Briefcase, Filter } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import type { TermCount } from "./terms-skills-generator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TermsTableProps {
  terms: TermCount[]
}

export function TermsTable({ terms }: TermsTableProps) {
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filterValue, setFilterValue] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | "responsibilities" | "qualifications">("all")
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})
  const [companyFilter, setCompanyFilter] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)

  // Ensure all terms have valid properties
  const sanitizedTerms = useMemo(() => {
    return terms.map((term) => ({
      ...term,
      term: String(term.term || "Unknown Term"),
      count: typeof term.count === "number" ? term.count : 1,
      category: term.category || "qualifications",
      sources: Array.isArray(term.sources) ? term.sources : [],
    }))
  }, [terms])

  // Extract unique companies and roles from all terms
  const { companies, roles } = useMemo(() => {
    const companiesSet = new Set<string>()
    const rolesSet = new Set<string>()

    sanitizedTerms.forEach((term) => {
      if (term.sources) {
        term.sources.forEach((source) => {
          if (source && typeof source === "object") {
            companiesSet.add(String(source.company || "Unknown Company"))
            rolesSet.add(String(source.role || "Unknown Role"))
          }
        })
      }
    })

    return {
      companies: Array.from(companiesSet).sort(),
      roles: Array.from(rolesSet).sort(),
    }
  }, [sanitizedTerms])

  // Filter and sort the terms
  const filteredTerms = useMemo(() => {
    return sanitizedTerms.filter((term) => {
      // Text search filter
      const matchesSearch = String(term.term).toLowerCase().includes(filterValue.toLowerCase())

      // Category filter
      const matchesCategory = categoryFilter === "all" || term.category === categoryFilter

      // Company and role filters
      let matchesCompany = true
      let matchesRole = true

      if (companyFilter) {
        matchesCompany =
          term.sources?.some(
            (source) => source && typeof source === "object" && String(source.company) === companyFilter,
          ) || false
      }

      if (roleFilter) {
        matchesRole =
          term.sources?.some((source) => source && typeof source === "object" && String(source.role) === roleFilter) ||
          false
      }

      return matchesSearch && matchesCategory && matchesCompany && matchesRole
    })
  }, [sanitizedTerms, filterValue, categoryFilter, companyFilter, roleFilter])

  const sortedTerms = useMemo(() => {
    return [...filteredTerms].sort((a, b) => {
      const countA = typeof a.count === "number" ? a.count : 0
      const countB = typeof b.count === "number" ? b.count : 0
      return sortOrder === "asc" ? countA - countB : countB - countA
    })
  }, [filteredTerms, sortOrder])

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
  }

  const toggleRowExpanded = (term: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [term]: !prev[term],
    }))
  }

  const clearFilters = () => {
    setFilterValue("")
    setCategoryFilter("all")
    setCompanyFilter(null)
    setRoleFilter(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        {/* Search and category filters */}
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

        {/* Company and role filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Building className="mr-2 h-4 w-4" />
                  {companyFilter || "All Companies"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuCheckboxItem
                  checked={companyFilter === null}
                  onCheckedChange={() => setCompanyFilter(null)}
                >
                  All Companies
                </DropdownMenuCheckboxItem>
                {companies.map((company) => (
                  <DropdownMenuCheckboxItem
                    key={company}
                    checked={companyFilter === company}
                    onCheckedChange={() => setCompanyFilter(company)}
                  >
                    {company}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Briefcase className="mr-2 h-4 w-4" />
                  {roleFilter || "All Roles"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuCheckboxItem checked={roleFilter === null} onCheckedChange={() => setRoleFilter(null)}>
                  All Roles
                </DropdownMenuCheckboxItem>
                {roles.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role}
                    checked={roleFilter === role}
                    onCheckedChange={() => setRoleFilter(role)}
                  >
                    {role}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {(filterValue || categoryFilter !== "all" || companyFilter || roleFilter) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="whitespace-nowrap">
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
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
                  open={expandedRows[term.term]}
                  onOpenChange={() => toggleRowExpanded(term.term)}
                  asChild
                >
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => toggleRowExpanded(term.term)}>
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            {expandedRows[term.term] ? (
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
                        <TableCell colSpan={4} className="bg-muted/30 p-4">
                          <div className="text-sm">
                            <h4 className="font-semibold mb-2">Companies & Roles:</h4>
                            <div className="flex flex-wrap gap-2">
                              {term.sources && term.sources.length > 0 ? (
                                term.sources.map((source, idx) => (
                                  <Badge key={idx} variant="outline" className="px-2 py-1">
                                    {source && typeof source === "object"
                                      ? `${String(source.company || "Unknown Company")} - ${String(source.role || "Unknown Role")}`
                                      : "Unknown Source"}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-muted-foreground">No source information available</span>
                              )}
                            </div>
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
        Showing {sortedTerms.length} of {sanitizedTerms.length} terms
      </div>
    </div>
  )
}
