// Authorized Studionet only. Never print SDK errors or full receipts.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {createClient,createAccount} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionHashVariant} from 'genlayer-js/types';
import {keccak256,formatUnits,parseUnits} from 'viem';
import {receipt,requireSuccess,childProof} from './receipts.mjs';

const directory=new URL('../docs/evidence/studionet/',import.meta.url);
fs.mkdirSync(directory,{recursive:true});
const file=new URL('journal.json',directory);
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const code=fs.readFileSync(new URL('../contracts/clash_lock.py',import.meta.url));
const env=fs.readFileSync(new URL('../.env',import.meta.url),'utf8');
const names=['STUDIONET_PRIVATE_KEY','STUDIONET_INTEGRATOR_PRIVATE_KEY','STUDIONET_STEWARD_PRIVATE_KEY'];
const accounts=names.map(name=>{const value=env.match(new RegExp('^\\s*'+name+'\\s*=\\s*([^\\r\\n]+)$','m'))?.[1]?.trim().replace(/^['"]|['"]$/g,'');if(!/^(0x)?[0-9a-f]{64}$/i.test(value??''))throw Error('Authorized signer unavailable');return createAccount(value.startsWith('0x')?value:'0x'+value);});
const reader=createClient({chain:studionet});
const originalFetch=globalThis.fetch;
globalThis.fetch=(input,init={})=>originalFetch(input,{...init,signal:init.signal??AbortSignal.timeout(25000)});
async function safe(fn){const e=console.error,w=console.warn;console.error=console.warn=()=>{};try{return await fn();}finally{console.error=e;console.warn=w;}}
const journal=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{network:'studionet',chainId:61999,rpc:'https://studio.genlayer.com/api',explorer:'https://explorer-studio.genlayer.com',sourceSHA256:sha(code),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),depends:code.toString().split('\n').slice(0,2).join('\n').trim(),actors:accounts.map(a=>a.address),operations:{}};
const save=()=>{fs.writeFileSync(new URL('journal.tmp',directory),JSON.stringify(journal,null,2)+'\n');fs.renameSync(new URL('journal.tmp',directory),file);};
const rpc=(method,params)=>safe(()=>reader.request({method,params}));
const balance=async address=>formatUnits(BigInt(await rpc('eth_getBalance',[address,'latest'])),18);
async function read(method,args=[]){if(!journal.address)throw Error('Not deployed');const value=await safe(()=>reader.readContract({address:journal.address,functionName:method,args,transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));return typeof value==='string'?JSON.parse(value):value;}
async function snapshot(){const workspaces=journal.address?await read('list_namespaces'):[];return {at:new Date().toISOString(),balancesGEN:await Promise.all([...journal.actors,...(journal.address?[journal.address]:[])].map(balance)),accounting:journal.address?await read('get_accounting'):null,workspaces,requests:journal.address?(await Promise.all(workspaces.map(n=>read('list_requests',[n.id])))).flat():[],credits:journal.address?await Promise.all(journal.actors.map(a=>read('get_credit',[a]))):[]};}
async function observe(op){
 const raw=await rpc('eth_getTransactionByHash',[op.transactionHash]);
 const projected=receipt(raw,op.transactionHash);op.observations??=[];
 const changed=op.observations.at(-1)?.status!==projected.status;
 if(changed)op.observations.push({...projected,at:new Date().toISOString()});
 Object.assign(op,projected);save();
 if(changed)console.log(JSON.stringify({operation:op.id,...projected}));
 if(projected.status!=='FINALIZED')return false;
 if(op.expect==='ERROR'){if(projected.executionResult!=='ERROR')throw Error('Expected rejection was not proven');}
 else requireSuccess(raw,op.transactionHash);
 if(op.method==='DEPLOY'){
  journal.address=projected.contractAddress;
  journal.deployedSourceMatches=sha(await safe(()=>reader.getContractCode(journal.address)))===journal.sourceSHA256;
  if(!journal.deployedSourceMatches)throw Error('Deployed source mismatch');
  journal.schema=await safe(()=>reader.getContractSchema(journal.address));
 }
 op.after=await snapshot();
 if(op.valueGEN==='1' && parseUnits(op.after.balancesGEN[3],18)-parseUnits(op.before.balancesGEN[3],18)!==10n**18n)throw Error('Exact deposit balance increase missing');
 if(op.method==='withdraw'){
  const hashes=raw?.triggered_transactions??raw?.triggeredTransactions??raw?.children??[];
  op.nativeChildren=[];
  for(const item of hashes){const hash=typeof item==='string'?item:item?.hash??item?.transaction_hash??item?.transactionHash;if(!/^0x[0-9a-f]{64}$/i.test(hash??''))continue;const child=await rpc('eth_getTransactionByHash',[hash]);op.nativeChildren.push(childProof(child,hash,{sender:journal.address,recipient:op.sender,valueGEN:op.before.credits[op.actor].available_gen,parentHash:op.transactionHash}));}
  if(!op.nativeChildren.length)throw Error('Native withdrawal child pending');
  const amount=parseUnits(op.before.credits[op.actor].available_gen,18);
  if(parseUnits(op.before.balancesGEN[3],18)-parseUnits(op.after.balancesGEN[3],18)!==amount || parseUnits(op.after.balancesGEN[op.actor],18)-parseUnits(op.before.balancesGEN[op.actor],18)!==amount)throw Error('Exact native withdrawal balance deltas missing');
 }
 if(op.method!=='DEPLOY'&&op.args[0]&&['open_request','review_request','use_fence','release','cancel_request','recover'].includes(op.method))op.canonicalRequest=await read('get_request',[op.args[0]]);
 const expectedStatus={'review-holder':'HELD','review-opponent':'CONFLICT','review-disjoint':'HELD','review-unclear':'UNCLEAR','review-unspecified':'UNCLEAR','release-holder':'RELEASED','release-disjoint':'RELEASED','cancel-request':'CANCELLED','review-shared-a':'HELD','review-shared-b':'HELD','review-expiry':'HELD','recover-expiry':'EXPIRED','review-reacquire':'HELD'}[op.id];
 if(expectedStatus&&op.canonicalRequest?.status!==expectedStatus){op.expectation={expected:expectedStatus,actual:op.canonicalRequest?.status,passed:false};save();if(op.id!=='review-unclear'||op.canonicalRequest?.status!=='CONFLICT')throw Error('Expected canonical consequence missing');op.expectation.note='Important queue was judged potentially overlapping. This observed mismatch is retained and does not prove UNCLEAR.';}
 if(op.expect==='ERROR'&&(JSON.stringify(op.before.accounting)!==JSON.stringify(op.after.accounting)||JSON.stringify(op.before.requests)!==JSON.stringify(op.after.requests)))throw Error('Rejected write mutated canonical ledger or requests');
 op.verified=true;save();console.log(JSON.stringify({operation:op.id,verified:true,canonicalStatus:op.canonicalRequest?.status??null,accounting:op.after.accounting,nativeChildren:op.nativeChildren?.length??0}));return true;
}
async function transact(id,actor,method,args=[],valueGEN='0',expect='SUCCESS'){
 const identity=sha(JSON.stringify({actor,method,args,valueGEN,expect}));
 let op=journal.operations[id];
 if(op&&op.identity!==identity)throw Error('Operation identity changed');
 if(!op){op={id,identity,actor,sender:accounts[actor].address,method,args,valueGEN,expect,network:'studionet',chainId:61999,createdAt:new Date().toISOString(),before:await snapshot()};journal.operations[id]=op;save();}
 if(op.verified){console.log(JSON.stringify({operation:id,alreadyVerified:true,hash:op.transactionHash}));return true;}
 if(!op.transactionHash){
  const account=accounts[actor];
  const signer=createClient({chain:studionet,account:{...account,signTransaction:async(...input)=>{if(BigInt(input[0].value??0)!==parseUnits(valueGEN,18))throw Error('Exact GEN mismatch');const signed=await account.signTransaction(...input);op.transactionHash=keccak256(signed);op.explorerURL=journal.explorer+'/transactions/'+op.transactionHash;op.signedAt=new Date().toISOString();save();return signed;}}});
  if(method==='DEPLOY')await safe(()=>signer.deployContract({code:new Uint8Array(code),args:[],leaderOnly:false}));
  else await safe(()=>signer.writeContract({address:journal.address,functionName:method,args,value:parseUnits(valueGEN,18)}));
  console.log(JSON.stringify({operation:id,stage:'SUBMITTED',hash:op.transactionHash,valueGEN}));
 }
 for(let index=0;index<20;index++){if(await observe(op))return true;if(index<19)await new Promise(r=>setTimeout(r,4000));}
 return false;
}
try{
 if(Number(BigInt(await rpc('eth_chainId',[])))!==61999||journal.sourceSHA256!==sha(code)||journal.actors.join()!==accounts.map(a=>a.address).join())throw Error('Deployment identity mismatch');
 const [command,...args]=process.argv.slice(2);
 if(command==='inspect'){console.log(JSON.stringify({network:journal.network,chainId:61999,sourceSHA256:journal.sourceSHA256,sourceCommit:journal.sourceCommit,address:journal.address??null,actors:journal.actors,snapshot:await snapshot(),operations:Object.values(journal.operations).map(({id,status,executionResult,verified,transactionHash})=>({id,status,executionResult,verified:!!verified,transactionHash}))},null,2));}
 else if(command==='deploy'){if(!await transact('deploy',0,'DEPLOY'))process.exitCode=2;}
 else if(command==='write'){const [id,actor,method,json='[]',value='0',expect='SUCCESS']=args;if(!['0','1','2'].includes(value))throw Error('Whole small GEN required');if(!await transact(id,Number(actor),method,JSON.parse(json),value,expect))process.exitCode=2;}
 else if(command==='step'||command==='run'){
  for(const id of command==='run'?args:[args[0]]){
  journal.plan??={closesAt:Math.floor(Date.now()/1000)+28800,workspace:'billing-v1'};save();
  const n=journal.plan.workspace;
  const digest=journal.address && id!=='create'?(await read('get_namespace',[n])).digest:null;
  const steps={
   create:[0,'create_namespace',[n,'Billing coordination','All invoice rows in a protocol workspace. Each row has billing country (France, Germany, or Spain), currency, and an account identifier.',journal.actors[1],journal.actors[2],journal.plan.closesAt]],
   holder:[0,'open_request',['france-holder',n,'Invoice rows whose billing country is France only.','WRITE',1800,digest],'1'],
   'review-holder':[0,'review_request',['france-holder']],
   opponent:[1,'open_request',['france-opponent',n,'All invoices billed to customers in France, and no other countries.','WRITE',600,digest],'1'],
   'review-opponent':[1,'review_request',['france-opponent']],
   'withdraw-opponent':[1,'withdraw',[]],
   use:[0,'use_fence',['france-holder',1]],
   disjoint:[2,'open_request',['germany-holder',n,'Invoice rows whose billing country is Germany only.','WRITE',600,digest],'1'],
   'review-disjoint':[2,'review_request',['germany-holder']],
   'release-disjoint':[2,'release',['germany-holder']],
   'withdraw-disjoint':[2,'withdraw',[]],
   unclear:[1,'open_request',['unclear-request',n,'Invoice rows in the important queue.','WRITE',600,digest],'1'],
   'review-unclear':[1,'review_request',['unclear-request']],
   'withdraw-unclear':[1,'withdraw',[]],
   unspecified:[1,'open_request',['unspecified-request',n,'The relevant invoice rows, with their selection criteria unspecified.','WRITE',600,digest],'1'],
   'review-unspecified':[1,'review_request',['unspecified-request']],
   'withdraw-unspecified':[1,'withdraw',[]],
   cancel:[1,'open_request',['cancel-request',n,'Invoice rows whose billing country is Spain only.','WRITE',600,digest],'1'],
   'cancel-request':[1,'cancel_request',['cancel-request']],
   'withdraw-cancel':[1,'withdraw',[]],
   'release-holder':[0,'release',['france-holder']],
   'withdraw-holder':[0,'withdraw',[]],
   'shared-a':[0,'open_request',['shared-a',n,'Invoice rows whose billing country is Spain only.','READ',600,digest],'1'],
   'review-shared-a':[0,'review_request',['shared-a']],
   'shared-b':[1,'open_request',['shared-b',n,'Invoices billed in Spain, excluding every other country.','READ',600,digest],'1'],
   'review-shared-b':[1,'review_request',['shared-b']],
   'release-shared-a':[0,'release',['shared-a']],
   'withdraw-shared-a':[0,'withdraw',[]],
   'release-shared-b':[1,'release',['shared-b']],
   'withdraw-shared-b':[1,'withdraw',[]],
   expiry:[0,'open_request',['expiry-holder',n,'Invoice rows whose billing country is France only.','WRITE',120,digest],'1'],
   'review-expiry':[0,'review_request',['expiry-holder']],
   'expired-use':[0,'use_fence',['expiry-holder',journal.operations['review-expiry']?.canonicalRequest?.fence??0],'0','ERROR'],
   'recover-expiry':[2,'recover',['expiry-holder']],
   'withdraw-expiry':[0,'withdraw',[]],
   reacquire:[0,'open_request',['reacquired-holder',n,'Invoice rows whose billing country is France only.','WRITE',600,digest],'1'],
   'review-reacquire':[0,'review_request',['reacquired-holder']],
   'stale-use':[0,'use_fence',['reacquired-holder',journal.operations['review-expiry']?.canonicalRequest?.fence??0],'0','ERROR'],
   'release-reacquire':[0,'release',['reacquired-holder']],
   'withdraw-reacquire':[0,'withdraw',[]],
   'browser-cancel-fixture':[0,'open_request',['browser-cancel-fixture',n,'Invoice rows whose billing country is Germany only.','WRITE',600,digest],'1'],
  };
  if(!steps[id])throw Error('Unknown planned step');
  if(id==='expired-use'){const r=await read('get_request',['expiry-holder']);if(r.status!=='HELD')throw Error('Expected unrecovered stale HELD phase');while(Date.now()/1000<r.expires_at+2)await new Promise(resolve=>setTimeout(resolve,Math.min(4000,(r.expires_at+2-Date.now()/1000)*1000)));}
  if(!await transact(id,...steps[id])){process.exitCode=2;break;}
  }
 }
 else if(command==='read')console.log(JSON.stringify(await read(args[0],args[1]?.startsWith('[')?JSON.parse(args[1]):args.slice(1)),null,2));
 else if(command==='poll'){const op=journal.operations[args[0]];if(!op?.transactionHash)throw Error('Saved transaction missing');if(!await observe(op))process.exitCode=2;}
 else throw Error('Use inspect, deploy, write <id> <actor> <method> <json> <GEN>, read, poll');
}catch(error){const known=new Set(['Deployment identity mismatch','Deployed source mismatch','Exact deposit balance increase missing','Native withdrawal child pending','Exact native withdrawal balance deltas missing','Expected canonical consequence missing','Rejected write mutated canonical ledger or requests','Expected rejection was not proven','Operation identity changed','Exact GEN mismatch','Unknown planned step','Expected unrecovered stale HELD phase','Whole small GEN required','Saved transaction missing']);console.log(JSON.stringify({stage:'STOP',type:['Error','TypeError','TimeoutError','AbortError'].includes(error?.name)?error.name:'NetworkError',code:Number.isInteger(error?.code)?error.code:null,reason:known.has(error?.message)?error.message:'Safely inspect saved hashes before retrying'}));process.exitCode=1;}
