"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { TermsCloud } from "@/components/terms-cloud"
import { TermsTable } from "@/components/terms-table"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, RotateCw, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

export type TermCount = {
  term: string
  count: number
  category: "responsibilities" | "qualifications"
  sources?: Array<{
    company: string
    role: string
  }>
}

const CHARACTER_LIMIT = 650

export function TermsSkillsGenerator() {
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [responsibilities, setResponsibilities] = useState("")
  const [qualifications, setQualifications] = useState("")
  const [responsibilitiesChars, setResponsibilitiesChars] = useState(0)
  const [qualificationsChars, setQualificationsChars] = useState(0)
  const [termsData, setTermsData] = useState<TermCount[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<"cloud" | "table">("cloud")
  const { toast } = useToast()

  // Update character counts when text changes
  useEffect(() => {
    setResponsibilitiesChars(responsibilities.length)
  }, [responsibilities])

  useEffect(() => {
    setQualificationsChars(qualifications.length)
  }, [qualifications])

  const handleResponsibilitiesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setResponsibilities(value)
  }

  const handleQualificationsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setQualifications(value)
  }

  const getCharacterCountColor = (count: number) => {
    const remaining = CHARACTER_LIMIT - count
    if (remaining < 0) return "text-destructive"
    if (remaining < CHARACTER_LIMIT * 0.1) return "text-amber-500" // Less than 10% remaining
    return "text-muted-foreground"
  }

  const getProgressColor = (count: number) => {
    const remaining = CHARACTER_LIMIT - count
    if (remaining < 0) return "bg-destructive"
    if (remaining < CHARACTER_LIMIT * 0.1) return "bg-amber-500" // Less than 10% remaining
    return "bg-primary"
  }

  const getProgressValue = (count: number) => {
    const percentage = (count / CHARACTER_LIMIT) * 100
    return Math.min(percentage, 100) // Cap at 100% for the progress bar
  }

  const isOverLimit = (count: number) => {
    return count > CHARACTER_LIMIT
  }

  const getRemainingChars = (count: number) => {
    return CHARACTER_LIMIT - count
  }

  const addToCloud = async () => {
    if (!responsibilities.trim() && !qualifications.trim()) {
      toast({
        title: "No content provided",
        description: "Please add some job listing content to analyze.",
        variant: "destructive",
      })
      return
    }

    // Check if either input exceeds the character limit
    if (isOverLimit(responsibilitiesChars) || isOverLimit(qualificationsChars)) {
      toast({
        title: "Character limit exceeded",
        description: "Please reduce the text to fit within the 650 character limit.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

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
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.terms) {
        throw new Error("Invalid response format")
      }

      // Add source information to terms
      const sourceInfo = {
        company: company.trim() || "Unknown Company",
        role: role.trim() || "Unknown Role",
      }

      const termsWithSource = data.terms.map((term: TermCount) => ({
        ...term,
        count: typeof term.count === "number" ? term.count : 1, // Ensure count is a number
        sources: [sourceInfo],
      }))

      // Merge new terms with existing terms
      const updatedTerms = mergeTerms(termsData, termsWithSource)
      setTermsData(updatedTerms)

      toast({
        title: "Analysis complete",
        description: `Added ${data.terms.length} terms to your cloud.`,
      })

      // Clear the input fields
      setResponsibilities("")
      setQualifications("")
      // Clear company and role as well
      setCompany("")
      setRole("")
    } catch (error) {
      console.error("Error analyzing job listing:", error)
      toast({
        title: "Analysis failed",
        description: "There was an error analyzing the job listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const mergeTerms = (existingTerms: TermCount[], newTerms: TermCount[]): TermCount[] => {
    const termMap = new Map<string, TermCount>()

    // Add existing terms to the map
    existingTerms.forEach((term) => {
      termMap.set(term.term, {
        ...term,
        count: typeof term.count === "number" ? term.count : 1, // Ensure count is a number
      })
    })

    // Merge new terms
    newTerms.forEach((newTerm) => {
      const existingTerm = termMap.get(newTerm.term)

      if (existingTerm) {
        // Update count if term already exists
        const existingCount = typeof existingTerm.count === "number" ? existingTerm.count : 0
        const newCount = typeof newTerm.count === "number" ? newTerm.count : 1

        termMap.set(newTerm.term, {
          ...existingTerm,
          count: existingCount + newCount,
          // Merge sources arrays, avoiding duplicates
          sources: [
            ...(existingTerm.sources || []),
            ...(newTerm.sources || []).filter(
              (newSource) =>
                !(existingTerm.sources || []).some(
                  (existingSource) =>
                    existingSource.company === newSource.company && existingSource.role === newSource.role,
                ),
            ),
          ],
        })
      } else {
        // Add new term
        termMap.set(newTerm.term, {
          ...newTerm,
          count: typeof newTerm.count === "number" ? newTerm.count : 1, // Ensure count is a number
        })
      }
    })

    // Convert map back to array and sort by count
    return Array.from(termMap.values()).sort((a, b) => b.count - a.count)
  }

  const resetCloud = () => {
    if (termsData.length === 0) return

    setTermsData([])
    toast({
      title: "Cloud reset",
      description: "Your terms cloud has been reset.",
    })
  }

  // Calculate total mentions safely
  const calculateTotalMentions = () => {
    return termsData.reduce((sum, term) => {
      const count = typeof term.count === "number" ? term.count : 0
      return sum + count
    }, 0)
  }

  return (
    <div className="grid gap-6">
      {/* Job Listing Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Job Listing Information</CardTitle>
          <CardDescription>Enter company and role information about the job listing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="company">Company (Optional)</Label>
              <Input
                id="company"
                placeholder="Enter company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role (Optional)</Label>
              <Input
                id="role"
                placeholder="Enter job role/title"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className={isOverLimit(responsibilitiesChars) ? "border-destructive" : ""}>
          <CardHeader>
            <CardTitle>What You Will Do</CardTitle>
            <CardDescription>Paste job responsibilities here</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Copy and paste the 'Responsibilities' or 'What You Will Do' section from job listings..."
              className={`min-h-[200px] ${isOverLimit(responsibilitiesChars) ? "border-destructive" : ""}`}
              value={responsibilities}
              onChange={handleResponsibilitiesChange}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start pt-0">
            <div className="w-full">
              <Progress
                value={getProgressValue(responsibilitiesChars)}
                className="h-1 mb-1"
                indicatorClassName={getProgressColor(responsibilitiesChars)}
              />
            </div>
            <div className={`text-xs ${getCharacterCountColor(responsibilitiesChars)}`}>
              {isOverLimit(responsibilitiesChars) ? (
                <span className="flex items-center text-destructive font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {getRemainingChars(responsibilitiesChars)} characters over limit
                </span>
              ) : (
                `${responsibilitiesChars} / ${CHARACTER_LIMIT} characters`
              )}
            </div>
          </CardFooter>
        </Card>

        <Card className={isOverLimit(qualificationsChars) ? "border-destructive" : ""}>
          <CardHeader>
            <CardTitle>Preferred Skills</CardTitle>
            <CardDescription>Paste job qualifications here</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Copy and paste the 'Qualifications' or 'Preferred Skills' section from job listings..."
              className={`min-h-[200px] ${isOverLimit(qualificationsChars) ? "border-destructive" : ""}`}
              value={qualifications}
              onChange={handleQualificationsChange}
            />
          </CardContent>
          <CardFooter className="flex flex-col items-start pt-0">
            <div className="w-full">
              <Progress
                value={getProgressValue(qualificationsChars)}
                className="h-1 mb-1"
                indicatorClassName={getProgressColor(qualificationsChars)}
              />
            </div>
            <div className={`text-xs ${getCharacterCountColor(qualificationsChars)}`}>
              {isOverLimit(qualificationsChars) ? (
                <span className="flex items-center text-destructive font-medium">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {getRemainingChars(qualificationsChars)} characters over limit
                </span>
              ) : (
                `${qualificationsChars} / ${CHARACTER_LIMIT} characters`
              )}
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          size="lg"
          onClick={addToCloud}
          disabled={
            isAnalyzing ||
            (!responsibilities.trim() && !qualifications.trim()) ||
            isOverLimit(responsibilitiesChars) ||
            isOverLimit(qualificationsChars)
          }
        >
          {isAnalyzing ? (
            <>
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add to Cloud
            </>
          )}
        </Button>

        {termsData.length > 0 && (
          <Button size="lg" variant="outline" onClick={resetCloud}>
            Reset Cloud
          </Button>
        )}
      </div>

      {termsData.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Terms & Skills Cloud</CardTitle>
            <CardDescription>
              Showing {termsData.length} unique terms from {calculateTotalMentions()} total mentions
            </CardDescription>
            <Tabs defaultValue="cloud" onValueChange={(value) => setActiveTab(value as "cloud" | "table")}>
              <TabsList className="grid w-[400px] grid-cols-2">
                <TabsTrigger value="cloud">Cloud View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              <TabsContent value="cloud" className="mt-6">
                <TermsCloud terms={termsData} />
              </TabsContent>
              <TabsContent value="table" className="mt-6">
                <TermsTable terms={termsData} />
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
