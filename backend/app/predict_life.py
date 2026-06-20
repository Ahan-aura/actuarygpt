import joblib
import pandas as pd
import os

# Robust path resolution to ActuaryGPT/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
models_dir = os.path.join(BASE_DIR, "models", "life")
datasets_dir = os.path.join(BASE_DIR, "datasets")

model = joblib.load(os.path.join(models_dir, "risk_model.pkl"))
encoder = joblib.load(os.path.join(models_dir, "label_encoder.pkl"))
feature_columns = joblib.load(os.path.join(models_dir, "feature_columns.pkl"))

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

# Load dataset to fit defaults on startup
dataset_path = os.path.join(datasets_dir, "prudential_life.csv")
default_values = {}

if os.path.exists(dataset_path):
    try:
        df_dataset = pd.read_csv(dataset_path, nrows=1000)
        df_dataset['Product_Info_2_enc'] = df_dataset['Product_Info_2'].map(PRODUCT_INFO_2_MAP)
        for col in feature_columns:
            if col == "Product_Info_2":
                default_values[col] = float(df_dataset['Product_Info_2_enc'].mode().iloc[0])
            elif col in df_dataset.columns:
                if df_dataset[col].dtype == 'object':
                    default_values[col] = float(df_dataset[col].mode().iloc[0])
                else:
                    mean_val = df_dataset[col].mean()
                    default_values[col] = float(mean_val) if not pd.isna(mean_val) else 0.0
            else:
                default_values[col] = 0.0
    except Exception as e:
        print(f"Error loading defaults from prudential_life.csv: {e}")
        for col in feature_columns:
            default_values[col] = 0.0
else:
    for col in feature_columns:
        default_values[col] = 0.0

def build_feature_row(user_data):
    row = default_values.copy()
    
    # Scale continuous biometric variables
    row["Ins_Age"] = min(max(float(user_data.get("age", 35)) / 80.0, 0.0), 1.0)
    row["Ht"] = min(max(float(user_data.get("height", 170)) / 240.0, 0.0), 1.0)
    row["Wt"] = min(max(float(user_data.get("weight", 70)) / 250.0, 0.0), 1.0)
    row["BMI"] = min(max(float(user_data.get("bmi", 24)) / 55.0, 0.0), 1.0)
    
    # Map smoker status
    smoker_val = int(user_data.get("smoker", 0))
    row["Medical_Keyword_3"] = float(smoker_val)
    row["Medical_History_4"] = 1.0 if smoker_val == 1 else 2.0
    
    # Map previous claims
    prev_claims = int(user_data.get("previous_claims", 0))
    row["Insurance_History_1"] = 2.0 if prev_claims > 0 else 1.0
    
    # Map family history
    fam_history = int(user_data.get("family_history", 0))
    row["Family_Hist_1"] = 3.0 if fam_history == 1 else 2.0
    
    # Encode Product_Info_2
    prod_info_2 = user_data.get("product_info_2", "D3")
    row["Product_Info_2"] = encoder.transform([prod_info_2])[0]
    
    return row

def predict_risk(user_data):
    row = build_feature_row(user_data)
    df = pd.DataFrame([row])
    prediction = model.predict(df)
    
    pred_val = prediction[0]
    if hasattr(pred_val, "__len__") or hasattr(pred_val, "shape"):
        pred_val = pred_val[0]
        
    model_response = int(pred_val) + 1
    underwriting_risk = 9 - model_response
    return underwriting_risk

def predict_risk_with_confidence(user_data):
    row = build_feature_row(user_data)
    df = pd.DataFrame([row])
    prediction = model.predict(df)
    
    pred_val = prediction[0]
    if hasattr(pred_val, "__len__") or hasattr(pred_val, "shape"):
        pred_val = pred_val[0]
        
    pred_class = int(pred_val)
    model_response = pred_class + 1
    
    # Invert class so Response 8 is risk_class 1, Response 1 is risk_class 8
    risk_class = 9 - model_response
    
    confidence = 90.0  # default fallback
    if hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(df)[0]
            if pred_class < len(probs):
                confidence = float(probs[pred_class]) * 100
        except Exception:
            pass
            
    return risk_class, round(confidence, 1)
