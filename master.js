/* ==========================================================================
   MASTER DASHBOARD — Skalvya (full control) & Tyson (read-only visibility)
   ========================================================================== */

let me = null;
let agents = [];              // [{id, name, startDate, targetDate, riskStatus}]
let tasksByAgent = {};        // { agentId: [task, ...] }
let taskUnsubs = {};
let ownerChart, phaseChart;

requireAuth((profile) => {
  me = profile;

  if (me.role === "agent") {
    window.location.href = "agent.html";
    return;
  }

  document.getElementById("userName").textContent = me.name || "You";
  document.getElementById("userRole").textContent = me.role;
  document.getElementById("avatarInitials").textContent = initials(me.name);
  document.getElementById("logoutBtn").addEventListener("click", logout);

  if (me.role === "skalvya") {
    document.getElementById("addAgentWrap").style.display = "block";
    document.getElementById("addAgentBtn").addEventListener("click", () => {
      document.getElementById("addAgentModal").classList.add("open");
    });
    document.getElementById("cancelAddAgent").addEventListener("click", closeModal);
    document.getElementById("addAgentForm").addEventListener("submit", submitAddAgent);
  }

  listenToAgents();
});

function closeModal() {
  document.getElementById("addAgentModal").classList.remove("open");
  document.getElementById("addAgentForm").reset();
}

function listenToAgents() {
  db.collection("agents").orderBy("startDate", "desc").onSnapshot((snap) => {
    agents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    agents.forEach(a => {
      if (!taskUnsubs[a.id]) {
        taskUnsubs[a.id] = db.collection("agents").doc(a.id).collection("tasks")
          .onSnapshot((tsnap) => {
            tasksByAgent[a.id] = tsnap.docs.map(d => ({ id: d.id, ...d.data() }));
            render();
          }, handleErr);
      }
    });
    render();
  }, handleErr);
}

function handleErr(err) {
  console.error(err);
  document.getElementById("connectionBanner").style.display = "flex";
}

