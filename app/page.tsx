"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, useScroll, useSpring, type Variants } from "framer-motion"
import {
  ArrowDown,
  Github as GitHub,
  Linkedin,
  Mail,
  ExternalLink,
  Menu,
  X,
  MoonIcon,
  SunIcon,
  Sparkles,
  Code,
  Palette,
  Zap,
  Send,
  Download,
  Database,
  Layout,
  Gamepad2,
  Lightbulb,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  X as CloseIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useMobile } from "@/hooks/use-mobile"
import { useToast } from "@/hooks/use-toast"
import { z } from "zod"
import { track } from "@vercel/analytics"

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type ContactFormData = z.infer<typeof contactFormSchema>

export default function Home() {
  const [activeSection, setActiveSection] = useState("home")
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const isMobile = useMobile()
  const { toast } = useToast()
  const [selectedCategory, setSelectedCategory] = useState("All")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({})
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)

  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", updateMousePosition)
    return () => window.removeEventListener("mousemove", updateMousePosition)
  }, [])

  // Update active section based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "skills", "services", "projects", "contact"]
      const scrollPosition = window.scrollY + 100
      const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)

      // Track scroll depth at 25%, 50%, 75%, and 100%
      if (scrollDepth >= 25 && scrollDepth < 50) {
        track("scroll_depth", { depth: "25%" })
      } else if (scrollDepth >= 50 && scrollDepth < 75) {
        track("scroll_depth", { depth: "50%" })
      } else if (scrollDepth >= 75 && scrollDepth < 100) {
        track("scroll_depth", { depth: "75%" })
      } else if (scrollDepth >= 100) {
        track("scroll_depth", { depth: "100%" })
      }

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetHeight = element.offsetHeight

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80,
        behavior: "smooth",
      })
      setActiveSection(sectionId)
      setMenuOpen(false)
    }
  }

  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "skills", label: "Skills" },
    { id: "services", label: "Services" },
    { id: "projects", label: "Projects" },
    { id: "contact", label: "Contact" },
  ]

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 200,
      },
    },
  }

  const floatingVariants: Variants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      // Validate form data
      const validatedData = contactFormSchema.parse(formData)

      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validatedData),
      })

      if (response.ok) {
        track("contact_form_submitted", { subject: validatedData.subject })
        toast({
          title: "Message sent successfully!",
          description: "Thank you for your message. I'll get back to you soon.",
        })
        setFormData({ name: "", email: "", subject: "", message: "" })
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof ContactFormData] = err.message
          }
        })
        setErrors(fieldErrors)
        toast({
          title: "Validation Error",
          description: "Please check the form for errors.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed to send message",
          description: "Please try again or contact me directly via email.",
          variant: "destructive",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-accent text-accent-foreground px-4 py-2 rounded-lg z-50"
      >
        Skip to main content
      </a>
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent via-purple-500 to-accent z-50 origin-left"
        style={{ scaleX }}
        aria-hidden="true"
      />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-accent/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-xl z-40 border-b border-border/50" role="banner">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-bold relative"
            aria-label="Francis Uyguangco - Portfolio"
          >
            <motion.span
              className="text-foreground"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              F
            </motion.span>
            <span className="text-foreground">U</span>
            <motion.div
              className="absolute -inset-2 bg-accent/20 rounded-lg blur-lg opacity-0"
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          <nav className="flex items-center gap-4" aria-label="Main navigation">
            {mounted && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  className="relative overflow-hidden"
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: theme === "dark" ? 180 : 0 }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  >
                    {theme === "dark" ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                  </motion.div>
                </Button>
              </motion.div>
            )}

            {isMobile ? (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="ghost" size="icon" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen}>
                    <motion.div animate={{ rotate: menuOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </motion.div>
                  </Button>
                </motion.div>

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-16 left-0 right-0 bg-card/95 backdrop-blur-xl border-b border-border py-4"
                    >
                      <nav className="flex flex-col space-y-2 px-4">
                        {navItems.map((item, index) => (
                          <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => scrollToSection(item.id)}
                            className={`px-4 py-3 rounded-lg transition-all text-left relative overflow-hidden ${
                              activeSection === item.id
                                ? "bg-accent text-accent-foreground shadow-lg"
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {item.label}
                          </motion.button>
                        ))}
                      </nav>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <motion.nav
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex space-x-1"
              >
                {navItems.map((item) => (
                  <motion.button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`px-4 py-2 rounded-lg transition-all relative overflow-hidden ${
                      activeSection === item.id
                        ? "bg-accent text-accent-foreground shadow-lg"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {item.label}
                    {activeSection === item.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-accent rounded-lg -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </motion.button>
                ))}
              </motion.nav>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 min-h-screen flex items-center relative">
        <div id="main-content" className="container mx-auto px-4">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-12">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="flex-1">
              <motion.div variants={itemVariants} className="mb-6">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent/5 border border-accent/20 rounded-full text-sm text-foreground mb-4"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  Available for new opportunities
                </motion.div>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-balance"
              >
                Hi, I'm{" "}
                <motion.span
                  className="text-foreground relative inline-block hover:text-accent transition-colors"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  Francis Uyguangco
                  <motion.div
                    className="absolute inset-0 bg-accent/10 blur-xl rounded-lg opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.span>
              </motion.h1>

              <motion.h2
                variants={itemVariants}
                className="text-2xl md:text-3xl font-medium text-muted-foreground mb-6"
              >
                System Developer
              </motion.h2>

              <motion.p variants={itemVariants} className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
                I build exceptional web experiences that are fast, accessible, and visually appealing, and also create
                engaging games with Unity.
              </motion.p>

              <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => scrollToSection("contact")}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground relative overflow-hidden group"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-accent to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={false}
                    />
                    <span className="relative z-10">Get in Touch</span>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" onClick={() => scrollToSection("projects")}>
                    View My Work
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      track("resume_download", { location: "hero" })
                      const link = document.createElement("a")
                      link.href = "/resume.pdf"
                      link.download = "Francis_Uyguangco_Resume.pdf"
                      link.click()
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Resume
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              className="flex-1 flex justify-center"
            >
              <motion.div className="relative w-64 h-64 md:w-80 md:h-80" variants={floatingVariants} animate="animate">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 to-purple-500/20 blur-2xl"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                <motion.div
                  className="relative w-full h-full rounded-full overflow-hidden border-4 border-accent/30 shadow-2xl"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Image src="/profile1.jpeg" alt="Francis Uyguangco" fill className="object-cover" priority />
                  <motion.div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </motion.div>
                <motion.div
                  className="absolute -top-4 -right-4 w-12 h-12 bg-accent/10 backdrop-blur-sm border border-accent/20 rounded-full flex items-center justify-center"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Code className="w-6 h-6 text-accent" />
                </motion.div>
                <motion.div
                  className="absolute -bottom-4 -left-4 w-12 h-12 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full flex items-center justify-center"
                  animate={{ rotate: [360, 0] }}
                  transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Palette className="w-6 h-6 text-purple-500" />
                </motion.div>
                <motion.div
                  className="absolute top-1/2 -right-8 w-10 h-10 bg-orange-500/10 backdrop-blur-sm border border-orange-500/20 rounded-full flex items-center justify-center"
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  <Zap className="w-5 h-5 text-orange-500" />
                </motion.div>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer"
            onClick={() => scrollToSection("about")}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <ArrowDown className="w-10 h-10 text-accent" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              whileInView={{ scale: [0.9, 1] }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              About Me
            </motion.h2>
            <motion.div
              className="w-20 h-1 bg-gradient-to-r from-accent to-purple-500 mx-auto rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 80 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <div className="flex flex-col md:flex-row gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex-1"
            >
              <h3 className="text-2xl font-bold mb-6">My Journey</h3>
              <motion.p
                className="text-muted-foreground mb-4 leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                I am a Bachelor of Science in Information Technology graduate with a specialization in System Development, passionate about building practical, user-focused software solutions. My expertise includes full-stack web development using JavaScript, React, Next.js, PHP, MySQL, and modern development tools, while also exploring mobile application development with Flutter and game development with Unity.

My journey began by creating small personal projects and has grown into developing full-stack web applications and mobile solutions that solve real-world problems. Through academic projects, personal initiatives, and continuous self-learning, I have strengthened my skills in software development, database design, API integration, and responsive user interface development.

I enjoy tackling challenging problems, learning new technologies, and continuously improving my craft through hands-on experience. I value writing clean, maintainable code and creating applications that are both functional and intuitive for users.
              </motion.p>
              <motion.p
                className="text-muted-foreground mb-4 leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                viewport={{ once: true }}
              >
                My journey started with small projects, and over the years, I’ve gained practical experience building
                web applications and games. I enjoy solving problems, learning new frameworks, and improving my skills
                through hands-on projects.
              </motion.p>
              <motion.p
                className="text-muted-foreground leading-relaxed"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                viewport={{ once: true }}
              >
                When I’m not coding, you can find me playing strategy games like chess and Dota 2, experimenting with
                new tech, or analyzing problems to find efficient solutions.
              </motion.p>
              <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                viewport={{ once: true }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      track("resume_download", { location: "about" })
                      const link = document.createElement("a")
                      link.href = "/resume.pdf"
                      link.download = "Francis_Uyguangco_Resume.pdf"
                      link.click()
                    }}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Resume
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex-1"
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    title: "Education",
                    content: "Bachelor's in Information Technology, Phinma Cagayan de Oro College",
                  },
                  {
                    title: "Experience",
                    content:
                      "Gained extensive experience developing web applications through academic projects, personal projects, and continuous learning.",
                  },
                  {
                    title: "Location",
                    content: "Cagayan de Oro City, Philippines",
                  },
                  {
                    title: "Technologies",
                    content:
                      "React, Next.js, Node.js, TypeScript, PHP, MySQL, Unity, C#, REST APIs, Tailwind CSS, Git",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    className="bg-background/80 backdrop-blur-sm p-6 rounded-xl border border-border/50 hover:border-accent/30 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02, y: -5 }}
                  >
                    <h4 className="font-bold mb-2">{item.title}</h4>
                    <p className="text-muted-foreground text-sm">{item.content}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              whileInView={{ scale: [0.9, 1] }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              My Skills
            </motion.h2>
            <motion.div
              className="w-20 h-1 bg-gradient-to-r from-accent to-purple-500 mx-auto rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 80 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              {
                name: "JavaScript",
                level: 90,
                color: "from-yellow-400 to-orange-500",
              },
              {
                name: "React",
                level: 85,
                color: "from-blue-400 to-cyan-500",
              },
              {
                name: "Node.js",
                level: 80,
                color: "from-green-400 to-emerald-500",
              },
              {
                name: "TypeScript",
                level: 75,
                color: "from-blue-500 to-indigo-600",
              },
              {
                name: "Next.js",
                level: 85,
                color: "from-gray-700 to-gray-900",
              },
              {
                name: "CSS/Tailwind",
                level: 90,
                color: "from-teal-400 to-blue-500",
              },
              {
                name: "UI/UX Design",
                level: 70,
                color: "from-pink-400 to-rose-500",
              },
              {
                name: "C#",
                level: 65,
                color: "from-purple-400 to-pink-500",
              },
              {
                name: "PHP",
                level: 75,
                color: "from-indigo-400 to-purple-600",
              },
              {
                name: "MySQL",
                level: 80,
                color: "from-blue-400 to-blue-600",
              },
              {
                name: "Unity",
                level: 70,
                color: "from-gray-600 to-gray-800",
              },
              {
                name: "REST API",
                level: 85,
                color: "from-green-400 to-teal-500",
              },
              {
                name: "Git",
                level: 80,
                color: "from-orange-400 to-red-500",
              },
            ].map((skill, index) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  type: "spring",
                  bounce: 0.4,
                }}
                viewport={{ once: true }}
                className="bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-border/50 hover:border-accent/30 transition-all duration-300 group"
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <h3 className="font-bold mb-3 group-hover:text-accent transition-colors">{skill.name}</h3>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${skill.level}%` }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className={`bg-gradient-to-r ${skill.color} h-3 rounded-full relative overflow-hidden`}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{ x: [-100, 200] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    />
                  </motion.div>
                </div>
                <p className="text-right text-sm mt-2 text-muted-foreground font-medium">{skill.level}%</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              whileInView={{ scale: [0.9, 1] }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              My Services
            </motion.h2>
            <motion.div
              className="w-20 h-1 bg-gradient-to-r from-accent to-purple-500 mx-auto rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 80 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Code,
                title: "Full Stack Web Development",
                description: "Build responsive web applications using React, Next.js, PHP, MySQL, TypeScript, and Tailwind CSS.",
              },
              {
                icon: Palette,
                title: "Mobile App Development",
                description: "Develop cross-platform mobile applications with Flutter and integrate them with backend services.",
              },
              {
                icon: Zap,
                title: "REST API Development",
                description: "Create and integrate REST APIs for secure communication between applications and databases.",
              },
              {
                icon: Database,
                title: "Database Design",
                description: "Design and manage MySQL databases with efficient schemas and optimized queries.",
              },
              {
                icon: Layout,
                title: "Responsiveness UI Development",
                description: "Build clean, responsive, and user-friendly interfaces that work across all devices.",
              },
              {
                icon: Gamepad2,
                title: "Game Development (Unity)",
                description: "Develop interactive 2D games and gameplay systems using Unity and C#.",
              },
             
            ].map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                  type: "spring",
                  bounce: 0.4,
                }}
                viewport={{ once: true }}
                className="bg-background/80 backdrop-blur-sm p-6 rounded-xl border border-border/50 hover:border-accent/30 transition-all duration-300 group"
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <motion.div
                  className="bg-accent/10 p-4 rounded-xl border border-accent/20 w-fit mb-4 group-hover:bg-accent/20 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <service.icon className="h-6 w-6 text-accent" />
                </motion.div>
                <h3 className="font-bold mb-2 group-hover:text-accent transition-colors">{service.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{service.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              whileInView={{ scale: [0.9, 1] }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              My Projects
            </motion.h2>
            <motion.div
              className="w-20 h-1 bg-gradient-to-r from-accent to-purple-500 mx-auto rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 80 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {["All", "Web Development", "Mobile", "Game Development"].map((category) => (
              <motion.button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg transition-all relative overflow-hidden ${
                  selectedCategory === category
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : "bg-background/50 text-muted-foreground hover:text-foreground border border-border/50"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Gravity Shift",
                description:
                  "A Unity 2D platformer game featuring gravity manipulation mechanics and challenging level design.",
                image: "/gravity.png",
                tags: ["Unity", "C#", "2D Game Development"],
                category: "Game Development",
                gradient: "from-purple-500 to-indigo-600",
                githubUrl: "https://github.com/Archh29/gravity-shift#",
                demoUrl: "https://francis385.itch.io/gravity-shift",
              },
              {
                title: "Cnergy Gym Management System",
                description:
                  "A comprehensive monitoring and progress tracking system with sales features for cnergy gym management. Built with Next.js for admin/staff interfaces and Flutter for coach/user mobile apps.",
                image: "ss.png",
                tags: ["Next.js", "Flutter", "TypeScript", "Mobile Development"],
                category: "Mobile",
                gradient: "from-green-500 to-emerald-600",
                githubUrl: "https://github.com/Archh29/Cnergy-Gym",
                demoUrl: "https://cnergy.site",
              },
              {
                title: "Portfolio Website",
                description: "A responsive portfolio website with dark mode and smooth animations.",
                image: "pfp.png",
                tags: ["Next.js", "Framer Motion", "Tailwind CSS"],
                category: "Web Development",
                gradient: "from-purple-500 to-pink-600",
                githubUrl: "https://github.com/Archh29/modernportfolio",
                demoUrl: "https://modernportfolio-navy.vercel.app/",
              },
              {
                title: "FrancisAI - Personal Chatbot",
                description: "Developed an AI-powered portfolio assistant using Gemini API that provides interactive information about my professional background, technical skills, projects, and software development services. Implemented custom AI instructions to create a personalized conversational experience for recruiters and potential clients.",
                image: "/ai.png",
                tags: ["Next.js", "Gemini API", "TypeScript", "AI/ML"],
                category: "Web Development",
                gradient: "from-violet-500 to-purple-600",
                githubUrl: "https://github.com/Archh29/francisai",
                demoUrl: "https://francisai-gamma.vercel.app/",
              },
              {
                title: "Hardware Management System",
                description:
                  "A comprehensive hardware management system for tracking, monitoring, and managing hardware inventory, maintenance schedules, and asset lifecycle.",
                image: "/placeholder-user.jpg",
                tags: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"],
                category: "Web Development",
                gradient: "from-green-500 to-teal-600",
                githubUrl: "#",
                demoUrl: "#",
              },
            ]
              .filter((project) => selectedCategory === "All" || project.category === selectedCategory)
              .map((project, index) => (
              <motion.div
                key={project.title}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.2,
                  type: "spring",
                  bounce: 0.4,
                }}
                viewport={{ once: true, margin: "-100px" }}
                className="bg-background/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-border/50 hover:border-accent/30 transition-all duration-500 group"
                whileHover={{ scale: 1.02, y: -10 }}
              >
                <div className="relative h-48 overflow-hidden">
                  <motion.div
                    className={`absolute inset-0 bg-gradient-to-br ${project.gradient} opacity-20 group-hover:opacity-30 transition-opacity`}
                  />
                  <Image
                    src={project.image || "/placeholder.svg"}
                    alt={project.title}
                    fill
                    loading="lazy"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <motion.div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                </div>
                <div className="p-6">
                  <motion.h3
                    className="text-xl font-bold mb-2 group-hover:text-accent transition-colors"
                    whileHover={{ x: 5 }}
                  >
                    {project.title}
                  </motion.h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag, tagIndex) => (
                      <motion.span
                        key={tag}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: tagIndex * 0.1 }}
                        viewport={{ once: true }}
                        className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full border border-accent/20 hover:bg-accent/20 transition-colors"
                        whileHover={{ scale: 1.05 }}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("project_click", { project: project.title, type: "github" })}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 bg-transparent hover:bg-accent/10"
                        >
                          <GitHub className="h-4 w-4" />
                          Code
                        </Button>
                      </a>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => track("project_click", { project: project.title, type: "demo" })}
                      >
                        <Button
                          size="sm"
                          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground relative overflow-hidden group"
                        >
                          <motion.div className="absolute inset-0 bg-gradient-to-r from-accent to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <span className="relative z-10 flex items-center gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Demo
                          </span>
                        </Button>
                      </a>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-background relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              whileInView={{ scale: [0.9, 1] }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              Get In Touch
            </motion.h2>
            <motion.div
              className="w-20 h-1 bg-gradient-to-r from-accent to-purple-500 mx-auto rounded-full"
              initial={{ width: 0 }}
              whileInView={{ width: 80 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            />
          </motion.div>

          <div className="flex flex-col md:flex-row gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex-1"
            >
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-6">
                {[
                  {
                    icon: Mail,
                    title: "Email",
                    content: "uyguangco.francisbaron@gmail.com",
                    color: "text-blue-500",
                  },
                  {
                    icon: Phone,
                    title: "Phone",
                    content: "+63 947 696 9206",
                    color: "text-green-500",
                  },
                  {
                    icon: MapPin,
                    title: "Location",
                    content: "Cagayan de Oro City, Philippines",
                    color: "text-red-500",
                  },
                  {
                    icon: Linkedin,
                    title: "LinkedIn",
                    content: "linkedin.com/in/francis-uyguangco",
                    color: "text-blue-600",
                  },
                  {
                    icon: GitHub,
                    title: "GitHub",
                    content: "github.com/Archh29",
                    color: "text-gray-600",
                  },
                ].map((contact, index) => (
                  <motion.div
                    key={contact.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 group"
                    whileHover={{ x: 10 }}
                  >
                    <motion.div
                      className="bg-accent/10 p-4 rounded-xl border border-accent/20 group-hover:border-accent/40 transition-all duration-300"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <contact.icon className={`h-6 w-6 ${contact.color} group-hover:text-accent transition-colors`} />
                    </motion.div>
                    <div>
                      <h4 className="font-medium group-hover:text-accent transition-colors">{contact.title}</h4>
                      <p className="text-muted-foreground">{contact.content}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                viewport={{ once: true }}
                className="pt-6 border-t border-border/50"
              >
                <h4 className="font-medium mb-4 text-sm text-muted-foreground">Follow Me</h4>
                <div className="flex gap-3">
                  {[
                    {
                      icon: Facebook,
                      href: "https://www.facebook.com/Francis385",
                      label: "Facebook",
                      color: "text-blue-500",
                    },
                    {
                      icon: Instagram,
                      href: "https://www.instagram.com/frncsyg_/",
                      label: "Instagram",
                      color: "text-pink-500",
                    },
                  ].map((social, index) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3 rounded-xl border border-border/50 hover:border-accent/30 bg-background/50 hover:bg-accent/10 transition-all ${social.color}`}
                      whileHover={{ scale: 1.1, y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2 + index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <social.icon className="h-5 w-5" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                viewport={{ once: true }}
                className="mt-8"
              >
                <div className="bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-border/50 overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3945.1234567890123!2d124.6319!3d8.4542!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32ff9c9f8c9f8c9f%3A0x8c9f8c9f8c9f8c9f!2sCagayan%20de%20Oro%20City%2C%20Philippines!5e0!3m2!1sen!2sph!4v1234567890123"
                    width="100%"
                    height="250"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                  />
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex-1"
            >
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-6 bg-card/50 backdrop-blur-sm p-8 rounded-2xl border border-border/50"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className={`bg-background/50 border-border/50 focus:border-accent transition-colors ${errors.name ? "border-red-500" : ""}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </motion.div>
                  <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className={`bg-background/50 border-border/50 focus:border-accent transition-colors ${errors.email ? "border-red-500" : ""}`}
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </motion.div>
                </div>
                <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject
                  </label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className={`bg-background/50 border-border/50 focus:border-accent transition-colors ${errors.subject ? "border-red-500" : ""}`}
                  />
                  {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
                </motion.div>
                <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className={`bg-background/50 border-border/50 focus:border-accent transition-colors resize-none ${errors.message ? "border-red-500" : ""}`}
                  />
                  {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground relative overflow-hidden group"
                  >
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-accent to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                          />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </span>
                  </Button>
                </motion.div>
              </motion.form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card/80 backdrop-blur-sm border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h3 className="font-bold mb-4">Francis Uyguangco</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Full Stack Developer specializing in web development and game development with Unity.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#home" className="text-muted-foreground hover:text-accent transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="#about" className="text-muted-foreground hover:text-accent transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#skills" className="text-muted-foreground hover:text-accent transition-colors">
                    Skills
                  </Link>
                </li>
                <li>
                  <Link href="#services" className="text-muted-foreground hover:text-accent transition-colors">
                    Services
                  </Link>
                </li>
                <li>
                  <Link href="#projects" className="text-muted-foreground hover:text-accent transition-colors">
                    Projects
                  </Link>
                </li>
                <li>
                  <Link href="#contact" className="text-muted-foreground hover:text-accent transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() => setShowPrivacyModal(true)}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="text-muted-foreground hover:text-accent transition-colors"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </motion.div>
          </div>

          <div className="border-t border-border/50 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <motion.div
                className="text-center md:text-left mb-4 md:mb-0"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
              >
                <p className="text-muted-foreground text-sm">
                  © {new Date().getFullYear()} Francis Uyguangco. All rights reserved.
                </p>
              </motion.div>
              <motion.div
                className="flex space-x-4"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                viewport={{ once: true }}
              >
                {[
                  {
                    icon: GitHub,
                    href: "https://github.com/Archh29",
                    label: "GitHub",
                  },
                  {
                    icon: Linkedin,
                    href: "https://www.linkedin.com/in/francis-uyguangco/",
                    label: "LinkedIn",
                  },
                  {
                    icon: Facebook,
                    href: "https://www.facebook.com/Francis385",
                    label: "Facebook",
                  },
                  {
                    icon: Instagram,
                    href: "https://www.instagram.com/frncsyg_/",
                    label: "Instagram",
                  },
                  {
                    icon: Mail,
                    href: "mailto:uyguangco.francisbaron@gmail.com",
                    label: "Email",
                  },
                ].map((social, index) => (
                  <motion.div
                    key={social.label}
                    whileHover={{ scale: 1.2, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <Link
                      href={social.href}
                      className="text-muted-foreground hover:text-accent transition-colors p-2 rounded-lg hover:bg-accent/10"
                    >
                      <social.icon className="h-5 w-5" />
                      <span className="sr-only">{social.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPrivacyModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border border-border/50 rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Privacy Policy</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPrivacyModal(false)}
                  className="h-8 w-8"
                >
                  <CloseIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Information Collected</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Message submitted through the contact form</li>
                  </ul>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">How Information Is Used</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Responding to inquiries</li>
                    <li>Improving the website</li>
                    <li>Communicating about potential opportunities</li>
                  </ul>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Analytics</h3>
                  <p>
                    This website uses Vercel Analytics to collect anonymous usage data for performance monitoring and
                    improvement purposes. No personally identifiable information is collected through analytics.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Third-Party Services</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Email service: Gmail SMTP (nodemailer)</li>
                    <li>Analytics provider: Vercel Analytics</li>
                    <li>Hosting provider: Vercel</li>
                  </ul>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Data Security</h3>
                  <p>
                    I take reasonable measures to protect submitted information. Your data is transmitted securely and is
                    not shared with third parties except as necessary to provide the services described.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Contact</h3>
                  <p>
                    For privacy-related questions, please contact me at{" "}
                    <a href="mailto:uyguangco.francisbaron@gmail.com" className="text-accent hover:underline">
                      uyguangco.francisbaron@gmail.com
                    </a>
                  </p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card border border-border/50 rounded-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Terms of Service</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowTermsModal(false)}
                  className="h-8 w-8"
                >
                  <CloseIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground">
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Purpose</h3>
                  <p>
                    This website is for informational purposes and to showcase my work, skills, and projects as a Full
                    Stack Developer.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Content</h3>
                  <p>
                    All content, code samples, designs, and images displayed on this website are my intellectual
                    property unless otherwise credited. Visitors may not copy, reproduce, or redistribute my work
                    without explicit permission.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">External Links</h3>
                  <p>
                    This website may contain links to external websites (GitHub, LinkedIn, etc.) for convenience. I am
                    not responsible for the content or privacy practices of external sites.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Disclaimer</h3>
                  <p>
                    While I strive to keep information accurate and up-to-date, I make no guarantees regarding the
                    accuracy, completeness, or availability of the website or its content.
                  </p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-2">Contact</h3>
                  <p>
                    For questions about these terms, please contact me at{" "}
                    <a href="mailto:uyguangco.francisbaron@gmail.com" className="text-accent hover:underline">
                      uyguangco.francisbaron@gmail.com
                    </a>
                  </p>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
