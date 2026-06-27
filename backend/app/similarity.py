import numpy as np
import math
from sklearn.metrics.pairwise import cosine_similarity

# Features list for Life claims
features = [
    'age', 'height', 'weight', 'bmi', 'income', 
    'smoker', 'previous_claims', 'family_history', 
    'exercise', 'alcohol', 'coverage_amount'
]

# Helper function to extract normalized numerical vector for Life claims
def get_vector(data_dict):
    vec = []
    
    # 1. age: range [0, 1] (already normalized in database)
    age = float(data_dict.get('age') or 0.0)
    vec.append(age)
    
    # 2. height: typical range [120, 220]
    height = float(data_dict.get('height') or 170.0)
    height_norm = max(0.0, min(1.0, (height - 120.0) / 100.0))
    vec.append(height_norm)
    
    # 3. weight: typical range [40, 160]
    weight = float(data_dict.get('weight') or 70.0)
    weight_norm = max(0.0, min(1.0, (weight - 40.0) / 120.0))
    vec.append(weight_norm)
    
    # 4. bmi: typical range [15, 45]
    bmi = float(data_dict.get('bmi') or 22.0)
    bmi_norm = max(0.0, min(1.0, (bmi - 15.0) / 30.0))
    vec.append(bmi_norm)
    
    # 5. income: range [0, 10,000,000] -> log10 scale (normalize up to log10(10M)=7)
    income = float(data_dict.get('income') or 0.0)
    income_log = math.log10(max(1.0, income))
    income_norm = max(0.0, min(1.0, income_log / 7.0))
    vec.append(income_norm)
    
    # 6. smoker: [0, 1]
    smoker = float(data_dict.get('smoker') or 0.0)
    vec.append(smoker)
    
    # 7. previous_claims: range [0, 3] -> normalize as claims / 3.0
    prev_claims = float(data_dict.get('previous_claims') or 0.0)
    vec.append(prev_claims / 3.0)
    
    # 8. family_history: [0, 1]
    fam_hist = float(data_dict.get('family_history') or 0.0)
    vec.append(fam_hist)
    
    # 9. exercise: range [0, 3] -> normalize as exercise / 3.0
    exercise = float(data_dict.get('exercise') or 1.0)
    vec.append(exercise / 3.0)
    
    # 10. alcohol: range [0, 3] -> normalize as alcohol / 3.0
    alcohol = float(data_dict.get('alcohol') or 0.0)
    vec.append(alcohol / 3.0)
    
    # 11. coverage_amount: range [0, 15,000,000] -> log10 scale (normalize up to log10(15M)=7.17)
    coverage = float(data_dict.get('coverage_amount') or 0.0)
    coverage_log = math.log10(max(1.0, coverage))
    coverage_norm = max(0.0, min(1.0, coverage_log / 7.2))
    vec.append(coverage_norm)
    
    return vec

def find_similar_cases(new_customer: dict, history_list: list):
    """
    Finds top 3 similar cases from the approved history list using cosine similarity for Life claims.
    """
    if not history_list:
        return []

    new_vector = np.array(get_vector(new_customer)).reshape(1, -1)
    
    history_vectors = []
    valid_history = []
    
    for h in history_list:
        if h.get('risk_class') is not None:
            history_vectors.append(get_vector(h))
            valid_history.append(h)
            
    if not history_vectors:
        return []
        
    history_matrix = np.array(history_vectors)
    similarities = cosine_similarity(new_vector, history_matrix)[0]
    
    scored_cases = []
    for idx, sim in enumerate(similarities):
        vh = valid_history[idx]
        scored_cases.append({
            "id": vh.get("id"),
            "client": vh.get("client"),
            "risk_class": vh.get("risk_class"),
            "risk_category": vh.get("risk_category"),
            "premium": vh.get("premium"),
            "insurance_type": vh.get("insurance_type"),
            "similarity": round(float(sim) * 100, 1),
            "status": vh.get("status"),
            "age": vh.get("age"),
            "height": vh.get("height"),
            "weight": vh.get("weight"),
            "bmi": vh.get("bmi"),
            "income": vh.get("income"),
            "smoker": vh.get("smoker"),
            "previous_claims": vh.get("previous_claims"),
            "family_history": vh.get("family_history"),
            "exercise": vh.get("exercise"),
            "alcohol": vh.get("alcohol"),
            "coverage_amount": vh.get("coverage_amount"),
            "gender": vh.get("gender"),
            "occupation": vh.get("occupation")
        })
        
    scored_cases.sort(key=lambda x: x["similarity"], reverse=True)
    return scored_cases[:3]


