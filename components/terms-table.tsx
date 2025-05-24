"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, ChevronDown, Search, Building, Briefcase, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
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

type SortField = "term" | "count"
type SortOrder = "asc" | "desc"

export function TermsTable({ terms }: TermsTableProps) {
  const [sortField, setSortField] = useState<SortField>("count")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
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
      if (sortField === "term") {
        const termA = String(a.term).toLowerCase()
        const termB = String(b.term).toLowerCase()
        return sortOrder === "asc" ? termA.localeCompare(termB) : termB.localeCompare(termA)
      } else {
        const countA = typeof a.count === "number" ? a.count : 0
        const countB = typeof b.count === "number" ? b.count : 0
        return sortOrder === "asc" ? countA - countB : countB - countA
      }
    })
  }, [filteredTerms, sortField, sortOrder])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // If clicking the same field, toggle the order
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      // If clicking a different field, set it as the sort field with default order
      setSortField(field)
      setSortOrder(field === "term" ? "asc" : "desc") // Default to asc for terms, desc for count
    }
  }

  const toggleRowExpanded = (termKey: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [termKey]: !prev[termKey],
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

      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead className="min-w-[200px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("term")}
                  className="font-medium h-auto p-0 hover:bg-transparent"
                >
                  Term
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("count")}
                  className="font-medium h-auto p-0 hover:bg-transparent"
                >
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
              sortedTerms.map((term, index) => {
                const termKey = `${term.term}-${index}`
                const isExpanded = expandedRows[termKey]

                return (
                  <motion.tr
                    key={termKey}
                    layout
                    className="group"
                    initial={false}
                    animate={{
                      backgroundColor: isExpanded ? "hsl(var(--muted))" : "transparent",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <TableCell colSpan={4} className="p-0">
                      <div className="relative">
                        {/* Main row content */}
                        <div
                          className="grid grid-cols-[40px_1fr_150px_100px] items-center cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleRowExpanded(termKey)}
                        >
                          <div className="flex justify-center py-4">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown className="h-4 w-4" />
                              </motion.div>
                              <span className="sr-only">Toggle details</span>
                            </Button>
                          </div>
                          <div className="py-4 px-4 font-medium text-left">{term.term}</div>
                          <div className="py-4 px-4 text-left">
                            <span
                              className={term.category === "responsibilities" ? "text-primary" : "text-destructive"}
                            >
                              {term.category === "responsibilities" ? "Responsibility" : "Skill"}
                            </span>
                          </div>
                          <div className="py-4 px-4 text-left">{term.count}</div>
                        </div>

                        {/* Expanded content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4">
                                <Card className="border-l-4 border-l-primary/20 bg-background/50">
                                  <CardContent className="p-4">
                                    <motion.div
                                      initial={{ y: -10, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      transition={{ delay: 0.1, duration: 0.2 }}
                                    >
                                      <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                                        Companies & Roles
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {term.sources && term.sources.length > 0 ? (
                                          term.sources.map((source, idx) => (
                                            <motion.div
                                              key={idx}
                                              initial={{ scale: 0.8, opacity: 0 }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              transition={{ delay: 0.1 + idx * 0.05, duration: 0.2 }}
                                            >
                                              <Badge variant="outline" className="px-3 py-1">
                                                {source && typeof source === "object"
                                                  ? `${String(source.company || "Unknown Company")} - ${String(source.role || "Unknown Role")}`
                                                  : "Unknown Source"}
                                              </Badge>
                                            </motion.div>
                                          ))
                                        ) : (
                                          <span className="text-muted-foreground text-sm">
                                            No source information available
                                          </span>
                                        )}
                                      </div>
                                    </motion.div>
                                  </CardContent>
                                </Card>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </TableCell>
                  </motion.tr>
                )
              })
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
