const video = document.getElementById("cameraPreview");
const canvas = document.getElementById("photoCanvas");

const shutterButton = document.getElementById("shutterButton");
const cameraButton = document.getElementById("cameraButton");

let currentCamera = "environment";
let currentStream = null;


// START CAMERA
async function startCamera() {

    try {

        // Stop previous camera
        if (currentStream) {
            currentStream.getTracks().forEach(track => {
                track.stop();
            });
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: currentCamera
            },
            audio: false
        });

        currentStream = stream;

        video.srcObject = stream;

        await video.play();

        console.log("Camera started!");

    } catch (error) {

        console.error("Camera error:", error);

        alert(
            "Camera couldn't start.\n\n" +
            "Make sure you've allowed camera access."
        );
    }
}


// TAKE PHOTO
function takePhoto() {

    if (!currentStream) {
        alert("Camera isn't ready yet.");
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

    canvas.toBlob(function(blob) {

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.href = url;
        link.download = "photo-" + Date.now() + ".jpg";

        link.click();

        URL.revokeObjectURL(url);

    }, "image/jpeg", 0.95);
}


// SWITCH CAMERA
async function switchCamera() {

    if (currentCamera === "environment") {
        currentCamera = "user";
    } else {
        currentCamera = "environment";
    }

    await startCamera();
}


// BUTTONS
shutterButton.addEventListener("click", takePhoto);

cameraButton.addEventListener("click", switchCamera);


// START
startCamera();
