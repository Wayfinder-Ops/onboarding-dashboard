/* ==========================================================================
   SHARED HELPERS — used by login.js, agent.js, master.js
   ========================================================================== */

const OWNER_COLORS = { Agent: "#B08D57", Skalvya: "#1B2A4A", Shared: "#5E7C8C" };
const RISK_LABELS = { green: "On Track", yellow: "At Risk", red: "Blocked" };

// ---- Auth guard: resolves the logged-in user's role + profile, or redirects ----
function requireAuth(onReady) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    try {
      const snap = await db.collection("users").doc(user.uid).get();
      if (!snap.exists) {
        alert("Your account isn't set up with a role yet. Ask Skalvya to finish your account setup.");
        auth.signOut();
        return;
      }
      onReady({ uid: user.uid, ...snap.data() });
    } catch (err) {
      console.error(err);
      alert("Couldn't load your account. Please try logging in again.");
      auth.signOut();
    }
  });
}

function logout() {
  auth.signOut().then(() => window.location.href = "login.html");
}

// ---- Task computation (shared logic — identical rules everywhere) ----
function isTaskComplete(task) {
  return task.subtasks.length > 0 && task.subtasks.every(s => s.done);
}
function taskProgress(task) {
  const total = task.subtasks.length || 1;
  const done = task.subtasks.filter(s => s.done).length;
  return done / total;
}
function overallProgress(tasks) {
  if (!tasks || tasks.length === 0) return 0;
  return tasks.reduce((acc, t) => acc + taskProgress(t), 0) / tasks.length;
}
function currentPhase(tasks) {
  for (const phase of PHASES) {
    const phaseTasks = tasks.filter(t => t.phase === phase.id);
    if (phaseTasks.length && !phaseTasks.every(isTaskComplete)) return phase;
  }
  return PHASES[PHASES.length - 1];
}
function openBlockers(tasks) {
  return tasks.filter(t => t.blocker && t.blocker.trim() !== "" && !isTaskComplete(t));
}
function nextAction(tasks) {
  const open = tasks.filter(t => !isTaskComplete(t));
  const withNext = open.find(t => t.nextAction && t.nextAction.trim() !== "");
  return withNext ? withNext.nextAction : (open[0] ? open[0].title : "All tasks complete");
}

// ---- Formatting ----
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function escapeAttr(str) {
  return (str || "").replace(/"/g, "&quot;");
}
function initials(name) {
  return (name || "?").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}
