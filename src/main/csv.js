'use strict';

function parseRows(text) {
  let quoted = false; let commas = 0; let semicolons = 0;
  for (const char of text) { if (char === '"') quoted = !quoted; else if (!quoted && char === ',') commas += 1; else if (!quoted && char === ';') semicolons += 1; else if (!quoted && (char === '\n' || char === '\r')) break; }
  const delimiter = semicolons > commas ? ';' : ',';
  const rows = []; let row = []; let value = ''; quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') { if (quoted && text[index + 1] === '"') { value += '"'; index += 1; } else quoted = !quoted; continue; }
    if (!quoted && char === delimiter) { row.push(value); value = ''; continue; }
    if (!quoted && (char === '\n' || char === '\r')) { if (char === '\r' && text[index + 1] === '\n') index += 1; row.push(value); if (row.some(cell => cell.trim())) rows.push(row); row = []; value = ''; continue; }
    value += char;
  }
  row.push(value); if (row.some(cell => cell.trim())) rows.push(row);
  return rows;
}

function serviceName(url) {
  try { return new URL(url).hostname.replace(/^www\./i, '') || 'Identifiant importé'; } catch { return 'Identifiant importé'; }
}

function parseCredentialCsv(text) {
  const rows = parseRows(text.replace(/^\uFEFF/, ''));
  if (rows.length < 2) return [];
  const headers = rows.shift().map(header => header.trim().toLowerCase());
  return rows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || '']))).map(record => {
    const url = record.url || record.login_uri || record.uri || '';
    const username = record.username || record.login_username || '';
    const password = record.password || record.login_password || '';
    const title = record.name || record.title || serviceName(url);
    return { type: 'login', title: title.trim(), username: username.trim(), password, url: url.trim(), notes: '' };
  }).filter(entry => entry.username || entry.password || entry.url);
}

module.exports = { parseCredentialCsv };
