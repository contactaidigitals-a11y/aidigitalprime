"use client";

type NavigationLink = { label: string; href: string };

export function MobileNav({ links, auditUrl }: { links: readonly NavigationLink[]; auditUrl: string }) {
  return (
    <details className="mobile-menu" onClick={(event) => {
      if (event.target instanceof Element && event.target.closest("a")) event.currentTarget.open = false;
    }}>
      <summary aria-label="Open navigation"><span /><span /></summary>
      <nav aria-label="Mobile navigation">
        {links.map((link) => <a href={link.href} key={link.href}>{link.label}<span aria-hidden="true">↗</span></a>)}
        <a className="mobile-audit-link" href={auditUrl}>Request your free audit</a>
      </nav>
    </details>
  );
}
