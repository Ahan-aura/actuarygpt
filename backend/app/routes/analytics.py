from fastapi import APIRouter
from database import get_db_connection

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary")
def get_analytics_summary():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Approved policies aggregations (Life)
    cursor.execute("SELECT COUNT(*), SUM(premium), AVG(risk_class) FROM applications WHERE status = 'approved'")
    stats = cursor.fetchone()
    
    total_policies = stats[0] or 0
    total_premiums = stats[1] or 0.0
    avg_risk_class = round(stats[2], 1) if stats[2] is not None else 0.0
    
    # Processed count (Approved vs. total processed)
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
    
    v_processed = []
    # Add vehicle details to analytics too
    try:
        cursor.execute("SELECT COUNT(*), SUM(policy_annual_premium) FROM vehicle_applications WHERE status = 'approved'")
        v_stats = cursor.fetchone()
        v_total_policies = v_stats[0] or 0
        v_total_premiums = v_stats[1] or 0.0
        
        # Merge stats
        total_policies += v_total_policies
        total_premiums += v_total_premiums
        
        # Add vehicle to processed list
        cursor.execute("SELECT * FROM vehicle_applications WHERE status IN ('approved', 'rejected') ORDER BY date DESC")
        v_processed = [dict(row) for row in cursor.fetchall()]
        
        # Map fields of vehicle applications to match life schema in the dashboard tables if needed
        for vp in v_processed:
            vp["insurance_type"] = "Vehicle"
            vp["premium"] = vp.get("policy_annual_premium")
            vp["risk_category"] = vp.get("risk_category") or ("High Risk" if vp.get("fraud_reported") == "Y" else "Low Risk")
            vp["underwriting_decision"] = vp.get("underwriting_decision") or ("Claim Under Review" if vp.get("status") == "pending" else "Claim Resolved")
            processed_list.append(vp)
            
    except Exception as e:
        print("Vehicle analytics merge failed:", e)
        
    conn.close()
    
    return {
        "total_policies": total_policies,
        "total_premiums": total_premiums,
        "avg_risk_class": avg_risk_class,
        "approval_rate": triage_approval_rate,
        "risk_distribution": risk_distribution,
        "type_premiums": type_premiums,
        "ledger_history": ledger_history,
        "processed_list": processed_list,
        "processed_vehicle_list": v_processed
    }
