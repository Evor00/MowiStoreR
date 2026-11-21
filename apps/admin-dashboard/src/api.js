const baseUrl = import.meta.env.VITE_CORE_API_URL ?? 'http://localhost:8000'
const key = 'mowistore.session'

export const getSession = () => { try { return JSON.parse(localStorage.getItem(key) ?? 'null') } catch { return null } }
export const clearSession = () => localStorage.removeItem(key)

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } })
  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.detail ?? data?.non_field_errors?.[0] ?? 'No se pudo completar la solicitud.')
  return data
}

export async function login(email, password) {
  const tokens = await request('/api/v1/auth/token/', { method: 'POST', body: JSON.stringify({ email, password }) })
  const user = await request('/api/v1/auth/me/', { token: tokens.access })
  const session = { ...tokens, user }; localStorage.setItem(key, JSON.stringify(session)); return session
}
export const loadProducts = (token) => request('/api/v1/products/?page_size=100', { token }).then((data) => data.results ?? data)
export const loadCategories = (token) => request('/api/v1/categories/?page_size=100', { token }).then((data) => data.results ?? data)
export const saveProduct = (token, product) => {
  const body = { name: product.name, sku: product.sku, description: product.description, price: product.price, stock: Number(product.stock), category_id: product.categoryId, image_url: product.image_url, is_active: product.is_active }
  return request(product.slug ? `/api/v1/products/${product.slug}/` : '/api/v1/products/', { token, method: product.slug ? 'PATCH' : 'POST', body: JSON.stringify(body) })
}
export const removeProduct = (token, product) => request(`/api/v1/products/${product.slug}/`, { token, method: 'DELETE' })
export const saveCategory = (token, category) => request('/api/v1/categories/', { token, method: 'POST', body: JSON.stringify({ name: category.name, description: category.description, is_active: true }) })
export const loadOrders = (token) => request('/api/v1/orders/?page_size=20', { token }).then((data) => data.results ?? data)
export const updateOrderStatus = (token, order, status) => request(`/api/v1/orders/${order.reference}/`, { token, method: 'PATCH', body: JSON.stringify({ status }) })
