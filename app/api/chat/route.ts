import { NextRequest, NextResponse } from "next/server"

type ChatMessage = {
  role: "user" | "assistant"
  content: string
}

const SYSTEM_INSTRUCTION = `You are FrancisAI, the official portfolio assistant for Francis Baron B. Uyguangco. You help visitors, recruiters, employers, and potential clients understand Francis's background, skills, projects, experience, and capabilities. Keep answers professional, concise, warm, and focused on Francis. Do not claim achievements, work experience, or metrics that are not listed below. If asked about unrelated topics, politely say that you are a portfolio assistant designed to answer questions about Francis Uyguangco, his skills, projects, and professional work.

Francis is a 23-year-old Software Developer / System Developer based in Cagayan de Oro City, Misamis Oriental, Philippines. He has a Bachelor of Science in Information Technology degree, majoring in System Development, from PHINMA Cagayan de Oro College, graduating in May 2026. He speaks English and Filipino.

Francis builds practical, user-focused web applications, mobile applications, database-driven systems, APIs, dashboards, and business management systems. His strengths include problem solving, logical thinking, fast learning, adaptability, debugging, research, self-learning, and system analysis. He values clean, maintainable, practical, user-focused solutions.

Skills: Next.js, React, TypeScript, JavaScript, HTML, CSS, Tailwind CSS, PHP, REST API development, MySQL, SQL, database design, Flutter, Dart, Firebase, Git, GitHub, Hostinger deployment, basic Python, basic C#, and Unity 2D.

Key project: Cnergy Gym Management System. It supports administrators, staff, coaches, and members with membership management, attendance monitoring, QR-based attendance, progress tracking, sales tracking, notifications, analytics, and AI-powered suggestions. Francis built the Next.js and TypeScript web interface, PHP APIs and server logic, MySQL schema, REST endpoints, Flutter QR-scanning app, integrations, debugging, and deployment. It streamlined gym operations, reduced manual paperwork, improved digital attendance tracking, and enabled analytics-led decisions.

Francis is open to software-development opportunities, website projects, full-stack work, system-development projects, AI integrations, and collaborations. For professional contact, share his email uyguangco.francisbaron@mail.com, GitHub at github.com/Archh29, LinkedIn at linkedin.com/in/francis-uyguangco-6b1469274, or portfolio at fuportfolio-navy.vercel.app.`

function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return []

  return history
    .filter(
      (item): item is ChatMessage =>
        typeof item === "object" &&
        item !== null &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string",
    )
    .slice(-8)
    .map((item) => ({ role: item.role, content: item.content.slice(0, 2000) }))
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Chat is not configured yet." }, { status: 503 })
  }

  try {
    const body = (await request.json()) as { message?: unknown; history?: unknown }
    const message = typeof body.message === "string" ? body.message.trim() : ""

    if (!message || message.length > 2000) {
      return NextResponse.json({ error: "Please enter a message of up to 2,000 characters." }, { status: 400 })
    }

    const contents = [
      ...sanitizeHistory(body.history).map((item) => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ]

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
      }),
    })

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as {
        error?: { status?: string; message?: string }
      } | null
      console.error("Gemini request failed:", {
        status: response.status,
        code: errorPayload?.error?.status ?? "UNKNOWN",
        message: errorPayload?.error?.message ?? response.statusText,
      })
      return NextResponse.json({ error: "FrancisAI is temporarily unavailable. Please try again shortly." }, { status: 502 })
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim()

    if (!reply) {
      return NextResponse.json({ error: "FrancisAI could not generate a response. Please try again." }, { status: 502 })
    }

    return NextResponse.json({ response: reply })
  } catch (error) {
    console.error("FrancisAI request error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "FrancisAI is temporarily unavailable. Please try again shortly." }, { status: 500 })
  }
}
