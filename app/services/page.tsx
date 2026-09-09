import type { Metadata } from "next";
import { Eyebrow, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { services } from "./service-data";

export const metadata: Metadata = { title: "Services", description: "Restaurant ordering, websites, booking systems, AI automation, NFC review cards and digital growth for UK service businesses." };

export default function ServicesIndex() {
  const serviceList = Object.values(services).sort((a, b) => a.index.localeCompare(b.index));

  return (
    <main>
      <div className="service-hero-wrap services-index-wrap"><SiteHeader dark /><section className="index-hero"><Eyebrow light>Connected digital services</Eyebrow><h1>Practical systems.<br /><em>Six clear services.</em></h1><p>Start with one priority or combine the services into a connected system built around how your business already works.</p></section></div>
      <section className="services-index-grid">{serviceList.map((service) => <a href={`/services/${service.slug}`} key={service.slug}><span>{service.index}</span><div><p>{service.kicker}</p><h2>{service.title}</h2><small>{service.promise}</small></div><i>↗</i></a>)}</section>
      <SiteFooter />
    </main>
  );
}
