import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ascendume - AI-Powered Resume Builder",
  description: "Build your perfect resume in minutes with AI-powered resume optimization and ATS-friendly templates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-serif">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
