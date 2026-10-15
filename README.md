# ClashLock

Coordinate overlapping agent work before it clashes.

ClashLock uses GenLayer consensus to compare declared operation scopes and admit
temporary protocol locks with current fencing generations. It does not establish
external data ownership or stop an unintegrated external service from writing.

Category: Projects. The contract and browser application are implemented. Local
checks,a consequential Studionet lifecycle and browser create/deposit/review are
verified. Full browser recovery/withdrawal and submission acceptance are being verified.

## Live App

[Open ClashLock](https://clash-lock-genlayer.vercel.app).
Production HTTP200,project title,React root and same-origin Studionet RPC verified.

## Deployed Contract

Studionet, chain61999:
[`0x3538571716638eDCEbF45BC7438FD7DdD4F3bA02`](https://explorer-studio.genlayer.com/address/0x3538571716638eDCEbF45BC7438FD7DdD4F3bA02).
The deployed code matches source SHA256
`61e89b020182028ec10ee8b1bd922854d5ec5d95282b1cd9e2962f13166658d3`.

Studio Dev was unavailable during preflight. This deployment uses the coherent
Studionet legacy runner v0.2.16 and pinned genlayer-js1.1.8. Evidence and Explorer
links belong to Studionet only. See [network preflight](docs/evidence/studionet/network-preflight.json).

## Run locally

Use Node22 and Python3.12 on Windows:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.lock
npm ci
Copy-Item frontend/.env.example frontend/.env
# Set VITE_CONTRACT_ADDRESS to the public address above.
npm run check
npm run dev
```

Open http://127.0.0.1:5197 . Select an installed EVM wallet and connect to
Studionet. Reads use the same-origin IC proxy; writes use the selected wallet.
The frontend contains no signing key. Create a workspace with three distinct
participants, request a scope with exactly1GEN, check availability, then use
and release your current reservation or recover it after expiry. Withdraw your
own returned credit from Wallet & deposits.

## Deploy and inspect

For an authorized operator only, supply existing Studionet signers through an
ignored project `.env` using STUDIONET_PRIVATE_KEY,
STUDIONET_INTEGRATOR_PRIVATE_KEY and STUDIONET_STEWARD_PRIVATE_KEY.
Never put those variables in frontend configuration.

```powershell
node scripts/network.mjs inspect
node scripts/network.mjs deploy
node scripts/network.mjs poll deploy
node scripts/network.mjs read get_policy
```

The existing journal resumes this deployment; it never redeploys a recorded
transaction. A distinct future revision needs a separately reviewed deployment
identity. Do not remove the journal to retry an ambiguous transaction.

## Architecture and evidence

One Intelligent Contract owns immutable workspaces, scope requests, live
occupancy, monotone fencing generations and payer credits. Validators independently
fetch a fixed dated W3C policy and classify overlap against every current peer.
Contract code checks exact IDs/classes and derives admission/refund consequences.
An unclear or conflicting request returns its deposit; technical review failure
keeps it recoverable. Only the original payer can withdraw its credit.

The initial lifecycle contains23finalized successful transactions and6verified
native withdrawals. All6GEN deposits returned; canonical escrow,credit and native
contract balance were0GEN at that checkpoint. [Verification](docs/VERIFICATION.md),
[safe journal](docs/evidence/studionet/journal.json),
[specification and authority matrices](docs/README.md).

`npm run check` verifies semantic lint,80Python direct tests,14receipt tests,
44frontend tests,the real SDK adapter boundary,TypeScript and production build.
Direct-mode mocked tests are separate from real network consensus evidence.

Hosting uses Vercel's Vite preset,root directory `frontend/`,build command
`npm run build`,output `dist`,and the public production environment variable
`VITE_CONTRACT_ADDRESS`. `.vercelignore` excludes every local environment file.
Authorized operators redeploy through `scripts/deploy.ps1`,which audits Vercel's
actual upload manifest before uploading. Git's ignore rules alone are insufficient
for this CLI upload boundary.

## Limitations and next milestone

Declared scopes create protocol coordination rights. They do not establish real
data ownership,legal rights or external execution. An unintegrated service can
ignore a reservation. One important-queue case was judged CONFLICT when the test
expected UNCLEAR; that mismatch is retained in the evidence. Semantic accuracy
is not guaranteed. Explicit unspecified criteria separately finalized UNCLEAR.

The current bounds are three members,three live reservations and32requests per
workspace,two review attempts and up to30minutes per hold. Network consensus
latency suits coarse coordination. External adoption and other networks are
unproven. The next milestone is an authenticated gateway enforcing the current
fence at an actual external write boundary,with effect receipts and TOCTOU proof.
