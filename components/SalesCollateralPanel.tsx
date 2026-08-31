import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { SALES_COLLATERAL_DOCUMENT_TYPES } from "../lib/sales-collateral-types";

const field = "rounded border border-gray-300 px-2 py-1.5 text-xs";
export default function SalesCollateralPanel() {
  const router = useRouter();
  const isOrg = router.pathname === "/internal/sales/organizations/[id]";
  const isTender = router.pathname === "/internal/sales/tenders/[id]";
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const contactId = isOrg && typeof router.query.contactId === "string" ? router.query.contactId : "";
  const [data, setData] = useState<any>(null); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const url = useMemo(() => !id ? "" : `/api/internal/sales-collateral?${new URLSearchParams(isTender ? { tenderOpportunityId: id } : { organizationId: id, ...(contactId ? { contactId } : {}) })}`, [id,isTender,contactId]);
  async function load() { if (!url) return; const r=await fetch(url); const j=await r.json(); if(r.ok)setData(j); else setError(j.error||"Unable to load collateral."); }
  useEffect(()=>{ void load(); },[url]);
  if (!isOrg && !isTender) return null;
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    try { const f=new FormData(e.currentTarget); const file=f.get("file") as File; if(!file?.name) throw new Error("Choose a file.");
      const pre=await fetch("/api/internal/sales-collateral",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"presign",organizationId:data.context.organizationId,fileName:file.name,contentType:file.type||"application/octet-stream",fileSize:file.size})}); const pj=await pre.json(); if(!pre.ok) throw new Error(pj.error);
      const put=await fetch(pj.uploadUrl,{method:"PUT",headers:{"Content-Type":pj.contentType},body:file}); if(!put.ok) throw new Error("File upload failed.");
      const body={organizationId:data.context.organizationId,contactId:String(f.get("contactId")||"")||undefined,tenderOpportunityId:String(f.get("tenderOpportunityId")||"")||undefined,interactionId:String(f.get("interactionId")||"")||undefined,fileName:file.name,displayName:String(f.get("displayName")||file.name),storagePath:pj.storagePath,documentType:String(f.get("documentType")),description:String(f.get("description")||"")||undefined,sentAt:String(f.get("sentAt")||"")||undefined};
      const r=await fetch("/api/internal/sales-collateral",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}); const j=await r.json(); if(!r.ok) throw new Error(j.error); e.currentTarget.reset(); await load();
    } catch(err){setError(err instanceof Error?err.message:"Unable to save collateral.");} finally{setBusy(false);} }
  async function remove(item:any){ if(!confirm(`Delete ${item.displayName}?`))return; const r=await fetch("/api/internal/sales-collateral",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:item.id,organizationId:item.organizationId})}); if(r.ok) await load(); }
  const items=data?.collateral||[];
  return <div className="fixed bottom-4 right-4 z-40 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white shadow-xl">
    <button onClick={()=>setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left"><span className="text-sm font-semibold">Documents / Collateral</span><span className="text-xs text-gray-500">{items.length} {open?"▾":"▴"}</span></button>
    {open?<div className="max-h-[70vh] overflow-y-auto border-t border-gray-100 p-3">
      {error?<div className="mb-2 rounded bg-red-50 p-2 text-xs text-red-700">{error}</div>:null}
      <div className="space-y-2">{items.map((x:any)=><div key={x.id} className="rounded border border-gray-100 p-2 text-xs"><div className="flex justify-between gap-2"><div><div className="font-medium">{x.displayName}</div><div className="text-gray-500">{x.documentType}{x.contactName?` · ${x.contactName}`:""}{x.tenderName?` · ${x.tenderName}`:""}</div>{x.sentAt?<div className="text-gray-500">Sent {new Date(x.sentAt).toLocaleString()}</div>:null}{x.interactionSubject?<div className="mt-1 text-gray-600">Email: {x.interactionSubject}</div>:null}{x.description?<div className="mt-1 text-gray-600">{x.description}</div>:null}</div><div className="shrink-0"><a className="text-forest-700 hover:underline" href={`/api/internal/sales-collateral?action=download&id=${encodeURIComponent(x.id)}`}>Open</a><button onClick={()=>remove(x)} className="ml-2 text-red-700">Delete</button></div></div></div>)}</div>
      <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-forest-700">+ Add document</summary>{data?<form onSubmit={submit} className="mt-2 grid gap-2"><input required type="file" name="file" className={field}/><input name="displayName" placeholder="Display name (optional)" className={field}/><select name="documentType" className={field}>{SALES_COLLATERAL_DOCUMENT_TYPES.map(x=><option key={x}>{x}</option>)}</select><select name="contactId" defaultValue={contactId} className={field}><option value="">No contact</option>{data.context.contacts.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select><select name="tenderOpportunityId" defaultValue={isTender?id:""} className={field}><option value="">No tender</option>{data.context.tenders.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select><select name="interactionId" className={field}><option value="">No related email</option>{data.context.interactions.map((x:any)=><option key={x.id} value={x.id}>{new Date(x.occurred_at).toLocaleDateString()} · {x.subject||"Email"}</option>)}</select><input name="sentAt" type="datetime-local" className={field}/><textarea name="description" placeholder="Short description" className={field}/><button disabled={busy} className="rounded bg-gray-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">{busy?"Saving…":"Save document"}</button></form>:null}</details>
    </div>:null}
  </div>;
}
