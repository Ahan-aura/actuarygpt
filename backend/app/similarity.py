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

    # Helper function to extract numerical vector
    def get_vector(data_dict):
        vec = []
        for f in features:
            val = data_dict.get(f)
            # Default missing/None to 0
            if val is None or val == "":
                val = 0.0
            else:
                try:
                    val = float(val)
                except ValueError:
                    val = 0.0
            vec.append(val)
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

