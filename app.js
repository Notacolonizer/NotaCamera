const video = document.getElementById("cameraPreview");
const canvas = document.getElementById("photoCanvas");

const shutterButton = document.getElementById("shutterButton");
const cameraButton = document.getElementById("cameraButton");

let currentCamera = "environment";
let currentStream = null;


// Start camera
async function startCamera() {

    try {

        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: currentCamera
            },
            audio: false
        });

        currentStream = stream;

        video.srcObject = stream;

    } catch (error) {

        console.error("Camera error:", error);

        alert("Unable to access the camera.");

    }
}


// Take photo
function takePhoto() {

    if (!currentStream) {
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    context.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
    );

    canvas.toBlob(blob => {

        const photoURL = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = photoURL;
        link.download = `photo-${Date.now()}.jpg`;

        link.click();

        URL.revokeObjectURL(photoURL);

    }, "image/jpeg", 0.95);
}


// Switch cameras
async function switchCamera() {

    if (currentCamera === "environment") {
        currentCamera = "user";
    } else {
        currentCamera = "environment";
    }

    await startCamera();
}


// Button events
shutterButton.addEventListener("click", takePhoto);

cameraButton.addEventListener("click", switchCamera);


// Start everything
startCamera();
