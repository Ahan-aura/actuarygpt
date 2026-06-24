import urllib.request
import json

base_url = 'http://127.0.0.1:8000'
app_id = 'VEH-7C36AC'

print(f"Evaluating vehicle application {app_id}...")
req = urllib.request.Request(f"{base_url}/applications/vehicle/{app_id}/evaluate", data=b'', method='POST')
try:
    with urllib.request.urlopen(req) as res:
        eval_data = json.loads(res.read().decode('utf-8'))
        print("Evaluation success! Decision:", eval_data['underwriting_decision'])
except Exception as e:
    print("Error evaluating application:", e)
    if hasattr(e, 'read'):
        print("Response detail:", e.read().decode('utf-8'))
