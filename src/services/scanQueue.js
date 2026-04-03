/**
 * scanQueue.js — Antrian otomatis untuk command !scan
 *
 * Flow:
 *  1. User ketik !scan WORLD
 *  2. Jika tidak ada scan berjalan → langsung proses
 *  3. Jika ada scan berjalan  → masuk antrian, user diberi tahu posisinya
 *  4. Setiap scan selesai → antrian berikutnya diproses otomatis
 *  5. Pesan antrian di-update live saat posisi berubah
 *  6. Ada jeda (QUEUE_DELAY_MS) sebelum scan berikutnya mulai fetch
 */

/** Jeda (ms) antar scan saat antrian berjalan. Ubah sesuai kebutuhan. */
const QUEUE_DELAY_MS = 5000; // 3 detik

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class ScanQueue {
  constructor() {
    this._queue = []; // Array of { id, world, message, statusMsg, resolve, reject }
    this._running = false;
    this._counter = 0; // ID unik per request
  }

  /** Total item di antrian (tidak termasuk yang sedang berjalan) */
  get size() {
    return this._queue.length;
  }

  /** True jika ada scan yang sedang berjalan */
  get busy() {
    return this._running;
  }

  /**
   * Coba mulai langsung (jika tidak busy) → return true jika bisa langsung jalan.
   * Kalau sudah busy → return false, caller harus pakai enqueue().
   */
  tryStart() {
    if (this._running) return false;
    this._running = true;
    return true;
  }

  /**
   * Tambahkan scan ke antrian (hanya dipanggil jika bot sedang busy).
   * @param {string} world - Nama world
   * @param {import("discord.js").Message} message - Pesan Discord yang memicu command
   * @returns {Promise<void>} - Resolve ketika giliran tiba
   */
  enqueue(world, message) {
    return new Promise((resolve, reject) => {
      const id = ++this._counter;
      const position = this._queue.length + 1; // posisi di antrian (1-based)

      const entry = { id, world, message, statusMsg: null, resolve, reject };
      this._queue.push(entry);

      // Kirim pesan antrian ke user
      this._sendQueueNotice(entry, position);
    });
  }

  /** Kirim / update pesan notif antrian */
  async _sendQueueNotice(entry, position) {
    try {
      entry.statusMsg = await entry.message.reply(
        this._buildQueueText(entry.world, position, this._queue.length)
      );
    } catch {
      // Ignore kalau gagal kirim (misal channel deleted)
    }
  }

  _buildQueueText(world, pos, total) {
    const bar = this._progressBar(pos, total + 1); // +1 karena ada yang running
    return (
      `<a:1462769060759470182:1486725555553308883> **Antrian Scan — Posisi #${pos}**\n\n` +
      `🌍 World: **${world}**\n` +
      `${bar}\n\n` +
      `Ada **${pos}** scan di depanmu. Sabar ya! 🙏\n` +
      `━━━━━━━━━━━━━━━\n` +
      `🛒 Sambil nunggu mampir ke https://anjay.fun`
    );
  }

  _progressBar(pos, total) {
    const filled = Math.max(0, total - pos);
    const empty  = pos - 1;
    const bar    = "█".repeat(Math.min(filled, 10)) + "░".repeat(Math.min(empty, 10));
    return `\`[${bar}]\``;
  }

  /** Update semua pesan antrian dengan posisi terbaru */
  async _refreshQueueMessages() {
    for (let i = 0; i < this._queue.length; i++) {
      const entry = this._queue[i];
      const pos   = i + 1;
      if (!entry.statusMsg) continue;
      try {
        await entry.statusMsg.edit(
          this._buildQueueText(entry.world, pos, this._queue.length)
        );
      } catch {
        // Abaikan kalau pesan sudah terhapus
      }
    }
  }

  /** Ambil & jalankan item pertama dari antrian */
  async _processNext() {
    if (this._queue.length === 0) {
      this._running = false;
      return;
    }

    this._running = true;
    const entry = this._queue.shift(); // Ambil dari depan

    // Update posisi antrian sisanya
    await this._refreshQueueMessages();

    // Hapus pesan antrian lama milik entry yang sekarang diproses
    if (entry.statusMsg) {
      try { await entry.statusMsg.delete(); } catch { /* ignore */ }
    }

    // ⏱️ Jeda sebelum scan berikutnya mulai fetch
    await sleep(QUEUE_DELAY_MS);

    // Resolve promise → mengembalikan kontrol ke scan.js agar bisa jalan
    entry.resolve();

    // _processNext() berikutnya akan dipanggil oleh scan.js setelah selesai
  }

  /** Dipanggil scan.js setelah satu scan selesai (sukses atau error) */
  async done() {
    this._running = false;
    await this._processNext();
  }
}

// Singleton — satu antrian untuk seluruh bot
export const scanQueue = new ScanQueue();
