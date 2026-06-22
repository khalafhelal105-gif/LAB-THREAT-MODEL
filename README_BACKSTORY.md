# InternalFlow — Pre-Launch Security Review (Backstory)

## Your role

You are a security engineer on the AppSec team. The development team behind
**InternalFlow**, the company's new internal expense-approval tool, has
finished a working prototype and wants to pilot it with two departments next
month. Before that happens, your team was asked to do a quick pre-launch
review — the same review your group performed in class across Rounds 1–3
(DFD, STRIDE threat enumeration, and DREAD ranking).

Your group's threat model flagged a high-priority issue: the application
decides who is allowed to approve or reject expense requests based on
state that lives entirely in the user's browser (`localStorage`, a cookie),
and the backend does not independently verify that state.

## What you're being asked to do now

The engineering lead has given your team write access (via Pull Request) to
fix exactly this issue before pilot launch. You are not being asked to
redesign the whole application, add new features, or fix unrelated code
style issues — just to close the specific authorization gap your team
identified.

## Constraints you were given

- Do not change the login flow's response format in a way that breaks the
  existing frontend pages (you may add fields, but don't remove `role` from
  the login response — other planned frontend work depends on it).
- Your fix must hold up even if an attacker has full access to browser
  DevTools and can edit `localStorage`, cookies, and outgoing `fetch()`
  bodies freely. Assume they have read this backstory too.
- Keep the in-memory data store as-is; you do not need to add a real
  database for this fix.
- You may add a minimal server-side session mechanism (e.g., an in-memory
  map of issued session tokens to roles, returned at login and required on
  the decision endpoint) — this is the expected shape of a correct fix, but
  if your team designs an equivalent server-side verification approach,
  that is acceptable too. The point is: **the server must independently know
  the caller's role; it must not take the client's word for it.**

## What "done" looks like

After your fix:
- An employee account (e.g., `bob`) logging in and editing `localStorage`
  to set `role` to `"manager"` should **not** be able to successfully
  approve or reject any expense request.
- A real manager account (e.g., `carla`) should still be able to approve
  and reject requests normally.
- The existing UI/UX should still work for normal use (you can leave the
  Manager Console *visibility* logic as a UI convenience — hiding a button
  is fine — but it must no longer be the thing standing between an employee
  and the approval action).

Good luck — write your Pull Request description as if you were handing this
back to the engineering lead who asked for the review.
