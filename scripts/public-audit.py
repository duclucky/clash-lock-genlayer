"""Read-only public allowlist and exact configured-secret scan, including history."""
import re
import subprocess
from pathlib import Path

def git(*args):
    return subprocess.check_output(['git', *args])

root = Path(__file__).resolve().parent.parent
assert Path(git('rev-parse', '--show-toplevel').decode().strip()).resolve() == root
paths = git('ls-files', '-z').decode().split('\0')
paths = [p for p in paths if p]
files = {'README.md', '.gitignore', '.vercelignore', 'package.json', 'package-lock.json',
         'requirements.lock', 'gltest.config.yaml', 'frontend/index.html',
         'frontend/package.json', 'frontend/tsconfig.json',
         'frontend/vite.config.ts', 'frontend/.env.example', 'frontend/vercel.json'}
prefixes = ('contracts/', 'docs/', 'scripts/', 'tests/', 'frontend/src/', '.github/workflows/')
denied = ('.env', 'AGENTS.md', 'CLAUDE.md', 'SKILL.md')
bad_paths = [p for p in paths if not (p in files or p.startswith(prefixes))
             or any(part in denied for part in Path(p).parts)]
assert not bad_paths, f'Unexpected public paths: {bad_paths}'
assert git('check-ignore', '.env').strip() == b'.env'
assert git('check-ignore', 'frontend/.env').strip() == b'frontend/.env'

secrets = []
env_paths = [*root.glob('.env*'), * (root / 'frontend').glob('.env*'), root.parent / '.env']
for env_path in env_paths:
    if env_path.exists():
        for line in env_path.read_text(encoding='utf-8-sig').splitlines():
            match = re.match(r'\s*([A-Z_]*(?:PRIVATE_KEY|TOKEN|SECRET|PASSWORD)[A-Z_]*)\s*=\s*(.+)', line)
            if match:
                value = match[2].strip().strip('\'"')
                if len(value) >= 12:
                    secrets.append(value.encode())
                    if re.fullmatch(r'(?:0x)?[0-9a-fA-F]{64}', value):
                        secrets.append(value.removeprefix('0x').encode())

def clean(data):
    assert not any(value in data for value in secrets), 'Configured secret found; stop publication'
    assert not re.search(rb'gh[opusr]_[A-Za-z0-9]{20,}', data), 'Credential pattern found; stop publication'
    assert not re.search(rb'(?m)^-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----', data), 'Private key block found'

for path in paths:
    clean(git('show', ':' + path))
objects = git('rev-list', '--objects', '--all').decode().splitlines()
blobs = 0
for item in objects:
    oid = item.split(' ', 1)[0]
    if git('cat-file', '-t', oid).strip() == b'blob':
        clean(git('cat-file', '-p', oid))
        blobs += 1
print(f'PUBLIC_AUDIT_PASS: {len(paths)} staged/tracked allowlisted files; {blobs} historical blobs; configured secret matches=0; ignored envs verified.')
