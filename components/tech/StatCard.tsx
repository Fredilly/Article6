export default function StatCard({label, value, note}:{label:string; value:string; note?:string}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{label}</div>
      {note ? <div className="text-[11px] text-gray-500 mt-1">{note}</div> : null}
    </div>
  );
}
