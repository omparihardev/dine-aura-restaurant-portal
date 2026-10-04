# Strict DineAura Testing & Supabase Email Rule

## MANDATORY FOR ALL FUTURE AGENTS AND TESTS

To prevent bounced transactional emails and protect the project's Supabase sender reputation, the following rules MUST be followed without exception:

1. **NEVER call Supabase Auth `signUp()` against the production/remote Supabase project** using:
   - fake emails
   - random generated emails (`test_${Date.now()}@...`, `voguetester_${Date.now()}@...`)
   - `@example.com`
   - nonexistent Gmail addresses
   - temporary or unverified addresses

2. **NEVER use `resend()` or `resetPasswordForEmail()`** against the remote Supabase project with fake/test addresses.

3. **For automated tests that do not specifically require real email delivery:**
   - Mock authentication/email behavior.
   - Mock sessions/cookies (e.g. `sb-<project-ref>-auth-token`).
   - Use existing test data.
   - Use `signInWithPassword()` with a real, verified test account when a live authenticated session is genuinely required.

4. **If signup / email confirmation must be tested end-to-end:**
   - Use **LOCAL Supabase** via Supabase CLI (`npx supabase start`).
   - Use **Mailpit / Inbucket** (`http://localhost:54324`).
   - Do NOT send test emails through the remote/production Supabase project.

5. **Pre-Test Inspection**:
   - Before executing any automated test script, inspect the code and confirm it will NOT send an email to an invalid address.

6. **Prohibited Account Creation**:
   - Do NOT create timestamp-based email accounts such as:
     - `test_${Date.now()}@...`
     - `tester_${Date.now()}@...`
     - `random@gmail.com`
     - `fake@example.com`

7. **Production Integrity**:
   - Do NOT modify production authentication settings or disable email confirmation just to make testing easier.

8. **Account Creation Approval**:
   - If a new test account is required for a live integration test, **STOP and ask the user first**. Do not automatically create one.

9. **Scope**:
   - This rule applies to all scratch tests, `.mjs` scripts, `.mts` scripts, automated browser tests, Supabase integration tests, route tests, and future feature tests.

10. **Mandatory Reporting Checklist**:
    - Before reporting any test as complete, explicitly state:
      1. Whether any Supabase Auth email was sent.
      2. Whether any `signUp()`, `resend()`, or `resetPasswordForEmail()` call was made.
      3. Whether the test used the remote or local Supabase environment.

11. **Deployment / Git Policy**:
    - Do NOT commit, push, or deploy unless explicitly instructed by the user.
