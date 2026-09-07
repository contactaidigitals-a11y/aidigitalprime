import Link from "next/link";
import { serviceLinks, siteConfig } from "../config";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label={`${siteConfig.brandName} home`}>
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="brand-name">{siteConfig.brandName}</span>
    </Link>
  );
}

const primaryLinks = [
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/#industries" },
  { label: "Process", href: "/#process" },
  { label: "Why us", href: "/#about" },
];

export function SiteHeader({ dark = false }: { dark?: boolean }) {
  return (
    <header className={`site-header${dark ? " header-dark" : ""}`}>
      <Brand />
      <nav className="main-nav" aria-label="Main navigation">
        {primaryLinks.map((link) => (
          <Link href={link.href} key={link.href}>{link.label}</Link>
        ))}
      </nav>
      <Link className="header-cta" href={siteConfig.auditUrl}>
        Free digital audit <span aria-hidden="true">↗</span>
      </Link>
      <details className="mobile-menu">
        <summary aria-label="Open navigation"><span /><span /></summary>
        <nav aria-label="Mobile navigation">
          {primaryLinks.map((link) => (
            <Link href={link.href} key={link.href}>{link.label}<span>↗</span></Link>
          ))}
          <Link className="mobile-audit-link" href={siteConfig.auditUrl}>Free digital audit</Link>
        </nav>
      </details>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-lead">
        <Brand />
        <p>Thoughtful digital systems for businesses where every enquiry matters.</p>
      </div>
      <div className="footer-column">
        <span>Services</span>
        {serviceLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
      </div>
      <div className="footer-column">
        <span>Company</span>
        <Link href="/#industries">Industries</Link>
        <Link href="/#process">Process</Link>
        <Link href="/#about">Why us</Link>
        <Link href="/free-audit">Contact</Link>
      </div>
      <div className="footer-column">
        <span>Start a conversation</span>
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
        <Link className="footer-call" href={siteConfig.callUrl}>Book a call <span>↗</span></Link>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} {siteConfig.brandName}. All rights reserved.</p>
        <p>{siteConfig.location}</p>
        <div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </div>
    </footer>
  );
}

export function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`eyebrow${light ? " eyebrow-light" : ""}`}><span />{children}</p>;
}

export function ArrowLink({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return <Link className={`text-link${light ? " text-link-light" : ""}`} href={href}>{children}<span aria-hidden="true">→</span></Link>;
}
