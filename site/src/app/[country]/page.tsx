import { notFound } from "next/navigation";
import CountryDashboard from "@/components/CountryDashboard";
import { countryByRoute } from "@/lib/types";

interface Props {
  params: Promise<{ country: string }>;
}

/**
 * Página dinámica por país (/chile, /colombia, /peru).
 * Los datos se cargan en el cliente desde /data/ para mantener el HTML estático liviano.
 */
export function generateStaticParams() {
  return [{ country: "chile" }, { country: "colombia" }, { country: "peru" }];
}

export default async function CountryPage({ params }: Props) {
  const { country: route } = await params;
  const meta = countryByRoute(route);
  if (!meta) notFound();

  return <CountryDashboard country={meta} />;
}
