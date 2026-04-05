"use client";

import { motion } from "motion/react";
import Image from "next/image";
import resumePreview from "@/public/resume-preview.png";

export function PDFResumePreview() {
  return (
    <div className="relative w-full group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative border-none shadow-none bg-transparent"
      >
        <div className="min-h-[350px] sm:min-h-[600px] flex items-center justify-center lg:justify-end overflow-hidden border-none shadow-none bg-transparent">
          <div className="relative w-full max-w-full rounded-sm overflow-hidden shadow-2xl ring-1 ring-white/10 bg-white">
            <Image
              src={resumePreview}
              alt="Professional Resume Preview"
              priority
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
