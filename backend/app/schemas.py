from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class CustomerInput(BaseModel):
    age: float
    height: float
    weight: float
    bmi: float
    product_info_2: str
    occupation: str
    income: float
    smoker: int
    previous_claims: int
    family_history: int
    insurance_type: str
    coverage_amount: float
    exercise: int
    alcohol: int
    gender: str

class RiskPredictionResponse(BaseModel):
    risk_score: float
    risk_class: str
    suggested_premium: float
    details: Dict[str, Any]

class AgentQueryRequest(BaseModel):
    prompt: str
    context: Optional[Dict[str, Any]] = None

class AgentQueryResponse(BaseModel):
    response: str
    insights: Dict[str, Any]

class LoginRequest(BaseModel):
    username: str
    password: str
    passkey: Optional[str] = None

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str
    passkey: Optional[str] = None
    recovery_hint: Optional[str] = None
    recovery_answer: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    username: str
    recovery_answer: str
    new_password: str

class DecisionRequest(BaseModel):
    decision: str
    modified_amount: Optional[float] = None
