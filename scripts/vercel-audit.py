"""Validate Vercel's real dry-run manifest before any source upload."""
import json
import sys
from pathlib import Path
data = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
paths = [item['path'] for item in data['files']]
allowed = {'.vercelignore', 'package.json', 'package-lock.json', 'README.md',
           'requirements.lock', 'gltest.config.yaml', 'frontend/index.html',
           'frontend/package.json', 'frontend/tsconfig.json',
           'frontend/vite.config.ts', 'frontend/vercel.json'}
bad = [p for p in paths if not (p in allowed or p.startswith('frontend/src/'))
       or '.env' in p or any(x in p for x in ['node_modules', '__pycache__'])]
assert data['framework']['slug'] == 'vite'
assert not bad, f'Blocked upload paths: {bad}'
assert 'frontend/vercel.json' in paths and 'package-lock.json' in paths
print(f'VERCEL_UPLOAD_AUDIT_PASS: {len(paths)} real upload files; forbidden paths=0; no environment files.')
