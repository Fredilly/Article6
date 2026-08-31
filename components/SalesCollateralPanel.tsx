import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { SALES_COLLATERAL_DOCUMENT_TYPES } from "../lib/sales-collateral-types";

const field = "rounded border border-gray-300 px-2 py-1.5 text-xs";
function localToIso(value: FormDataEntryValue | null) {
  const text = String(value || "");
  return text ? new Date(text).toISOString() : undefined;
}
function isoToLocal(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function SalesCollateralPanel() {
  const router = useRouter();
  const isOrg = router.pathname === "/internal/sales/organizations/[id]";
  const isTender = router.pathname === "/internal/sales/tenders/[id]";
  const id = typeof router.query.id === "string" ? router.query.id : "";
  const contactId = isOrg && typeof router.query.contactId === "string" ? router.query.contactId : "";
  const [data, setData] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const url = useMemo(
    () => !id ? "" : `/api/internal/sales-collateral?${new URLSearchParams(isTender ? { tenderOpportunityId: id } : { organizationId: id, ...(contactId ? { contactId } : {}) })}`,
    [id, isTender, contactId],
  );

  async function load() {
    if (!url) return;
    const response = await fetch(url);
    const json = await response.json();
    if (response.ok) setData(json);
    else setError(json.error || "Unable to load collateral.");
  }

  useEffect(() => { void load(); }, [url]);
  if (!isOrg && !isTender) return null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setBusy(true);
    setError("");

    try {
      const file = formData.get("file") as File;
      if (!file?.name) throw new Error("Choose a file.");

      const presignResponse = await fetch("/api/internal/sales-collateral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "presign",
          organizationId: data.context.organizationId,
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });
      const presign = await presignResponse.json();
      if (!presignResponse.ok) throw new Error(presign.error);

      const uploadResponse = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": presign.contentType },
        body: file,
      });
      if (!uploadResponse.ok) throw new Error("File upload failed.");

      const body = {
        organizationId: data.context.organizationId,
        contactId: String(formData.get("contactId") || "") || undefined,
        tenderOpportunityId: String(formData.get("tenderOpportunityId") || "") || undefined,
        interactionId: String(formData.get("interactionId") || "") || undefined,
        fileName: file.name,
        displayName: String(formData.get("displayName") || file.name),
        storagePath: presign.storagePath,
        documentType: String(formData.get("documentType")),
        description: String(formData.get("description") || "") || undefined,
        sentAt: localToIso(formData.get("sentAt")),
      };

      const saveResponse = await fetch("/api/internal/sales-collateral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const saved = await saveResponse.json();
      if (!saveResponse.ok) throw new Error(saved.error);

      form.reset();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save collateral.");
    } finally {
      setBusy(false);
    }
  }

  async function edit(e: React.FormEvent<HTMLFormElement>, item: any) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const body = {
      id: item.id,
      organizationId: item.organizationId,
      contactId: String(formData.get("contactId") || "") || undefined,
      tenderOpportunityId: String(formData.get("tenderOpportunityId") || "") || undefined,
      interactionId: String(formData.get("interactionId") || "") || undefined,
      displayName: String(formData.get("displayName") || "").trim(),
      documentType: String(formData.get("documentType")),
      description: String(formData.get("description") || "") || undefined,
      sentAt: localToIso(formData.get("sentAt")),
    };
    const response = await fetch("/api/internal/sales-collateral", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    if (!response.ok) setError(json.error || "Unable to edit collateral.");
    else await load();
  }

  async function remove(item: any) {
    if (!confirm(`Delete ${item.displayName}?`)) return;
    const response = await fetch("/api/internal/sales-collateral", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, organizationId: item.organizationId }),
    });
    if (response.ok) await load();
  }

  const items = data?.collateral || [];

  return <div className="fixed bottom-4 right-4 z-40 w-[min(420px,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white shadow-xl">
    <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left">
      <span className="text-sm font-semibold">Documents / Collateral</span>
      <span className="text-xs text-gray-500">{items.length} {open ? "▾" : "▴"}</span>
    </button>
    {open ? <div className="max-h-[70vh] overflow-y-auto border-t border-gray-100 p-3">
      {error ? <div className="mb-2 rounded bg-red-50 p-2 text-xs text-red-700">{error}</div> : null}
      <div className="space-y-2">{items.map((x: any) => <div key={x.id} className="rounded border border-gray-100 p-2 text-xs">
        <div className="flex justify-between gap-2"><div>
          <div className="font-medium">{x.displayName}</div>
          <div className="text-gray-500">{x.documentType}{x.contactName ? ` · ${x.contactName}` : ""}{x.tenderName ? ` · ${x.tenderName}` : ""}</div>
          {x.sentAt ? <div className="text-gray-500">Sent {new Date(x.sentAt).toLocaleString()}</div> : null}
          {x.interactionSubject ? <div className="mt-1 text-gray-600">Email: {x.interactionSubject}</div> : null}
          {x.description ? <div className="mt-1 text-gray-600">{x.description}</div> : null}
        </div><div className="shrink-0">
          <a className="text-forest-700 hover:underline" href={`/api/internal/sales-collateral?action=download&id=${encodeURIComponent(x.id)}`}>Open</a>
          <button onClick={() => remove(x)} className="ml-2 text-red-700">Delete</button>
        </div></div>
        <details className="mt-2"><summary className="cursor-pointer text-gray-600">Edit</summary>
          <form onSubmit={(e) => edit(e, x)} className="mt-2 grid gap-2 rounded bg-gray-50 p-2">
            <input required name="displayName" defaultValue={x.displayName} className={field} />
            <select name="documentType" defaultValue={x.documentType} className={field}>{SALES_COLLATERAL_DOCUMENT_TYPES.map((v) => <option key={v}>{v}</option>)}</select>
            <select name="contactId" defaultValue={x.contactId || ""} className={field}><option value="">No contact</option>{data.context.contacts.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
            <select name="tenderOpportunityId" defaultValue={x.tenderOpportunityId || ""} className={field}><option value="">No tender</option>{data.context.tenders.map((v: any) => <option key={v.id} value={v.id}>{v.name}</option>)}</select>
            <select name="interactionId" defaultValue={x.interactionId || ""} className={field}><option value="">No related email</option>{data.context.interactions.map((v: any) => <option key={v.id} value={v.id}>{new Date(v.occurred_at).toLocaleDateString()} · {v.subject || "Email"}</option>)}</select>
            <input name="sentAt" type="datetime-local" defaultValue={isoToLocal(x.sentAt)} className={field} />
            <textarea name="description" defaultValue={x.description || ""} className={field} />
            <button className="rounded bg-gray-900 px-3 py-1.5 text-white">Save changes</button>
          </form>
        </details>
      </div>)}</div>
      <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold text-forest-700">+ Add document</summary>{data ? <form onSubmit={submit} className="mt-2 grid gap-2">
        <input required type="file" name="file" className={field} />
        <input name="displayName" placeholder="Display name (optional)" className={field} />
        <select name="documentType" className={field}>{SALES_COLLATERAL_DOCUMENT_TYPES.map((x) => <option key={x}>{x}</option>)}</select>
        <select name="contactId" defaultValue={contactId} className={field}><option value="">No contact</option>{data.context.contacts.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select name="tenderOpportunityId" defaultValue={isTender ? id : ""} className={field}><option value="">No tender</option>{data.context.tenders.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
        <select name="interactionId" className={field}><option value="">No related email</option>{data.context.interactions.map((x: any) => <option key={x.id} value={x.id}>{new Date(x.occurred_at).toLocaleDateString()} · {x.subject || "Email"}</option>)}</select>
        <input name="sentAt" type="datetime-local" className={field} />
        <textarea name="description" placeholder="Short description" className={field} />
        <button disabled={busy} className="rounded bg-gray-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-50">{busy ? "Saving…" : "Save document"}</button>
      </form> : null}</details>
    </div> : null}
  </div>;
}
