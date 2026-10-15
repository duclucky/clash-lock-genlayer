"""Windows fd0 compatibility for pinned genlayer-test; no protocol behavior."""
import os
import tempfile
from pathlib import Path
import pytest
from gltest.direct.loader import deploy_contract

if os.name == "nt":
    from gltest.direct import loader
    from gltest.direct.vm import VMContext

    def inject(vm):
        from genlayer.py import calldata
        from genlayer.py.types import Address
        def address(value):
            return Address(value) if isinstance(value, bytes) else value
        encoded = calldata.encode({"contract_address": address(vm._contract_address),
            "sender_address": address(vm.sender), "origin_address": address(vm.origin),
            "stack": [], "value": vm._value, "datetime": vm._datetime,
            "is_init": False, "chain_id": vm._chain_id, "entry_kind": 0,
            "entry_data": b"", "entry_stage_data": None})
        fd, name = tempfile.mkstemp()
        try:
            os.write(fd, encoded)
            os.lseek(fd, 0, os.SEEK_SET)
            vm._original_stdin_fd = os.dup(0)
            os.dup2(fd, 0)
            vm._clash_fd = name
        finally:
            os.close(fd)

    previous_cleanup = VMContext._cleanup_after_deactivate
    def cleanup(vm):
        try:
            previous_cleanup(vm)
        finally:
            name = getattr(vm, "_clash_fd", None)
            if name:
                Path(name).unlink(missing_ok=True)
                vm._clash_fd = None
    loader._inject_message_to_fd0 = inject
    VMContext._cleanup_after_deactivate = cleanup

@pytest.fixture
def contract(direct_vm):
    return deploy_contract(Path("contracts/clash_lock.py"), direct_vm, sdk_version="v0.2.16")
