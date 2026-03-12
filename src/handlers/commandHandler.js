import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { Collection } from "discord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const commandHandler = async (client) => {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, "../commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = pathToFileURL(path.join(commandsPath, file)).href;
    const { default: command } = await import(filePath);

    if (command && command.name) {
      client.commands.set(command.name.toLowerCase(), command);
      console.log(`✅ Command Loaded: ${command.name}`);
    } else {
      console.warn(
        `[WARNING] Command at ${filePath} is missing "name" property.`,
      );
    }
  }
};
