import { useRouter } from "next/router";
import StateLayout from "@/components/state/StateLayout";
import StateCarousel from "@/components/state/StateCarousel";
import StateSidebar from "@/components/state/StateSidebar";
import StateBodyProject from "@/components/state/StateBodyProject";
import { getDivision } from "@/data/countries/nigeria";

export default function StateProjectPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (typeof slug !== "string") return null;
  const division = getDivision(slug);
  if (!division) return null;

  const {
    title,
    subtitle,
    stagePill,
    images,
    contacts,
    focus,
    docs,
    doneSoFar = [],
    nextSteps = [],
    facts,
  } = division;

  return (
    <StateLayout
      title={title}
      subtitle={subtitle}
      stagePill={stagePill}
      backHref="/projects/nigeria"
      tertiaryCtaHref={facts && facts.length > 0 ? `/states/${slug}/facts` : undefined}
    >
      {images && images.length > 0 && <StateCarousel images={images} />}
      <StateBodyProject doneSoFar={doneSoFar} nextSteps={nextSteps} docs={docs} />
      <StateSidebar contacts={contacts} focusAreas={focus} />
    </StateLayout>
  );
}

