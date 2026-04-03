export const config = {
  TOKEN: process.env.TOKEN_BOT,
  PREFIX: process.env.PREFIX,
  // Support multiple owners: pisahkan dengan koma di .env
  // Contoh: OWNER_IDS=111111111111,222222222222
  OWNER_IDS: (process.env.OWNER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean),
};
