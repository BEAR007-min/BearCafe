import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { api } from './api';
import type { Category, Order, Product } from './types';

type Tab = 'overview' | 'products' | 'categories' | 'orders';
type RevenuePeriod = '7d' | '30d' | '12m';

type RevenuePoint = {
  label: string;
  amount: number;
};

const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const emptyProduct = {
  name: '',
  description: '',
  price: '25000',
  imageUrl: '',
  categoryId: '',
  isAvailable: true,
};

const emptyCategory = {
  name: '',
  description: '',
  isActive: true,
};

// =============================================
// REVENUE DATA
// =============================================

function buildRevenueSeries(
  orders: Order[],
  period: RevenuePeriod
): RevenuePoint[] {
  const paidOrders = orders.filter(
    order => order.paymentStatus === 'Paid'
  );

  if (period === '12m') {
    const now = new Date();

    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - 11 + index,
        1
      );

      const amount = paidOrders
        .filter(order => {
          const orderDate = new Date(order.createdAt);
          return (
            orderDate.getFullYear() === date.getFullYear() &&
            orderDate.getMonth() === date.getMonth()
          );
        })
        .reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        label: date.toLocaleDateString('vi-VN', {
          month: '2-digit',
          year: '2-digit',
        }),
        amount,
      };
    });
  }

  const dayCount = period === '7d' ? 7 : 30;

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (dayCount - 1 - index));

    const amount = paidOrders
      .filter(order => {
        const orderDate = new Date(order.createdAt);
        return (
          orderDate.getFullYear() === date.getFullYear() &&
          orderDate.getMonth() === date.getMonth() &&
          orderDate.getDate() === date.getDate()
        );
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      label: date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      }),
      amount,
    };
  });
}

