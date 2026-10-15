import ast
import hashlib
import json
import sys
from pathlib import Path
import pytest
from test_recovery import NOW, GEN, addr, clock, setup, snap

BODY = b'W3C Web Locks Working Draft shared exclusive ' * 400

@pytest.fixture
def prepared(contract,direct_vm,direct_accounts,monkeypatch):
    mod=sys.modules[contract.__module__]
    monkeypatch.setattr(mod,'POLICY_HASH',hashlib.sha256(BODY).hexdigest())
    direct_vm.mock_web(r'.*w3.org/TR/2025/WD-web-locks-20250924/.*',{'response':{'status':200,'headers':{},'body':BODY},'method':'GET'})
    rid=setup(contract,direct_vm,direct_accounts)
    return contract,direct_vm,direct_accounts,mod,rid

def actor(vm,accounts,index):
    vm.sender=accounts[index];vm.origin=accounts[index]

def request(c,vm,accounts,index=1,rid='request2',scope='Invoice rows billed in Germany only.',mode='WRITE',duration=120):
    actor(vm,accounts,index);vm.value=GEN
    try:c.open_request(rid,'space1',scope,mode,duration,json.loads(c.get_namespace('space1'))['digest'])
    finally:vm.value=0
    return rid

def mock(vm,classes):
    vm.clear_mocks()
    vm.mock_web(r'.*w3.org/TR/2025/WD-web-locks-20250924/.*',{'response':{'status':200,'headers':{},'body':BODY},'method':'GET'})
    vm.mock_llm(r'.*ClashLock.*',json.dumps(classes) if not isinstance(classes,str) else classes)

def held(prepared):
    c,vm,accounts,mod,rid=prepared;c.review_request(rid)
    assert json.loads(c.get_request(rid))['status']=='HELD'
    return prepared

def accounting(c,received,escrow,credit,withdrawn=0):
    assert json.loads(c.get_accounting())==dict(received_gen=str(received),escrow_gen=str(escrow),credit_gen=str(credit),withdrawn_gen=str(withdrawn))

def test_happy_disjoint_reservations_and_release(prepared):
    c,vm,a,m,rid=held(prepared)
    r2=request(c,vm,a);mock(vm,{rid:'DISJOINT'});c.review_request(r2)
    assert json.loads(c.get_request(r2))['status']=='HELD'
    assert c.is_fence_valid(rid,1) and c.is_fence_valid(r2,2)
    c.use_fence(r2,2);c.release(r2)
    assert not c.is_fence_valid(r2,2) and c.is_fence_valid(rid,1)
    accounting(c,2,1,1)

@pytest.mark.parametrize('mode1,mode2,relation,expected',[('READ','READ','OVERLAP','HELD'),('READ','WRITE','OVERLAP','CONFLICT'),('WRITE','READ','OVERLAP','CONFLICT'),('WRITE','WRITE','OVERLAP','CONFLICT'),('WRITE','WRITE','DISJOINT','HELD'),('READ','READ','UNCLEAR','UNCLEAR')])
def test_semantic_meaning_controls_admission_and_actual_payer_refund(prepared,mode1,mode2,relation,expected):
    c,vm,a,m,rid=prepared
    c.reservations[rid].mode=mode1;c.reservations[rid].digest=m._digest(c._request_definition(c.reservations[rid]))
    c.review_request(rid)
    r2=request(c,vm,a,mode=mode2);mock(vm,{rid:relation});c.review_request(r2)
    assert json.loads(c.get_request(r2))['status']==expected
    assert json.loads(c.get_request(rid))['status']=='HELD'
    accounting(c,2,2 if expected=='HELD' else 1,0 if expected=='HELD' else 1)
    assert json.loads(c.get_credit(addr(a[1])))['available_gen']==('0' if expected=='HELD' else '1')

