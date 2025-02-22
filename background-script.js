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
 * @param {string} imageSrc The URI of the image that was taken.
 */
function contentNotify(imageSrc) {
    // TODO: Make more complex if needed (with buttons to confirm, text, etc.)

    const shotImage = document.createElement("img");
    shotImage.setAttribute("src", imageSrc);
    shotImage.style.position = "fixed";
    shotImage.style.top = "20px";
    shotImage.style.right = "20px";
    shotImage.style.zIndex = 9999999;

    shotImage.style.width = "auto"
    shotImage.style.maxWidth = "33vw";
    shotImage.style.maxHeight = "95vh";
    shotImage.style.objectFit = "contain";
    shotImage.style.objectPosition = "top";

    shotImage.style.borderRadius = "8px";
    // shotImage.style.border = "thin solid red";
    shotImage.style.boxShadow = "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";

    shotImage.className = "screenshot-image";
    document.body.appendChild(shotImage);

    setTimeout(() => {
        document.body.removeChild(shotImage);
    }, 5000)
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

async function notify(tab, imageSrc) {
    let result = await browser.scripting.executeScript({ 
        args: [imageSrc],
        func: contentNotify,
        target: { tabId: tab.id }
    });
    return result;
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
    let filename = `${(new Date()).toISOString().replaceAll(":", "").replace("T", "-").replace(".","").replace("Z", "")}-${encodeURIComponent(name).replaceAll("%20","")}.pdf`;
    pdf.save(filename);
}

async function takeScreenshot(tab) {
    /* Step 0: (optional) Set the correct width of the browser window. */
    // NOTE: window.resizeTo only works for windows you created yourself, and when you only have 1 tab.
    // NOTE: Adding custom side margins might mess with content that has absolute positioning.
    // Let the user resize the window itself via the popup and indicate with an overlay (change between red, green, etc.) if the window needs to be wider / smaller.
    // Luxury feature, not really needed

    /* Step 1: Move to the top of the page (makes sure sticky elements are correct). */
    await scrollToTop(tab);

    /* Step 2: Get the correct width / height form the active tab page. */
    let pageSize = await getPageSize(tab);

    // Deal with too long pages (Ex. https://en.wikipedia.org/wiki/United_States)
    if (pageSize.height > 32700) {
        console.log("WARNING: Page longer than 32700 pixels, cropping image size.");
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

    /* Step 4: Notify the user of taken screenshot. */
    await notify(tab, imageUri);

    /* Step 5: Convert the screenshot to PDF. */
    let imageText = await getPageText(tab);

    try {
        await saveAsPDF(pageSize.width, pageSize.height, imageUri, imageText, tab.title);
    } catch(err) {
        console.log("Saving as PDF: ", err);
    } 
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

