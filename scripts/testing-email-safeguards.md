# DineAura - Automated Testing & Email Safeguards

## Critical Policy: Zero Transactional Email Bounces

Supabase enforces strict sender reputation standards. Sending transactional Auth emails (such as confirmation links or password resets) to fake, randomly generated, or unverified email addresses causes **hard bounces**, which leads to email suspension warnings from Supabase and transactional email providers (Resend, SendGrid, etc.).

---

### Prohibited in Automated Tests

❌ **NEVER call the following methods against the LIVE Supabase project with fake or generated email addresses:**
- `supabase.auth.signUp({ email: "random_123@example.com", ... })`
- `supabase.auth.signUp({ email: "fake_user@gmail.com", ... })`
- `supabase.auth.resend({ type: 'signup', email: ... })`
- `supabase.auth.resetPasswordForEmail(...)`

---

### Approved Testing Strategies

#### 1. Component & SSR Unit Testing (Preferred)
- For testing protected views, components, and image rendering (e.g. `UserReservationsView`, `RestaurantImage`), render the components directly using mock data and `react-dom/server` or React Testing Library.
- No Supabase Auth network calls are needed.

#### 2. Session Cookie Mocking
- Next.js `@supabase/ssr` checks the cookie named `sb-<project-ref>-auth-token`.
- To test authenticated routes locally, generate the JSON cookie string with mock tokens without contacting Supabase Auth.

#### 3. Dedicated Pre-Verified Test Account (If live login is required)
- Use `supabase.auth.signInWithPassword({ email, password })`.
- `signInWithPassword()` **never sends transactional emails**.
- Use credentials stored in environment variables (`TEST_USER_EMAIL`, `TEST_USER_PASSWORD`).
- Never create ad-hoc accounts in loops or test scripts.

#### 4. Local Supabase + Mailpit (For Full Auth Verification)
- When testing user registration or email confirmation flows end-to-end, use the local Supabase CLI (`npx supabase start`).
- All transactional emails are caught by local Mailpit/Inbucket (`http://localhost:54324`) and never sent over the internet.
