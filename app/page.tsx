"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import dynamic from "next/dynamic";

// Dynamically import PDF component with no SSR
const PDFResumePreview = dynamic(
  () => import("@/components/pdf-preview").then((mod) => mod.PDFResumePreview),
  { ssr: false }
);

const HeroButtons = ({ className }: { className?: string }) => (
  <div className={className}>
    <a href="/builder">
      <Button
        size="lg"
        className="h-14 sm:h-16 px-8 sm:px-10 text-lg sm:text-xl font-black shadow-2xl shadow-primary/30 group rounded-xl w-full sm:w-auto"
      >
        Build My Resume
        <ArrowRight className="ml-2 w-5 h-5 sm:w-6 h-6 transition-transform group-hover:translate-x-1" />
      </Button>
    </a>
    <Button
      size="lg"
      variant="outline"
      className="h-14 sm:h-16 px-8 sm:px-10 text-lg sm:text-xl font-black border-2 rounded-xl w-full sm:w-auto dark:border-zinc-800 dark:hover:bg-zinc-900"
    >
      View Gallery
    </Button>
  </div>
);

const Headline = ({ className }: { className?: string }) => (
  <div className={className}>
    <h1 className="text-7xl md:text-8xl lg:text-[100px]">
      Get hired yesterday.
    </h1>
  </div>
);

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-x-hidden transition-colors duration-300">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer shrink-0">
            <span className="font-bold text-xl sm:text-2xl tracking-tighter">
              ascendume
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="font-bold rounded-xl">
              Sign In
            </Button>
            <a href="/builder">
              <Button
                size="sm"
                className="font-bold shadow-lg shadow-primary/20 rounded-xl"
              >
                Get Started
              </Button>
            </a>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors focus:outline-none"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border bg-background px-4 py-6 flex flex-col gap-4 overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col gap-3 px-4">
                <Button
                  variant="outline"
                  className="w-full font-black h-12 rounded-xl border-2 dark:border-zinc-800"
                >
                  Sign In
                </Button>
                <a href="/builder">
                  <Button className="w-full font-black h-12 rounded-xl">
                    Get Started
                  </Button>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 sm:pt-24 sm:pb-32 px-6 sm:px-8 lg:px-12 overflow-hidden min-h-[calc(100vh-80px)] flex items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-20 dark:opacity-10">
          <div className="absolute top-20 left-1/4 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-primary/20 blur-[60px] sm:blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-20 right-1/4 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-accent/20 blur-[60px] sm:blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 sm:gap-20 items-center w-full">
          {/* Mobile Headline - Shows at the top on mobile, hidden on desktop */}
          <Headline className="lg:hidden text-center" />

          {/* Text Content Block */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left order-2 lg:order-1"
          >
            {/* Desktop Headline - Hidden on mobile */}
            <Headline className="hidden lg:block" />

            <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Ascendume transforms your career history into a high-impact,
              ATS-crushing resume. See the{" "}
              <span className="text-foreground font-bold italic">
                exact PDF
              </span>{" "}
              that got John hired.
            </p>

            <HeroButtons className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start" />
          </motion.div>

          {/* PDF Preview Block */}
          <div className="relative order-1 lg:order-2 w-full max-w-full overflow-hidden sm:overflow-visible">
            <PDFResumePreview />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-20 px-6 sm:px-8 lg:px-12 border-t border-border bg-background transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-bold text-xl tracking-tighter">
              ascendume
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest text-center">
            © 2026 Ascendume. Elevating careers with AI.
          </p>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
