import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LiveProvider } from "@/components/live/live-provider";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { WebMcpControls } from "@/components/webmcp/controls";
import { GlobalToolsMount } from "@/components/webmcp/global-tools-mount";
import { WebMcpProvider } from "@/components/webmcp/provider";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "TestDrive", template: "%s · TestDrive" },
  description: "Book a test drive. A demo of WebMCP and MCP agent integration.",
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <LiveProvider>
            <WebMcpProvider>
              <SiteHeader>
                <WebMcpControls />
              </SiteHeader>
              <GlobalToolsMount />
              <div className="flex-1">{children}</div>
              {modal}
              {/* Always-mounted, named wrapper so toasts are not captured in the root transition. */}
              <div style={{ viewTransitionName: "toaster" }} className="pointer-events-none fixed inset-0 z-50">
                <Toaster position="bottom-right" richColors closeButton className="pointer-events-auto" />
              </div>
            </WebMcpProvider>
          </LiveProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
