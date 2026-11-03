import Head from "next/head";
import Link from "next/link";
import {useEffect,useState} from "react";
type Agent={id:string;username:string;displayName:string;active:boolean;createdAt:string;referralCount?:number};
type Referral={id:string;organizationId:string;company:string;contact:string;email:string;phone:string;service:string;interest:string;status:string;budget:string|null;notes:string|null;createdAt:string};
const display=(v:string)=>v.replaceAll("_"," ").toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
const serviceName=(v:string)=>({WEBSITE_DESIGN:"New website",WEBSITE_REDESIGN:"Website redesign",WEBSITE_DEVELOPMENT:"Website development",SEO_GEO:"SEO / AI visibility",OTHER:"Other"} as Record<string,string>)[v]||display(v);
export default function ReferralAgents(){
  const [agents,setAgents]=useState<Agent[]>([]);
  const [username,setUsername]=useState(""),[displayName,setDisplayName]=useState("");
  const [message,setMessage]=useState(""),[password,setPassword]=useState(""),[busy,setBusy]=useState(false);
  const [expanded,setExpanded]=useState<string|null>(null);
  const [records,setRecords]=useState<Record<string,Referral[]>>({});
  const [loading,setLoading]=useState(false);
  async function api(body?:Record<string,string>){
    const response=await fetch("/api/internal/referral-agents",body?{
      method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)
    }:{});
    const data=await response.json();
    if(!response.ok)throw Error(data.error||"Request failed.");
    return data;
  }
  async function refresh(){try{setAgents((await api()).agents)}catch(e){setMessage(String(e))}}
  useEffect(()=>{void refresh()},[]);
  async function act(action:string,id?:string){
    if(action==="disable"&&!confirm("Disable this partner immediately? Existing sessions will stop working."))return;
    setBusy(true);setMessage("");setPassword("");
    try{
      const result=await api({action,...(id?{id}:{username:username.trim().toLowerCase(),displayName:displayName.trim()})});
      if(result.temporaryPassword)setPassword(result.temporaryPassword);
      setMessage(action==="create"?"Partner account created. Copy the temporary password below.":action==="reset"?"Password reset. Copy the new temporary password below.":"Partner account updated.");
      if(action==="create"){setUsername("");setDisplayName("")}
      await refresh();
    }catch(e){setMessage(e instanceof Error?e.message:"Operation failed.")}
    finally{setBusy(false)}
  }
  async function toggleReferrals(id:string) {
    if(expanded===id){setExpanded(null);return;}
    setExpanded(id);setLoading(true);
    try{
      const response=await fetch("/api/internal/referral-agents?agentId="+encodeURIComponent(id),{cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||"Unable to load referrals");
      setRecords(previous=>({...previous,[id]:data.referrals||[]}));
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to load partner referrals")}
    finally{setLoading(false)}
  }
  const field="w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900";
  const button="rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50";
  return <><Head><title>Referral Partners | Article6 Internal</title><meta name="robots" content="noindex,nofollow"/></Head>
    <main className="min-h-screen bg-gray-50 px-4 py-10 text-gray-900"><div className="mx-auto max-w-4xl">
      <Link href="/internal/sales" className="text-sm text-blue-700">← Internal Sales</Link>
      <h1 className="mt-4 text-3xl font-bold">Referral partners</h1>
      <p className="mt-2 text-gray-600">Manage submission-only logins for websites.article6.org/refer/. Partners cannot open this page or browse the CRM.</p>
      <section className="mt-7 rounded-xl border bg-white p-5"><h2 className="font-semibold">Add partner</h2>
        <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={e=>{e.preventDefault();void act("create")}}>
          <label className="text-sm">Username<input required pattern="[a-z0-9][a-z0-9_-]{2,39}" className={field} value={username} onChange={e=>setUsername(e.target.value)}/></label>
          <label className="text-sm">Name<input required className={field} value={displayName} onChange={e=>setDisplayName(e.target.value)}/></label>
          <button disabled={busy} className={button}>Create account</button>
        </form>
        <p className="mt-3 text-sm text-gray-500">A randomly generated temporary password is displayed once. Store it securely and share it privately.</p>
      </section>
      {message&&<p role="status" className="mt-5 rounded-lg border bg-white p-4 text-sm">{message}</p>}
      {password&&<section className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
        <p className="font-semibold">Temporary password (shown once)</p>
        <code className="mt-2 block break-all text-sm">{password}</code>
        <button className="mt-3 rounded bg-gray-900 px-3 py-2 text-sm text-white" onClick={()=>navigator.clipboard.writeText(password)}>Copy password</button>
      </section>}
      <section className="mt-7 rounded-xl border bg-white p-5"><h2 className="font-semibold">Accounts</h2>
        <div className="mt-4 divide-y">{agents.map(agent=><div key={agent.id} className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><div className="font-semibold">{agent.displayName} <span className="text-sm font-normal text-gray-500">@{agent.username}</span></div>
              <div className="mt-1 text-sm text-gray-500">{agent.active?"Active":"Disabled"} · {agent.referralCount??0} referrals</div></div>
            <div className="flex flex-wrap gap-2">
              <button disabled={loading} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800" onClick={()=>void toggleReferrals(agent.id)}>{expanded===agent.id?"Hide referrals":"View referrals"}</button>
              <button disabled={busy} className="rounded-lg border px-3 py-2 text-sm" onClick={()=>void act("reset",agent.id)}>Reset password</button>
              <button disabled={busy} className="rounded-lg border px-3 py-2 text-sm" onClick={()=>void act(agent.active?"disable":"enable",agent.id)}>{agent.active?"Disable":"Enable"}</button>
            </div>
          </div>
          {expanded===agent.id&&<div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-semibold">Referrals from {agent.displayName}</h3>
              <span className="text-xs text-gray-500">Newest first</span>
            </div>
            {loading?<p className="text-sm text-gray-500">Loading referrals...</p>:
            !(records[agent.id]||[]).length?<p className="text-sm text-gray-500">No referrals to display.</p>:
            <ol className="divide-y divide-gray-200">{records[agent.id].map((ref,index)=><li key={ref.id} className="py-4">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-white text-xs font-bold text-gray-500">{String(index+1).padStart(2,"0")}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link className="font-semibold text-blue-700 hover:underline" href={"/internal/sales/organizations/"+encodeURIComponent(ref.organizationId)}>{ref.company} ↗</Link>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-gray-700">{display(ref.status)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{serviceName(ref.service)} · {new Date(ref.createdAt).toLocaleDateString()}</p>
                  <p className="mt-1 text-sm text-gray-700">Prospect interest: {display(ref.interest)}</p>
                  <p className="mt-1 break-words text-sm text-gray-600">{ref.contact}{ref.email?" · "+ref.email:""}{ref.phone?" · "+ref.phone:""}</p>
                  {ref.budget&&<p className="mt-1 text-xs text-gray-500">Budget discussed: {ref.budget} (currency not verified)</p>}
                  {ref.notes&&<p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{ref.notes}</p>}
                  <Link className="mt-2 inline-block text-sm font-semibold text-blue-700 hover:underline" href={"/internal/sales/organizations/"+encodeURIComponent(ref.organizationId)}>Open full sales record →</Link>
                </div>
              </div>
            </li>)}</ol>}
          </div>}
        </div>)}
          {!agents.length&&<p className="py-5 text-sm text-gray-500">No partners yet, or data is unavailable.</p>}
        </div>
      </section>
    </div></main></>;
}