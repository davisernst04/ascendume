"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const StartFromScratchAnimation = () => {
  return (
    <div className="relative w-full h-64 sm:h-80 flex items-center justify-center gap-6 sm:gap-12 overflow-hidden bg-primary/5 rounded-t-xl mb-6 px-4">
      {/* Left Side: Mock Form */}
      <motion.div
        className="relative w-32 h-44 sm:w-40 sm:h-56 bg-background border-2 border-primary/20 rounded-md shadow-sm flex flex-col p-3 gap-3 overflow-hidden"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-4 w-2/3 bg-primary/20 rounded mb-2" />

        {/* Form fields filling animation */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <div className="h-2 w-1/3 bg-muted-foreground/30 rounded" />
            <motion.div
              className="h-6 w-full bg-muted/50 rounded border border-muted-foreground/20"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: [0, 1, 1, 0, 0] }}
              transition={{
                duration: 8,
                repeat: Infinity,
                times: [0, 0.05 + i * 0.05, 0.4, 0.95, 1],
              }}
              style={{ transformOrigin: "left" }}
            >
              <motion.div
                className="h-full bg-primary/10 rounded-l"
                animate={{ width: ["0%", "100%", "100%", "0%", "0%"] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  times: [0, 0.1 + i * 0.05, 0.4, 0.95, 1],
                }}
              />
            </motion.div>
          </div>
        ))}
      </motion.div>

      {/* Right Side: Mock Resume Output */}
      <motion.div
        className="relative w-32 h-44 sm:w-40 sm:h-56 bg-background border shadow-md rounded-md flex flex-col p-3 overflow-hidden"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Loading State */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-background/80 z-10"
          animate={{ opacity: [1, 1, 0, 0, 1] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            times: [0, 0.4, 0.45, 0.95, 1],
          }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
          />
        </motion.div>

        {/* Wireframe Result */}
        <motion.div
          className="flex flex-col gap-2 h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            times: [0, 0.4, 0.45, 0.95, 1],
          }}
        >
          <div className="flex items-center gap-2 border-b pb-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 shrink-0" />
            <div className="flex flex-col gap-1 w-full">
              <div className="h-1.5 w-3/4 bg-primary/40 rounded" />
              <div className="h-1 w-1/2 bg-muted-foreground/30 rounded" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-1/3 bg-primary/30 rounded mb-0.5" />
            <div className="h-1 w-full bg-muted-foreground/20 rounded" />
            <div className="h-1 w-5/6 bg-muted-foreground/20 rounded" />
          </div>
          <div className="flex flex-col gap-1.5 mt-auto">
            <div className="h-1.5 w-1/4 bg-primary/30 rounded mb-0.5" />
            <div className="h-1 w-full bg-muted-foreground/20 rounded" />
            <div className="h-1 w-4/5 bg-muted-foreground/20 rounded" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const UploadPreviousAnimation = () => {
  return (
    <div className="relative w-full h-64 sm:h-80 flex items-center justify-center gap-6 sm:gap-12 overflow-hidden bg-blue-500/5 rounded-t-xl mb-6 px-4">
      {/* Left Side: Dropzone */}
      <div className="relative w-32 h-44 sm:w-40 sm:h-56 border-2 border-dashed border-blue-500/30 bg-blue-500/5 rounded-xl flex items-center justify-center">
        {/* Document dragging in */}
        <motion.div
          className="w-20 h-28 sm:w-24 sm:h-32 bg-background border shadow-md rounded flex flex-col items-center justify-center p-2 z-10"
          animate={{
            y: [-80, 0, 0, 0, -80],
            x: [-40, 0, 0, 0, -40],
            scale: [1.1, 1, 1, 1, 1.1],
            opacity: [0, 1, 1, 0, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            times: [0, 0.15, 0.4, 0.45, 1],
          }}
        >
          {/* Mock Document Content */}
          <div className="w-full h-full flex flex-col gap-1.5 opacity-50">
            <div className="h-1.5 w-1/2 bg-muted-foreground/40 rounded mx-auto mb-1" />
            <div className="h-1 w-full bg-muted-foreground/30 rounded" />
            <div className="h-1 w-5/6 bg-muted-foreground/30 rounded" />
            <div className="h-1 w-full bg-muted-foreground/30 rounded" />
            <div className="h-1 w-4/5 bg-muted-foreground/30 rounded" />
          </div>
        </motion.div>

        {/* Drop icon in background */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 text-blue-500">
          <svg
            className="w-8 h-8 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
        </div>
      </div>

      {/* Right Side: Resume Output */}
      <motion.div
        className="relative w-32 h-44 sm:w-40 sm:h-56 bg-background border shadow-md rounded-md overflow-hidden"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Initial Blank/Messy State */}
        <motion.div
          className="absolute inset-0 p-3 opacity-30 blur-[1px]"
          animate={{ opacity: [0, 0.3, 0.3, 0, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            times: [0, 0.2, 0.4, 0.45, 1],
          }}
        >
          <div className="h-2 w-full bg-muted-foreground/40 rounded mb-2" />
          <div className="h-2 w-5/6 bg-muted-foreground/40 rounded mb-2" />
          <div className="h-2 w-4/5 bg-muted-foreground/40 rounded mb-2" />
          <div className="h-2 w-full bg-muted-foreground/40 rounded" />
        </motion.div>

        {/* Scanner Effect */}
        <motion.div
          className="absolute left-0 right-0 h-1 bg-blue-500 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)] z-20"
          initial={{ top: "0%", opacity: 0 }}
          animate={{
            top: ["0%", "100%", "100%", "0%"],
            opacity: [0, 0, 1, 0, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            times: [0, 0.2, 0.2, 0.45, 1],
          }}
        />

        {/* Polished Resume Result */}
        <motion.div
          className="absolute inset-0 bg-background flex flex-col p-3 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 0, 1, 1, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            times: [0, 0.4, 0.45, 0.95, 0.96, 1],
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center border-b border-blue-500/20 pb-1.5 mb-2">
            <div className="h-1.5 w-3/4 bg-blue-500/80 rounded mb-1" />
            <div className="flex gap-1">
              <div className="h-1 w-4 bg-muted-foreground/40 rounded" />
              <div className="h-1 w-4 bg-muted-foreground/40 rounded" />
              <div className="h-1 w-4 bg-muted-foreground/40 rounded" />
            </div>
          </div>
          {/* Sections */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="h-1 w-1/4 bg-blue-500/60 rounded" />
            <div className="h-0.5 w-full bg-muted-foreground/30 rounded" />
            <div className="h-0.5 w-5/6 bg-muted-foreground/30 rounded" />
          </div>
          <div className="flex flex-col gap-1 mt-2">
            <div className="h-1 w-1/3 bg-blue-500/60 rounded" />
            <div className="flex justify-between items-center">
              <div className="h-0.5 w-1/3 bg-muted-foreground/50 rounded" />
              <div className="h-0.5 w-1/5 bg-muted-foreground/40 rounded" />
            </div>
            <div className="h-0.5 w-full bg-muted-foreground/30 rounded" />
            <div className="h-0.5 w-full bg-muted-foreground/30 rounded" />
          </div>

          {/* Shine effect on result */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent"
            animate={{ x: ["-100%", "200%", "200%"] }}
            transition={{
              duration: 8,
              repeat: Infinity,
              times: [0, 0.5, 1],
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleScratch = async () => {
    // Go to /new to initialize the builder
    router.push("/new");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Call our parse endpoint with the file
      const response = await fetch("/api/resumes/parse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to parse resume");
      }

      const { resumeId } = data;

      // Redirect to the builder with the newly populated resume
      router.push(`/${resumeId}`);
    } catch (err) {
      console.error(err);
      alert("Error uploading and parsing resume.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="h-full bg-background text-foreground flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-6xl">
        {/* Option 1: From Scratch */}
        <Card
          className="hover:border-primary/50 transition-colors cursor-pointer group flex flex-col min-h-[500px] overflow-hidden"
          onClick={handleScratch}
        >
          <StartFromScratchAnimation />
          <CardHeader className="text-center pb-4 flex-1">
            <CardTitle className="text-3xl">Start from Scratch</CardTitle>
            <CardDescription className="text-lg mt-3 px-4">
              Build a professional resume step-by-step using our AI-enhanced
              builder. Perfect if you are starting fresh.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center mt-auto pb-8 px-8">
            <Button size="lg" className="w-full font-bold text-lg h-14">
              Start Building
            </Button>
          </CardContent>
        </Card>

        {/* Option 2: Upload */}
        <Card
          className={`transition-colors group flex flex-col min-h-[500px] overflow-hidden ${isUploading ? "opacity-70 pointer-events-none" : "hover:border-blue-500/50 cursor-pointer"}`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <UploadPreviousAnimation />
          <CardHeader className="text-center pb-4 flex-1">
            <CardTitle className="text-3xl">Upload Previous</CardTitle>
            <CardDescription className="text-lg mt-3 px-4">
              Upload your existing PDF or Word resume. Our AI will instantly
              parse and upgrade it to our modern format.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center mt-auto pb-8 px-8">
            <Button
              size="lg"
              variant="outline"
              className="w-full font-bold text-lg h-14 border-2"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Select File"
              )}
            </Button>
          </CardContent>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            accept=".pdf,.docx,.doc"
            onChange={handleFileUpload}
          />
        </Card>
      </div>
    </div>
  );
}
