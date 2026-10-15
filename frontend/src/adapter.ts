import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionHashVariant} from 'genlayer-js/types';
import {isAddress,parseUnits} from 'viem';
import type {ContractAdapter,Command,Progress} from './domain';
import {ensureChain,type Provider} from './wallet';

export interface Session {account?:string;provider?:Provider;}
export interface Config {address?:string;endpoint?:string;}
function validAddress(value:string|undefined,name:string):asserts value is `0x${string}` {
 if(!value||!isAddress(value)||/^0x0{40}$/i.test(value))throw new Error(`${name} is missing or invalid. No transaction was sent.`);
}
function config(input?:Config){return {address:input?.address??import.meta.env.VITE_CONTRACT_ADDRESS,endpoint:input?.endpoint??new URL('/genlayer-rpc',window.location.origin).href};}
async function safe<T>(fn:()=>Promise<T>):Promise<T>{const previous=console.error;console.error=()=>{};try{return await fn();}finally{console.error=previous;}}
export async function submitWrite(session:Session,configuration:Config,command:Command,args:(string|number)[],valueGEN:'0'|'1'){
 validAddress(session.account,'Connected wallet address');validAddress(configuration.address,'Contract address');
 validAddress(studionet.consensusMainContract?.address,'Network system address');
 if(!session.provider)throw new Error('Reconnect your selected wallet before signing.');
 if((command==='open_request')!==(valueGEN==='1'))throw new Error('This method requires its exact GEN value.');
 await ensureChain(session.provider);
 const client=createClient({chain:studionet,endpoint:configuration.endpoint,account:session.account,provider:session.provider});
 return safe(()=>client.writeContract({address:configuration.address as `0x${string}`,functionName:command,args,value:parseUnits(valueGEN,18)}));
}
export function createAdapter(session:Session={},input?:Config):ContractAdapter {
 const settings=config(input);
 const reader=createClient({chain:studionet,endpoint:settings.endpoint});
 async function read<T>(functionName:string,args:string[]=[]):Promise<T>{
  const chain=await safe(()=>reader.getChainId());
  if(chain!==61999)throw new Error('The read connection is on the wrong network. No data is shown.');
  if(!settings.address)throw new Error('Studionet RPC verified. The contract address is not configured yet; no live workspace or deposit is shown.');
  validAddress(settings.address,'Contract address');
  const result=await safe(()=>reader.readContract({address:settings.address as `0x${string}`,functionName,args,transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));
  return (typeof result==='string'?JSON.parse(result):result) as T;
 }
 async function write(command:Command,args:(string|number)[],valueGEN:'0'|'1',progress:Progress){
  let hash:`0x${string}`|undefined;
  try{
   progress('Awaiting signature');const submitted=await submitWrite(session,settings,command,args,valueGEN);hash=submitted;progress('Submitted',hash);
   for(let poll=0;poll<90;poll++){
    const raw=await safe(()=>reader.request({method:'eth_getTransactionByHash',params:[submitted]})) as Record<string,unknown>|null;
    const status=String(raw?.status??'PENDING');
    if(status==='ACCEPTED'||status==='DECIDED')progress('Accepted',hash);
    if(status==='UNDETERMINED'){progress('Review undecided',hash);throw new Error('Consensus is undecided. Reload this request before retrying; no completed reservation is claimed.');}
    if(status==='FINALIZED'||status==='7'){
     const data=raw?.consensus_data as {leader_receipt?:{execution_result?:string}[]|{execution_result?:string}}|undefined;
     const leader=Array.isArray(data?.leader_receipt)?data.leader_receipt[0]:data?.leader_receipt;
     const execution=raw?.execution_result??raw?.txExecutionResultName??leader?.execution_result;
     if(execution!=='SUCCESS')throw new Error('The finalized transaction did not execute successfully. Refresh canonical state before retrying.');
     progress('Finalized',hash);return {hash,status:'FINALIZED'};
    }
    if(['FAILED','CANCELED','CANCELLED','REJECTED'].includes(status))throw new Error('The transaction did not complete. Reload its current state before retrying.');
    await new Promise(resolve=>setTimeout(resolve,3000));
   }
   throw new Error('Confirmation is still pending. Inspect the saved transaction link before sending another action.');
  }catch(error){progress('Failed',hash);if(error instanceof Error&&/No transaction|GEN value|Reconnect|Consensus|finalized transaction|still pending|did not complete/.test(error.message))throw error;throw new Error('The wallet or network could not complete this action. Check the transaction link, then refresh before retrying.');}
 }
 return {configured:!!settings.address,workspaces:()=>read('list_namespaces'),workspace:id=>read('get_namespace',[id]),requests:id=>read('list_requests',[id]),request:id=>read('get_request',[id]),activity:owner=>read('get_activity',[owner]),credit:owner=>read('get_credit',[owner]),attempts:id=>read('get_attempts',[id]),write};
}
