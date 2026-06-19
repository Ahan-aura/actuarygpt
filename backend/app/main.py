import sys
import os
import sqlite3
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

# Ensure the directory of this file is in Python's search path to allow direct imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from schemas import CustomerInput, LoginRequest, RegisterRequest, DecisionRequest
from ai_agent import actuarial_agent
from db import get_db_connection

app = FastAPI(
    title="ActuaryGPT API",
    version="2.0"
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

# Mount the static directory to serve generated PDFs
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

import json

# Custom schema for Application submission
class ApplicationCreate(BaseModel):
    client: str
    age: float
    height: float
    weight: float
    bmi: float
    product_info_2: str
    occupation: str
    income: float
    smoker: int
    previous_claims: int
    family_history: int
    insurance_type: str
    coverage_amount: float
    exercise: int
    alcohol: int
    gender: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    medical_conditions: Optional[str] = None
    policy_duration: Optional[int] = None
    nominee_age: Optional[int] = None

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    context: Optional[Dict[str, Any]] = None

def parse_application_row(row):
    if not row:
        return None
    d = dict(row)
    if d.get("similar_cases"):
        try:
            d["similar_cases"] = json.loads(d["similar_cases"])
        except Exception:
            d["similar_cases"] = []
    else:
        d["similar_cases"] = []
    return d

@app.get("/")
def home():
    return {
        "status": "online",
        "message": "ActuaryGPT SQL Backend Running"
    }

# ================= AUTHENTICATION ENDPOINTS =================

@app.post("/auth/register")
def register(req: RegisterRequest):
    if req.role.strip() == 'officer':
        if req.passkey != "ACTUARY_SECURE_2026":
            raise HTTPException(status_code=400, detail="Invalid Officer Security Passkey. Registration denied.")
            
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            (req.username.strip(), req.password, req.role.strip())
        )
        conn.commit()
        return {"success": True, "message": "User registered successfully"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Username already exists")
    finally:
        conn.close()

@app.post("/auth/login")
def login(req: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT username, role, password FROM users WHERE username = ?",
        (req.username.strip(),)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    if user["role"] == 'officer':
        if req.passkey != "ACTUARY_SECURE_2026":
            raise HTTPException(status_code=401, detail="Invalid Officer Security Passkey. Login denied.")
            
    return {
        "username": user["username"],
        "role": user["role"]
    }

# ================= POLICY APPLICATIONS ENDPOINTS =================

@app.get("/applications")
def get_applications(client: Optional[str] = None, status: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM applications WHERE 1=1"
    params = []
    
    if client:
        query += " AND client = ?"
        params.append(client)
    if status:
        query += " AND status = ?"
        params.append(status)
        
    query += " ORDER BY date DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    return [parse_application_row(row) for row in rows]

@app.post("/applications")
def create_application(req: ApplicationCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    app_id = f"APP-{uuid.uuid4().hex[:6].upper()}"
    date_str = datetime.now().strftime("%Y-%m-%d")
    
    try:
        cursor.execute("""
        INSERT INTO applications (
            id, client, age, height, weight, bmi, product_info_2, occupation, income, smoker,
            previous_claims, family_history, insurance_type, coverage_amount, exercise, alcohol, gender,
            date, status, full_name, email, phone, medical_conditions, policy_duration, nominee_age
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            app_id, req.client, req.age, req.height, req.weight, req.bmi, req.product_info_2,
            req.occupation, req.income, req.smoker, req.previous_claims, req.family_history,
            req.insurance_type, req.coverage_amount, req.exercise, req.alcohol, req.gender,
            date_str, 'pending', req.full_name, req.email, req.phone, req.medical_conditions,
            req.policy_duration, req.nominee_age
        ))
        conn.commit()
        
        cursor.execute("SELECT * FROM applications WHERE id = ?", (app_id,))
        new_app = cursor.fetchone()
        return parse_application_row(new_app)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/applications/{id}/evaluate")
def evaluate_application(id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM applications WHERE id = ?", (id,))
    app_row = cursor.fetchone()
    
    if not app_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Map row to actuarial agent input dictionary
    customer_data = {
        "age": app_row["age"],
        "height": app_row["height"],
        "weight": app_row["weight"],
        "bmi": app_row["bmi"],
        "product_info_2": app_row["product_info_2"],
        "occupation": app_row["occupation"],
        "income": app_row["income"],
        "smoker": app_row["smoker"],
        "previous_claims": app_row["previous_claims"],
        "family_history": app_row["family_history"],
        "insurance_type": app_row["insurance_type"],
        "coverage_amount": app_row["coverage_amount"],
        "exercise": app_row["exercise"],
        "alcohol": app_row["alcohol"],
        "gender": app_row["gender"]
    }
    
    try:
        # Trigger the AI Actuarial Agent Pipeline
        agent_result = actuarial_agent(customer_data)
        
        # Save evaluation results into DB (keeping status pending until human officer clicks approve/reject)
        cursor.execute("""
        UPDATE applications SET
            risk_class = ?,
            risk_category = ?,
            premium = ?,
            report = ?,
            pdf_url = ?,
            underwriting_decision = ?,
            confidence = ?,
            similar_cases = ?
        WHERE id = ?
        """, (
            agent_result["risk_class"],
            agent_result["risk_category"],
            agent_result["premium"],
            agent_result["report"],
            agent_result["pdf_url"],
            agent_result["underwriting_decision"],
            agent_result["confidence"],
            json.dumps(agent_result["similar_cases"]),
            id
        ))
        conn.commit()
        
        cursor.execute("SELECT * FROM applications WHERE id = ?", (id,))
        updated_app = cursor.fetchone()
        return parse_application_row(updated_app)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent analysis failed: {str(e)}")
    finally:
        conn.close()

@app.post("/applications/{id}/decide")
def decide_application(id: str, req: DecisionRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM applications WHERE id = ?", (id,))
    app_row = cursor.fetchone()
    
    if not app_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Application not found")
        
    new_status = 'approved' if req.decision == 'approve' else 'rejected'
    
    try:
        cursor.execute(
            "UPDATE applications SET status = ? WHERE id = ?",
            (new_status, id)
        )
        conn.commit()
        
        cursor.execute("SELECT * FROM applications WHERE id = ?", (id,))
        updated_app = cursor.fetchone()
        return parse_application_row(updated_app)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/agent/chat")
def agent_chat(req: ChatRequest):
    try:
        from llm import chat_with_agent
        reply = chat_with_agent(req.message, req.history, req.context)
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= MANAGEMENT ANALYTICS ENDPOINTS =================

@app.get("/analytics/summary")
def get_analytics_summary():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Approved policies aggregations
    cursor.execute("SELECT COUNT(*), SUM(premium), AVG(risk_class) FROM applications WHERE status = 'approved'")
    stats = cursor.fetchone()
    
    total_policies = stats[0] or 0
    total_premiums = stats[1] or 0.0
    avg_risk_class = round(stats[2], 1) if stats[2] is not None else 0.0
    
    # Review rate (Approved vs. total processed)
    cursor.execute("SELECT COUNT(*) FROM applications WHERE status IN ('approved', 'rejected')")
    processed_count = cursor.fetchone()[0] or 1
    cursor.execute("SELECT COUNT(*) FROM applications WHERE status = 'approved'")
    approved_count = cursor.fetchone()[0] or 0
    triage_approval_rate = int((approved_count / processed_count) * 100) if processed_count > 0 else 100
    
    # Risk Distribution Breakdown
    cursor.execute("SELECT risk_category, COUNT(*) FROM applications WHERE status = 'approved' GROUP BY risk_category")
    risk_rows = cursor.fetchall()
    risk_distribution = {row[0]: row[1] for row in risk_rows if row[0] is not None}
    
    # Premium by insurance type
    cursor.execute("SELECT insurance_type, SUM(premium) FROM applications WHERE status = 'approved' GROUP BY insurance_type")
    type_rows = cursor.fetchall()
    type_premiums = {row[0]: row[1] for row in type_rows if row[0] is not None}
    
    # Pricing ledger approved chronological history list
    cursor.execute("SELECT client, premium, date FROM applications WHERE status = 'approved' ORDER BY date ASC")
    ledger_rows = cursor.fetchall()
    ledger_history = [
        {"client": row["client"], "premium": row["premium"], "date": row["date"]}
        for row in ledger_rows
    ]
    
    # All processed applications (approved or rejected) for table listing
    cursor.execute("SELECT * FROM applications WHERE status IN ('approved', 'rejected') ORDER BY date DESC")
    processed_list = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return {
        "total_policies": total_policies,
        "total_premiums": total_premiums,
        "avg_risk_class": avg_risk_class,
        "approval_rate": triage_approval_rate,
        "risk_distribution": risk_distribution,
        "type_premiums": type_premiums,
        "ledger_history": ledger_history,
        "processed_list": processed_list
    }
