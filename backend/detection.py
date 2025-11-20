from ultralytics import YOLO
import cv2
import numpy as np
import base64

model = YOLO("yolo12x.pt")

def process_image(image_path: str):

    results = model(image_path)
    
    detections = []
    result = results[0]
    
    for box in result.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        confidence = float(box.conf[0])
        class_id = int(box.cls[0])
        class_name = result.names[class_id]
        
        detections.append({
            "class_name": class_name,
            "confidence": confidence,
            "bbox": [x1, y1, x2, y2]
        })

    annotated_frame = result.plot()

    _, buffer = cv2.imencode('.jpg', annotated_frame)
    annotated_image_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return annotated_image_base64, detections
