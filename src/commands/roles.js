import { config } from "../config/config.js";
import { accessService } from "../services/accessService.js";

export default {
  name: "roles",
  description: "Atur role yang boleh menggunakan bot (owner saja)",
  async execute(message, args) {
    if (!config.OWNER_IDS.includes(message.author.id)) {
      return message.reply("❌ Pengaturan role hanya bisa digunakan owner.");
    }

    const action = args[0]?.toLowerCase() ?? "list";
    const roleId = args[1]?.replace(/[<@&>]/g, "");
    if (action === "list") {
      const roles = accessService.getAllowedRoles();
      return message.reply(roles.length
        ? `✅ Role yang boleh memakai bot:\n${roles.map((id) => `<@&${id}> (\`${id}\`)`).join("\n")}`
        : "ℹ️ Belum ada pembatasan role; semua anggota server dapat memakai bot.");
    }
    if (action === "clear") {
      accessService.clear();
      return message.reply("✅ Pembatasan role dihapus. Semua anggota server dapat memakai bot.");
    }
    if (!["add", "remove", "del"].includes(action) || !/^\d{17,20}$/.test(roleId ?? "")) {
      return message.reply(`Format: \`${config.PREFIX || "!"}roles <add|remove|list|clear> @role\``);
    }

    if (action === "add") {
      if (!message.guild?.roles.cache.has(roleId)) return message.reply("❌ Role itu tidak ditemukan di server ini.");
      return message.reply(accessService.addRole(roleId)
        ? `✅ Role <@&${roleId}> sekarang boleh menggunakan bot.`
        : `ℹ️ Role <@&${roleId}> sudah ada di daftar.`);
    }
    return message.reply(accessService.removeRole(roleId)
      ? `✅ Akses role <@&${roleId}> dihapus.`
      : `ℹ️ Role <@&${roleId}> tidak ada di daftar.`);
  },
};