@pytest.mark.parametrize('raw',[{}, {'extra':'DISJOINT'},{'request1':'BOGUS'},{'request1':{'root':'OK'}},{'request1':'DISJOINT','root':'request1'},{'request1':'DISJOINT','downstream':'request1'},'not json'])
def test_invalid_coverage_class_root_downstream_or_duplicates_move_no_GEN_or_right(prepared,raw):
    c,vm,a,m,rid=held(prepared);r2=request(c,vm,a);before=c.get_accounting();mock(vm,raw);c.review_request(r2)
    assert json.loads(c.get_request(r2))['status']=='RETRYABLE'
    assert c.get_accounting()==before and not c.is_fence_valid(r2,0) and c.is_fence_valid(rid,1)
    assert json.loads(c.get_credit(addr(a[1])))['available_gen']=='0'

@pytest.mark.parametrize('problem',['wrong_body','unavailable','bad_status'])
def test_source_failure_is_nonpenalizing(prepared,problem):
    c,vm,a,m,rid=prepared;before=snap(c);vm.clear_mocks()
    vm.mock_web(r'.*',{'response':{'status':404 if problem=='bad_status' else 200,'headers':{},'body':b'actor owned bytes' if problem!='unavailable' else b''},'method':'GET'})
    c.review_request(rid)
    assert json.loads(c.get_request(rid))['status']=='RETRYABLE'
    assert c.get_accounting()==before[0] and json.loads(c.get_request(rid))['deposit_gen']=='1'

@pytest.mark.parametrize('field,value',[('owner','0x'+'55'*20),('namespace_id','other'),('namespace_digest','a'*64),('contract','0x'+'55'*20),('chain',1),('version','CL_FORGED'),('created_at',NOW+20),('scope','Attacker rewrote a still valid digest claim.')])
def test_valid_bytes_wrong_provenance_binding_never_reaches_consequence(prepared,field,value):
    c,vm,a,m,rid=prepared;r=c.reservations[rid]
    setattr(r,field,value)
    # Recompute where the altered claimed field should still not establish authority.
    if field in ('owner','namespace_digest','contract','chain','version','created_at'):
        r.digest=m._digest(c._request_definition(r))
    before=snap(c)
    with pytest.raises(m.gl.vm.UserError):c.review_request(rid)
    assert snap(c)==before

@pytest.mark.parametrize('field,value',[('contract','0x'+'33'*20),('chain',1),('version','wrong'),('created_at',NOW+1),('resource','Altered universe text, not authorized by original deposit.')])
def test_namespace_canonical_binding_failures_preserve_accounting(prepared,field,value):
    c,vm,a,m,rid=prepared;n=c.namespaces['space1'];setattr(n,field,value)
    if field!='resource':n.digest=m._digest(c._namespace_definition(n))
    before=snap(c)
    with pytest.raises(m.gl.vm.UserError):c.review_request(rid)
    assert snap(c)==before

@pytest.mark.parametrize('value',[0,2*GEN,1])
def test_exact_GEN_deposit_required_no_dust(prepared,value):
    c,vm,a,m,rid=prepared;before=snap(c);actor(vm,a,1);vm.value=value
    try:
        with pytest.raises(m.gl.vm.UserError,match='1 GEN'):c.open_request('other','space1','Invoice rows billed to Germany.','WRITE',120,json.loads(c.get_namespace('space1'))['digest'])
    finally:vm.value=0
    assert snap(c)==before

def test_wrong_caller_digest_and_duplicate_request(prepared):
    c,vm,a,m,rid=prepared
    for index,digest,request_id in [(4,'good','x'),(1,'bad','x'),(0,'good',rid)]:
        actor(vm,a,index);vm.value=GEN;before=snap(c)
        try:
            with pytest.raises(m.gl.vm.UserError):c.open_request(request_id,'space1','Invoice rows billed to Germany.','WRITE',120,json.loads(c.get_namespace('space1'))['digest'] if digest=='good' else 'a'*64)
        finally:vm.value=0
        assert snap(c)==before

