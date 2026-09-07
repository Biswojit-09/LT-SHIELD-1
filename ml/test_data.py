import pandas as pd

# Load LT-SHIELD dataset
data = pd.read_csv("../data/LT_Shield_synthetic_training_data.csv")

print("\n--- FIRST 5 ROWS ---")
print(data.head())

print("\n--- DATASET SIZE ---")
print(data.shape)

print("\n--- COLUMNS ---")
print(data.columns.tolist())

print("\n--- STATUS COUNTS ---")
print(data["status"].value_counts())