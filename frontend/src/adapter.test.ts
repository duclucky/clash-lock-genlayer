import {afterEach,describe,it,expect,vi} from 'vitest';
import {decodeFunctionData} from 'viem';
import {studionet} from 'genlayer-js/chains';
import {submitWrite,createAdapter} from './adapter';
const sender='0x1111111111111111111111111111111111111111',destination='0x2222222222222222222222222222222222222222',hash=`0x${'33'.repeat(32)}`;
const endpoint='https://offline.invalid/rpc';
afterEach(()=>vi.unstubAllGlobals());
function harness(){const sends:{method:string;params?:unknown[]}[]=[],rpc:string[]=[];
 vi.stubGlobal('fetch',vi.fn(async(_url,options)=>{const x=JSON.parse(options.body);rpc.push(x.method);const result=({eth_getTransactionCount:'0x0',eth_estimateGas:'0x30d40',eth_gasPrice:'0x0',eth_chainId:'0xf22f'} as Record<string,string>)[x.method];if(result===undefined)throw new Error('Unexpected offline RPC');return new Response(JSON.stringify({jsonrpc:'2.0',id:x.id,result}),{headers:{'content-type':'application/json'}});}));
 const provider={request:async(x:{method:string;params?:unknown[]})=>{sends.push(x);if(x.method==='eth_chainId')return'0xf22f';if(x.method==='eth_sendTransaction')return hash;throw new Error('Unexpected wallet method');}};
 return {sends,rpc,provider};}
describe('actual adapter through pinned real SDK (offline I/O only)',()=>{
 it.each([['review_request','0'],['open_request','1']] as const)('encodes %s with exact %s GEN',async(command,value)=>{const h=harness();const result=await submitWrite({account:sender,provider:h.provider},{address:destination,endpoint},command,['fixture'],value);expect(result).toBe(hash);const tx=h.sends.find(x=>x.method==='eth_sendTransaction')?.params?.[0] as {from:string;to:string;value:string;data:`0x${string}`};expect(tx.from.toLowerCase()).toBe(sender);expect(tx.to.toLowerCase()).toBe(studionet.consensusMainContract!.address.toLowerCase());expect(BigInt(tx.value)).toBe(value==='1'?10n**18n:0n);const decoded=decodeFunctionData({abi:studionet.consensusMainContract!.abi,data:tx.data});expect(decoded.functionName).toBe('addTransaction');expect((decoded.args![0] as string).toLowerCase()).toBe(sender);expect((decoded.args![1] as string).toLowerCase()).toBe(destination);});
 it.each([undefined,'undefined','0x0','0x'+'0'.repeat(40)])('invalid destination %s stops before wallet or RPC',async(address)=>{const h=harness();await expect(submitWrite({account:sender,provider:h.provider},{address,endpoint},'review_request',[],'0')).rejects.toThrow('Contract address');expect(h.rpc).toEqual([]);expect(h.sends).toEqual([]);});
 it('disconnect cannot sign with stale provider',async()=>{const h=harness();await expect(submitWrite({provider:h.provider},{address:destination,endpoint},'review_request',[],'0')).rejects.toThrow('Connected wallet');expect(h.sends).toEqual([]);});
 it('account switch binds new sender through real SDK',async()=>{const h=harness();await submitWrite({account:destination,provider:h.provider},{address:sender,endpoint},'review_request',[],'0');const tx=h.sends.find(x=>x.method==='eth_sendTransaction')?.params?.[0] as {from:string};expect(tx.from.toLowerCase()).toBe(destination);});
 it('named payable method cannot become a dust transfer',async()=>{const h=harness();await expect(submitWrite({account:sender,provider:h.provider},{address:destination,endpoint},'open_request',[],'0')).rejects.toThrow('exact GEN value');expect(h.sends).toEqual([]);});
 it('missing address performs chain check then fails honestly',async()=>{const h=harness();await expect(createAdapter({}, {endpoint,address:''}).workspaces()).rejects.toThrow('Studionet RPC verified');expect(h.rpc).toContain('eth_chainId');expect(h.sends).toEqual([]);});
});
