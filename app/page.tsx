import { TermsSkillsGenerator } from "@/components/terms-skills-generator"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-2">Terms & Skills Cloud Generator</h1>
      <p className="text-center text-muted-foreground mb-8">
        Analyze job listings to discover the most in-demand terms and skills
      </p>
      <TermsSkillsGenerator />
    </main>
  )
}
