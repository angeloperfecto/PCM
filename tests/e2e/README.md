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

## Assessment and payment scenarios (2026-10-13, second pass)

Seed also creates Finance `finance@pcm.test` and a fee structure (tuition ₱850/unit,
registration ₱1,500, library ₱1,000).

- 9-stage tracker shown to the applicant.
- Registrar: For Assessment blocked until every required document is verified; draft
  assessment loaded from the fee structure (18 units -> ₱17,800); minimum above the total
  rejected; saving moves the applicant to For Payment. Finalize not offered before payment.
- Applicant: sees assessment and instructions; short reference rejected; two payments
  reported (₱3,000 with proof, ₱2,000).
- Finance: "Payments to verify" queue; no decision/finalize buttons; first verification
  keeps For Payment, second reaches the ₱5,000 minimum and moves to For Enrollment.
- Registrar: finalize creates 2026-PCM-0001 with portal access, tuition ₱17,800, paid
  ₱5,000, balance ₱12,800 and both payment records; audit trail lists assessment, both
  verifications and enrollment with names and times; detail corrections are logged.

## Restructured admission-to-enrollment workflow (2026-10-14)

Statuses shown to users: Submitted, Under Review, Incomplete Requirements, For Correction,
For Admission Decision, Admitted, For Registration, For Assessment, Pending Payment,
For Final Verification, Officially Enrolled, Rejected, Deferred, Withdrawn (stored values unchanged).

Tested through the real screens with two sessions (applicant on 127.0.0.1, Registrar on localhost):

- Draft: three steps filled, page reloaded -> draft restored at step 4; deleted on submission.
- Submit -> Under Review -> Return for correction (note) -> applicant fixes name -> Under Review.
- Documents uploaded; For Registration stays blocked until all required documents are verified.
- Admitted -> For Registration; assessment blocked until the student registers.
- Student Portal: subject selection enforces 12-24 units, max 8 subjects, no timetable clash,
  no full sections; 4 subjects / 12 units submitted -> For Assessment.
- Assessment drafted from the registered 12 units (P15,700); payment reported and verified.
- Final verification checklist (5 items) + approval tick -> Finalize: Student ID 2026-PCM-0001,
  student record with the 4 subjects, seat counts +1, enrollment confirmation printable.
- After reload the Student Portal shows the subjects in Class Schedule; Apply page tells the
  enrolled student to use the portal; complete audit trail (11 entries).
- Second applicant: registration form fits 375 px; withdrawal needs a reason; can re-apply.
