/* =====================================================
   NOT A CAMERA
   Camera + Custom Looks + Photo Library + Viewer
===================================================== */


/* =====================================================
   ELEMENTS
===================================================== */

const video =
    document.getElementById("cameraPreview");

const canvas =
    document.getElementById("photoCanvas");

const context =
    canvas.getContext("2d");

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

const cameraStatus =
    document.getElementById("cameraStatus");

const currentStyleLabel =
    document.getElementById("currentStyle");


/* STYLE PANEL */

const stylesButton =
    document.getElementById("stylesButton");

const stylePanel =
    document.getElementById("stylePanel");

const closeStyles =
    document.getElementById("closeStyles");

const styleOptions =
    document.querySelectorAll(".style-option");

const strengthSlider =
    document.getElementById("strengthSlider");

const strengthValue =
    document.getElementById("strengthValue");


/* CUSTOM CONTROLS */

const exposureSlider =
    document.getElementById("exposureSlider");

const contrastSlider =
    document.getElementById("contrastSlider");

const saturationSlider =
    document.getElementById("saturationSlider");

const warmthSlider =
    document.getElementById("warmthSlider");

const grainSlider =
    document.getElementById("grainSlider");

const vignetteSlider =
    document.getElementById("vignetteSlider");

const dustSlider =
    document.getElementById("dustSlider");

const lightLeakSlider =
    document.getElementById("lightLeakSlider");

const dateStampToggle =
    document.getElementById("dateStampToggle");

const resetCameraButton =
    document.getElementById("resetCamera");


/* GALLERY */

const galleryButton =
    document.getElementById("galleryButton");

const galleryScreen =
    document.getElementById("galleryScreen");

const galleryGrid =
    document.getElementById("galleryGrid");

const galleryCount =
    document.getElementById("galleryCount");

const closeGallery =
    document.getElementById("closeGallery");


/* VIEWER */

const photoViewer =
    document.getElementById("photoViewer");

const viewerImage =
    document.getElementById("viewerImage");

const viewerTitle =
    document.getElementById("viewerTitle");

const viewerSubtitle =
    document.getElementById("viewerSubtitle");

const photoInfo =
    document.getElementById("photoInfo");

const closeViewer =
    document.getElementById("closeViewer");

const deletePhotoButton =
    document.getElementById("deletePhoto");

const sharePhotoButton =
    document.getElementById("sharePhoto");

const exportPhotoButton =
    document.getElementById("exportPhoto");

const previousPhotoButton =
    document.getElementById("previousPhoto");

const nextPhotoButton =
    document.getElementById("nextPhoto");

const viewerImageContainer =
    document.getElementById(
        "viewerImageContainer"
    );


/* =====================================================
   STATE
===================================================== */

let currentStream = null;

let currentCamera =
    "environment";

let currentZoom = 1;

let zoomMin = 1;

let zoomMax = 5;

let currentStyle =
    "original";

let styleStrength =
    70;


/* Custom settings */

let customSettings = {

    exposure: 0,

    contrast: 100,

    saturation: 100,

    warmth: 0,

    grain: 0,

    vignette: 0,

    dust: 0,

    lightLeak: 0,

    dateStamp: false

};


/* Viewer */

let galleryPhotos = [];

let currentPhotoIndex = 0;

let currentPhotoUrl = null;


/* =====================================================
   DATABASE
===================================================== */

const DB_NAME =
    "NotACameraDB";

const DB_VERSION =
    1;

const STORE_NAME =
    "photos";

let photoDatabase = null;


function openPhotoDatabase() {

    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.open(
                    DB_NAME,
                    DB_VERSION
                );


            request.onupgradeneeded =
                event => {

                    const database =
                        event.target.result;

                    if (
                        !database
                            .objectStoreNames
                            .contains(
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


            request.onsuccess =
                event => {

                    photoDatabase =
                        event.target.result;

                    resolve();

                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );

                };

        }
    );

}


function savePhotoToLibrary(blob) {

    return new Promise(
        (resolve, reject) => {

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
                        styleStrength,

                    settings:
                        {
                            ...customSettings
                        }

                });


            request.onsuccess =
                () => resolve(
                    request.result
                );


            request.onerror =
                () => reject(
                    request.error
                );

        }
    );

}