@pytest.mark.parametrize('method', ['review_request','use_fence','release','cancel_request','recover','withdraw','create_namespace'])
def test_nonpayable_value_path_cannot_mutate(prepared,method):
    c,vm,a,m,rid=prepared;before=snap(c);vm.value=GEN
    args={'review_request':[rid],'use_fence':[rid,1],'release':[rid],'cancel_request':[rid],'recover':[rid],'withdraw':[],'create_namespace':['other','Name','A bounded alternate universe with enough text.',addr(a[1]),addr(a[2]),NOW+3600]}[method]
    try:
        with pytest.raises(m.gl.vm.UserError,match='nonpayable'):getattr(c,method)(*args)
    finally:vm.value=0
    assert snap(c)==before

@pytest.mark.parametrize('method,offset,success',[('review_request',-1,True),('review_request',0,False),('review_request',1,False),('recover',-1,False),('recover',0,True),('recover',1,True)])
def test_pending_deadline_enforced_while_phase_stays_stale(prepared,method,offset,success):
    c,vm,a,m,rid=prepared;clock(vm,NOW+600+offset);before=snap(c)
    if success:getattr(c,method)(rid)
    else:
        with pytest.raises(m.gl.vm.UserError):getattr(c,method)(rid)
        assert snap(c)==before

@pytest.mark.parametrize('method,offset,success',[('use_fence',-1,True),('use_fence',0,False),('use_fence',1,False),('release',-1,True),('release',0,False),('release',1,False),('recover',-1,False),('recover',0,True),('recover',1,True)])
def test_held_expiry_boundary_is_local_to_each_entrypoint(prepared,method,offset,success):
    c,vm,a,m,rid=held(prepared);clock(vm,NOW+120+offset);before=snap(c)
    args=[rid,1] if method=='use_fence' else [rid]
    if success:getattr(c,method)(*args)
    else:
        with pytest.raises(m.gl.vm.UserError):getattr(c,method)(*args)
        assert snap(c)==before

@pytest.mark.parametrize('offset,success',[(-1,True),(0,False),(1,False)])
def test_open_request_namespace_boundary_with_stale_phase(prepared,offset,success):
    c,vm,a,m,rid=prepared;clock(vm,NOW+3600+offset);before=snap(c)
    if success:request(c,vm,a)
    else:
        with pytest.raises(m.gl.vm.UserError):request(c,vm,a)
        assert snap(c)==before

@pytest.mark.parametrize('method',['review_request','use_fence','release','cancel_request'])
def test_wrong_registered_caller_cannot_use_or_end_others_request(prepared,method):
    c,vm,a,m,rid=held(prepared);actor(vm,a,1);before=snap(c)
    with pytest.raises(m.gl.vm.UserError):getattr(c,method)(*([rid,1] if method=='use_fence' else [rid]))
    assert snap(c)==before

@pytest.mark.parametrize('terminal',['cancel_request','recover','release'])
def test_terminal_recovery_duplicate_and_all_wrong_states(prepared,terminal):
    c,vm,a,m,rid=prepared
    if terminal=='release':c.review_request(rid)
    if terminal=='recover':clock(vm,NOW+600)
    getattr(c,terminal)(rid);before=snap(c)
    for method in ['cancel_request','recover','release','review_request','use_fence']:
        with pytest.raises(m.gl.vm.UserError):getattr(c,method)(*([rid,1] if method=='use_fence' else [rid]))
        assert snap(c)==before
    accounting(c,1,0,1)

def test_recovery_by_member_always_credits_original_payer(prepared):
    c,vm,a,m,rid=prepared;clock(vm,NOW+600);actor(vm,a,1);c.recover(rid)
    assert json.loads(c.get_credit(addr(a[0])))['available_gen']=='1'
    assert json.loads(c.get_credit(addr(a[1])))['available_gen']=='0'

