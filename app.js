/* =================================
   ELEMENTS
================================= */

const video = document.getElementById("cameraPreview");
const canvas = document.getElementById("photoCanvas");

const shutterButton = document.getElementById("shutterButton");
const cameraButton = document.getElementById("cameraButton");
const cameraModeButton = document.getElementById("cameraModeButton");
const zoomButton = document.getElementById("zoomButton");
const focusIndicator = document.getElementById("focusIndicator");

const stylesButton = document.getElementById("stylesButton");
const stylePanel = document.getElementById("stylePanel");
const closeStyles = document.getElementById("closeStyles");
const strengthSlider = document.getElementById("strengthSlider");
const strengthValue = document.getElementById("strengthValue");
const styleOptions = document.querySelectorAll(".style-option");

const galleryScreen = document.getElementById("galleryScreen");
const galleryGrid = document.getElementById("galleryGrid");
const galleryButton = document.getElementById("galleryButton");
const closeGallery = document.getElementById("closeGallery");


/* =================================
   APP STATE
================================= */

let currentStream = null;
let currentCamera = "environment";

let currentZoom = 1;
let zoomMin = 1;
let zoomMax = 5;

let currentStyle = "original";
let styleStrength = 70;


/* =================================
   DATABASE
================================= */

const DB_NAME = "NotACameraDB";
const DB_VERSION = 1;
const STORE_NAME = "photos";

let photoDatabase = null;


function openPhotoDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );

        request.onupgradeneeded = event => {

            const database =
                event.target.result;

            if (
                !database.objectStoreNames.contains(
                    STORE_NAME
                )
            ) {

                database.createObjectStore(
                    STORE_NAME,
                    {
                        keyPath: "id",
                        autoIncrement: true
                    }
                );

            }

        };


        request.onsuccess = event => {

            photoDatabase =
                event.target.result;

            console.log(
                "Photo database ready"
            );

            resolve();

        };


        request.onerror = () => {

            reject(request.error);

        };

    });

}


function savePhotoToLibrary(blob) {

    return new Promise((resolve, reject) => {

        const transaction =
            photoDatabase.transaction(
                STORE_NAME,
                "readwrite"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.add({

                image: blob,

                createdAt:
                    Date.now(),

                style:
                    currentStyle,

                strength:
                    styleStrength

            });


        request.onsuccess =
            () => resolve();


        request.onerror =
            () => reject(
                request.error
            );

    });

}


function getAllPhotos() {

    return new Promise((resolve, reject) => {

        const transaction =
            photoDatabase.transaction(
                STORE_NAME,
                "readonly"
            );

        const store =
            transaction.objectStore(
                STORE_NAME
            );

        const request =
            store.getAll();


        request.onsuccess = () => {

            const photos =
                request.result.sort(
                    (a, b) =>
                        b.createdAt -
                        a.createdAt
                );

            resolve(photos);

        };


        request.onerror =
            () => reject(
                request.error
            );

    });

}


/* =================================
   CAMERA
================================= */

async function startCamera() {

    try {

        if (currentStream) {

            currentStream
                .getTracks()
                .forEach(track =>
                    track.stop()
                );

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

        video.srcObject =
            currentStream;

        await video.play();

        setupZoom();

        updateLiveStyle();

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );

        alert(
            "Couldn't access camera."
        );

    }

}


/* =================================
   CAMERA SWITCH
================================= */

async function switchCamera() {

    currentCamera =
        currentCamera === "environment"
            ? "user"
            : "environment";

    await startCamera();

}


cameraButton?.addEventListener(
    "click",
    switchCamera
);

cameraModeButton?.addEventListener(
    "click",
    switchCamera
);


/* =================================
   ZOOM
================================= */

function setupZoom() {

    const track =
        currentStream
            ?.getVideoTracks()[0];

    if (!track)
        return;


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


    if (zoomButton) {

        zoomButton.textContent =
            `${currentZoom.toFixed(1)}×`;

    }

}


function applyDigitalZoom() {

    video.style.transform =
        `scale(${currentZoom})`;

}


zoomButton?.addEventListener(
    "click",
    () => {

        const nextZoom =
            currentZoom < 1.5
                ? 2
                : 1;

        applyZoom(nextZoom);

    }
);


/* =================================
   FOCUS INDICATOR
================================= */

video?.addEventListener(
    "click",
    event => {

        if (!focusIndicator)
            return;


        const rect =
            video.getBoundingClientRect();

        const x =
            event.clientX -
            rect.left;

        const y =
            event.clientY -
            rect.top;


        focusIndicator.style.left =
            `${x - 32}px`;

        focusIndicator.style.top =
            `${y - 32}px`;


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
            1000
        );

    }
);


/* =================================
   STYLE PANEL
================================= */

