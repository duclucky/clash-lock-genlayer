# ClashLock specification

Initialized against PROJECT-SPEC-TEMPLATE at selection. Phase3A/3B baseline is
verified in VERIFICATION.md. Phase4 completes the technical design below before
production source. No network execution is inferred from a specification.

## Identity

- Idea ID: IDEA-045
- Project name: ClashLock
- Project slug: clash-lock
- Category: Projects
- Status: BUILDING (Phase4 specification complete; execution pending)
- Repository: independent child Git repository; public remote pending Phase11
- Target network: Studionet61999 under verified unavailable-Studio-Dev D1 fallback

## One-sentence product hook

Reserve the meaning of your next operation, so differently worded requests cannot
silently claim conflicting work at the same time.

## Trust problem

Current holders want broad conflict interpretations; newcomers want narrow ones.
One platform operator must not privately decide which declared scopes overlap
before a reusable exclusion right is issued. GenLayer validators independently
compare canonical declarations. This coordinates protocol-native reservations,
not physical data ownership or the actual execution of external actions.

## Scope and non-goals

In scope: bounded shared workspaces with three distinct registered participants;
immutable natural-language scope requests; read/write mode;1GEN refundable
request deposits; consensus-based temporary lock admission; canonical occupancy,
history and contextual recovery; monotone fences; own-credit withdrawals.

Out of scope: outside service enforcement,private credentials,data ownership,
legal rights,invoice payments,automatic execution of external tools,globally fair
scheduling,multi-chain assets,arbitrary web evidence or assumed external adoption.
Do not describe a protocol lock as an outside-world exactly-once guarantee.

## Provisional contract-capability sketch

Human roles: workspace creator,registered participants,current lock holder and
competing requester. The creator defines immutable resource meaning,members and
closing time. Registered members may request scopes with1GEN deposit,review
their request,use current fences,release their held lock,cancel their pending
request,recover an expired request/lock and withdraw their own available credit.

Views needed: searchable workspace list,workspace details and members,current
occupancy and time bounds,request detail and attempt history,own credits and
withdrawals,canonical fence validity and action result. List/detail reads must
come from the contract after integration,not from localStorage.

Meaningful states: awaiting review,held,conflicting,needs clarification,technical
retry,returned deposit,released,expired and withdrawn. Submitted/accepted/finalized
are transaction feedback,not replacements for canonical business states.
Review may refuse admission; that is an honest user outcome rather than an app error.

Every request deposit is exactly1GEN. Refunds always belong to the actual payer.
Pending request cancellation never revokes somebody else's lock. Expiry/recovery
must use the canonical transaction clock. A stale fence is never a current right.
The typed adapter remains honestly unconfigured until Phase7/9 supply real calls.

## Product/frontend blueprint

### Human users and jobs

| User/role | Primary job | Decision or outcome needed |
|---|---|---|
| Workspace creator | Bring independent operators into one declared resource space | Clear immutable member/resource policy before any request |
| Registered requester | Reserve safe work in their own words | Understand current work,request a scope and see held/conflict/unclear outcome |
| Current holder | Keep a reservation only while needed | See expiry and use/release current fence |
| Returning participant | Recover their deposits and revisit decisions | Filter history,inspect request,withdraw own credit |

### Named page/route map and information architecture

