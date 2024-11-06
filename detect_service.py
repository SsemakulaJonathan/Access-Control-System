import cv2
import numpy as np
import face_recognition
from ultralytics import YOLO
import easyocr
import os
import pickle
from typing import Dict, List, Any
import torch
from pathlib import Path

class DetectionService:
    def __init__(self):
        try:
            # Initialize YOLO model
            model_path = 'models/weights/best.pt'
            if not os.path.exists(model_path):
                raise FileNotFoundError(f"YOLO model not found at {model_path}")
            self.yolo_model = YOLO(model_path)
            print("YOLO model loaded successfully")

            # Initialize EasyOCR
            self.reader = easyocr.Reader(['en'])
            print("EasyOCR initialized successfully")

            # Set device
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            print(f"Using device: {self.device}")

            # Load known faces
            self.known_faces = self._load_known_faces()
            print(f"Loaded {len(self.known_faces)} known faces")

            # Add face recognition parameters
            self.face_recognition_threshold = 0.5  # Stricter threshold (default is 0.6)
            self.min_face_size = 20  # Minimum face size to detect
            self.face_detection_model = "hog"  # Can be "hog" or "cnn" (cnn is more accurate but slower)

        except Exception as e:
            print(f"Error in initialization: {e}")
            raise

    def _load_known_faces(self) -> Dict[str, Dict]:
        """Load known faces from pickle file or initialize empty dictionary"""
        known_faces_dir = Path('models/known_faces')
        encodings_path = known_faces_dir / 'encodings.pkl'
        
        # Create directory if it doesn't exist
        known_faces_dir.mkdir(parents=True, exist_ok=True)
        
        if encodings_path.exists():
            try:
                with open(encodings_path, 'rb') as f:
                    return pickle.load(f)
            except Exception as e:
                print(f"Error loading encodings: {e}")
                return {}
        return {}

    def _save_known_faces(self) -> None:
        """Save known faces to pickle file"""
        try:
            encodings_path = Path('models/known_faces') / 'encodings.pkl'
            with open(encodings_path, 'wb') as f:
                pickle.dump(self.known_faces, f)
            print(f"Saved {len(self.known_faces)} face encodings")
        except Exception as e:
            print(f"Error saving encodings: {e}")
            raise

    def register_user(self, name: str, plate_number: str, face_image: np.ndarray) -> bool:
        """Register a new user with their face and plate number"""
        try:
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
            
            # Detect face locations
            face_locations = face_recognition.face_locations(
                rgb_image,
                model=self.face_detection_model,
                number_of_times_to_upsample=2  # More thorough detection for registration
            )
            if not face_locations:
                print(f"No face detected for user: {name}")
                return False
            
            # If multiple faces are detected, use the largest one
            if len(face_locations) > 1:
                largest_face = max(face_locations, key=lambda rect: (rect[2] - rect[0]) * (rect[1] - rect[3]))
                face_locations = [largest_face]
                print(f"Multiple faces detected for {name}, using the largest one")
            
            # Get face encoding
            face_encoding = face_recognition.face_encodings(rgb_image, face_locations)[0]

            # Check if this face is too similar to any existing face
            for existing_name, existing_data in self.known_faces.items():
                distance = face_recognition.face_distance([existing_data['face_encoding']], face_encoding)[0]
                if distance < self.face_recognition_threshold:
                    print(f"Warning: New user {name} looks very similar to existing user {existing_name}")
                    return False
            
            # Store user data
            self.known_faces[name] = {
                'face_encoding': face_encoding,
                'plate_number': plate_number,
                'registration_time': cv2.getTickCount()
            }
            
            # Save updated encodings
            self._save_known_faces()
            print(f"Successfully registered user: {name}")
            return True
            
        except Exception as e:
            print(f"Error registering user: {e}")
            return False

    def detect_objects(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """Detect faces and license plates in a frame"""
        detections = []
        
        try:
            # Convert BGR to RGB for face detection
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            face_locations = face_recognition.face_locations(
                rgb_frame,
                model=self.face_detection_model,
                number_of_times_to_upsample=1  # Increase this for better detection of small faces
                   
            )
            if face_locations:
                face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
                
                for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
                    face_height = bottom - top
                    face_width = right - left
                    if face_height < self.min_face_size or face_width < self.min_face_size:
                        continue
                    
                    name = "Unknown"
                    best_match_distance = float('inf')

                    # Check against known faces
                    for known_name, data in self.known_faces.items():
                        # Calculate face distance
                        face_distance = face_recognition.face_distance([data['face_encoding']], face_encoding)[0]
                        
                        # Check if this is the best match so far
                        if face_distance < self.face_recognition_threshold and face_distance < best_match_distance:
                            name = known_name
                            best_match_distance = face_distance
                    
                    # Add confidence score to the detection
                    confidence = (1 - best_match_distance) if name != "Unknown" else 0
                    
                    detections.append({
                        "type": "face",
                        "x": left,
                        "y": top,
                        "width": right - left,
                        "height": bottom - top,
                        "label": f"{name} ({confidence:.2%})" if name != "Unknown" else name,
                        "confidence": confidence
                    })
            
            # Detect license plates
            results = self.yolo_model(frame)
            for result in results:
                boxes = result.boxes
                for box in boxes:
                    if box.conf.item() > 0.5:  # Confidence threshold
                        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                        
                        # Get plate text using OCR
                        plate_img = frame[y1:y2, x1:x2]
                        plate_text = "Unknown"
                        try:
                            ocr_result = self.reader.readtext(plate_img)
                            if ocr_result:
                                plate_text = ocr_result[0][1]
                        except Exception as e:
                            print(f"OCR error: {e}")
                        
                        detections.append({
                            "type": "plate",
                            "x": x1,
                            "y": y1,
                            "width": x2 - x1,
                            "height": y2 - y1,
                            "label": plate_text
                        })
            
            return detections
            
        except Exception as e:
            print(f"Error in detect_objects: {e}")
            return []

    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """Process a frame for access control"""
        try:
            detections = self.detect_objects(frame)
            
            # Get the most confident face detection
            face_detections = [d for d in detections if d["type"] == "face"]
            face_detection = max(face_detections, key=lambda x: x.get("confidence", 0)) if face_detections else None

            # Get the plate detection
            plate_detection = next((d for d in detections if d["type"] == "plate"), None)
                
            if not face_detection or not plate_detection:
                return {
                    "status": "denied",
                    "message": "Could not detect both face and license plate"
                }
            
            face_name = face_detection["label"].split(" (")[0]  # Remove confidence from label
            plate_text = plate_detection["label"]
            
            if face_name == "Unknown":
                return {
                    "status": "denied",
                    "message": "Face not recognized",
                    "confidence": face_detection.get("confidence", 0)
                }
            
            # Check if plate matches the registered user
            if face_name in self.known_faces:
                expected_plate = self.known_faces[face_name]["plate_number"]
                if self._compare_plates(plate_text, expected_plate):
                    return {
                        "status": "granted",
                        "face": face_name,
                        "plate": plate_text,
                        "confidence": face_detection.get("confidence", 0),
                        "timestamp": str(cv2.getTickCount())
                    }
            
            return {
                "status": "denied",
                "message": "License plate does not match registered user",
                "detected_plate": plate_text,
                "expected_plate": expected_plate if face_name in self.known_faces else None
            }
            
        except Exception as e:
            print(f"Error in process_frame: {e}")
            return {"status": "error", "message": str(e)}

    def _compare_plates(self, plate1: str, plate2: str) -> bool:
        """Compare two license plates, ignoring spaces and case"""
        p1 = plate1.upper().replace(" ", "")
        p2 = plate2.upper().replace(" ", "")
        return p1 == p2