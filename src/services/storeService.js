import axios from "axios";

const API_KEY = process.env.API_KEY;
console.log(`API KEY: ${API_KEY}`);
const BASE_URL = process.env.BASE_URL;
console.log(`BASE URL: ${BASE_URL}`);

export const storeService = {
  getStatus: async () => {
    return "Sistem Anjay Store saat ini sedang **Online**! ⚡";
  },

  getPing: () => {
    return "🏓 Pong!";
  },

  scanWorld: async (worldName) => {
    if (!worldName) return null;

    const blockedWorlds = ["2millionseed", "testworld"];

    if (blockedWorlds.includes(worldName.toLowerCase())) {
      throw new Error("World ini diblokir");
    }

    try {
      const { data } = await axios.get(`${BASE_URL}/scan?world=${worldName}&apikey=${API_KEY}`);
      return data;
    } catch (error) {
      console.error("Scan Error:", error.message);
      throw new Error("API Scanner tidak merespon");
    }
  },
};
