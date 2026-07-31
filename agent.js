/* ==========================================================================
   AGENT CHECKLIST PAGE
   Used by: the agent themselves (own checklist, scoped edit rights),
            Skalvya (any agent, via ?agentId=, full edit rights),
            Tyson (any agent, via ?agentId=, read-only).
   ========================================================================== */

let me = null;         // { uid, role, name, agentId? }
let viewedAgentId = null;
let liveTasks = [];
let liveAgent = null;

requireAuth((profile) => {
  me = profile;

  document.getElementById("userName").textContent = me.name || "You";
  document.getElementById("userRole").textContent = me.role;
  document.getElementById("avatarInitials").textContent = initials(me.name);
  document.getElementById("logoutBtn").addEventListener("click", logout);

  if (me.role === "skalvya" || me.role === "tyson") {
    document.getElementById("skalvyaNav").style.display = "block";
    document.getElementById("toMasterBtn").addEventListener("click", () => window.location.href = "master.html");
  }

  const params = new URLSearchParams(window.location.search);

  if (me.role === "agent") {
    viewedAgentId = me.agentId;
    if (!viewedAgentId) {
      renderError("Your account isn't linked to an agent record yet. Ask Skalvya to finish setting up your account.");
      return;
    }
  } else {
    viewedAgentId = params.get("agentId");
    if (!viewedAgentId) {
      renderError("No agent selected. Go to the Master Dashboard and click an agent to view their checklist.");
      return;
    }
  }

  listenToAgent(viewedAgentId);
});

function renderError(msg) {
  document.getElementById("main").innerHTML = `<div class="empty-state">${msg}</div>`;
}

