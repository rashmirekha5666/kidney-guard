import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib

# Load dataset
df = pd.read_csv('kidney_disease.csv')

# Data Cleaning
# Drop 'id' as it's just an index
df.drop('id', axis=1, inplace=True)

# Map categorical values
mapping = {
    'rbc': {'normal': 0, 'abnormal': 1},
    'pc': {'normal': 0, 'abnormal': 1},
    'pcc': {'notpresent': 0, 'present': 1},
    'ba': {'notpresent': 0, 'present': 1},
    'htn': {'yes': 1, 'no': 0},
    'dm': {'yes': 1, 'no': 0, '\tyes': 1, ' yes': 1},
    'cad': {'yes': 1, 'no': 0, '\tno': 0},
    'appet': {'good': 0, 'poor': 1},
    'pe': {'yes': 1, 'no': 0},
    'ane': {'yes': 1, 'no': 0},
    'classification': {'ckd': 1, 'ckd\t': 1, 'notckd': 0}
}

for col, val_map in mapping.items():
    df[col] = df[col].map(val_map)

# Handle numerical columns that might have string artifacts
num_cols = ['age', 'bp', 'sg', 'al', 'su', 'bgr', 'bu', 'sc', 'sod', 'pot', 'hemo', 'pcv', 'wc', 'rc']
for col in num_cols:
    df[col] = pd.to_numeric(df[col], errors='coerce')

# Fill missing values
# For numerical: median
# For categorical: mode
for col in df.columns:
    if df[col].dtype == 'object' or col in mapping.keys():
        df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 0)
    else:
        df[col] = df[col].fillna(df[col].median())

# Split features and target
X = df.drop('classification', axis=1)
y = df['classification']

# Train/Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Model Training
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# Accuracy Check
accuracy = model.score(X_test_scaled, y_test)
print(f"Model Accuracy: {accuracy*100:.2f}%")

# Save model and scaler
joblib.dump(model, 'kidney_model.pkl')
joblib.dump(scaler, 'scaler.pkl')
joblib.dump(X.columns.tolist(), 'features_list.pkl')

print("Model and Scaler saved successfully.")
