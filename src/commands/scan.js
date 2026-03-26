import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { storeService } from "../services/storeService.js";

// --- CONFIGURATION: EMOJI MAPPING ---
// Gampang di-maintain, tinggal tambah keyword dan emojinya di sini
const EMOJI_MAP = {
  gems: "<:1468431529217884253:1482441233577152542>",
  "world lock": "<:880251447470596157:1482437225072431276>",
  "small lock": "<:880251485336772658:1482437243955056740>",
  "huge lock": "<:880251460292575303:1482437248120000512>",
  "big lock": "<:880251471059382335:1482437246358388766>",
  essence: "🧪",
  lava: "<:1468431563891933266:1482441231320617152>",
  dirt: "<:1206439097615253586:1482437235805782227>",
  stone: ":rock:",
  rock: "<:1468431517121380398:1482441028324556852>",
  door: "🚪",
  bedrock: "<:1468431455108468767:1482441025992528125>",
  pepper: "<:1030769967689388063:1482437241153392740>",
  "laser grid": "<:1030771641149562884:1482437239056240730>",
};

export default {
  name: "scan",
  description:
    "Scan world dengan Sorting (Terbanyak di atas) & Easy Maintenance",

  async execute(message, args) {
    const worldName = args[0];
    if (!worldName)
      return message.reply(
        "Silakan masukkan nama world! Contoh: `!scan ZPZ` 🔍",
      );

    const world = worldName.toUpperCase();
    const loadingMsg = await message.reply(
      `<a:1462769060759470182:1486725555553308883> **Sedang melakukan scanning...**

🌍 World: **${world}**

🔎 Mohon tunggu sebentar ya...

━━━━━━━━━━━━━━━
🛒 Mau belanja kebutuhan Growtopia murah dan mudah?
👉 https://anjay.fun
━━━━━━━━━━━━━━━`,
    );

    // --- HELPER: GET EMOJI ---
    const getEmoji = (itemName) => {
      const name = itemName.toLowerCase();
      // Mencari keyword di dalam EMOJI_MAP
      for (const [keyword, emoji] of Object.entries(EMOJI_MAP)) {
        if (name.includes(keyword)) return emoji;
      }
      return "<a:1461627126070378497:1482437222547456091>"; // Default emoji
    };

    try {
      const result = await storeService.scanWorld(world);
      if (!result || result.status !== "success") {
        return loadingMsg.edit(`❌ Gagal menscan world **${world}**.`);
      }

      // --- SORTING: TERBANYAK DI ATAS ---
      // Kita sort data dari count terbesar (b.count) ke terkecil (a.count)
      const allDropped = (result.data.dropped || []).sort(
        (a, b) => b.count - a.count,
      );
      const allTiles = (result.data.tiles || []).sort(
        (a, b) => b.count - a.count,
      );

      const itemsPerPage = 10;
      const maxItems = Math.max(allDropped.length, allTiles.length);
      const totalPages = Math.ceil(maxItems / itemsPerPage) || 1;
      let currentPage = 1;

      const generateEmbed = (page) => {
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;

        const currentDropped = allDropped.slice(start, end);
        const currentTiles = allTiles.slice(start, end);

        const droppedList =
          currentDropped
            .map(
              (d) =>
                `${getEmoji(d.name)} **${d.name}**: \`${d.count.toLocaleString()}\``,
            )
            .join("\n") || "✨ Tidak ada FLOATING.";

        const tilesList =
          currentTiles
            .map(
              (t) =>
                `${getEmoji(t.name)} **${t.name}**: \`${t.count.toLocaleString()}\``,
            )
            .join("\n") || "Tidak ada BLOCKS.";

        return new EmbedBuilder()
          .setColor("#FFD700")
          .setTitle(`📡 SCAN REPORT: ${result.world.toUpperCase()}`)
          .setThumbnail(
            "https://ik.imagekit.io/8zzj11dsp/Growtopia/GrowScan_9000.webp",
          )
          .setDescription(`Berhasil menscan world **${result.world}**`)
          .addFields(
            {
              name: "<a:1000768724548206622:1482437232961781954> Scanner Bot",
              value: `\`${result.bot}\``,
              inline: true,
            },
            {
              name: "<a:1438378765335138386:1482437228176216227> Status",
              value: "`Success`",
              inline: true,
            },
            { name: "━━━━━━━━━━━━━━━━━━━━━━", value: "\u200B" },
            { name: "**BLOCKS**\n\n", value: tilesList },
            { name: "\u200B", value: "\u200B" },
            { name: "**FLOATING**\n\n", value: droppedList },
          )
          .setFooter({ text: ` https://anjay.fun • Hal ${page}/${totalPages}` })
          .setTimestamp();
      };

      const generateButtons = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("⬅️ Prev")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next ➡️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages),
          new ButtonBuilder()
            .setCustomId("delete")
            .setLabel("🗑️ Delete")
            .setStyle(ButtonStyle.Danger),
        );
      };

      const mainMessage = await loadingMsg.edit({
        content: "✅ Scan Selesai!",
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
      });

      const collector = mainMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000,
      });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: "Kamu tidak punya akses ke tombol ini!",
            ephemeral: true,
          });
        }

        if (interaction.customId === "next") currentPage++;
        else if (interaction.customId === "prev") currentPage--;
        else if (interaction.customId === "delete") {
          return await interaction.message.delete();
        }

        await interaction.update({
          embeds: [generateEmbed(currentPage)],
          components: [generateButtons(currentPage)],
        });
      });

      collector.on("end", () => {
        mainMessage.edit({ components: [] }).catch(() => {});
      });
    } catch (error) {
      console.error("Error scan:", error);
      loadingMsg.edit(
        `Tidak dapat melakukan Scan \nSilahkan cek <#1482344651091349626> untuk melihat status bot growscan`,
      );
    }
  },
};
