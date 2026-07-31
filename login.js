/* ==========================================================================
   LOGIN — authenticate, look up role, redirect to the right page.
   ========================================================================== */

// If already logged in, skip straight to the right page.
auth.onAuthStateChanged(async (user) => {
  if (user) await routeByRole(user.uid);
});

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");
  const errorBox = document.getElementById("loginError");
  errorBox.style.display = "none";
  btn.disabled = true;
  btn.textContent = "Signing in...";

  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    await routeByRole(cred.user.uid);
  } catch (err) {
    errorBox.textContent = friendlyError(err);
    errorBox.style.display = "block";
    btn.disabled = false;
    btn.textContent = "Sign In";
  }
});

async function routeByRole(uid) {
  try {
    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) {
      document.getElementById("loginError").textContent =
        "Your account doesn't have a role assigned yet. Ask Skalvya to finish setting up your account.";
      document.getElementById("loginError").style.display = "block";
      auth.signOut();
      return;
    }
    const role = snap.data().role;
    if (role === "agent") {
      window.location.href = "agent.html";
    } else {
      // skalvya + tyson both land on the master dashboard
      window.location.href = "master.html";
    }
  } catch (err) {
    document.getElementById("loginError").textContent = "Something went wrong loading your account. Try again.";
    document.getElementById("loginError").style.display = "block";
  }
}

function friendlyError(err) {
  const code = err.code || "";
  if (code.includes("wrong-password") || code.includes("invalid-credential") || code.includes("user-not-found")) {
    return "That email or password isn't right. Double check with Skalvya if you're not sure.";
  }
  if (code.includes("too-many-requests")) {
    return "Too many attempts — wait a minute and try again.";
  }
  return "Couldn't sign in. Please try again.";
}
