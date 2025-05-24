import { TermsSkillsGenerator } from "@/components/terms-skills-generator"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-center mb-2">Skill Cloud Generator</h1>
      <p className="text-center text-muted-foreground mb-8">
        Analyze job listings to uncover the most in-demand skills
      </p>
      <TermsSkillsGenerator />
    </main>
  )
}
