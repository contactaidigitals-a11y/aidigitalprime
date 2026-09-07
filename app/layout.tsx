import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "./config";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.brandName} | AI & Digital Systems for UK Businesses`,
    template: `%s | ${siteConfig.brandName}`,
  },
  description:
    "Conversion-focused websites, booking systems and practical AI automation for UK restaurants, salons, barbers and clinics.",
  openGraph: {
    type: "website",
    siteName: siteConfig.brandName,
    title: `${siteConfig.brandName} | Turn more enquiries into bookings`,
    description: "Premium websites, booking systems and practical AI automation for UK service businesses.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: `${siteConfig.brandName} — Turn more enquiries into bookings.` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.brandName} | Turn more enquiries into bookings`,
    description: "Premium websites, booking systems and practical AI automation for UK service businesses.",
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
