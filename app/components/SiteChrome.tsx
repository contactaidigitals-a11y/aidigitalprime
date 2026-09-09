import { serviceLinks, siteConfig } from "../config";

export function Brand() {
  return (
    <a className="brand" href="/" aria-label={`${siteConfig.brandName} home`}>
      <span className="brand-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <span className="brand-name">{siteConfig.brandName}</span>
    </a>
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
          <a href={link.href} key={link.href}>{link.label}</a>
        ))}
      </nav>
      <a className="header-cta" href={siteConfig.auditUrl}>
        Free digital audit <span aria-hidden="true">↗</span>
      </a>
      <details className="mobile-menu">
        <summary aria-label="Open navigation"><span /><span /></summary>
        <nav aria-label="Mobile navigation">
          {primaryLinks.map((link) => (
            <a href={link.href} key={link.href}>{link.label}<span>↗</span></a>
          ))}
          <a className="mobile-audit-link" href={siteConfig.auditUrl}>Free digital audit</a>
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
        {serviceLinks.map((link) => <a href={link.href} key={link.href}>{link.label}</a>)}
      </div>
      <div className="footer-column">
        <span>Company</span>
        <a href="/#industries">Industries</a>
        <a href="/#process">Process</a>
        <a href="/#about">Why us</a>
        <a href="/free-audit">Contact</a>
      </div>
      <div className="footer-column">
        <span>Start a conversation</span>
        <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}</a>
        <a className="footer-call" href={siteConfig.callUrl}>Book a call <span>↗</span></a>
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
  return <p className={`eyebrow${light ? " eyebrow-light" : ""}`}><span />{children}</p>;
}

export function ArrowLink({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return <a className={`text-link${light ? " text-link-light" : ""}`} href={href}>{children}<span aria-hidden="true">→</span></a>;
}