function getAllPhotos() {

    return new Promise(
        (resolve, reject) => {

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


            request.onsuccess =
                () => {

                    const photos =
                        request.result.sort(
                            (a, b) =>
                                b.createdAt -
                                a.createdAt
                        );

                    resolve(
                        photos
                    );

                };


            request.onerror =
                () => reject(
                    request.error
                );

        }
    );

}


function deletePhotoFromDatabase(id) {

    return new Promise(
        (resolve, reject) => {

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
                store.delete(id);


            request.onsuccess =
                () => resolve();


            request.onerror =
                () => reject(
                    request.error
                );

        }
    );

}


/* =====================================================
   STATUS MESSAGE
===================================================== */

function showStatus(message) {

    if (!cameraStatus)
        return;


    cameraStatus.textContent =
        message;

    cameraStatus.classList.add(
        "show"
    );


    clearTimeout(
        showStatus.timer
    );


    showStatus.timer =
        setTimeout(
            () => {

                cameraStatus.classList.remove(
                    "show"
                );

            },
            1500
        );

}


/* =====================================================
   CAMERA
===================================================== */

async function startCamera() {

    try {

        if (currentStream) {

            currentStream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );

        }


        currentStream =
            await navigator
                .mediaDevices
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

        updateLivePreview();


        showStatus(
            "Camera ready"
        );

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        showStatus(
            "Camera unavailable"
        );

        alert(
            "The camera could not be opened. On iPhone, make sure you are opening the app from your Home Screen and that camera permission is enabled."
        );

    }

}


/* =====================================================
   SWITCH CAMERA
===================================================== */

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


/* =====================================================
   ZOOM
===================================================== */

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

    applyZoom(
        currentZoom
    );

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
            `${Number(currentZoom).toFixed(1)}×`;

    }

}


function applyDigitalZoom() {

    video.style.transform =
        `scale(${currentZoom})`;

}


zoomButton?.addEventListener(
    "click",
    () => {

        if (currentZoom <= 1.05) {

            applyZoom(2);

        }

        else {

            applyZoom(1);

        }

    }
);


/* =====================================================
   PINCH ZOOM
===================================================== */

let initialPinchDistance = null;

let pinchStartingZoom = 1;


function getTouchDistance(touches) {

    const dx =
        touches[0].clientX -
        touches[1].clientX;

    const dy =
        touches[0].clientY -
        touches[1].clientY;


    return Math.sqrt(
        dx * dx +
        dy * dy
    );

}


video?.addEventListener(
    "touchstart",
    event => {

        if (event.touches.length === 2) {

            initialPinchDistance =
                getTouchDistance(
                    event.touches
                );

            pinchStartingZoom =
                currentZoom;

        }

    },
    {
        passive: true
    }
);


video?.addEventListener(
    "touchmove",
    event => {

        if (
            event.touches.length === 2 &&
            initialPinchDistance
        ) {

            const distance =
                getTouchDistance(
                    event.touches
                );


            const ratio =
                distance /
                initialPinchDistance;


            applyZoom(
                pinchStartingZoom *
                ratio
            );

        }

    },
    {
        passive: true
    }
);


video?.addEventListener(
    "touchend",
    () => {

        initialPinchDistance =
            null;

    }
);


/* =====================================================
   FOCUS INDICATOR
===================================================== */

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


        focusIndicator.classList.remove(
            "active"
        );


        void focusIndicator.offsetWidth;


        focusIndicator.classList.add(
            "active"
        );

    }
);


/* =====================================================
   STYLE PRESETS
===================================================== */

