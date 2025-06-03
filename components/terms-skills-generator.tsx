"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { TermsCloud } from "@/components/terms-cloud";
import { TermsTable } from "@/components/terms-table";
import { AutoTermsCloud } from "@/components/auto-terms-cloud";
import { AutoTermsTable } from "@/components/auto-terms-table";
import { AutocompleteInput } from "@/components/autocomplete-input";
import { useToast } from "@/hooks/use-toast";
import {
  PlusCircle,
  RotateCw,
  AlertCircle,
  Building,
  Briefcase,
  Search,
  Zap,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TermCount = {
  term: string;
  count: number;
  category: "responsibilities" | "qualifications";
  sources?: Array<{
    company: string;
    role: string;
  }>;
};

const CHARACTER_LIMIT = 650;

const EXPERIENCE_LEVELS = [
  "Intern",
  "Early Career (0-2 years)",
  "Mid-level (3-5 years)",
  "Senior (6-10 years)",
  "Staff/Principal (10+ years)",
  "Executive/Leadership",
];

const SECTORS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Manufacturing",
  "Consulting",
  "Media & Entertainment",
  "Government",
  "Non-profit",
];

interface TermsSkillsGeneratorProps {
  mode: "manual" | "auto";
  onModeChange: (mode: "manual" | "auto") => void;
}