// =============================================
// MAIN APPLICATION
// =============================================

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [revenuePeriod, setRevenuePeriod] =
    useState<RevenuePeriod>('7d');

  // Product form and filters
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] =
    useState<number | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] =
    useState('all');
  const [productAvailabilityFilter, setProductAvailabilityFilter] =
    useState('all');
  const [productSortBy, setProductSortBy] = useState('nameAsc');
  const [productPage, setProductPage] = useState(1);
  const [productPageSize, setProductPageSize] = useState(5);

  // Category form and filters
  const [categoryForm, setCategoryForm] =
    useState(emptyCategory);
  const [editingCategoryId, setEditingCategoryId] =
    useState<number | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryStatusFilter, setCategoryStatusFilter] =
    useState('all');

  // Order cart
  const [cartProductId, setCartProductId] = useState('');
  const [cartQuantity, setCartQuantity] = useState('1');
  const [cart, setCart] = useState<
    { productId: number; quantity: number }[]
  >([]);

  // =============================================
  // LOAD DATA
  // =============================================

  async function loadAll() {
    setLoading(true);
    setError('');

    try {
      const [productData, categoryData, orderData] = await Promise.all([
        api.products.list(),
        api.categories.list(),
        api.orders.list(),
      ]);

      setProducts(productData);
      setCategories(categoryData);
      setOrders(orderData);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Không thể tải dữ liệu.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  // =============================================
  // COMPUTED DATA
  // =============================================

  const revenue = useMemo(
    () =>
      orders
        .filter(order => order.paymentStatus === 'Paid')
        .reduce((sum, order) => sum + order.totalAmount, 0),
    [orders]
  );

  const revenueSeries = useMemo(
    () => buildRevenueSeries(orders, revenuePeriod),
    [orders, revenuePeriod]
  );

  const categoryName = (id: number) =>
    categories.find(category => category.id === id)?.name ??
    `Danh mục #${id}`;

  // Product filtering
  const filteredProducts = useMemo(() => {
    const keyword = productSearch.trim().toLocaleLowerCase();

    return products.filter(product => {
      const matchesSearch =
        !keyword || product.name.toLocaleLowerCase().includes(keyword);

      const matchesCategory =
        productCategoryFilter === 'all' ||
        product.categoryId === Number(productCategoryFilter);

      const matchesAvailability =
        productAvailabilityFilter === 'all' ||
        (productAvailabilityFilter === 'available'
          ? product.isAvailable
          : !product.isAvailable);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
  }, [
    products,
    productSearch,
    productCategoryFilter,
    productAvailabilityFilter,
  ]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (productSortBy) {
        case 'nameDesc':
          return b.name.localeCompare(a.name, 'vi');
        case 'priceLow':
          return a.price - b.price;
        case 'priceHigh':
          return b.price - a.price;
        default:
          return a.name.localeCompare(b.name, 'vi');
      }
    });
  }, [filteredProducts, productSortBy]);

  const totalProductPages = Math.max(
    1,
    Math.ceil(sortedProducts.length / productPageSize)
  );
  const currentProductPage = Math.min(productPage, totalProductPages);
  const paginatedProducts = sortedProducts.slice(
    (currentProductPage - 1) * productPageSize,
    currentProductPage * productPageSize
  );

  useEffect(() => {
    setProductPage(1);
  }, [
    productSearch,
    productCategoryFilter,
    productAvailabilityFilter,
    productSortBy,
    productPageSize,
  ]);

  // Category filtering
  const filteredCategories = useMemo(() => {
    const keyword = categorySearch.trim().toLocaleLowerCase();

    return categories.filter(category => {
      const name = category.name.toLocaleLowerCase();
      const description = (category.description ?? '').toLocaleLowerCase();

      const matchesSearch =
        !keyword || name.includes(keyword) || description.includes(keyword);

      const matchesStatus =
        categoryStatusFilter === 'all' ||
        (categoryStatusFilter === 'active'
          ? category.isActive
          : !category.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [categories, categorySearch, categoryStatusFilter]);

  // =============================================
  // COMMON ACTION
  // =============================================

  async function runAction(
    action: () => Promise<unknown>,
    successMessage: string
  ) {
    setBusy(true);
    setError('');
    setNotice('');

    try {
      await action();
      setNotice(successMessage);
      await loadAll();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Có lỗi xảy ra.'
      );
    } finally {
      setBusy(false);
    }
  }

  // =============================================
  // PRODUCTS
  // =============================================

  function resetProduct() {
    setProductForm(emptyProduct);
    setEditingProductId(null);
  }

  async function saveProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      name: productForm.name.trim(),
      description: productForm.description.trim() || null,
      price: Number(productForm.price),
      imageUrl: productForm.imageUrl.trim() || null,
      categoryId: Number(productForm.categoryId),
      isAvailable: productForm.isAvailable,
    };

    await runAction(async () => {
      if (editingProductId !== null) {
        await api.products.update(editingProductId, payload);
      } else {
        await api.products.create(payload);
      }

      resetProduct();
    }, editingProductId !== null
      ? 'Đã cập nhật sản phẩm.'
      : 'Đã thêm sản phẩm.');
  }

  function editProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      imageUrl: product.imageUrl || '',
      categoryId: String(product.categoryId),
      isAvailable: product.isAvailable,
    });
    setTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteProduct(id: number) {
    if (!window.confirm(
      'Bạn chắc chắn muốn xóa sản phẩm này? Sản phẩm đã nằm trong đơn hàng có thể không xóa được.'
    )) {
      return;
    }

    await runAction(
      () => api.products.delete(id),
      'Đã xóa sản phẩm.'
    );
  }

  // =============================================
  // CATEGORIES
  // =============================================

  async function saveCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || null,
      isActive: categoryForm.isActive,
    };

    await runAction(async () => {
      if (editingCategoryId !== null) {
        await api.categories.update(editingCategoryId, payload);
      } else {
        await api.categories.create(payload);
      }

      setCategoryForm(emptyCategory);
      setEditingCategoryId(null);
    }, editingCategoryId !== null
      ? 'Đã cập nhật danh mục.'
      : 'Đã thêm danh mục.');
  }

  function editCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
    });
    setTab('categories');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetCategory() {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategory);
  }

  async function deleteCategory(id: number) {
    if (!window.confirm(
      'Chỉ xóa danh mục khi không còn sản phẩm sử dụng danh mục này. Tiếp tục?'
    )) {
      return;
    }

    await runAction(
      () => api.categories.delete(id),
      'Đã xóa danh mục.'
    );
  }

  // =============================================
  // ORDERS / CART
  // =============================================

  function addCartItem() {
    const productId = Number(cartProductId);
    const quantity = Number(cartQuantity);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setError('Chọn sản phẩm và nhập số lượng hợp lệ.');
      return;
    }

    setCart(current => {
      const existing = current.find(item => item.productId === productId);

      if (existing) {
        return current.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      return [...current, { productId, quantity }];
    });

    setError('');
    setCartQuantity('1');
  }

  async function createOrder() {
    if (!cart.length) {
      setError('Hãy thêm ít nhất một sản phẩm vào đơn hàng.');
      return;
    }

    await runAction(async () => {
      await api.orders.create({
        customerId: null,
        items: cart,
      });
      setCart([]);
      setCartProductId('');
      setCartQuantity('1');
    }, 'Đã tạo đơn hàng thành công.');
  }

  async function updateOrder(
    order: Order,
    status: string,
    paymentStatus: string
  ) {
    await runAction(
      () => api.orders.updateStatus(order.id, status, paymentStatus),
      `Đã cập nhật đơn hàng #${order.id}.`
    );
  }

  const cartTotal = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);

  // =============================================
  // RENDER
  // =============================================

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">B</div>
          <div>
            <strong>BearCafe</strong>
            <small>QUẢN LÝ QUÁN CÀ PHÊ</small>
          </div>
        </div>

        <div className="side-label">TỔNG QUAN</div>

        <nav>
          {([
            ['overview', '⌂', 'Tổng quan'],
            ['products', '☕', 'Sản phẩm'],
            ['categories', '▦', 'Danh mục'],
            ['orders', '▤', 'Đơn hàng'],
          ] as [Tab, string, string][]).map(([key, icon, label]) => (
            <button
              key={key}
              className={`nav-item ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span className="status-dot" /> API BearCafe
          <br />
          <small>Backend kết nối qua localhost:5000</small>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">BEARCAFE / MANAGEMENT</span>
            <h1>
              {{
                overview: 'Tổng quan',
                products: 'Quản lý sản phẩm',
                categories: 'Quản lý danh mục',
                orders: 'Quản lý đơn hàng',
              }[tab]}
            </h1>
          </div>

          <button
            className="button secondary"
            onClick={() => void loadAll()}
            disabled={loading}
          >
            ↻ Làm mới dữ liệu
          </button>
        </header>

        <section className="content">
          {error && <div className="alert error">{error}</div>}
          {notice && <div className="alert success">{notice}</div>}

          {loading ? (
            <div className="empty">Đang tải dữ liệu từ BearCafe API...</div>
          ) : (
            <>
              {/* DASHBOARD */}
              {tab === 'overview' && (
                <>
                  <div className="welcome">
                    <div>
                      <span className="eyebrow light">HỆ THỐNG QUẢN LÝ</span>
                      <h2>Chào mừng đến với BearCafe</h2>
                      <p>
                        Theo dõi sản phẩm, danh mục và hoạt động đơn hàng tại một nơi.
                      </p>
                    </div>
                    <div className="coffee-art">☕</div>
                  </div>

                  <div className="stats-grid">
                    <Stat
                      label="Sản phẩm"
                      value={products.length}
                      note="Tổng sản phẩm"
                      icon="☕"
                    />
                    <Stat
                      label="Danh mục"
                      value={categories.length}
                      note="Tổng danh mục"
                      icon="▦"
                    />
                    <Stat
                      label="Đơn hàng"
                      value={orders.length}
                      note="Tổng đơn đã ghi nhận"
                      icon="▤"
                    />
                    <Stat
                      label="Doanh thu đã thanh toán"
                      value={money(revenue)}
                      note="Từ đơn hàng có trạng thái Paid"
                      icon="₫"
                    />
                  </div>

                  <div className="dashboard-grid">
                    <RevenuePanel
                      data={revenueSeries}
                      period={revenuePeriod}
                      onPeriodChange={setRevenuePeriod}
                    />
                    <OrderStatusPanel orders={orders} />
                  </div>

                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Đơn hàng gần đây</h3>
                        <p>Các giao dịch mới nhất trong hệ thống</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setTab('orders')}
                      >
                        Xem tất cả →
                      </button>
                    </div>
                    <OrderTable
                      orders={orders.slice(0, 5)}
                      onUpdate={updateOrder}
                    />
                  </div>
                </>
              )}

              {/* PRODUCTS */}
              {tab === 'products' && (
                <div className="two-column">
                  <div className="panel form-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>
                          {editingProductId !== null
                            ? 'Cập nhật sản phẩm'
                            : 'Thêm sản phẩm mới'}
                        </h3>
                        <p>Thông tin sản phẩm bán tại quán</p>
                      </div>
                    </div>

                    <form onSubmit={saveProduct} className="form-grid">
                      <label className="full">
                        Tên sản phẩm
                        <input
                          required
                          maxLength={150}
                          value={productForm.name}
                          onChange={e =>
                            setProductForm({
                              ...productForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="Ví dụ: Cà phê sữa đá"
                        />
                      </label>

                      <label>
                        Giá bán (VNĐ)
                        <input
                          required
                          type="number"
                          min="0"
                          step="1000"
                          value={productForm.price}
                          onChange={e =>
                            setProductForm({
                              ...productForm,
                              price: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label>
                        Danh mục
                        <select
                          required
                          value={productForm.categoryId}
                          onChange={e =>
                            setProductForm({
                              ...productForm,
                              categoryId: e.target.value,
                            })
                          }
                        >
                          <option value="">Chọn danh mục</option>
                          {categories
                            .filter(category => category.isActive)
                            .map(category => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </select>
                      </label>

                      <label className="full">
                        Mô tả
                        <textarea
                          rows={3}
                          maxLength={1000}
                          value={productForm.description}
                          onChange={e =>
                            setProductForm({
                              ...productForm,
                              description: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="full">
                        Đường dẫn hình ảnh
                        <input
                          value={productForm.imageUrl}
                          onChange={e =>
                            setProductForm({
                              ...productForm,
                              imageUrl: e.target.value,
                            })
                          }
                          placeholder="https://... (có thể để trống)"
                        />
                      </label>

                      <label className="check-label full">
                        <input
                          type="checkbox"
                          checked={productForm.isAvailable}
                          onChange={e =>
                            setProductForm({
                              ...productForm,
                              isAvailable: e.target.checked,
                            })
                          }
                        />
                        Đang kinh doanh
                      </label>

                      <div className="form-actions full">
                        <button
                          className="button primary"
                          disabled={busy || categories.length === 0}
                        >
                          {editingProductId !== null
                            ? 'Lưu thay đổi'
                            : 'Thêm sản phẩm'}
                        </button>
                        {editingProductId !== null && (
                          <button
                            type="button"
                            className="button secondary"
                            onClick={resetProduct}
                          >
                            Hủy sửa
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Danh sách sản phẩm</h3>
                        <p>{products.length} sản phẩm trong hệ thống</p>
                      </div>
                    </div>

                    <div className="product-filters">
                      <input
                        type="search"
                        placeholder="Tìm kiếm theo tên sản phẩm..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                      />

                      <select
                        value={productSortBy}
                        onChange={e => setProductSortBy(e.target.value)}
                        aria-label="Sắp xếp sản phẩm"
                      >
                        <option value="nameAsc">Tên A - Z</option>
                        <option value="nameDesc">Tên Z - A</option>
                        <option value="priceLow">Giá thấp đến cao</option>
                        <option value="priceHigh">Giá cao đến thấp</option>
                      </select>

                      <select
                        value={productPageSize}
                        onChange={e => setProductPageSize(Number(e.target.value))}
                        aria-label="Số sản phẩm mỗi trang"
                      >
                        <option value={5}>5 sản phẩm / trang</option>
                        <option value={10}>10 sản phẩm / trang</option>
                        <option value={20}>20 sản phẩm / trang</option>
                      </select>

                      <select
                        value={productCategoryFilter}
                        onChange={e => setProductCategoryFilter(e.target.value)}
                        aria-label="Lọc theo danh mục"
                      >
                        <option value="all">Tất cả danh mục</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={productAvailabilityFilter}
                        onChange={e =>
                          setProductAvailabilityFilter(e.target.value)
                        }
                        aria-label="Lọc trạng thái sản phẩm"
                      >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="available">Đang kinh doanh</option>
                        <option value="unavailable">Tạm ngưng</option>
                      </select>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => {
                          setProductSearch('');
                          setProductCategoryFilter('all');
                          setProductAvailabilityFilter('all');
                          setProductSortBy('nameAsc');
                          setProductPageSize(5);
                          setProductPage(1);
                        }}
                      >
                        Xóa bộ lọc
                      </button>

                      <span className="filter-result">
                        {filteredProducts.length}/{products.length} sản phẩm
                      </span>
                    </div>

                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Sản phẩm</th>
                            <th>Danh mục</th>
                            <th>Giá bán</th>
                            <th>Trạng thái</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedProducts.map(product => (
                            <tr key={product.id}>
                              <td>
                                <strong>{product.name}</strong>
                                <small className="subline">#{product.id}</small>
                              </td>
                              <td>{categoryName(product.categoryId)}</td>
                              <td className="price">{money(product.price)}</td>
                              <td>
                                <span
                                  className={`pill ${
                                    product.isAvailable ? 'green' : 'gray'
                                  }`}
                                >
                                  {product.isAvailable ? 'Đang bán' : 'Tạm ngưng'}
                                </span>
                              </td>
                              <td className="actions">
                                <button onClick={() => editProduct(product)}>
                                  Sửa
                                </button>
                                <button
                                  className="danger-link"
                                  onClick={() => void deleteProduct(product.id)}
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                          {!paginatedProducts.length && (
                            <EmptyRow
                              colSpan={5}
                              text="Không tìm thấy sản phẩm phù hợp."
                            />
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="pagination">
                      <span>
                        Trang {currentProductPage}/{totalProductPages}
                        {' · '}
                        {filteredProducts.length} sản phẩm
                      </span>
                      <div className="pagination-actions">
                        <button
                          type="button"
                          className="button secondary"
                          disabled={currentProductPage === 1}
                          onClick={() => setProductPage(currentProductPage - 1)}
                        >
                          ← Trước
                        </button>
                        <button
                          type="button"
                          className="button secondary"
                          disabled={currentProductPage === totalProductPages}
                          onClick={() => setProductPage(currentProductPage + 1)}
                        >
                          Sau →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORIES */}
              {tab === 'categories' && (
                <div className="two-column category-layout">
                  <div className="panel form-panel">
                    <div className="panel-heading">
                      <div>
                        <h3>
                          {editingCategoryId !== null
                            ? 'Cập nhật danh mục'
                            : 'Thêm danh mục'}
                        </h3>
                        <p>Phân loại sản phẩm của quán</p>
                      </div>
                    </div>

                    <form onSubmit={saveCategory} className="form-grid">
                      <label className="full">
                        Tên danh mục
                        <input
                          required
                          maxLength={100}
                          value={categoryForm.name}
                          onChange={e =>
                            setCategoryForm({
                              ...categoryForm,
                              name: e.target.value,
                            })
                          }
                          placeholder="Ví dụ: Cafe truyền thống"
                        />
                      </label>

                      <label className="full">
                        Mô tả
                        <textarea
                          rows={4}
                          maxLength={500}
                          value={categoryForm.description}
                          onChange={e =>
                            setCategoryForm({
                              ...categoryForm,
                              description: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="check-label full">
                        <input
                          type="checkbox"
                          checked={categoryForm.isActive}
                          onChange={e =>
                            setCategoryForm({
                              ...categoryForm,
                              isActive: e.target.checked,
                            })
                          }
                        />
                        Danh mục đang hoạt động
                      </label>

                      <div className="form-actions full">
                        <button className="button primary" disabled={busy}>
                          {editingCategoryId !== null
                            ? 'Lưu thay đổi'
                            : 'Thêm danh mục'}
                        </button>
                        {editingCategoryId !== null && (
                          <button
                            type="button"
                            className="button secondary"
                            onClick={resetCategory}
                          >
                            Hủy sửa
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Danh mục hiện có</h3>
                        <p>{categories.length} danh mục trong hệ thống</p>
                      </div>
                    </div>

                    <div className="category-filters">
                      <input
                        type="search"
                        placeholder="Tìm theo tên hoặc mô tả danh mục..."
                        value={categorySearch}
                        onChange={e => setCategorySearch(e.target.value)}
                      />

                      <select
                        value={categoryStatusFilter}
                        onChange={e => setCategoryStatusFilter(e.target.value)}
                        aria-label="Lọc trạng thái danh mục"
                      >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="inactive">Tạm dừng</option>
                      </select>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => {
                          setCategorySearch('');
                          setCategoryStatusFilter('all');
                        }}
                      >
                        Xóa bộ lọc
                      </button>

                      <span className="filter-result">
                        {filteredCategories.length}/{categories.length} danh mục
                      </span>
                    </div>

                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Danh mục</th>
                            <th>Mô tả</th>
                            <th>Trạng thái</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCategories.map(category => (
                            <tr key={category.id}>
                              <td>
                                <strong>{category.name}</strong>
                                <small className="subline">#{category.id}</small>
                              </td>
                              <td>{category.description || '—'}</td>
                              <td>
                                <span
                                  className={`pill ${
                                    category.isActive ? 'green' : 'gray'
                                  }`}
                                >
                                  {category.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                </span>
                              </td>
                              <td className="actions">
                                <button onClick={() => editCategory(category)}>
                                  Sửa
                                </button>
                                <button
                                  className="danger-link"
                                  onClick={() => void deleteCategory(category.id)}
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          ))}
                          {!filteredCategories.length && (
                            <EmptyRow
                              colSpan={4}
                              text="Không tìm thấy danh mục phù hợp."
                            />
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ORDERS */}
              {tab === 'orders' && (
                <div className="orders-layout">
                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Tạo đơn hàng</h3>
                        <p>
                          Chọn sản phẩm và số lượng. Backend tự lấy giá từ cơ sở dữ liệu.
                        </p>
                      </div>
                    </div>

                    <div className="cart-controls">
                      <label>
                        Sản phẩm
                        <select
                          value={cartProductId}
                          onChange={e => setCartProductId(e.target.value)}
                        >
                          <option value="">Chọn sản phẩm</option>
                          {products
                            .filter(product => product.isAvailable)
                            .map(product => (
                              <option key={product.id} value={product.id}>
                                {product.name} — {money(product.price)}
                              </option>
                            ))}
                        </select>
                      </label>

                      <label>
                        Số lượng
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={cartQuantity}
                          onChange={e => setCartQuantity(e.target.value)}
                        />
                      </label>

                      <button
                        type="button"
                        className="button secondary"
                        onClick={addCartItem}
                      >
                        + Thêm vào đơn
                      </button>
                    </div>

                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Sản phẩm</th>
                            <th>Số lượng</th>
                            <th>Đơn giá</th>
                            <th>Tạm tính</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {cart.map(item => {
                            const product = products.find(
                              p => p.id === item.productId
                            );

                            return (
                              <tr key={item.productId}>
                                <td>{product?.name || `#${item.productId}`}</td>
                                <td>{item.quantity}</td>
                                <td>{money(product?.price || 0)}</td>
                                <td className="price">
                                  {money((product?.price || 0) * item.quantity)}
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="danger-link"
                                    onClick={() =>
                                      setCart(current =>
                                        current.filter(
                                          x => x.productId !== item.productId
                                        )
                                      )
                                    }
                                  >
                                    Bỏ
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {!cart.length && (
                            <EmptyRow
                              colSpan={5}
                              text="Chưa có sản phẩm trong đơn hàng"
                            />
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="cart-footer">
                      <strong>Tạm tính: {money(cartTotal)}</strong>
                      <button
                        type="button"
                        className="button primary"
                        disabled={busy || !cart.length}
                        onClick={() => void createOrder()}
                      >
                        Tạo đơn hàng
                      </button>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-heading">
                      <div>
                        <h3>Lịch sử đơn hàng</h3>
                        <p>{orders.length} đơn hàng đã ghi nhận</p>
                      </div>
                    </div>
                    <OrderTable
                      orders={orders}
                      onUpdate={updateOrder}
                      showFilters
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <footer className="footer">
          BearCafe Management System · ASP.NET Core Web API · React + TypeScript · SQL Server
        </footer>
      </main>
    </div>
  );
}

// =============================================
// STATISTIC CARD
// =============================================

function Stat({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <i>{icon}</i>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

// =============================================
// EMPTY TABLE ROW
// =============================================

function EmptyRow({
  colSpan,
  text = 'Chưa có dữ liệu',
}: {
  colSpan: number;
  text?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-cell">
        {text}
      </td>
    </tr>
  );
}

// =============================================
// ORDER TABLE
// =============================================

function OrderTable({
  orders,
  onUpdate,
  showFilters = false,
}: {
  orders: Order[];
  onUpdate: (
    order: Order,
    status: string,
    paymentStatus: string
  ) => Promise<void>;
  showFilters?: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, paymentFilter, sortBy, pageSize]);

  const filteredOrders = useMemo(() => {
    const keyword = searchTerm.trim().toLocaleLowerCase();

    return orders.filter(order => {
      const matchesSearch =
        !keyword ||
        String(order.id).includes(keyword) ||
        order.items?.some(item =>
          item.productName.toLocaleLowerCase().includes(keyword)
        );

      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;
      const matchesPayment =
        paymentFilter === 'all' || order.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter]);

  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amountHigh':
          return b.totalAmount - a.totalAmount;
        case 'amountLow':
          return a.totalAmount - b.totalAmount;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [filteredOrders, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (!orders.length) {
    return (
      <div className="empty">
        Chưa có đơn hàng. Hãy tạo đơn hàng đầu tiên.
      </div>
    );
  }

  return (
    <div>
      {showFilters && (
        <div className="order-filters">
          <input
            type="search"
            placeholder="Tìm theo mã đơn hoặc tên sản phẩm..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Lọc trạng thái đơn hàng"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            aria-label="Lọc trạng thái thanh toán"
          >
            <option value="all">Tất cả thanh toán</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Paid">Paid</option>
            <option value="Refunded">Refunded</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sắp xếp đơn hàng"
          >
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="amountHigh">Giá trị cao nhất</option>
            <option value="amountLow">Giá trị thấp nhất</option>
          </select>

          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            aria-label="Số đơn hàng mỗi trang"
          >
            <option value={5}>5 đơn / trang</option>
            <option value={10}>10 đơn / trang</option>
            <option value={20}>20 đơn / trang</option>
          </select>

          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPaymentFilter('all');
              setSortBy('newest');
              setPageSize(5);
              setPage(1);
            }}
          >
            Xóa bộ lọc
          </button>

          <span className="filter-result">
            Hiển thị {filteredOrders.length} / {orders.length} đơn hàng
          </span>
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Thời gian</th>
              <th>Sản phẩm</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Cập nhật</th>
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map(order => (
              <tr key={order.id}>
                <td><strong>#{order.id}</strong></td>
                <td>{new Date(order.createdAt).toLocaleString('vi-VN')}</td>
                <td>
                  {order.items
                    ?.map(item => `${item.productName} × ${item.quantity}`)
                    .join(', ') || '—'}
                </td>
                <td className="price">{money(order.totalAmount)}</td>
                <td>
                  <span className={`pill ${order.status === 'Completed' ? 'green' : 'gray'}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <span className={`pill ${order.paymentStatus === 'Paid' ? 'green' : 'amber'}`}>
                    {order.paymentStatus}
                  </span>
                </td>
                <td>
                  <div className="order-edit">
                    <select
                      aria-label="Trạng thái đơn hàng"
                      value={order.status}
                      onChange={e =>
                        void onUpdate(order, e.target.value, order.paymentStatus)
                      }
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <select
                      aria-label="Trạng thái thanh toán"
                      value={order.paymentStatus}
                      onChange={e =>
                        void onUpdate(order, order.status, e.target.value)
                      }
                    >
                      <option value="Unpaid">Unpaid</option>
                      <option value="Paid">Paid</option>
                      <option value="Refunded">Refunded</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
            {!paginatedOrders.length && (
              <EmptyRow colSpan={7} text="Không tìm thấy đơn hàng phù hợp." />
            )}
          </tbody>
        </table>
      </div>

      {showFilters && (
        <div className="pagination">
          <span>Trang {currentPage}/{totalPages}</span>
          <div className="pagination-actions">
            <button
              type="button"
              className="button secondary"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              ← Trước
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================
// REVENUE CHART
// =============================================

function RevenuePanel({
  data,
  period,
  onPeriodChange,
}: {
  data: RevenuePoint[];
  period: RevenuePeriod;
  onPeriodChange: (period: RevenuePeriod) => void;
}) {
  const maxAmount = Math.max(10000, ...data.map(item => item.amount));
  const totalRevenue = data.reduce((sum, item) => sum + item.amount, 0);
  const labelInterval = data.length === 30 ? 5 : 1;

  return (
    <div className="panel revenue-panel">
      <div className="panel-heading">
        <div>
          <h3>Biểu đồ doanh thu</h3>
          <p>Doanh thu từ các đơn hàng đã thanh toán</p>
        </div>
        <select
          className="period-select"
          value={period}
          onChange={event =>
            onPeriodChange(event.target.value as RevenuePeriod)
          }
          aria-label="Chọn khoảng thời gian doanh thu"
        >
          <option value="7d">7 ngày</option>
          <option value="30d">30 ngày</option>
          <option value="12m">12 tháng</option>
        </select>
      </div>

      <div className="chart-total">
        <strong>{money(totalRevenue)}</strong>
        <span>Tổng doanh thu trong khoảng thời gian đã chọn</span>
      </div>

      <div className="revenue-chart">
        <div className="chart-grid-lines" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="revenue-columns">
          {data.map((item, index) => {
            const height = item.amount === 0
              ? 2
              : Math.max(5, (item.amount / maxAmount) * 100);
            const showLabel =
              index % labelInterval === 0 || index === data.length - 1;

            return (
              <div
                className="revenue-column"
                key={`${item.label}-${index}`}
                title={`${item.label}: ${money(item.amount)}`}
              >
                <div className="revenue-bar-area">
                  <div
                    className="revenue-bar-fill"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="revenue-date">
                  {showLabel ? item.label : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="chart-legend">
        <span />
        Doanh thu đã thanh toán
      </div>
    </div>
  );
}

// =============================================
// ORDER STATUS CHART
// =============================================

function OrderStatusPanel({ orders }: { orders: Order[] }) {
  const statuses = [
    { key: 'Pending', label: 'Chờ xử lý', className: 'pending' },
    { key: 'Processing', label: 'Đang xử lý', className: 'processing' },
    { key: 'Completed', label: 'Hoàn thành', className: 'completed' },
    { key: 'Cancelled', label: 'Đã hủy', className: 'cancelled' },
  ];

  return (
    <div className="panel status-panel">
      <div className="panel-heading">
        <div>
          <h3>Trạng thái đơn hàng</h3>
          <p>Thống kê tình hình xử lý đơn hàng</p>
        </div>
      </div>

      <div className="status-total">
        <strong>{orders.length}</strong>
        <span>Tổng số đơn hàng</span>
      </div>

      <div className="status-list">
        {statuses.map(status => {
          const count = orders.filter(
            order => order.status === status.key
          ).length;
          const percentage = orders.length > 0
            ? (count / orders.length) * 100
            : 0;

          return (
            <div className="status-item" key={status.key}>
              <div className="status-info">
                <span>{status.label}</span>
                <strong>{count}</strong>
              </div>
              <div className="status-bar-track">
                <div
                  className={`status-bar-fill ${status.className}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
