import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, "../../data/allowed-roles.json");

const readRoles = () => {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(parsed) ? parsed.filter((id) => /^\d{17,20}$/.test(id)) : [];
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Gagal membaca role allowlist:", error);
    return [];
  }
};

let allowedRoles = readRoles();

const persist = () => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(allowedRoles, null, 2)}\n`);
};

export const accessService = {
  getAllowedRoles: () => [...allowedRoles],
  allows(member) {
    return allowedRoles.length === 0 || allowedRoles.some((id) =>
      member?.roles?.cache?.has(id) || member?.roles?.includes?.(id),
    );
  },
  addRole(id) {
    if (allowedRoles.includes(id)) return false;
    allowedRoles.push(id);
    persist();
    return true;
  },
  removeRole(id) {
    const next = allowedRoles.filter((roleId) => roleId !== id);
    if (next.length === allowedRoles.length) return false;
    allowedRoles = next;
    persist();
    return true;
  },
  clear() {
    allowedRoles = [];
    persist();
  },
};
