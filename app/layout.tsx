import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Analytics } from "@vercel/analytics/next";
import { VisitTracker } from "@/components/visit-tracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ascendume - Free resume review and builder",
  description:
    "A free resume builder and reviewer for students and new grads. Specific feedback tied to your bullets, and an AI that never makes up numbers.",
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
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
          <VisitTracker />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
