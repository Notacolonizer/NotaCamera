const video = document.getElementById("cameraPreview");
const canvas = document.getElementById("photoCanvas");

const shutterButton = document.getElementById("shutterButton");
const cameraButton = document.getElementById("cameraButton");
const zoomButton = document.getElementById("zoomButton");
const focusIndicator = document.getElementById("focusIndicator");

let currentCamera = "environment";
let currentStream = null;

let currentZoom = 1;
let zoomMin = 1;
let zoomMax = 1;

let pinchStartDistance = null;
let pinchStartZoom = 1;


// =========================
// START CAMERA
// =========================

async function startCamera() {

    try {

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

        setupZoom();

        console.log("Camera started!");

    } catch (error) {

        console.error("Camera error:", error);

        alert(
            "Camera couldn't start.\n\n" +
            "Make sure you've allowed camera access."
        );
    }
}


// =========================
// SETUP ZOOM
// =========================

function setupZoom() {

    const track = currentStream.getVideoTracks()[0];

    if (!track) return;

    const capabilities = track.getCapabilities();

    if (capabilities.zoom) {

        zoomMin = capabilities.zoom.min;
        zoomMax = capabilities.zoom.max;

        currentZoom = Math.max(1, zoomMin);

        applyZoom(currentZoom);

    } else {

        // Browser doesn't expose hardware zoom.
        // We'll use digital zoom instead.

        zoomMin = 1;
        zoomMax = 5;

        currentZoom = 1;

        applyZoom(currentZoom);
    }
}


// =========================
// APPLY ZOOM
// =========================

async function applyZoom(value) {

    currentZoom = Math.max(
        zoomMin,
        Math.min(value, zoomMax)
    );

    const track = currentStream?.getVideoTracks()[0];

    if (track) {

        const capabilities = track.getCapabilities();

        if (capabilities.zoom) {

            try {

                await track.applyConstraints({
                    advanced: [
                        {
                            zoom: currentZoom
                        }
                    ]
                });

                video.style.transform = "scale(1)";

            } catch (error) {

                console.log("Hardware zoom unavailable.");
                applyDigitalZoom();

            }

        } else {

            applyDigitalZoom();
        }
    }

    updateZoomButton();
}


// =========================
// DIGITAL ZOOM
// =========================

function applyDigitalZoom() {

    video.style.transform =
        `scale(${currentZoom})`;
}


// =========================
// UPDATE ZOOM BUTTON
// =========================

function updateZoomButton() {

    if (currentZoom % 1 === 0) {

        zoomButton.textContent =
            `${currentZoom}×`;

    } else {

        zoomButton.textContent =
            `${currentZoom.toFixed(1)}×`;
    }
}


// =========================
// TAP ZOOM BUTTON
// =========================

zoomButton.addEventListener("click", () => {

    let nextZoom;

    if (currentZoom < 0.75) {

        nextZoom = 1;

    } else if (currentZoom < 1.5) {

        nextZoom = 2;

    } else {

        nextZoom = 0.5;
    }

    // Don't go below the actual available minimum
    if (nextZoom < zoomMin) {
        nextZoom = zoomMin;
    }

    applyZoom(nextZoom);
});


// =========================
// PINCH TO ZOOM
// =========================

video.addEventListener("touchstart", event => {

    if (event.touches.length === 2) {

        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        pinchStartDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );

        pinchStartZoom = currentZoom;
    }
});


video.addEventListener("touchmove", event => {

    if (
        event.touches.length === 2 &&
        pinchStartDistance !== null
    ) {

        event.preventDefault();

        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        const distance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
        );

        const scale =
            distance / pinchStartDistance;

        const newZoom =
            pinchStartZoom * scale;

        applyZoom(newZoom);
    }
}, {
    passive: false
});


video.addEventListener("touchend", event => {

    if (event.touches.length < 2) {

        pinchStartDistance = null;
    }
});


// =========================
// TAP TO FOCUS
// =========================

video.addEventListener("click", async event => {

    const rect = video.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    focusIndicator.style.left =
        `${x - 32.5}px`;

    focusIndicator.style.top =
        `${y - 32.5}px`;

    focusIndicator.classList.remove("active");

    void focusIndicator.offsetWidth;

    focusIndicator.classList.add("active");


    const track =
        currentStream?.getVideoTracks()[0];

    if (track) {

        const capabilities =
            track.getCapabilities();

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

                console.log(
                    "Focus control unavailable."
                );
            }
        }
    }


    setTimeout(() => {

        focusIndicator.classList.remove("active");

    }, 1200);
});


// =========================
// TAKE PHOTO
// =========================

function takePhoto() {

    if (!currentStream) {

        alert("Camera isn't ready yet.");

        return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");

    /*
       Digital zoom crop
    */

    const zoom =
        currentZoom > 1 ? currentZoom : 1;

    const cropWidth =
        width / zoom;

    const cropHeight =
        height / zoom;

    const cropX =
        (width - cropWidth) / 2;

    const cropY =
        (height - cropHeight) / 2;


    context.drawImage(
        video,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        width,
        height
    );


    canvas.toBlob(blob => {

        const url =
            URL.createObjectURL(blob);

        const link =
            document.createElement("a");

        link.href = url;

        link.download =
            `photo-${Date.now()}.jpg`;

        link.click();

        URL.revokeObjectURL(url);

    }, "image/jpeg", 0.95);
}


// =========================
// SWITCH CAMERA
// =========================

async function switchCamera() {

    if (currentCamera === "environment") {

        currentCamera = "user";

    } else {

        currentCamera = "environment";
    }

    await startCamera();
}


// =========================
// BUTTONS
// =========================

shutterButton.addEventListener(
    "click",
    takePhoto
);

cameraButton.addEventListener(
    "click",
    switchCamera
);


// =========================
// START
// =========================

startCamera();
