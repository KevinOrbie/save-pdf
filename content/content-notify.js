/**
 * @brief Injects the save-pdf notification DOM elements into the webpage this is injected into.
 */

(() => {

    /**
     * @note Check and set a global guard variable. 
     * @details If this content script is injected into the same page again, it will do nothing next time.
     */
    if (window.spdfHasRun) {
        return;
    } 
    window.spdfHasRun = true;
  
    /* ---------------- Setup Container ---------------- */
    const notifyContainer = document.createElement("div");
    notifyContainer.id = "spdf-notify-container";

    const headerContainer = document.createElement("div");
    headerContainer.id = "spdf-header-container";
    notifyContainer.appendChild(headerContainer);

    const contentContainer = document.createElement("div");
    contentContainer.id = "spdf-content-container";
    notifyContainer.appendChild(contentContainer);

    /* ------------------ Setup Icons ------------------ */
    const icon = document.createElement("div");
    icon.className = "spdf-font";
    icon.id = "spdf-icon"

    /* Spinner Icon */
    const spinner = document.createElement("div");
    spinner.id = "spdf-spinner";
    spinner.className = "spdf-font";
    spinner.appendChild(document.createElement("div"));
    spinner.appendChild(document.createElement("div"));
    spinner.appendChild(document.createElement("div"));
    spinner.appendChild(document.createElement("div"));
    icon.appendChild(spinner);

    /* Checkmark Icon */
    const checkmark = document.createElement("div");
    checkmark.id = "spdf-checkmark";
    checkmark.className = "spdf-font";
    icon.appendChild(checkmark);

    /* Cross Icon */
    const cross = document.createElement("div");
    cross.className = "spdf-font";
    cross.id = "spdf-cross";
    icon.appendChild(cross);

    headerContainer.appendChild(icon);

    /* ------------------ Setup Header ----------------- */
    const header = document.createElement("span");
    header.className = "spdf-font";
    header.id = "spdf-header-text";
    headerContainer.appendChild(header);

    /* ----------------- Setup Warning ----------------- */
    const warningContainer = document.createElement("div");
    warningContainer.id = "spdf-warning-container";
    warningContainer.className = "spdf-font";
    contentContainer.appendChild(warningContainer);

    const warningHeader = document.createElement("p");
    warningHeader.id = "spdf-warning-header";
    warningHeader.className = "spdf-font";
    warningHeader.innerText = "Warning:";
    const warningText = document.createElement("p");
    warningText.id = "spdf-warning-text";
    warningText.className = "spdf-font";
    warningText.innerText = "This the explanation of this warning. It uses numbers and letters to bring accross a point.";

    warningContainer.appendChild(warningHeader);
    warningContainer.appendChild(warningText);

    /* ------------------ Setup Image ------------------ */
    const image = document.createElement("img");
    image.setAttribute("src", "");
    image.className = "spdf-font";
    image.id = "spdf-image";
    contentContainer.appendChild(image);

    document.body.appendChild(notifyContainer);
})();
  


