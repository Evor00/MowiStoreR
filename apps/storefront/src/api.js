const coreApiUrl = import.meta.env.VITE_CORE_API_URL ?? 'http://localhost:8000'
const paymentsApiUrl = import.meta.env.VITE_PAYMENTS_API_URL ?? 'http://localhost:8080'
const tokenKey = 'mowistore.session'

export function getSession() {
  try { return JSON.parse(localStorage.getItem(tokenKey) ?? 'null') } catch { return null }
}

export function clearSession() {
  localStorage.removeItem(tokenKey)
}

function saveSession(session) {
  localStorage.setItem(tokenKey, JSON.stringify(session))
  return session
}

async function request(url, { token, ...options } = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const payload = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    const detail = payload?.detail ?? payload?.email?.[0] ?? 'No pudimos completar la solicitud.'
    throw new Error(detail)
  }
  return payload
}

export async function getProducts() {
  const payload = await request(`${coreApiUrl}/api/v1/products/`)
  return (payload.results ?? payload).map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category?.name ?? 'Tecnología',
    price: Number(product.price),
    image: product.image_url || null,
    description: product.description,
    rating: '4.8',
    badge: 'Disponible',
  }))
}

export async function signIn(email, password) {
  const tokens = await request(`${coreApiUrl}/api/v1/auth/token/`, { method: 'POST', body: JSON.stringify({ email, password }) })
  const user = await request(`${coreApiUrl}/api/v1/auth/me/`, { token: tokens.access })
  return saveSession({ ...tokens, user })
}

export async function signUp(data) {
  await request(`${coreApiUrl}/api/v1/auth/register/`, { method: 'POST', body: JSON.stringify(data) })
  return signIn(data.email, data.password)
}

export async function getCart(token) {
  const cart = await request(`${coreApiUrl}/api/v1/cart/`, { token })
  return (cart.items ?? []).map((item) => ({
    id: item.product.id,
    cartItemId: item.id,
    name: item.product.name,
    category: item.product.category?.name ?? 'Tecnología',
    price: Number(item.product.price),
    image: item.product.image_url || null,
    description: item.product.description,
    rating: '4.8',
    badge: 'Disponible',
    quantity: item.quantity,
  }))
}

export async function addCartItem(token, productId, quantity = 1) {
  return request(`${coreApiUrl}/api/v1/cart/items/`, { token, method: 'POST', body: JSON.stringify({ product_id: productId, quantity }) })
}

export async function updateCartItem(token, itemId, quantity) {
  return request(`${coreApiUrl}/api/v1/cart/items/${itemId}/`, { token, method: 'PATCH', body: JSON.stringify({ quantity }) })
}

export async function deleteCartItem(token, itemId) {
  return request(`${coreApiUrl}/api/v1/cart/items/${itemId}/`, { token, method: 'DELETE' })
}

export async function createOrder(token, address) {
  return request(`${coreApiUrl}/api/v1/checkout/`, { token, method: 'POST', body: JSON.stringify(address) })
}

export async function createPaymentIntent(token, orderReference) {
  return request(`${paymentsApiUrl}/api/v1/payments/payment-intents`, { token, method: 'POST', body: JSON.stringify({ orderReference }) })
}