| Screen/view | User purpose | Primary action | Required states | Mobile behavior |
|---|---|---|---|---|
| `/` Welcome | Understand scope coordination and limitations | Browse workspaces | Entry;network setup message;clear explanation,not fabricated activity | Stacked hero and illustrative CSS concept diagram labeled as illustration |
| `/workspaces` Workspaces | Find and return to a shared space | Search/open a workspace | Loading,empty,error,retry,canonical results | One-column searchable cards |
| `/workspaces/new` Create workspace | Define a resource and invite named operators | Review then create | Form entry,validation,confirmation,submitted/finalized/error | One fieldset per section,full-width controls |
| `/workspaces/:id` Workspace | Understand current occupancy and membership | Request a scope | Read loading/error;no active work;active locks;closed/read-only | Occupancy list before optional verification |
| `/workspaces/:id/request` Request | Describe intended work and read/write mode | Review exact1GEN request then sign | Form,review,missing wallet,invalid membership,time eligibility,submission/finality/error | Two-step form with back and retained inputs |
| `/requests/:id` Reservation detail | Review decision and act on current reservation | Contextual review/release/recover/use/cancel | Pending,held,conflict,unclear,retry,expiry,credit/withdrawn;attempt history | State/action first,details below |
| `/activity` My activity | Revisit own requests and their outcomes | Search/filter/open a request | Disconnected,loading,empty,error,list | Filters wrap;cards avoid wide tables |
| `/account` Wallet and deposits | See own refundable credit and disconnect | Withdraw own credit | Disconnected,loading,zero credit,withdrawable,waiting/finalized/error | Address wraps;one action area |
| `/help` How it works | Understand modes,refunds,finality and limits | Return to workspaces | Real explanatory content,source/Explorer links | Narrow readable text;consistent help link |
| unknown path | Recover from a broken link | Go to workspaces | Not found | Simple accessible message |

Persistent header navigation: Workspaces,My activity,How it works,and wallet/account.
Brand returns to Welcome. Deep pages include clear breadcrumbs/back links.
The core journey is Welcome -> Workspaces -> Workspace -> Request(define/review)
-> Reservation detail -> contextual review -> held/conflict -> release/refund ->
Wallet and deposits -> withdrawal -> My activity -> another reservation.
The creator also has Workspaces -> Create(define/review) -> Workspace.

### Visibility matrix

| Function/data group | Visibility | Eligible role/state | User need or reason hidden |
|---|---|---|---|
| Workspace name,resource meaning,members,active scopes,time bounds | USER_PRIMARY | All readers | Decide where and when to request |
| Scope,mode,deposit1GEN,request outcome | USER_PRIMARY | Requester/reader | Understand the reservation and cost/recovery |
| Review/retry,cancel,use,release,recover | USER_CONTEXTUAL | Exact eligible member/holder and legal state/time | Complete/recover current work |
| Own available credit and withdraw | USER_PRIMARY | Connected payer | Recover actual deposited GEN |
| Transaction progress and failure instructions | USER_CONTEXTUAL | User with current transaction | Wait honestly and recover without duplicate writes |
| Raw status,attempt IDs,epoch,fence generation,transaction hash | USER_CONTEXTUAL | Optional verification disclosure | Verify,do not overwhelm |
| Validator receipts,raw policy payload,prompt,submission packet | SYSTEM_ONLY | None on primary surface | Engineering/reviewer material |
| Public chain and contract Explorer link | USER_CONTEXTUAL | Any reader | Independent verification |

### Provisional UI action matrix

| Visible control | Contract capability/method | Eligible role | Legal state | Input/value | Finality | Failure/recovery |
|---|---|---|---|---|---|---|
| Create workspace | create_namespace | Connected creator | New immutable ID | name,resource,two other wallets,close time;0GEN | Wait FINALIZED+SUCCESS,reload list/detail | Preserve form;show specific failure |
| Reserve this work | open_request | Registered member | Open workspace,request capacity | immutable scope,READ/WRITE,lease duration;1GEN | Finalized then reload request | Never claim deposit before receipt;inspect pending hash |
| Check availability | review_request | Requester | PENDING or permitted technical retry,before cutoff | exact request ID;0GEN | Finalized canonical outcome | Distinguish conflict/unclear from technical failure |
| Record protected protocol action | use_fence | Current holder | HELD,unexpired,current fence | current request/fence;0GEN | Finalized then reload validity/history | Reject stale generation;no external execution claim |
| Release reservation | release | Current holder | HELD and before expiry | request;0GEN | Finalized then reload own credit | Reload before any retry |
| Cancel request | cancel_request | Actual requester | Pending/retry,no held right | request;0GEN | Finalized then reload credit | Does not alter incumbent interest |
| Recover expired deposit | recover | Registered workspace participant | Request review timeout or held expiry | request;0GEN | Finalized then reload credit | Returns only to actual payer |
| Withdraw available GEN | withdraw | Own credited wallet | Positive canonical own credit | no arbitrary recipient;0GEN attached | Verify finality,reload credit/balance | Never report funds received from submission alone |
| Refresh/search/filter/open | typed view adapter | Any reader;own activity after connect | Any | no value | Canonical reads | Retry view without replaying writes |
| Connect/disconnect | EVM provider layer | Browser user | Provider detected/selected | account permission,correct chain | Wallet connection is not transaction finality | Clear account/provider and disable writes on logout |

