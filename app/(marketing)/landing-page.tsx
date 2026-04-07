"use client";

import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Check, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDFResumePreview } from "@/components/pdf-preview";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

const HeroButtons = ({ className }: { className?: string }) => (
  <div className={className}>
    <Link href="/auth/sign-in" className="w-full">
      <Button
        size="lg"
        className="h-14 sm:h-16 px-8 sm:px-10 text-lg sm:text-xl font-black shadow-2xl shadow-primary/30 group rounded-xl w-full"
      >
        Start
        <ArrowRight className="ml-2 w-5 h-5 sm:w-6 h-6 transition-transform group-hover:translate-x-1" />
      </Button>
    </Link>
  </div>
);

const Headline = ({ className }: { className?: string }) => (
  <div className={className}>
    <h1 className="text-7xl md:text-8xl lg:text-[140px] leading-[0.85] tracking-tighter">
      Get hired yesterday.
    </h1>
  </div>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">
    {children}
  </p>
);

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 transition-colors duration-300">
      {/* Paper grain texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[999] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-[1000] border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 h-16 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer shrink-0">
            <span className="font-bold text-xl sm:text-2xl tracking-tighter">
              ascendume
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth/sign-in">
              <Button
                variant="ghost"
                size="sm"
                className="font-bold rounded-xl"
              >
                Sign In
              </Button>
            </Link>
            <Link href="/auth/sign-in">
              <Button
                size="sm"
                className="font-bold shadow-lg shadow-primary/20 rounded-xl"
              >
                Get Started
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
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
                <Link href="/auth/sign-in">
                  <Button
                    variant="outline"
                    className="w-full font-black h-12 rounded-xl border-2 dark:border-zinc-800"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-in">
                  <Button className="w-full font-black h-12 rounded-xl">
                    Get Started
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <div className="overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative pt-8 pb-16 lg:pt-0 lg:pb-0 overflow-hidden min-h-[calc(100vh-80px)] flex items-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none opacity-20 dark:opacity-10">
            <div className="absolute top-20 left-1/4 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-primary/20 blur-[60px] sm:blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-20 right-1/4 w-[250px] h-[250px] sm:w-[500px] sm:h-[500px] bg-accent/20 blur-[60px] sm:blur-[120px] rounded-full animate-pulse delay-1000" />
          </div>

          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 grid lg:grid-cols-2 gap-6 lg:gap-20 items-center w-full">
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

              <div className="max-w-none mx-auto lg:mx-0">
                <HeroButtons className="mt-2 lg:mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full" />
              </div>
            </motion.div>

            {/* PDF Preview Block */}
            <div className="relative order-1 lg:order-2 w-full max-w-[500px] mx-auto overflow-hidden sm:overflow-visible flex lg:justify-end lg:max-w-none lg:mx-0">
              <div className="w-full lg:max-w-[500px]">
                <PDFResumePreview />
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 sm:py-20 border-t border-border bg-background transition-colors duration-300">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center">
              <span className="font-bold text-xl tracking-tighter">
                ascendume
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest text-center md:text-right">
                © 2026 Ascendume.
              </p>
              <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
                <a href="#" className="hover:text-primary transition-colors">
                  Privacy
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
