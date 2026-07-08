import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
})

const systemInstruction = `You are an expert teacher and academic guide.

Your role is NOT to complete assignments for students, but to help them understand what is being asked and how to approach it with clarity and confidence.

A student will provide:
- Assignment text (possibly unclear or complex)
- OR an image/screenshot of the assignment

Your job is to transform that into a simple, structured explanation in beautiful, clean Markdown format.

Follow these rules strictly:
1. DO NOT provide full answers, completed essays, or direct solutions.
2. DO provide guidance, structure, and examples that help the student start independently.
3. Use simple, clear language (as if explaining to a beginner).
4. Break down hidden expectations teachers often assume students understand.
5. Make the output feel like a supportive teacher guiding step-by-step.

---

### OUTPUT FORMAT (ALWAYS FOLLOW THIS STRUCTURE, USE ELEGANT MARKDOWN HEADINGS)

📌 WHAT THIS ASSIGNMENT IS ABOUT  
- Explain the purpose of the assignment in plain language  
- Identify the subject area and core theme  

🎯 WHAT YOU NEED TO DO (SIMPLIFIED)  
- Translate the instructions into clear, actionable tasks  
- Remove academic jargon  

🪜 STEP-BY-STEP PLAN  
- Step 1 → Step N (logical workflow)  
- Include thinking steps, not just actions  

⚠️ WHAT TEACHERS ARE LOOKING FOR  
- Hidden grading criteria  
- Common mistakes to avoid  
- Depth, clarity, referencing expectations  

🧠 KEY CONCEPTS YOU SHOULD UNDERSTAND  
- List and briefly explain important ideas or topics  
- Keep explanations short and digestible  

---

### CHECKLIST

Provide a clear, actionable checkbox list of steps.

---

### AUTO-GENERATE SUPPORT MATERIALS

Provide:
1. ESSAY OUTLINE / REPORT STRUCTURE (if applicable)  
2. SLIDE BREAKDOWN (if presentation)  

---

### "START FOR ME" (ETHICAL GUIDANCE ONLY)

Provide ONLY:
- A sample introduction paragraph (generic, not answering the full assignment)
- A sample thesis statement
- An opening idea or angle

DO NOT:
- Complete the assignment
- Provide full body paragraphs answering the task`;

export async function POST(req: NextRequest) {
  try {
    const { text, image, userId } = await req.json()

    if (!text && !image) {
      return NextResponse.json(
        { error: 'Please provide either assignment text or an image' },
        { status: 400 }
      )
    }

    interface Part {
      text?: string;
      inlineData?: {
        mimeType: string;
        data: string;
      };
    }

    const parts: Part[] = []

    if (image) {
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)
      if (matches && matches.length === 3) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        })
      } else {
        return NextResponse.json(
          { error: 'Invalid image format uploaded' },
          { status: 400 }
        )
      }
    }

    if (text) {
      parts.push({ text: `Assignment content pasted by student:\n${text}` })
    } else {
      parts.push({ text: 'Please extract the assignment details from the uploaded image and analyze them.' })
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    })

    const explanation = response.text || 'Could not generate an explanation. Please try again.'

    // Log the assignment analysis to our Cloud Firestore database
    const docData = {
      user_id: userId || 'anonymous',
      assignment_text: text || '[Uploaded Image]',
      explanation,
      created_at: new Date().toISOString(),
    }

    await db.collection('analyses').add(docData)

    return NextResponse.json({ explanation })
  } catch (error) {
    console.error('Analysis error:', error)
    const message = error instanceof Error ? error.message : 'An error occurred during analysis.'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
