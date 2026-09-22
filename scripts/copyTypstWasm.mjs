/**
 * copyTypstWasm.mjs
 * Copia los binarios WASM de Typst desde node_modules a public/wasm/
 * para que sean accesibles como assets estáticos desde el Web Worker.
 *
 * Ejecutar: node scripts/copyTypstWasm.mjs
 * Se corre automáticamente en predev y prebuild.
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const wasmDest = resolve(root, 'public', 'wasm');

if (!existsSync(wasmDest)) {
  mkdirSync(wasmDest, { recursive: true });
}

// Buscar el paquete del compilador WASM en node_modules
const compilerPkg = resolve(root, 'node_modules', '@myriaddreamin', 'typst-ts-web-compiler', 'pkg');

if (!existsSync(compilerPkg)) {
  console.error('❌ No se encontró @myriaddreamin/typst-ts-web-compiler en node_modules.');
  console.error('   Ejecutá: npm install @myriaddreamin/typst-ts-web-compiler');
  process.exit(1);
}

// Archivos a copiar
const filesToCopy = readdirSync(compilerPkg).filter(f =>
  f.endsWith('.wasm') || f.endsWith('.js') || f.endsWith('.mjs')
);

if (filesToCopy.length === 0) {
  console.warn('⚠️  No se encontraron archivos .wasm en', compilerPkg);
  console.warn('   Verificá la versión instalada del paquete.');
  process.exit(0);
}

let copied = 0;
filesToCopy.forEach(f => {
  const src = join(compilerPkg, f);
  const dst = join(wasmDest, f);
  try {
    copyFileSync(src, dst);
    console.log(`✅ Copiado: ${f} → public/wasm/`);
    copied++;
  } catch (err) {
    console.warn(`⚠️  No se pudo copiar ${f}: ${err.message}`);
  }
});

console.log(`\n📦 ${copied}/${filesToCopy.length} archivos copiados a public/wasm/`);
