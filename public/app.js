// InternalFlow frontend
// This is intentionally written the way a well-meaning but inexperienced
// developer might write it: it works, it's convenient, and it trusts
// browser-side state for authorization decisions. That is the pattern
// this lab asks you to find and fix.

let currentUser = null; // { username, name }

async function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    document.getElementById("status").textContent = "Login failed.";
    return;
  }

  const data = await res.json();
  currentUser = { username: data.username, name: data.name };

  // --- Role/session state is kept entirely on the client. ---
  localStorage.setItem("role", data.role);
  localStorage.setItem("username", data.username);
  document.cookie = `role=${data.role}; path=/`;

  document.getElementById("status").textContent = `Logged in as ${data.name} (${data.role})`;
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("dashboard").style.display = "block";

  renderUI();
}

function logout() {
  localStorage.removeItem("role");
  localStorage.removeItem("username");
  document.cookie = "role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  currentUser = null;
  document.getElementById("status").textContent = "Not logged in.";
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("dashboard").style.display = "none";
  document.getElementById("managerConsole").style.display = "none";
}

// The Manager Console is shown/hidden purely based on a value read from
// localStorage. There is no server-side check gating this view.
function renderUI() {
  const role = localStorage.getItem("role");
  document.getElementById("managerConsole").style.display = (role === "manager") ? "block" : "none";
  loadMyRequests();
  if (role === "manager") loadPendingRequests();
}

async function loadMyRequests() {
  const res = await fetch("/api/requests");
  const all = await res.json();
  const mine = all.filter(r => r.owner === localStorage.getItem("username"));
  const tbody = document.querySelector("#myRequestsTable tbody");
  tbody.innerHTML = "";
  mine.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.id}</td><td>$${r.amount.toFixed(2)}</td><td>${r.category}</td><td>${r.description}</td>` +
      `<td><span class="pill ${r.status}">${r.status}</span></td>`;
    tbody.appendChild(tr);
  });
}

async function loadPendingRequests() {
  const res = await fetch("/api/requests");
  const all = await res.json();
  const pending = all.filter(r => r.status === "Pending");
  const tbody = document.querySelector("#pendingTable tbody");
  tbody.innerHTML = "";
  pending.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.id}</td><td>${r.owner}</td><td>$${r.amount.toFixed(2)}</td><td>${r.category}</td><td>${r.description}</td>` +
      `<td><button onclick="decide(${r.id}, 'approved')">Approve</button> <button onclick="decide(${r.id}, 'rejected')">Reject</button></td>`;
    tbody.appendChild(tr);
  });
}

async function submitRequest() {
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value.trim();
  const description = document.getElementById("description").value.trim();

  await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ owner: localStorage.getItem("username"), amount, category, description }),
  });

  document.getElementById("amount").value = "";
  document.getElementById("category").value = "";
  document.getElementById("description").value = "";
  loadMyRequests();
}

// The frontend tells the backend who is "acting" by reading its own
// localStorage value and sending it along in the request body.
async function decide(id, decision) {
  await fetch(`/api/requests/${id}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, actingRole: localStorage.getItem("role") }),
  });
  loadPendingRequests();
  loadMyRequests();
}

// Restore session on page reload
window.addEventListener("load", () => {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  if (role && username) {
    currentUser = { username };
    document.getElementById("status").textContent = `Logged in as ${username} (${role})`;
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    renderUI();
  }
});
