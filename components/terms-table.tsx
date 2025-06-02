"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowUpDown,
  ChevronDown,
  Search,
  Building,
  Briefcase,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import type { TermCount } from "./terms-skills-generator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TermsTableProps {
  terms: TermCount[];
}

type SortField = "term" | "count";
type SortOrder = "asc" | "desc";

export function TermsTable({ terms }: TermsTableProps) {
  const [sortField, setSortField] = useState<SortField>("count");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterValue, setFilterValue] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | "responsibilities" | "qualifications"
  >("all");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const sanitizedTerms = useMemo(() => {
    return terms.map((term) => ({
      ...term,
      term: String(term.term || "Unknown Term"),
      count: typeof term.count === "number" ? term.count : 1,
      category: term.category || "qualifications",
      sources: Array.isArray(term.sources) ? term.sources : [],
    }));
  }, [terms]);

  const { companies, roles } = useMemo(() => {
    const companiesSet = new Set<string>();
    const rolesSet = new Set<string>();

    sanitizedTerms.forEach((term) => {
      if (term.sources) {
        term.sources.forEach((source) => {
          if (source && typeof source === "object") {
            companiesSet.add(String(source.company || "Unknown Company"));
            const roleString = String(source.role || "Unknown Role");
            rolesSet.add(roleString);
          }
        });
      }
    });

    return {
      companies: Array.from(companiesSet).sort(),
      roles: Array.from(rolesSet).sort(),
    };
  }, [sanitizedTerms]);

  const filteredTerms = useMemo(() => {
    return sanitizedTerms.filter((term) => {
      const matchesSearch = String(term.term)
        .toLowerCase()
        .includes(filterValue.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || term.category === categoryFilter;

      let matchesCompany = true;
      let matchesRole = true;

      if (companyFilter) {
        matchesCompany =
          term.sources?.some(
            (source) =>
              source &&
              typeof source === "object" &&
              String(source.company) === companyFilter
          ) || false;
      }

      if (roleFilter) {
        matchesRole =
          term.sources?.some(
            (source) =>
              source &&
              typeof source === "object" &&
              String(source.role) === roleFilter
          ) || false;
      }

      return matchesSearch && matchesCategory && matchesCompany && matchesRole;
    });
  }, [sanitizedTerms, filterValue, categoryFilter, companyFilter, roleFilter]);

  const sortedTerms = useMemo(() => {
    return [...filteredTerms].sort((a, b) => {
      if (sortField === "term") {
        const termA = String(a.term).toLowerCase();
        const termB = String(b.term).toLowerCase();
        return sortOrder === "asc"
          ? termA.localeCompare(termB)
          : termB.localeCompare(termA);
      } else {
        const countA = typeof a.count === "number" ? a.count : 0;
        const countB = typeof b.count === "number" ? b.count : 0;
        return sortOrder === "asc" ? countA - countB : countB - countA;
      }
    });
  }, [filteredTerms, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder(field === "term" ? "asc" : "desc");
    }
  };

  const toggleRowExpanded = (termKey: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [termKey]: !prev[termKey],
    }));
  };

  const clearFilters = () => {
    setFilterValue("");
    setCategoryFilter("all");
    setCompanyFilter(null);
    setRoleFilter(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col min-[551px]:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filter keywords..."
              className="pl-10 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white/80"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            />
          </div>
          <div className="flex justify-center gap-2">
            <Button
              variant={categoryFilter === "all" ? "default" : "outline"}
              onClick={() => setCategoryFilter("all")}
              size="sm"
              className={
                categoryFilter === "all"
                  ? "bg-gradient-to-r from-slate-600 to-slate-700 shadow-lg"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }
            >
              All
            </Button>
            <Button
              variant={
                categoryFilter === "responsibilities" ? "default" : "outline"
              }
              onClick={() => setCategoryFilter("responsibilities")}
              size="sm"
              className={
                categoryFilter === "responsibilities"
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg"
                  : "text-purple-600 border-purple-300 hover:bg-purple-50"
              }
            >
              Responsibilities
            </Button>
            <Button
              variant={
                categoryFilter === "qualifications" ? "default" : "outline"
              }
              onClick={() => setCategoryFilter("qualifications")}
              size="sm"
              className={
                categoryFilter === "qualifications"
                  ? "bg-gradient-to-r from-green-600 to-green-700 shadow-lg"
                  : "text-green-600 border-green-300 hover:bg-green-50"
              }
            >
              Qualifications
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 flex-1"
                >
                  <Building className="mr-2 h-4 w-4" />
                  {companyFilter || "Companies"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-sm border-slate-200">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50 flex-1"
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  {roleFilter || "Roles"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-sm border-slate-200">
                <DropdownMenuCheckboxItem
                  checked={roleFilter === null}
                  onCheckedChange={() => setRoleFilter(null)}
                >
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

          {(filterValue ||
            categoryFilter !== "all" ||
            companyFilter ||
            roleFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="whitespace-nowrap text-slate-600 hover:text-slate-800 hover:bg-slate-100"
            >
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      <div className="border border-slate-200/60 rounded-xl overflow-hidden bg-white/70 backdrop-blur-sm shadow-lg">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
              <TableHead className="p-0">
                <div className="grid grid-cols-[40px_1fr_100px] sm:grid-cols-[40px_1fr_150px_100px] items-center">
                  <div className="flex justify-center py-4"></div>
                  <div className="py-4 px-4 font-semibold text-slate-700 flex items-center">
                    <span>Keyword</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("term")}
                      className="font-semibold h-auto p-0 text-slate-400 hover:bg-transparent hover:text-slate-900"
                    >
                      <ArrowUpDown className="ml-4 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="hidden sm:block py-4 px-4 font-semibold text-slate-700">
                    Category
                  </div>
                  <div className="py-4 px-4 font-semibold text-slate-700 flex items-center">
                    <span>Count</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort("count")}
                      className="font-semibold h-auto p-0 text-slate-400 hover:bg-transparent hover:text-slate-900"
                    >
                      <ArrowUpDown className="ml-4 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTerms.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-slate-500"
                >
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              sortedTerms.map((term, index) => {
                const termKey = `${term.term}-${index}`;
                const isExpanded = expandedRows[termKey];

                return (
                  <motion.tr
                    key={termKey}
                    layout
                    className="group"
                    initial={false}
                    animate={{
                      backgroundColor: isExpanded
                        ? "hsl(248 39% 98%)"
                        : "transparent",
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <TableCell colSpan={4} className="p-0">
                      <div className="relative">
                        <div
                          className="grid grid-cols-[40px_1fr_100px] sm:grid-cols-[40px_1fr_150px_100px] items-center cursor-pointer hover:bg-slate-50/80 transition-colors"
                          onClick={() => toggleRowExpanded(termKey)}
                        >
                          <div className="flex justify-center py-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-slate-100"
                            >
                              <motion.div
                                animate={{ rotate: isExpanded ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <ChevronDown className="h-4 w-4 text-slate-600" />
                              </motion.div>
                              <span className="sr-only">Toggle details</span>
                            </Button>
                          </div>
                          <div className="py-4 px-4 font-semibold text-left text-slate-800">
                            {term.term}
                          </div>
                          <div className="hidden sm:block py-4 px-4 text-left">
                            <span
                              className={`font-medium ${term.category === "responsibilities" ? "text-purple-600" : "text-green-600"}`}
                            >
                              {term.category === "responsibilities"
                                ? "Responsibility"
                                : "Qualification"}
                            </span>
                          </div>
                          <div className="py-4 px-4 text-left font-semibold text-slate-700">
                            {term.count}
                          </div>
                        </div>

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
                                <Card className="border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 shadow-sm">
                                  <CardContent className="p-4">
                                    <motion.div
                                      initial={{ y: -10, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      transition={{ delay: 0.1, duration: 0.2 }}
                                    >
                                      <h4 className="font-semibold mb-3 text-sm flex items-center gap-2 text-slate-700">
                                        Companies & Roles
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {term.sources &&
                                        term.sources.length > 0 ? (
                                          term.sources.map((source, idx) => (
                                            <motion.div
                                              key={idx}
                                              initial={{
                                                scale: 0.8,
                                                opacity: 0,
                                              }}
                                              animate={{ scale: 1, opacity: 1 }}
                                              transition={{
                                                delay: 0.1 + idx * 0.05,
                                                duration: 0.2,
                                              }}
                                            >
                                              <Badge
                                                variant="outline"
                                                className="px-3 py-1 bg-white/80 border-slate-300 text-slate-700 font-medium"
                                              >
                                                {source &&
                                                typeof source === "object"
                                                  ? `${String(source.company || "Unknown Company")} - ${String(source.role || "Unknown Role")}`
                                                  : "Unknown Source"}
                                              </Badge>
                                            </motion.div>
                                          ))
                                        ) : (
                                          <span className="text-slate-500 text-sm">
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-slate-500 font-medium">
        Showing {sortedTerms.length} of {sanitizedTerms.length} terms
      </div>
    </div>
  );
}