### User-facing state language

| Canonical status/violation | User-facing label | User consequence/next step |
|---|---|---|
| PENDING | Ready to check | Run availability review or cancel own request |
| HELD | Reserved for you / Reserved | Valid until shown expiry;holder can use/release |
| CONFLICT | Conflicting work is reserved | No new right;request deposit returned to own credit |
| UNCLEAR | Scope needs clarification | No new right;refund and submit clearer separate scope |
| RETRYABLE | Review unavailable | Technical failure;no new right,keep/cancel/recover deposit |
| RELEASED | Released | Old fence invalid;deposit available to withdraw |
| EXPIRED | Expired | No effective lock;recover deposit |
| CANCELLED/REFUNDED | Deposit returned | Own credit is authoritative;withdraw when ready |

### Wallet/network behavior

EIP-6963 discovery plus injected EVM fallbacks;centered detected-wallet picker
before requesting accounts;never auto-select. Selected provider/account exist
in memory and are rebound on account change. Clickable address exposes account
and disconnect. Logout clears selected account/provider and disables writes.
Before signing,switch/add verified Studionet61999 via selected EVM provider.
IC reads use a same-origin `/genlayer-rpc` proxy to selected Studionet RPC.
No private key,canonical wallet/finance state or fake finality in localStorage.
Missing contract configuration produces a clear setup message,not sample data.

### Visual preservation constraints

The project-local ui-ux-pro-max engine will select the design system using this
full nine-route brief. Style is a calm,clear collaborative productivity workspace
with medium density;the app must remain a product,not a reviewer dashboard.
After3A preserve tokens,typography,component style,page arrangement and navigation.
Only minimal functional label/control/accessibility/responsive corrections allowed.
System internals and submission material remain outside the primary experience.

## Fingerprint

- Trust problem: neutral scope-overlap interpretation before incremental exclusion rights.
- Actors/adversary: namespace authority and opposed incumbent/newcomer wallets.
- Evidence class + authenticity mechanism: role-authenticated canonical constitutive
  declarations and exact dated W3C policy fetched from its independent official origin.
- Consensus question: complete OVERLAP/DISJOINT/UNCLEAR vector against exact live IDs.
- State machine: request1GEN -> review -> HELD/CONFLICT/UNCLEAR/RETRYABLE;
  pending cancel/timeout and held release/expiry return credit;own-wallet withdrawal.
- Direct consequence: accepted live-set comparison issues monotone fencing authority;
  conflicting requests cannot obtain a current fence;every deposit returns to its payer.
- Reuse surface: namespace/request/attempt/fence/action/credit/accounting views/writes.

## Mandatory gate matrix

| Gate | PASS/FAIL | Evidence/reason |
|---|---|---|
| Replacement | PASS | One backend would regain unilateral control of semantic lock admission |
| Judgment | PASS | Natural-language set overlap cannot be determined by IDs or mode alone |
| Evidence availability | PASS | Two actual target-runtime policy fetches and8/8 semantic cases each;see admission diagnostic records |
| Evidence authenticity | PASS | Complete authority matrix below;constitutive sender-authored intent is not external execution evidence |
| Equivalence | PASS | Exact active IDs and normalized overlap classes;independent replay |
| Consequence | PASS_ADMISSION | Live fencing authority gates own protected action and future admission;execution pending |
| Adversarial | PASS | Incumbent benefits from broad conflict,newcomer from narrow conflict |
| State model | PASS_ADMISSION | Keyed state,immutable definitions,append-only attempts,exact time guards,all deposits recoverable |
| Reuse | PASS | Three proposed consumer interfaces in Adoption path |
| Contract count | PASS | One state owner;no pass-through guard |
| Differentiation | PASS | Incremental epoch-bound occupancy/fences;collision matrix below |
| Claim-to-code | PASS_ADMISSION | Trace matrix below,including negative tests and future execution artifacts |
| Full lifecycle | PASS_ADMISSION/PENDING_EXECUTION | Complete executable cases;real browser and value-exit evidence remain mandatory |
| Scope honesty | PASS | External enforcement,adoption and guaranteed semantic accuracy expressly excluded |

