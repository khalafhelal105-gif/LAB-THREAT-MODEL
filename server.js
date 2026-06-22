// InternalFlow — Expense Approval Portal (prototype)
// CYSE 411 lab build. Intentionally contains a client-side authorization
// trust issue for students to find and fix. Do not deploy this code as-is.
//
// Built with Node's built-in http module only (no external dependencies),
// so `npm install` has nothing to fetch and there's nothing to break.

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PUBLIC_DIR = path.join(__dirname, "public");

// ---- In-memory "database" (fine for a lab prototype) ----
const USERS = {
  alice: { password: "alice123", role: "employee", name: "Alice Employee" },
  bob: { password: "bob123", role: "employee", name: "Bob Employee" },
  carla: { password: "carla123", role: "manager", name: "Carla Manager" },
};

let nextId = 4;
const REQUESTS = [
  { id: 1, owner: "alice", amount: 42.5, category: "Travel", description: "Taxi to client site", status: "Pending" },
  { id: 2, owner: "bob", amount: 120.0, category: "Equipment", description: "USB-C dock", status: "Pending" },
  { id: 3, owner: "alice", amount: 18.0, category: "Meals", description: "Team lunch", status: "Approved" },
];

const MIME = { ".html": "text/html", ".js": "application/javascript", ".css": "text/css" };

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", ...headers });
  res.end(payload);
}

function readBody(req, cb) {
  let data = "";
  req.on("data", chunk => (data += chunk));
  req.on("end", () => {
    try {
      cb(data ? JSON.parse(data) : {});
    } catch (e) {
      cb({});
    }
  });
}

function serveStatic(req, res, pathname) {
  let filePath = pathname === "/" ? "/index.html" : pathname;
  filePath = path.join(PUBLIC_DIR, filePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // ---- POST /api/login ----
  // NOTE: this is a simplified prototype login. There is no server-side
  // session of its own here, on purpose — the FRONTEND is responsible for
  // remembering who is logged in and what their role is. That design
  // choice is exactly what you are evaluating in this lab.
  if (req.method === "POST" && pathname === "/api/login") {
    return readBody(req, body => {
      const { username, password } = body;
      const user = USERS[username];
      if (!user || user.password !== password) {
        return send(res, 401, { error: "Invalid credentials" });
      }
      return send(res, 200, { username, role: user.role, name: user.name });
    });
  }

  // ---- GET /api/requests ----
  if (req.method === "GET" && pathname === "/api/requests") {
    return send(res, 200, REQUESTS);
  }

  // ---- POST /api/requests ----
  if (req.method === "POST" && pathname === "/api/requests") {
    return readBody(req, body => {
      const { owner, amount, category, description } = body;
      if (!owner || !amount || !category) {
        return send(res, 400, { error: "Missing fields" });
      }
      const newReq = { id: nextId++, owner, amount, category, description: description || "", status: "Pending" };
      REQUESTS.push(newReq);
      return send(res, 201, newReq);
    });
  }

  // ---- POST /api/requests/:id/decision ----------------------------------
  // VULNERABILITY LIVES HERE (this is what Round 2/3 should have flagged):
  // The server trusts `actingRole` from the request body instead of
  // independently verifying, server-side, that the caller actually holds
  // the "manager" role. Any authenticated user can set this field to
  // "manager" from the browser console / DevTools and approve or reject
  // ANY request, regardless of their real role.
  const decisionMatch = pathname.match(/^\/api\/requests\/(\d+)\/decision$/);
  if (req.method === "POST" && decisionMatch) {
    return readBody(req, body => {
      const { decision, actingRole } = body;

      if (actingRole !== "manager") {
        return send(res, 403, { error: "Only managers can approve or reject requests" });
      }

      const id = parseInt(decisionMatch[1], 10);
      const reqItem = REQUESTS.find(r => r.id === id);
      if (!reqItem) return send(res, 404, { error: "Request not found" });

      if (decision !== "approved" && decision !== "rejected") {
        return send(res, 400, { error: "Invalid decision" });
      }

      reqItem.status = decision === "approved" ? "Approved" : "Rejected";
      return send(res, 200, reqItem);
    });
  }

  // ---- static files ----
  if (req.method === "GET") {
    return serveStatic(req, res, pathname);
  }

  send(res, 404, { error: "Not found" });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`InternalFlow running at http://localhost:${PORT}`);
});
