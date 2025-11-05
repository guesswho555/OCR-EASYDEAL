document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const imageBtn = document.getElementById('image-btn');
    const webcamBtn = document.getElementById('webcam-btn');
    const imageInputSection = document.getElementById('image-input-section');
    const webcamInputSection = document.getElementById('webcam-input-section');
    const imageFileInput = document.getElementById('image-file-input');
    const submitImageBtn = document.getElementById('submit-image-btn');
    const webcamFeed = document.getElementById('webcam-feed');
    const captureBtn = document.getElementById('capture-btn');
    const stopWebcamBtn = document.getElementById('stop-webcam-btn');
    const outputText = document.getElementById('output-text');
    const loadingSpinner = document.getElementById('loading-spinner');

    const API_URL = 'http://localhost:5000'; // The backend is running on port 5000
    let stream = null;

    // --- Event Listeners ---
    imageBtn.addEventListener('click', () => {
        webcamInputSection.style.display = 'none';
        imageInputSection.style.display = 'block';
        stopWebcam();
    });

    webcamBtn.addEventListener('click', () => {
        imageInputSection.style.display = 'none';
        webcamInputSection.style.display = 'block';
        startWebcam();
    });

    submitImageBtn.addEventListener('click', () => {
        const file = imageFileInput.files[0];
        if (file) {
            uploadImage(file);
        } else {
            alert('Please select an image file first.');
        }
    });

    captureBtn.addEventListener('click', () => {
        captureFrame();
    });

    stopWebcamBtn.addEventListener('click', () => {
        stopWebcam();
    });

    // --- Functions ---
    function showLoading(show) {
        loadingSpinner.style.display = show ? 'block' : 'none';
        outputText.style.display = show ? 'none' : 'block';
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        showLoading(true);
        outputText.textContent = '';

        try {
            const response = await fetch(`${API_URL}/ocr/image`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const result = await response.json();
            outputText.textContent = result.text || 'No text found.';
        } catch (error) {
            outputText.textContent = `Error: ${error.message}`;
        } finally {
            showLoading(false);
        }
    }

    async function startWebcam() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                webcamFeed.srcObject = stream;
                captureBtn.disabled = false;
                stopWebcamBtn.disabled = false;
            } catch (error) {
                console.error("Error accessing webcam:", error);
                alert("Could not access webcam. Please ensure it is not in use and permissions are granted.");
            }
        } else {
            alert("Your browser does not support webcam access.");
        }
    }

    function stopWebcam() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            webcamFeed.srcObject = null;
            stream = null;
            captureBtn.disabled = true;
            stopWebcamBtn.disabled = true;
        }
    }

    async function captureFrame() {
        if (!stream) return;

        const canvas = document.createElement('canvas');
        canvas.width = webcamFeed.videoWidth;
        canvas.height = webcamFeed.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(webcamFeed, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg');
        showLoading(true);
        outputText.textContent = '';

        try {
            const response = await fetch(`${API_URL}/ocr/webcam`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataUrl }),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const result = await response.json();
            outputText.textContent = result.text || 'No text found in frame.';
        } catch (error) {
            outputText.textContent = `Error: ${error.message}`;
        } finally {
            showLoading(false);
        }
    }
});