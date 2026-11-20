'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

// Native Node/Electron implementation: no compiled add-on is required on Windows.
const KDF = { name: 'scrypt', N: 1 << 15, r: 8, p: 1, keyLength: 32 };
const VAULT_VERSION = 1;

function b64(value) { return Buffer.from(value).toString('base64'); }
function unb64(value) { return Buffer.from(value, 'base64'); }
function scrypt(password, salt, params = KDF) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, KDF.keyLength, {
    N: params.N, r: params.r, p: params.p, maxmem: 128 * 1024 * 1024
  }, (err, key) => err ? reject(err) : resolve(key)));
}
function encrypt(value, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return { iv: b64(iv), tag: b64(cipher.getAuthTag()), data: b64(ciphertext) };
}
function decrypt(record, key) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, unb64(record.iv));
  decipher.setAuthTag(unb64(record.tag));
  return JSON.parse(Buffer.concat([decipher.update(unb64(record.data)), decipher.final()]).toString('utf8'));
}

class Vault {
  constructor(userData) {
    this.file = path.join(userData, 'vault.krypt');
    this.key = null;
    this.header = null;
    this.entries = [];
  }

  async exists() { try { await fs.access(this.file); return true; } catch { return false; } }

  async create(password) {
    if (!password || password.length < 6) throw new Error('Le mot de passe maître doit contenir au moins 6 caractères.');
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const salt = crypto.randomBytes(16);
    this.key = await scrypt(password, salt);
    this.header = { version: VAULT_VERSION, kdf: { ...KDF, salt: b64(salt) }, verifier: encrypt({ check: 'KRYPT' }, this.key) };
    this.entries = [];
    await this.save();
    return this.entries;
  }

  async unlock(password) {
    let parsed;
    try { parsed = JSON.parse(await fs.readFile(this.file, 'utf8')); } catch { throw new Error('Coffre introuvable ou illisible.'); }
    if (parsed.version !== VAULT_VERSION || !parsed.kdf || !Array.isArray(parsed.entries)) throw new Error('Format de coffre non pris en charge.');
    const key = await scrypt(password, unb64(parsed.kdf.salt), parsed.kdf);
    try { decrypt(parsed.verifier, key); } catch { key.fill(0); throw new Error('Mot de passe maître incorrect'); }
    this.key = key;
    this.header = { version: parsed.version, kdf: parsed.kdf, verifier: parsed.verifier };
    try { this.entries = parsed.entries.map(item => decrypt(item, key)); } catch { this.lock(); throw new Error('Le coffre est altéré ou corrompu.'); }
    return this.entries;
  }

  requireUnlocked() { if (!this.key) throw new Error('Coffre verrouillé.'); }
  async save() {
    this.requireUnlocked();
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const doc = { ...this.header, entries: this.entries.map(entry => encrypt(entry, this.key)) };
    const temp = `${this.file}.tmp`;
    await fs.writeFile(temp, JSON.stringify(doc), { mode: 0o600 });
    await fs.rename(temp, this.file);
  }
  async upsert(entry) {
    this.requireUnlocked();
    const now = new Date().toISOString();
    const clean = { id: entry.id || crypto.randomUUID(), type: entry.type || 'login', title: String(entry.title || '').trim(), username: String(entry.username || ''), password: String(entry.password || ''), url: String(entry.url || ''), expiry: String(entry.expiry || ''), notes: String(entry.notes || ''), totp: String(entry.totp || '').replace(/\s/g, '').toUpperCase(), createdAt: entry.createdAt || now, updatedAt: now };
    if (!clean.title) throw new Error('Un titre est requis.');
    const index = this.entries.findIndex(x => x.id === clean.id);
    if (index < 0) this.entries.unshift(clean); else this.entries[index] = clean;
    await this.save();
    return clean;
  }
  async importEntries(entries) {
    this.requireUnlocked();
    const now = new Date().toISOString();
    const imported = entries.map(entry => ({ id: crypto.randomUUID(), type: 'login', title: String(entry.title || '').trim(), username: String(entry.username || ''), password: String(entry.password || ''), url: String(entry.url || ''), notes: String(entry.notes || ''), totp: '', createdAt: now, updatedAt: now })).filter(entry => entry.title && (entry.username || entry.password || entry.url));
    if (!imported.length) return { count: 0, entries: this.entries };
    this.entries.unshift(...imported);
    await this.save();
    return { count: imported.length, entries: this.entries };
  }
  async remove(id) { this.requireUnlocked(); this.entries = this.entries.filter(x => x.id !== id); await this.save(); }
  async export(destination) { this.requireUnlocked(); await fs.copyFile(this.file, destination); }
  lock() { if (this.key) this.key.fill(0); this.key = null; this.header = null; this.entries = []; }
}

module.exports = { Vault };
