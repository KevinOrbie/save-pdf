/**
 * @brief Web Worker code to run CPU intensive PDF code in a seperate thread.
 * 
 * @file pdf-worker.js
 * @author Kevin Orbie
 */

/**
 * @note jsPDF is used to generate PDF files.
 * @note Originally I tried to use PDF.js, but this is only meant to view and render pdf files, not create them.
 */
import "./libs/jspdf.umd.js" 

/* ====================================== Work Functions ======================================= */


/* ====================================== Event Listeners ====================================== */
self.addEventListener('message', (e) => {
    const { data } = e;
    if (!data) return;
      self.postMessage({data: 'worker received data'})
});

// NOTE: It can't access storage.local, but it can access indexedDB, which is meant for larger storage
// NOTE: Web workers are not just functions ran in a different thread, but are meant to only communicate via messages and events (requires large redesing).
// NOTE: Because of the large images, we might also need to use Shared memory while transferring.
// NOTE: Maybe it is best to only use this thread to Create / Save the pdf files, reading data from IndexDB.
