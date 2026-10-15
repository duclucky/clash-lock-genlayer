import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionHashVariant} from 'genlayer-js/types';
import {parseUnits,formatUnits} from 'viem';
const journal=JSON.parse(fs.readFileSync(new URL('../docs/evidence/studionet/journal.json',import.meta.url),'utf8'));
const code=fs.readFileSync(new URL('../contracts/clash_lock.py',import.meta.url));
assert.equal(journal.sourceSHA256,createHash('sha256').update(code).digest('hex'));
const operations=Object.values(journal.operations);
assert(operations.every(op=>op.verified&&op.status==='FINALIZED'));
for(const op of operations){assert.equal(op.executionResult,op.expect);assert(['AGREE','MAJORITY_AGREE'].includes(op.consensusResult));}
const withdrawals=operations.filter(op=>op.method==='withdraw');
for(const op of withdrawals){
 assert.equal(op.nativeChildren.length,1);
 const amount=parseUnits(op.before.credits[op.actor].available_gen,18);
 assert.equal(parseUnits(op.before.balancesGEN[3],18)-parseUnits(op.after.balancesGEN[3],18),amount);
 assert.equal(parseUnits(op.after.balancesGEN[op.actor],18)-parseUnits(op.before.balancesGEN[op.actor],18),amount);
 assert.equal(op.nativeChildren[0].parentHash,op.transactionHash);
}
const original=globalThis.fetch;globalThis.fetch=(input,init={})=>original(input,{...init,signal:init.signal??AbortSignal.timeout(25000)});
const client=createClient({chain:studionet});
const previous=console.error;console.error=()=>{};
try{
 assert.equal(await client.getChainId(),61999);
 const read=async(functionName,args=[])=>{const raw=await client.readContract({address:journal.address,functionName,args,transactionHashVariant:TransactionHashVariant.LATEST_FINAL});return typeof raw==='string'?JSON.parse(raw):raw;};
 const accounting=await read('get_accounting');
 assert.equal(accounting.escrow_gen,'0');assert.equal(accounting.credit_gen,'0');assert.equal(accounting.received_gen,accounting.withdrawn_gen);
 const nativeGEN=formatUnits(BigInt(await client.request({method:'eth_getBalance',params:[journal.address,'latest']})),18);assert.equal(nativeGEN,'0');
 const requests=await read('list_requests',['billing-v1']);assert(requests.every(r=>['RELEASED','CONFLICT','UNCLEAR','CANCELLED','EXPIRED'].includes(r.status)&&r.deposit_gen==='0'));
 for(const r of requests.filter(r=>r.fence>0))assert.equal(await read('is_fence_valid',[r.id,r.fence]),false);
 const mismatches=operations.filter(op=>op.expectation?.passed===false).map(op=>({operation:op.id,...op.expectation}));
 console.error=previous;
 console.log(JSON.stringify({network:'studionet',chainId:61999,address:journal.address,verifiedTransactions:operations.length,nativeWithdrawals:withdrawals.length,accounting,nativeBalanceGEN:nativeGEN,allDepositsRecovered:true,observedExpectationMismatches:mismatches,requests:requests.map(({id,status,fence,used})=>({id,status,fence,used}))},null,2));
}catch(error){console.error=previous;console.log(JSON.stringify({verified:false,type:error?.name,reason:'Evidence or canonical-state assertion failed; inspect public journal.'}));process.exitCode=1;}