const presets = {

    original: {

        exposure: 0,
        contrast: 100,
        saturation: 100,
        warmth: 0,

        grain: 0,
        vignette: 0,
        dust: 0,
        lightLeak: 0,

        dateStamp: false

    },


    film: {

        exposure: 2,
        contrast: 108,
        saturation: 88,
        warmth: 8,

        grain: 30,
        vignette: 28,
        dust: 8,
        lightLeak: 5,

        dateStamp: false

    },


    vintage: {

        exposure: 0,
        contrast: 96,
        saturation: 78,
        warmth: 18,

        grain: 20,
        vignette: 35,
        dust: 8,
        lightLeak: 12,

        dateStamp: false

    },


    disposable: {

        exposure: 4,
        contrast: 116,
        saturation: 110,
        warmth: 6,

        grain: 38,
        vignette: 45,
        dust: 15,
        lightLeak: 18,

        dateStamp: true

    },


    digital: {

        exposure: 2,
        contrast: 116,
        saturation: 94,
        warmth: 0,

        grain: 8,
        vignette: 10,
        dust: 0,
        lightLeak: 0,

        dateStamp: true

    },


    dreamy: {

        exposure: 5,
        contrast: 92,
        saturation: 88,
        warmth: 4,

        grain: 4,
        vignette: 10,
        dust: 0,
        lightLeak: 30,

        dateStamp: false

    },


    night: {

        exposure: -5,
        contrast: 118,
        saturation: 82,
        warmth: -5,

        grain: 25,
        vignette: 38,
        dust: 3,
        lightLeak: 0,

        dateStamp: false

    },


    noir: {

        exposure: -2,
        contrast: 140,
        saturation: 0,
        warmth: 0,

        grain: 24,
        vignette: 45,
        dust: 7,
        lightLeak: 0,

        dateStamp: false

    }

};


/* =====================================================
   STYLE PANEL
===================================================== */

stylesButton?.addEventListener(
    "click",
    () => {

        stylePanel.classList.add(
            "open"
        );

    }
);


closeStyles?.addEventListener(
    "click",
    () => {

        stylePanel.classList.remove(
            "open"
        );

    }
);


/* =====================================================
   SELECT PRESET
===================================================== */

styleOptions.forEach(
    option => {

        option.addEventListener(
            "click",
            () => {

                styleOptions.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                option.classList.add(
                    "active"
                );


                currentStyle =
                    option.dataset.style;


                loadPreset(
                    currentStyle
                );


                currentStyleLabel.textContent =
                    currentStyle
                        .replace(
                            "original",
                            "ORIGINAL"
                        )
                        .replace(
                            "film",
                            "35MM"
                        )
                        .replace(
                            "vintage",
                            "VINTAGE"
                        )
                        .replace(
                            "disposable",
                            "DISPOSABLE"
                        )
                        .replace(
                            "digital",
                            "DIGITAL"
                        )
                        .replace(
                            "dreamy",
                            "DREAM"
                        )
                        .replace(
                            "night",
                            "NIGHT"
                        )
                        .replace(
                            "noir",
                            "NOIR"
                        )
                        .toUpperCase();

            }

        );

    }
);


/* =====================================================
   LOAD PRESET
===================================================== */

function loadPreset(name) {

    const preset =
        presets[name];


    if (!preset)
        return;


    customSettings = {
        ...preset
    };


    updateControlUI();

    updateLivePreview();

}


/* =====================================================
   CONTROL UI
===================================================== */

function updateControlUI() {

    exposureSlider.value =
        customSettings.exposure;

    contrastSlider.value =
        customSettings.contrast;

    saturationSlider.value =
        customSettings.saturation;

    warmthSlider.value =
        customSettings.warmth;

    grainSlider.value =
        customSettings.grain;

    vignetteSlider.value =
        customSettings.vignette;

    dustSlider.value =
        customSettings.dust;

    lightLeakSlider.value =
        customSettings.lightLeak;

    dateStampToggle.checked =
        customSettings.dateStamp;


    document.getElementById(
        "exposureValue"
    ).textContent =
        customSettings.exposure;

    document.getElementById(
        "contrastValue"
    ).textContent =
        customSettings.contrast;

    document.getElementById(
        "saturationValue"
    ).textContent =
        customSettings.saturation;

    document.getElementById(
        "warmthValue"
    ).textContent =
        customSettings.warmth;

    document.getElementById(
        "grainValue"
    ).textContent =
        customSettings.grain;

    document.getElementById(
        "vignetteValue"
    ).textContent =
        customSettings.vignette;

    document.getElementById(
        "dustValue"
    ).textContent =
        customSettings.dust;

    document.getElementById(
        "lightLeakValue"
    ).textContent =
        customSettings.lightLeak;

}


