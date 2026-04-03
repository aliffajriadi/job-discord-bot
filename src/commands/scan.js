import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { storeService } from "../services/storeService.js";
import { emojiService } from "../services/emojiService.js";
import { scanQueue } from "../services/scanQueue.js";

export default {
  name: "scan",
  description:
    "Scan world dengan Sorting (Terbanyak di atas), Emoji DB & Antrian Otomatis",

  async execute(message, args) {
    const worldName = args[0];
    if (!worldName)
      return message.reply(
        "Silakan masukkan nama world! Contoh: `!scan ZPZ` 🔍",
      );

    const world = worldName.toUpperCase();

    // ─── ANTRIAN ─────────────────────────────────────────────────────────────
    if (!scanQueue.tryStart()) {
      await scanQueue.enqueue(world, message);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const loadingMsg = await message.reply(
      `<a:1462769060759470182:1486725555553308883> **Sedang melakukan scanning...**

🌍 World: **${world}**

<a:1000768724548206622:1482437232961781954> Mohon tunggu sebentar ya...

━━━━━━━━━━━━━━━
🛒 Mau belanja kebutuhan Growtopia murah dan mudah?
<a:1461627126070378497:1482437222547456091> https://anjay.fun
━━━━━━━━━━━━━━━`,
    );

    // --- HELPER: GET EMOJI ---
    const getEmoji = (itemName) => {
      const emoji = emojiService.findEmoji(itemName);
      return emoji ?? "<a:1461627126070378497:1482437222547456091>";
    };

    try {
      const result = await storeService.scanWorld(world);
      if (!result || result.status !== "success") {
        await loadingMsg.edit(`❌ Gagal menscan world **${world}**.`);
        return;
      }

      // --- SORTING: TERBANYAK DI ATAS ---
      const allDropped = (result.data.dropped || []).sort(
        (a, b) => b.count - a.count,
      );
      const allTiles = (result.data.tiles || []).sort(
        (a, b) => b.count - a.count,
      );

      // ─── STATE ───────────────────────────────────────────────────────────
      let currentPage  = 1;
      let searchQuery  = ""; // "" = tidak ada filter

      // Data yang sedang aktif (full atau filtered)
      const getActive = () => {
        if (!searchQuery) return { dropped: allDropped, tiles: allTiles };
        const q = searchQuery.toLowerCase();
        return {
          dropped: allDropped.filter((d) => d.name.toLowerCase().includes(q)),
          tiles:   allTiles.filter((t)   => t.name.toLowerCase().includes(q)),
        };
      };
      // ─────────────────────────────────────────────────────────────────────

      const itemsPerPage = 10;

      // Hitung totalPages dari data aktif
      const getTotalPages = () => {
        const { dropped, tiles } = getActive();
        return Math.ceil(Math.max(dropped.length, tiles.length) / itemsPerPage) || 1;
      };

      // ─── GENERATE EMBED ───────────────────────────────────────────────────
      const generateEmbed = (page) => {
        const { dropped, tiles } = getActive();
        const totalPages = getTotalPages();
        const start = (page - 1) * itemsPerPage;
        const end   = start + itemsPerPage;

        const droppedList =
          dropped
            .slice(start, end)
            .map((d) => `${getEmoji(d.name)} **${d.name}**: \`${d.count.toLocaleString()}\``)
            .join("\n") || "✨ Tidak ada FLOATING.";

        const tilesList =
          tiles
            .slice(start, end)
            .map((t) => `${getEmoji(t.name)} **${t.name}**: \`${t.count.toLocaleString()}\``)
            .join("\n") || "Tidak ada BLOCKS.";

        const searchInfo = searchQuery
          ? `🔍 Filter aktif: **"${searchQuery}"** — ${dropped.length + tiles.length} item ditemukan`
          : `Berhasil menscan world **${result.world}**`;

        return new EmbedBuilder()
          .setColor(searchQuery ? "#00BFFF" : "#FFD700")
          .setTitle(`📡 SCAN REPORT: ${result.world.toUpperCase()}`)
          .setThumbnail(
            "https://ik.imagekit.io/8zzj11dsp/Growtopia/GrowScan_9000.webp",
          )
          .setDescription(searchInfo)
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
          .setFooter({
            text: ` https://anjay.fun • Hal ${page}/${totalPages}${searchQuery ? ` • 🔍 "${searchQuery}"` : ""}`,
          })
          .setTimestamp();
      };

      // ─── GENERATE BUTTONS ─────────────────────────────────────────────────
      const generateButtons = (page) => {
        const totalPages = getTotalPages();
        const row = new ActionRowBuilder().addComponents(
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
            .setCustomId("search")
            .setLabel("🔍 Search")
            .setStyle(ButtonStyle.Secondary),
          // Tombol Reset hanya muncul kalau ada filter aktif
          ...(searchQuery
            ? [
                new ButtonBuilder()
                  .setCustomId("reset")
                  .setLabel("🔄 Reset")
                  .setStyle(ButtonStyle.Success),
              ]
            : []),
          new ButtonBuilder()
            .setCustomId("delete")
            .setLabel("🗑️ Delete")
            .setStyle(ButtonStyle.Danger),
        );
        return row;
      };

      // ─── KIRIM PESAN UTAMA ────────────────────────────────────────────────
      const mainMessage = await loadingMsg.edit({
        content: "✅ Scan Selesai!",
        embeds: [generateEmbed(currentPage)],
        components: [generateButtons(currentPage)],
      });

      // ─── COLLECTOR: BUTTON + MODAL ────────────────────────────────────────
      const collector = mainMessage.createMessageComponentCollector({
        time: 600000,
      });

      collector.on("collect", async (interaction) => {
        // Cek kepemilikan
        if (interaction.user.id !== message.author.id) {
          return interaction.reply({
            content: "Kamu tidak punya akses ke tombol ini!",
            ephemeral: true,
          });
        }

        // ── SEARCH: tampilkan modal ──────────────────────────────────────
        if (interaction.customId === "search") {
          const modal = new ModalBuilder()
            .setCustomId("search_modal")
            .setTitle("🔍 Cari Item");

          const input = new TextInputBuilder()
            .setCustomId("search_input")
            .setLabel("Nama item yang mau dicari")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("contoh: world lock, gems, lava...")
            .setRequired(true)
            .setMaxLength(50);

          modal.addComponents(new ActionRowBuilder().addComponents(input));
          await interaction.showModal(modal);

          // Tunggu user submit modal (max 60 detik)
          try {
            const submitted = await interaction.awaitModalSubmit({
              filter: (i) =>
                i.customId === "search_modal" &&
                i.user.id === message.author.id,
              time: 60000,
            });

            searchQuery = submitted.fields.getTextInputValue("search_input").trim();
            currentPage = 1; // reset ke halaman 1

            await submitted.update({
              embeds: [generateEmbed(currentPage)],
              components: [generateButtons(currentPage)],
            });
          } catch {
            // User tidak submit dalam waktu 60 detik → abaikan
          }
          return;
        }

        // ── RESET: hapus filter ──────────────────────────────────────────
        if (interaction.customId === "reset") {
          searchQuery  = "";
          currentPage  = 1;
          await interaction.update({
            embeds: [generateEmbed(currentPage)],
            components: [generateButtons(currentPage)],
          });
          return;
        }

        // ── DELETE ───────────────────────────────────────────────────────
        if (interaction.customId === "delete") {
          return await interaction.message.delete();
        }

        // ── PREV / NEXT ──────────────────────────────────────────────────
        const totalPages = getTotalPages();
        if (interaction.customId === "next" && currentPage < totalPages) currentPage++;
        else if (interaction.customId === "prev" && currentPage > 1)     currentPage--;

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
      await loadingMsg.edit(
        `Tidak dapat melakukan Scan \nSilahkan cek <#1482344651091349626> untuk melihat status bot growscan`,
      );
    } finally {
      await scanQueue.done();
    }
  },
};
