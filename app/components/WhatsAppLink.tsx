import type { ReactNode } from "react";
import { siteConfig, whatsAppUrl } from "../config";

export function WhatsAppLink({ floating = false, children }: { floating?: boolean; children?: ReactNode }) {
  return (
    <a
      className={floating ? "whatsapp-link whatsapp-floating" : "whatsapp-link"}
      href={whatsAppUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with Andrei on WhatsApp at ${siteConfig.whatsAppDisplay} (opens in a new tab)`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a9 9 0 0 1-9 9 9.3 9.3 0 0 1-4.2-1L3 21l1.5-4.8a9.3 9.3 0 0 1-1-4.2 9 9 0 0 1 9-9h.5a9 9 0 0 1 8 8v.5Z" />
        <path d="m8.1 7.5 1.6 2.8-1.1 1.1a9.5 9.5 0 0 0 4 4l1.1-1.1 2.8 1.6c-.4 1.1-1.2 1.6-2.3 1.3-3.7-.9-6.5-3.7-7.4-7.4-.3-1.1.2-1.9 1.3-2.3Z" />
      </svg>
      <span>{children || (floating ? "WhatsApp" : "Chat on WhatsApp")}</span>
    </a>
  );
}