export function TermsSkillsGenerator({
  mode,
  onModeChange,
}: TermsSkillsGeneratorProps) {
  // Manual input state
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [responsibilitiesChars, setResponsibilitiesChars] = useState(0);
  const [qualificationsChars, setQualificationsChars] = useState(0);

  // Auto generation state
  const [autoRole, setAutoRole] = useState("");
  const [autoSector, setAutoSector] = useState("");
  const [autoExperience, setAutoExperience] = useState("");
  const [autoCompany, setAutoCompany] = useState("");

  // Manual data state (separate from auto-generated)
  const [manualTermsData, setManualTermsData] = useState<TermCount[]>([]);
  const [manualTotalListings, setManualTotalListings] = useState(0);

  // Auto-generated data state (separate from manual)
  const [autoTermsData, setAutoTermsData] = useState<TermCount[]>([]);
  const [autoTotalListings, setAutoTotalListings] = useState(0);

  // Shared state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"cloud" | "table">("cloud");
  const { toast } = useToast();
  const [isCloudGenerated, setIsCloudGenerated] = useState(false);

  // Extract unique companies and roles for autocomplete from manual data only
  const { previousCompanies, previousRoles } = useMemo(() => {
    const companiesSet = new Set<string>();
    const rolesSet = new Set<string>();

    manualTermsData.forEach((term) => {
      if (term.sources) {
        term.sources.forEach((source) => {
          if (source && typeof source === "object") {
            const companyName = String(source.company || "").trim();
            const roleName = String(source.role || "").trim();

            if (
              companyName &&
              companyName !== "Unknown Company" &&
              companyName !== "Market Research"
            ) {
              companiesSet.add(companyName);
            }
            if (
              roleName &&
              roleName !== "Unknown Role" &&
              !roleName.includes("(")
            ) {
              rolesSet.add(roleName);
            }
          }
        });
      }
    });

    return {
      previousCompanies: Array.from(companiesSet).sort(),
      previousRoles: Array.from(rolesSet).sort(),
    };
  }, [manualTermsData]);

  // Update character counts when text changes
  useEffect(() => {
    setResponsibilitiesChars(responsibilities.length);
  }, [responsibilities]);

  useEffect(() => {
    setQualificationsChars(qualifications.length);
  }, [qualifications]);

  const handleResponsibilitiesChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setResponsibilities(value);
  };

  const handleQualificationsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setQualifications(value);
  };

  const getCharacterCountColor = (count: number) => {
    const remaining = CHARACTER_LIMIT - count;
    if (remaining <= 0) return "text-red-600";
    if (remaining < CHARACTER_LIMIT * 0.1) return "text-amber-600";
    return "text-slate-500";
  };

  const getProgressColor = (count: number) => {
    const remaining = CHARACTER_LIMIT - count;
    if (remaining <= 0) return "bg-red-500";
    if (remaining < CHARACTER_LIMIT * 0.1) return "bg-amber-500";
    return "bg-green-600";
  };

  const getProgressValue = (count: number) => {
    const percentage = (count / CHARACTER_LIMIT) * 100;
    return Math.min(percentage, 100);
  };

  const isOverLimit = (count: number) => {
    return count > CHARACTER_LIMIT;
  };

  const getRemainingChars = (count: number) => {
    return CHARACTER_LIMIT - count;
  };

  const addToCloudManual = async () => {
    if (!responsibilities.trim() && !qualifications.trim()) {
      toast({
        title: "No content provided",
        description: "Please add some job listing content to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (
      isOverLimit(responsibilitiesChars) ||
      isOverLimit(qualificationsChars)
    ) {
      toast({
        title: "Character limit exceeded",
        description:
          "Please reduce the text to fit within the 650 character limit.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze-skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          responsibilities,
          qualifications,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.terms) {
        throw new Error("Invalid response format");
      }

      const sourceInfo = {
        company: company.trim() || "Unknown Company",
        role: role.trim() || "Unknown Role",
      };

      const termsWithSource = data.terms.map((term: TermCount) => ({
        ...term,
        count: typeof term.count === "number" ? term.count : 1,
        sources: [sourceInfo],
      }));

      const updatedTerms = mergeTerms(manualTermsData, termsWithSource);
      setManualTermsData(updatedTerms);
      setManualTotalListings((prev) => prev + 1); // Add 1 for manual input

      toast({
        title: "Analysis complete",
        description: `Added ${data.terms.length} terms to your manual cloud.`,
      });

      setResponsibilities("");
      setQualifications("");
      setCompany("");
      setRole("");
    } catch (error) {
      console.error("Error analyzing job listing:", error);
      toast({
        title: "Analysis failed",
        description:
          "There was an error analyzing the job listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const autoGenerate = async () => {
    if (!autoRole.trim() || !autoExperience.trim()) {
      toast({
        title: "Missing required fields",
        description: "Please provide both role and experience level.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/auto-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: autoRole,
          sector: autoSector,
          experience: autoExperience,
          company: autoCompany,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.terms) {
        throw new Error("Invalid response format");
      }

      // The auto-generated data already includes sources from the API
      const termsWithValidatedSources = data.terms.map((term: TermCount) => ({
        ...term,
        count: typeof term.count === "number" ? term.count : 1,
        sources:
          Array.isArray(term.sources) && term.sources.length > 0
            ? term.sources
            : [
                {
                  company: autoCompany.trim() || "Market Research",
                  role: `${autoRole} (${autoExperience})`,
                },
              ],
      }));

      const updatedTerms = mergeTerms(autoTermsData, termsWithValidatedSources);
      setAutoTermsData(updatedTerms);

      // Add the total listings from the API response
      if (typeof data.totalListings === "number") {
        setAutoTotalListings((prev) => prev + data.totalListings);
      }

      toast({
        title: "Auto-generation complete",
        description: `Added ${data.terms.length} terms from ${data.totalListings || 0} job listings to your auto-generated cloud.`,
      });

      setAutoRole("");
      setAutoSector("");
      setAutoExperience("");
      setAutoCompany("");
    } catch (error) {
      console.error("Error auto-generating:", error);
      toast({
        title: "Auto-generation failed",
        description:
          "There was an error researching job listings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const mergeTerms = (
    existingTerms: TermCount[],
    newTerms: TermCount[]
  ): TermCount[] => {
    const termMap = new Map<string, TermCount>();

    existingTerms.forEach((term) => {
      termMap.set(term.term, {
        ...term,
        count: typeof term.count === "number" ? term.count : 1,
      });
    });

    newTerms.forEach((newTerm) => {
      const existingTerm = termMap.get(newTerm.term);

      if (existingTerm) {
        const existingCount =
          typeof existingTerm.count === "number" ? existingTerm.count : 0;
        const newCount = typeof newTerm.count === "number" ? newTerm.count : 1;

        termMap.set(newTerm.term, {
          ...existingTerm,
          count: existingCount + newCount,
          sources: [
            ...(existingTerm.sources || []),
            ...(newTerm.sources || []).filter(
              (newSource) =>
                !(existingTerm.sources || []).some(
                  (existingSource) =>
                    existingSource.company === newSource.company &&
                    existingSource.role === newSource.role
                )
            ),
          ],
        });
      } else {
        termMap.set(newTerm.term, {
          ...newTerm,
          count: typeof newTerm.count === "number" ? newTerm.count : 1,
        });
      }
    });

    return Array.from(termMap.values()).sort((a, b) => b.count - a.count);
  };

  const resetManualCloud = () => {
    if (manualTermsData.length === 0) return;

    setManualTermsData([]);
    setManualTotalListings(0);
    toast({
      title: "Manual cloud reset",
      description: "Your manual terms cloud has been reset.",
    });
  };

  const resetAutoCloud = () => {
    if (autoTermsData.length === 0) return;

    setAutoTermsData([]);
    setAutoTotalListings(0);
    toast({
      title: "Auto-generated cloud reset",
      description: "Your auto-generated terms cloud has been reset.",
    });
  };

  const calculateTotalMentions = (terms: TermCount[]) => {
    return terms.reduce((sum, term) => {
      const count = typeof term.count === "number" ? term.count : 0;
      return sum + count;
    }, 0);
  };

  // Check if sector or company fields should be disabled
  const isSectorDisabled = autoCompany.trim() !== "";
  const isCompanyDisabled = autoSector.trim() !== "";

  // Get current data based on mode
  const currentTermsData = mode === "manual" ? manualTermsData : autoTermsData;
  const currentTotalListings =
    mode === "manual" ? manualTotalListings : autoTotalListings;
  const responsibilitiesCount = currentTermsData.filter(
    (term) => term.category === "responsibilities"
  ).length;
  const skillsCount = currentTermsData.filter(
    (term) => term.category === "qualifications"
  ).length;

  return (
    <div className="grid gap-8 max-w-7xl mx-auto">
      {mode === "manual" ? (
        <>
          {/* Manual Input Mode */}
          <Card className="bg-white border-slate-300 shadow-xl rounded-lg">
            <CardHeader className="rounded-t-lg bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-300">
              <div className="flex items-center gap-3">
                <div className="hidden sm:block p-2 bg-blue-100 rounded-lg">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-800">
                    Company and Role
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Enter company and role information from a job listing
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="company"
                    className="text-slate-700 font-medium"
                  >
                    Company (Optional)
                  </Label>
                  <AutocompleteInput
                    id="company"
                    placeholder="Enter company name"
                    value={company}
                    onChange={setCompany}
                    suggestions={previousCompanies}
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="role" className="text-slate-700 font-medium">
                    Role (Optional)
                  </Label>
                  <AutocompleteInput
                    id="role"
                    placeholder="Enter job role/title"
                    value={role}
                    onChange={setRole}
                    suggestions={previousRoles}
                    className="border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            <Card
              className={`bg-white border-slate-300 shadow-xl ${isOverLimit(responsibilitiesChars) ? "border-red-300 shadow-red-100" : ""}`}
            >
              <CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-300">
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-slate-800">
                      What You Will Do
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Paste job responsibilities here
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  placeholder="Copy and paste the 'Responsibilities' or 'What You Will Do' section from a job listing here"
                  className={`min-h-[200px] resize-none border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 bg-white ${isOverLimit(responsibilitiesChars) ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : ""}`}
                  value={responsibilities}
                  onChange={handleResponsibilitiesChange}
                />
              </CardContent>
              <CardFooter className="flex flex-col items-start pt-0 pb-6 px-6">
                <div className="w-full">
                  <Progress
                    value={getProgressValue(responsibilitiesChars)}
                    className="h-2 mb-2 bg-slate-100"
                    indicatorClassName={getProgressColor(responsibilitiesChars)}
                  />
                </div>
                <div
                  className={`text-sm font-medium ${getCharacterCountColor(responsibilitiesChars)}`}
                >
                  {isOverLimit(responsibilitiesChars) ? (
                    <span className="flex items-center text-red-600 font-semibold">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {Math.abs(getRemainingChars(responsibilitiesChars))}{" "}
                      characters over limit
                    </span>
                  ) : (
                    `${responsibilitiesChars} / ${CHARACTER_LIMIT} characters`
                  )}
                </div>
              </CardFooter>
            </Card>

            <Card
              className={`bg-white border-slate-300 shadow-xl ${isOverLimit(qualificationsChars) ? "border-red-300 shadow-red-100" : ""}`}
            >
              <CardHeader className="rounded-t-lg bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-300">
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block p-2 bg-indigo-100 rounded-lg">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-slate-800">
                      Preferred Skills
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Paste job qualifications here
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <Textarea
                  placeholder="Copy and paste the 'Qualifications' or 'Preferred Skills' section from a job listing here"
                  className={`min-h-[200px] resize-none border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20 bg-white ${isOverLimit(qualificationsChars) ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : ""}`}
                  value={qualifications}
                  onChange={handleQualificationsChange}
                />
              </CardContent>
              <CardFooter className="flex flex-col items-start pt-0 pb-6 px-6">
                <div className="w-full">
                  <Progress
                    value={getProgressValue(qualificationsChars)}
                    className="h-2 mb-2 bg-slate-100"
                    indicatorClassName={getProgressColor(qualificationsChars)}
                  />
                </div>
                <div
                  className={`text-sm font-medium ${getCharacterCountColor(qualificationsChars)}`}
                >
                  {isOverLimit(qualificationsChars) ? (
                    <span className="flex items-center text-red-600 font-semibold">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {Math.abs(getRemainingChars(qualificationsChars))}{" "}
                      characters over limit
                    </span>
                  ) : (
                    `${qualificationsChars} / ${CHARACTER_LIMIT} characters`
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>

          <div className="flex flex-col justify-center gap-6 min-[437px]:flex-row">
            <Button
              size="lg"
              onClick={addToCloudManual}
              disabled={
                isAnalyzing ||
                (!responsibilities.trim() && !qualifications.trim()) ||
                isOverLimit(responsibilitiesChars) ||
                isOverLimit(qualificationsChars)
              }
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 transition-all duration-300 px-8 py-6 text-lg font-semibold"
            >
              {isAnalyzing ? (
                <>
                  <RotateCw className="mr-3 h-5 w-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-3 h-5 w-5" />
                  Add to Cloud
                </>
              )}
            </Button>

            {manualTermsData.length > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={resetManualCloud}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 transition-all duration-300 px-8 py-6 text-lg font-semibold"
              >
                Reset Manual Cloud
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Auto Generate Mode */}
          <Card className="bg-white border-slate-300 shadow-xl rounded">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-300">
              <div className="flex items-center gap-3">
                <div className="hidden sm:block p-2 bg-purple-100 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-800">
                    Auto Generate from Market Research
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Specify criteria and we'll look up current job listing data
                    for you
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="autoRole"
                    className="text-slate-700 font-medium"
                  >
                    Role <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="autoRole"
                    placeholder="e.g., Software Engineer, Product Manager"
                    value={autoRole}
                    onChange={(e) => setAutoRole(e.target.value)}
                    className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white"
                  />
                </div>
                <div className="space-y-3">
                  <Label
                    htmlFor="autoExperience"
                    className="text-slate-700 font-medium"
                  >
                    Experience Level <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={autoExperience}
                    onValueChange={setAutoExperience}
                  >
                    <SelectTrigger className="border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white">
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* OR Section with Visual Separator */}
              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-4 text-slate-500 font-medium text-center">
                      Optionally, narrow your search by sector or specific
                      company
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="autoSector"
                      className={`font-medium ${isSectorDisabled ? "text-slate-400" : "text-slate-700"}`}
                    >
                      Sector{" "}
                      {isSectorDisabled &&
                        "(disabled - clear Company to enable)"}
                    </Label>
                    <Select
                      value={autoSector}
                      onValueChange={(value) => {
                        if (value === "__CLEAR__") {
                          setAutoSector("");
                        } else {
                          setAutoSector(value);
                        }
                      }}
                      disabled={isSectorDisabled}
                    >
                      <SelectTrigger
                        className={`border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 ${
                          isSectorDisabled
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-white"
                        }`}
                      >
                        <SelectValue
                          placeholder={
                            isSectorDisabled
                              ? "Clear Company field to enable"
                              : "Select sector"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {autoSector && (
                          <SelectItem
                            value="__CLEAR__"
                            className="text-slate-500 italic"
                          >
                            Clear selection
                          </SelectItem>
                        )}
                        {SECTORS.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="autoCompany"
                      className={`font-medium ${isCompanyDisabled ? "text-slate-400" : "text-slate-700"}`}
                    >
                      Company{" "}
                      {isCompanyDisabled &&
                        "(disabled - clear Sector to enable)"}
                    </Label>
                    <Input
                      id="autoCompany"
                      placeholder={
                        isCompanyDisabled
                          ? "Clear Sector field to enable"
                          : "e.g., Google, Meta, Apple"
                      }
                      value={autoCompany}
                      onChange={(e) => setAutoCompany(e.target.value)}
                      disabled={isCompanyDisabled}
                      className={`border-slate-200 focus:border-purple-400 focus:ring-purple-400/20 ${
                        isCompanyDisabled
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-white"
                      }`}
                    />
                  </div>
                </div>

                {/* Helper text */}
                <div className="mt-3 text-sm text-slate-500 text-center">
                  {autoSector && autoCompany ? (
                    <span className="text-amber-600 font-medium">
                      ⚠️ Please choose either Sector OR Company, not both
                    </span>
                  ) : autoSector ? (
                    <span>
                      Searching across the <strong>{autoSector}</strong> sector
                    </span>
                  ) : autoCompany ? (
                    <span>
                      Searching specifically at <strong>{autoCompany}</strong>
                    </span>
                  ) : (
                    <span>Choose either Sector OR Company (not both)</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col justify-center gap-6 min-[437px]:flex-row">
            <Button
              size="lg"
              onClick={() => {
                autoGenerate();
                setIsCloudGenerated(true);
              }}
              disabled={
                isAnalyzing ||
                !autoRole.trim() ||
                !autoExperience.trim() ||
                isCloudGenerated
              }
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 transition-all duration-300 px-8 py-6 text-lg font-semibold"
            >
              {isAnalyzing ? (
                <>
                  <RotateCw className="mr-3 h-5 w-5 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Zap className="mr-3 h-5 w-5" />
                  Generate
                </>
              )}
            </Button>

            {autoTermsData.length > 0 && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  resetAutoCloud();
                  setIsCloudGenerated(false);
                }}
                className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-lg shadow-slate-200 hover:shadow-xl hover:shadow-slate-300 transition-all duration-300 px-8 py-6 text-lg font-semibold"
              >
                Reset Auto Cloud
              </Button>
            )}
          </div>
        </>
      )}

      {currentTermsData.length > 0 && (
        <Card className="bg-white border-slate-300 shadow-xl">
          <CardHeader
            className={`rounded-lg border-slate-300 text-center ${
              mode === "manual"
                ? "bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50"
                : "bg-gradient-to-r from-slate-50 to-purple-50"
            }`}
          >
            <CardTitle className="text-slate-800 text-2xl">
              {mode === "manual"
                ? "Manual Keyword Cloud"
                : "Auto-Generated Keyword Cloud"}
            </CardTitle>
            <CardDescription className="text-slate-600 text-lg">
              Showing {currentTermsData.length} unique keywords (
              {responsibilitiesCount} responsibilities, {skillsCount}{" "}
              qualifications) from {calculateTotalMentions(currentTermsData)}{" "}
              total mentions across {currentTotalListings} total listings
            </CardDescription>
            <Tabs
              defaultValue="cloud"
              onValueChange={(value) =>
                setActiveTab(value as "cloud" | "table")
              }
              className="pt-4"
            >
              <TabsList className="grid w-fit mx-auto grid-cols-2 bg-slate-100 p-1 border border-slate-300">
                <TabsTrigger
                  value="cloud"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Cloud View
                </TabsTrigger>
                <TabsTrigger
                  value="table"
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Table View
                </TabsTrigger>
              </TabsList>
              <TabsContent value="cloud" className="mt-8">
                {mode === "manual" ? (
                  <TermsCloud terms={currentTermsData} />
                ) : (
                  <AutoTermsCloud terms={currentTermsData} />
                )}
              </TabsContent>
              <TabsContent value="table" className="mt-8">
                {mode === "manual" ? (
                  <TermsTable terms={currentTermsData} />
                ) : (
                  <AutoTermsTable terms={currentTermsData} />
                )}
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
