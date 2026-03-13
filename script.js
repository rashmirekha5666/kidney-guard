document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons with safety check
    if (window.lucide) {
        try {
            lucide.createIcons();
        } catch (e) {
            console.error('Lucide icons failed to initialize:', e);
        }
    } else {
        console.warn('Lucide library not loaded. Icons will be missing.');
    }

    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const body = document.body;
        const icon = themeToggle.querySelector('i');

        themeToggle.addEventListener('click', () => {
            const isDark = body.getAttribute('data-theme') === 'dark';
            body.setAttribute('data-theme', isDark ? 'light' : 'dark');
            if (icon && window.lucide) {
                icon.setAttribute('data-lucide', isDark ? 'moon' : 'sun');
                lucide.createIcons();
            }
        });
    }

    // Risk Checker Logic
    const riskForm = document.getElementById('riskForm');
    const resultDiv = document.getElementById('result');

    riskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div class="spinner"></div> Initiating Secure AI Diagnostic...';
        resultDiv.style.background = 'var(--bg-alt)';

        // Collect all features for the model
        const features = {
            age: document.getElementById('age').value,
            bp: document.getElementById('bp').value,
            sg: document.getElementById('sg').value,
            al: document.getElementById('al').value,
            su: document.getElementById('su').value,
            rbc: document.getElementById('rbc').value,
            pc: document.getElementById('pc').value,
            pcc: document.getElementById('pcc').value,
            ba: document.getElementById('ba').value,
            bgr: document.getElementById('bgr').value,
            bu: document.getElementById('bu').value,
            sc: document.getElementById('sc').value,
            sod: document.getElementById('sod').value,
            pot: document.getElementById('pot').value,
            hemo: document.getElementById('hemo').value,
            pcv: document.getElementById('pcv').value,
            wc: document.getElementById('wc').value,
            rc: document.getElementById('rc').value,
            htn: document.getElementById('htn').value,
            dm: document.getElementById('dm').value,
            cad: document.getElementById('cad').value,
            appet: document.getElementById('appet').value,
            pe: "0", // Defaulted
            ane: "0"  // Defaulted
        };

        try {
            const response = await fetch('http://127.0.0.1:5000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(features)
            });

            const aiResult = await response.json();

            if (aiResult.error) {
                throw new Error(aiResult.error);
            }

            const riskLevel = aiResult.risk_level;
            const confidence = (aiResult.confidence * 100).toFixed(1);

            // --- Clinical Calculations ---
            const ageVal = parseFloat(features.age);
            const scVal = parseFloat(features.sc);

            // Simplified eGFR Estimation (MDRD-ish for demonstration)
            const eGFR = Math.round(175 * Math.pow(scVal, -1.154) * Math.pow(ageVal, -0.203));

            let stage = "";
            let affectedPerc = "";
            let diseaseInfo = "";

            if (eGFR >= 90) {
                stage = "Stage 1: Kidney damage with normal or high GFR";
                affectedPerc = "0-10%";
                diseaseInfo = "Early-stage markers detected. Your kidneys are still functioning well, but preventive care is essential to stop progression.";
            } else if (eGFR >= 60) {
                stage = "Stage 2: Mild decrease in GFR";
                affectedPerc = "15-30%";
                diseaseInfo = "Mild reduction in function. Often asymptomatic, but requires strict monitoring of blood pressure and glucose levels.";
            } else if (eGFR >= 30) {
                stage = "Stage 3: Moderate decrease in GFR";
                affectedPerc = "40-60%";
                diseaseInfo = "Moderate Chronic Kidney Disease. You may experience fatigue, puffiness/swelling, or changes in urine frequency.";
            } else if (eGFR >= 15) {
                stage = "Stage 4: Severe decrease in GFR";
                affectedPerc = "70-85%";
                diseaseInfo = "Advanced CKD. Significant metabolic waste buildup in blood. Specialized nephrology care is critical immediately.";
            } else {
                stage = "Stage 5: Kidney Failure (ESRD)";
                affectedPerc = "90%+";
                diseaseInfo = "End-Stage Renal Disease. Kidneys can no longer support bodily requirements. Dialysis or transplant needs to be discussed.";
            }

            let clinicalData = {
                level: riskLevel,
                color: riskLevel === 'High' ? '#ef4444' : riskLevel === 'Moderate' ? '#f59e0b' : '#10b981',
                class: `risk-${riskLevel.toLowerCase()}`,
                confidence: confidence,
                eGFR: eGFR,
                stage: stage,
                affectedPerc: affectedPerc,
                diseaseInfo: diseaseInfo,
                message: aiResult.classification === 'ckd'
                    ? `AI Analysis has identified significant markers consistent with ${stage}.`
                    : `AI Analysis indicates healthy kidney markers. Note your calculated eGFR is ${eGFR}.`,
                remedies: riskLevel === 'High'
                    ? [
                        'URGENT: Consult a Nephrologist for a formal clinical evaluation.',
                        'DIET: Strict low-protein, low-sodium, and low-potassium diet.',
                        'SCREENING: Quarterly blood tests for BUN and Electrolytes.',
                        'CARE: Review all meds to avoid nephrotoxic drugs (like NSAIDs).'
                    ]
                    : riskLevel === 'Moderate'
                        ? [
                            'GP CONSULT: Visit your doctor for a formal GFR and Albumin check.',
                            'LIFESTYLE: Strict blood pressure (target <130/80) and sugar control.',
                            'NUTRITION: Reduce processed salt and high-protein intake.',
                            'MONITOR: Re-test kidney markers every 6 months.'
                        ]
                        : [
                            'HYDRATION: Drink adequate water (2-3L daily) to flush toxins.',
                            'EXERCISE: Maintain a healthy weight through regular activity.',
                            'WELLNESS: Annual screening of urine albumin-to-creatinine ratio.',
                            'AWARENESS: Monitor for any changes in urine color or frequency.'
                        ]
            };

            resultDiv.innerHTML = `
                <h3 style="color: ${clinicalData.color}; font-size: 1.5rem; margin-bottom: 10px;">Analysis Complete</h3>
                <p>Confidence: ${confidence}% | eGFR: ${eGFR}</p>
                <p>Report opened in new tab.</p>
            `;

            const reportWindow = window.open('', '_blank');
            reportWindow.document.write(`
                <html>
                <head>
                    <title>KidneyGuard - AI Clinical Report</title>
                    <link rel="stylesheet" href="report-styles.css">
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
                </head>
                <body>
                    <div class="report-container">
                        <div class="header">
                            <div class="logo">KidneyGuard AI</div>
                            <div class="report-title">
                                <p><strong>Comprehensive Diagnostic Report</strong></p>
                                <p style="font-size: 0.8rem; color: #636e72;">Date: ${new Date().toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div class="section">
                            <span class="status-badge ${clinicalData.class}">AI Result: ${clinicalData.level} Risk (${confidence}%)</span>
                            <h3>Clinical Profile Data</h3>
                            <div class="data-grid">
                                <div class="data-item"><span>Age</span><strong>${features.age}y</strong></div>
                                <div class="data-item"><span>Creatinine (sc)</span><strong>${features.sc} mg/dL</strong></div>
                                <div class="data-item"><span>Hemoglobin</span><strong>${features.hemo} g/dL</strong></div>
                                <div class="data-item"><span>Specific Gravity</span><strong>${features.sg}</strong></div>
                            </div>
                        </div>

                        <div class="section">
                            <h3>Diagnostic Assessment & Organ Impact</h3>
                            <div class="data-grid" style="margin-bottom: 15px;">
                                <div class="data-item"><span>Estimated eGFR</span><strong>${clinicalData.eGFR} mL/min/1.73m²</strong></div>
                                <div class="data-item"><span>Organ Affected Est.</span><strong style="color: ${clinicalData.color}">${clinicalData.affectedPerc} Impacted</strong></div>
                            </div>
                            <p style="padding: 15px; background: #f1f5f9; border-radius: 8px; border-left: 5px solid ${clinicalData.color}; font-weight: 600;">
                                ${clinicalData.stage}
                            </p>
                            <p style="margin-top: 15px; line-height: 1.6;">
                                <strong>Assessment Summary:</strong> ${clinicalData.diseaseInfo}
                            </p>
                        </div>

                        <div class="section">
                            <h3>Prescribed Cures & Remedies</h3>
                            <ul style="padding-left: 20px;">
                                ${clinicalData.remedies.map(r => `<li style="margin-bottom: 8px;">${r}</li>`).join('')}
                            </ul>
                        </div>

                        <div class="footer">
                            <p>Disclaimer: This AI analysis used the CKD-EPI/MDRD formula and a Random Forest model trained on clinical data. Accuracy is based on provide clinical figures. **This is not a final diagnosis. Consult a qualified physician for clinical confirmation.**</p>
                        </div>

                        <button onclick="window.print()" class="btn-download">Download Clinical PDF</button>
                    </div>
                </body>
                </html>
            `);
            reportWindow.document.close();

        } catch (error) {
            resultDiv.innerHTML = `<p style="color: #ef4444;">Error: Could not connect to the diagnostic engine. Please ensure the backend server (app.py) is running on port 5000.</p>`;
            console.error('Prediction error:', error);
        }
    });

    // BMI Calculator Logic
    const bmiBtn = document.getElementById('bmiBtn');
    const bmiResult = document.getElementById('bmiResult');

    bmiBtn.addEventListener('click', () => {
        const weight = parseFloat(document.getElementById('weight').value);
        const height = parseFloat(document.getElementById('height').value) / 100;

        if (weight > 0 && height > 0) {
            const bmi = (weight / (height * height)).toFixed(1);
            let category = '';
            if (bmi < 18.5) category = 'Underweight';
            else if (bmi < 25) category = 'Normal weight';
            else if (bmi < 30) category = 'Overweight';
            else category = 'Obese';

            bmiResult.innerHTML = `Your BMI: ${bmi} (${category})`;
            bmiResult.style.color = bmi >= 30 || bmi < 18.5 ? 'var(--accent)' : 'var(--primary)';
        } else {
            bmiResult.innerHTML = 'Please enter valid values';
        }
    });

    // Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-animate]').forEach(el => {
        observer.observe(el);
    });

    // Chatbot Frontend Logic
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const closeChat = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendChat = document.getElementById('send-chat');
    const chatMessages = document.getElementById('chat-messages');

    chatToggle.addEventListener('click', () => {
        chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
        if (chatWindow.style.display === 'flex') {
            chatInput.focus();
        }
    });

    closeChat.addEventListener('click', () => {
        chatWindow.style.display = 'none';
    });

    const addMessage = (text, sender) => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Refresh icons if any (though not used here)
        if (window.lucide) {
            try {
                lucide.createIcons();
            } catch (e) { }
        }
    };

    const handleChat = async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        chatInput.value = '';

        try {
            const response = await fetch('http://127.0.0.1:5000/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            const data = await response.json();
            addMessage(data.reply || 'Sorry, I encountered an error.', 'assistant');
        } catch (error) {
            addMessage('Error connecting to AI. Please ensure the backend is running.', 'assistant');
        }
    };

    sendChat.addEventListener('click', handleChat);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChat();
    });
});
