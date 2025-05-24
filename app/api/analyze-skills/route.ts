import { NextResponse } from "next/server";
import { jsonrepair } from "jsonrepair";

export async function POST(request: Request) {
  try {
    const { responsibilities, qualifications } = await request.json();

    if (!responsibilities && !qualifications) {
      return NextResponse.json(
        { error: "No content provided" },
        { status: 400 }
      );
    }

    const content = `
RESPONSIBILITIES:
${responsibilities || "None provided"}

QUALIFICATIONS:
${qualifications || "None provided"}
`;

    const prompt = `
You are a specialized job listing analyzer. I have a list of job responsibilities and qualifications here. Extract the various responsibilities and qualifications into strings of 2-3 words.

INSTRUCTIONS:
1. Analyze the job listing content below.
2. Extract the various responsibilities and qualifications into strings of 2-3 words.
3. The count for each term will always be 1.
4. Group similar terms together (e.g., "React.js" and "React" should be counted as the same skill).
5. Categorize each term as either "responsibility" or "qualification".
6. Return ONLY a JSON object with the following structure:
   {
     "terms": [
       {"term": "skill or responsibility name", "count": 1, "category": "responsibilities" or "qualifications"},
       ...
     ]
   }

IMPORTANT RULES:
- No term should be a single word.  
- Only include relevant professional skills and responsibilities.
- Do not include common words or generic phrases.
- Do not include any explanations or text outside the JSON structure.
- Ensure the JSON is valid and properly formatted.
- Make sure all counts are numeric values, not objects or strings.

EXAMPLE INPUT #1:

RESPONSIBILITIES:
Understand and lead the analysis of the competitive environment, customers, and product metrics to determine the right feature set to drive engagement and usage on LinkedIn  
Drive global product requirements definition, product planning and product design (including writing PRDs) of new product features and enhancements  
Develop a comprehensive product roadmap to deliver on the business goals for LinkedIn  
Work with the product development team and other cross-functional team members to bring features live to the site  
Clearly communicate product benefits to our users and internal stakeholders  

EXAMPLE OUTPUT #1:
{
  "terms": [
    {"term": "competitive analysis", "count": 1, "category": "responsibilities"},
    {"term": "customer analysis", "count": 1, "category": "responsibilities"},
    {"term": "product metrics analysis", "count": 1, "category": "responsibilities"},
    {"term": "feature prioritization", "count": 1, "category": "responsibilities"},
    {"term": "engagement strategy", "count": 1, "category": "responsibilities"},
    {"term": "usage optimization", "count": 1, "category": "responsibilities"},
    {"term": "product requirements definition", "count": 1, "category": "responsibilities"},
    {"term": "product planning", "count": 1, "category": "responsibilities"},
    {"term": "product design", "count": 1, "category": "responsibilities"},
    {"term": "PRD writing", "count": 1, "category": "responsibilities"},
    {"term": "feature enhancement", "count": 1, "category": "responsibilities"},
    {"term": "product roadmap development", "count": 1, "category": "responsibilities"},
    {"term": "business goal alignment", "count": 1, "category": "responsibilities"},
    {"term": "cross-functional collaboration", "count": 1, "category": "responsibilities"},
    {"term": "feature delivery", "count": 1, "category": "responsibilities"},
    {"term": "product launch support", "count": 1, "category": "responsibilities"},
    {"term": "product benefit communication", "count": 1, "category": "responsibilities"},
    {"term": "stakeholder communication", "count": 1, "category": "responsibilities"}
  ]
}

EXAMPLE INPUT #2:

QUALIFICATIONS:
Currently enrolled in a college or university program and returning to school the term following your summer internship  
One of the two qualifications below:  
Currently pursuing a B.A./B.S. degree in a technical or product-related discipline  
Currently pursuing an MBA AND have a technical or product-related undergraduate degree  
One of the two qualifications below:  
Proven experience in entrepreneurship by founding a club, starting a company, or creating an app or product.  
Completed a product management internship, software engineering internship or fellowship with a venture capital/entrepreneurial organization.  
Leader of a club/group on campus.  
Earned a scholarship.  
Product management experience.  
Internship experience at a software-based company.  
Experience in venture capital.  
Experience as a founder.  

EXAMPLE OUTPUT #2:
{
  "terms": [
    {"term": "college enrollment", "count": 1, "category": "qualifications"},
    {"term": "returning student", "count": 1, "category": "qualifications"},
    {"term": "campus leadership", "count": 1, "category": "qualifications"},
    {"term": "scholarship recipient", "count": 1, "category": "qualifications"},
    {"term": "product management experience", "count": 1, "category": "qualifications"},
    {"term": "internship experience", "count": 1, "category": "qualifications"},
    {"term": "software company internship", "count": 1, "category": "qualifications"},
    {"term": "venture capital experience", "count": 1, "category": "qualifications"},
    {"term": "founder experience", "count": 1, "category": "qualifications"},
    {"term": "technical degree pursuit", "count": 1, "category": "qualifications"},
    {"term": "product-related degree", "count": 1, "category": "qualifications"},
    {"term": "MBA candidacy", "count": 1, "category": "qualifications"},
    {"term": "entrepreneurial experience", "count": 1, "category": "qualifications"},
    {"term": "club founder", "count": 1, "category": "qualifications"},
    {"term": "app creation experience", "count": 1, "category": "qualifications"},
    {"term": "company founder", "count": 1, "category": "qualifications"},
    {"term": "product management internship", "count": 1, "category": "qualifications"},
    {"term": "software engineering internship", "count": 1, "category": "qualifications"},
    {"term": "venture fellowship experience", "count": 1, "category": "qualifications"}
  ]
}

NOW ANALYZE THIS JOB LISTING CONTENT:
${content}
`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Groq API error:", errorData);
      return NextResponse.json(
        { error: "Error calling Groq API" },
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
          term: String(term.term || "Unknown Term"),
          count: typeof term.count === "number" ? term.count : 1,
          category:
            term.category === "responsibilities"
              ? "responsibilities"
              : "qualifications",
        }));
      } else {
        parsedData.terms = [];
      }

      return NextResponse.json(parsedData);
    } catch (error) {
      console.error("Error parsing Groq response:", error);
      console.log("Raw response:", data.choices[0].message.content);
      return NextResponse.json(
        { error: "Error parsing Groq response" },
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
