/**
 * @brief Implements popup logic.
 * 
 * @file popup.js
 * @author Kevin Orbie
 */

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

function cycleDeleteMerge() {
    let container = document.getElementById("btn-merge-cancel");
    let icon = container.firstElementChild;
    let span = container.lastElementChild;
    let finished = false;

    switch (span.innerText) {
        case "3": span.innerText = 2; break;
        case "2": span.innerText = 1; break;

        case "0":  // Icon --> Countdowm
            span.innerText = 3; 
            icon.style.display = "none";
            span.style.display = "block";
            break;

        case "1":  // Countdowm --> Icon
        default:
            finished = true;
            resetDeleteMerge();
            break;
    }

    return finished;
}

function resetDeleteMerge() {
    let container = document.getElementById("btn-merge-cancel");
    let icon = container.firstElementChild;
    let span = container.lastElementChild;
    span.innerText = 0;
    icon.style.display = "block";
    span.style.display = "none";
}

function updateMergeBtn(loading) {
    let container = document.getElementById("btn-merge-create");
    let span = container.firstElementChild;
    let icon = container.lastElementChild;

    if (loading === true) {
        span.style.display = "none";
        icon.style.display = "inline-block";
    } else {
        span.style.display = "block";
        icon.style.display = "none";
    }
}

function resetMergePages() {
    let noPageLabel = document.getElementById("no-pages");
    noPageLabel.className = "";

    let mergePages = document.getElementsByClassName("merge-page");
    while(mergePages[0]) {
        mergePages[0].parentNode.removeChild(mergePages[0]);
    }

    /* Reset page count. */
    let pageCount = document.getElementById("page-count");
    pageCount.innerText = mergePages.length;
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

var deleteMergeTimeoutID = 0;
function onMergeCancel(event) {
    let cycleDone = cycleDeleteMerge();
    if (cycleDone) {
        commCancelMerge();
        resetMergePages();
        selectMode("single");
        commSetMode("single");
    }

    /* Make sure the button resets after 1 sec of no interaction. */
    clearTimeout(deleteMergeTimeoutID);
    deleteMergeTimeoutID = setTimeout(resetDeleteMerge, 1000);
}

async function onMergeCreate(event) {
    updateMergeBtn(true);
    await commCreateMerge();
    updateMergeBtn(false);

    /* Reset mode to single. */
    selectMode("single");
    commSetMode("single");

    /* Clear old pages from view. */
    resetMergePages();
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
            case "btn-merge-cancel": button.addEventListener("click", onMergeCancel   ); break;
            case "btn-merge-create": button.addEventListener("click", onMergeCreate   ); break;
            default: break;
        }
    }
}

/* ============================= Communication ============================= */
/* These functions are used to communicate with the background script. */

function commCancelMerge() {
    browser.runtime.sendMessage({ command: "merge-cancel" });
}

async function commCreateMerge() {
    await browser.runtime.sendMessage({ command: "merge-create" });
}

function commSetMode(mode) {
    browser.runtime.sendMessage({ command: "set-mode", mode: mode });
}

async function commGetMode() {
    let response = await browser.runtime.sendMessage({ command: "get-mode" });
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

