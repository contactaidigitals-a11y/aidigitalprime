export const siteConfig = {
  brandName: "AI Digital Prime",
  brandShort: "ADP",
  descriptor: "Websites, Bookings & Business Automation",
  tagline: "Helping Businesses Grow Smarter.",
  contactEmail: "andrei@aidigitalprime.co.uk",
  whatsAppNumber: "+447443757519",
  whatsAppDisplay: "+44 7443 757519",
  whatsAppMessage: "Hi Andrei, I'd like to discuss a free digital audit for my business.",
  auditUrl: "/#audit",
  auditPageUrl: "/free-audit",
  location: "Harlow & nearby areas",
} as const;

export const whatsAppUrl = `https://wa.me/${siteConfig.whatsAppNumber.replace(/\D/g, "")}?text=${encodeURIComponent(siteConfig.whatsAppMessage)}`;

export const serviceLinks = [
  { label: "Get More Customers", href: "/#customers" },
  { label: "Improve Operations", href: "/#operations" },
  { label: "What We Can Build", href: "/#solutions" },
  { label: "Free Business Audit", href: "/#audit" },
] as const;
