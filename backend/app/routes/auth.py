from fastapi import APIRouter, HTTPException
from schemas import LoginRequest, RegisterRequest, ResetPasswordRequest
from database import get_db_connection, is_integrity_error

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register")
def register(req: RegisterRequest):
    if req.role.strip() == 'officer':
        if req.passkey != "ACTUARY_SECURE_2026":
            raise HTTPException(status_code=400, detail="Invalid Officer Security Passkey. Registration denied.")
            
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (username, password, role, recovery_hint, recovery_answer) VALUES (?, ?, ?, ?, ?)",
            (req.username.strip().lower(), req.password, req.role.strip(), req.recovery_hint, req.recovery_answer.strip().lower() if req.recovery_answer else None)
        )
        conn.commit()
        return {"success": True, "message": "User registered successfully"}
    except Exception as e:
        if is_integrity_error(e):
            raise HTTPException(status_code=400, detail="Username already exists")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/login")
def login(req: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT username, role, password FROM users WHERE username = ?",
        (req.username.strip().lower(),)
    )
    user = cursor.fetchone()
    conn.close()
    
    if not user or user["password"] != req.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
        
    if user["role"] == 'officer':
        if req.passkey != "ACTUARY_SECURE_2026":
            raise HTTPException(status_code=401, detail="Invalid Officer Security Passkey. Login denied.")
            
    return {
        "username": user["username"],
        "role": user["role"]
    }

from pydantic import BaseModel
class ForgotPasswordRequest(BaseModel):
    username: str

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT recovery_hint FROM users WHERE username = ?", (req.username.strip().lower(),))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        raise HTTPException(status_code=404, detail="Username not found.")
        
    return {
        "success": True,
        "recovery_hint": user["recovery_hint"] or "No recovery hint configured."
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT recovery_answer FROM users WHERE username = ?", (req.username.strip().lower(),))
    user = cursor.fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Username not found.")
        
    db_answer = user["recovery_answer"]
    if not db_answer:
        conn.close()
        raise HTTPException(status_code=400, detail="This account has no recovery hint/answer configured. Reset unavailable.")
        
    if db_answer.strip().lower() != req.recovery_answer.strip().lower():
        conn.close()
        raise HTTPException(status_code=400, detail="Incorrect recovery answer.")
        
    try:
        cursor.execute("UPDATE users SET password = ? WHERE username = ?", (req.new_password, req.username.strip().lower()))
        conn.commit()
        return {"success": True, "message": "Password successfully reset."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
