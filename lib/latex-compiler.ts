// lib/latex-compiler.ts

type PendingEntry = {
  resolve: (pdf: Uint8Array) => void;
  reject: (err: Error) => void;
};

let worker: Worker | null = null;
const pending = new Map<number, PendingEntry>();
let nextId = 0;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker("/latex-worker.js");

    worker.onmessage = (e: MessageEvent) => {
      const { id, success, pdf, log } = e.data as {
        id: number;
        success: boolean;
        pdf?: Uint8Array;
        log?: string;
      };
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      if (success && pdf) {
        entry.resolve(pdf);
      } else {
        entry.reject(new Error(log ?? "LaTeX compilation failed"));
      }
    };

    worker.onerror = (e: ErrorEvent) => {
      const err = new Error(e.message ?? "Worker error");
      for (const entry of pending.values()) {
        entry.reject(err);
      }
      pending.clear();
      worker = null; // Will be recreated on next call
    };
  }
  return worker;
}

/**
 * Compiles a LaTeX string to PDF bytes using SwiftLaTeX pdflatex WASM.
 * The worker is initialized lazily and reused across calls.
 * First call may take 10–30s while SwiftLaTeX fetches packages.
 */
export function compileLaTeX(latexString: string): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, latex: latexString });
  });
}
