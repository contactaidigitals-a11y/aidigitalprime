import type { Metadata } from "next";
import { ServicePage } from "../ServicePage";
import { services } from "../service-data";

export const metadata: Metadata = {
  title: "Restaurant Ordering & Automation",
  description: services["restaurant-automation"].intro,
};

export default function Page() {
  return <ServicePage service={services["restaurant-automation"]} />;
}
