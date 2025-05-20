import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { company, role, responsibilities, qualifications } =
      await request.json();

    if (!responsibilities && !qualifications) {
      return NextResponse.json(
        { error: "No content provided" },
        { status: 400 }
      );
    }

    // Prepare the content for analysis - without company/role
    const content = `
RESPONSIBILITIES:
${responsibilities || "None provided"}

QUALIFICATIONS:
${qualifications || "None provided"}
`;

    // Prepare the prompt for Groq
    const prompt = `
You are a specialized job listing analyzer. Your task is to extract skills, technologies, and responsibilities from job listings.

INSTRUCTIONS:
1. Analyze the job listing content below.
2. Identify specific skills, technologies, and responsibilities mentioned.
3. Count how many times each term appears.
4. Group similar terms together (e.g., "React.js" and "React" should be counted as the same skill).
5. Categorize each term as either "responsibility" or "qualification".
6. Return ONLY a JSON object with the following structure:
   {
     "terms": [
       {"term": "skill or responsibility name", "count": number, "category": "responsibilities" or "qualifications"},
       ...
     ]
   }

IMPORTANT RULES:
- Focus on complete phrases rather than individual words (e.g., "product management" not just "product").
- Only include relevant professional skills and responsibilities.
- Do not include common words or generic phrases.
- Do not include any explanations or text outside the JSON structure.
- Ensure the JSON is valid and properly formatted.

JOB LISTING CONTENT:
${content}
`;

    // Call Groq API
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3-70b-8192",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 4000,
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

    // Extract the JSON from the response
    try {
      const content = data.choices[0].message.content;
      // Parse the JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : "{}";
      const parsedData = JSON.parse(jsonString);

      // Add company and role information to each term
      const companyName = company?.trim() || "Unspecified Company";
      const roleName = role?.trim() || "Unspecified Role";

      if (parsedData.terms && Array.isArray(parsedData.terms)) {
        // Add source information to each term
        parsedData.terms = parsedData.terms.map((term: any) => ({
          ...term,
          sources: [
            {
              company: companyName,
              role: roleName,
              count: term.count,
            },
          ],
        }));
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
