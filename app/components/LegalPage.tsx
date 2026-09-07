import { Eyebrow, SiteFooter, SiteHeader } from "./SiteChrome";

export function LegalPage({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <main><SiteHeader /><section className="legal-hero"><Eyebrow>Legal</Eyebrow><h1>{title}</h1><p>{intro}</p></section><article className="legal-content">{children}</article><SiteFooter /></main>
  );
}
