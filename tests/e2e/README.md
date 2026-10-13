# End-to-end testing against the Firebase emulators

Runs the real website against local Firebase Auth + Firestore emulators, so the full
admission-to-enrollment workflow can be exercised without touching live data.

Requirements: Node.js, Java 11+, and the tools installed in `tests/firestore-rules`
(`cd tests/firestore-rules && npm install`).

1. Start the emulators from the project root (uses `firebase.json` and `firestore.rules`):

   ```bash
   tests/firestore-rules/node_modules/.bin/firebase emulators:start --only auth,firestore --project demo-pcm
   ```

2. Seed test accounts (Registrar `registrar@pcm.test`, Editor `editor@pcm.test`, and an
   existing student `legacy.student@pcm.test`):

   ```bash
   node tests/e2e/seed.mjs
   ```

3. Build and start the site in emulator mode:

   ```bash
   NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-pcm npm run build
   npx next start -p 3100
   ```

4. In the browser console at http://localhost:3100, sign in as any test user with
   `await __pcmEmulatorSignIn('someone@pcm.test', 'Name')` and sign out with
   `await __pcmEmulatorSignOut()`. These helpers exist only in emulator builds.

Rebuild without the two environment variables before deploying: the emulator flags are
read at build time.

## Scenarios covered (2026-10-13)

- Applicant: sign-in required, step validation, submit, duplicate application blocked,
  wrong file type / oversized file rejected, valid uploads saved and kept after reload.
- Editor: can view applications and documents but has no decision or verification actions.
- Registrar: Under Review -> request missing documents (Requirements Incomplete) ->
  applicant re-uploads (automatically back to Under Review) -> verify documents ->
  For Admission Approval -> Admitted -> For Enrollment (blocked until all required
  documents verified) -> Finalize enrollment (Student ID 2026-PCM-0001 created).
- Rejection requires a reason; the applicant sees the outcome and reason, uploads close.
- Enrolled student's portal opens with only their own record.
- Existing student record linked automatically on first Google sign-in (matching email).
- Mobile (375 px): applicant tracker and admin review panel fit without horizontal scroll.