## Actors,roles and incentives

| Actor | Permissions | Value at risk | Incentive to bias |
|---|---|---|---|
| Creator | Immutable namespace definition;also registered member | Own request deposits only | May define broad universe;cannot rewrite it later |
| Requester | Authored scope,own review/cancel/release/use,withdraw own credit | Exactly1GEN refundable per request | Understate overlap to gain access |
| Incumbent member | Hold current scope;recover expired items | Own deposit | Overstate conflict to retain exclusion |
| Other registered member | Read;recover expired requests to their actual payers | Cannot receive somebody else's deposit | Griefing mitigated by time and bound checks |
| Unregistered reader | Public views only | None | No write authority |

## State model

Stable namespace/request IDs:1-64ASCII alphanumeric,hyphen or underscore;globally
unique per contract type,never reusable. Namespace has immutable creator,three
distinct nonzero EOA members,resource text,close timestamp,creation timestamp,
version,chain61999,contract identity and SHA256 definition digest. Membership is
permission to make constitutive requests;no claim of outside ownership.

Structured storage:Namespace and Reservation dataclasses in string-keyed TreeMaps;
append-only namespace/request ID arrays;structured Attempt records keyed request+index;
per-wallet credits and withdrawn totals;received,escrow,total-credit,withdrawn ledger.
Each namespace has max32lifetime requests;max3currently HELD. No global last-result.
Global ledger counters are accounting totals,not overwriteable business state.

Request locks namespace digest,owner,scope,mode,duration,creation/review deadline,
contract/version/network,computed definition digest. Only direct EOA transactions
are permitted on writes that establish EVM payout roles;sender==origin enforced.

State transitions:
PENDING/RETRYABLE -> HELD (complete safe vector),CONFLICT (any prohibited overlap),
UNCLEAR (any unclear),RETRYABLE (source/model/coverage failure).
PENDING/RETRYABLE -> CANCELLED by owner or EXPIRED after review deadline.
HELD -> RELEASED by owner before expiry or EXPIRED after expiry.
CONFLICT/UNCLEAR/CANCELLED/RELEASED/EXPIRED have no locked request deposit.
No terminal request can be reviewed/released/refunded twice. Credit withdrawal is
independent of request lifetime and always belongs to msg.sender.

Temporal source:timezone-aware gl.message_raw.datetime;seconds from Unix epoch.
create_namespace:now+300<=close<=now+604800. open_request:now<close and duration
120..1800seconds;review deadline=min(now+600,close). review_request:now<review
deadline;held expiry=min(now+duration,close). release/use:now<expires. recover:
pending now>=review_deadline or held now>=expires. Equality is late for actions,
eligible for recovery. Expired stale HELD entries never block new admission;
their deposit remains escrow until explicit permissioned recovery.
Cancel is non-temporal:owner may abandon pending interest at any time without
changing an incumbent;withdraw non-temporal:already credited funds have no expiry.

Namespace epoch increases on admission/release/recovery that changes occupancy;
fence counter increases on every admission and never decrements or reuses.
Each HELD request's immutable fence remains valid independently of other current
holders;validity requires exact request fence,state HELD and now<expiry.
use_fence records exactly one protocol action;no external action is executed.

## Write-method safety matrix

