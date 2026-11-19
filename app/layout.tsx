import type { Metadata, Viewport } from "next";
import { Alegreya, Alegreya_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Analytics } from "@vercel/analytics/next";
import { VisitTracker } from "@/components/visit-tracker";
import "./globals.css";

// A serif made for literature for headings and reading, its sans for the interface.
const alegreya = Alegreya({
  subsets: ["latin"],
  variable: "--font-alegreya",
  style: ["normal", "italic"],
  display: "swap",
});
const alegreyaSans = Alegreya_Sans({
  subsets: ["latin"],
  variable: "--font-alegreya-sans",
  weight: ["400", "500", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ascendume - Free resume review and builder",
  description:
    "A free resume builder and reviewer for students and new grads. Specific feedback tied to your bullets, and an AI that never makes up numbers.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efeee6" },
    { media: "(prefers-color-scheme: dark)", color: "#181c19" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${alegreya.variable} ${alegreyaSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>{children}</AuthProvider>
          <VisitTracker />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
