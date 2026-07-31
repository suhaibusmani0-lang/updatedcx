export const parseBooleanValue = (value) => {
  if (value === undefined || value === null || String(value).trim() === "") {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (["yes", "true", "1", "y", "active"].includes(normalized)) return true;
  if (["no", "false", "0", "n", "inactive"].includes(normalized)) return false;
  return null;
};

export const parseNumberValue = (value) => {
  if (value === undefined || value === null) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/[₹$€]/g, "")
    .replace(/,/g, "")
    .trim();

  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

export const normalizeBadge = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};