def test_withdraw_debits_before_EVM_transfer_and_no_double_exit(prepared,monkeypatch):
    c,vm,a,m,rid=prepared;c.cancel_request(rid);calls=[]
    class Recipient:
        def __init__(self,address):self.address=address
        def emit_transfer(self,**kwargs):
            assert json.loads(c.get_credit(addr(a[0])))['available_gen']=='0'
            calls.append((addr(self.address),int(kwargs['value'])))
    monkeypatch.setattr(m,'_Recipient',Recipient)
    c.withdraw();assert calls==[(addr(a[0]),GEN)];accounting(c,1,0,0,1)
    before=snap(c)
    with pytest.raises(m.gl.vm.UserError):c.withdraw()
    assert snap(c)==before and len(calls)==1

def test_used_or_stale_fence_cannot_be_reused(prepared):
    c,vm,a,m,rid=held(prepared);before=snap(c)
    with pytest.raises(m.gl.vm.UserError):c.use_fence(rid,9)
    assert snap(c)==before
    c.use_fence(rid,1);before=snap(c)
    with pytest.raises(m.gl.vm.UserError):c.use_fence(rid,1)
    assert snap(c)==before

def test_expired_stale_holder_does_not_block_new_generation(prepared):
    c,vm,a,m,rid=held(prepared);clock(vm,NOW+120)
    r2=request(c,vm,a);c.review_request(r2)
    assert not c.is_fence_valid(rid,1) and c.is_fence_valid(r2,2)
    c.recover(rid);accounting(c,2,1,1)

def test_entity_isolation_and_append_only_attempts(prepared):
    c,vm,a,m,rid=held(prepared);before=snap(c)
    c.create_namespace('other','Other','A different bounded protocol resource of invoice records.',addr(a[1]),addr(a[2]),NOW+3600)
    assert snap(c)==before
    r2=request(c,vm,a);mock(vm,{});c.review_request(r2);mock(vm,{rid:'DISJOINT'});c.review_request(r2)
    assert [x['status'] for x in json.loads(c.get_attempts(r2))]==['RETRYABLE','HELD']
    before=snap(c)
    with pytest.raises(m.gl.vm.UserError):c.review_request(r2)
    assert snap(c)==before

def test_validator_independent_semantic_replay_rejects_shape_only_agreement(prepared):
    c,vm,a,m,rid=prepared
    good={'stage':'COMPLETE','classes':{'x':'OVERLAP'}}
    assert m._agree(m.gl.vm.Return(good),good,['x'])
    assert not m._agree(m.gl.vm.Return(good),{'stage':'COMPLETE','classes':{'x':'DISJOINT'}},['x'])
    assert not m._agree(None,good,['x'])
    assert not m._agree(m.gl.vm.Return({'stage':'COMPLETE','classes':{'x':'OVERLAP','y':'DISJOINT'}}),good,['x'])

def test_duplicate_raw_JSON_rejected_at_parser_boundary(prepared):
    c,vm,a,m,rid=prepared
    with pytest.raises(m.gl.vm.UserError,match='duplicate'):
        m._normalize('{"request1":"DISJOINT","request1":"OVERLAP"}',[rid])

def test_actual_validator_callback_independently_checks_meaning(prepared):
    c,vm,a,m,rid=held(prepared);r2=request(c,vm,a);mock(vm,{rid:'OVERLAP'});c.review_request(r2)
    assert vm.run_validator() is True
    assert vm.run_validator(leader_result={'stage':'COMPLETE','classes':{rid:'DISJOINT'}}) is False

def test_contract_metadata_ASCII_one_class_header_payable():
    source=Path('contracts/clash_lock.py').read_text('ascii');tree=ast.parse(source)
    classes=[n for n in tree.body if isinstance(n,ast.ClassDef) and any(ast.unparse(b)=='gl.Contract' for b in n.bases)]
    assert len(classes)==1 and classes[0].name=='ClashLockContract'
    assert source.startswith('# v0.2.16\n# { "Depends": "py-genlayer:1jb45')
    methods={n.name:n for n in classes[0].body if isinstance(n,ast.FunctionDef)}
    assert 'gl.public.write.payable' in [ast.unparse(x) for x in methods['open_request'].decorator_list]
    assert 'gl.chain.Account' not in source and 'NotImplementedError' not in source
    assert '@gl.evm.contract_interface' in source