| Method | Caller | Allowed states | Forbidden states | Temporal/expiry gate | Idempotency | Value/accounting effect | Views affected | Negative tests |
|---|---|---|---|---|---|---|---|---|
| create_namespace | Direct EOA creator | Unique namespace | Existing ID,invalid members/resource | now+300<=close<=now+604800 | Duplicate rejects |0GEN,nonpayable | list/get_namespace | duplicate,bad members,zero,early/late close,value,origin |
| open_request | Registered EOA | Open namespace,unique request | Unregistered,closed,capacity32,invalid digest/mode/text | now<close;duration120..1800 | Duplicate rejects | exact1GEN->escrow/received once | get_request/list_requests/get_accounting | caller,state,deadline-1/= /+1,digest,duplicate,0/2GEN,accounting |
| review_request | Request owner EOA | PENDING/RETRYABLE,attempts<2 | Terminal,HELD,unregistered,source/provenance failure | now<review_deadline;stale phase cannot bypass | Terminal replay rejects | HELD keeps deposit;CONFLICT/UNCLEAR escrow->own credit;retry unchanged | request,attempts,namespace,accounting | wrong caller/state,duplicate,deadline bounds,vector/provenance/source/injection |
| use_fence | Exact holder EOA | HELD,not used,exact current fence | Pending,terminal,used,wrong fence | now<expires | Second use rejects |0GEN,no ledger change | request,is_fence_valid | caller,state,duplicate,expiry bounds,stale fence,accounting |
| release | Exact holder EOA | HELD | Pending,terminal,wrong caller | now<expires;expired must recover | Second release rejects |1GEN escrow->actual payer credit | request,namespace,credit,accounting | caller,state,duplicate,expiry-1/= /+1,no double credit |
| cancel_request | Exact requester EOA | PENDING/RETRYABLE | HELD,terminal | N/A:abandon own pending request cannot change incumbent | Second cancel rejects |1GEN escrow->actual payer credit | request,credit,accounting | caller,state,duplicate,closed request,accounting |
| recover | Registered EOA | Expired pending/retry or held | Terminal,premature,outsider | pending now>=review deadline;held now>=expires | Second recover rejects |1GEN escrow->original payer,never keeper | request,namespace,credit,accounting | caller,state,duplicate,boundary-1/= /+1,owner preserved |
| withdraw | Credited EOA | credit>0 | zero/already withdrawn,contract caller | N/A:own earned refund never expires | Debit before external message,second rejects | credit->withdrawn;EOA interface value exit | get_credit/get_accounting/native balances | wrong caller,0credit,duplicate,amount,recipient,invariant |

No automatic wallet generation or faucet. Existing authorized EOAs provide roles.

## Frontend lifecycle coverage matrix

| Canonical state | User action | Contract write | UI component | Frontend test | Evidence status |
|---|---|---|---|---|---|
| New namespace | Create | create_namespace | CreateWorkspace define/review | create validation,actual adapter parameters | PENDING_EXECUTION |
| Open namespace | Request1GEN | open_request | RequestPage define/review | payable adapter exact sender/value,digest | PENDING_EXECUTION |
| PENDING/RETRYABLE | Check availability | review_request | Detail contextual action | role/time/attempt eligibility,write/finality/reload | PENDING_EXECUTION |
| HELD | Record protocol action | use_fence | Detail contextual action | fence args,once-only state | PENDING_EXECUTION |
| HELD | Release | release | Detail contextual action | role/state/time,finality/reload | PENDING_EXECUTION |
| Pending/retry | Cancel | cancel_request | Detail contextual action | owner,state,write/reload | PENDING_EXECUTION |
| Due pending/held | Recover | recover | Detail contextual action | exact deadline,member,credit recipient | PENDING_EXECUTION |
| Own credit>0 | Withdraw | withdraw | Account | actual SDK provider,credit reload | PENDING_EXECUTION |

## Evidence policy and authority matrix

Official source is fixed in code:
https://www.w3.org/TR/2025/WD-web-locks-20250924/ . Raw bytes<=400000,
HTTP200,dated policy version and exact recomputedSHA256
a6ff821285ad588a5c3c53f3fc293ac35413c4fa623b9f47e52d01255da64008.
No actor URL,replacement origin or submitted digest selects policy. Official
acquisition authenticates policy publication only,not outside-world facts.

