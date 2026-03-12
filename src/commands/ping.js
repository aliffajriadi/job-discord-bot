import { storeService } from "../services/storeService.js";

export default {
  name: "ping",
  description: "Cek latensi bot",
  execute(message) {
    const reply = storeService.getPing();
    message.reply(reply);
  },
};
