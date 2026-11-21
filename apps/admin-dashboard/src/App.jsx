import { useEffect, useMemo, useState } from "react";
import {
  clearSession,
  getSession,
  loadCategories,
  loadOrders,
  loadProducts,
  login,
  removeProduct,
  saveCategory,
  saveProduct,
  updateOrderStatus,
} from "./api";

const currency = (value) =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  }).format(value);
const initialProduct = {
  name: "",
  sku: "",
  description: "",
  price: "",
  stock: 0,
  categoryId: "",
  image_url: "",
  is_active: true,
};

function Login({ onLogin }) {
  const [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      onLogin(await login(data.get("email"), data.get("password")));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-brand">
        <a className="brand" href="#">
          mowi<span>.</span>
        </a>
        <p className="eyebrow">operations center / 01</p>
        <h1>
          Decisiones claras.
          <br />
          <em>Operación ligera.</em>
        </h1>
        <p>El espacio de trabajo para mantener MowiStore en movimiento.</p>
        <div className="login-note">
          <span>●</span> Acceso exclusivo para operadores autorizados
        </div>
      </section>
      <section className="login-card">
        <p className="eyebrow">mowi admin</p>
        <h2>
          Bienvenido
          <br />
          al <em>centro.</em>
        </h2>
        <form onSubmit={submit}>
          <label>
            Correo de trabajo
            <input
              required
              name="email"
              type="email"
              placeholder="admin@mowistore.pe"
            />
          </label>
          <label>
            Contraseña
            <input
              required
              name="password"
              type="password"
              minLength="8"
              placeholder="••••••••"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button disabled={loading}>
            {loading ? "Verificando…" : "Ingresar al panel"} <span>→</span>
          </button>
        </form>
        <p className="helper">
          Usa una cuenta marcada como staff o administrador en Django.
        </p>
      </section>
    </main>
  );
}

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(product ?? initialProduct),
    [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      aria-label="Editar producto"
    >
      <button
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <section className="product-modal">
        <button className="close" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">
          {form.slug ? "editar producto" : "nuevo producto"}
        </p>
        <h2>{form.slug ? "Ajusta los detalles." : "Agrega algo genial."}</h2>
        <form onSubmit={submit}>
          <div className="two">
            <label>
              Nombre
              <input
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </label>
            <label>
              SKU
              <input
                required
                value={form.sku}
                onChange={(e) => update("sku", e.target.value)}
              />
            </label>
          </div>
          <label>
            Categoría
            <select
              required
              value={form.categoryId}
              onChange={(e) => update("categoryId", e.target.value)}
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <div className="two">
            <label>
              Precio (S/)
              <input
                required
                min="0"
                step="0.01"
                type="number"
                value={form.price}
                onChange={(e) => update("price", e.target.value)}
              />
            </label>
            <label>
              Stock
              <input
                required
                min="0"
                type="number"
                value={form.stock}
                onChange={(e) => update("stock", e.target.value)}
              />
            </label>
          </div>
          <label>
            Imagen URL
            <input
              value={form.image_url}
              type="url"
              onChange={(e) => update("image_url", e.target.value)}
              placeholder="https://…"
            />
          </label>
          <label>
            Descripción
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Una descripción breve y clara."
            />
          </label>
          <label className="switch">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => update("is_active", e.target.checked)}
            />
            <span />
            Visible en la tienda
          </label>
          {error && <p className="error">{error}</p>}
          <button className="save" disabled={saving}>
            {saving ? "Guardando…" : "Guardar producto"} <span>→</span>
          </button>
        </form>
      </section>
    </div>
  );
}

