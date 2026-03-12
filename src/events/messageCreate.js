import { Events } from "discord.js";
import { config } from "../config/config.js";

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const prefix = config.PREFIX || "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const { client } = message;
    if (!client.commands.has(commandName)) return;

    const command = client.commands.get(commandName);

    try {
      await command.execute(message, args);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      message.reply("Terjadi kesalahan saat menjalankan perintah tersebut!");
    }
  },
};