function listenToAgent(agentId) {
  db.collection("agents").doc(agentId).onSnapshot((doc) => {
    if (!doc.exists) { renderError("This agent record no longer exists."); return; }
    liveAgent = { id: doc.id, ...doc.data() };
    render();
  }, (err) => { console.error(err); document.getElementById("connectionBanner").style.display = "flex"; });

  db.collection("agents").doc(agentId).collection("tasks").onSnapshot((snap) => {
    liveTasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, (err) => { console.error(err); document.getElementById("connectionBanner").style.display = "flex"; });
}

// Can this viewer edit a given task at all?
function canEditTask(task) {
  if (me.role === "skalvya") return true;
  if (me.role === "tyson") return false;
  // agent: only tasks where they're Agent or Shared owner
  return task.owner === "Agent" || task.owner === "Shared";
}
function canEditRisk() {
  return me.role === "skalvya";
}

function render() {
  if (!liveAgent) return;
  const pct = Math.round(overallProgress(liveTasks) * 100);
  const phase = currentPhase(liveTasks);
  const main = document.getElementById("main");

  main.innerHTML = `
    ${me.role !== "agent" ? `<button class="back-btn" id="backBtn">&larr; Back to Master Dashboard</button>` : ""}
    ${me.role === "tyson" ? `<div class="tyson-note">Read-only view — you're seeing this in real time, no need to ask for updates.</div>` : ""}

    <div class="agent-header card">
      <div class="agent-header-main">
        <h1>${liveAgent.name}</h1>
        <div class="agent-meta">
          <span><strong>Start:</strong> ${formatDate(liveAgent.startDate)}</span>
          <span><strong>Target Transfer:</strong> ${formatDate(liveAgent.targetDate)}</span>
          <span class="phase-pill">Phase ${phase.id} — ${phase.name}</span>
        </div>
      </div>
      <div class="agent-header-side">
        <div class="ring" style="--pct:${pct}"><span>${pct}%</span></div>
        <select id="riskSelect" class="risk-select risk-${liveAgent.riskStatus}" ${canEditRisk() ? "" : "disabled"}>
          <option value="green" ${liveAgent.riskStatus === "green" ? "selected" : ""}>On Track</option>
          <option value="yellow" ${liveAgent.riskStatus === "yellow" ? "selected" : ""}>At Risk</option>
          <option value="red" ${liveAgent.riskStatus === "red" ? "selected" : ""}>Blocked</option>
        </select>
      </div>
    </div>

    ${PHASES.map(p => renderPhaseSection(p, liveTasks.filter(t => t.phase === p.id))).join("")}
  `;

  if (me.role !== "agent") {
    document.getElementById("backBtn").addEventListener("click", () => window.location.href = "master.html");
  }
  if (canEditRisk()) {
    document.getElementById("riskSelect").addEventListener("change", (e) => {
      db.collection("agents").doc(viewedAgentId).update({ riskStatus: e.target.value });
    });
  }
  wireTaskInteractions();
}

function renderPhaseSection(phase, tasks) {
  const doneCount = tasks.filter(isTaskComplete).length;
  const pct = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  return `
    <div class="card phase-section">
      <div class="phase-section-head">
        <div>
          <h3>Phase ${phase.id} — ${phase.name}</h3>
          <p class="muted small">${phase.blurb}</p>
        </div>
        <div class="phase-section-progress">
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <span class="progress-pct">${pct}%</span>
        </div>
      </div>
      <div class="task-list">${tasks.map(renderTaskRow).join("")}</div>
    </div>`;
}

function renderTaskRow(task) {
  const complete = isTaskComplete(task);
  const subPct = Math.round(taskProgress(task) * 100);
  const editable = canEditTask(task);
  return `
    <div class="task-row ${complete ? "task-complete" : ""}" data-task-id="${task.id}">
      <button class="task-toggle" data-toggle-task="${task.id}">
        <span class="chevron">&rsaquo;</span>
        <span class="task-status-dot ${complete ? "dot-complete" : ""}"></span>
        <span class="task-title">${task.title}</span>
        <span class="owner-chip owner-${task.owner}">${task.owner}</span>
        <span class="task-subpct">${subPct}%</span>
      </button>

      <div class="task-body" data-task-body="${task.id}">
        <div class="subtask-list">
          ${task.subtasks.map(s => `
            <label class="subtask-item">
              <input type="checkbox" data-subtask="${task.id}|${s.id}" ${s.done ? "checked" : ""} ${editable ? "" : "disabled"} />
              <span>${s.label}</span>
            </label>`).join("")}
        </div>

        ${!editable && me.role === "agent" ? `<p class="readonly-note">This one's handled by Skalvya — you'll see it update automatically.</p>` : ""}

        <div class="task-fields">
          <label>Due Date
            <input type="date" data-field="dueDate" data-task="${task.id}" value="${task.dueDate || ""}" ${editable ? "" : "disabled"} />
          </label>
          <label>Blocker
            <input type="text" data-field="blocker" data-task="${task.id}" value="${escapeAttr(task.blocker)}" placeholder="None" ${editable ? "" : "disabled"} />
          </label>
          <label>Completion Evidence
            <input type="text" data-field="evidence" data-task="${task.id}" value="${escapeAttr(task.evidence)}" placeholder="Link or note" ${editable ? "" : "disabled"} />
          </label>
          <label>Next Action
            <input type="text" data-field="nextAction" data-task="${task.id}" value="${escapeAttr(task.nextAction)}" placeholder="What happens next" ${editable ? "" : "disabled"} />
          </label>
        </div>
      </div>
    </div>`;
}

function wireTaskInteractions() {
  document.querySelectorAll("[data-toggle-task]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.toggleTask;
      document.querySelector(`[data-task-body="${id}"]`).classList.toggle("open");
      btn.classList.toggle("open");
    });
  });

  document.querySelectorAll("[data-subtask]").forEach(cb => {
    if (cb.disabled) return;
    cb.addEventListener("change", (e) => {
      const [taskId, subId] = e.target.dataset.subtask.split("|");
      updateSubtask(taskId, subId, e.target.checked);
    });
  });

  document.querySelectorAll("[data-field]").forEach(input => {
    if (input.disabled) return;
    input.addEventListener("change", (e) => {
      updateTaskField(e.target.dataset.task, e.target.dataset.field, e.target.value);
    });
  });
}

function updateSubtask(taskId, subId, done) {
  const task = liveTasks.find(t => t.id === taskId);
  const sub = task.subtasks.find(s => s.id === subId);
  sub.done = done;
  db.collection("agents").doc(viewedAgentId).collection("tasks").doc(taskId).update({ subtasks: task.subtasks });
}

function updateTaskField(taskId, field, value) {
  db.collection("agents").doc(viewedAgentId).collection("tasks").doc(taskId).update({ [field]: value });
}
