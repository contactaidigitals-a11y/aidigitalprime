import type { Metadata } from "next";
import { ServicePage } from "../ServicePage";
import { services } from "../service-data";
export const metadata: Metadata = { title: "Digital Growth & Optimisation", description: services["digital-growth"].intro };
export default function Page() { return <ServicePage service={services["digital-growth"]} />; }
