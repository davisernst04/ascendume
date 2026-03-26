"use client";

import { useState, useCallback } from "react";

type EnhanceType = "bullets" | "summary" | "description";

interface UseAiEnhanceResult {
  enhance: (text: string, type: EnhanceType) => Promise<string | null>;
  isEnhancing: boolean;
  error: string | null;
}

export function useAiEnhance(): UseAiEnhanceResult {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhance = useCallback(async (text: string, type: EnhanceType): Promise<string | null> => {
    if (!text.trim()) {
      setError("No text to enhance");
      return null;
    }

    setIsEnhancing(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to enhance text");
      }

      // Read the stream
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
      }

      // Clean up the result (remove escaped newlines)
      result = result.replace(/\\n/g, "\n").replace(/\\"/g, '"');
      
      setIsEnhancing(false);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to enhance text";
      setError(message);
      setIsEnhancing(false);
      return null;
    }
  }, []);

  return { enhance, isEnhancing, error };
}