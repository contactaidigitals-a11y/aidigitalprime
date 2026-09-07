import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { services } from "./service-data";

export const metadata: Metadata = { title: "Services", description: "Website design, booking systems, AI automation and digital growth for UK service businesses." };

export default function ServicesIndex() {
  return (
    <main>
      <div className="service-hero-wrap services-index-wrap"><SiteHeader dark /><section className="index-hero"><Eyebrow light>Connected digital services</Eyebrow><h1>One journey.<br /><em>Four ways to improve it.</em></h1><p>Choose a starting point or let the audit show where attention will create the most value.</p></section></div>
      <section className="services-index-grid">{Object.values(services).map((service) => <Link href={`/services/${service.slug}`} key={service.slug}><span>{service.index}</span><div><p>{service.kicker}</p><h2>{service.title}</h2><small>{service.promise}</small></div><i>↗</i></Link>)}</section>
      <SiteFooter />
    </main>
  );
}
