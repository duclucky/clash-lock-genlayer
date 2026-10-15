# ClashLock submission packet

Readiness: audit in progress. Portal submission has not been confirmed.
This packet distinguishes completed proof from the remaining browser controls.

- Recommended category: Projects (Builders track).
- Title: ClashLock — semantic reservations for shared agent work.
- Product: [production app](https://clash-lock-genlayer.vercel.app).
- Repository: [public source](https://github.com/duclucky/clash-lock-genlayer).
- Primary contract: [Studionet Explorer](https://explorer-studio.genlayer.com/address/0x3538571716638eDCEbF45BC7438FD7DdD4F3bA02).
- Consumer contract: N/A. This version has no deployed external execution gateway.

## Description

The copy-ready description is [submission-notes.txt](submission-notes.txt):
877 characters, excluding its trailing newline. It describes protocol-native
scope reservations, independent semantic review, refundable GEN deposits,
the initial completed six-GEN script checkpoint and the browser-wallet path.
It does not claim external write enforcement or adoption.

## Evidence

- [Deployment and script lifecycle journal](evidence/studionet/journal.json):
  allowlisted receipts, public actors, canonical state before/after, GEN balances
  and native transfer children. One expected semantic classification disagreed
  with the observed result; that mismatch remains recorded.
- [Browser-wallet journal](evidence/studionet/browser-journal.json): create,
  deposit, review, protocol action, release and withdrawal finalized successfully.
  The exact one-GEN native refund was verified. Browser expiry recovery has also
  finalized successfully; cancellation and its aggregate withdrawal are pending.
- [Exact-source consensus probe](evidence/studionet/exact-source-smoke.json):
  frozen overlap, disjoint, unclear and injection cases. This is a diagnostic,
  not an additional production contract or proof of universal semantic accuracy.
- [Hosting verification](evidence/studionet/hosting.json): production HTTP200,
  app title, React root and same-origin RPC chain61999.
- [Actual screenshot walkthrough](DEMO.md): approximately30seconds; not a
  continuous screen recording. No invented YouTube or X link.
- [Successful public CI](https://github.com/duclucky/clash-lock-genlayer/actions/runs/38727050240)
  belongs to commit `be3ba9ade4078123c36ed211fcc2ee33529942ed`.
  Later working changes require a new successful CI before final readiness.

## Verified facts and limits

There is exactly one production intelligent contract, `ClashLockContract`,
on Studionet chain61999 at the linked address. Fresh local verification passed
80 direct contract tests,14 receipt tests and45 frontend tests (139 total),
with zero critical skips, followed by TypeScript and the production build.
Direct tests and real consensus evidence are different kinds of proof.

The selected-network lifecycle includes an opposing actor's conflicting scope,
disjoint writes, overlapping shared reads, an unclear scope, cancellation,
protocol-native fencing and exact native refunds. An expired fence was rejected
with finalized ERROR and unchanged canonical requests/accounting; this negative
transaction is not counted as a successful consequence. Browser expiry recovery
returned one GEN to its payer's credit. Final withdrawal,reacquisition and
old-generation rejection remain under verification.

The app reads canonical state and signs through a user-selected EVM provider.
V1 does not establish outside ownership, legal rights, external effect
enforcement, real adoption, globally fair scheduling, other-network support or
guaranteed model accuracy. The next substantial milestone is an authenticated
consumer enforcing current fencing generations at its actual write boundary,
with effect receipts and a demonstrated TOCTOU defense.

## Why Projects

ClashLock delivers a complete wallet-enabled application with entry, workspace,
request, history, account and help views. Its primary browser journey signs real
transactions, follows successful finality and reloads canonical consequences.
It is an initial product submission; the proposed execution gateway is future
milestone work, not a completed integration.

## Submission status

An authenticated Portal draft is populated. No submission confirmation,
submission identifier, award, points or steward acceptance is claimed.
The final acceptance audit and user-controlled wallet steps must finish first.