/* =====================================================
   CUSTOM CONTROL LISTENERS
===================================================== */

function connectSlider(
    slider,
    property,
    outputId
) {

    slider?.addEventListener(
        "input",
        () => {

            customSettings[property] =
                Number(
                    slider.value
                );


            document.getElementById(
                outputId
            ).textContent =
                slider.value;


            currentStyle =
                "custom";


            currentStyleLabel.textContent =
                "CUSTOM";


            styleOptions.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );


            updateLivePreview();

        }
    );

}


connectSlider(
    exposureSlider,
    "exposure",
    "exposureValue"
);

connectSlider(
    contrastSlider,
    "contrast",
    "contrastValue"
);

connectSlider(
    saturationSlider,
    "saturation",
    "saturationValue"
);

connectSlider(
    warmthSlider,
    "warmth",
    "warmthValue"
);

connectSlider(
    grainSlider,
    "grain",
    "grainValue"
);

connectSlider(
    vignetteSlider,
    "vignette",
    "vignetteValue"
);

connectSlider(
    dustSlider,
    "dust",
    "dustValue"
);

connectSlider(
    lightLeakSlider,
    "lightLeak",
    "lightLeakValue"
);


dateStampToggle?.addEventListener(
    "change",
    () => {

        customSettings.dateStamp =
            dateStampToggle.checked;

        currentStyle =
            "custom";

        currentStyleLabel.textContent =
            "CUSTOM";

        updateLivePreview();

    }
);


/* =====================================================
   STRENGTH
===================================================== */

strengthSlider?.addEventListener(
    "input",
    () => {

        styleStrength =
            Number(
                strengthSlider.value
            );


        strengthValue.textContent =
            styleStrength;


        updateLivePreview();

    }
);


/* =====================================================
   RESET
===================================================== */

resetCameraButton?.addEventListener(
    "click",
    () => {

        currentStyle =
            "original";

        styleStrength =
            70;


        strengthSlider.value =
            70;

        strengthValue.textContent =
            70;


        styleOptions.forEach(
            item => {

                item.classList.remove(
                    "active"
                );


                if (
                    item.dataset.style ===
                    "original"
                ) {

                    item.classList.add(
                        "active"
                    );

                }

            }
        );


        loadPreset(
            "original"
        );


        currentStyleLabel.textContent =
            "ORIGINAL";

    }
);


/* =====================================================
   LIVE CAMERA FILTER
===================================================== */

function updateLivePreview() {

    if (!video)
        return;


    const exposure =
        1 +
        customSettings.exposure /
        100;


    const contrast =
        customSettings.contrast /
        100;


    const saturation =
        customSettings.saturation /
        100;


    const warmth =
        customSettings.warmth;


    const warmthFilter =
        warmth > 0
            ? `sepia(${warmth / 120})`
            : "none";


    video.style.filter = `

        brightness(${exposure})

        contrast(${contrast})

        saturate(${saturation})

        ${warmthFilter}

    `;

}


/* =====================================================
   CANVAS FILTER
===================================================== */

function getCanvasFilter() {

    const exposure =
        1 +
        customSettings.exposure /
        100;


    const contrast =
        customSettings.contrast /
        100;


    const saturation =
        customSettings.saturation /
        100;


    const warmth =
        customSettings.warmth;


    const filters = [

        `brightness(${exposure})`,

        `contrast(${contrast})`,

        `saturate(${saturation})`

    ];


    if (warmth > 0) {

        filters.push(
            `sepia(${warmth / 120})`
        );

    }


    if (currentStyle === "noir") {

        filters.push(
            "grayscale(1)"
        );

    }


    return filters.join(" ");

}


/* =====================================================
   TAKE PHOTO
===================================================== */