function CategoryModal({ onClose, onSave }) {
  const [error, setError] = useState(""),
    [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    try {
      await onSave({
        name: form.get("name"),
        description: form.get("description"),
      });
      onClose();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="modal-layer"
      role="dialog"
      aria-modal="true"
      aria-label="Nueva categoría"
    >
      <button
        className="modal-backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <section className="mini-modal">
        <button className="close" onClick={onClose}>
          ×
        </button>
        <p className="eyebrow">organizar catálogo</p>
        <h2>Nueva categoría.</h2>
        <form onSubmit={submit}>
          <label>
            Nombre
            <input name="name" required placeholder="Ej.: Audio" />
          </label>
          <label>
            Descripción
            <textarea name="description" placeholder="Opcional" />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="save" disabled={saving}>
            {saving ? "Creando…" : "Crear categoría"} <span>→</span>
          </button>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(getSession),
    [products, setProducts] = useState([]),
    [categories, setCategories] = useState([]),
    [orders, setOrders] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [productModal, setProductModal] = useState(null),
    [categoryModal, setCategoryModal] = useState(false),
    [notice, setNotice] = useState("");
  const canManage = ["staff", "admin"].includes(session?.user?.role);
  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3000);
  };
  async function refresh() {
    if (!session?.access || !canManage) return;
    setLoading(true);
    setError("");
    try {
      const [nextProducts, nextCategories, nextOrders] = await Promise.all([
        loadProducts(session.access),
        loadCategories(session.access),
        loadOrders(session.access),
      ]);
      setProducts(nextProducts);
      setCategories(nextCategories);
      setOrders(nextOrders);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [session?.access, canManage]);
  const visible = useMemo(
    () =>
      products.filter(
        (product) =>
          (filter === "all" || product.is_active === (filter === "active")) &&
          `${product.name} ${product.sku} ${product.category?.name}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [products, query, filter],
  );
  const metrics = {
    products: products.length,
    stock: products.reduce((sum, product) => sum + product.stock, 0),
    value: products.reduce(
      (sum, product) => sum + Number(product.price) * product.stock,
      0,
    ),
    low: products.filter((product) => product.stock < 5).length,
  };
  if (!session) return <Login onLogin={setSession} />;
  if (!canManage)
    return (
      <main className="blocked">
        <a className="brand" href="#">
          mowi<span>.</span>
        </a>
        <p className="eyebrow">acceso limitado</p>
        <h1>
          Esta cuenta no
          <br />
          <em>opera la tienda.</em>
        </h1>
        <p>Solicita a un administrador que habilite tu rol de staff.</p>
        <button
          onClick={() => {
            clearSession();
            setSession(null);
          }}
        >
          Cambiar de cuenta
        </button>
      </main>
    );
  async function handleProductSave(form) {
    await saveProduct(session.access, form);
    await refresh();
    notify(form.slug ? "Producto actualizado." : "Producto publicado.");
  }
  async function handleRemove(product) {
    if (!window.confirm(`¿Eliminar “${product.name}”?`)) return;
    await removeProduct(session.access, product);
    await refresh();
    notify("Producto eliminado.");
  }
  async function handleCategorySave(form) {
    await saveCategory(session.access, form);
    await refresh();
    notify("Categoría creada.");
  }
  async function handleOrderStatus(order, status) {
    try {
      await updateOrderStatus(session.access, order, status);
      await refresh();
      notify(`Pedido ${order.reference} actualizado.`);
    } catch (requestError) {
      notify(requestError.message);
    }
  }
  return (
    <main className="admin">
      <aside className="sidebar">
        <a className="brand" href="#">
          mowi<span>.</span>
        </a>
        <div className="workspace">
          <span className="pulse" /> Operaciones activas
        </div>
        <nav>
          <a className="active" href="#resumen">
            <span>▦</span> Resumen
          </a>
          <a href="#inventario">
            <span>□</span> Inventario
          </a>
          <a href="#categorias">
            <span>◌</span> Categorías
          </a>
          <a href="#pedidos">
            <span>↗</span> Pedidos <b>{orders.length}</b>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">
            {session.user.email.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <strong>{session.user.first_name || "Operador"}</strong>
            <span>{session.user.role}</span>
          </div>
          <button
            onClick={() => {
              clearSession();
              setSession(null);
            }}
            title="Cerrar sesión"
          >
            ↪
          </button>
        </div>
      </aside>
      <section className="workspace-main">
        <header className="dashboard-head">
          <div>
            <p className="eyebrow">lunes, 21 de noviembre</p>
            <h1>
              Buen día, <em>{session.user.first_name || "equipo"}.</em>
            </h1>
            <p>Esto es lo que está pasando en tu tienda.</p>
          </div>
          <div className="head-actions">
            <button className="refresh" onClick={refresh}>
              ↻ Actualizar
            </button>
            <button
              className="new-product"
              onClick={() => setProductModal(initialProduct)}
            >
              + Nuevo producto
            </button>
          </div>
        </header>
        {error && (
          <div className="alert">
            {error}
            <button onClick={refresh}>Reintentar</button>
          </div>
        )}
        <section id="resumen" className="metric-grid">
          <article>
            <span className="metric-symbol violet">▦</span>
            <p>Productos publicados</p>
            <h2>{metrics.products}</h2>
            <small>en el catálogo</small>
          </article>
          <article>
            <span className="metric-symbol lime">↗</span>
            <p>Unidades disponibles</p>
            <h2>{metrics.stock}</h2>
            <small>stock total</small>
          </article>
          <article>
            <span className="metric-symbol peach">◒</span>
            <p>Valor en inventario</p>
            <h2>{currency(metrics.value)}</h2>
            <small>estimado al PVP</small>
          </article>
          <article>
            <span className="metric-symbol pink">!</span>
            <p>Atención requerida</p>
            <h2>{metrics.low}</h2>
            <small>con menos de 5 unidades</small>
          </article>
        </section>
        <section className="insight-row">
          <article className="inventory-pulse">
            <div>
              <p className="eyebrow">pulso del inventario</p>
              <h2>
                Tu catálogo está
                <br />
                <em>en movimiento.</em>
              </h2>
              <p>
                Revisa los productos con poco stock para que nada detenga una
                buena compra.
              </p>
              <a href="#inventario">
                Ver inventario <span>→</span>
              </a>
            </div>
            <div className="bars" aria-label="Gráfico de inventario">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </article>
          <article id="categorias" className="categories-card">
            <div className="card-title">
              <div>
                <p className="eyebrow">tu catálogo</p>
                <h2>Categorías</h2>
              </div>
              <button onClick={() => setCategoryModal(true)}>+ Añadir</button>
            </div>
            <div className="category-list">
              {categories.slice(0, 5).map((category) => (
                <div key={category.id}>
                  <span>{category.name.slice(0, 1)}</span>
                  <p>
                    {category.name}
                    <small>
                      {
                        products.filter(
                          (product) => product.category?.id === category.id,
                        ).length
                      }{" "}
                      productos
                    </small>
                  </p>
                  <b>→</b>
                </div>
              ))}
              {!categories.length && (
                <p className="empty-copy">
                  Crea tu primera categoría para ordenar el catálogo.
                </p>
              )}
            </div>
          </article>
        </section>
        <section id="inventario" className="inventory-section">
          <div className="table-head">
            <div>
              <p className="eyebrow">gestión de catálogo</p>
              <h2>
                Inventario <span>{visible.length}</span>
              </h2>
            </div>
            <div className="table-controls">
              <label>
                ⌕
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar SKU o producto"
                />
              </label>
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Publicados</option>
                <option value="inactive">Ocultos</option>
              </select>
            </div>
          </div>
          <div className="product-table">
            <div className="table-row table-label">
              <span>Producto</span>
              <span>Estado</span>
              <span>Stock</span>
              <span>Precio</span>
              <span />
            </div>
            {loading ? (
              <div className="loading">Cargando inventario…</div>
            ) : (
              visible.map((product) => (
                <div className="table-row" key={product.id}>
                  <div className="product-cell">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" />
                    ) : (
                      <span className="product-fallback">
                        {product.name.slice(0, 1)}
                      </span>
                    )}
                    <p>
                      <b>{product.name}</b>
                      <small>
                        {product.sku} · {product.category?.name}
                      </small>
                    </p>
                  </div>
                  <span
                    className={`status ${product.is_active ? "published" : "hidden"}`}
                  >
                    {product.is_active ? "Publicado" : "Oculto"}
                  </span>
                  <span className={product.stock < 5 ? "low-stock" : ""}>
                    {product.stock} uds.
                  </span>
                  <b>{currency(product.price)}</b>
                  <div className="row-actions">
                    <button
                      onClick={() =>
                        setProductModal({
                          ...product,
                          categoryId: product.category?.id ?? "",
                          image_url: product.image_url ?? "",
                        })
                      }
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleRemove(product)}
                      className="delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
            {!loading && !visible.length && (
              <div className="loading">No hay productos que coincidan.</div>
            )}
          </div>
        </section>
        <section id="pedidos" className="orders-section">
          <div className="table-head">
            <div>
              <p className="eyebrow">operación de ventas</p>
              <h2>
                Pedidos recientes <span>{orders.length}</span>
              </h2>
            </div>
            <p className="orders-note">
              Los pagos se confirman por webhook de Stripe.
            </p>
          </div>
          <div className="orders-list">
            {orders.map((order) => (
              <article key={order.id}>
                <div>
                  <p className="order-ref">{order.reference}</p>
                  <span>
                    {order.recipient_name} ·{" "}
                    {new Date(order.created_at).toLocaleDateString("es-PE")}
                  </span>
                </div>
                <div className={`payment ${order.payment_status}`}>
                  {order.payment_status === "succeeded"
                    ? "Pagado"
                    : order.payment_status === "failed"
                      ? "Pago fallido"
                      : "Pago pendiente"}
                </div>
                <strong>{currency(order.total)}</strong>
                <select
                  value={order.status}
                  onChange={(event) =>
                    handleOrderStatus(order, event.target.value)
                  }
                  aria-label={`Estado del pedido ${order.reference}`}
                >
                  <option value="pending_payment">Pendiente de pago</option>
                  <option value="paid">Pagado</option>
                  <option value="processing">En preparación</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </article>
            ))}
            {!orders.length && (
              <div className="loading">Aún no hay pedidos registrados.</div>
            )}
          </div>
        </section>
      </section>
      {productModal && (
        <ProductModal
          product={productModal.slug ? productModal : null}
          categories={categories}
          onClose={() => setProductModal(null)}
          onSave={handleProductSave}
        />
      )}
      {categoryModal && (
        <CategoryModal
          onClose={() => setCategoryModal(false)}
          onSave={handleCategorySave}
        />
      )}
      {notice && <div className="notice">● {notice}</div>}
    </main>
  );
}

export default App;
