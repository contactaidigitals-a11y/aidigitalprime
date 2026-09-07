export const siteConfig = {
  brandName: "AI Digital Prime",
  brandShort: "ADP",
  descriptor: "AI & Digital Systems",
  contactEmail: "hello@aidigitalprime.co.uk",
  callUrl: "/free-audit?intent=call",
  auditUrl: "/free-audit",
  location: "Serving businesses across the UK",
} as const;

export const serviceLinks = [
  { label: "Website Design", href: "/services/web-design" },
  { label: "Booking Systems", href: "/services/booking-systems" },
  { label: "AI Automation", href: "/services/ai-automation" },
  { label: "Digital Growth", href: "/services/digital-growth" },
] as const;
