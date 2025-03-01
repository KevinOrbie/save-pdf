/* ================================= Layout ================================ */
function selectHeaderButton(btn) {
    /* Deselect all header buttons. */
    let header = document.getElementById("button-container");
    let buttons = header.getElementsByTagName("button");
    for (const button of buttons) {
        button.className = "";
    }

    /* Select only the passed btn. */
    btn.className = "selected";
}

/* =============================== Functions =============================== */
function selectMode(mode) {
    switch (mode) {
        case "merge": 
            selectHeaderButton(document.getElementById("btn-header-merge"));
            break;

        case "single":
        default: 
            selectHeaderButton(document.getElementById("btn-header-single"));
            break;
    }
}

function resetMergePages() {
    let noPageLabel = document.getElementById("no-pages");
    noPageLabel.className = "";

    let mergePages = document.getElementsByClassName("merge-page");
    while(mergePages[0]) {
        mergePages[0].parentNode.removeChild(mergePages[0]);
    }
}

function addMergePage(pageName) {
    let noPageLabel = document.getElementById("no-pages");
    noPageLabel.className = "hidden";

    let mergeContainer = document.getElementById("merge-page-container");
    let pageRecord = document.createElement("div");
    pageRecord.className = "merge-page";
    pageRecord.innerText = pageName;
    mergeContainer.appendChild(pageRecord);

    /* Update page count. */
    let pageCount = document.getElementById("page-count");
    let mergePages = document.getElementsByClassName("merge-page");
    pageCount.innerText = mergePages.length;
}

/* ============================ Event Handlers ============================= */
function onSingleClicked(event) {
    selectMode("single");
    commSetMode("single");
}

function onMergeClicked(event) {
    selectMode("merge");
    commSetMode("merge");
}

function onMergeCancelled(event) {
    commCancelMerge();
    selectMode("single");
    commSetMode("single");
}

function onMergeCreate(event) {
    commCreateMerge();
    selectMode("single");
    commSetMode("single");
}

/**
 * @brief Sets all event handlers.
 */
function initEventHandlers() {
    let buttons = document.getElementsByTagName("button");
    for (const button of buttons) {
        switch (button.id) {
            case "btn-header-single":button.addEventListener("click", onSingleClicked ); break;
            case "btn-header-merge": button.addEventListener("click", onMergeClicked  ); break;
            case "btn-merge-cancel": button.addEventListener("click", onMergeCancelled); break;
            case "btn-merge-create": button.addEventListener("click", onMergeCreate   ); break;
            default: break;
        }
    }
}

/* ============================= Communication ============================= */
function commCancelMerge() {
    browser.runtime.sendMessage({ command: "merge-cancel" });
}

function commCreateMerge() {
    browser.runtime.sendMessage({ command: "merge-create" });
}

function commSetMode(mode) {
    browser.runtime.sendMessage({ command: "set-mode", mode: mode });
}

async function commGetMode() {
    let response = await browser.runtime.sendMessage({ command: "get-mode" });
    console.log("Recieved mode: ", response);
    return response.mode;
}

async function commGetMergePages() {
    let response = await browser.runtime.sendMessage({ command: "get-merge-pages" });
    return response.pages;
}

/* ============================= Entry Point =============================== */
window.addEventListener("DOMContentLoaded", async function() {
    initEventHandlers();

    /* Get the current mode. */
    let mode = await commGetMode();
    selectMode(mode);

    /* Get all merge pages from background. */
    let mergePageNames = await commGetMergePages();
    for (const mergePageName of mergePageNames) {
        addMergePage(mergePageName);
    }
}, false);