| Consequential claim/fact | Evidence/artifact | Data controller | Authoritative source/issuer | Deterministic verification | Canonical objective/entity/actor binding | Freshness/anti-replay | Semantic role after verification | Non-penalizing failure state | Consequence blocked | Required negative test |
|---|---|---|---|---|---|---|---|---|---|---|
| Namespace universe/members | Bounded canonical definition | Creator transaction | Exact authenticated creator for this protocol | EOA origin,unique ID,3distinct valid members,text bounds,definition hash,constant network/contract/version | definition includes namespace,creator,members,resource,clock,close,policy identity | immutable unique ID/version,no overwrite | Defines protocol universe only | Revert before mutation | all admission/deposit/fence changes | valid hash but wrong contract/network/version/creator/member;injected authority;unchanged ledger |
| Intended scope/mode and deposit assent | Canonical reservation | Requester transaction | Exact registered EOA | member,expected namespace digest,unique requestID,mode,text,duration,exact1GEN and recomputed definition digest | namespace,request,owner,scope,mode,time,version,contract,chain,policy | unique ID,created<=now,review cutoff,no rewrite | Compare intended scope,not alleged performance | Revert or RETRYABLE before consequence | fence,third-party credit,settlement | correct bytes/hash but wrong actor/entity/objective/policy;forged origin,replay,future time;unchanged hard state |
| Incumbent occupancy | Exact canonical HELD records | Contract transitions | Prior accepted/finalized state | provenance recheck,live exact ID set,mode,owner,scope digest,epoch | namespace,lock,owner,fence,scope,expiry | now<expiry,append-only IDs,epoch and fence never reused | Compare each incumbent scope once | RETRYABLE before mutation | new fence,old lock changes,refund | missing/extra/duplicate ID,stale epoch,wrong namespace/hash;unchanged accounting |
| Mode policy | Exact dated raw W3C response | Independent W3C origin | Fixed official HTTPS source | HTTP,size,source version,exact fetched digest,required shared/exclusive markers | fixed URL/hash included in namespace and request authority | Refetch each review;change/unavailability blocks | Interpretation context;mode enforcement is deterministic | RETRYABLE,no penalties | lock issuance/refund classification | actor-hosted hash-valid copy wrong origin cannot be selected;changed body,404,wrong version,no consequence |

Missing/contradictory/unavailable inputs never prove a conflict. Prompt scopes
are explicitly untrusted;cannot change authority,universe,IDs,payee,policy or
consequence. Locked canonical inputs are separate. Private execution logs and
external factual assertions are outside the decision. Provenance checks happen
before LLM;digest matches alone cannot establish truth.

## Consensus design and settlement invariants

Leader captures deterministic snapshot outside nondet:canonical namespace/resource,
incoming scope/mode and exact currently held peer IDs/scopes/modes. Source fetch
is inside nondet and verified before LLM. For nonempty peers,prompt asks only a
direct expected-ID map with OVERLAP/DISJOINT/UNCLEAR. No recipients,amounts,root
causes or downstream classes are accepted. Empty occupancy needs no semantic
comparison;source policy still verified. Bound max3peers,max800scope chars.

Normalization rejects malformed JSON,duplicate keys,extra/missing IDs,invalid
enums or nested shapes. Unknown output keys cannot redefine consequence.
Validator on v0.2 uses sandboxed gl.vm.run_nondet,returnsFalse unless Return,
reruns fetch/prompt independently and compares normalized stage and class map.
Rationale is contract-generated user copy;not model prose or money instructions.
Source/parser failure returns a technical retry result with no new authority.
UNDETERMINED never fabricates a canonical attempt or completed decision.

| Consequence | Required coverage/IDs/classes | Root/downstream invariant | Derived effect | Invalid output |
|---|---|---|---|---|
| HELD | COMPLETE source policy;exact current peer IDs,once each;all legal enums;no UNCLEAR;no prohibited overlap | N/A:no blame/dependency classifications exist;any such payload is outside schema and rejects | If either mode WRITE and overlap,conflict;else admit if live count<3;increment fence/epoch | RETRYABLE,no deposit/rights movement |
| CONFLICT | Same complete provenance/source/ID coverage;at least one OVERLAP with WRITE on either side | N/A:same rejection | Code returns request deposit to original payer;incumbents untouched | No refund classification from invalid schema |
| UNCLEAR | Same verified policy and complete IDs;at least one UNCLEAR;never interpreted as conflict | N/A:same rejection | No fence;own deposit returned without penalty | Technical malformed output stays RETRYABLE |

Coverage and consequence derive in code,not an LLM field. No root/class mismatch,
unsupported downstream relation or arbitrary payout can reach mutation.

