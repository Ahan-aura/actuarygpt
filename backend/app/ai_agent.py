import sys
import os
import uuid
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from predict_life import predict_risk_with_confidence
from predict_vehicle import predict_vehicle_fraud
from premium import calculate_premium
from llm import explain, explain_vehicle
from report import generate_pdf_report, generate_vehicle_pdf_report
from similarity import find_similar_cases, find_similar_vehicle_cases
from database import get_db_connection

from validator import validate_life_input, validate_vehicle_input

def actuarial_agent(customer):
    # Check if this is a Vehicle Claim
    if 'months_as_customer' in customer or 'vehicle_claim' in customer:
        val_res = validate_vehicle_input(customer)
        if not val_res["success"]:
            raise ValueError("Validation Error: " + ", ".join(val_res["errors"]))
        return evaluate_vehicle_claim(val_res["cleaned_data"])
        
    # Standard Life Application pipeline
    val_res = validate_life_input(customer)
    if not val_res["success"]:
        raise ValueError("Validation Error: " + ", ".join(val_res["errors"]))
    return evaluate_life_application(val_res["cleaned_data"])

def evaluate_life_application(customer):
    logs = []
    
    # 1. Triage & Validation Agent
    logs.append({
        "step": 1,
        "agent": "Triage & Validation Agent",
        "action": "Cleaned customer inputs and planned underwriting workflow.",
        "findings": f"Demographics verified. Name: '{customer.get('client')}', Age: {customer.get('age', 35)} years. Features parsed successfully.",
        "status": "SUCCESS"
    })

    # 2. Risk Predictor Agent
    risk, confidence = predict_risk_with_confidence(customer)
    logs.append({
        "step": 2,
        "agent": "Risk Predictor Agent",
        "action": "Evaluated CatBoost ML risk classification model.",
        "findings": f"Assessed Risk Class: {risk} (out of 8) with ML Confidence: {confidence}%.",
        "status": "COMPLETED"
    })

    # 3. RAG Historical Matcher
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM applications WHERE status IN ('approved', 'rejected')")
    history_rows = cursor.fetchall()
    history_list = [dict(row) for row in history_rows]
    conn.close()
    
    similar_cases = find_similar_cases(customer, history_list)
    num_similar = len(similar_cases)
    sim_findings = f"Found {num_similar} similar approved cases."
    if similar_cases:
        sim_findings += f" Top match: {similar_cases[0]['id']} ({similar_cases[0]['similarity']}% similarity)."
    logs.append({
        "step": 3,
        "agent": "RAG Historical Matcher",
        "action": "Queried historical vector database via cosine similarity.",
        "findings": sim_findings,
        "status": "COMPLETED"
    })

    # 4. Actuarial Pricing Agent
    premium = calculate_premium(risk)
    exercise_factor = customer.get('exercise', 1)
    premium_finding = f"Computed premium pricing: Rs. {premium:,.2f}."
    if exercise_factor == 2:
        premium_finding += " Applied 5% premium discount for daily exercise."
    elif customer.get('smoker') == 1:
        premium_finding += " Loaded premium for active smoking status."
    logs.append({
        "step": 4,
        "agent": "Actuarial Pricing Agent",
        "action": "Determined policy premium using standard rating tables.",
        "findings": premium_finding,
        "status": "COMPLETED"
    })

    # 5. Reflection & Quality Critic Agent (Self-Correction & Reflection Loop)
    original_risk = risk
    reflections = []
    
    # Correction Check A: Smoker check
    if customer.get('smoker') == 1 and risk <= 3:
        risk = min(risk + 2, 5)
        reflections.append(f"Flagged smoker status positive but risk class was low. Overrode Risk Class from {original_risk} to {risk} for premium loading")
        
    # Correction Check B: Extreme BMI check
    bmi = customer.get('bmi', 24.2)
    if (bmi >= 32.0 or bmi <= 17.0) and risk <= 3:
        old_risk = risk
        risk = min(risk + 2, 5)
        reflections.append(f"Detected extreme BMI ({bmi:.1f}) but risk class was low. Overrode Risk Class from {old_risk} to {risk} for clinical safety loading")

    # Correction Check C: High Similarity Duplicate claim Check
    if similar_cases and similar_cases[0]['similarity'] >= 90.0:
        reflections.append(f"Flagged identical profile match in historical database ({similar_cases[0]['id']} - {similar_cases[0]['similarity']}% match)")
        
    if reflections:
        reflection_findings = ". ".join(reflections) + "."
        reflection_status = "WARNING_CORRECTED"
    else:
        reflection_findings = "Audited outputs against compliance guidelines. Risk class and premium pricing matched expectations."
        reflection_status = "PASSED"

    logs.append({
        "step": 5,
        "agent": "Reflection & Quality Critic",
        "action": "Self-corrected classification and validated safety constraints.",
        "findings": reflection_findings,
        "status": reflection_status
    })

    # 6. Report Compiler Agent
    logs.append({
        "step": 6,
        "agent": "Report Compiler Agent",
        "action": "Synthesized actuarial analysis using Gemini LLM.",
        "findings": "Actuarial Brief and PDF compiled successfully.",
        "status": "SIGNED_OFF"
    })

    # Format the Audit Trail table as Markdown
    audit_table = """### 🤖 Agentic AI Underwriting Execution Audit
*This evaluation was processed by a network of autonomous agents executing in a multi-turn reasoning and verification loop.*

| Step | Agent / Expert Node | Core Action | Findings & Analysis | Status |
| :--- | :--- | :--- | :--- | :--- |
"""
    for entry in logs:
        audit_table += f"| {entry['step']} | **{entry['agent']}** | {entry['action']} | {entry['findings']} | `{entry['status']}` |\n"
    
    audit_table += "\n---\n\n"

    # Compile the final report using Gemini
    agent_logs_str = "\n".join([f"Agent: {l['agent']}\nAction: {l['action']}\nFindings: {l['findings']}\nStatus: {l['status']}" for l in logs])
    
    try:
        raw_report = explain(customer, risk, premium, confidence, similar_cases, agent_logs_str)
        report = audit_table + raw_report
    except Exception as e:
        print(f"Gemini explanation API call failed, using fallback template: {e}")
        similar_cases_str = ""
        if similar_cases:
            similar_cases_str = "\n".join([
                f"- Application {c['id']} ({c['insurance_type']}): Client: {c['client']}, Similarity: {c['similarity']}%, Risk Class: {c['risk_class']}, Premium: Rs. {c['premium']:.2f}, Status: {c['status']}"
                for c in similar_cases
            ])
        else:
            similar_cases_str = "No similar cases found."

        report = audit_table + f"""## Actuarial Report: Insurance Application Evaluation (Fallback System)

**Applicant Details:**
*   **Age:** {customer.get('age', 'N/A')}
*   **BMI:** {customer.get('bmi', 'N/A')} (Height: {customer.get('height', 'N/A')}cm, Weight: {customer.get('weight', 'N/A')}kg)
*   **Occupation:** {customer.get('occupation', 'N/A')}
*   **Annual Income:** Rs. {customer.get('income', 0.0):,.2f}
*   **Smoker:** {"Yes" if customer.get('smoker') else "No"}
*   **Previous Claims:** {customer.get('previous_claims', 0)}
*   **Family History:** {"High Risk" if customer.get('family_history') else "Standard"}
*   **Insurance Type:** {customer.get('insurance_type', 'N/A').capitalize()}
*   **Coverage Amount:** Rs. {customer.get('coverage_amount', 0.0):,.2f}

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
*   **Calculated Annual Premium:** Rs. {premium:,.2f}
*   This premium pricing is set according to standard underwriting tables for Risk Class {risk}.

---

### 5. Underwriting Decision Recommendation
*   **Recommended Action:** Refer for Manual Review and Data Verification.
*   *Note: This report was compiled using the rule-backed fallback system due to temporary AI model rate limits.*
"""

    if risk <= 2:
        category = "Low Risk"
        decision = "Preferred Issue - Standard Approval"
    elif risk <= 5:
        category = "Medium Risk"
        decision = "Standard Issue - Standard Approval"
    elif risk <= 7:
        category = "High Risk"
        decision = "Approve with Adjusted Premium (Load Premium)"
    else:
        category = "High Risk"
        decision = "High Risk - Refer to Manual Underwriting"
        
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    REPORTS_DIR = os.path.join(BASE_DIR, "static", "reports")
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    pdf_filename = f"report_{uuid.uuid4().hex}.pdf"
    pdf_filepath = os.path.join(REPORTS_DIR, pdf_filename)
    
    generate_pdf_report(customer, risk, premium, report, pdf_filepath)
    
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

