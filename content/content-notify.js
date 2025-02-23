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

    /* ------------------ Setup Icons ------------------ */
    const icon = document.createElement("div");
    icon.id = "spdf-icon"

    const spinner = document.createElement("div");
    spinner.id = "spdf-spinner";
    spinner.appendChild(document.createElement("div"));
    spinner.appendChild(document.createElement("div"));
    spinner.appendChild(document.createElement("div"));
    spinner.appendChild(document.createElement("div"));
    icon.appendChild(spinner);

    const checkmark = document.createElement("div");
    checkmark.id = "spdf-checkmark";
    icon.appendChild(checkmark);

    notifyContainer.appendChild(icon);

    /* ------------------ Setup Header ----------------- */
    const header = document.createElement("span");
    header.id = "spdf-header";
    notifyContainer.appendChild(header);

    /* ----------------- Setup Warning ----------------- */

    /* ------------------ Setup Image ------------------ */

    // const shotImage = document.createElement("img");
    // shotImage.setAttribute("src", imageSrc);
    // shotImage.style.position = "fixed";
    // shotImage.style.top = "20px";
    // shotImage.style.right = "20px";
    // shotImage.style.zIndex = 9999999;

    // shotImage.style.width = "auto"
    // shotImage.style.maxWidth = "33vw";
    // shotImage.style.maxHeight = "95vh";
    // shotImage.style.objectFit = "contain";
    // shotImage.style.objectPosition = "top";

    // shotImage.style.borderRadius = "8px";
    // shotImage.style.boxShadow = "0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19)";

    // shotImage.className = "screenshot-image";
    // document.body.appendChild(shotImage);

    // setTimeout(() => {
    //     document.body.removeChild(shotImage);
    // }, 5000)

    document.body.appendChild(notifyContainer);
})();
  


