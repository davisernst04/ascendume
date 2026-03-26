import type { Metadata } from "next";
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-serif">{children}</body>
    </html>
  );
}
