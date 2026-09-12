import type { Metadata } from "next";
import { Eyebrow, SiteFooter, SiteHeader } from "../components/SiteChrome";
import { services } from "./service-data";

export const metadata: Metadata = { title: "Digital Services for Harlow Businesses", description: "Websites, restaurant ordering, salon and clinic bookings, AI automation and NFC review cards for businesses in Harlow and nearby areas." };

export default function ServicesIndex() {
  const serviceList = Object.values(services).sort((a, b) => a.index.localeCompare(b.index));

  return (
    <main>
      <div className="service-hero-wrap services-index-wrap"><SiteHeader dark /><section className="index-hero"><Eyebrow light>Digital services for local businesses</Eyebrow><h1>Practical solutions.<br /><em>Chosen for your business.</em></h1><p>Websites, restaurant ordering, appointment bookings, automation and NFC reviews. We recommend the right setup after understanding how your business works.</p></section></div>
      <section className="services-index-grid">{serviceList.map((service) => <a href={`/services/${service.slug}`} key={service.slug}><span>{service.index}</span><div><p>{service.kicker}</p><h2>{service.title}</h2><small>{service.promise}</small></div><i>↗</i></a>)}</section>
      <SiteFooter />
    </main>
  );
}
