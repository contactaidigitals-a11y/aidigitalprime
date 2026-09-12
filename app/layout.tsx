import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "./config";
import { WhatsAppLink } from "./components/WhatsAppLink";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aidigitalprime.co.uk";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.brandName} | Websites & Automation in Harlow`,
    template: `%s | ${siteConfig.brandName}`,
  },
  description:
    "Websites, restaurant ordering, salon and clinic booking systems, business automation and NFC review cards for local businesses in Harlow. Request a free audit.",
  icons: {
    icon: [{ url: "/favicon.svg?v=2", type: "image/svg+xml" }],
    shortcut: "/favicon.svg?v=2",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: siteConfig.brandName,
    title: `${siteConfig.brandName} | Helping Local Businesses Grow Smarter`,
    description: "Websites, booking systems, automation and NFC reviews for businesses in Harlow and nearby areas. Start with a free on-site audit.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: siteConfig.brandName }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brandName} | Websites & Automation in Harlow`,
    description: "Practical digital services for restaurants, salons, barbers, clinics and other local businesses.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "globalThis.process=globalThis.process||{env:{}};globalThis.process.env=globalThis.process.env||{};",
          }}
        />
      </head>
      <body>{children}<WhatsAppLink floating /></body>
    </html>
  );
}
