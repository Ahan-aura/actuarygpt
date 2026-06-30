import re

import re

def validate_life_input(data: dict):
    errors = []
    cleaned = data.copy()
    
    # Client validation
    client = data.get("client")
    if not client or not str(client).strip():
        errors.append("Client identifier is required.")
    
    # Age validation
    try:
        age = float(data.get("age", 35))
    except (ValueError, TypeError):
        age = 35.0
    cleaned["age"] = age
        
    # Height validation
    try:
        height = float(data.get("height", 170))
    except (ValueError, TypeError):
        height = 170.0
    cleaned["height"] = height
        
    # Weight validation
    try:
        weight = float(data.get("weight", 70))
    except (ValueError, TypeError):
        weight = 70.0
    cleaned["weight"] = weight
        
    # BMI validation / auto-calculation
    try:
        height_m = float(cleaned["height"]) / 100.0
        weight_kg = float(cleaned["weight"])
        if height_m > 0:
            calculated_bmi = round(weight_kg / (height_m ** 2), 1)
            bmi_input = data.get("bmi")
            if not bmi_input or float(bmi_input) == 0.0:
                cleaned["bmi"] = calculated_bmi
            else:
                cleaned["bmi"] = float(bmi_input)
        else:
            cleaned["bmi"] = 24.2
    except (ValueError, TypeError):
        cleaned["bmi"] = 24.2
        
    # Product Info 2 validation
    prod_info = str(data.get("product_info_2", "D3")).strip().upper()
    valid_products = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "B1", "B2", "C1", "C2", "C3", "C4", "D1", "D2", "D3", "D4", "E1"]
    if prod_info not in valid_products:
        prod_info = "D3"
    cleaned["product_info_2"] = prod_info
    
    # Income validation
    try:
        income = float(data.get("income", 50000.0))
    except (ValueError, TypeError):
        income = 50000.0
    cleaned["income"] = income
        
    # Smoker validation
    try:
        smoker = int(data.get("smoker", 0))
        if smoker not in [0, 1]:
            smoker = 0
    except (ValueError, TypeError):
        smoker = 0
    cleaned["smoker"] = smoker
        
    # Claims and Family History validations
    try:
        prev_claims = int(data.get("previous_claims", 0))
        if prev_claims < 0:
            prev_claims = 0
    except (ValueError, TypeError):
        prev_claims = 0
    cleaned["previous_claims"] = prev_claims
        
    try:
        fam_hist = int(data.get("family_history", 0))
        if fam_hist not in [0, 1]:
            fam_hist = 0
    except (ValueError, TypeError):
        fam_hist = 0
    cleaned["family_history"] = fam_hist
        
    # Gender validation
    gender = str(data.get("gender", "Male")).strip().capitalize()
    if gender not in ["Male", "Female"]:
        gender = "Male"
    cleaned["gender"] = gender

    if errors:
        return {
            "success": False,
            "errors": errors,
            "cleaned_data": {}
        }

    return {
        "success": True,
        "errors": [],
        "cleaned_data": cleaned
    }

def validate_vehicle_input(data: dict):
    errors = []
    cleaned = data.copy()
    
    # Client validation
    client = data.get("client")
    if not client or not str(client).strip():
        cleaned["client"] = "customer1"
        
    # Driver Age
    try:
        age = int(data.get("age", 35))
        if age < 16 or age > 100:
            age = 35
    except (ValueError, TypeError):
        age = 35
    cleaned["age"] = age
        
    # Months as Customer
    try:
        months = int(data.get("months_as_customer", 150))
        if months < 0:
            months = 150
    except (ValueError, TypeError):
        months = 150
    cleaned["months_as_customer"] = months
        
    # Premium and claims
    try:
        premium = float(data.get("policy_annual_premium", 1200.0))
        if premium < 0:
            premium = 1200.0
    except (ValueError, TypeError):
        premium = 1200.0
    cleaned["policy_annual_premium"] = premium
        
    try:
        total_claim = float(data.get("total_claim_amount", 5000.0))
        if total_claim < 0:
            total_claim = 5000.0
    except (ValueError, TypeError):
        total_claim = 5000.0
    cleaned["total_claim_amount"] = total_claim
        
    # Hour of the day
    try:
        hour = int(data.get("incident_hour_of_the_day", 12))
        if hour < 0 or hour > 23:
            hour = 12
    except (ValueError, TypeError):
        hour = 12
    cleaned["incident_hour_of_the_day"] = hour
        
    # Vehicles involved
    try:
        num_v = int(data.get("number_of_vehicles_involved", 1))
        if num_v < 1:
            num_v = 1
    except (ValueError, TypeError):
        num_v = 1
    cleaned["number_of_vehicles_involved"] = num_v
        
    return {
        "success": True,
        "errors": [],
        "cleaned_data": cleaned
    }
