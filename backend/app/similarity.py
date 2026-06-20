import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

def find_similar_cases(new_customer: dict, history_list: list):
    """
    Finds top 3 similar cases from the approved history list using cosine similarity.
    
    new_customer: dict containing the new applicant's numerical parameters.
    history_list: list of dicts of historical approved policy applications.
    """
    if not history_list:
        return []

    # Features to compute cosine similarity on
    features = [
        'age', 'height', 'weight', 'bmi', 'income', 
        'smoker', 'previous_claims', 'family_history', 
        'exercise', 'alcohol', 'coverage_amount'
    ]

    import math

    # Helper function to extract normalized numerical vector
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

    # Build vectors
    new_vector = np.array(get_vector(new_customer)).reshape(1, -1)
    
    history_vectors = []
    valid_history = []
    
    for h in history_list:
        # We only match history applications that have been evaluated (have risk_class)
        if h.get('risk_class') is not None:
            history_vectors.append(get_vector(h))
            valid_history.append(h)
            
    if not history_vectors:
        return []
        
    history_matrix = np.array(history_vectors)
    
    # Calculate similarity matrix
    similarities = cosine_similarity(new_vector, history_matrix)[0]
    
    # Bundle similarity scores
    scored_cases = []
    for idx, sim in enumerate(similarities):
        scored_cases.append({
            "id": valid_history[idx].get("id"),
            "client": valid_history[idx].get("client"),
            "risk_class": valid_history[idx].get("risk_class"),
            "risk_category": valid_history[idx].get("risk_category"),
            "premium": valid_history[idx].get("premium"),
            "insurance_type": valid_history[idx].get("insurance_type"),
            "similarity": round(float(sim) * 100, 1),
            "status": valid_history[idx].get("status"),
            "age": valid_history[idx].get("age"),
            "height": valid_history[idx].get("height"),
            "weight": valid_history[idx].get("weight"),
            "bmi": valid_history[idx].get("bmi"),
            "income": valid_history[idx].get("income"),
            "smoker": valid_history[idx].get("smoker"),
            "previous_claims": valid_history[idx].get("previous_claims"),
            "family_history": valid_history[idx].get("family_history"),
            "exercise": valid_history[idx].get("exercise"),
            "alcohol": valid_history[idx].get("alcohol"),
            "coverage_amount": valid_history[idx].get("coverage_amount"),
            "gender": valid_history[idx].get("gender"),
            "occupation": valid_history[idx].get("occupation")
        })
        
    # Sort by similarity descending, return top 3
    scored_cases.sort(key=lambda x: x["similarity"], reverse=True)
    return scored_cases[:3]

