const video = document.getElementById("cameraPreview");
const canvas = document.getElementById("photoCanvas");

const shutterButton = document.getElementById("shutterButton");
const cameraButton = document.getElementById("cameraButton");

const focusIndicator = document.getElementById("focusIndicator");

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


// TAP TO FOCUS
video.addEventListener("click", async (event) => {

    const rect = video.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Position focus indicator
    focusIndicator.style.left =
        `${x - 32.5}px`;

    focusIndicator.style.top =
        `${y - 32.5}px`;

    // Show indicator
    focusIndicator.classList.remove("active");

    // Force animation restart
    void focusIndicator.offsetWidth;

    focusIndicator.classList.add("active");

    // Try to use the camera's focus capabilities
    if (currentStream) {

        const track = currentStream.getVideoTracks()[0];

        if (track) {

            const capabilities = track.getCapabilities();

            if (capabilities.focusMode) {

                try {

                    await track.applyConstraints({
                        advanced: [
                            {
                                focusMode: "single-shot"
                            }
                        ]
                    });

                } catch (error) {
                    console.log("Focus control unavailable:", error);
                }
            }
        }
    }

    // Hide after a moment
    setTimeout(() => {
        focusIndicator.classList.remove("active");
    }, 1200);
});


cameraButton.addEventListener("click", switchCamera);


// START
startCamera();
