async function get(path) {
  const res = await fetch(`/api${path}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || `요청 실패 (${res.status})`)
  return data
}

export const fetchHome = () => get('/home')
export const fetchDetail = (type, id) => get(`/${type}/${id}`)
export const searchContents = (q) => get(`/search?q=${encodeURIComponent(q)}`)