## Consequence,accounting and value-destination matrix

| Value | Source/payer | Locked state | Release/refund/forfeit destination | Terminal/recovery/duplicate behavior | Canonical proof |
|---|---|---|---|---|---|
| Request deposit1GEN | Actual request sender | PENDING/RETRYABLE/HELD | Exactly payer credit;no fees/rewards/slashing | CONFLICT/UNCLEAR/CANCELLED/RELEASED/EXPIRED credit once;pending timeout/held expiry member recover;duplicates reject | request.deposit_gen,own credit,global accounting,native balance |
| Available credit | Escrow debit once | Wallet credit | Same authenticated EOA only | Withdraw full own balance once,debit before message;no expiry | get_credit,withdrawn total,parent+child receipt,exact native decrease,recipient delta |
| Fee/remainder | N/A,no protocol fee/split | N/A | No residual:all integer GEN deposits conserved | Network fees excluded from internal ledger | received=escrow+credit+withdrawn |

Hard state changes occur only when consensus accepts the transaction;UI and proof
require FINALIZED plus SUCCESS and canonical reload. Native transfer uses
@gl.evm.contract_interface EOA boundary,never gl.chain.Account. A parent success
and zero credit do not prove transfer:exact native contract decrease required.
No superseded funded revision without recovery,unless explicitly broken/abandoned.

## Reusable interface

Writes (safety table is authority):create_namespace(id,name,resource,memberB,memberC,close),
open_request(id,namespace,scope,mode,duration,expected_namespace_digest),review_request(id),
use_fence(id,fence),release(id),cancel_request(id),recover(id),withdraw().
Views:list_namespaces(),get_namespace(id),list_requests(namespace),get_request(id),
get_activity(owner),get_attempts(id),get_credit(owner),get_accounting(),
is_fence_valid(id,fence),get_policy(). Structured storage exposed as bounded JSON
projection with GEN-formatted values,not raw storage strings as the core model.
No separate callback/consumer boundary in v1;N/A authentication/idempotency there.
Registered EOA-only actions are explicit;proposed external gateways query validity
but are not claimed as deployed enforcement. Browser account/provider remains client-side.

## Threat model and test plan

| Threat | Attack | Mitigation | Test |
|---|---|---|---|
| False overlap | Incumbent/newcomer manipulates words | Independent validator replay,locked universe | differing label rejects despite valid shape |
| Artifact override | Scope tells model to pay outsider | untrusted-data isolation;no output monetary fields | injection does not change authority/payee |
| Provenance forgery | Hash-valid wrong actor/objective/version | deterministic binding before nondet | corruption matrix unchanged ledger/rights |
| Missing peers | Model omits conflict | exact ID coverage | missing/extra/duplicate/enums/root/downstream cases |
| Expiry bypass | Phase remains HELD/PENDING after time | each write checks clock | boundary-1/= /+1 with stale phase |
| Duplicate accounting | Repeat release/cancel/recover/withdraw | legal state+debit first,invariant | wrong caller/state/duplicate/accounting matrix |
| Source substitution | Same hash from actor host | no configurable source;fixed origin+digest | wrong URL/source/version failure |
| Wallet adapter | undefined sender/raw-string override | real SDK account/provider client config | intercepted realSDK zero/1GEN writes,account change/disconnect |

Direct suite covers isolation,all enums,empty/nonempty peers,READ/READ vs WRITE,
capacity,caller/state/value,digest/provenance,LLM malformed/injection,validator
replay and errors,temporal stale phases,recovery and exact accounting. Metadata
tests assert ASCII,header,one class,payable and fluent gltest integration style.
Receipt fixtures cover raw Studio and normalized SDK SUCCESS/ERROR/UNDETERMINED.
No critical skip/xfail. Direct mode is not full consensus;exact-source smoke and
real lifecycle supplement it. Required check includes lint,direct+Node+frontend
tests,TypeScript and production build. MCP config unchanged,N/A mcp:verify.

## Claim-to-code matrix

