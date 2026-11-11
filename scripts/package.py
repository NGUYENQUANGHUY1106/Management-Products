from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import os
root = Path(__file__).resolve().parents[1]
target = root.parent / 'ManagementProduct_Submission.zip'
excluded_dirs = {'node_modules', '.git', '.expo', 'dist', 'dist-android', 'dist-ios', 'uploads', 'test-results', 'playwright-report', '__pycache__', 'archive-userhub'}
with ZipFile(target, 'w', ZIP_DEFLATED) as out:
    for folder, dirs, files in os.walk(root):
        dirs[:] = [name for name in dirs if name not in excluded_dirs]
        for filename in files:
            path = Path(folder) / filename
            rel = path.relative_to(root)
            name = path.name.lower()
            if name.startswith('~$'): continue
            if name.startswith('preview-'): continue
            if name.startswith('.env') and name != '.env.example': continue
            if name.endswith(('.log', '.tsbuildinfo', '.pem', '.key')): continue
            if 'service-account' in name or 'adminsdk' in name or name == 'admin-login.json': continue
            if name in {'cleanup-product.py', 'expo-env.d.ts'}: continue
            out.write(path, Path('ManagementProduct') / rel)
print(target)
