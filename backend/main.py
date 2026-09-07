from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================
# LT-SHIELD AI - FASTAPI BACKEND
# ============================================================

app = FastAPI(
    title="LT-SHIELD AI",
    description="AI-based LT line fault detection system",
    version="1.0.0"
)


# ============================================================
# CORS CONFIGURATION
# ============================================================
#
# Frontend:
# https://biswojit-09.github.io/LT-SHIELD/
#
# IMPORTANT:
# CORS uses only the origin:
# https://biswojit-09.github.io
#
# Do NOT add /LT-SHIELD/ here.
# ============================================================

ALLOWED_ORIGINS = [
    # Local development
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:5174",
    "http://127.0.0.1:5174",

    "http://localhost:5177",
    "http://127.0.0.1:5177",

    # GitHub Pages
    "https://biswojit-09.github.io",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# MODEL PATH
# ============================================================
#
# Expected structure:
#
# LT-SHIELD/
#
# ├── backend/
# │   ├── main.py
# │   ├── lt_shield_model.pkl
# │   └── requirements.txt
# │
# └── frontend/
#
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "lt_shield_model.pkl"


# ============================================================
# LOAD AI MODEL
# ============================================================

print()
print("=" * 60)
print("                 LT-SHIELD AI")
print("=" * 60)

print("Backend directory :", BASE_DIR)
print("Model path        :", MODEL_PATH)
print("Model exists      :", MODEL_PATH.exists())

model = None

try:

    if not MODEL_PATH.exists():

        print()
        print("WARNING: AI MODEL FILE NOT FOUND")
        print("Expected file:")
        print(MODEL_PATH)
        print()

    else:

        model = joblib.load(MODEL_PATH)

        print()
        print("AI MODEL LOADED SUCCESSFULLY")
        print("Model type:", type(model))

except Exception as e:

    print()
    print("AI MODEL LOAD FAILED")
    print("Error:", repr(e))

print("=" * 60)
print()


# ============================================================
# ELECTRICAL DATA MODEL
# ============================================================

class ElectricalData(BaseModel):

    voltage_v: float
    current_a: float
    power_kw: float
    power_factor: float
    frequency_hz: float
    phase_imbalance_pct: float


# ============================================================
# ROOT / HOME API
# ============================================================

@app.get("/")
def home():

    return {
        "system": "LT-SHIELD AI",
        "status": "online",
        "version": "1.0.0",
        "model_loaded": model is not None,
        "model_exists": MODEL_PATH.exists(),
        "message": "LT fault detection API is running successfully"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "service": "LT-SHIELD AI",
        "model_loaded": model is not None
    }


# ============================================================
# MODEL STATUS API
# ============================================================

@app.get("/model-status")
def model_status():

    return {
        "model_loaded": model is not None,
        "model_exists": MODEL_PATH.exists(),
        "model_path": str(MODEL_PATH),
        "model_filename": MODEL_PATH.name
    }


# ============================================================
# PREDICTION API
# ============================================================

@app.post("/predict")
def predict(data: ElectricalData):

    # --------------------------------------------------------
    # CHECK MODEL
    # --------------------------------------------------------

    if model is None:

        raise HTTPException(
            status_code=503,
            detail=(
                "AI model is not loaded. "
                "Make sure lt_shield_model.pkl "
                "is present inside the backend folder."
            )
        )


    # --------------------------------------------------------
    # PREPARE INPUT DATA
    # --------------------------------------------------------

    input_data = pd.DataFrame([
        {
            "voltage_v": data.voltage_v,
            "current_a": data.current_a,
            "power_kw": data.power_kw,
            "power_factor": data.power_factor,
            "frequency_hz": data.frequency_hz,
            "phase_imbalance_pct": data.phase_imbalance_pct
        }
    ])


    # --------------------------------------------------------
    # AI PREDICTION
    # --------------------------------------------------------

    try:

        prediction = model.predict(input_data)[0]

        # Check whether model supports probability
        if hasattr(model, "predict_proba"):

            probabilities = model.predict_proba(input_data)

            confidence = probabilities.max()

        else:

            confidence = None


    except Exception as e:

        print()
        print("PREDICTION ERROR")
        print(repr(e))
        print()

        raise HTTPException(
            status_code=500,
            detail=f"AI prediction failed: {str(e)}"
        )


    # --------------------------------------------------------
    # PREPARE RESPONSE
    # --------------------------------------------------------

    response = {

        "success": True,

        "prediction": str(prediction),

        "voltage": data.voltage_v,

        "current": data.current_a,

        "power": data.power_kw,

        "power_factor": data.power_factor,

        "frequency": data.frequency_hz,

        "phase_imbalance": data.phase_imbalance_pct
    }


    # --------------------------------------------------------
    # ADD CONFIDENCE
    # --------------------------------------------------------

    if confidence is not None:

        response["confidence"] = round(
            float(confidence) * 100,
            2
        )

    else:

        response["confidence"] = None


    return response


# ============================================================
# API INFORMATION
# ============================================================

@app.get("/api-info")
def api_info():

    return {

        "name": "LT-SHIELD AI",

        "version": "1.0.0",

        "description":
            "AI-based LT line fault detection system",

        "endpoints": {

            "home": "GET /",

            "health": "GET /health",

            "model_status": "GET /model-status",

            "prediction": "POST /predict",

            "documentation": "GET /docs"

        },

        "model_loaded": model is not None

    }


# ============================================================
# SERVER START
# ============================================================
#
# LOCAL:
#   python main.py
#
# RENDER:
#   uvicorn main:app --host 0.0.0.0 --port $PORT
#
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )