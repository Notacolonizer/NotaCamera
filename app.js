const video =
    document.getElementById("cameraPreview");

const canvas =
    document.getElementById("photoCanvas");

const shutterButton =
    document.getElementById("shutterButton");

const cameraButton =
    document.getElementById("cameraButton");

const cameraModeButton =
    document.getElementById("cameraModeButton");

const zoomButton =
    document.getElementById("zoomButton");

const focusIndicator =
    document.getElementById("focusIndicator");

const stylesButton =
    document.getElementById("stylesButton");

const stylePanel =
    document.getElementById("stylePanel");

const closeStyles =
    document.getElementById("closeStyles");

const strengthSlider =
    document.getElementById("strengthSlider");

const strengthValue =
    document.getElementById("strengthValue");

const styleOptions =
    document.querySelectorAll(".style-option");


let currentCamera = "environment";

let currentStream = null;

let currentZoom = 1;

let zoomMin = 1;

let zoomMax = 5;

let currentStyle = "original";

let styleStrength = 70;

let pinchStartDistance = null;

let pinchStartZoom = 1;


/* =========================
   CAMERA
========================= */

async function startCamera() {

    try {

        if (currentStream) {

            currentStream
                .getTracks()
                .forEach(track => track.stop());

        }


        const stream =
            await navigator.mediaDevices
            .getUserMedia({

                video: {

                    facingMode:
                        currentCamera

                },

                audio: false

            });


        currentStream = stream;

        video.srcObject = stream;

        await video.play();

        setupZoom();

    }

    catch (error) {

        console.error(error);

        alert(
            "Couldn't access the camera. " +
            "Please allow camera access."
        );

    }

}


/* =========================
   CAMERA SWITCH
========================= */

async function switchCamera() {

    if (
        currentCamera ===
        "environment"
    ) {

        currentCamera = "user";

    }

    else {

        currentCamera =
            "environment";

    }

    await startCamera();

}


/* Both camera buttons now work */

cameraButton.addEventListener(
    "click",
    switchCamera
);

cameraModeButton.addEventListener(
    "click",
    switchCamera
);


/* =========================
   ZOOM
========================= */

function setupZoom() {

    const track =
        currentStream
        ?.getVideoTracks()[0];

    if (!track) return;

    const capabilities =
        track.getCapabilities();


    if (capabilities.zoom) {

        zoomMin =
            capabilities.zoom.min;

        zoomMax =
            capabilities.zoom.max;

    }

    else {

        zoomMin = 1;

        zoomMax = 5;

    }


    currentZoom = 1;

    applyZoom(1);

}


async function applyZoom(value) {

    currentZoom =
        Math.max(
            zoomMin,
            Math.min(
                value,
                zoomMax
            )
        );


    const track =
        currentStream
        ?.getVideoTracks()[0];


    if (
        track &&
        track.getCapabilities().zoom
    ) {

        try {

            await track.applyConstraints({

                advanced: [
                    {
                        zoom:
                            currentZoom
                    }
                ]

            });

            video.style.transform =
                "scale(1)";

        }

        catch {

            applyDigitalZoom();

        }

    }

    else {

        applyDigitalZoom();

    }


    updateZoomButton();

}


function applyDigitalZoom() {

    video.style.transform =
        `scale(${currentZoom})`;

}


function updateZoomButton() {

    zoomButton.textContent =
        `${currentZoom.toFixed(1)}×`;

}


zoomButton.addEventListener(
    "click",
    () => {

        let nextZoom;


        if (currentZoom < 1.5) {

            nextZoom = 2;

        }

        else {

            nextZoom = 1;

        }


        applyZoom(nextZoom);

    }
);


/* =========================
   PINCH ZOOM
========================= */

video.addEventListener(
    "touchstart",
    event => {

        if (
            event.touches.length === 2
        ) {

            const a =
                event.touches[0];

            const b =
                event.touches[1];


            pinchStartDistance =
                Math.hypot(
                    b.clientX - a.clientX,
                    b.clientY - a.clientY
                );


            pinchStartZoom =
                currentZoom;

        }

    }
);


video.addEventListener(
    "touchmove",
    event => {

        if (
            event.touches.length === 2 &&
            pinchStartDistance
        ) {

            event.preventDefault();


            const a =
                event.touches[0];

            const b =
                event.touches[1];


            const distance =
                Math.hypot(
                    b.clientX - a.clientX,
                    b.clientY - a.clientY
                );


            const scale =
                distance /
                pinchStartDistance;


            applyZoom(
                pinchStartZoom * scale
            );

        }

    },
    {
        passive: false
    }
);


video.addEventListener(
    "touchend",
    () => {

        pinchStartDistance =
            null;

    }
);


/* =========================
   FOCUS
========================= */

video.addEventListener(
    "click",
    async event => {

        const rect =
            video.getBoundingClientRect();


        const x =
            event.clientX -
            rect.left;


        const y =
            event.clientY -
            rect.top;


        focusIndicator.style.left =
            `${x - 32.5}px`;

        focusIndicator.style.top =
            `${y - 32.5}px`;


        focusIndicator
            .classList
            .remove("active");


        void focusIndicator.offsetWidth;


        focusIndicator
            .classList
            .add("active");


        setTimeout(
            () => {

                focusIndicator
                    .classList
                    .remove("active");

            },
            1200
        );

    }
);


/* =========================
   STYLES PANEL
========================= */

stylesButton.addEventListener(
    "click",
    () => {

        stylePanel
            .classList
            .add("open");

    }
);


closeStyles.addEventListener(
    "click",
    () => {

        stylePanel
            .classList
            .remove("open");

    }
);


/* =========================
   CHOOSE STYLE
========================= */

styleOptions.forEach(option => {

    option.addEventListener(
        "click",
        () => {

            styleOptions
                .forEach(item =>
                    item.classList
                        .remove("active")
                );


            option.classList
                .add("active");


            currentStyle =
                option.dataset.style;


            updateLiveStyle();

        }
    );

});


/* =========================
   STRENGTH
========================= */

strengthSlider.addEventListener(
    "input",
    () => {

        styleStrength =
            Number(
                strengthSlider.value
            );


        strengthValue.textContent =
            styleStrength;


        updateLiveStyle();

    }
);


/* =========================
   LIVE FILTER
========================= */

function updateLiveStyle() {

    const amount =
        styleStrength / 100;


    let filter = "none";


    if (
        currentStyle ===
        "vintage"
    ) {

        filter =
            `sepia(${0.55 * amount})
             saturate(${1 - 0.25 * amount})
             contrast(${1 - 0.08 * amount})`;

    }


    else if (
        currentStyle ===
        "film"
    ) {

        filter =
            `contrast(${1 + 0.25 * amount})
             saturate(${1 - 0.20 * amount})`;

    }


    else if (
        currentStyle ===
        "bw"
    ) {

        filter =
            `grayscale(${amount})
             contrast(${1 + 0.2 * amount})`;

    }


    else if (
        currentStyle ===
        "dreamy"
    ) {

        filter =
            `brightness(${1 + 0.15 * amount})
             saturate(${1 - 0.15 * amount})
             blur(${0.5 * amount}px)`;

    }


    else if (
        currentStyle ===
        "noir"
    ) {

        filter =
            `grayscale(${amount})
             contrast(${1 + 0.5 * amount})
             brightness(${1 - 0.2 * amount})`;

    }


    video.style.filter =
        filter;

}


/* =========================
   TAKE PHOTO
========================= */

function takePhoto() {

    if (!currentStream) {

        alert(
            "Camera isn't ready yet."
        );

        return;

    }


    const width =
        video.videoWidth;

    const height =
        video.videoHeight;


    canvas.width =
        width;

    canvas.height =
        height;


    const context =
        canvas.getContext("2d");


    /*
       Digital zoom crop
    */

    const zoom =
        Math.max(
            1,
            currentZoom
        );


    const cropWidth =
        width / zoom;

    const cropHeight =
        height / zoom;


    const cropX =
        (width - cropWidth) / 2;

    const cropY =
        (height - cropHeight) / 2;


    context.filter =
        getCanvasFilter();


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


    /*
       Film grain
    */

    if (
        currentStyle === "film" ||
        currentStyle === "vintage"
    ) {

        addGrain(
            context,
            width,
            height
        );

    }


    canvas.toBlob(
        blob => {

            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;


            link.download =
                `not-a-camera-${Date.now()}.jpg`;


            link.click();


            URL.revokeObjectURL(
                url
            );

        },

        "image/jpeg",

        0.95
    );

}


/* =========================
   PHOTO FILTER
========================= */

function getCanvasFilter() {

    const amount =
        styleStrength / 100;


    if (
        currentStyle ===
        "vintage"
    ) {

        return `
            sepia(${0.55 * amount})
            saturate(${1 - 0.25 * amount})
            contrast(${1 - 0.08 * amount})
        `;

    }


    if (
        currentStyle ===
        "film"
    ) {

        return `
            contrast(${1 + 0.25 * amount})
            saturate(${1 - 0.20 * amount})
        `;

    }


    if (
        currentStyle ===
        "bw"
    ) {

        return `
            grayscale(${amount})
            contrast(${1 + 0.2 * amount})
        `;

    }


    if (
        currentStyle ===
        "dreamy"
    ) {

        return `
            brightness(${1 + 0.15 * amount})
            saturate(${1 - 0.15 * amount})
        `;

    }


    if (
        currentStyle ===
        "noir"
    ) {

        return `
            grayscale(${amount})
            contrast(${1 + 0.5 * amount})
            brightness(${1 - 0.2 * amount})
        `;

    }


    return "none";

}


/* =========================
   GRAIN
========================= */

function addGrain(
    context,
    width,
    height
) {

    const imageData =
        context.getImageData(
            0,
            0,
            width,
            height
        );


    const data =
        imageData.data;


    const strength =
        styleStrength * 0.35;


    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        const noise =
            (Math.random() - 0.5)
            * strength;


        data[i] =
            Math.max(
                0,
                Math.min(
                    255,
                    data[i] + noise
                )
            );


        data[i + 1] =
            Math.max(
                0,
                Math.min(
                    255,
                    data[i + 1] + noise
                )
            );


        data[i + 2] =
            Math.max(
                0,
                Math.min(
                    255,
                    data[i + 2] + noise
                )
            );

    }


    context.putImageData(
        imageData,
        0,
        0
    );

}


/* =========================
   SHUTTER
========================= */

shutterButton.addEventListener(
    "click",
    takePhoto
);


/* =========================
   START
========================= */

startCamera();
