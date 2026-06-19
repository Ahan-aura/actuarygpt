import joblib
import pandas as pd
import os

# Try standard path first, fallback to robust path
try:
    model = joblib.load("../models/risk_model.pkl")
    encoder = joblib.load("../models/label_encoder.pkl")
    feature_columns = joblib.load("../models/feature_columns.pkl")
except Exception:
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model = joblib.load(os.path.join(BASE_DIR, "models", "risk_model.pkl"))
    encoder = joblib.load(os.path.join(BASE_DIR, "models", "label_encoder.pkl"))
    feature_columns = joblib.load(os.path.join(BASE_DIR, "models", "feature_columns.pkl"))

# Patch encoder.transform to handle Product_Info_2 string values correctly
PRODUCT_INFO_2_MAP = {
    "A1": 0.0, "A2": 1.0, "A3": 2.0, "A4": 3.0, "A5": 4.0, "A6": 5.0, "A7": 6.0, "A8": 7.0,
    "B1": 8.0, "B2": 9.0,
    "C1": 10.0, "C2": 11.0, "C3": 12.0, "C4": 13.0,
    "D1": 14.0, "D2": 15.0, "D3": 16.0, "D4": 17.0,
    "E1": 18.0
}

_orig_transform = encoder.transform
def patched_transform(y):
    try:
        first_val = y.iloc[0] if hasattr(y, "iloc") else y[0]
        if isinstance(first_val, str) and first_val.upper() in PRODUCT_INFO_2_MAP:
            if hasattr(y, "map"):
                return y.map(lambda x: PRODUCT_INFO_2_MAP.get(str(x).upper(), 0.0))
            return [PRODUCT_INFO_2_MAP.get(str(x).upper(), 0.0) for x in y]
    except Exception:
        pass
    return _orig_transform(y)

encoder.transform = patched_transform

def predict_risk(user_data):
    row = {}
    
    # Initialize all 121 features to 0
    for feature in feature_columns:
        row[feature] = 0
        
    # Map user inputs
    row["Ins_Age"] = user_data["age"]
    row["Ht"] = user_data["height"]
    row["Wt"] = user_data["weight"]
    row["BMI"] = user_data["bmi"]
    
    row["Product_Info_2"] = user_data["product_info_2"]
    
    # Encode Product_Info_2
    row["Product_Info_2"] = encoder.transform(
        [row["Product_Info_2"]]
    )[0]
    
    df = pd.DataFrame([row])
    
    prediction = model.predict(df)
    
    pred_val = prediction[0]
    if hasattr(pred_val, "__len__") or hasattr(pred_val, "shape"):
        pred_val = pred_val[0]
        
    return int(pred_val) + 1

def predict_risk_with_confidence(user_data):
    row = {}
    for feature in feature_columns:
        row[feature] = 0
    row["Ins_Age"] = user_data["age"]
    row["Ht"] = user_data["height"]
    row["Wt"] = user_data["weight"]
    row["BMI"] = user_data["bmi"]
    row["Product_Info_2"] = user_data["product_info_2"]
    row["Product_Info_2"] = encoder.transform([row["Product_Info_2"]])[0]
    
    df = pd.DataFrame([row])
    prediction = model.predict(df)
    
    pred_val = prediction[0]
    if hasattr(pred_val, "__len__") or hasattr(pred_val, "shape"):
        pred_val = pred_val[0]
    pred_class = int(pred_val)
    
    confidence = 90.0  # default fallback
    if hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(df)[0]
            if pred_class < len(probs):
                confidence = float(probs[pred_class]) * 100
        except Exception:
            pass
            
    risk_class = pred_class + 1
    return risk_class, round(confidence, 1)


