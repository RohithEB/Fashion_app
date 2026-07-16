// Smoke test: confirm the native better-sqlite3 addon loads and runs queries.
// Uses an in-memory DB — does not touch or assume the real schema (TBD).
import Database from 'better-sqlite3';

const db = new Database(':memory:');
db.exec('CREATE TABLE t (id INTEGER PRIMARY KEY, v TEXT)');
db.prepare('INSERT INTO t (v) VALUES (?)').run('ok');
const row = db.prepare('SELECT v FROM t WHERE id = 1').get();
db.close();

console.log('better-sqlite3 loaded:', typeof Database === 'function');
console.log('sqlite query round-trip:', row.v === 'ok' ? 'PASS' : 'FAIL');
