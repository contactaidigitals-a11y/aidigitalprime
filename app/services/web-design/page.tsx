import type { Metadata } from "next";
import { ServicePage } from "../ServicePage";
import { services } from "../service-data";
export const metadata: Metadata = { title: "Website Design & Development", description: services["web-design"].intro };
export default function Page() { return <ServicePage service={services["web-design"]} />; }
