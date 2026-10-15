import json
import sys
from datetime import datetime, timezone
import pytest

NOW = 2_000_000_000
GEN = 10**18

def addr(value):
    from genlayer.py.types import Address
    return (Address(value) if isinstance(value, bytes) else value).as_hex.lower()

def clock(vm, value):
    text = datetime.fromtimestamp(value, timezone.utc).isoformat().replace('+00:00', 'Z')
    vm.warp(text)
    module = sys.modules.get('genlayer.gl')
    if module is not None and getattr(module, 'message_raw', None) is not None:
        module.message_raw['datetime'] = text

def setup(c, vm, accounts, rid='request1'):
    clock(vm, NOW)
    vm.sender = accounts[0]
    vm.origin = accounts[0]
    c.create_namespace('space1','Billing','All invoice rows, each with exactly one billing country.',addr(accounts[1]),addr(accounts[2]),NOW+3600)
    vm.value = GEN
    try:
        c.open_request(rid,'space1','Invoice rows billed in France only.','WRITE',120,json.loads(c.get_namespace('space1'))['digest'])
    finally:
        vm.value = 0
    return rid

def snap(c):
    return c.get_accounting(), c.list_requests('space1')

@pytest.mark.parametrize('method,message', [('release','holder'),('cancel_request','owner'),('recover','participant'),('withdraw','credit')])
def test_recovery_wrong_caller_rejected_by_business_guard(contract,direct_vm,direct_accounts,method,message):
    rid=setup(contract,direct_vm,direct_accounts)
    before=snap(contract)
    direct_vm.sender=direct_accounts[4]
    direct_vm.origin=direct_accounts[4]
    with pytest.raises(sys.modules[contract.__module__].gl.vm.UserError,match=message):
        getattr(contract,method)(*[] if method=='withdraw' else [rid])
    assert snap(contract)==before

def test_cancel_returns_exact_payer_credit_once(contract,direct_vm,direct_accounts):
    rid=setup(contract,direct_vm,direct_accounts)
    contract.cancel_request(rid)
    assert json.loads(contract.get_credit(addr(direct_accounts[0])))['available_gen']=='1'
    before=snap(contract)
    with pytest.raises(Exception):contract.cancel_request(rid)
    assert snap(contract)==before
