// public/latex-worker.js
/* global PdfTeXEngine */

let engine = null;
let initPromise = null;

async function initEngine() {
  if (engine) return;
  if (!initPromise) {
    initPromise = (async () => {
      importScripts("/PdfTeXEngine.js");
      engine = new PdfTeXEngine();
      await engine.loadEngine();
    })();
  }
  await initPromise;
}

self.onmessage = async (e) => {
  const { id, latex } = e.data;
  try {
    await initEngine();
    engine.writeMemFSFile("main.tex", latex);
    engine.setEngineMainFile("main.tex");
    const result = await engine.compileLaTeX();
    if (result.pdf !== undefined) {
      self.postMessage({ id, success: true, pdf: result.pdf });
    } else {
      self.postMessage({ id, success: false, log: result.log });
    }
  } catch (err) {
    self.postMessage({
      id,
      success: false,
      log: err instanceof Error ? err.message : String(err),
    });
  }
};
