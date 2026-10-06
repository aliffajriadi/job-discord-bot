import { Events } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`🚀 Siap! Login sebagai ${client.user.tag}`);
    console.log(`Server: ${client.guilds.cache.size}`);
    const commandData = {
      name: "scan",
      description: "Scan world secara privat (hanya kamu yang melihat hasilnya)",
      options: [{ name: "world", description: "Nama world yang ingin discan", type: 3, required: true }],
    };
    try {
      const existing = (await client.application.commands.fetch()).find((command) => command.name === "scan");
      if (existing) await existing.edit(commandData);
      else await client.application.commands.create(commandData);
      console.log("✅ Slash command /scan siap digunakan");
    } catch (error) {
      console.error("Gagal mendaftarkan /scan:", error.message);
    }
  },
};
