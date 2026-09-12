import { serviceLinks, siteConfig } from "../config";
import { MobileNav } from "./MobileNav";
import { WhatsAppLink } from "./WhatsAppLink";

export function Brand() {
  return (
    <a className="brand" href="/" aria-label={siteConfig.brandName + " home"}>
      <span className="brand-wordmark" aria-hidden="true">
        <b>AI</b>
        <b>DIGITAL</b>
        <b>PRIME</b>
      </span>
      <span className="brand-tagline">{siteConfig.tagline}</span>
    </a>
  );
}

const primaryLinks = [
  { label: "What we improve", href: "/#outcomes" },
  { label: "Solutions", href: "/#solutions" },
  { label: "Why us", href: "/#expertise" },
  { label: "How it works", href: "/#process" },
];

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  return (
    <header className={"site-header" + (dark ? " header-dark" : "")}>
      <Brand />
      <nav className="main-nav" aria-label="Main navigation">
        {primaryLinks.map((link) => (
          <a href={link.href} key={link.href}>{link.label}</a>
        ))}
      </nav>
      <a className="header-cta" href={siteConfig.auditUrl}>
        Free on-site audit <span aria-hidden="true">↗</span>
      </a>
      <MobileNav links={primaryLinks} auditUrl={siteConfig.auditUrl} />
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-lead">
        <Brand />
        <p>Websites, booking systems, automation and NFC reviews for local businesses in Harlow and nearby areas.</p>
      </div>
      <div className="footer-column">
        <span>What we improve</span>
        {serviceLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
      </div>
      <div className="footer-column">
        <span>Company</span>
        <a href="/#expertise">Why AI Digital Prime</a>
        <a href="/#process">How it works</a>
        <a href={siteConfig.auditPageUrl}>Free audit</a>
      </div>
      <div className="footer-column footer-conversion">
        <span>Start with clarity</span>
        <p>Leave your details. We review your business, then call to arrange a suitable visit.</p>
        <a className="footer-call" href={siteConfig.auditUrl}>Request your free audit <span>↗</span></a>
        <WhatsAppLink />
        <a className="footer-email" href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.</p>
        <p>{siteConfig.location}</p>
        <div><a href="/privacy">Privacy</a><a href="/terms">Terms</a></div>
      </div>
    </footer>
  );
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={"eyebrow" + (light ? " eyebrow-light" : "")}><span />{children}</p>;
}

export function ArrowLink({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return <a className={"text-link" + (light ? " text-link-light" : "")} href={href}>{children}<span aria-hidden="true">→</span></a>;
}
