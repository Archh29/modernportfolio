import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Francis Uyguangco",
  jobTitle: "Full Stack Developer",
  url: "https://modernportfolio-navy.vercel.app",
  sameAs: [
    "https://github.com/Archh29",
    "https://www.linkedin.com/in/francis-uyguangco/",
    "https://twitter.com/Archh29",
  ],
  email: "uyguangco.francisbaron@gmail.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Cagayan de Oro City",
    addressCountry: "Philippines",
  },
  knowsAbout: [
    "React",
    "Next.js",
    "Node.js",
    "TypeScript",
    "JavaScript",
    "PHP",
    "MySQL",
    "Unity",
    "C#",
    "Web Development",
    "Game Development",
    "REST API",
    "Tailwind CSS",
    "Framer Motion",
  ],
}

export const metadata: Metadata = {
  title: "Francis Uyguangco | Full Stack Developer",
  description: "Full Stack Developer specializing in web development (React, Next.js, Node.js) and game development with Unity. Building exceptional digital experiences.",
  keywords: ["Full Stack Developer", "Web Developer", "React", "Next.js", "Node.js", "Unity", "Game Development", "TypeScript", "PHP", "MySQL"],
  authors: [{ name: "Francis Uyguangco" }],
  creator: "Francis Uyguangco",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://modernportfolio-navy.vercel.app",
    title: "Francis Uyguangco | Full Stack Developer",
    description: "Full Stack Developer specializing in web development (React, Next.js, Node.js) and game development with Unity. Building exceptional digital experiences.",
    siteName: "Francis Uyguangco Portfolio",
    images: [
      {
        url: "/portfolio1.jpeg",
        width: 1200,
        height: 630,
        alt: "Francis Uyguangco Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Francis Uyguangco | Full Stack Developer",
    description: "Full Stack Developer specializing in web development (React, Next.js, Node.js) and game development with Unity. Building exceptional digital experiences.",
    images: ["/portfolio.png"],
    creator: "@Archh29",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://modernportfolio-navy.vercel.app",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </Suspense>
        {process.env.VERCEL === "1" && <Analytics />}
        <Toaster />
      </body>
    </html>
  )
}
