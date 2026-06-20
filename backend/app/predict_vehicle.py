import joblib
import pandas as pd
import os
from sklearn.preprocessing import LabelEncoder

# Robust path resolution to ActuaryGPT/
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
models_dir = os.path.join(BASE_DIR, "models", "vehicle")
datasets_dir = os.path.join(BASE_DIR, "datasets")

# Load model, columns, label encoder
model = joblib.load(os.path.join(models_dir, "vehicle_claim_model.pkl"))
feature_columns = joblib.load(os.path.join(models_dir, "vehicle_columns.pkl"))
target_encoder = joblib.load(os.path.join(models_dir, "vehicle_label_encoder.pkl"))

# Load dataset to fit encoders on startup
dataset_path = os.path.join(datasets_dir, "insurance_claims.csv")
df_dataset = pd.read_csv(dataset_path)

encoders = {}
for col in feature_columns:
    if col in df_dataset.columns and df_dataset[col].dtype == 'object':
        le = LabelEncoder()
        # Fit on dataset values (converting to string)
        le.fit(df_dataset[col].astype(str))
        encoders[col] = le

def predict_vehicle_fraud(user_data):
    """
    Predicts vehicle claim fraud using the CatBoost model.
    user_data: dict containing vehicle application inputs.
    """
    row = {}
    for col in feature_columns:
        val = user_data.get(col)
        # Default missing values appropriately
        if val is None or val == "":
            if col in df_dataset.columns:
                if df_dataset[col].dtype == 'object':
                    val = str(df_dataset[col].mode()[0])
                else:
                    val = float(df_dataset[col].mean())
            else:
                val = 0.0
        
        # Apply encoding if column is categorical
        if col in encoders:
            try:
                encoded_val = int(encoders[col].transform([str(val)])[0])
            except Exception:
                encoded_val = 0
            row[col] = encoded_val
        else:
            try:
                row[col] = float(val)
            except Exception:
                row[col] = 0.0
            
    df = pd.DataFrame([row])
    
    # Run prediction
    pred_val = model.predict(df)
    if hasattr(pred_val, "__len__") or hasattr(pred_val, "shape"):
        pred_val = pred_val[0]
        
    pred_class = int(pred_val)
    
    # Calculate confidence
    confidence = 85.0
    if hasattr(model, "predict_proba"):
        try:
            probs = model.predict_proba(df)[0]
            if pred_class < len(probs):
                confidence = float(probs[pred_class]) * 100
        except Exception:
            pass
            
    # Decode decision ('N' or 'Y')
    fraud_flag = str(target_encoder.inverse_transform([pred_class])[0])
    
    return fraud_flag, round(confidence, 1)
