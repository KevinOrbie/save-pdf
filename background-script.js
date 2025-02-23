import "./libs/jspdf.umd.js" 
// NOTE: PDF.js is only meant to view and render pdf files, not create them.

/* ===================================== Content Functions ===================================== */
// These functions are meant to be injected into a tab.

function contentGetPageSize() {
    pageSize = { width: 0, height: 0 };

    pageSize.width = Math.max(
        document.documentElement.clientWidth,
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth
    );

    pageSize.height = Math.max(
        document.documentElement.clientHeight,
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
    );

    return pageSize;
}

function contentGetPageText() {
    let text = document.body.innerText || document.body.textContent;
    return text;
}

function contentScrollToTop() {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant"
    });
}

/**
 * @brief Add a temporary notification that a screenshot was made to the html page.
 * @param {string} state The current state of the program (processing, success, failure). 
 * @param {string} text The text to display in the notification header.
 * @param {object} options Additional info needed by the notification.
 * @param {object} options.image The URI of the image to display.
 * @param {object} options.warning The warning to give to the user.
 */
function contentNotify(state, text, options) {
    let container = document.getElementById("spdf-notify-container");
    container.style.display = "flex";

    let header = document.getElementById("spdf-header-text");
    header.innerText = text;

    let checkmark = document.getElementById("spdf-checkmark");
    let spinner = document.getElementById("spdf-spinner");
    let cross = document.getElementById("spdf-cross");

    switch (state) {
        case "processing":
            checkmark.style.display = "none";
            cross.style.display = "none";
            spinner.style.display = "inline-block";
            break;

        case "success":
            spinner.style.display = "none";
            cross.style.display = "none";
            checkmark.style.display = "inline-block";
            break;
    
        case "failure":
            spinner.style.display = "none";
            checkmark.style.display = "none";
            cross.style.display = "inline-block";
            break;

        default:
            break;
    }

    /* Set Image */
    if (options && options.hasOwnProperty('image')) {
        let image = document.getElementById("spdf-image");
        image.setAttribute("src", options["image"]);
        image.style.display = "block";
    }

    /* Set Warning if non-emtpy */
    if (options && options.hasOwnProperty('warning') && options["warning"]) {
        let warningText = document.getElementById("spdf-warning-text");
        warningText.innerText = options["warning"];
        let warning = document.getElementById("spdf-warning-container");
        warning.style.display = "block";
    } else {
        let warning = document.getElementById("spdf-warning-container");
        warning.style.display = "none";
    }
}


/* =================================== Background Functions ==================================== */
// Background functions meant for encapsulation

/**
 * @param {browser.Tab} tab The tab to get the page size of.
 * @returns An object with a 'width' and 'height' number value.
 */
async function getPageSize(tab) {
    let result = await browser.scripting.executeScript({ 
        func: contentGetPageSize,
        target: { tabId: tab.id }
    });
    return result[0].result;
}

async function getPageText(tab) {
    let result = await browser.scripting.executeScript({ 
        func: contentGetPageText,
        target: { tabId: tab.id }
    });
    return result[0].result;
}

async function scrollToTop(tab) {
    let result = await browser.scripting.executeScript({ 
        func: contentScrollToTop,
        target: { tabId: tab.id }
    });
    return result;
}

async function injectNotify(tab) {
    let cssresult = await browser.scripting.insertCSS({ 
        files: ["./content/content-style.css"],
        target: { tabId: tab.id }
    });

    let jsresult = await browser.scripting.executeScript({ 
        files: ["./content/content-notify.js"],
        target: { tabId: tab.id }
    });
}

async function notify(tab, state, text, options) {
    let jsresult = await browser.scripting.executeScript({ 
        args: [state, text, options],
        func: contentNotify,
        target: { tabId: tab.id }
    });
    // DEBUG: see each step.
    await new Promise(r => setTimeout(r, 2000));
    return jsresult;
}