// ---------------------------------------------------------------- ADD AGENT
async function submitAddAgent(e) {
  e.preventDefault();
  const btn = document.getElementById("createAgentBtn");
  btn.disabled = true;
  btn.textContent = "Creating...";

  const name = document.getElementById("agentNameInput").value.trim();
  const startDate = document.getElementById("agentStartInput").value;
  const targetDate = document.getElementById("agentTargetInput").value;
  const email = document.getElementById("agentEmailInput").value.trim();
  const password = document.getElementById("agentPasswordInput").value;

  try {
    const agentRef = await db.collection("agents").add({
      name, startDate, targetDate, riskStatus: "green",
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    const batch = db.batch();
    buildTaskInstances().forEach(task => {
      batch.set(agentRef.collection("tasks").doc(task.id), task);
    });
    await batch.commit();

    if (email && password) {
      await createAgentLogin(email, password, name, agentRef.id);
    }

    closeModal();
  } catch (err) {
    console.error(err);
    alert("Something went wrong creating this agent. Check the console for details.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Create Agent";
  }
}

// Creates a Firebase Auth login for the agent WITHOUT logging Skalvya out,
// using a secondary, temporary Firebase app instance.
async function createAgentLogin(email, password, name, agentId) {
  const secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary-" + Date.now());
  try {
    const secondaryAuth = secondaryApp.auth();
    const cred = await secondaryAuth.createUserWithEmailAndPassword(email, password);
    await db.collection("users").doc(cred.user.uid).set({
      role: "agent", agentId, name, email,
    });
    await secondaryAuth.signOut();
  } finally {
    await secondaryApp.delete();
  }
}

// ---------------------------------------------------------------- RENDER
function render() {
  const main = document.getElementById("main");
  const totalAgents = agents.length;
  const overallPct = totalAgents === 0 ? 0 :
    agents.reduce((acc, a) => acc + overallProgress(tasksByAgent[a.id] || []), 0) / totalAgents;
  const onTrack = agents.filter(a => a.riskStatus === "green").length;
  const atRisk = agents.filter(a => a.riskStatus !== "green").length;

  main.innerHTML = `
    <div class="page-head">
      <h1>Onboarding Overview</h1>
      <p class="muted">Live status across every agent moving through Wayfinder onboarding.</p>
    </div>
    ${me.role === "tyson" ? `<div class="tyson-note">You're seeing this live — no need to ask Skalvya for a status update.</div>` : ""}

    <div class="stat-grid">
      <div class="stat-card"><div class="stat-value">${totalAgents}</div><div class="stat-label">Total Agents</div></div>
      <div class="stat-card"><div class="stat-value">${Math.round(overallPct * 100)}%</div><div class="stat-label">Overall Completion</div></div>
      <div class="stat-card accent-green"><div class="stat-value">${onTrack}</div><div class="stat-label">On Track</div></div>
      <div class="stat-card accent-red"><div class="stat-value">${atRisk}</div><div class="stat-label">At Risk / Blocked</div></div>
    </div>

    <div class="chart-grid">
      <div class="card"><h3>Progress by Owner</h3><canvas id="ownerChart" height="220"></canvas></div>
      <div class="card"><h3>Progress by Phase</h3><canvas id="phaseChart" height="220"></canvas></div>
    </div>

    <div class="card">
      <h3>Blockers Needing Attention</h3>
      ${renderBlockerList()}
    </div>

    <div class="card">
      <div class="card-head-row"><h3>Agent Roster</h3></div>
      ${renderRosterTable()}
    </div>
  `;

  drawOwnerChart();
  drawPhaseChart();

  document.querySelectorAll("[data-open-agent]").forEach(row => {
    row.addEventListener("click", () => {
      window.location.href = "agent.html?agentId=" + row.dataset.openAgent;
    });
  });
}

function renderBlockerList() {
  const rows = [];
  agents.forEach(agent => {
    openBlockers(tasksByAgent[agent.id] || []).forEach(t => {
      rows.push(`<div class="blocker-row">
        <span class="blocker-agent">${agent.name}</span>
        <span class="blocker-task">${t.title}</span>
        <span class="blocker-text">${t.blocker}</span>
      </div>`);
    });
  });
  if (rows.length === 0) return `<p class="muted">No open blockers right now — everything is moving.</p>`;
  return `<div class="blocker-list">${rows.join("")}</div>`;
}

function renderRosterTable() {
  if (agents.length === 0) {
    return `<p class="muted">No agents added yet.${me.role === "skalvya" ? ' Use "+ Add Agent" to start tracking someone.' : ""}</p>`;
  }
  const rows = agents.map(agent => {
    const tasks = tasksByAgent[agent.id] || [];
    const pct = Math.round(overallProgress(tasks) * 100);
    const phase = currentPhase(tasks);
    const blockers = openBlockers(tasks).length;
    const risk = agent.riskStatus || "green";
    return `
      <tr data-open-agent="${agent.id}">
        <td class="cell-name">${agent.name}</td>
        <td>${formatDate(agent.startDate)}</td>
        <td>${formatDate(agent.targetDate)}</td>
        <td><span class="phase-pill">Phase ${phase.id}</span></td>
        <td><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div><span class="progress-pct">${pct}%</span></td>
        <td><span class="risk-badge risk-${risk}">${RISK_LABELS[risk]}</span></td>
        <td>${blockers > 0 ? `<span class="blocker-count">${blockers}</span>` : "—"}</td>
        <td class="cell-next">${nextAction(tasks)}</td>
      </tr>`;
  }).join("");

  return `
    <table class="roster-table">
      <thead><tr>
        <th>Agent</th><th>Start Date</th><th>Target Transfer</th><th>Phase</th>
        <th>Progress</th><th>Risk</th><th>Blockers</th><th>Next Action</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function drawOwnerChart() {
  const ctx = document.getElementById("ownerChart");
  if (!ctx) return;
  const totals = { Agent: [0, 0], Skalvya: [0, 0], Shared: [0, 0] };
  Object.values(tasksByAgent).flat().forEach(t => {
    totals[t.owner][1] += 1;
    if (isTaskComplete(t)) totals[t.owner][0] += 1;
  });
  if (ownerChart) ownerChart.destroy();
  ownerChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Agent", "Skalvya", "Shared"],
      datasets: [{ data: [totals.Agent[0], totals.Skalvya[0], totals.Shared[0]],
        backgroundColor: [OWNER_COLORS.Agent, OWNER_COLORS.Skalvya, OWNER_COLORS.Shared], borderWidth: 0 }],
    },
    options: { plugins: { legend: { position: "bottom", labels: { font: { family: "Inter" } } } }, cutout: "65%" },
  });
}

function drawPhaseChart() {
  const ctx = document.getElementById("phaseChart");
  if (!ctx) return;
  const totals = {}; PHASES.forEach(p => totals[p.id] = [0, 0]);
  Object.values(tasksByAgent).flat().forEach(t => {
    totals[t.phase][1] += 1;
    if (isTaskComplete(t)) totals[t.phase][0] += 1;
  });
  const pct = PHASES.map(p => { const [d, tt] = totals[p.id]; return tt === 0 ? 0 : Math.round((d / tt) * 100); });
  if (phaseChart) phaseChart.destroy();
  phaseChart = new Chart(ctx, {
    type: "bar",
    data: { labels: PHASES.map(p => "Phase " + p.id), datasets: [{ data: pct, backgroundColor: "#12213F", borderRadius: 6, maxBarThickness: 46 }] },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + "%" } } } },
  });
}
