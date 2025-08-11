export default function ArchitectureDiagram() {
  const box = "rounded-xl border bg-white shadow-sm px-3 py-2 text-sm";
  return (
    <div className="w-full overflow-hidden rounded-2xl border bg-gray-50 p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-gray-800">
        <div className={`${box}`}>🛰️ Remote Sensing<br/><span className="text-xs text-gray-600">Sentinel / Planet</span></div>
        <div className="flex items-center justify-center">→</div>
        <div className={`${box}`}>📥 Ingest + Parse<br/><span className="text-xs text-gray-600">PDF/XLS/GeoJSON</span></div>
        <div className="flex items-center justify-center">→</div>
        <div className={`${box}`}>🔎 Vector Search<br/><span className="text-xs text-gray-600">Embeddings / RAG</span></div>
        <div className="md:col-span-5 flex items-center justify-center my-1">↓</div>
        <div className="md:col-span-2"/>
        <div className={`${box} md:col-span-1 text-center`}>🤖 LLM Reasoning</div>
        <div className="md:col-span-2"/>
        <div className="md:col-span-5 flex items-center justify-center my-1">↓</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:col-span-5">
          <div className={`${box}`}>👩🏽‍💻 Analyst Review UI</div>
          <div className={`${box}`}>🌾 IoT (optional)<br/><span className="text-xs text-gray-600">Rice AWD / Forestry sensors</span></div>
          <div className={`${box}`}>💼 CRM Sync<br/><span className="text-xs text-gray-600">HubSpot Deals & Contacts</span></div>
        </div>
      </div>
    </div>
  );
}
