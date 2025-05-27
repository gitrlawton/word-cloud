import { NextResponse } from "next/server"
import { jsonrepair } from "jsonrepair"

export async function POST(request: Request) {
  try {
    const { role, sector, experience, company } = await request.json()

    if (!role || !experience) {
      return NextResponse.json({ error: "Role and experience level are required" }, { status: 400 })
    }

    // Build the search query
    let searchQuery = `${role} ${experience} job listings responsibilities qualifications requirements`
    if (company) {
      searchQuery += ` at ${company}`
    }
    if (sector) {
      searchQuery += ` in ${sector} industry`
    }
    searchQuery += " site:linkedin.com OR site:indeed.com OR site:glassdoor.com"

    const prompt = `
You are a specialized job market researcher. I need you to research current job listings for the following criteria and extract skills and responsibilities with their source information.

SEARCH CRITERIA:
- Role: ${role}
- Experience Level: ${experience}
${company ? `- Company: ${company}` : ""}
${sector ? `- Sector: ${sector}` : ""}

CRITICAL ROLE MATCHING REQUIREMENTS:
- ONLY include job listings that match the EXACT role title "${role}" or very close variations
- For example, if the role is "Product Manager", include:
  ✓ "Product Manager"
  ✓ "Senior Product Manager" 
  ✓ "Product Management"
  ✓ "Jr Product Manager"
  ✓ "Lead Product Manager"
- But DO NOT include:
  ✗ "Product Development Manager"
  ✗ "Product Data Manager" 
  ✗ "Product Portfolio Manager"
  ✗ "Product Marketing Manager"
  ✗ Any role that adds significant additional words that change the core function

INSTRUCTIONS:
1. Research current job listings from this year that match these criteria
2. STRICTLY filter to only include listings where the job title closely matches "${role}"
3. Extract the most common responsibilities and qualifications/skills from these listings
4. For each term, include the company name and specific role title from the job listing where it was found
5. IMPORTANT: Only use ONE job listing per company (do not include multiple listings from the same company)
6. Focus on finding 15-25 of the most frequently mentioned items across different companies
7. Categorize each item as either "responsibilities" or "qualifications"
8. Return ONLY a JSON object with the following structure:
   {
     "terms": [
       {
         "term": "skill or responsibility name", 
         "count": frequency_number, 
         "category": "responsibilities" or "qualifications",
         "sources": [
           {"company": "Company Name", "role": "Specific Job Title"},
           {"company": "Another Company", "role": "Another Job Title"}
         ]
       },
       ...
     ],
     "totalListings": total_number_of_unique_job_listings_analyzed
   }

IMPORTANT RULES:
- Each term should be 2-3 words
- Only include relevant professional skills and responsibilities
- Do not include common words or generic phrases
- Count should reflect how frequently this appears across job listings (1-10 scale)
- Include 1-3 source examples per term showing real companies and job titles where this term appeared
- NEVER include multiple job listings from the same company - use only one listing per company
- STRICTLY adhere to the role title "${role}" - do not include tangentially related roles
- If no specific company is mentioned, use "Unknown Company". It should never be the job board (Indeed, Monster, Glassdoor, etc.)
- Ensure the JSON is valid and properly formatted
- Make sure all counts are numeric values, not objects or strings
- Include the total number of unique job listings analyzed in the "totalListings" field
- Do not include any explanations or text outside the JSON structure

EXAMPLE OUTPUT:
{
  "terms": [
    {
      "term": "React development", 
      "count": 8, 
      "category": "qualifications",
      "sources": [
        {"company": "Meta", "role": "Frontend Engineer"},
        {"company": "Netflix", "role": "Senior Software Engineer"},
        {"company": "Airbnb", "role": "Full Stack Developer"}
      ]
    },
    {
      "term": "team collaboration", 
      "count": 7, 
      "category": "responsibilities",
      "sources": [
        {"company": "Google", "role": "Software Engineer II"},
        {"company": "Microsoft", "role": "Senior Developer"}
      ]
    },
    {
      "term": "JavaScript proficiency", 
      "count": 9, 
      "category": "qualifications",
      "sources": [
        {"company": "Stripe", "role": "Frontend Developer"},
        {"company": "Shopify", "role": "Web Developer"},
        {"company": "Uber", "role": "Software Engineer"}
      ]
    }
  ],
  "totalListings": 15
}

Please research and analyze job listings for the role "${role}" specifically and provide the extracted terms with their source information. Remember to use only ONE listing per company and STRICTLY match the role title.
`

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Perplexity API error:", errorData)
      return NextResponse.json({ error: "Error calling Perplexity API" }, { status: response.status })
    }

    const data = await response.json()

    try {
      const content = data.choices[0].message.content
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[0] : "{}"

      // Attempt to repair the JSON string
      const repairedJsonString = jsonrepair(jsonString)

      // Parse the repaired JSON string
      const parsedData = JSON.parse(repairedJsonString)

      // Validate and sanitize the terms
      if (parsedData.terms && Array.isArray(parsedData.terms)) {
        parsedData.terms = parsedData.terms.map((term: any) => ({
          term: String(term.term || "Unknown Term"),
          count: typeof term.count === "number" ? Math.max(1, Math.min(10, term.count)) : 1,
          category: term.category === "responsibilities" ? "responsibilities" : "qualifications",
          sources: Array.isArray(term.sources)
            ? term.sources.map((source: any) => ({
                company: String(source.company || "Unknown Company"),
                role: String(source.role || "Unknown Role"),
              }))
            : [{ company: "Market Research", role: `${role} (${experience})` }],
        }))
      } else {
        parsedData.terms = []
      }

      // Ensure totalListings is a number
      if (typeof parsedData.totalListings !== "number") {
        parsedData.totalListings = 0
      }

      return NextResponse.json(parsedData)
    } catch (error) {
      console.error("Error parsing Perplexity response:", error)
      console.log("Raw response:", data.choices[0].message.content)
      return NextResponse.json({ error: "Error parsing Perplexity response" }, { status: 500 })
    }
  } catch (error) {
    console.error("Server error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
