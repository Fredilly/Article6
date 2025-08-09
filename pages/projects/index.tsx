import dynamic from "next/dynamic";
const NigeriaMap = dynamic(() => import("../../components/NigeriaMap"), { ssr: false });

export default function ProjectsPage() {
  // TODO: replace with real data source
  const activeStates = ["niger", "kwara", "plateau"];

  return (
    <main className="relative">
      {/* Top padding to clear navbar */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-10 pb-4">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
            State Projects
          </h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base text-gray-600 leading-relaxed">
            We’re working with multiple Nigerian states. Each engagement below shows its current stage.
            This page updates as agreements are signed.
          </p>
        </div>
      </section>

      {/* Map Card */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-5 sm:px-6 py-4">
              <div>
                <h2 className="text-base sm:text-lg font-semibold">Nigeria Overview</h2>
                <p className="text-sm text-gray-600">Highlighted states show active engagements.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <span className="h-3 w-3 rounded-sm bg-[#16A34A]" /> Active
                </span>
                <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <span className="h-3 w-3 rounded-sm bg-[#E5E7EB] border border-gray-300" /> Inactive
                </span>
              </div>
            </div>

            <div className="px-3 sm:px-6 pb-6 pt-2 bg-white">
              <div className="mx-auto max-w-4xl">
                <NigeriaMap active={activeStates} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="my-8 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
      </div>

      {/* Engagement Cards */}
      <section className="bg-white pb-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <h2 className="text-lg sm:text-xl font-semibold">Engagements</h2>
            <p className="text-xs sm:text-sm text-gray-500">{/* count placeholder */}Updated weekly</p>
          </div>

          {/* Grid scales up on desktop; minimal on mobile */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Render your <StateCard> list here. Example placeholders: */}
            {/* <StateCard slug="niger" title="Niger State" epithet="The Power State" status="discussion" ... /> */}
            {/* <StateCard slug="kwara" title="Kwara State" epithet="The State of Harmony" status="pending" ... /> */}
            {/* <StateCard slug="plateau" title="Plateau State" epithet="Home of Peace and Tourism" status="pending" ... /> */}
          </div>
        </div>
      </section>
    </main>
  );
}

