"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TermsCloud } from "@/components/terms-cloud"
import { TermsTable } from "@/components/terms-table"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, RotateCw } from "lucide-react"

type TermCount = {
  term: string
  count: number
  category: "responsibilities" | "qualifications"
  sources: Array<{
    company: string
    role: string
    count: number
  }>
}

export function TermsSkillsGenerator() {
  const [company, setCompany] = useState("")
  const [role, setRole] = useState("")
  const [responsibilities, setResponsibilities] = useState("")
  const [qualifications, setQualifications] = useState("")
  const [termsData, setTermsData] = useState<TermCount[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<"cloud" | "table">("cloud")
  const { toast } = useToast()

  const addToCloud = async () => {
    if (!responsibilities.trim() && !qualifications.trim()) {
      toast({
        title: "No content provided",
        description: "Please add some job listing content to analyze.",
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
          company: company.trim() || "Unspecified Company",
          role: role.trim() || "Unspecified Role",
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

      // Add source information to each term
      const termsWithSource = data.terms.map((term: any) => ({
        ...term,
        sources: [
          {
            company: company.trim() || "Unspecified Company",
            role: role.trim() || "Unspecified Role",
            count: term.count,
          },
        ],
      }))

      // Merge new terms with existing terms
      const updatedTerms = mergeTerms(termsData, termsWithSource)
      setTermsData(updatedTerms)

      toast({
        title: "Analysis complete",
        description: `Added ${data.terms.length} terms to your cloud.`,
      })

      // Clear the input fields
      setCompany("")
      setRole("")
      setResponsibilities("")
      setQualifications("")
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
      termMap.set(term.term, term)
    })

    // Merge new terms
    newTerms.forEach((newTerm) => {
      const existingTerm = termMap.get(newTerm.term)

      if (existingTerm) {
        // Update count if term already exists
        termMap.set(newTerm.term, {
          ...existingTerm,
          count: existingTerm.count + newTerm.count,
          sources: [...existingTerm.sources, ...newTerm.sources],
        })
      } else {
        // Add new term
        termMap.set(newTerm.term, newTerm)
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

  return (
    <div className="grid gap-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Job Listing Information</CardTitle>
          <CardDescription>Optionally provide company and role information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium mb-1">
                Company (Optional)
              </label>
              <Input
                id="company"
                placeholder="Enter company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium mb-1">
                Role (Optional)
              </label>
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
        <Card>
          <CardHeader>
            <CardTitle>What You Will Do</CardTitle>
            <CardDescription>Paste job responsibilities here</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Copy and paste the 'Responsibilities' or 'What You Will Do' section from job listings..."
              className="min-h-[200px]"
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferred Skills</CardTitle>
            <CardDescription>Paste job qualifications here</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Copy and paste the 'Qualifications' or 'Preferred Skills' section from job listings..."
              className="min-h-[200px]"
              value={qualifications}
              onChange={(e) => setQualifications(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          size="lg"
          onClick={addToCloud}
          disabled={isAnalyzing || (!responsibilities.trim() && !qualifications.trim())}
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
              Showing {termsData.length} unique terms from {termsData.reduce((sum, term) => sum + term.count, 0)} total
              mentions
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
