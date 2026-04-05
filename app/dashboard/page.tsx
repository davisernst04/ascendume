"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleScratch = async () => {
    // Go to /builder/new to initialize the builder
    router.push("/builder/new");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Call our parse endpoint with the file
      const response = await fetch('/api/resumes/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to parse resume");
      }

      const { resumeId } = await response.json();
      
      // Redirect to the builder with the newly populated resume
      router.push(`/builder/${resumeId}`);
    } catch (err) {
      console.error(err);
      alert("Error uploading and parsing resume.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-full bg-background text-foreground flex flex-col items-center justify-center pt-24 pb-12 px-4 sm:px-8">
      <div className="text-center mb-12 w-full max-w-4xl mt-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Create New Resume</h1>
        <p className="text-xl text-muted-foreground">Choose how you want to get started.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Option 1: From Scratch */}
        <Card className="hover:border-primary/50 transition-colors cursor-pointer group flex flex-col" onClick={handleScratch}>
          <CardHeader className="text-center pb-2 flex-1">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Plus className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Start from Scratch</CardTitle>
            <CardDescription className="text-base mt-2">
              Build a professional resume step-by-step using our AI-enhanced builder.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center mt-4 pb-8">
            <Button className="w-full font-bold">
              Start Building
            </Button>
          </CardContent>
        </Card>

        {/* Option 2: Upload */}
        <Card className={`transition-colors group flex flex-col ${isUploading ? 'opacity-70 pointer-events-none' : 'hover:border-primary/50 cursor-pointer'}`} onClick={() => !isUploading && fileInputRef.current?.click()}>
          <CardHeader className="text-center pb-2 flex-1">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              ) : (
                <FileUp className="w-8 h-8 text-blue-500" />
              )}
            </div>
            <CardTitle className="text-2xl">Upload Previous</CardTitle>
            <CardDescription className="text-base mt-2">
              Upload your existing PDF or Word resume. Our AI will instantly parse and upgrade it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center mt-4 pb-8">
            <Button variant="outline" className="w-full font-bold border-2" disabled={isUploading}>
              {isUploading ? "Processing..." : "Select File"}
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