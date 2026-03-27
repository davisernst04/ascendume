"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiEnhance } from "@/lib/use-ai-enhance";

type EnhanceType = "bullets" | "summary" | "description";

interface AIEnhanceButtonProps {
  text: string;
  type: EnhanceType;
  onEnhanced: (enhancedText: string) => void;
  className?: string;
}

export function AIEnhanceButton({
  text,
  type,
  onEnhanced,
  className = "",
}: AIEnhanceButtonProps) {
  const { enhance, isEnhancing, error } = useAiEnhance();
  const [enhancedText, setEnhancedText] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleEnhance = async () => {
    const result = await enhance(text, type);
    if (result) {
      setEnhancedText(result);
      setShowPreview(true);
    }
  };

  const handleAccept = () => {
    if (enhancedText) {
      onEnhanced(enhancedText);
      setShowPreview(false);
      setEnhancedText(null);
    }
  };

  const handleReject = () => {
    setShowPreview(false);
    setEnhancedText(null);
  };

  if (showPreview && enhancedText) {
    return (
      <div className="mt-3 p-3 border border-primary/30 rounded-lg bg-primary/5">
        <p className="text-xs font-medium text-primary mb-2">AI Suggestion:</p>
        <div className="text-sm text-foreground/80 whitespace-pre-wrap max-h-40 overflow-y-auto mb-3">
          {enhancedText}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            className="h-7 text-xs gap-1"
          >
            <Check className="w-3 h-3" />
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            className="h-7 text-xs gap-1"
          >
            <X className="w-3 h-3" />
            Reject
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        onClick={handleEnhance}
        disabled={isEnhancing || !text.trim()}
        className="mt-3 text-sm text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isEnhancing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enhancing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Enhance with AI
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}