async function takePhoto() {

    if (
        !currentStream ||
        !video.videoWidth
    ) {

        showStatus(
            "Camera not ready"
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


    context.clearRect(
        0,
        0,
        width,
        height
    );


    context.save();


    context.filter =
        getCanvasFilter();


    context.drawImage(
        video,
        0,
        0,
        width,
        height
    );


    context.restore();


    /* Film effects */

    applyFilmGrain(
        context,
        width,
        height,
        customSettings.grain
    );


    applyVignette(
        context,
        width,
        height,
        customSettings.vignette
    );


    applyDust(
        context,
        width,
        height,
        customSettings.dust
    );


    applyLightLeak(
        context,
        width,
        height,
        customSettings.lightLeak
    );


    if (
        customSettings.dateStamp
    ) {

        addDateStamp(
            context,
            width,
            height
        );

    }


    canvas.toBlob(
        async blob => {

            if (!blob)
                return;


            try {

                await savePhotoToLibrary(
                    blob
                );


                flashShutter();


                showStatus(
                    "Photo saved"
                );

            }

            catch (error) {

                console.error(
                    "Save error:",
                    error
                );

                showStatus(
                    "Couldn't save photo"
                );

            }

        },
        "image/jpeg",
        .95
    );

}


shutterButton?.addEventListener(
    "click",
    takePhoto
);


/* =====================================================
   GRAIN
===================================================== */

function applyFilmGrain(
    ctx,
    width,
    height,
    amount
) {

    if (amount <= 0)
        return;


    const imageData =
        ctx.getImageData(
            0,
            0,
            width,
            height
        );


    const data =
        imageData.data;


    const intensity =
        amount * .7;


    for (
        let i = 0;
        i < data.length;
        i += 4
    ) {

        const noise =
            (Math.random() -
                .5) *
            intensity;


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


    ctx.putImageData(
        imageData,
        0,
        0
    );

}


/* =====================================================
   VIGNETTE
===================================================== */

function applyVignette(
    ctx,
    width,
    height,
    amount
) {

    if (amount <= 0)
        return;


    const gradient =
        ctx.createRadialGradient(
            width / 2,
            height / 2,
            Math.min(width,height) * .2,
            width / 2,
            height / 2,
            Math.max(width,height) * .7
        );


    gradient.addColorStop(
        0,
        "rgba(0,0,0,0)"
    );


    gradient.addColorStop(
        1,
        `rgba(0,0,0,${amount / 100})`
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        width,
        height
    );

}


/* =====================================================
   DUST
===================================================== */

function applyDust(
    ctx,
    width,
    height,
    amount
) {

    if (amount <= 0)
        return;


    const count =
        Math.floor(
            amount * 1.5
        );


    ctx.save();


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const x =
            Math.random() *
            width;

        const y =
            Math.random() *
            height;

        const radius =
            Math.random() *
            2.5 +
            .4;


        ctx.fillStyle =
            `rgba(
                255,
                255,
                255,
                ${Math.random() * .25}
            )`;


        ctx.beginPath();

        ctx.arc(
            x,
            y,
            radius,
            0,
            Math.PI * 2
        );

        ctx.fill();

    }


    ctx.restore();

}


/* =====================================================
   LIGHT LEAK
===================================================== */

function applyLightLeak(
    ctx,
    width,
    height,
    amount
) {

    if (amount <= 0)
        return;


    const gradient =
        ctx.createLinearGradient(
            0,
            0,
            width,
            height
        );


    gradient.addColorStop(
        0,
        `rgba(255,80,30,${amount / 250})`
    );


    gradient.addColorStop(
        .35,
        "rgba(255,150,40,0)"
    );


    gradient.addColorStop(
        1,
        "rgba(255,0,0,0)"
    );


    ctx.fillStyle =
        gradient;


    ctx.fillRect(
        0,
        0,
        width,
        height
    );

}


/* =====================================================
   DATE STAMP
===================================================== */

function addDateStamp(
    ctx,
    width,
    height
) {

    const date =
        new Date();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    const year =
        String(
            date.getFullYear()
        ).slice(-2);


    const text =
        `${month}/${day}/${year}`;


    const size =
        Math.max(
            18,
            width * .025
        );


    ctx.save();


    ctx.font =
        `${size}px monospace`;

    ctx.fillStyle =
        "rgba(255,170,40,.9)";

    ctx.shadowColor =
        "rgba(0,0,0,.4)";

    ctx.shadowBlur =
        3;


    ctx.fillText(
        text,
        width - size * 6.5,
        height - size * 1.2
    );


    ctx.restore();

}


/* =====================================================
   SHUTTER ANIMATION
===================================================== */

function flashShutter() {

    shutterButton.style.transform =
        "scale(.88)";


    setTimeout(
        () => {

            shutterButton.style.transform =
                "";

        },
        120
    );

}


/* =====================================================
   GALLERY OPEN
===================================================== */

galleryButton?.addEventListener(
    "click",
    async () => {

        galleryScreen.classList.add(
            "open"
        );

        await loadGallery();

    }
);


closeGallery?.addEventListener(
    "click",
    () => {

        galleryScreen.classList.remove(
            "open"
        );

    }
);


/* =====================================================
   LOAD GALLERY
===================================================== */

async function loadGallery() {

    galleryGrid.innerHTML =
        "";


    galleryPhotos =
        await getAllPhotos();


    galleryCount.textContent =
        galleryPhotos.length;


    if (
        galleryPhotos.length === 0
    ) {

        galleryGrid.innerHTML = `

            <div class="gallery-empty">

                <div class="gallery-empty-icon">
                    📷
                </div>

                <h3>
                    No photos yet
                </h3>

                <p>
                    Take your first photo
                    and it will appear here.
                </p>

            </div>

        `;

        return;

    }


    galleryPhotos.forEach(
        (photo, index) => {

            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "gallery-photo";


            image.src =
                URL.createObjectURL(
                    photo.image
                );


            image.alt =
                `Photo ${index + 1}`;


            image.addEventListener(
                "click",
                () => {

                    openPhotoViewer(
                        index
                    );

                }
            );


            galleryGrid.appendChild(
                image
            );

        }
    );

}


/* =====================================================
   OPEN PHOTO VIEWER
===================================================== */

function openPhotoViewer(index) {

    if (
        !galleryPhotos.length
    )
        return;


    currentPhotoIndex =
        index;


    updatePhotoViewer();


    photoViewer.classList.add(
        "open"
    );

}


function updatePhotoViewer() {

    const photo =
        galleryPhotos[
            currentPhotoIndex
        ];


    if (!photo)
        return;


    if (currentPhotoUrl) {

        URL.revokeObjectURL(
            currentPhotoUrl
        );

    }


    currentPhotoUrl =
        URL.createObjectURL(
            photo.image
        );


    viewerImage.src =
        currentPhotoUrl;


    viewerTitle.textContent =
        `Photo ${currentPhotoIndex + 1}`;


    viewerSubtitle.textContent =
        photo.style === "custom"
            ? "CUSTOM"
            : photo.style.toUpperCase();


    const date =
        new Date(
            photo.createdAt
        );


    const dateText =
        date.toLocaleDateString(
            undefined,
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );


    const timeText =
        date.toLocaleTimeString(
            undefined,
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );


    photoInfo.textContent =
        `${dateText} · ${timeText} · ${photo.style.toUpperCase()}`;


    previousPhotoButton.classList.toggle(
        "hidden",
        galleryPhotos.length <= 1
    );


    nextPhotoButton.classList.toggle(
        "hidden",
        galleryPhotos.length <= 1
    );

}


/* =====================================================
   CLOSE VIEWER
===================================================== */

closeViewer?.addEventListener(
    "click",
    closePhotoViewer
);


function closePhotoViewer() {

    photoViewer.classList.remove(
        "open"
    );


    if (currentPhotoUrl) {

        URL.revokeObjectURL(
            currentPhotoUrl
        );

        currentPhotoUrl =
            null;

    }

}


/* =====================================================
   NEXT / PREVIOUS
===================================================== */

previousPhotoButton?.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        if (
            galleryPhotos.length <= 1
        )
            return;


        currentPhotoIndex =
            currentPhotoIndex <= 0
                ? galleryPhotos.length - 1
                : currentPhotoIndex - 1;


        updatePhotoViewer();

    }
);


