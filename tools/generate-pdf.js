#!/usr/bin/env node
/* eslint-env node */
/* global process */
/**
 * Generador de PDFs de documentación.
 * Convierte los archivos Markdown a PDF usando (en orden):
 * 1. Pandoc (si está instalado en PATH)
 * 2. Marp (si está instalado local o vía npx con @marp-team/marp-cli)
 * 3. Fallback: genera un HTML simple y avisa que conviertas manualmente.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const docs = [
  'src/doc/ManualUsuario.md',
  'src/doc/ManualUsuario_print.md',
  'src/doc/ManualTecnico.md'
];

const outDir = 'docs-pdf';
mkdirSync(outDir, { recursive: true });

function commandExists(cmd) {
  try {
    execSync(process.platform === 'win32' ? `where ${cmd}` : `command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function tryPandoc(file) {
  const base = file.split('/').pop().replace(/\.md$/i, '');
  const out = `${outDir}/${base}.pdf`;
  run(`pandoc "${file}" -o "${out}" --pdf-engine=xelatex`);
}


function fallbackHTML(file) {
  const base = file.split('/').pop().replace(/\.md$/i, '');
  const outHtml = `${outDir}/${base}.html`;
  const md = readFileSync(file, 'utf-8');
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>${base}</title><style>body{font-family:Arial,Helvetica,sans-serif;max-width:850px;margin:40px auto;line-height:1.4;}pre,code{background:#f5f5f5;padding:4px;border-radius:4px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:4px;font-size:12px;}h1,h2,h3{border-bottom:1px solid #ddd;padding-bottom:4px;}blockquote{color:#555;border-left:4px solid #999;padding-left:10px;margin-left:0;}</style></head><body><pre style="white-space:pre-wrap">${md.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre><hr/><p>Generado fallback. Convierta este HTML a PDF desde el navegador.</p></body></html>`;
  writeFileSync(outHtml, html, 'utf-8');
  console.warn(`(fallback) No se generó PDF directo. Exporta manualmente: ${outHtml}`);
}

const hasPandoc = commandExists('pandoc');
// Intentar marp desde bin local en node_modules/.bin
const marpCmd = process.platform === 'win32' ? '.\\node_modules\\.bin\\marp.cmd' : './node_modules/.bin/marp';
let hasMarp = false;
if (!hasPandoc) {
  try {
    execSync(`${marpCmd} --version`, { stdio: 'ignore' });
    hasMarp = true;
  } catch {
    hasMarp = false;
  }
}

console.log('=== Generación de documentación ===');
console.log(`Método: ${hasPandoc ? 'Pandoc' : hasMarp ? 'Marp (local)' : 'Fallback HTML'}`);

for (const file of docs) {
  const abs = resolve(file);
  if (!existsSync(abs)) {
    console.warn(`Omitido (no existe): ${file}`);
    continue;
  }
  try {
    if (hasPandoc) tryPandoc(abs); else if (hasMarp) {
      // Usar marp local directamente
      const base = abs.split(/[/\\]/).pop().replace(/\.md$/i, '');
      const out = `${outDir}/${base}.pdf`;
      run(`${marpCmd} "${abs}" -o "${out}"`);
    } else fallbackHTML(abs);
  } catch (err) {
    console.error(`Error procesando ${file}:`, err.message);
  }
}

console.log('Proceso finalizado. Archivo(s) en:', resolve(outDir));
