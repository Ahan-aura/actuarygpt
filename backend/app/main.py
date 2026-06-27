import sys
import os

# Ensure the directory of this file is in Python's search path to allow direct imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Import routers from the routes package
from routes import auth, life, vehicle, analytics, chatbot, monitoring

app = FastAPI(
    title="ActuaryGPT API",
    version="2.0"
)

# Enable CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directory exists
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

# Mount the static directory to serve generated PDFs
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def home():
    return {
        "status": "online",
        "message": "ActuaryGPT SQL Backend Running with Reorganized Route Architecture"
    }

# Include routes
app.include_router(auth.router)
app.include_router(life.router)
app.include_router(vehicle.router)
app.include_router(analytics.router)
app.include_router(chatbot.router)
app.include_router(monitoring.router)

from pydantic import BaseModel
class FileUploadRequest(BaseModel):
    file_name: str
    file_base64: str

@app.post("/upload-file")
def upload_file(req: FileUploadRequest):
    try:
        import base64
        import uuid
        base64_data = req.file_base64
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
            
        file_bytes = base64.b64decode(base64_data)
        
        # Ensure upload directory exists inside STATIC_DIR
        upload_dir = os.path.join(STATIC_DIR, "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Safe filename
        safe_name = "".join([c if c.isalnum() or c in (".", "_", "-") else "_" for c in req.file_name])
        unique_name = f"{uuid.uuid4().hex}_{safe_name}"
        file_path = os.path.join(upload_dir, unique_name)
        
        with open(file_path, "wb") as f:
            f.write(file_bytes)
            
        file_url = f"/static/uploads/{unique_name}"
        return {
            "success": True,
            "url": file_url,
            "file_name": req.file_name
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

class DocumentParseRequest(BaseModel):
    type: str
    file_name: str
    mime_type: str
    file_base64: str

@app.post("/parse-document")
def parse_document(req: DocumentParseRequest):
    try:
        import base64
        # Strip data URL prefix if sent from frontend (e.g. data:image/png;base64,...)
        base64_data = req.file_base64
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
            
        file_bytes = base64.b64decode(base64_data)
        
        from llm import parse_document_to_features
        extracted_features = parse_document_to_features(file_bytes, req.mime_type, req.type)
        
        return {
            "success": True,
            "features": extracted_features
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

class DamageAnalysisRequest(BaseModel):
    file_name: str
    mime_type: str
    file_base64: str

@app.post("/analyze-damage")
def analyze_damage(req: DamageAnalysisRequest):
    try:
        import base64
        base64_data = req.file_base64
        if "," in base64_data:
            base64_data = base64_data.split(",")[1]
            
        file_bytes = base64.b64decode(base64_data)
        
        from llm import analyze_vehicle_damage
        result = analyze_vehicle_damage(file_bytes, req.mime_type)
        
        return {
            "success": True,
            "result": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