nextPhotoButton?.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        if (
            galleryPhotos.length <= 1
        )
            return;


        currentPhotoIndex =
            currentPhotoIndex >=
                galleryPhotos.length - 1
                ? 0
                : currentPhotoIndex + 1;


        updatePhotoViewer();

    }
);


/* =====================================================
   SWIPE VIEWER
===================================================== */

let swipeStartX = 0;

let swipeStartY = 0;


viewerImageContainer?.addEventListener(
    "touchstart",
    event => {

        if (
            event.touches.length !== 1
        )
            return;


        swipeStartX =
            event.touches[0].clientX;

        swipeStartY =
            event.touches[0].clientY;

    },
    {
        passive: true
    }
);


viewerImageContainer?.addEventListener(
    "touchend",
    event => {

        if (
            event.changedTouches.length !== 1
        )
            return;


        const endX =
            event.changedTouches[0].clientX;

        const endY =
            event.changedTouches[0].clientY;


        const differenceX =
            endX -
            swipeStartX;

        const differenceY =
            endY -
            swipeStartY;


        if (
            Math.abs(differenceX) < 60 ||
            Math.abs(differenceX) <
                Math.abs(differenceY)
        ) {

            return;

        }


        if (differenceX < 0) {

            nextPhotoButton.click();

        }

        else {

            previousPhotoButton.click();

        }

    },
    {
        passive: true
    }
);


