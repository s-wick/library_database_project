const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000"

const normalizeBaseUrl = (value) => {
  const trimmed = String(value || "").trim()
  const withoutTrailing = trimmed.replace(/\/+$/, "")

  if (!withoutTrailing) {
    return "http://localhost:4000"
  }

  // If protocol is missing, treat the value as a host and default to https.
  if (!/^https?:\/\//i.test(withoutTrailing)) {
    const withoutLeading = withoutTrailing.replace(/^\/+/, "")
    return `https://${withoutLeading}`
  }

  return withoutTrailing
}

export const API_BASE_URL = normalizeBaseUrl(rawBaseUrl)
