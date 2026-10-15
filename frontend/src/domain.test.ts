import {describe,it,expect} from 'vitest';
import {actions,effectiveStatus,type Reservation,type Workspace} from './domain';
const owner='0x'+'11'.repeat(20),peer='0x'+'22'.repeat(20),outsider='0x'+'33'.repeat(20);
const w:Workspace={id:'w',name:'Name',resource:'All invoice rows',creator:owner,members:[owner,peer],closes_at:1000,epoch:1};
const r:Reservation={id:'r',namespace_id:'w',owner,scope:'French invoice rows',mode:'WRITE',status:'PENDING',review_deadline:500,expires_at:600,fence:1,used:false,reason:'',attempts:0,deposit_gen:'1'};
describe('contextual lifecycle actions',()=>{
 it('pending owner may review and cancel',()=>expect(actions(r,owner,w,400)).toEqual(['review_request','cancel_request']));
 it('registered rival cannot end another pending request',()=>expect(actions(r,peer,w,400)).toEqual([]));
 it('outsider and disconnected wallets cannot write',()=>{expect(actions(r,outsider,w,400)).toEqual([]);expect(actions(r,undefined,w,400)).toEqual([]);});
 it('exact review deadline removes review and enables recovery',()=>expect(actions(r,owner,w,500)).toEqual(['cancel_request','recover']));
 it('registered keeper can only recover due payer deposit',()=>expect(actions(r,peer,w,500)).toEqual(['recover']));
 it('held owner can use and release before expiry',()=>expect(actions({...r,status:'HELD'},owner,w,599)).toEqual(['use_fence','release']));
 it('equality at expiry disables use/release',()=>{expect(actions({...r,status:'HELD'},owner,w,600)).toEqual(['recover']);expect(effectiveStatus({...r,status:'HELD'},600)).toBe('EXPIRED');});
 it('used fence cannot be used again',()=>expect(actions({...r,status:'HELD',used:true},owner,w,599)).toEqual(['release']));
 it.each(['CONFLICT','UNCLEAR','CANCELLED','EXPIRED','RELEASED'] as const)('terminal %s cannot trigger duplicate recovery',status=>expect(actions({...r,status},owner,w,700)).toEqual([]));
 it('bounded retry stops at two attempts',()=>expect(actions({...r,status:'RETRYABLE',attempts:2},owner,w,400)).toEqual(['cancel_request']));
});