/* =====================================================
   DELETE PHOTO
===================================================== */

deletePhotoButton?.addEventListener(
    "click",
    async () => {

        const photo =
            galleryPhotos[
                currentPhotoIndex
            ];


        if (!photo)
            return;


        const confirmed =
            confirm(
                "Delete this photo?"
            );


        if (!confirmed)
            return;


        try {

            await deletePhotoFromDatabase(
                photo.id
            );


            galleryPhotos.splice(
                currentPhotoIndex,
                1
            );


            if (
                galleryPhotos.length === 0
            ) {

                closePhotoViewer();

                await loadGallery();

                return;

            }


            if (
                currentPhotoIndex >=
                galleryPhotos.length
            ) {

                currentPhotoIndex =
                    galleryPhotos.length - 1;

            }


            updatePhotoViewer();

            await loadGallery();

            showStatus(
                "Photo deleted"
            );

        }

        catch (error) {

            console.error(
                error
            );

            alert(
                "Couldn't delete photo."
            );

        }

    }
);


/* =====================================================
   SHARE
===================================================== */

sharePhotoButton?.addEventListener(
    "click",
    async () => {

        const photo =
            galleryPhotos[
                currentPhotoIndex
            ];


        if (!photo)
            return;


        const file =
            new File(
                [
                    photo.image
                ],
                `photo-${photo.id}.jpg`,
                {
                    type:
                        "image/jpeg"
                }
            );


        if (
            navigator.share &&
            navigator.canShare &&
            navigator.canShare({
                files: [file]
            })
        ) {

            try {

                await navigator.share({

                    files: [file],

                    title:
                        "Photo"

                });

            }

            catch (error) {

                if (
                    error.name !==
                    "AbortError"
                ) {

                    console.error(
                        error
                    );

                }

            }

        }

        else {

            alert(
                "Photo sharing isn't supported here. Try Export instead."
            );

        }

    }
);


/* =====================================================
   EXPORT
===================================================== */

exportPhotoButton?.addEventListener(
    "click",
    async () => {

        const photo =
            galleryPhotos[
                currentPhotoIndex
            ];


        if (!photo)
            return;


        const url =
            URL.createObjectURL(
                photo.image
            );


        const link =
            document.createElement(
                "a"
            );


        link.href =
            url;


        link.download =
            `not-a-camera-${photo.id}.jpg`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        setTimeout(
            () => {

                URL.revokeObjectURL(
                    url
                );

            },
            1000
        );

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

async function initializeApp() {

    try {

        await openPhotoDatabase();

        loadPreset(
            "original"
        );

        await startCamera();

    }

    catch (error) {

        console.error(
            "Initialization error:",
            error
        );

    }

}


initializeApp();
