import { Events } from "discord.js";
import { config } from "../config/config.js";
import { accessService } from "../services/accessService.js";

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand() || interaction.commandName !== "scan") return;

    if (!config.OWNER_IDS.includes(interaction.user.id) && !accessService.allows(interaction.member)) {
      return interaction.reply({
        content: "❌ Kamu belum memiliki role yang diizinkan untuk menggunakan bot ini.",
        ephemeral: true,
      });
    }

    try {
      await interaction.client.commands.get("scan").execute(interaction);
    } catch (error) {
      console.error("Error executing /scan:", error);
      const response = { content: "Terjadi kesalahan saat menjalankan scan.", ephemeral: true };
      if (interaction.deferred || interaction.replied) await interaction.editReply(response);
      else await interaction.reply(response);
    }
  },
};
