import joblib
import pandas as pd

# Load trained AI model
model = joblib.load("lt_shield_model.pkl")

# New electrical reading
sample = pd.DataFrame([{
    "voltage_v": 333,
    "current_a": 8,
    "power_kw": 1.7,
    "power_factor": 0.94,
    "frequency_hz": 50.0,
    "phase_imbalance_pct": 2py
}])

# Make prediction
prediction = model.predict(sample)[0]

# Get confidence
confidence = model.predict_proba(sample).max()

print("\n==============================")
print("       LT-SHIELD AI")
print("==============================")

print("Prediction :", prediction)
print("Confidence :", round(confidence * 100, 2), "%")

print("==============================")