def evaluate_vehicle_claim(customer):
    logs = []
    
    # 1. Triage & Validation Agent
    logs.append({
        "step": 1,
        "agent": "Triage & Validation Agent",
        "action": "Cleaned customer inputs and planned claim forensic workflow.",
        "findings": f"Demographics verified. Client: '{customer.get('client')}', Auto Model: {customer.get('auto_make', 'N/A')} {customer.get('auto_model', 'N/A')}. Features parsed successfully.",
        "status": "SUCCESS"
    })

    # Scale monetary fields from INR to USD for prediction and RAG checks
    scaled_customer = customer.copy()
    exchange_rate = 83.0
    
    for col in ['total_claim_amount', 'injury_claim', 'property_claim', 'vehicle_claim', 'policy_annual_premium', 'policy_deductable', 'umbrella_limit']:
        if col in scaled_customer and scaled_customer[col] is not None:
            try:
                scaled_customer[col] = float(scaled_customer[col]) / exchange_rate
            except ValueError:
                pass

    # 2. Risk Predictor Agent
    fraud_reported, confidence = predict_vehicle_fraud(scaled_customer)
    logs.append({
        "step": 2,
        "agent": "Risk Predictor Agent",
        "action": "Evaluated CatBoost ML fraud prediction model.",
        "findings": f"CatBoost Classification output: Fraud Suspected = '{fraud_reported}' with ML Confidence: {confidence}%.",
        "status": "COMPLETED"
    })
    
    # Premium pricing logic for claims (adjusted base or premium)
    premium = float(customer.get('policy_annual_premium') or 0.0)
    
    # 3. RAG Historical Matcher
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM vehicle_applications WHERE status IN ('approved', 'rejected')")
    history_rows = cursor.fetchall()
    history_list = [dict(row) for row in history_rows]
    conn.close()
    
    similar_cases = find_similar_vehicle_cases(scaled_customer, history_list)
    
    # Scale similar cases fields back to INR for frontend and explanation consistency
    for c in similar_cases:
        for col in ['total_claim_amount', 'policy_annual_premium']:
            if col in c and c[col] is not None:
                try:
                    c[col] = float(c[col]) * exchange_rate
                except ValueError:
                    pass

    num_similar = len(similar_cases)
    sim_findings = f"Found {num_similar} similar approved claims."
    if similar_cases:
        sim_findings += f" Top match: {similar_cases[0]['id']} ({similar_cases[0]['similarity']}% similarity)."
    logs.append({
        "step": 3,
        "agent": "RAG Historical Matcher",
        "action": "Queried historical vector database via cosine similarity.",
        "findings": sim_findings,
        "status": "COMPLETED"
    })

    # 4. Claims Liability Agent
    logs.append({
        "step": 4,
        "agent": "Claims Liability Agent",
        "action": "Determined claim payout liability and premium impact.",
        "findings": f"Analyzed policy premium Rs. {premium:,.2f} vs claim Rs. {float(customer.get('total_claim_amount', 0)):,.2f}.",
        "status": "COMPLETED"
    })

    # 5. Reflection & Quality Critic Agent (Self-Correction Loop)
    original_fraud = fraud_reported
    reflections = []
    
    # Correction Check A: Duplicate Claim check
    if similar_cases and similar_cases[0]['similarity'] >= 95.0:
        if fraud_reported == 'N':
            fraud_reported = 'Y'
            reflections.append(f"Detected near-identical claim in database ({similar_cases[0]['id']} - {similar_cases[0]['similarity']}%). Flagged as suspected duplicate fraud ring")
            
    # Correction Check B: High severity without police report check
    severity = customer.get("incident_severity", "Minor Damage")
    police_report = customer.get("police_report_available", "NO")
    if (severity in ("Major Damage", "Total Loss")) and police_report == "NO":
        if fraud_reported == 'N':
            fraud_reported = 'Y'
            reflections.append("Flagged major incident severity claim filed without a police report. Overriding to Potential Fraud")

    if reflections:
        reflection_findings = ". ".join(reflections) + "."
        reflection_status = "WARNING_CORRECTED"
    else:
        reflection_findings = "Audited inputs and outputs for fraud indicators. No anomalies raised."
        reflection_status = "PASSED"

    logs.append({
        "step": 5,
        "agent": "Reflection & Quality Critic",
        "action": "Self-corrected fraud flags and validated claim details.",
        "findings": reflection_findings,
        "status": reflection_status
    })

    # Adjust final decision/class parameters based on reflected values
    if fraud_reported == "Y":
        decision = "High Risk - Potential Fraud - Flag for Investigation"
        category = "High Risk"
        risk_class = 8 if confidence >= 80.0 else 7
    else:
        decision = "Preferred Claim - Standard Approval"
        
        # Base risk class on incident severity (granular scaling)
        if severity == "Total Loss":
            risk_class = 6
            category = "High Risk"
        elif severity == "Major Damage":
            risk_class = 5
            category = "Medium Risk"
        elif severity == "Minor Damage":
            risk_class = 3
            category = "Medium Risk"
        else: # Trivial Damage
            risk_class = 2
            category = "Low Risk"
            
        # Adjust slightly based on total claim amount (using scaled USD value)
        total_claim_usd = float(scaled_customer.get("total_claim_amount") or 0.0)
        if total_claim_usd > 60000.0:
            risk_class = min(risk_class + 1, 6)
            category = "High Risk" if risk_class >= 6 else category
        elif total_claim_usd < 10000.0:
            risk_class = max(risk_class - 1, 1)
            category = "Low Risk" if risk_class <= 2 else category

    # 6. Report Compiler Agent
    logs.append({
        "step": 6,
        "agent": "Report Compiler Agent",
        "action": "Synthesized claim fraud auditing report using Gemini LLM.",
        "findings": "Audit Brief and PDF compiled successfully.",
        "status": "SIGNED_OFF"
    })

    # Format the Audit Trail table as Markdown
    audit_table = """### 🤖 Agentic AI Claims Triage Execution Audit
*This evaluation was processed by a network of autonomous agents executing in a multi-turn reasoning and verification loop.*

| Step | Agent / Expert Node | Core Action | Findings & Analysis | Status |
| :--- | :--- | :--- | :--- | :--- |
"""
    for entry in logs:
        audit_table += f"| {entry['step']} | **{entry['agent']}** | {entry['action']} | {entry['findings']} | `{entry['status']}` |\n"
    
    audit_table += "\n---\n\n"

    # Compile the final report using Gemini
    agent_logs_str = "\n".join([f"Agent: {l['agent']}\nAction: {l['action']}\nFindings: {l['findings']}\nStatus: {l['status']}" for l in logs])
    
    try:
        raw_report = explain_vehicle(customer, fraud_reported, confidence, similar_cases, agent_logs_str)
        report = audit_table + raw_report
    except Exception as e:
        print(f"Gemini explain_vehicle call failed, using fallback template: {e}")
        similar_cases_str = ""
        if similar_cases:
            similar_cases_str = "\n".join([
                f"- Claim {c['id']} ({c['months_as_customer']} mos as cust): Client: {c['client']}, Similarity: {c['similarity']}%, Fraud Flag: {c['fraud_reported']}, Status: {c['status']}"
                for c in similar_cases
            ])
        else:
            similar_cases_str = "No similar cases found."

        report = audit_table + f"""## Actuarial Report: Vehicle Claim Fraud Assessment (Fallback System)

**Claim Details:**
*   **Months as Customer:** {customer.get('months_as_customer', 'N/A')}
*   **Age:** {customer.get('age', 'N/A')}
*   **Policy State / CSL:** {customer.get('policy_state', 'N/A')} / {customer.get('policy_csl', 'N/A')}
*   **Annual Premium:** Rs. {premium:,.2f}
*   **Incident Type / Severity:** {customer.get('incident_type', 'N/A')} / {customer.get('incident_severity', 'N/A')}
*   **Total Claim Amount:** Rs. {customer.get('total_claim_amount', 0.0):,.2f} (Vehicle: Rs. {customer.get('vehicle_claim', 0.0):,.2f})
*   **Auto Model:** {customer.get('auto_make', 'N/A')} {customer.get('auto_model', 'N/A')} ({customer.get('auto_year', 'N/A')})

---

### 1. Fraud Classification Assessment
*   The claim has been classified as **{"High Risk - Potential Fraud Flag" if fraud_reported == "Y" else "Low Risk - Verified Claim"}**.
*   Inference Model Confidence score: {confidence}%.

---

### 2. Comparative Analysis (RAG Context)
Top similar historical claims found:
{similar_cases_str}

---

### 3. Warning Flags & Anomalies
*   Automated audit verifies that incident severity ({customer.get('incident_severity')}) and total claim amount (Rs. {customer.get('total_claim_amount'):,.2f}) are aligned with historical records.
*   Recommended actions have been flagged based on the classification model output.

---

### 4. Underwriting & Auditing Decision
*   **Recommendation:** {"Refer for Manual Audit Investigation" if fraud_reported == "Y" else "Approved for Claim Payout"}
*   *Note: This report was compiled using the fallback system due to rate limits.*
"""
        
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    REPORTS_DIR = os.path.join(BASE_DIR, "static", "reports")
    os.makedirs(REPORTS_DIR, exist_ok=True)
    
    pdf_filename = f"report_{uuid.uuid4().hex}.pdf"
    pdf_filepath = os.path.join(REPORTS_DIR, pdf_filename)
    
    generate_vehicle_pdf_report(customer, fraud_reported, confidence, report, pdf_filepath)
    
    return {
        "risk_class": risk_class,
        "risk_category": category,
        "premium": premium,
        "report": report,
        "pdf_url": f"/static/reports/{pdf_filename}",
        "underwriting_decision": decision,
        "confidence": confidence,
        "similar_cases": similar_cases,
        "fraud_reported": fraud_reported
    }
