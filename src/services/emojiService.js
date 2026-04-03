import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB disimpan di root project (sejajar package.json)
const DB_PATH = path.join(__dirname, "../../data/emoji.db");

// Pastikan folder data ada
import fs from "fs";
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

// Buat tabel jika belum ada
db.exec(`
  CREATE TABLE IF NOT EXISTS emoji_map (
    keyword TEXT PRIMARY KEY COLLATE NOCASE,
    emoji   TEXT NOT NULL
  );
`);

// Seed data default (hanya jika tabel kosong)
const count = db.prepare("SELECT COUNT(*) as c FROM emoji_map").get();
if (count.c === 0) {
  const insert = db.prepare(
    "INSERT OR IGNORE INTO emoji_map (keyword, emoji) VALUES (?, ?)"
  );
  const seedData = [
    ["gems", "<:1468431529217884253:1482441233577152542>"],
    ["world lock", "<:880251447470596157:1482437225072431276>"],
    ["small lock", "<:880251485336772658:1482437243955056740>"],
    ["huge lock", "<:880251460292575303:1482437248120000512>"],
    ["big lock", "<:880251471059382335:1482437246358388766>"],
    ["essence", "🧪"],
    ["lava", "<:1468431563891933266:1482441231320617152>"],
    ["dirt", "<:1206439097615253586:1482437235805782227>"],
    ["stone", ":rock:"],
    ["rock", "<:1468431517121380398:1482441028324556852>"],
    ["door", "🚪"],
    ["bedrock", "<:1468431455108468767:1482441025992528125>"],
    ["pepper", "<:1030769967689388063:1482437241153392740>"],
    ["laser grid", "<:1030771641149562884:1482437239056240730>"],
  ];

  const insertMany = db.transaction((rows) => {
    for (const [k, e] of rows) insert.run(k, e);
  });
  insertMany(seedData);
  console.log("✅ Emoji map seeded with default values.");
}

export const emojiService = {
  /** Ambil semua emoji */
  getAll() {
    return db.prepare("SELECT keyword, emoji FROM emoji_map ORDER BY keyword").all();
  },

  /** Ambil emoji berdasarkan keyword (case-insensitive) */
  getByKeyword(keyword) {
    return db
      .prepare("SELECT emoji FROM emoji_map WHERE keyword = ?")
      .get(keyword.toLowerCase());
  },

  /**
   * Set emoji (INSERT or UPDATE).
   * @returns {string} "added" | "updated"
   */
  set(keyword, emoji) {
    const existing = this.getByKeyword(keyword);
    db.prepare(
      "INSERT INTO emoji_map (keyword, emoji) VALUES (?, ?) ON CONFLICT(keyword) DO UPDATE SET emoji = excluded.emoji"
    ).run(keyword.toLowerCase(), emoji);
    return existing ? "updated" : "added";
  },

  /** Hapus emoji berdasarkan keyword */
  delete(keyword) {
    const info = db
      .prepare("DELETE FROM emoji_map WHERE keyword = ?")
      .run(keyword.toLowerCase());
    return info.changes > 0; // true jika berhasil dihapus
  },

  /**
   * Cari emoji yang cocok untuk nama item.
   * Menggunakan LIKE agar case-insensitive dan partial match.
   */
  findEmoji(itemName) {
    const name = itemName.toLowerCase();
    const rows = db
      .prepare("SELECT keyword, emoji FROM emoji_map ORDER BY LENGTH(keyword) DESC")
      .all();
    for (const row of rows) {
      if (name.includes(row.keyword.toLowerCase())) return row.emoji;
    }
    return null; // tidak ditemukan
  },
};
