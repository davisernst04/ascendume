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

// Compiles run one at a time: the engine throws "still spinning" if asked to
// compile while busy. Requests that arrive meanwhile replace each other, so
// only the newest is compiled; the page ignores replies to older ids anyway.
let pending = null;
let running = false;

async function drain() {
  if (running) return;
  running = true;
  try {
    while (pending) {
      const { id, latex } = pending;
      pending = null;
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
    }
  } finally {
    running = false;
  }
}

self.onmessage = (e) => {
  pending = e.data;
  drain();
};
