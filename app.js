const video = document.getElementById("cameraPreview");
const canvas = document.getElementById("photoCanvas");

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


/* =================================
   PHOTO DATABASE
================================= */

const DB_NAME = "NotACameraDB";

const DB_VERSION = 1;

const STORE_NAME = "photos";

let photoDatabase = null;



/* =================================
   OPEN DATABASE
================================= */

function openPhotoDatabase() {

    return new Promise((resolve, reject) => {

        const request =
            indexedDB.open(
                DB_NAME,
                DB_VERSION
            );


        request.onupgradeneeded = event => {

            const database =
                event.target.result;


            if (
                !database.objectStoreNames
                    .contains(STORE_NAME)
            ) {

                const store =
                    database.createObjectStore(
                        STORE_NAME,
                        {
                            keyPath: "id",
                            autoIncrement: true
                        }
                    );


                store.createIndex(
                    "createdAt",
                    "createdAt"
                );

            }

        };


        request.onsuccess = event => {

            photoDatabase =
                event.target.result;

            resolve(photoDatabase);

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}



/* =================================
   SAVE PHOTO
================================= */

function savePhotoToLibrary(blob) {

    return new Promise(
        (resolve, reject) => {

            if (!photoDatabase) {

                reject(
                    new Error(
                        "Photo database isn't ready."
                    )
                );

                return;

            }


            const transaction =
                photoDatabase.transaction(
                    [STORE_NAME],
                    "readwrite"
                );


            const store =
                transaction.objectStore(
                    STORE_NAME
                );


            const photo = {

                image: blob,

                createdAt:
                    Date.now(),

                style:
                    currentStyle,

                strength:
                    styleStrength

            };


            const request =
                store.add(photo);


            request.onsuccess = () => {

                resolve(
                    request.result
                );

            };


            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}




/* =================================
   GET ALL PHOTOS
================================= */

function getAllPhotos() {

    return new Promise(
        (resolve, reject) => {

            if (!photoDatabase) {

                reject(
                    new Error(
                        "Photo database isn't ready."
                    )
                );

                return;

            }


            const transaction =
                photoDatabase.transaction(
                    [STORE_NAME],
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


            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}





/* =================================
   GALLERY ELEMENTS
================================= */

const galleryScreen =
    document.getElementById(
        "galleryScreen"
    );

const galleryGrid =
    document.getElementById(
        "galleryGrid"
    );

const galleryButton =
    document.getElementById(
        "galleryButton"
    );

const closeGallery =
    document.getElementById(
        "closeGallery"
    );


/* =================================
   OPEN GALLERY
================================= */

galleryButton.addEventListener(
    "click",
    async () => {

        galleryScreen
            .classList
            .add("open");


        await loadGallery();

    }
);


/* =================================
   CLOSE GALLERY
================================= */

closeGallery.addEventListener(
    "click",
    () => {

        galleryScreen
            .classList
            .remove("open");

    }
);



/* =================================
   LOAD GALLERY
================================= */

async function loadGallery() {

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
                        Photos you take with
                        your camera will appear here.
                    </p>

                </div>

            `;

            return;

        }


        photos.forEach(photo => {

            const image =
                document.createElement("img");


            image.className =
                "gallery-photo";


            image.src =
                URL.createObjectURL(
                    photo.image
                );


            image.alt =
                "Photo";


            galleryGrid.appendChild(
                image
            );

        });

    }

    catch (error) {

        console.error(
            "Couldn't load gallery:",
            error
        );

    }

}




let currentStream = null;

let currentCamera = "environment";

let currentZoom = 1;

let zoomMin = 1;

let zoomMax = 5;

let currentStyle = "original";

let styleStrength = 70;

let pinchStartDistance = null;

let pinchStartZoom = 1;


/* =================================
   CAMERA STYLES
================================= */

const styles = {

    original: {

        filter: "none",

        grain: 0,

        vignette: 0,

        dust: 0,

        scratches: 0,

        lightLeak: 0,

        halation: 0,

        glow: 0,

        date: false

    },


    vintage: {

        filter: `
            sepia(0.45)
            saturate(0.85)
            contrast(0.94)
        `,

        grain: 18,

        vignette: 0.35,

        dust: 0.08,

        scratches: 0.02,

        lightLeak: 0.12,

        halation: 0.08,

        glow: 0,

        date: false

    },


    film: {

        filter: `
            contrast(1.12)
            saturate(0.82)
        `,

        grain: 28,

        vignette: 0.28,

        dust: 0.10,

        scratches: 0.04,

        lightLeak: 0.05,

        halation: 0.12,

        glow: 0,

        date: false

    },


    disposable: {

        filter: `
            contrast(1.18)
            saturate(1.08)
            brightness(1.05)
        `,

        grain: 38,

        vignette: 0.48,

        dust: 0.16,

        scratches: 0.08,

        lightLeak: 0.18,

        halation: 0.16,

        glow: 0.04,

        date: true

    },


    digital: {

        filter: `
            contrast(1.15)
            saturate(0.9)
            brightness(1.02)
        `,

        grain: 12,

        vignette: 0.12,

        dust: 0,

        scratches: 0,

        lightLeak: 0,

        halation: 0,

        glow: 0,

        date: true

    },


    dreamy: {

        filter: `
            brightness(1.08)
            saturate(0.88)
        `,

        grain: 5,

        vignette: 0.12,

        dust: 0,

        scratches: 0,

        lightLeak: 0.32,

        halation: 0.35,

        glow: 0.35,

        date: false

    },


    night: {

        filter: `
            contrast(1.18)
            brightness(0.88)
            saturate(0.85)
        `,

        grain: 24,

        vignette: 0.38,

        dust: 0.04,

        scratches: 0,

        lightLeak: 0,

        halation: 0.18,

        glow: 0.08,

        date: false

    },


    noir: {

        filter: `
            grayscale(1)
            contrast(1.45)
            brightness(0.88)
        `,

        grain: 25,

        vignette: 0.45,

        dust: 0.08,

        scratches: 0.03,

        lightLeak: 0,

        halation: 0,

        glow: 0,

        date: false

    }

};


/* =================================
   CAMERA START
================================= */

async function startCamera() {

    try {

        if (currentStream) {

            currentStream
                .getTracks()
                .forEach(track => track.stop());

        }


        currentStream =
            await navigator.mediaDevices
            .getUserMedia({

                video: {

                    facingMode:
                        currentCamera

                },

                audio: false

            });


        video.srcObject =
            currentStream;


        await video.play();


        setupZoom();

        updateLiveStyle();

    }

    catch (error) {

        console.error(error);

        alert(
            "Couldn't access the camera."
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


cameraButton.addEventListener(
    "click",
    switchCamera
);


cameraModeButton.addEventListener(
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
            Math.min(value, zoomMax)
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
                        zoom: currentZoom
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


    zoomButton.textContent =
        `${currentZoom.toFixed(1)}×`;

}


function applyDigitalZoom() {

    video.style.transform =
        `scale(${currentZoom})`;

}


zoomButton.addEventListener(
    "click",
    () => {

        applyZoom(
            currentZoom >= 2
                ? 1
                : 2
        );

    }
);


/* =================================
   PINCH ZOOM
================================= */

video.addEventListener(
    "touchstart",
    event => {

        if (event.touches.length !== 2)
            return;


        const a = event.touches[0];
        const b = event.touches[1];


        pinchStartDistance =
            Math.hypot(
                b.clientX - a.clientX,
                b.clientY - a.clientY
            );


        pinchStartZoom =
            currentZoom;

    }
);


video.addEventListener(
    "touchmove",
    event => {

        if (
            event.touches.length !== 2 ||
            !pinchStartDistance
        )
            return;


        event.preventDefault();


        const a = event.touches[0];
        const b = event.touches[1];


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


/* =================================
   TAP TO FOCUS
================================= */

video.addEventListener(
    "click",
    event => {

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


/* =================================
   STYLE PANEL
================================= */

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


/* =================================
   SELECT STYLE
================================= */

styleOptions.forEach(option => {

    option.addEventListener(
        "click",
        () => {

            styleOptions.forEach(item => {

                item.classList
                    .remove("active");

            });


            option.classList
                .add("active");


            currentStyle =
                option.dataset.style;


            updateLiveStyle();

        }
    );

});


/* =================================
   STRENGTH
================================= */

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


/* =================================
   LIVE PREVIEW
================================= */

function updateLiveStyle() {

    const style =
        styles[currentStyle];


    if (!style) return;


    const amount =
        styleStrength / 100;


    if (currentStyle === "original") {

        video.style.filter =
            "none";

        return;

    }


    video.style.filter =
        style.filter;


    /*
       Add live glow for dreamy styles
    */

    if (style.glow > 0) {

        video.style.filter +=
            ` blur(${style.glow * amount}px)`;

    }

}


/* =================================
   TAKE PHOTO
================================= */

function takePhoto() {

    if (!currentStream)
        return;


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


    /*
       Apply style
    */

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
       Effects
    */

    applyFilmGrain(
        context,
        width,
        height
    );


    applyVignette(
        context,
        width,
        height
    );


    applyDust(
        context,
        width,
        height
    );


    applyScratches(
        context,
        width,
        height
    );


    applyLightLeak(
        context,
        width,
        height
    );


    if (
        styles[currentStyle].date
    ) {

        addDateStamp(
            context,
            width,
            height
        );

    }


    /*
       Save
    */

canvas.toBlob(
    async blob => {

        if (!blob) {

            console.error(
                "Couldn't create photo."
            );

            return;

        }


        try {

            await savePhotoToLibrary(
                blob
            );


            console.log(
                "Photo saved to library!"
            );

        }

        catch (error) {

            console.error(
                "Couldn't save photo:",
                error
            );

        }

    },

    "image/jpeg",

    0.95
);

}


shutterButton.addEventListener(
    "click",
    takePhoto
);


/* =================================
   FILTER
================================= */

function getCanvasFilter() {

    const style =
        styles[currentStyle];


    if (!style)
        return "none";


    return style.filter || "none";

}


/* =================================
   GRAIN
================================= */

function applyFilmGrain(
    context,
    width,
    height
) {

    const style =
        styles[currentStyle];


    const amount =
        style.grain *
        (styleStrength / 100);


    if (amount <= 0)
        return;


    const image =
        context.getImageData(
            0,
            0,
            width,
            height
        );


    const data =
        image.data;


    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        const noise =
            (Math.random() - 0.5)
            * amount;


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
        image,
        0,
        0
    );

}


/* =================================
   VIGNETTE
================================= */

function applyVignette(
    context,
    width,
    height
) {

    const style =
        styles[currentStyle];


    const amount =
        style.vignette *
        (styleStrength / 100);


    if (amount <= 0)
        return;


    const gradient =
        context.createRadialGradient(

            width / 2,
            height / 2,
            Math.min(width, height) * 0.25,

            width / 2,
            height / 2,
            Math.max(width, height) * 0.75

        );


    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );


    gradient.addColorStop(
        1,
        `rgba(0,0,0,${amount})`
    );


    context.fillStyle =
        gradient;


    context.fillRect(
        0,
        0,
        width,
        height
    );

}


/* =================================
   DUST
================================= */

function applyDust(
    context,
    width,
    height
) {

    const style =
        styles[currentStyle];


    const amount =
        style.dust *
        (styleStrength / 100);


    const count =
        Math.floor(
            width * height *
            amount / 18000
        );


    context.fillStyle =
        "rgba(255,255,255,0.45)";


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const x =
            Math.random() * width;

        const y =
            Math.random() * height;

        const size =
            Math.random() * 2 + 0.5;


        context.beginPath();

        context.arc(
            x,
            y,
            size,
            0,
            Math.PI * 2
        );

        context.fill();

    }

}


/* =================================
   SCRATCHES
================================= */

function applyScratches(
    context,
    width,
    height
) {

    const style =
        styles[currentStyle];


    const amount =
        style.scratches *
        (styleStrength / 100);


    const count =
        Math.floor(
            amount * 20
        );


    context.strokeStyle =
        "rgba(255,255,255,0.18)";


    context.lineWidth = 1;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const x =
            Math.random() * width;


        context.beginPath();

        context.moveTo(
            x,
            0
        );

        context.lineTo(
            x + Math.random() * 10 - 5,
            height
        );

        context.stroke();

    }

}


/* =================================
   LIGHT LEAK
================================= */

function applyLightLeak(
    context,
    width,
    height
) {

    const style =
        styles[currentStyle];


    const amount =
        style.lightLeak *
        (styleStrength / 100);


    if (amount <= 0)
        return;


    const gradient =
        context.createLinearGradient(
            0,
            0,
            width,
            height
        );


    gradient.addColorStop(
        0,
        `rgba(255,120,40,${amount})`
    );


    gradient.addColorStop(
        0.35,
        "rgba(255,80,30,0)"
    );


    gradient.addColorStop(
        1,
        "rgba(255,80,30,0)"
    );


    context.fillStyle =
        gradient;


    context.fillRect(
        0,
        0,
        width,
        height
    );

}


/* =================================
   DATE STAMP
================================= */

function addDateStamp(
    context,
    width,
    height
) {

    const now =
        new Date();


    const date =
        now.toISOString()
        .slice(0, 10)
        .replaceAll("-", "-");


    context.font =
        `${Math.max(14, width * 0.025)}px monospace`;


    context.fillStyle =
        "rgba(255,110,50,0.9)";


    context.textAlign =
        "right";


    context.fillText(
        date,
        width - 25,
        height - 25
    );

}


/* =================================
   START
================================= */

async function initializeApp() {

    try {

        await openPhotoDatabase();

        console.log(
            "Photo library ready!"
        );

        await startCamera();

    }

    catch (error) {

        console.error(
            "Couldn't initialize app:",
            error
        );

        await startCamera();

    }

}


initializeApp();


