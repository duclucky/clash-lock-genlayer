// Read-only receipt/canonical-state capture for transactions signed in the UI.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionHashVariant} from 'genlayer-js/types';
import {formatUnits,parseUnits} from 'viem';
import {receipt,requireSuccess,childProof} from './receipts.mjs';
const directory=new URL('../docs/evidence/studionet/',import.meta.url),file=new URL('browser-journal.json',directory);
const network=JSON.parse(fs.readFileSync(new URL('journal.json',directory),'utf8'));
const record=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{network:'studionet',chainId:61999,address:network.address,actors:network.actors,operations:{}};
const save=()=>fs.writeFileSync(file,JSON.stringify(record,null,2)+'\n');
const original=globalThis.fetch;globalThis.fetch=(input,init={})=>original(input,{...init,signal:init.signal??AbortSignal.timeout(25000)});
const client=createClient({chain:studionet});
async function safe(fn){const e=console.error,w=console.warn;console.error=console.warn=()=>{};try{return await fn();}finally{console.error=e;console.warn=w;}}
const rpc=(method,params)=>safe(()=>client.request({method,params}));
async function read(functionName,args=[]){const raw=await safe(()=>client.readContract({address:record.address,functionName,args,transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));return typeof raw==='string'?JSON.parse(raw):raw;}
async function snapshot(){const workspaces=await read('list_namespaces');return {at:new Date().toISOString(),workspaces,requests:(await Promise.all(workspaces.map(w=>read('list_requests',[w.id])))).flat(),accounting:await read('get_accounting'),credits:await Promise.all(record.actors.map(a=>read('get_credit',[a]))),balancesGEN:await Promise.all([...record.actors,record.address].map(async a=>formatUnits(BigInt(await rpc('eth_getBalance',[a,'latest'])),18)))};}
try{
 assert.equal(await safe(()=>client.getChainId()),61999);
 const [command,id,hash,valueGEN='0']=process.argv.slice(2);
 if(command==='before'){assert(!record.operations[id],'Existing step must not be overwritten');record.operations[id]={id,browserSigned:true,before:await snapshot()};save();console.log(JSON.stringify({step:id,beforeCaptured:true}));}
 else if(command==='record'){
  assert(/^0x[0-9a-f]{64}$/i.test(hash));
  const op=record.operations[id]??{id,browserSigned:true,before:null};record.operations[id]=op;
  assert(!op.transactionHash||op.transactionHash===hash,'Existing hash cannot change');op.transactionHash=hash;
  const raw=await rpc('eth_getTransactionByHash',[hash]);const projected=receipt(raw,hash);Object.assign(op,projected);op.observedAt=new Date().toISOString();save();
  assert.equal(projected.contractAddress.toLowerCase(),record.address.toLowerCase());
  assert.equal(raw.from_address.toLowerCase(),record.actors[0].toLowerCase());
  assert.equal(BigInt(raw.value??0),parseUnits(valueGEN,18));op.valueGEN=valueGEN;
  if(op.status!=='FINALIZED'){console.log(JSON.stringify({step:id,...projected}));process.exitCode=2;}
  else{
   requireSuccess(raw,hash);op.after=await snapshot();
   if(valueGEN==='1'){assert(op.before,'A real before snapshot is required for deposit proof');assert.equal(parseUnits(op.after.balancesGEN[3],18)-parseUnits(op.before.balancesGEN[3],18),10n**18n);}
   const hashes=raw.triggered_transactions??raw.triggeredTransactions??raw.children??[];
   if(hashes.length){assert(op.before);const amount=op.before.credits[0].available_gen;op.nativeChildren=[];
    for(const item of hashes){const childHash=typeof item==='string'?item:item.hash??item.transaction_hash??item.transactionHash;const child=await rpc('eth_getTransactionByHash',[childHash]);op.nativeChildren.push(childProof(child,childHash,{sender:record.address,recipient:record.actors[0],valueGEN:amount,parentHash:hash}));}
    assert.equal(parseUnits(op.before.balancesGEN[3],18)-parseUnits(op.after.balancesGEN[3],18),parseUnits(amount,18));assert.equal(parseUnits(op.after.balancesGEN[0],18)-parseUnits(op.before.balancesGEN[0],18),parseUnits(amount,18));
   }
   op.verified=true;save();console.log(JSON.stringify({step:id,verified:true,...projected,accounting:op.after.accounting,nativeChildren:op.nativeChildren?.length??0}));
  }
 }else if(command==='inspect')console.log(JSON.stringify(await snapshot(),null,2));
 else throw Error('Use before <id>, record <id> <hash> <GEN>, or inspect');
}catch(error){console.log(JSON.stringify({verified:false,type:error?.name,code:Number.isInteger(error?.code)?error.code:null,reason:'Read-only proof capture failed; inspect saved public state.'}));process.exitCode=1;}
