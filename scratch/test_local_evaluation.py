import urllib.request
import json

base_url = 'http://127.0.0.1:8000'

# Create application payload
app_payload = {
    "client": "customer1",
    "age": 0.35,
    "height": 175.0,
    "weight": 70.0,
    "bmi": 22.9,
    "product_info_2": "A1",
    "occupation": "Software Developer",
    "income": 120000.0,
    "smoker": 0,
    "previous_claims": 0,
    "family_history": 0,
    "insurance_type": "Life",
    "coverage_amount": 500000.0,
    "exercise": 1,
    "alcohol": 0,
    "gender": "Male",
    "full_name": "Test Customer",
    "email": "test@customer.com",
    "phone": "1234567890",
    "medical_conditions": "None",
    "policy_duration": 10,
    "nominee_age": 30
}

# 1. Create the application
print("Submitting new application...")
data = json.dumps(app_payload).encode('utf-8')
req = urllib.request.Request(f"{base_url}/applications", data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req) as res:
        app_data = json.loads(res.read().decode('utf-8'))
        print("Application created successfully:", app_data['id'])
except Exception as e:
    print("Error creating application:", e)
    exit(1)

# 2. Evaluate the application
app_id = app_data['id']
print(f"Evaluating application {app_id}...")
req2 = urllib.request.Request(f"{base_url}/applications/{app_id}/evaluate", data=b'', method='POST')
try:
    with urllib.request.urlopen(req2) as res:
        eval_data = json.loads(res.read().decode('utf-8'))
        print("Evaluation success! Decision:", eval_data['underwriting_decision'])
except Exception as e:
    print("Error evaluating application:", e)
    if hasattr(e, 'read'):
        print("Response detail:", e.read().decode('utf-8'))
