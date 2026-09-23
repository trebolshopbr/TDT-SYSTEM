// PIN de System. Se guarda solo como hash scrypt en ~/.tdt/system-pin.json,
// fuera del proyecto, y nunca en el repositorio.
import { scrypt, randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

export const pinFile = resolve(homedir(), '.tdt/system-pin.json');
const derive = (pin, salt) => new Promise((ok, fail) => scrypt(pin, salt, 32, (e, k) => e ? fail(e) : ok(k)));

export async function hashPin(pin) {
  const salt = randomBytes(16);
  return { salt: salt.toString('hex'), hash: (await derive(pin, salt)).toString('hex') };
}

export async function verifyPin(store, pin) {
  const want = Buffer.from(store.hash, 'hex');
  const got = await derive(pin, Buffer.from(store.salt, 'hex'));
  return want.length === got.length && timingSafeEqual(want, got);
}

export async function loadPinStore() {
  const s = await readFile(pinFile, 'utf8').then(JSON.parse).catch(() => null);
  return s && s.salt && s.hash ? s : null;
}
