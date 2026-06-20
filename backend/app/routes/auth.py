from fastapi import APIRouter, HTTPException
from schemas import LoginRequest, RegisterRequest
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
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            (req.username.strip().lower(), req.password, req.role.strip())
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
