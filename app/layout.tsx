import type { Metadata } from "next";
import "./globals.css";
import TopProgress from "@/components/TopProgress";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  title: "Contact Manager",
  description: "Manage contacts with login, dashboard, API, and OpenStreetMap.",
};

// Applies the saved (or system) theme before first paint to avoid a flash.
const themeInit = `try {
  var t = localStorage.getItem("theme");
  if (t === "dark" || (!t && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  }
} catch (e) {}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full flex flex-col">
        <TopProgress />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
