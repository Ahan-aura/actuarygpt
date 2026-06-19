import sys
import os
import uuid

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from predict import predict_risk_with_confidence
from premium import calculate_premium
from llm import explain
from report import generate_pdf_report
from similarity import find_similar_cases
from db import get_db_connection

def actuarial_agent(customer):
    # 1. Predict risk with confidence
    risk, confidence = predict_risk_with_confidence(customer)
    
    # 2. Calculate premium
    premium = calculate_premium(risk)
    
    # 3. Retrieve historical cases (approved & rejected) from DB and match similarity
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications WHERE status IN ('approved', 'rejected')")
    history_rows = cursor.fetchall()
    history_list = [dict(row) for row in history_rows]
    conn.close()
    
    similar_cases = find_similar_cases(customer, history_list)
    
    # 4. Call Gemini to generate RAG explanation
    report = explain(customer, risk, premium, confidence, similar_cases)
    
    # 5. Determine risk category
    if risk <= 2:
        category = "Low Risk"
    elif risk <= 5:
        category = "Medium Risk"
    else:
        category = "High Risk"
        
    # 6. Recommend Underwriting Decision
    if risk <= 2:
        decision = "Preferred Issue - Standard Approval"
    elif risk <= 5:
        decision = "Standard Issue - Standard Approval"
    elif risk <= 7:
        decision = "Approve with Adjusted Premium (Load Premium)"
    else:
        decision = "High Risk - Refer to Manual Underwriting"
        
    # 7. Generate Actuarial PDF Report
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    REPORTS_DIR = os.path.join(BASE_DIR, "static", "reports")
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    pdf_filename = f"report_{uuid.uuid4().hex}.pdf"
    pdf_filepath = os.path.join(REPORTS_DIR, pdf_filename)
    
    generate_pdf_report(customer, risk, premium, report, pdf_filepath)
    
    # 8. Return complete result
    return {
        "risk_class": risk,
        "risk_category": category,
        "premium": premium,
        "report": report,
        "pdf_url": f"/static/reports/{pdf_filename}",
        "underwriting_decision": decision,
        "confidence": confidence,
        "similar_cases": similar_cases
    }

