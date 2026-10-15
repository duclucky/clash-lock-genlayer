# ClashLock submission packet

Local and real-network verification are complete. Portal submission has not been
confirmed. This packet distinguishes actual browser transactions from script setup.

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
  finalized successfully; cancellation and the exact two-GEN aggregate refund
  have too. The extra cancellation/recovery requests were created by script;
  their subsequent contextual browser controls were signed in the application.
- [Exact-source consensus probe](evidence/studionet/exact-source-smoke.json):
  frozen overlap, disjoint, unclear and injection cases. This is a diagnostic,
  not an additional production contract or proof of universal semantic accuracy.
- [Hosting verification](evidence/studionet/hosting.json): production HTTP200,
  app title, React root and same-origin RPC chain61999.
- [Final canonical checkpoint](evidence/studionet/final-verification.json):
  40 script and9 browser transactions, two expected finalized rejections,
  11native withdrawals,12GEN returned,zero escrow/credit/native balance.
- [Actual screenshot walkthrough](DEMO.md): approximately30seconds; not a
  continuous screen recording. No invented YouTube or X link.
- [Public CI on main](https://github.com/duclucky/clash-lock-genlayer/actions/workflows/check.yml?query=branch%3Amain):
  Windows,Python3.12,Node22;the acceptance audit checks the successful run's
  exact head SHA against the published commit before submission.

## Verified facts and limits

There is exactly one production intelligent contract, `ClashLockContract`,
on Studionet chain61999 at the linked address. Fresh local verification passed
80 direct contract tests,14 receipt tests and47 frontend tests (141 total),
with zero critical skips, followed by TypeScript and the production build.
Direct tests and real consensus evidence are different kinds of proof.

The selected-network lifecycle includes an opposing actor's conflicting scope,
disjoint writes, overlapping shared reads, an unclear scope, cancellation,
protocol-native fencing and exact native refunds. An expired fence was rejected
with finalized ERROR and unchanged canonical requests/accounting; this negative
transaction is not counted as a successful consequence. Browser expiry recovery
returned one GEN to its payer's credit. The aggregate refund returned two GEN
through its native child. Reacquisition granted fence6;using old fence5 was
rejected without changing canonical requests/accounting. Every request now has
zero deposit,all issued fences are invalid and all12GEN have returned.

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
All planned wallet steps are complete. Final publishing/CI checks and CAPTCHA
must finish before submission;no submission success is inferred from the draft.

## Short report

**Project name:** ClashLock

**Description:** ClashLock reserves shared agent work using GenLayer validators to judge semantic scope overlap, issue expiring fences, and return refundable GEN deposits.

**GitHub (public):** https://github.com/duclucky/clash-lock-genlayer

**Live app:** https://clash-lock-genlayer.vercel.app

**Contract (Studionet):** 0x3538571716638eDCEbF45BC7438FD7DdD4F3bA02
