import { type NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Starting email send process")

    const { name, email, subject, message } = await request.json()

    console.log("[v0] Form data received:", { name, email, subject, messageLength: message?.length })

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.log("[v0] Validation failed - missing fields")
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    console.log("[v0] Environment variables check:", {
      hasGmailUser: !!process.env.GMAIL_USER,
      hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
      gmailUser: process.env.GMAIL_USER,
    })

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.log("[v0] Missing environment variables")
      return NextResponse.json({ error: "Email configuration missing" }, { status: 500 })
    }

    // Create transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    console.log("[v0] Transporter created, attempting to verify connection")

    try {
      await transporter.verify()
      console.log("[v0] SMTP connection verified successfully")
    } catch (verifyError) {
      console.error("[v0] SMTP verification failed:", verifyError)
      return NextResponse.json({ error: "Email server connection failed" }, { status: 500 })
    }

    // Email to yourself
  const mailOptions = {
  from: process.env.GMAIL_USER,
  to: process.env.GMAIL_USER,
  subject: `📩 New Portfolio Contact: ${subject}`,
  html: `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 20px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #eaeaea;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); padding: 20px; color: #fff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 600;">New Contact Form Submission</h1>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Someone reached out from your portfolio</p>
      </div>

      <!-- User Info -->
      <div style="padding: 20px; background-color: #f9fafb;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">👤 Name:</td>
            <td style="padding: 8px 0; color: #555;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">📧 Email:</td>
            <td style="padding: 8px 0; color: #555;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #333;">📝 Subject:</td>
            <td style="padding: 8px 0; color: #555;">${subject}</td>
          </tr>
        </table>
      </div>

      <!-- Message -->
      <div style="padding: 20px; background: #ffffff; border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
        <h3 style="margin-top: 0; font-size: 16px; color: #333;">💬 Message:</h3>
        <p style="white-space: pre-line; line-height: 1.6; color: #444;">${message.replace(/\n/g, "<br>")}</p>
      </div>

      <!-- Reply Section -->
      <div style="padding: 15px; background: #f0f7ff; text-align: center;">
        <a href="mailto:${email}" 
           style="display: inline-block; padding: 10px 20px; background: #2575fc; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Reply to ${name}
        </a>
      </div>

      <!-- Footer -->
      <div style="padding: 12px; background: #fafafa; text-align: center; font-size: 12px; color: #999;">
        <p style="margin: 0;">📌 This message was sent from your portfolio contact form.</p>
      </div>

    </div>
  `,
}


    console.log("[v0] Attempting to send email...")

    // Send email
    const info = await transporter.sendMail(mailOptions)

    console.log("[v0] Email sent successfully:", info.messageId)

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("[v0] Error sending email:", error)
    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
