"""Package source, verified builds and documentation, excluding local credentials."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import subprocess
import json
import hashlib

root = Path(__file__).resolve().parents[1]
files = set(subprocess.check_output(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], cwd=root).decode('utf-8').split('\0'))
files.discard('')
for folder in ['dist', 'dist-android', 'dist-ios']:
    for path in (root / folder).rglob('*'):
        if path.is_file():
            files.add(path.relative_to(root).as_posix())
private_file = Path('D:/UserHub-Credentials/userhub-login.json')
private_password = json.loads(private_file.read_text())['password'].encode() if private_file.exists() else None
password_markers = ([private_password] if private_password and len(private_password) >= 16 else [b'"' + private_password + b'"', b"'" + private_password + b"'", b'`' + private_password + b'`', b'=' + private_password + b'\n'] if private_password else [])
markers = [b'-----BEGIN ' + b'PRIVATE KEY-----', b'"private_' + b'key":', b'"refresh_' + b'token":']
selected = []
for name in sorted(files):
    path = root / name
    if not path.is_file():
        continue
    if path.name.startswith('.env') and path.name != '.env.example':
        raise RuntimeError('Unexpected environment file in package: ' + name)
    relative_parts = Path(name).parts
    static_asset = relative_parts[0] in ['dist', 'dist-android', 'dist-ios']
    if any(part in ['.git', 'uploads', 'test-results', 'playwright-report'] for part in relative_parts) or ('node_modules' in relative_parts and not static_asset):
        raise RuntimeError('Unexpected runtime directory in package: ' + name)
    content = path.read_bytes()
    if any(marker in content for marker in markers + password_markers):
        raise RuntimeError('Potential credential content detected in: ' + name)
    selected.append((name, path))
out = root.parent / 'UserHub_BanGiao.zip'
with ZipFile(out, 'w', ZIP_DEFLATED) as archive:
    for name, path in selected:
        archive.write(path, 'userhub/' + name)
digest = hashlib.sha256(out.read_bytes()).hexdigest()
(root.parent / 'UserHub_BanGiao.sha256').write_text(digest + '  ' + out.name + '\n')
print(f'{out}\nFiles: {len(selected)}\nSHA256: {digest}')
