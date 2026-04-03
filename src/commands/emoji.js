import { EmbedBuilder } from "discord.js";
import { emojiService } from "../services/emojiService.js";
import { config } from "../config/config.js";

export default {
  name: "emoji",
  description:
    "Kelola emoji map untuk command scan. Hanya Owner yang bisa menggunakan.",

  async execute(message, args) {
    // ─── Guard: hanya owner ───────────────────────────────────────────────────
    if (!config.OWNER_IDS.includes(message.author.id)) {
      return message.reply("❌ Command ini hanya bisa digunakan oleh **Owner**!");
    }

    const sub = args[0]?.toLowerCase();

    // ─── /emoji list ─────────────────────────────────────────────────────────
    if (!sub || sub === "list") {
      const rows = emojiService.getAll();

      if (rows.length === 0) {
        return message.reply("📭 Emoji map masih kosong.");
      }

      const chunkSize = 20;
      const pages = [];
      for (let i = 0; i < rows.length; i += chunkSize) {
        pages.push(rows.slice(i, i + chunkSize));
      }

      const embeds = pages.map((chunk, idx) =>
        new EmbedBuilder()
          .setColor("#FFD700")
          .setTitle("🗺️ Emoji Map")
          .setDescription(
            chunk
              .map((r) => `\`${r.keyword}\` → ${r.emoji}`)
              .join("\n")
          )
          .setFooter({ text: `Halaman ${idx + 1}/${pages.length} • Total ${rows.length} emoji` })
      );

      for (const embed of embeds) {
        await message.channel.send({ embeds: [embed] });
      }
      return;
    }

    // ─── /emoji set <keyword> <emoji> ────────────────────────────────────────
    if (sub === "set") {
      // args: ["set", "<keyword...>", "<emoji>"]  — emoji adalah arg terakhir
      if (args.length < 3) {
        return message.reply(
          `❌ Format salah!\nGunakan: \`${config.PREFIX}emoji set <namaemoji> <kodeemoji>\`\nContoh: \`${config.PREFIX}emoji set gems <:gems:1234567890>\``
        );
      }

      const emoji = args[args.length - 1];
      const keyword = args.slice(1, args.length - 1).join(" ");

      const action = emojiService.set(keyword, emoji);
      return message.reply(
        `✅ Emoji \`${keyword}\` berhasil **${action === "added" ? "ditambahkan" : "diperbarui"}**!\n${emoji} → \`${keyword}\``
      );
    }

    // ─── /emoji delete <keyword> ─────────────────────────────────────────────
    if (sub === "delete" || sub === "del" || sub === "remove") {
      if (args.length < 2) {
        return message.reply(
          `❌ Format salah!\nGunakan: \`${config.PREFIX}emoji delete <namaemoji>\``
        );
      }

      const keyword = args.slice(1).join(" ");
      const deleted = emojiService.delete(keyword);

      if (!deleted) {
        return message.reply(`❌ Keyword \`${keyword}\` tidak ditemukan di emoji map.`);
      }
      return message.reply(`🗑️ Emoji untuk \`${keyword}\` berhasil dihapus.`);
    }

    // ─── Unknown subcommand ───────────────────────────────────────────────────
    return message.reply(
      `❓ Subcommand tidak dikenal.\n\n**Cara pakai:**\n` +
      `\`${config.PREFIX}emoji list\` — Lihat semua emoji\n` +
      `\`${config.PREFIX}emoji set <namaemoji> <kodeemoji>\` — Tambah/ubah emoji\n` +
      `\`${config.PREFIX}emoji delete <namaemoji>\` — Hapus emoji`
    );
  },
};