stylesButton?.addEventListener(
    "click",
    () => {

        stylePanel
            ?.classList
            .add("open");

    }
);


closeStyles?.addEventListener(
    "click",
    () => {

        stylePanel
            ?.classList
            .remove("open");

    }
);


/* =================================
   STYLE SELECTION
================================= */

styleOptions.forEach(option => {

    option.addEventListener(
        "click",
        () => {

            styleOptions.forEach(item =>
                item.classList.remove(
                    "active"
                )
            );


            option.classList.add(
                "active"
            );


            currentStyle =
                option.dataset.style;


            updateLiveStyle();

        }
    );

});


strengthSlider?.addEventListener(
    "input",
    () => {

        styleStrength =
            Number(
                strengthSlider.value
            );

        if (strengthValue) {

            strengthValue.textContent =
                styleStrength;

        }


        updateLiveStyle();

    }
);


/* =================================
   LIVE STYLES
================================= */

function updateLiveStyle() {

    if (!video)
        return;


    switch (currentStyle) {

        case "vintage":

            video.style.filter =
                "sepia(0.4) saturate(0.85) contrast(0.95)";

            break;


        case "film":

            video.style.filter =
                "contrast(1.15) saturate(0.82)";

            break;


        case "bw":

            video.style.filter =
                "grayscale(1) contrast(1.15)";

            break;


        case "dreamy":

            video.style.filter =
                "brightness(1.1) saturate(0.85)";

            break;


        case "noir":

            video.style.filter =
                "grayscale(1) contrast(1.5) brightness(0.85)";

            break;


        default:

            video.style.filter =
                "none";

    }

}


/* =================================
   PHOTO FILTER
================================= */

function getCanvasFilter() {

    switch (currentStyle) {

        case "vintage":

            return (
                "sepia(0.4) " +
                "saturate(0.85) " +
                "contrast(0.95)"
            );


        case "film":

            return (
                "contrast(1.15) " +
                "saturate(0.82)"
            );


        case "bw":

            return (
                "grayscale(1) " +
                "contrast(1.15)"
            );


        case "dreamy":

            return (
                "brightness(1.1) " +
                "saturate(0.85)"
            );


        case "noir":

            return (
                "grayscale(1) " +
                "contrast(1.5) " +
                "brightness(0.85)"
            );


        default:

            return "none";

    }

}


/* =================================
   TAKE PHOTO
================================= */

function takePhoto() {

    if (
        !currentStream ||
        !video.videoWidth
    ) {

        console.log(
            "Camera not ready yet"
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


    context.filter =
        getCanvasFilter();


    context.drawImage(
        video,
        0,
        0,
        width,
        height
    );


    canvas.toBlob(
        async blob => {

            if (!blob)
                return;


            try {

                await savePhotoToLibrary(
                    blob
                );


                console.log(
                    "Photo saved!"
                );

                flashShutter();

            }

            catch (error) {

                console.error(
                    "Save error:",
                    error
                );

            }

        },

        "image/jpeg",
        0.95
    );

}


shutterButton?.addEventListener(
    "click",
    takePhoto
);


/* =================================
   SHUTTER FEEDBACK
================================= */

function flashShutter() {

    if (!shutterButton)
        return;


    shutterButton.style.transform =
        "scale(0.88)";


    setTimeout(
        () => {

            shutterButton.style.transform =
                "";

        },
        120
    );

}


/* =================================
   GALLERY
================================= */

galleryButton?.addEventListener(
    "click",
    async () => {

        galleryScreen
            ?.classList
            .add("open");

        await loadGallery();

    }
);


closeGallery?.addEventListener(
    "click",
    () => {

        galleryScreen
            ?.classList
            .remove("open");

    }
);


async function loadGallery() {

    if (!galleryGrid)
        return;


    galleryGrid.innerHTML = "";


    try {

        const photos =
            await getAllPhotos();


        if (photos.length === 0) {

            galleryGrid.innerHTML = `

                <div class="gallery-empty">

                    <div class="gallery-empty-icon">
                        📷
                    </div>

                    <h3>No photos yet</h3>

                    <p>
                        Take a photo and it will
                        appear here.
                    </p>

                </div>

            `;

            return;

        }


        photos.forEach(photo => {

            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "gallery-photo";


            const url =
                URL.createObjectURL(
                    photo.image
                );


            image.src = url;


            galleryGrid.appendChild(
                image
            );

        });

    }

    catch (error) {

        console.error(
            "Gallery error:",
            error
        );

    }

}


/* =================================
   INITIALIZE APP
================================= */

async function initializeApp() {

    try {

        await openPhotoDatabase();

    }

    catch (error) {

        console.error(
            "Database error:",
            error
        );

    }


    await startCamera();

}


initializeApp();
