import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./animations.css";
import { ToastProvider } from "./components/Toast";
import { PostHogProvider } from "./components/PostHogProvider";
import { GTMProvider } from "./components/GTMProvider";
import { CookieConsentBanner } from "./components/CookieConsentBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://localizer.music"),
  title: "Localizer",
  description: "Event asset rendering",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PostHogProvider>
          <ToastProvider>{children}</ToastProvider>
        </PostHogProvider>
        <GTMProvider />
        <CookieConsentBanner />
      </body>
    </html>
  );
}