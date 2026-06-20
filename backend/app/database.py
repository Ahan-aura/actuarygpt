import sqlite3
import os
import json
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "actuary_gpt.db")
DATABASE_URL = os.getenv("DATABASE_URL")

# Check if we should use PostgreSQL
IS_POSTGRES = False
if DATABASE_URL and (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")):
    try:
        import psycopg2
        import psycopg2.extras
        IS_POSTGRES = True
        print(f"PostgreSQL environment detected. Using URL: {DATABASE_URL}")
    except ImportError:
        print("PostgreSQL URL provided but psycopg2 is not installed. Defaulting to SQLite.")

class PostgresCursorWrapper:
    def __init__(self, real_cursor):
        self.real_cursor = real_cursor

    def execute(self, query, params=None):
        # Translate placeholder syntax ? -> %s
        query = query.replace('?', '%s')
        # Translate SQLite schema type AUTOINCREMENT -> SERIAL PRIMARY KEY
        query = query.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
        query = query.replace('AUTOINCREMENT', '')
        
        self.real_cursor.execute(query, params)

    def fetchone(self):
        return self.real_cursor.fetchone()

    def fetchall(self):
        return self.real_cursor.fetchall()

    @property
    def rowcount(self):
        return self.real_cursor.rowcount

    def close(self):
        self.real_cursor.close()

    def __iter__(self):
        return iter(self.real_cursor)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

class PostgresConnectionWrapper:
    def __init__(self, real_conn):
        self.real_conn = real_conn

    def cursor(self):
        real_cursor = self.real_conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        return PostgresConnectionWrapperCursor(real_cursor)

    def commit(self):
        self.real_conn.commit()

    def rollback(self):
        self.real_conn.rollback()

    def close(self):
        self.real_conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

class PostgresConnectionWrapperCursor:
    def __init__(self, real_cursor):
        self.real_cursor = real_cursor

    def execute(self, query, params=None):
        query = query.replace('?', '%s')
        query = query.replace('INTEGER PRIMARY KEY AUTOINCREMENT', 'SERIAL PRIMARY KEY')
        query = query.replace('AUTOINCREMENT', '')
        self.real_cursor.execute(query, params)

    def fetchone(self):
        return self.real_cursor.fetchone()

    def fetchall(self):
        return self.real_cursor.fetchall()

    @property
    def rowcount(self):
        return self.real_cursor.rowcount

    def close(self):
        self.real_cursor.close()

    def __iter__(self):
        return iter(self.real_cursor)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

def get_db_connection():
    if IS_POSTGRES:
        try:
            conn = psycopg2.connect(DATABASE_URL)
            return PostgresConnectionWrapper(conn)
        except Exception as e:
            print(f"Failed to connect to PostgreSQL: {e}. Falling back to SQLite.")
            
    # Default to SQLite
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def is_integrity_error(e):
    err_name = type(e).__name__
    return "IntegrityError" in err_name or "UniqueViolation" in err_name or "DuplicateKey" in err_name

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
    
    # 2. Create Applications Table (Life & Health)
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
        full_name TEXT,
        email TEXT,
        phone TEXT,
        medical_conditions TEXT,
        policy_duration INTEGER,
        nominee_age INTEGER,
        FOREIGN KEY(client) REFERENCES users(username)
    )
    """)
    
    # 3. Create Vehicle Applications Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS vehicle_applications (
        id TEXT PRIMARY KEY,
        client TEXT NOT NULL,
        months_as_customer INTEGER NOT NULL,
        age INTEGER NOT NULL,
        policy_state TEXT NOT NULL,
        policy_csl TEXT NOT NULL,
        policy_deductable REAL NOT NULL,
        policy_annual_premium REAL NOT NULL,
        umbrella_limit REAL NOT NULL,
        insured_sex TEXT NOT NULL,
        insured_education_level TEXT NOT NULL,
        insured_occupation TEXT NOT NULL,
        insured_hobbies TEXT NOT NULL,
        insured_relationship TEXT NOT NULL,
        capital_gains REAL NOT NULL,
        capital_loss REAL NOT NULL,
        incident_type TEXT NOT NULL,
        collision_type TEXT NOT NULL,
        incident_severity TEXT NOT NULL,
        authorities_contacted TEXT NOT NULL,
        incident_state TEXT NOT NULL,
        incident_city TEXT NOT NULL,
        incident_hour_of_the_day INTEGER NOT NULL,
        number_of_vehicles_involved INTEGER NOT NULL,
        property_damage TEXT NOT NULL,
        bodily_injuries INTEGER NOT NULL,
        witnesses INTEGER NOT NULL,
        police_report_available TEXT NOT NULL,
        total_claim_amount REAL NOT NULL,
        injury_claim REAL NOT NULL,
        property_claim REAL NOT NULL,
        vehicle_claim REAL NOT NULL,
        auto_make TEXT NOT NULL,
        auto_model TEXT NOT NULL,
        auto_year INTEGER NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')),
        fraud_reported TEXT,
        confidence REAL,
        report TEXT,
        pdf_url TEXT,
        underwriting_decision TEXT,
        similar_cases TEXT,
        FOREIGN KEY(client) REFERENCES users(username)
    )
    """)
    
    conn.commit()
    
    # 4. Seed Default Users if none exist
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ("actuary1", "password123", "officer"))
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ("customer1", "password123", "customer"))
        conn.commit()
        
    # 5. Seed Default Applications (Life) if none exist
    cursor.execute("SELECT COUNT(*) FROM applications")
    if cursor.fetchone()[0] == 0:
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

    # 6. Seed Default Applications (Vehicle) if none exist
    cursor.execute("SELECT COUNT(*) FROM vehicle_applications")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO vehicle_applications (
            id, client, months_as_customer, age, policy_state, policy_csl, policy_deductable,
            policy_annual_premium, umbrella_limit, insured_sex, insured_education_level,
            insured_occupation, insured_hobbies, insured_relationship, capital_gains, capital_loss,
            incident_type, collision_type, incident_severity, authorities_contacted, incident_state,
            incident_city, incident_hour_of_the_day, number_of_vehicles_involved, property_damage,
            bodily_injuries, witnesses, police_report_available, total_claim_amount, injury_claim,
            property_claim, vehicle_claim, auto_make, auto_model, auto_year, date, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "VEH-7821", "customer1", 328, 48, "OH", "250/500", 1000.0, 1406.91, 0.0, "MALE", "MD",
            "craft-repair", "sleeping", "husband", 53700.0, -46000.0, "Single Vehicle Collision", "Side Collision",
            "Major Damage", "Police", "SC", "Columbus", 5, 1, "YES", 1, 2, "YES", 71610.0, 6510.0,
            13020.0, 52080.0, "Saab", "92x", 2004, "2026-06-19", "pending"
        ))
        conn.commit()
        
    conn.close()

init_db()
