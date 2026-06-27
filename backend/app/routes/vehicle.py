from fastapi import APIRouter, HTTPException
from typing import Optional
from schemas import DecisionRequest
from pydantic import BaseModel
from datetime import datetime
import uuid
import json
from database import get_db_connection
from ai_agent import actuarial_agent

router = APIRouter(prefix="/applications/vehicle", tags=["vehicle"])

class VehicleApplicationCreate(BaseModel):
    client: str
    months_as_customer: int
    age: int
    policy_state: str
    policy_csl: str
    policy_deductable: float
    policy_annual_premium: float
    umbrella_limit: float
    insured_sex: str
    insured_education_level: str
    insured_occupation: str
    insured_hobbies: str
    insured_relationship: str
    capital_gains: float
    capital_loss: float
    incident_type: str
    collision_type: str
    incident_severity: str
    authorities_contacted: str
    incident_state: str
    incident_city: str
    incident_hour_of_the_day: int
    number_of_vehicles_involved: int
    property_damage: str
    bodily_injuries: int
    witnesses: int
    police_report_available: str
    total_claim_amount: float
    injury_claim: float
    property_claim: float
    vehicle_claim: float
    auto_make: str
    auto_model: str
    auto_year: int
    medical_bill: Optional[str] = None

def parse_vehicle_row(row):
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
def get_vehicle_applications(client: Optional[str] = None, status: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM vehicle_applications WHERE 1=1"
    params = []
    if client:
        query += " AND LOWER(client) = LOWER(?)"
        params.append(client)
    if status:
        query += " AND status = ?"
        params.append(status)
    query += " ORDER BY date DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [parse_vehicle_row(row) for row in rows]

@router.post("")
def create_vehicle_application(req: VehicleApplicationCreate):
    conn = get_db_connection()
    cursor = conn.cursor()
    app_id = f"VEH-{uuid.uuid4().hex[:6].upper()}"
    date_str = datetime.now().strftime("%Y-%m-%d")
    try:
        cursor.execute("""
        INSERT INTO vehicle_applications (
            id, client, months_as_customer, age, policy_state, policy_csl, policy_deductable,
            policy_annual_premium, umbrella_limit, insured_sex, insured_education_level,
            insured_occupation, insured_hobbies, insured_relationship, capital_gains, capital_loss,
            incident_type, collision_type, incident_severity, authorities_contacted, incident_state,
            incident_city, incident_hour_of_the_day, number_of_vehicles_involved, property_damage,
            bodily_injuries, witnesses, police_report_available, total_claim_amount, injury_claim,
            property_claim, vehicle_claim, auto_make, auto_model, auto_year, date, status, medical_bill
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            app_id, req.client, req.months_as_customer, req.age, req.policy_state, req.policy_csl,
            req.policy_deductable, req.policy_annual_premium, req.umbrella_limit, req.insured_sex,
            req.insured_education_level, req.insured_occupation, req.insured_hobbies, req.insured_relationship,
            req.capital_gains, req.capital_loss, req.incident_type, req.collision_type, req.incident_severity,
            req.authorities_contacted, req.incident_state, req.incident_city, req.incident_hour_of_the_day,
            req.number_of_vehicles_involved, req.property_damage, req.bodily_injuries, req.witnesses,
            req.police_report_available, req.total_claim_amount, req.injury_claim, req.property_claim,
            req.vehicle_claim, req.auto_make, req.auto_model, req.auto_year, date_str, 'pending', req.medical_bill
        ))
        conn.commit()
        cursor.execute("SELECT * FROM vehicle_applications WHERE id = ?", (app_id,))
        new_app = cursor.fetchone()
        return parse_vehicle_row(new_app)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/{id}/evaluate")
def evaluate_vehicle_application(id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vehicle_applications WHERE id = ?", (id,))
    app_row = cursor.fetchone()
    if not app_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle Claim Application not found")
        
    customer_data = dict(app_row)
    
    try:
        agent_result = actuarial_agent(customer_data)
        cursor.execute("""
        UPDATE vehicle_applications SET
            fraud_reported = ?,
            confidence = ?,
            report = ?,
            pdf_url = ?,
            underwriting_decision = ?,
            similar_cases = ?,
            risk_class = ?,
            risk_category = ?
        WHERE id = ?
        """, (
            agent_result["fraud_reported"],
            agent_result["confidence"],
            agent_result["report"],
            agent_result["pdf_url"],
            agent_result["underwriting_decision"],
            json.dumps(agent_result["similar_cases"]),
            agent_result.get("risk_class"),
            agent_result.get("risk_category"),
            id
        ))
        conn.commit()
        cursor.execute("SELECT * FROM vehicle_applications WHERE id = ?", (id,))
        updated_app = cursor.fetchone()
        return parse_vehicle_row(updated_app)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent vehicle analysis failed: {str(e)}")
    finally:
        conn.close()

@router.post("/{id}/decide")
def decide_vehicle_application(id: str, req: DecisionRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vehicle_applications WHERE id = ?", (id,))
    app_row = cursor.fetchone()
    if not app_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Vehicle claim application not found")
        
    new_status = 'approved' if req.decision == 'approve' else ('rejected' if req.decision == 'reject' else 'pending')
    underwriting_decision = 'Referred for Manual Underwriting' if req.decision == 'manual_review' else None
    
    try:
        if req.modified_amount is not None:
            cursor.execute("UPDATE vehicle_applications SET total_claim_amount = ? WHERE id = ?", (req.modified_amount, id))
            
        if underwriting_decision:
            cursor.execute("UPDATE vehicle_applications SET status = ?, underwriting_decision = ? WHERE id = ?", (new_status, underwriting_decision, id))
        else:
            cursor.execute("UPDATE vehicle_applications SET status = ? WHERE id = ?", (new_status, id))
            
        conn.commit()
        
        # Regenerate PDF to inherit the modified amount / status
        cursor.execute("SELECT * FROM vehicle_applications WHERE id = ?", (id,))
        updated_app = cursor.fetchone()
        if updated_app and updated_app["pdf_url"]:
            from report import generate_vehicle_pdf_report
            import os
            pdf_relative_path = updated_app["pdf_url"].lstrip("/")
            app_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            pdf_filepath = os.path.join(app_dir, pdf_relative_path)
            
            customer_data = dict(updated_app)
            generate_vehicle_pdf_report(
                customer_data,
                updated_app["fraud_reported"],
                updated_app["confidence"],
                updated_app["report"],
                pdf_filepath
            )
            
        return parse_vehicle_row(updated_app)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
