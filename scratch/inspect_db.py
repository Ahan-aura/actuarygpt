import sqlite3
import os

db_path = r"C:\Users\AHAN\OneDrive\Desktop\agy-cli-projects\ActuaryGPT\backend\app\actuary_gpt.db"
print("DB Path:", db_path)
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("\n--- APPLICATIONS TABLE ---")
cursor.execute("SELECT id, client, insurance_type, status, risk_class FROM applications LIMIT 10")
for row in cursor.fetchall():
    print(dict(row))

print("\n--- VEHICLE APPLICATIONS TABLE ---")
cursor.execute("SELECT id, client, total_claim_amount, status, fraud_reported FROM vehicle_applications LIMIT 10")
for row in cursor.fetchall():
    print(dict(row))

conn.close()
