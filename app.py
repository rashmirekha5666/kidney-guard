from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import os
from groq import Groq

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Groq Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY not found in environment variables.")
client = Groq(api_key=GROQ_API_KEY)

# Load model, scaler and feature names
try:
    model = joblib.load('kidney_model.pkl')
    scaler = joblib.load('scaler.pkl')
    features = joblib.load('features_list.pkl')
    print("Model and components loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # Prepare input vector in the correct order
        input_data = []
        for feat in features:
            # Get value, default to 0 if missing
            val = data.get(feat, 0)
            input_data.append(float(val))
        
        # Scale and predict
        input_scaled = scaler.transform([input_data])
        prediction = model.predict(input_scaled)[0]
        probability = model.predict_proba(input_scaled)[0][1] # Probability of CKD
        
        result = {
            'classification': 'ckd' if prediction == 1 else 'notckd',
            'confidence': float(probability),
            'risk_level': 'High' if probability > 0.7 else 'Moderate' if probability > 0.3 else 'Low'
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_message = request.json.get('message')
        
        # System prompt contextualized with kidney disease knowledge
        system_prompt = """You are KidneyGuard AI, a professional medical assistant specializing in early detection of kidney disease. 
        Your knowledge is based on a clinical dataset of 400 patients. 
        Key markers you focus on:
        - Albumin (al): Most critical early sign of kidney damage.
        - Serum Creatinine (sc): High levels indicate poor filtering.
        - Hemoglobin (hemo): Low levels often accompany Chronic Kidney Disease (CKD).
        - Specific Gravity (sg): Vital for urine concentration assessment.
        
        Always be professional, empathetic, and clear that you provide assessments, not final clinical diagnoses. 
        Encourage doctor consultation for High Risk indicators."""

        print(f"Chat message received: {user_message}")
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        
        return jsonify({'reply': completion.choices[0].message.content})
    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
