#!/usr/bin/env node
/**
 * Generate a SwiftLaTeX-compatible pdfTeX format file.
 *
 * The format file (swiftlatexpdftex.fmt) must be compiled by the exact
 * swiftlatexpdftex.wasm binary — a format from any other pdfTeX binary
 * will be rejected with "Fatal format file error; I'm stymied".
 *
 * This script loads swiftlatexpdftex.js (which contains Emscripten Node.js
 * support) in a mocked worker context, serves LaTeX source files from the
 * local TeXLive installation via a synchronous XMLHttpRequest mock, and
 * triggers _compileFormat() to produce a compatible .fmt file.
 *
 * Run once after changing the WASM binary:
 *   node scripts/generate-swiftlatex-fmt.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');
const publicDir = path.join(repoRoot, 'public');
const outDir = path.join(publicDir, 'texlive', 'pdftex', '10');
const outPath = path.join(outDir, 'swiftlatexpdftex.fmt');

// ── kpse file lookup via local TeXLive ───────────────────────────────────────

// kpathsea format type → implied extension (when the name has no extension)
const FORMAT_EXT = {
  3: '.tfm',   // kpse_tfm_format
  8: '.pfb',   // kpse_type1_format
};

function kpsewhich(filename, formatNum) {
  // Special virtual files — serve as empty
  if (filename === 'nul:' || filename === '/dev/null') return null;

  // Add implied extension when kpse omits it
  let lookup = filename;
  if (formatNum && !filename.includes('.')) {
    const ext = FORMAT_EXT[formatNum];
    if (ext) lookup = filename + ext;
  }

  try {
    const result = execSync(`kpsewhich "${lookup}"`, {
      encoding: 'utf8',
      timeout: 10_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return result || null;
  } catch {
    return null;
  }
}

// ── Synchronous XMLHttpRequest mock ─────────────────────────────────────────
// kpse_find_file_impl in swiftlatexpdftex.js fetches files via sync XHR.
// URL format: /texlive/pdftex/<formatNum>/<filename>
// We resolve <filename> via kpsewhich and read from the local filesystem.

let fileIdCounter = 0;

class MockXMLHttpRequest {
  open(method, url, _async) {
    this._url = url;
    this._filename = null;
    this.status = 0;
    this.response = null;
    this.responseType = '';
    this.timeout = 0;
  }

  send() {
    const m = this._url.match(/\/texlive\/pdftex\/(\d+)\/(.+)$/);
    if (!m) {
      this.status = 404;
      return;
    }
    const formatNum = parseInt(m[1], 10);
    const filename = m[2];
    // Skip the format file itself — we are generating it
    if (filename === 'swiftlatexpdftex.fmt' || filename === 'pdflatex.fmt') {
      this.status = 404;
      return;
    }
    const localPath = kpsewhich(filename, formatNum);
    if (!localPath || !existsSync(localPath)) {
      console.warn(`  [kpse miss] ${filename}`);
      this.status = 404;
      return;
    }
    console.log(`  [kpse hit ] ${filename} → ${localPath}`);
    const buf = readFileSync(localPath);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    this.status = 200;
    this.response = ab;
    // Use the filename as the fileid so savepath = /tex/FILENAME.
    // This means \jobname is derived from the init file's base name,
    // giving \jobname = "pdflatex" → format dumped to pdflatex.fmt ✓
    // Append a counter suffix for files with the same name (shouldn't happen
    // in practice) to ensure uniqueness.
    fileIdCounter++;
    this._fileid = filename;
  }

  getResponseHeader(name) {
    if (name === 'fileid') return this._fileid ?? null;
    return null;
  }
}

// ── Worker self mock ─────────────────────────────────────────────────────────

let resolveFormat;
let rejectFormat;
const fmtPromise = new Promise((res, rej) => {
  resolveFormat = res;
  rejectFormat = rej;
});

let engineReady = false;
let onmessageHandler = null;

const selfMock = {
  location: { href: `file://${publicDir}/swiftlatexpdftex.js` },
  memlog: '',
  initmem: undefined,
  mainfile: 'main.tex',
  texlive_endpoint: '/texlive/',

  postMessage(data) {
    if (data.result === 'ok' && !data.cmd) {
      // WASM initialised — fire compileformat
      if (!engineReady) {
        engineReady = true;
        console.log('Engine ready — triggering compileformat…');
        setImmediate(() => {
          onmessageHandler?.({ data: { cmd: 'compileformat' } });
        });
      }
    } else if (data.cmd === 'compile' && data.result === 'ok' && data.pdf) {
      // Format compiled successfully — pdf field carries the format bytes
      const bytes = new Uint8Array(data.pdf);
      console.log(`Format generated: ${bytes.length} bytes`);
      resolveFormat(bytes);
    } else if (data.result === 'failed') {
      const log = data.log ?? '';
      process.stderr.write('\n=== pdfTeX log ===\n' + log + '\n==================\n');
      rejectFormat(new Error('compileformat failed (see log above)'));
    }
  },

  close() {},
};

// ── Install globals expected by swiftlatexpdftex.js ─────────────────────────

global.self = selfMock;
global.XMLHttpRequest = MockXMLHttpRequest;

if (typeof performance === 'undefined') {
  global.performance = { now: () => Number(process.hrtime.bigint() / 1_000_000n) };
}

// ── Load swiftlatexpdftex.js via vm so it picks up our globals ───────────────

const enginePath = path.join(publicDir, 'swiftlatexpdftex.js');
console.log(`Loading engine from ${enginePath}…`);
const engineSrc = readFileSync(enginePath, 'utf8');

// Patch the source to expose the onmessage setter so we can capture it.
// swiftlatexpdftex.js sets `self["onmessage"] = function(ev){...}`.
// We wrap the assignment so we also store a local reference.
const patched = engineSrc.replace(
  /self\["onmessage"\]\s*=/,
  'onmessageHandler = self["onmessage"] ='
);

// Run in the current context (gives access to all our globals)
const require = createRequire(import.meta.url);
const context = vm.createContext({
  ...global,
  require,
  __dirname: publicDir,
  __filename: enginePath,
  module: { exports: {} },
  exports: {},
  onmessageHandler: null, // will be set by the patched script
  process,
  Buffer,
  // propagate our mocks explicitly
  self: selfMock,
  XMLHttpRequest: MockXMLHttpRequest,
  performance: global.performance,
  console,
  setTimeout,
  setImmediate,
  clearTimeout,
  WebAssembly,
  TextDecoder,
  TextEncoder,
  URL,
});

// After running, grab the onmessageHandler reference from the context
vm.runInContext(patched, context, { filename: enginePath });
onmessageHandler = context.onmessageHandler;

if (!onmessageHandler) {
  throw new Error('onmessage was not set by the engine script — check patching');
}

// ── Wait for format bytes ────────────────────────────────────────────────────

console.log('Waiting for format compilation…');
const fmtBytes = await fmtPromise;

// ── Save result ──────────────────────────────────────────────────────────────

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, fmtBytes);
console.log(`✓ Saved ${fmtBytes.length} bytes → ${outPath}`);
