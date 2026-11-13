const $ = (id) => document.getElementById(id);
const CONFIG_URL = window.PCAP_SUPABASE_URL || "";
const CONFIG_KEY = window.PCAP_SUPABASE_PUBLISHABLE_KEY || "";
let db = null;
let currentUser = null;
let leads = [];

function setAuthMessage(message) { $("authMessage").textContent = message || ""; }
function setAppMessage(message) { $("appMessage").textContent = message || ""; }
function showSignedIn(isSignedIn) {
  $("authPanel").hidden = isSignedIn;
  $("appShell").hidden = !isSignedIn;
  $("bottomNav").hidden = !isSignedIn;
  $("logoutBtn").hidden = !isSignedIn;
  $("exportBtn").hidden = !isSignedIn;
}
function escapeHTML(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function mapLead(row) {
  return {
    id: row.id,
    company: row.company_name || "",
    country: row.country || "",
    industry: row.industry || "",
    website: row.website || "",
    source: row.source || "",
    need: row.need || "",
    score: Number(row.lead_score) || 0,
    status: row.status || "New",
    createdAt: row.created_at
  };
}
async function loadLeads() {
  setAppMessage("Loading cloud leads…");
  const { data, error } = await db.from("leads").select("*").order("created_at", { ascending: false });
  if (error) {
    setAppMessage("Could not load leads: " + error.message);
    return;
  }
  leads = (data || []).map(mapLead);
  render();
  setAppMessage("");
}
function render() {
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
          <button class="small-btn" data-action="status" data-id="${escapeHTML(x.id)}">Update status</button>
          <button class="small-btn" data-action="delete" data-id="${escapeHTML(x.id)}">Delete</button>
        </div>
      </div>
    </article>`).join("");
  $("emptyState").style.display = filtered.length ? "none" : "block";
}
function openDialog() { $("leadDialog").showModal(); }

async function signIn(email, password) {
  setAuthMessage("Signing in…");
  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) setAuthMessage(error.message);
}
async function signUp(email, password) {
  setAuthMessage("Creating account…");
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) {
    setAuthMessage(error.message);
    return;
  }
  if (!data.session) {
    setAuthMessage("Account created. Check your email for the confirmation link, then return here and sign in.");
  } else {
    setAuthMessage("Account created and signed in.");
  }
}

$("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;
  await signIn(email, password);
});
$("signupBtn").addEventListener("click", async () => {
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value;
  if (!email || password.length < 8) {
    setAuthMessage("Enter a valid email and a password with at least 8 characters.");
    return;
  }
  await signUp(email, password);
});
$("logoutBtn").addEventListener("click", async () => {
  const { error } = await db.auth.signOut();
  if (error) setAuthMessage(error.message);
});
$("addLeadBtn").addEventListener("click", openDialog);
$("navAdd").addEventListener("click", openDialog);
$("closeDialog").addEventListener("click", ()=>$("leadDialog").close());
$("searchInput").addEventListener("input", render);
$("statusFilter").addEventListener("change", render);

$("leadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  const f = new FormData(e.currentTarget);
  const company = String(f.get("company")||"").trim();
  if (!company) return;
  const record = {
    user_id: currentUser.id,
    company_name: company,
    country: String(f.get("country")||""),
    industry: String(f.get("industry")||""),
    website: String(f.get("website")||"").trim(),
    source: String(f.get("source")||"").trim(),
    need: String(f.get("need")||"").trim(),
    lead_score: Math.max(0, Math.min(100, Number(f.get("score")||0))),
    status: String(f.get("status")||"New")
  };
  setAppMessage("Saving lead to cloud…");
  const { error } = await db.from("leads").insert(record);
  if (error) {
    setAppMessage("Save failed: " + error.message);
    return;
  }
  e.currentTarget.reset();
  $("leadDialog").close();
  await loadLeads();
});

$("leadList").addEventListener("click", async (e) => {
  const b = e.target.closest("button[data-action]");
  if (!b) return;
  const item = leads.find(x=>x.id===b.dataset.id);
  if (!item) return;
  if (b.dataset.action === "delete") {
    if (!confirm(`Delete ${item.company}?`)) return;
    const { error } = await db.from("leads").delete().eq("id", item.id);
    if (error) { setAppMessage("Delete failed: " + error.message); return; }
    await loadLeads();
  } else {
    const statuses = ["New","Researching","Qualified","Contacted","Replied","Proposal","Won","Lost"];
    const next = prompt("Enter new status:\n" + statuses.join(", "), item.status);
    if (!next) return;
    if (!statuses.includes(next)) { alert("Status not recognized. Please use one of the listed values."); return; }
    const { error } = await db.from("leads").update({ status: next }).eq("id", item.id);
    if (error) { setAppMessage("Update failed: " + error.message); return; }
    await loadLeads();
  }
});

$("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(leads, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "pcap-cloud-leads-backup.json"; a.click();
  URL.revokeObjectURL(url);
});

async function init() {
  if (!window.supabase || !CONFIG_URL.startsWith("https://") || !CONFIG_KEY.startsWith("sb_publishable_")) {
    showSignedIn(false);
    setAuthMessage("Configuration missing. Add your Supabase Project URL and Publishable Key in config.js, then reload.");
    return;
  }
  db = window.supabase.createClient(CONFIG_URL, CONFIG_KEY);
  const { data, error } = await db.auth.getSession();
  if (error) {
    showSignedIn(false);
    setAuthMessage("Session check failed: " + error.message);
    return;
  }
  currentUser = data.session ? data.session.user : null;
  showSignedIn(!!currentUser);
  if (currentUser) await loadLeads();
  db.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session ? session.user : null;
    showSignedIn(!!currentUser);
    if (currentUser) await loadLeads();
    else { leads = []; render(); setAuthMessage(""); }
  });
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}
init();
