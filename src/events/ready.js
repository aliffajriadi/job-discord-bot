import { Events } from "discord.js";

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`🚀 Siap! Login sebagai ${client.user.tag}`);
    console.log(`Server: ${client.guilds.cache.size}`);
  },
};
