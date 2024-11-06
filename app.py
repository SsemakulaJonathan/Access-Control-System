from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import os
import shutil
from detect_service import DetectionService
from dotenv import load_dotenv
from pathlib import Path
import aiofiles

# Load environment variables
load_dotenv()

# Create FastAPI app instance
app = FastAPI(title="Access Control System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://jonathan-access-control-system.vercel.app/", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize detection service
detection_service = None

@app.on_event("startup")
async def startup_event():
    global detection_service
    try:
        detection_service = DetectionService()
        print("Detection service initialized successfully")
    except Exception as e:
        print(f"Error initializing detection service: {e}")

@app.get("/")
async def root():
    return {"message": "Access Control System API", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "message": "Service is running"}

@app.post("/api/verify-access")
async def verify_access(image: UploadFile = File(...)):
    try:
        # Read the file
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image")
        
        # Process frame and verify access
        result = detection_service.process_frame(img)
        return JSONResponse(content=result)
        
    except Exception as e:
        print(f"Verification error: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.post("/api/detect")
async def detect(image: UploadFile = File(...)):
    try:
        contents = await image.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image")
        
        # Get detections from service
        detections = detection_service.detect_objects(img)
        return JSONResponse(content={"status": "success", "detections": detections})
        
    except Exception as e:
        print(f"Detection error: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

@app.post("/api/register-user")
async def register_user(
    name: str = Form(...),
    contact: str = Form(...),
    carPlate: str = Form(...),
    image: UploadFile = File(...)
):
    try:
        # Create directory if it doesn't exist
        known_faces_dir = Path('models/known_faces')
        known_faces_dir.mkdir(parents=True, exist_ok=True)
        
        # Save image
        image_path = known_faces_dir / f"{name}.jpg"
        contents = await image.read()
        
        async with aiofiles.open(str(image_path), 'wb') as f:
            await f.write(contents)
        
        # Read the saved image
        img = cv2.imread(str(image_path))
        if img is None:
            raise HTTPException(status_code=400, detail="Failed to process image")
        
        # Register user
        success = detection_service.register_user(name, carPlate, img)
        
        if success:
            return JSONResponse(
                content={"status": "success", "message": "User registered successfully"}
            )
        else:
            # Clean up on failure
            os.remove(image_path)
            raise HTTPException(status_code=500, detail="Failed to register user")
            
    except Exception as e:
        print(f"Registration error: {e}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")