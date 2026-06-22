# InternalFlow Lab — CYSE 411

Prototype expense-approval portal used for the Unit 1 / Unit 2.1 in-class
threat modeling exercise. **This code is intentionally vulnerable for
educational purposes. Do not deploy it, and do not reuse this pattern in
real projects.**

See `README_BACKSTORY.md` for the Round 4 assignment context.

## Setup

```bash
npm install
npm start
```

Then open http://localhost:3000 in your browser.

## Test accounts

| Username | Password  | Role     |
|----------|-----------|----------|
| alice    | alice123  | employee |
| bob      | bob123    | employee |
| carla    | carla123  | manager  |

## Before you touch any code

Confirm you can reproduce the privilege escalation described in your
group's Round 2/3 work:

1. Log in as `bob` (an employee).
2. Open browser DevTools → Console.
3. Run: `localStorage.setItem("role", "manager")`
4. Reload the page. The Manager Console should now appear.
5. Try approving or rejecting a pending request as `bob`.

If step 5 succeeds, you've confirmed the vulnerability. Now fix it per the
instructions in `README_BACKSTORY.md`, and re-run this same test to confirm
it now correctly fails.
