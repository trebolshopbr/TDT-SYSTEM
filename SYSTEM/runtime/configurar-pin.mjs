// Configura el PIN de 4 números de System: node SYSTEM/runtime/configurar-pin.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { hashPin, pinFile } from './pin.mjs';

// Lee números sin mostrarlos; muestra un punto por cada número.
function askHidden(question) {
  return new Promise(done => {
    const input = process.stdin;
    process.stdout.write(question);
    input.setRawMode(true);
    input.resume();
    input.setEncoding('utf8');
    let value = '';
    const onData = key => {
      for (const ch of key) {
        if (ch === '\u0003') { process.stdout.write('\n'); process.exit(1); }
        if (ch === '\r' || ch === '\n') {
          input.setRawMode(false); input.pause(); input.off('data', onData);
          process.stdout.write('\n'); return done(value);
        }
        if (ch === '\u007f' || ch === '\b') { if (value) { value = value.slice(0, -1); process.stdout.write('\b \b'); } continue; }
        if (/\d/.test(ch) && value.length < 4) { value += ch; process.stdout.write('•'); }
      }
    };
    input.on('data', onData);
  });
}

const pin = await askHidden('PIN de 4 números: ');
if (!/^\d{4}$/.test(pin)) { console.error('El PIN debe tener exactamente 4 números.'); process.exit(1); }
if (await askHidden('Repetí el PIN: ') !== pin) { console.error('Los PIN no coinciden.'); process.exit(1); }
mkdirSync(dirname(pinFile), { recursive: true, mode: 0o700 });
writeFileSync(pinFile, JSON.stringify(await hashPin(pin)), { mode: 0o600 });
console.log('PIN guardado. Reiniciá ./abrir.sh para usarlo.');