| Claim | Contract method/state | View/read | Test | Network evidence |
|---|---|---|---|---|
| Different words can overlap | review_request/nondet snapshot | get_attempts,get_request | frozen paraphrase,independent validator mismatch | PENDING:production conflict review |
| Live exclusion and shared reading | review_request/HELD/fence | is_fence_valid,list_requests | READ/READ,disjoint/conflict,stale fence | PENDING:concurrent reservations and denied stale use |
| Own refund in every terminal path | release/cancel_request/recover/review_request | get_credit,get_accounting | all value/recovery/duplicate/time cases | PENDING:release/conflict/unclear/cancel/expiry+native exits |
| Provenance before consequence | _binding/request digest,source gate | get_policy,get_namespace | valid digest wrong objective/actor/version matrix | PENDING:deployed source+schema binding |
| Real browser journey | typed adapter writes/finality/reload | all product views | actualSDK+UI controls and lifecycle | PENDING:browser-wallet transactions |

## Analogue and differentiation matrix

| Analogue/prior idea | Similar dimensions | Structural difference | Collision decision |
|---|---|---|---|
| ConcordBatch031 | intents,conflict,reuse | incremental occupied set and fences,no winner pair/order/reward |3/7,admitted |
| SemanticNonce032 | intended operations,gateway | only current occupancy,no history novelty budget/exhaustion |2/7 |
| SkillSlot012 | requests,gateway | no supply-demand graph,price,match or delivery escrow |2/7 |
| ParityOption036 | scope,reservation | no incumbent purchase option/provider/outsider allocation |2/7 |
| GrantLattice018 | scope,query | peer exclusion,not parent attenuation/revocation tree |2/7 |
| CohortRate044 | semantic relations | no equivalence-class price/refund mechanism |1/7 |
| Web Locks API | lock modes | exact-name browser storage scope vs independently judged semantic protocol scope | existing locking acknowledged |

## Adoption path and milestone headroom

Proposed (not adopters):LangGraph shared-workspace executor uses is_fence_valid;
MCP invoice-write gateway uses request/review/release and fence query;A2A lease
broker uses canonical occupancy and own refunds. Next substantial milestone:
authenticated consumer integration enforcing current generation at actual write
boundary,with effect receipt and TOCTOU/fencing proof;then bounded multi-resource
sets. This changes enforcement capability rather than renaming/restyling v1.

## Deployment and evidence plan

Selected D1 Studionet61999;outage/control evidence retained separately from
StudioDev. Matched runner/API/SDK1.1.8 pinned;repo Python3.12venv and
GENVM_VERSION=v0.2.16;no runtime hash mixing. Exact-source lint/direct/metadata/
receipt tests ->0GENsmoke ->authorized1GENrequests. Three existing authorized
EOAs;check balances safely before funding,never faucet or new wallet by default.
Resumable signed-hash journal before broadcast;inspect first;no replay on timeout.
Deployment identity binds source commit/hash,Depends,network,address,tx and schema.
Evidence path docs/evidence/studionet,with only safe allowlisted projections.
Five flow families:positive/disjoint/shared;conflict;unclear;cancel;time recovery.
Use/release/reacquire and old-fence denial. Every exit exact native decrease and
recipient proof. Real frontend controls/signing/finality/reload mandatory.

## Definition of Done

Complete only after one recognized ASCII contract,linter,all adversarial tests,
actualSDK frontend regression,build,exact-source smoke,consequential full network
lifecycle,each native exit proof,complete browser-wallet lifecycle,public repo
hygiene,CI if configured,production Vercel HTTP200/body check,accurate README,
unchanged objective grader -Project child -Category projects with0BLOCKER,
copy-ready packet,truthful submission status,registry/postmortem update and final
entire-master reread audit. All are pending until verified;no blanket DONE here.

## Honest limitations and kill criteria

v1 bounds three members/three live locks/32requests per namespace/two review
attempts;transaction latency makes it a coarse coordination primitive,not a
low-latency database mutex. External execution enforcement,ownership,adoption,
legal force,globally fair scheduling,other networks are unproven/out of scope.
Stop/redesign for replaceable consensus,no meaningful fence boundary,unverified
provenance,unbounded evidence,actor-defined payout,4/7collision or absent canonical
workflow. Never use a nice UI or a grader warning suppression to hide a core gap.
