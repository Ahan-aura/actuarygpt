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
    
    # 4. Call Gemini to generate RAG explanation with robust fallback template
    try:
        report = explain(customer, risk, premium, confidence, similar_cases)
    except Exception as e:
        print(f"Gemini explanation API call failed, using fallback template: {e}")
        similar_cases_str = ""
        if similar_cases:
            similar_cases_str = "\n".join([
                f"- Application {c['id']} ({c['insurance_type']}): Client: {c['client']}, Similarity: {c['similarity']}%, Risk Class: {c['risk_class']}, Premium: ${c['premium']:.2f}, Status: {c['status']}"
                for c in similar_cases
            ])
        else:
            similar_cases_str = "No similar cases found."

        report = f"""## Actuarial Report: Insurance Application Evaluation (Fallback System)

**Applicant Details:**
*   **Age:** {customer.get('age', 'N/A')}
*   **BMI:** {customer.get('bmi', 'N/A')} (Height: {customer.get('height', 'N/A')}cm, Weight: {customer.get('weight', 'N/A')}kg)
*   **Occupation:** {customer.get('occupation', 'N/A')}
*   **Annual Income:** ${customer.get('income', 0.0):,.2f}
*   **Smoker:** {"Yes" if customer.get('smoker') else "No"}
*   **Previous Claims:** {customer.get('previous_claims', 0)}
*   **Family History:** {"High Risk" if customer.get('family_history') else "Standard"}
*   **Insurance Type:** {customer.get('insurance_type', 'N/A').capitalize()}
*   **Coverage Amount:** ${customer.get('coverage_amount', 0.0):,.2f}

---

### 1. Risk Assessment
*   The applicant has been classified into **Risk Class {risk}** (out of 8, lower is better).
*   Key parameters analyzed: Smoking status ({"Smoker" if customer.get('smoker') else "Non-smoker"}), BMI ({customer.get('bmi', 'N/A')}), and claims history ({customer.get('previous_claims', 0)}).

---

### 2. Comparative Analysis (RAG Context)
Top similar historical cases found:
{similar_cases_str}

---

### 3. Anomaly & Fraud Detection
*   Automatic review of medical and financial parameters indicates a confidence rating of {confidence}%.
*   Please verify the coverage amount relative to reported income and occupation records during final human review.

---

### 4. Premium Recommendation
*   **Calculated Annual Premium:** ${premium:,.2f}
*   This premium pricing is set according to standard underwriting tables for Risk Class {risk}.

---

### 5. Underwriting Decision Recommendation
*   **Recommended Action:** Refer for Manual Review and Data Verification.
*   *Note: This report was compiled using the rule-backed fallback system due to temporary AI model rate limits.*
"""
    
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

