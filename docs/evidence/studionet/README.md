# Studionet evidence

Network: Studionet61999. Contract:
[0x3538571716638eDCEbF45BC7438FD7DdD4F3bA02](https://explorer-studio.genlayer.com/address/0x3538571716638eDCEbF45BC7438FD7DdD4F3bA02).

Deployment transaction:
[0x5c66de2aa0454f5c04eb93cf0248a15b910ed941bf1fa66fd35aeb89a81f7be6](https://explorer-studio.genlayer.com/tx/0x5c66de2aa0454f5c04eb93cf0248a15b910ed941bf1fa66fd35aeb89a81f7be6).

Status: FINALIZED. Result: SUCCESS. Consensus: MAJORITY_AGREE.
Chrome Explorer verification independently displayed Execution Result SUCCESS.
Deployed source matches the journal SHA256 and the schema exposes18methods.

`journal.json` contains safe projected receipts,public actors,GEN amounts,
canonical before/after and native-child proofs. `browser-journal.json` records
separately the transactions actually signed through the application's wallet.
`lifecycle-verification.json` is the initial fully recovered6GEN checkpoint;
later browser activity has its own accounting snapshots.

The payability warning is reviewed against actual metadata:open_request is the
only value-accepting public method and schema payable=true. The private module
helper _nonpayable reads gl.message.value only to reject nonzero value on every
other entrypoint. It is not a value-accepting public write. Direct metadata and
wrong-value tests cover this distinction;the helper must not be marked payable.

`network-preflight.json` separates the Studio Dev outage from the selected
Studionet identity. `exact-source-smoke.json` is an isolated0GEN diagnostic,
not another production contract. Its helper code was extracted unchanged from
the production source. No full receipt,validator config or signing key is stored.

The important-queue expected/actual mismatch is retained explicitly. It does not
count as UNCLEAR coverage;the separate unspecified-criteria request supplies that
production evidence. No guarantee of semantic classification accuracy is made.
