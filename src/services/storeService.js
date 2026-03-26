import axios from "axios";

const API_KEY = process.env.API_KEY;
console.log(API_KEY);
export const storeService = {
  getStatus: async () => {
    return "Sistem Anjay Store saat ini sedang **Online**! ⚡";
  },

  getPing: () => {
    return "🏓 Pong!";
  },

  scanWorld: async (worldName) => {
    if (!worldName) return null;
    if (worldName === "2millionseed") throw new Error("Peganggu");

    try {
      const { data } = await axios.get(
        `https://store.api.anjay.fun/api/growtopia?apikey=growscankenanjay&discordID=223&world=${worldName}`
      );
      return data;
    } catch (error) {
      console.error("Scan Error:", error.message);
      throw new Error("API Scanner tidak merespon");
    }
  },
};