import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


# 1. Load dataset
data = pd.read_csv("data/LT_Shield_synthetic_training_data.csv")

print("Dataset loaded!")
print("Total records:", len(data))


# 2. Select the electrical features
features = [
    "voltage_v",
    "current_a",
    "power_kw",
    "power_factor",
    "frequency_hz",
    "phase_imbalance_pct"
]

X = data[features]

# Target we want AI to predict
y = data["status"]


# 3. Split data into training and testing
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("Training records:", len(X_train))
print("Testing records:", len(X_test))


# 4. Create AI model
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced"
)


# 5. Train AI
print("\nTraining LT-SHIELD AI...")
model.fit(X_train, y_train)

print("Training completed!")


# 6. Test AI
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("\nAI Accuracy:", round(accuracy * 100, 2), "%")


# 7. Detailed performance
print("\nClassification Report:")
print(classification_report(y_test, predictions))


# 8. Save trained model
joblib.dump(model, "lt_shield_model.pkl")

print("\nModel saved successfully!")
print("File: ml/lt_shield_model.pkl")