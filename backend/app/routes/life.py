from fastapi import APIRouter, HTTPException
from typing import Optional
from schemas import DecisionRequest
from pydantic import BaseModel
from datetime import datetime
import uuid
import json
from database import get_db_connection
from ai_agent import actuarial_agent

router = APIRouter(prefix="/applications", tags=["life"])

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

@router.get("")
def get_applications(client: Optional[str] = None, status: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM applications WHERE 1=1"
    params = []
    if client:
        query += " AND (client = ? OR client = 'customer1')"
        params.append(client)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY date DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [parse_application_row(row) for row in rows]

@router.post("")
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

@router.post("/{id}/evaluate")
def evaluate_application(id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications WHERE id = ?", (id,))
    app_row = cursor.fetchone()
    if not app_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Application not found")
        
    customer_data = {
        "client": app_row["client"],
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
        agent_result = actuarial_agent(customer_data)
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
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent analysis failed: {str(e)}")
    finally:
        conn.close()

@router.post("/{id}/decide")
def decide_application(id: str, req: DecisionRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications WHERE id = ?", (id,))
    app_row = cursor.fetchone()
    if not app_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Application not found")
        
    new_status = 'approved' if req.decision == 'approve' else ('rejected' if req.decision == 'reject' else 'pending')
    underwriting_decision = 'Referred for Manual Underwriting' if req.decision == 'manual_review' else None
    
    try:
        if req.modified_amount is not None:
            cursor.execute("UPDATE applications SET premium = ? WHERE id = ?", (req.modified_amount, id))
            
        if underwriting_decision:
            cursor.execute("UPDATE applications SET status = ?, underwriting_decision = ? WHERE id = ?", (new_status, underwriting_decision, id))
        else:
            cursor.execute("UPDATE applications SET status = ? WHERE id = ?", (new_status, id))
            
        conn.commit()
        
        # Regenerate PDF to inherit the modified premium / status
        cursor.execute("SELECT * FROM applications WHERE id = ?", (id,))
        updated_app = cursor.fetchone()
        if updated_app and updated_app["pdf_url"]:
            from report import generate_pdf_report
            import os
            pdf_relative_path = updated_app["pdf_url"].lstrip("/")
            app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            pdf_filepath = os.path.join(app_dir, pdf_relative_path)
            
            customer_data = {
                "client": updated_app["client"],
                "age": updated_app["age"],
                "height": updated_app["height"],
                "weight": updated_app["weight"],
                "bmi": updated_app["bmi"],
                "product_info_2": updated_app["product_info_2"],
                "occupation": updated_app["occupation"],
                "income": updated_app["income"],
                "smoker": updated_app["smoker"],
                "previous_claims": updated_app["previous_claims"],
                "family_history": updated_app["family_history"],
                "insurance_type": updated_app["insurance_type"],
                "coverage_amount": updated_app["coverage_amount"],
                "exercise": updated_app["exercise"],
                "alcohol": updated_app["alcohol"],
                "gender": updated_app["gender"]
            }
            generate_pdf_report(
                customer_data,
                updated_app["risk_class"],
                updated_app["premium"],
                updated_app["report"],
                pdf_filepath
            )
            
        return parse_application_row(updated_app)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
