import os
from google import genai
from google.genai.types import *
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def ask_gemini(question: str, detections: list, image_b64: str):
    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        system_instruction = """
        You are an expert in image processing and computer vision. You are given an image, image detection data using yolo and a question asked by a user. 
        Your task is to answer the question based on the image. You will also be provided with detected objects in the image and their class names, confidence scores, and bounding boxes.
        
        Here is a sample format of the detected objects:
        Object X:
        - Class: apple
        - Confidence: 87.37%
        - Bounding Box: [x1=584.3, y1=720.9, x2=661.2, y2=959.2] 
        
        where (x1, y1) and (x2, y2) are the top-left and bottom-right coordinates of the bounding box respectively. This is used for determining the location and size of the object in the image. The size of the bounding box is calculated as (x2 - x1) pixels in width and (y2 - y1) pixels in height. For example, if the bounding box coordinates are (584.3, 720.9, 661.2, 959.2), then the size of the bounding box is (76.9 x 238.3) pixels.
        
        Note: Must respond with the bounding box coordinates with pixels. e.g., The smallest object in the image is Object 2, which is an apple with bounding box of (584.3, 720.9, 661.2, 959.2) with a size of 121.3 x 118.1 pixels.
        
        GUARDRAILS:
        Always reply with the exact answer asked by the user concisely in complete sentences.
        Avoid replying to any questions irrelevant to image analysis.
        Don't use markdown formatting.
        Don't over-explain the answer.
        Don't make up the answer.
        Never respond null.
        Must reply in English.
        """

        yolo_data = "YOLO Object Detection Data:\n\n"
        for idx, d in enumerate(detections, 1):
            bbox = d.get("bbox", [0, 0, 0, 0])

            yolo_data += f"Object {idx}:\n"
            yolo_data += f"  - Class: {d['class_name']}\n"
            yolo_data += f"  - Confidence: {d['confidence']:.2%}\n"
            yolo_data += f"  - Bounding Box: [x1={bbox[0]:.1f}, y1={bbox[1]:.1f}, x2={bbox[2]:.1f}, y2={bbox[3]:.1f}]\n\n"

        contents = (
            [
                f"Here is the image given to you with its object detection data: {yolo_data}\n\nUser Question: {question}",
                Part.from_bytes(
                    data=image_b64,
                    mime_type="image/jpeg",
                ),
            ],
        )

        print(contents)

        response_text = client.models.generate_content(
            model="gemini-2.0-flash",  # using 2 flash because 2.5 flash is overloaded most of the time
            contents=contents,
            config=GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.1,
                max_output_tokens=1000,
                response_mime_type="text/plain",
            ),
        )

        return response_text.text

    except Exception as e:
        return f"Error communicating with Gemini: {str(e)}"
