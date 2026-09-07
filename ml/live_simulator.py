import time
import random
import joblib
import pandas as pd


# Load our trained AI model
model = joblib.load("lt_shield_model.pkl")


def generate_normal_reading():
    """Generate a normal LT electrical reading."""

    voltage = random.uniform(225, 235)
    current = random.uniform(6, 10)
    power_factor = random.uniform(0.90, 0.98)
    frequency = random.uniform(49.9, 50.1)
    phase_imbalance = random.uniform(0, 5)

    power = voltage * current * power_factor / 1000

    return {
        "voltage_v": voltage,
        "current_a": current,
        "power_kw": power,
        "power_factor": power_factor,
        "frequency_hz": frequency,
        "phase_imbalance_pct": phase_imbalance
    }


def generate_fault_reading(step):
    """Simulate an LT line problem."""

    # Gradually reduce voltage
    voltage = max(70, 230 - (step * 20))

    # Current also becomes abnormal
    current = max(0.2, 8 - (step * 1.2))

    power_factor = max(0.40, 0.94 - (step * 0.08))

    frequency = random.uniform(49.7, 50.3)

    phase_imbalance = min(40, 3 + (step * 5))

    power = voltage * current * power_factor / 1000

    return {
        "voltage_v": voltage,
        "current_a": current,
        "power_kw": power,
        "power_factor": power_factor,
        "frequency_hz": frequency,
        "phase_imbalance_pct": phase_imbalance
    }


def predict(reading):

    features = [
        "voltage_v",
        "current_a",
        "power_kw",
        "power_factor",
        "frequency_hz",
        "phase_imbalance_pct"
    ]

    data = pd.DataFrame([reading])

    prediction = model.predict(data)[0]

    confidence = model.predict_proba(data).max()

    return prediction, confidence


print("\n========================================")
print("          LT-SHIELD LIVE MONITOR")
print("========================================")

print("\n1 = Normal simulation")
print("2 = Simulate LT line break")

choice = input("\nEnter choice: ")


if choice == "1":

    print("\nStarting normal LT monitoring...\n")

    for i in range(20):

        reading = generate_normal_reading()

        prediction, confidence = predict(reading)

        print(
            f"Voltage: {reading['voltage_v']:.1f} V | "
            f"Current: {reading['current_a']:.2f} A | "
            f"Power: {reading['power_kw']:.2f} kW"
        )

        print(
            f"AI Status: {prediction} | "
            f"Confidence: {confidence * 100:.1f}%"
        )

        print("----------------------------------------")

        time.sleep(1)


elif choice == "2":

    print("\n🚨 LT LINE BREAK SIMULATION STARTED\n")

    for step in range(1, 9):

        reading = generate_fault_reading(step)

        prediction, confidence = predict(reading)

        print(
            f"Voltage: {reading['voltage_v']:.1f} V | "
            f"Current: {reading['current_a']:.2f} A | "
            f"Power: {reading['power_kw']:.2f} kW"
        )

        print(
            f"AI Status: {prediction} | "
            f"Confidence: {confidence * 100:.1f}%"
        )

        print("----------------------------------------")

        time.sleep(1)

else:

    print("Invalid choice.")