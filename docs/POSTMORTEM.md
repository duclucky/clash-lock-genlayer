# ClashLock delivery review

Delivered October15,2026 as a Projects submission, Pending review. This is an
execution record, not a claim of steward acceptance or semantic accuracy.

## What was validated

- One ASCII ClashLockContract owns reservations, monotone fences and refundable
  deposits on Studionet61999. Deployed source matches the committed source digest.
- Independent validators judge the complete live-scope overlap vector after
  deterministic authority, source-version and expected-peer checks. The backend
  does not calculate the verdict.
- 80 direct contract,14 receipt and47 frontend tests pass:141 total,zero critical
  skips. The unchanged Projects grader reports0BLOCKER,one reviewed warning and
  all five acceptance gates PASS. Its19/20 estimate is not an official score.
- 40 script and9 actual browser transactions, plus two expected finalized ERROR
  rejections, cover conflicting/disjoint/shared/unclear scopes, use, release,
  cancel, expiry, reacquisition and stale-fence denial. All12GEN returned through
  11 verified native withdrawals; escrow,credit and native balance are zero.
- Nine product routes and persistent navigation use canonical reads and a
  user-selected EVM wallet. Production returnsHTTP200 and the correct React app.
- The authenticated Portal records Projects submission
  cd567f7e-17cc-4607-bebc-74f3252c965f as Pending review.

## Lessons

1. Keep network identity and runtime compatibility together. Studio Dev reads
   failed before writes; the verified D1 fallback uses the matching legacy
   Studionet runner, SDK, wallet chain, RPC and Explorer.
2. A finalized parent and a zero credit are insufficient refund evidence.
   Verify each native transfer child and exact payer/contract GEN deltas.
3. Receipt-read failures do not authorize replay. Retain the signed hash, retry
   bounded reads and reconcile canonical state. Exhaustion says confirmation is
   unavailable. Real-SDK regressions cover transient recovery and exhaustion.
4. Git hygiene and hosting upload hygiene are different boundaries. Require an
   actual source-upload manifest allowlist, including absence of environment
   files, before every upload.
5. Keep observed semantic mismatches. One important-queue expectation was
   UNCLEAR but consensus returned CONFLICT. A separate unspecified-scope case
   proves the actual UNCLEAR branch; neither establishes universal accuracy.
6. Review heuristic warnings against code and evidence. Do not mark a private
   nonpayable guard payable or remove legitimate fake-timer regression tests to
   improve a static estimate.

## Limits and next milestone

V1 coordinates protocol-native declared work. Its fence gates the contract's
protocol action; it does not stop an unintegrated service from writing, prove
external ownership or execution, guarantee fairness or establish adoption.
Bounds remain three participants,three concurrent reservations,32 requests per
workspace and two review attempts. Other networks and external adopters are
unverified. The optional custom logo upload is unverified.

The next substantial milestone is an authenticated MCP/HTTP consumer that checks
the current fence at its actual protected write boundary, records an effect
receipt and demonstrates a TOCTOU defense. Acceptance requires rejecting expired,
released,wrong-owner and stale generations with no external effect, plus a
successful current-generation write and independent effect proof. Only pursue a
Milestones submission after this Projects version is accepted; integration and
adoption remain proposed work. Bounded multi-resource lock sets can follow.
