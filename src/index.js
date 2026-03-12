import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import { config } from "./config/config.js";
import { commandHandler } from "./handlers/commandHandler.js";
import { eventHandler } from "./handlers/eventHandler.js";

// Inisialisasi bot dengan Intent yang diperlukan
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Load Command and Event Handlers
async function init() {
  try {
    await commandHandler(client);
    await eventHandler(client);

    await client.login(config.TOKEN);
  } catch (err) {
    console.error("❌ Gagal inisialisasi: ", err.message);
  }
}

init();
