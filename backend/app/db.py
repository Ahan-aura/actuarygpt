import sqlite3
import os
import uuid
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "actuary_gpt.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('customer', 'officer'))
    )
    """)
    
    # 2. Create Applications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id TEXT PRIMARY KEY,
        client TEXT NOT NULL,
        age REAL NOT NULL,
        height REAL NOT NULL,
        weight REAL NOT NULL,
        bmi REAL NOT NULL,
        product_info_2 TEXT NOT NULL,
        occupation TEXT NOT NULL,
        income REAL NOT NULL,
        smoker INTEGER NOT NULL,
        previous_claims INTEGER NOT NULL,
        family_history INTEGER NOT NULL,
        insurance_type TEXT NOT NULL,
        coverage_amount REAL NOT NULL,
        exercise INTEGER NOT NULL,
        alcohol INTEGER NOT NULL,
        gender TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
        risk_class INTEGER,
        risk_category TEXT,
        premium REAL,
        report TEXT,
        pdf_url TEXT,
        underwriting_decision TEXT,
        confidence REAL,
        similar_cases TEXT,
        FOREIGN KEY(client) REFERENCES users(username)
    )
    """)
    
    # Run migrations for existing DB
    try:
        cursor.execute("ALTER TABLE applications ADD COLUMN confidence REAL")
    except sqlite3.OperationalError:
        pass
    try:
        cursor.execute("ALTER TABLE applications ADD COLUMN similar_cases TEXT")
    except sqlite3.OperationalError:
        pass
    for col_name, col_type in [
        ("full_name", "TEXT"),
        ("email", "TEXT"),
        ("phone", "TEXT"),
        ("medical_conditions", "TEXT"),
        ("policy_duration", "INTEGER"),
        ("nominee_age", "INTEGER")
    ]:
        try:
            cursor.execute(f"ALTER TABLE applications ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass
            
    conn.commit()
    
    # 3. Seed Default Users if none exist
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ("actuary1", "password123", "officer"))
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ("customer1", "password123", "customer"))
        conn.commit()
        
    # 4. Seed Default Applications if none exist
    cursor.execute("SELECT COUNT(*) FROM applications")
    if cursor.fetchone()[0] == 0:
        # Triaged Policies
        cursor.execute("""
        INSERT INTO applications (
            id, client, age, height, weight, bmi, product_info_2, occupation, income, smoker,
            previous_claims, family_history, insurance_type, coverage_amount, exercise, alcohol, gender,
            date, status, risk_class, risk_category, premium, report, pdf_url, underwriting_decision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "POL-8902", "customer1", 0.32, 178.0, 70.0, 22.1, "A1", "Software Engineer", 1800000.0, 0,
            0, 0, "Life", 8000000.0, 3, 0, "Male", "2026-06-12", "approved", 2, "Low Risk", 12000.0,
            "The applicant is low-risk due to normal BMI and regular exercise.", None, "Preferred Issue - Standard Approval"
        ))
        
        cursor.execute("""
        INSERT INTO applications (
            id, client, age, height, weight, bmi, product_info_2, occupation, income, smoker,
            previous_claims, family_history, insurance_type, coverage_amount, exercise, alcohol, gender,
            date, status, risk_class, risk_category, premium, report, pdf_url, underwriting_decision
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "POL-4519", "customer1", 0.48, 165.0, 72.0, 26.4, "D2", "Manager", 1100000.0, 0,
            1, 0, "Health", 3000000.0, 1, 1, "Female", "2026-06-14", "approved", 4, "Medium Risk", 17000.0,
            "The applicant is standard-risk due to age and past minor claims.", None, "Standard Issue - Standard Approval"
        ))
        
        # Pending applications in queue
        cursor.execute("""
        INSERT INTO applications (
            id, client, age, height, weight, bmi, product_info_2, occupation, income, smoker,
            previous_claims, family_history, insurance_type, coverage_amount, exercise, alcohol, gender,
            date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "APP-5261", "customer1", 0.55, 172.0, 88.0, 29.7, "D2", "Sales Director", 1500000.0, 1,
            2, 1, "Life", 9000000.0, 1, 2, "Male", "2026-06-18", "pending"
        ))
        
        conn.commit()
        
    conn.close()

# Run initialization
init_db()
