import { NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";

export async function POST(request: Request) {
  try {
    const { role, sector, experience, company } = await request.json();

    if (!role || !experience) {
      return NextResponse.json(
        { error: "Role and experience level are required" },
        { status: 400 }
      );
    }

    const prompt = `
I need you to search for as many current job listings as possible from this year that match the 
following criteria.  Then, extract skills and responsibilities from the listings with their source information. 

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


For each term, include the company name and specific role title from the job listing. 
Categorize each item as either "responsibilities" or "qualifications". Return ONLY a JSON object with the following structure:
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
     ]
   }

IMPORTANT RULES:
- Each term should consist of 2-3 words
- Count should reflect how many times the term appeared across your job listings search (an integer >= 1.)
- STRICTLY adhere to the role title "${role}" - do not include tangentially related roles  
- Ensure the JSON is valid and properly formatted
- Make sure all counts are numeric values, not objects or strings
- Do not include any explanations or text outside the JSON structure

EXAMPLE OUTPUT:
{
  "terms": [
    {
      "term": "react development", 
      "count": 3, 
      "category": "qualifications",
      "sources": [
        {"company": "Meta", "role": "Frontend Engineer"},
        {"company": "Netflix", "role": "Senior Software Engineer"},
        {"company": "Airbnb", "role": "Full Stack Developer"}
      ]
    },
    {
      "term": "cross-functional collaboration", 
      "count": 2, 
      "category": "responsibilities",
      "sources": [
        {"company": "Google", "role": "Software Engineer II"},
        {"company": "Microsoft", "role": "Senior Developer"}
      ]
    },
    {
      "term": "javascript proficiency", 
      "count": 3, 
      "category": "qualifications",
      "sources": [
        {"company": "Stripe", "role": "Frontend Developer"},
        {"company": "Shopify", "role": "Web Developer"},
        {"company": "Uber", "role": "Software Engineer"}
      ]
    }
  ]
}
`;

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        web_search_options: {
          search_context_size: "medium",
        },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Perplexity API error:", errorData);
      return NextResponse.json(
        { error: "Error calling Perplexity API" },
        { status: response.status }
      );
    }

    const data = await response.json();

    try {
      const content = data.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : "{}";

      // Attempt to repair the JSON string
      const repairedJsonString = jsonrepair(jsonString);

      // Parse the repaired JSON string
      const parsedData = JSON.parse(repairedJsonString);

      // Validate and sanitize the terms
      if (parsedData.terms && Array.isArray(parsedData.terms)) {
        parsedData.terms = parsedData.terms.map((term: any) => ({
          term: String(term.term || "Unknown Term").replace(/-/g, " "), // Replace hyphens with spaces
          count:
            typeof term.count === "number"
              ? Math.max(1, Math.min(10, term.count))
              : 1,
          category:
            term.category === "responsibilities"
              ? "responsibilities"
              : "qualifications",
          sources: Array.isArray(term.sources)
            ? term.sources.map((source: any) => ({
                company: String(source.company || "Unknown Company"),
                role: String(source.role || "Unknown Role"),
              }))
            : [{ company: "Market Research", role: `${role} (${experience})` }],
        }));
      } else {
        parsedData.terms = [];
      }

      // Ensure totalListings is a number
      if (typeof parsedData.totalListings !== "number") {
        parsedData.totalListings = 0;
      }

      return NextResponse.json(parsedData);
    } catch (error) {
      console.error("Error parsing Perplexity response:", error);
      console.log("Raw response:", data.choices[0].message.content);
      return NextResponse.json(
        { error: "Error parsing Perplexity response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
