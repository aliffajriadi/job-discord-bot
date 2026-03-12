import { EmbedBuilder } from "discord.js";
import { storeService } from "../services/storeService.js";

export default {
  name: "scan",
  description: "Scan world Growtopia",

  async execute(message, args) {
    const worldName = args[0];

    if (!worldName) {
      return message.reply("Silakan masukkan nama world! Contoh: `!scan ZPZ` 🔍");
    }

    const world = worldName.toUpperCase();
    const loadingMsg = await message.reply(`📡 Sedang melakukan scanning pada world **${world}**...`);

    try {
      const result = await storeService.scanWorld(world);

      if (!result || result.status !== "success") {
        return loadingMsg.edit(`❌ Gagal menscan world **${world}**. API tidak merespon dengan benar.`);
      }

      // --- BAGIAN DEFINISI VARIABEL (Tadi yang kurang di sini) ---
      
      // Mengolah data Tiles (diurutkan dari yang terbanyak)
      const tilesList = result.data.tiles
        ?.sort((a, b) => b.count - a.count)
        .slice(0, 10) // Ambil 10 teratas saja supaya tidak kepanjangan
        .map((t) => `▫️ **${t.name}**: \`${t.count.toLocaleString()}\``)
        .join("\n") || "Tidak ada data tiles.";

      // Mengolah data Dropped Items
      const droppedList = result.data.dropped
        ?.sort((a, b) => b.count - a.count)
        .map((d) => `🏷️ **${d.name}**: \`${d.count.toLocaleString()}\``)
        .join("\n") || "✨ Tidak ada item terjatuh.";

      // --- AKHIR DEFINISI ---

      const embed = new EmbedBuilder()
        .setColor("#FFD700")
        .setTitle(`📡 SCAN REPORT: ${result.world.toUpperCase()}`)
        .setDescription(`Berhasil melakukan scan pada world **${result.world}**`)
        .addFields(
          { name: "🤖 Scanner Bot", value: `\`${result.bot}\``, inline: true },
          { name: "📊 Status", value: "`Success ✅`", inline: true },
          { name: "━━━━━━━━━━━━━━━━━━━━━━", value: "\u200B" }, // Pembatas
          { 
            name: "🧱 World Contents (Top 10 Tiles)", 
            value: tilesList.length > 1024 ? tilesList.substring(0, 1021) + "..." : tilesList 
          },
          { 
            name: "💎 Dropped Items", 
            value: droppedList.length > 1024 ? droppedList.substring(0, 1021) + "..." : droppedList 
          }
        )
        .setFooter({ text: `Anjay Store Scanner • www.anjay.fun` })
        .setTimestamp();

      await loadingMsg.edit({
        content: "✅ Scan Selesai!",
        embeds: [embed],
      });

    } catch (error) {
      console.error("Error saat execute scan:", error);
      // Jika bot sedang sibuk (error dari service)
      if (error.message === 'BOT_BUSY') {
        return loadingMsg.edit("⚠️ **Bot sedang sibuk!** Mohon tunggu scan sebelumnya selesai.");
      }
      loadingMsg.edit(`❌ Terjadi kesalahan: \`${error.message}\``);
    }
  },
};