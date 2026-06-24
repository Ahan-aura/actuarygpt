import sqlite3
import os

db_path = r"C:\Users\AHAN\OneDrive\Desktop\agy-cli-projects\ActuaryGPT\backend\app\actuary_gpt.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Update the user role for officer@shield.com to 'officer'
cursor.execute("UPDATE users SET role = 'officer' WHERE username = 'officer@shield.com'")
conn.commit()

# Verify the update
cursor.execute("SELECT username, role FROM users WHERE username = 'officer@shield.com'")
row = cursor.fetchone()
print("Updated user:", dict(row) if row else "User not found")

conn.close()