async function saveAsPDF(imgWidthPixels, imgHeightPixels, img, text, name) {
    const { jsPDF } = window.jspdf;

    /* Divide the page height. */
    const PPMM = 3.7795296;  // Pixels Per MM (typical 96 PPI, good enough for now) (TODO: try to properly estimate via content injection)
    const pdfMaxPageHeight = 5080;  // mm (max 14400 pt = 5080 mm)
    
    const imgWidthPhysical  = imgWidthPixels / PPMM;   // mm
    const imgHeightPhysical = imgHeightPixels / PPMM;  // mm
    const pdfNumPages   = Math.ceil(imgHeightPhysical / pdfMaxPageHeight);

    const pdfPageWidth = Math.ceil(imgWidthPixels / PPMM);  // mm
    const pdfPageHeight = Math.ceil(imgHeightPhysical / pdfNumPages);

    console.log(`Saving PDF`, {
        "name": name,
        "Image Width (pixels)": imgWidthPixels,
        "Image Height (pixels)": imgHeightPixels,
        "Image PPMM": PPMM,
        "PDF pages": pdfNumPages,
        "PDF page width (mm)": pdfPageWidth,
        "PDF page height (mm)": pdfPageHeight,
        "Image phyiscal width (mm)": imgWidthPhysical,
        "Image phyiscal height (mm)": imgHeightPhysical
    });

    /* Generate PDF pages */
    let pdf = new jsPDF({ unit: "mm", format: [pdfPageWidth, pdfPageHeight], orientation: (pdfPageWidth <= pdfPageHeight) ? "portrait" : "landscape" });
    for (let pageIndex = 0; pageIndex < pdfNumPages; pageIndex++) {
        if (pageIndex > 0) {
            pdf.addPage([pdfPageWidth, pdfPageHeight])
        }

        /* Add an image to the PDF. */
        console.log(`Adding Image: page = ${pageIndex}, x = ${0}, y = ${-pageIndex * (pdfPageHeight)}`);
        pdf.addImage(img, 'png', 0, -pageIndex * (pdfPageHeight), pdfPageWidth, imgHeightPhysical, name);
    }

    /* Add HTML text to PDF. */
    pdf.text(text, 0, 0, { renderingMode: "invisible", lineHeightFactor: 0 });
    
    /* Save the PDF file. */
    // let filename = `${(new Date()).toISOString().replaceAll(":", "").replace("T", "-").replace(".","").replace("Z", "")}-${encodeURIComponent(name).replaceAll("%20","")}.pdf`;
    // pdf.save(filename);
}

async function takeScreenshot(tab) {
    let warning = "";

    /* Step 0: (optional) Set the correct width of the browser window. */
    // NOTE: window.resizeTo only works for windows you created yourself, and when you only have 1 tab.
    // NOTE: Adding custom side margins might mess with content that has absolute positioning.
    // Let the user resize the window itself via the popup and indicate with an overlay (change between red, green, etc.) if the window needs to be wider / smaller.
    // Luxury feature, not really needed

    /* Inject Notification DOM elements (hidden). */
    await injectNotify(tab);

    /* Step 1: Move to the top of the page (makes sure sticky elements are correct). */
    await scrollToTop(tab);

    /* Step 2: Get the correct width / height form the active tab page. */
    let pageSize = await getPageSize(tab);

    // Deal with too long pages (Ex. https://en.wikipedia.org/wiki/United_States)
    if (pageSize.height > 32700) {
        warning = `Web page longer than 32700 pixels, cropping image height.`
        pageSize.height = 32700;
    }
    
    /* Step 3: Take the screenshot. */
    let imageUri;
    try {
        imageUri = await browser.tabs.captureVisibleTab(tab.windowId, {
            rect: { x: 0, y: 0, width: pageSize.width, height: pageSize.height }
        });
    } catch(err) {
        console.log("Getting Screenshot: ", err);
    } 

    /* Step 5: Convert the screenshot to PDF. */
    let imageText = await getPageText(tab);

    await notify(tab, "processing", "Saving PDF", {"warning": warning});
    try {
        await saveAsPDF(pageSize.width, pageSize.height, imageUri, imageText, tab.title);
    } catch(err) {
        console.log("Saving as PDF: ", err);
    }

    await notify(tab, "success", "Saved PDF File", {"image": imageUri, "warning": warning});
}


/* ====================================== Event Listeners ====================================== */
// Listeners must be at the top-level to activate the background script if an event is triggered. 

/**
 * @brief What to run when the application is first installed
 */
browser.runtime.onInstalled.addListener(() => {
    console.log("Installed Extension.");

    /* Defines menu items */
    browser.contextMenus.create({
        id: "saveAsPDF",
        title: "Save As PDF",
        contexts: ["all"],    // Determines when to show menu item
    });
});

/**
 * @brief Defines how to react to clicking on a menu item.
 */
browser.contextMenus.onClicked.addListener(async (info, tab) => {
    console.log("On Clicked called!");

    switch (info.menuItemId) {
      case "saveAsPDF": await takeScreenshot(tab); break;
      default: break;
    }
});

/**
 * @brief Defines how to react to user hotkey events.
 */
browser.commands.onCommand.addListener(async (command) => {
    if (command === "save-as-pdf") {
        const tabs = await browser.tabs.query({currentWindow: true, active: true});
        await takeScreenshot(tabs[0]);
    }
});

