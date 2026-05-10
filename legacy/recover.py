import os
import json

appdata = os.environ.get('APPDATA')
history_dir = os.path.join(appdata, 'Code', 'User', 'History')
target_files = ['index.html', 'main.js']
latest_files = {}

for root, dirs, files in os.walk(history_dir):
    if 'entries.json' in files:
        entries_path = os.path.join(root, 'entries.json')
        try:
            with open(entries_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            resource = data.get('resource', '')
            for target in target_files:
                if resource.endswith(target) and 'MedSens News' in resource:
                    if data.get('entries'):
                        latest_entry = data['entries'][-1]['id']
                        file_path = os.path.join(root, latest_entry)
                        mtime = os.path.getmtime(file_path)
                        if target not in latest_files or mtime > latest_files[target]['mtime']:
                            latest_files[target] = {
                                'path': file_path,
                                'mtime': mtime,
                                'original': resource
                            }
        except Exception as e:
            pass

for target, info in latest_files.items():
    print(f"Restoring {target} from {info['path']}")
    with open(info['path'], 'r', encoding='utf-8') as src:
        content = src.read()
    with open(target, 'w', encoding='utf-8') as dst:
        dst.write(content)

print('Recovery complete.')
