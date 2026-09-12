import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "./config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.brandName} | Hospitality Business Improvement`,
    template: `%s | ${siteConfig.brandName}`,
  },
  description:
    "Practical websites, ordering, automation, reviews and operational improvements for independent restaurants, cafés, pubs and takeaways. Request a free on-site audit.",
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: siteConfig.brandName,
    title: `${siteConfig.brandName} | Helping Hospitality Businesses Grow Smarter`,
    description: "Business improvement for independent hospitality, starting with a free on-site audit in Harlow, Essex and nearby areas.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: siteConfig.brandName }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brandName} | Hospitality Business Improvement`,
    description: "Practical improvements for independent restaurants, cafés, pubs and takeaways.",
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
      <body>{children}</body>
    </html>
  );
}
