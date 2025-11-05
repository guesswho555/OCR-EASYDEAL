from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image
import io
import cv2
import numpy as np
import base64

app = Flask(__name__)
CORS(app)  # This enables Cross-Origin Resource Sharing

@app.route('/ocr/image', methods=['POST'])
def ocr_from_image():
    """Receives an image file and returns extracted text."""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        try:
            image = Image.open(file.stream)
            text = pytesseract.image_to_string(image)
            return jsonify({'text': text})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/ocr/webcam', methods=['POST'])
def ocr_from_webcam():
    """Receives a webcam frame (as a data URL) and returns extracted text."""
    data = request.json
    if not data or 'image' not in data:
        return jsonify({'error': 'No image data provided'}), 400

    try:
        # The image data is a base64-encoded string with a prefix, e.g., "data:image/jpeg;base64,..."
        # We need to strip the prefix to get the pure base64 data.
        image_data = base64.b64decode(data['image'].split(',')[1])

        # Convert the raw bytes to a NumPy array
        np_arr = np.frombuffer(image_data, np.uint8)

        # Decode the NumPy array into an OpenCV image
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        # Convert to grayscale for better OCR results
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Use pytesseract to extract text
        text = pytesseract.image_to_string(gray_frame)

        return jsonify({'text': text})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)