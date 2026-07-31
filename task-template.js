/* ==========================================================================
   WAYFINDER ONBOARDING — MASTER TASK TEMPLATE
   Single source of truth for every task & subtask a new agent goes through.
   Editing this only changes the checklist for agents added AFTER the edit.
   ========================================================================== */

const PHASES = [
  { id: 1, name: "Application & License Transfer", blurb: "Tied to the agent's personal identity and legal filings." },
  { id: 2, name: "First Day / First Week", blurb: "Technical setup — largely in parallel, so agents go live fast." },
  { id: 3, name: "Branding & Marketing Materials", blurb: "Fully owned by Skalvya, start to finish." },
  { id: 4, name: "Post-Transfer Wrap-Up", blurb: "Final steps once the license transfer is confirmed." },
];

const TASK_TEMPLATE = [
  { id: "p1-1", phase: 1, title: "Complete Join Real application, sign ICA, pay $285 join fee", owner: "Agent",
    subtasks: ["Application submitted", "ICA signed", "$285 fee paid", "Sponsor named on addendum"] },
  { id: "p1-2", phase: 1, title: "Create OHID account & complete license transfer / exam application", owner: "Agent",
    subtasks: ["OHID account created", "License claimed on LPI portal", "Transfer/exam application submitted", "Confirmation received"] },
  { id: "p1-3", phase: 1, title: "Background check & fingerprinting (first-time agents)", owner: "Agent",
    subtasks: ["Scheduled", "Completed", "Cleared"] },
  { id: "p1-4", phase: 1, title: "Inform current sponsoring agent of the move", owner: "Agent",
    subtasks: ["Sponsor notified"] },

  { id: "p2-1", phase: 2, title: "Contact local Board & MLS to notify/transfer affiliation (30-day window)", owner: "Agent",
    subtasks: ["Board notified", "MLS affiliation updated", "Confirmation received"] },
  { id: "p2-2", phase: 2, title: "Set up e-signature platform (Dotloop)", owner: "Skalvya",
    subtasks: ["Account created", "Templates loaded", "Agent login confirmed"] },
  { id: "p2-3", phase: 2, title: "reZEN onboarding checklist & profile setup", owner: "Shared",
    subtasks: ["Login confirmed", "Profile fields completed", "Banking/entity info submitted", "reZEN checklist 100% complete"] },
  { id: "p2-4", phase: 2, title: "Set up Wayfinder Google Workspace", owner: "Skalvya",
    subtasks: ["Email account created", "Calendar set up", "Signature installed", "Agent login confirmed"] },
  { id: "p2-5", phase: 2, title: "Set up Slack access", owner: "Skalvya",
    subtasks: ["Account created", "Added to team channels", "Agent login confirmed"] },
  { id: "p2-6", phase: 2, title: "Subscribe to the Real of Ohio events calendar", owner: "Skalvya",
    subtasks: ["Subscription added"] },
  { id: "p2-7", phase: 2, title: "Join WorkVivo & the Ohio State Space; post an introduction", owner: "Shared",
    subtasks: ["Account created", "Admin access granted to Skalvya", "Intro post published"] },
  { id: "p2-8", phase: 2, title: "Join Ohio Facebook communities", owner: "Skalvya",
    subtasks: ["Added to statewide group", "Added to regional group", "Added to leadership group (if applicable)"] },
  { id: "p2-9", phase: 2, title: "Submit Agent Introduction Form to Broker Nicole", owner: "Agent",
    subtasks: ["Form submitted"] },
  { id: "p2-10", phase: 2, title: "Set up Follow Up Boss CRM account", owner: "Skalvya",
    subtasks: ["Account created", "Permissions configured", "Contacts imported & cleaned", "Required stages/tags set up", "Smart Lists built", "Agent login confirmed", "Successful test record created"] },
  { id: "p2-11", phase: 2, title: "Build relationship with sponsor & Broker Nicole", owner: "Agent",
    subtasks: ["Intro call completed"] },

  { id: "p3-1", phase: 3, title: "Branding refresh — logos, signature, socials, website", owner: "Skalvya",
    subtasks: ["Logos downloaded", "Email signature updated", "Social banners updated", "Website updated", "Broker compliance approval received"] },
  { id: "p3-2", phase: 3, title: "Order business cards, signage, name tags", owner: "Skalvya",
    subtasks: ["Designs created", "Broker compliance approval", "Order placed", "Materials delivered"] },
  { id: "p3-3", phase: 3, title: "Create Google Drive archive folder", owner: "Skalvya",
    subtasks: ["Folder created", "Access granted", "3 years of records migrated"] },
  { id: "p3-4", phase: 3, title: "Export & clean up CRM contacts from previous brokerage", owner: "Skalvya",
    subtasks: ["CSV exported", "Data cleaned & deduped", "Ready for FUB import"] },

  { id: "p4-1", phase: 4, title: "Re-confirm Board/MLS, re-upload active listings", owner: "Shared",
    subtasks: ["Board/MLS confirmed under new brokerage", "Active listings identified", "Listings re-uploaded", "Broker sign-off received"] },
  { id: "p4-2", phase: 4, title: "Update signage, socials, website with new brokerage identity", owner: "Skalvya",
    subtasks: ["Signage updated", "Socials updated", "Website updated"] },
  { id: "p4-3", phase: 4, title: "Publish brokerage announcement on personal social media", owner: "Skalvya",
    subtasks: ["Copy drafted", "Agent approval received", "Published"] },
  { id: "p4-4", phase: 4, title: "Submit welcome post info for Real's brokerage channels", owner: "Skalvya",
    subtasks: ["Bio drafted", "Agent approval received", "Submitted to Real"] },
];

function buildTaskInstances() {
  return TASK_TEMPLATE.map(t => ({
    id: t.id, phase: t.phase, title: t.title, owner: t.owner,
    dueDate: "", blocker: "", evidence: "", nextAction: "",
    subtasks: t.subtasks.map((label, i) => ({ id: t.id + "-s" + i, label, done: false })),
  }));
}
