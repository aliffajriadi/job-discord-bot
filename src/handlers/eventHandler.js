import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const eventHandler = async (client) => {
  const eventsPath = path.join(__dirname, "../events");
  const eventFiles = fs
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of eventFiles) {
    const filePath = pathToFileURL(path.join(eventsPath, file)).href;
    const { default: event } = await import(filePath);

    if (event && event.name) {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
      console.log(`✅ Event Loaded: ${event.name}`);
    } else {
      console.warn(
        `[WARNING] Event at ${filePath} is missing "name" property.`,
      );
    }
  }
};
