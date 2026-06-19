# ActuaryGPT

ActuaryGPT is an AI-powered actuarial analysis and insurance premium prediction system. It leverages machine learning models to assess risk and an AI agent to provide actuarial insights.

## Project Structure

```text
ActuaryGPT/
├── backend/
│   ├── app/
│   │   ├── main.py          # API Entrypoint (FastAPI)
│   │   ├── predict.py       # ML Model Prediction Logic
│   │   ├── schemas.py       # Pydantic Schemas for Requests/Responses
│   │   ├── premium.py       # Premium Calculation Logic
│   │   └── ai_agent.py      # LLM/AI Agent for Actuarial Insights
│   │
│   ├── models/
│   │   ├── risk_model.pkl   # Trained Risk Classification Model
│   │   └── label_encoder.pkl # Label Encoder for Categorical Features
│   │
│   └── requirements.txt     # Python Dependencies
│
├── frontend/                # Frontend Application
└── README.md
```
