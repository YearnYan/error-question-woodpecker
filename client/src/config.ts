// API 配置
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''

// API 端点
export const API_ENDPOINTS = {
  analyze: `${API_BASE_URL}/api/analyze`,
  generate: `${API_BASE_URL}/api/generate`,
  generateAppend: `${API_BASE_URL}/api/generate/append`,
  exportWord: `${API_BASE_URL}/api/export/word`,
}
