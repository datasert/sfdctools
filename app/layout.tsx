import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Layout } from "@/components/Layout";

// Using system fonts directly (no next/font) to avoid dynamic loading
// Required for Chrome extension CSP compliance

export const metadata: Metadata = {
  title: "Salesforce Tools",
  description: "Easy access to various Salesforce related information and tools",
  icons: {
    icon: [
      { url: "/logos/circlecompass-svgrepo-com.svg", type: "image/svg+xml" },
      { url: "/logos/circlecompass-svgrepo-com.png", type: "image/png" },
    ],
    shortcut: "/logos/circlecompass-svgrepo-com.png",
    apple: "/logos/circlecompass-svgrepo-com.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <Layout>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}
