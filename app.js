const STORAGE_KEY = "pcap_leads_v1";
const $ = (id) => document.getElementById(id);
let leads = loadLeads();

function loadLeads(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveLeads(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); render(); }
function escapeHTML(value=""){
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function render(){
  $("totalCount").textContent = leads.length;
  $("qualifiedCount").textContent = leads.filter(x=>["Qualified","Proposal"].includes(x.status)).length;
  $("contactedCount").textContent = leads.filter(x=>["Contacted","Replied","Proposal"].includes(x.status)).length;
  $("wonCount").textContent = leads.filter(x=>x.status==="Won").length;
  const q = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const filtered = leads.filter(x=>{
    const hay = [x.company,x.country,x.industry,x.website,x.need].join(" ").toLowerCase();
    return (!q || hay.includes(q)) && (status==="all" || x.status===status);
  });
  $("leadList").innerHTML = filtered.map(x=>`
    <article class="lead-card">
      <div class="lead-top">
        <div><div class="lead-name">${escapeHTML(x.company)}</div><div class="lead-meta">${escapeHTML(x.industry)} · ${escapeHTML(x.country)}${x.website ? " · "+escapeHTML(x.website) : ""}</div></div>
        <div class="score">${Number(x.score)||0}/100</div>
      </div>
      <div class="lead-bottom">
        <span class="status ${escapeHTML(x.status)}">${escapeHTML(x.status)}</span>
        <div class="lead-actions">
          <button class="small-btn" data-action="status" data-id="${x.id}">Update status</button>
          <button class="small-btn" data-action="delete" data-id="${x.id}">Delete</button>
        </div>
      </div>
    </article>`).join("");
  $("emptyState").style.display = filtered.length ? "none" : "block";
}
function openDialog(){ $("leadDialog").showModal(); }
$("addLeadBtn").addEventListener("click",openDialog);
$("navAdd").addEventListener("click",openDialog);
$("closeDialog").addEventListener("click",()=>$("leadDialog").close());
$("searchInput").addEventListener("input",render);
$("statusFilter").addEventListener("change",render);

$("leadForm").addEventListener("submit",e=>{
  e.preventDefault();
  const f = new FormData(e.currentTarget);
  const company = String(f.get("company")||"").trim();
  if(!company) return;
  leads.unshift({
    id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
    company, country:f.get("country"), industry:f.get("industry"),
    website:String(f.get("website")||"").trim(),
    source:String(f.get("source")||"").trim(),
    need:String(f.get("need")||"").trim(),
    score:Math.max(0,Math.min(100,Number(f.get("score")||0))),
    status:f.get("status"), createdAt:new Date().toISOString()
  });
  saveLeads(); e.currentTarget.reset(); $("leadDialog").close();
});
$("leadList").addEventListener("click",e=>{
  const b=e.target.closest("button[data-action]"); if(!b) return;
  const item=leads.find(x=>x.id===b.dataset.id); if(!item) return;
  if(b.dataset.action==="delete"){
    if(confirm(`Delete ${item.company}?`)){ leads=leads.filter(x=>x.id!==item.id); saveLeads(); }
  } else {
    const statuses=["New","Researching","Qualified","Contacted","Replied","Proposal","Won","Lost"];
    const next=prompt("Enter new status:\n"+statuses.join(", "),item.status);
    if(next && statuses.includes(next)){ item.status=next; saveLeads(); }
    else if(next) alert("Status not recognized. Please use one of the listed values.");
  }
});
$("exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(leads,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url; a.download="pcap-leads-backup.json"; a.click(); URL.revokeObjectURL(url);
});
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
}
render();