def find_similar_vehicle_cases(new_customer: dict, history_list: list):
    """
    Finds top 3 similar cases from the approved history list using cosine similarity for Vehicle claims.
    """
    if not history_list:
        return []
    
    def get_vehicle_vector(data_dict):
        vec = []
        # 1. months_as_customer
        months = float(data_dict.get('months_as_customer') or 0.0)
        vec.append(months / 500.0)
        # 2. age
        age = float(data_dict.get('age') or 35.0)
        vec.append(age / 100.0)
        # 3. policy_annual_premium
        premium = float(data_dict.get('policy_annual_premium') or 1000.0)
        vec.append(premium / 3000.0)
        # 4. umbrella_limit
        umbrella = float(data_dict.get('umbrella_limit') or 0.0)
        vec.append(umbrella / 10000000.0)
        # 5. total_claim_amount
        total_claim = float(data_dict.get('total_claim_amount') or 0.0)
        vec.append(total_claim / 150000.0)
        # 6. incident_hour_of_the_day
        hour = float(data_dict.get('incident_hour_of_the_day') or 12.0)
        vec.append(hour / 24.0)
        # 7. number_of_vehicles_involved
        num_v = float(data_dict.get('number_of_vehicles_involved') or 1.0)
        vec.append(num_v / 5.0)
        # 8. bodily_injuries
        inj = float(data_dict.get('bodily_injuries') or 0.0)
        vec.append(inj / 5.0)
        # 9. witnesses
        wit = float(data_dict.get('witnesses') or 0.0)
        vec.append(wit / 5.0)
        # 10. injury_claim
        injury_c = float(data_dict.get('injury_claim') or 0.0)
        vec.append(injury_c / 50000.0)
        # 11. property_claim
        prop_c = float(data_dict.get('property_claim') or 0.0)
        vec.append(prop_c / 50000.0)
        # 12. vehicle_claim
        veh_c = float(data_dict.get('vehicle_claim') or 0.0)
        vec.append(veh_c / 100000.0)
        return vec

    new_vector = np.array(get_vehicle_vector(new_customer)).reshape(1, -1)
    
    history_vectors = []
    valid_history = []
    
    for h in history_list:
        history_vectors.append(get_vehicle_vector(h))
        valid_history.append(h)
            
    if not history_vectors:
        return []
        
    history_matrix = np.array(history_vectors)
    similarities = cosine_similarity(new_vector, history_matrix)[0]
    
    scored_cases = []
    for idx, sim in enumerate(similarities):
        vh = valid_history[idx]
        # Determine status
        status_val = vh.get("status") or ("rejected" if vh.get("fraud_reported") == "Y" else "approved")
        scored_cases.append({
            "id": vh.get("id"),
            "client": vh.get("client"),
            "months_as_customer": vh.get("months_as_customer"),
            "age": vh.get("age"),
            "policy_annual_premium": vh.get("policy_annual_premium"),
            "total_claim_amount": vh.get("total_claim_amount"),
            "incident_severity": vh.get("incident_severity"),
            "fraud_reported": vh.get("fraud_reported") or ("Y" if status_val == "rejected" else "N"),
            "similarity": round(float(sim) * 100, 1),
            "status": status_val,
            "auto_make": vh.get("auto_make"),
            "auto_model": vh.get("auto_model"),
            "auto_year": vh.get("auto_year"),
            "incident_type": vh.get("incident_type"),
            "collision_type": vh.get("collision_type")
        })
        
    scored_cases.sort(key=lambda x: x["similarity"], reverse=True)
    return scored_cases[:3]
