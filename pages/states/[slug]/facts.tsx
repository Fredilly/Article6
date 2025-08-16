import { useRouter } from "next/router";
import StateLayout from "@/components/state/StateLayout";
import StateSidebar from "@/components/state/StateSidebar";
import StateBodyFacts from "@/components/state/StateBodyFacts";
import { getDivision } from "@/data/countries/nigeria";

export default function StateFactsPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (typeof slug !== "string") return null;
  const division = getDivision(slug);
  if (!division) return null;

  const { title, stagePill, contacts, focus, facts } = division;

  return (
    <StateLayout
      title={title}
      subtitle="Did you know?"
      stagePill={stagePill}
      backHref="/projects/nigeria"
    >
      <StateBodyFacts stateName={title} facts={facts} />
      <StateSidebar contacts={contacts} focusAreas={focus} />
    </StateLayout>
  );
}

