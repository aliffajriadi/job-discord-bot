import { storeService } from "../services/storeService.js";

export default {
  name: "status",
  description: "Cek status layanan Anjay Store",
  async execute(message) {
    const status = await storeService.getStatus();
    message.reply(status);
  },
};
