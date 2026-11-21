import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Category, Order, Product } from './types';

type Tab = 'overview' | 'products' | 'categories' | 'orders';
const money = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
const emptyProduct = { name: '', description: '', price: '25000', imageUrl: '', categoryId: '', isAvailable: true };
const emptyCategory = { name: '', description: '', isActive: true };

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [cartProductId, setCartProductId] = useState('');
  const [cartQuantity, setCartQuantity] = useState('1');
  const [cart, setCart] = useState<{ productId: number; quantity: number }[]>([]);

  async function loadAll() {
    setLoading(true); setError('');
    try {
      const [p, c, o] = await Promise.all([api.products.list(), api.categories.list(), api.orders.list()]);
      setProducts(p); setCategories(c); setOrders(o);
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadAll(); }, []);

  const revenue = useMemo(() => orders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + o.totalAmount, 0), [orders]);
  const categoryName = (id: number) => categories.find(c => c.id === id)?.name || `Danh mục #${id}`;

  async function runAction(action: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); setNotice(success); await loadAll(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Có lỗi xảy ra.'); }
    finally { setBusy(false); }
  }

  function resetProduct() { setProductForm(emptyProduct); setEditingProductId(null); }
  async function saveProduct(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: productForm.name.trim(), description: productForm.description.trim() || null,
      price: Number(productForm.price), imageUrl: productForm.imageUrl.trim() || null,
      categoryId: Number(productForm.categoryId), isAvailable: productForm.isAvailable,
    };
    await runAction(async () => {
      if (editingProductId) await api.products.update(editingProductId, payload);
      else await api.products.create(payload);
      resetProduct();
    }, editingProductId ? 'Đã cập nhật sản phẩm.' : 'Đã thêm sản phẩm.');
  }
  function editProduct(p: Product) {
    setEditingProductId(p.id);
    setProductForm({ name: p.name, description: p.description || '', price: String(p.price), imageUrl: p.imageUrl || '', categoryId: String(p.categoryId), isAvailable: p.isAvailable });
    setTab('products'); window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function deleteProduct(id: number) {
    if (!confirm('Bạn chắc chắn muốn xóa sản phẩm này? Sản phẩm đã nằm trong đơn hàng có thể không xóa được.')) return;
    await runAction(() => api.products.delete(id), 'Đã xóa sản phẩm.');
  }

  async function saveCategory(e: React.FormEvent) {
    e.preventDefault();
    const payload = { name: categoryForm.name.trim(), description: categoryForm.description.trim() || null, isActive: categoryForm.isActive };
    await runAction(async () => {
      if (editingCategoryId) await api.categories.update(editingCategoryId, payload);
      else await api.categories.create(payload);
      setCategoryForm(emptyCategory); setEditingCategoryId(null);
    }, editingCategoryId ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục.');
  }
  function editCategory(c: Category) {
    setEditingCategoryId(c.id); setCategoryForm({ name: c.name, description: c.description || '', isActive: c.isActive });
  }
  async function deleteCategory(id: number) {
    if (!confirm('Chỉ xóa danh mục khi không còn sản phẩm sử dụng danh mục này. Tiếp tục?')) return;
    await runAction(() => api.categories.delete(id), 'Đã xóa danh mục.');
  }

  function addCartItem() {
    const productId = Number(cartProductId); const quantity = Number(cartQuantity);
    if (!productId || quantity <= 0) { setError('Chọn sản phẩm và nhập số lượng hợp lệ.'); return; }
    setCart(current => {
      const found = current.find(x => x.productId === productId);
      return found ? current.map(x => x.productId === productId ? { ...x, quantity: x.quantity + quantity } : x) : [...current, { productId, quantity }];
    });
    setError(''); setCartQuantity('1');
  }
  async function createOrder() {
    if (!cart.length) { setError('Hãy thêm ít nhất một sản phẩm vào đơn hàng.'); return; }
    await runAction(async () => { await api.orders.create({ customerId: null, items: cart }); setCart([]); }, 'Đã tạo đơn hàng thành công.');
  }
  async function updateOrder(order: Order, status: string, paymentStatus: string) {
    await runAction(() => api.orders.updateStatus(order.id, status, paymentStatus), `Đã cập nhật đơn hàng #${order.id}.`);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">B</div><div><strong>BearCafe</strong><small>QUẢN LÝ QUÁN CÀ PHÊ</small></div></div>
      <div className="side-label">TỔNG QUAN</div>
      <nav>
        {([['overview','⌂','Tổng quan'],['products','☕','Sản phẩm'],['categories','▦','Danh mục'],['orders','▤','Đơn hàng']] as [Tab,string,string][]).map(([key,icon,label]) =>
          <button key={key} className={`nav-item ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}><span>{icon}</span>{label}</button>)}
      </nav>
      <div className="sidebar-bottom"><span className="status-dot" /> API BearCafe<br/><small>Backend kết nối qua localhost:5000</small></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div><span className="eyebrow">BEARCAFE / MANAGEMENT</span><h1>{({overview:'Tổng quan',products:'Quản lý sản phẩm',categories:'Quản lý danh mục',orders:'Quản lý đơn hàng'})[tab]}</h1></div><button className="button secondary" onClick={() => void loadAll()}>↻ Làm mới dữ liệu</button></header>
      <section className="content">
        {error && <div className="alert error">{error}</div>}{notice && <div className="alert success">{notice}</div>}
        {loading ? <div className="empty">Đang tải dữ liệu từ BearCafe API...</div> : <>
          {tab === 'overview' && <>
            <div className="welcome"><div><span className="eyebrow light">HỆ THỐNG QUẢN LÝ</span><h2>Chào mừng đến với BearCafe</h2><p>Theo dõi sản phẩm, danh mục và hoạt động đơn hàng tại một nơi.</p></div><div className="coffee-art">☕</div></div>
            <div className="stats-grid">
              <Stat label="Sản phẩm" value={products.length} note="Tổng sản phẩm" icon="☕" />
              <Stat label="Danh mục" value={categories.length} note="Tổng danh mục" icon="▦" />
              <Stat label="Đơn hàng" value={orders.length} note="Tổng đơn đã ghi nhận" icon="▤" />
              <Stat label="Doanh thu đã thanh toán" value={money(revenue)} note="Từ đơn hàng có trạng thái Paid" icon="₫" />
            </div>
            <div className="panel"><div className="panel-heading"><div><h3>Đơn hàng gần đây</h3><p>Các giao dịch mới nhất trong hệ thống</p></div><button className="text-button" onClick={() => setTab('orders')}>Xem tất cả →</button></div><OrderTable orders={orders.slice(0,5)} onUpdate={updateOrder} /></div>
          </>}

          {tab === 'products' && <div className="two-column">
            <div className="panel form-panel"><div className="panel-heading"><div><h3>{editingProductId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm mới'}</h3><p>Thông tin sản phẩm bán tại quán</p></div></div>
              <form onSubmit={saveProduct} className="form-grid">
                <label className="full">Tên sản phẩm<input required maxLength={150} value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})} placeholder="Ví dụ: Cà phê sữa đá" /></label>
                <label>Giá bán (VNĐ)<input required type="number" min="0" step="1000" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})} /></label>
                <label>Danh mục<select required value={productForm.categoryId} onChange={e=>setProductForm({...productForm,categoryId:e.target.value})}><option value="">Chọn danh mục</option>{categories.filter(c=>c.isActive).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                <label className="full">Mô tả<textarea rows={3} maxLength={1000} value={productForm.description} onChange={e=>setProductForm({...productForm,description:e.target.value})} /></label>
                <label className="full">Đường dẫn hình ảnh<input value={productForm.imageUrl} onChange={e=>setProductForm({...productForm,imageUrl:e.target.value})} placeholder="https://... (có thể để trống)" /></label>
                <label className="check-label full"><input type="checkbox" checked={productForm.isAvailable} onChange={e=>setProductForm({...productForm,isAvailable:e.target.checked})}/> Đang kinh doanh</label>
                <div className="form-actions full"><button className="button primary" disabled={busy || !categories.length}>{editingProductId ? 'Lưu thay đổi' : 'Thêm sản phẩm'}</button>{editingProductId && <button type="button" className="button secondary" onClick={resetProduct}>Hủy sửa</button>}</div>
              </form>
            </div>
            <div className="panel"><div className="panel-heading"><div><h3>Danh sách sản phẩm</h3><p>{products.length} sản phẩm trong hệ thống</p></div></div><div className="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Danh mục</th><th>Giá bán</th><th>Trạng thái</th><th></th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><strong>{p.name}</strong><small className="subline">#{p.id}</small></td><td>{categoryName(p.categoryId)}</td><td className="price">{money(p.price)}</td><td><span className={`pill ${p.isAvailable?'green':'gray'}`}>{p.isAvailable?'Đang bán':'Tạm ngưng'}</span></td><td className="actions"><button onClick={()=>editProduct(p)}>Sửa</button><button className="danger-link" onClick={()=>void deleteProduct(p.id)}>Xóa</button></td></tr>)}{!products.length && <EmptyRow colSpan={5}/>}</tbody></table></div></div>
          </div>}

          {tab === 'categories' && <div className="two-column category-layout">
            <div className="panel form-panel"><div className="panel-heading"><div><h3>{editingCategoryId ? 'Cập nhật danh mục' : 'Thêm danh mục'}</h3><p>Phân loại sản phẩm của quán</p></div></div>
              <form onSubmit={saveCategory} className="form-grid">
                <label className="full">Tên danh mục<input required maxLength={100} value={categoryForm.name} onChange={e=>setCategoryForm({...categoryForm,name:e.target.value})} placeholder="Ví dụ: Cafe truyền thống" /></label>
                <label className="full">Mô tả<textarea rows={4} maxLength={500} value={categoryForm.description} onChange={e=>setCategoryForm({...categoryForm,description:e.target.value})}/></label>
                <label className="check-label full"><input type="checkbox" checked={categoryForm.isActive} onChange={e=>setCategoryForm({...categoryForm,isActive:e.target.checked})}/> Danh mục đang hoạt động</label>
                <div className="form-actions full"><button className="button primary" disabled={busy}>{editingCategoryId?'Lưu thay đổi':'Thêm danh mục'}</button>{editingCategoryId && <button type="button" className="button secondary" onClick={()=>{setEditingCategoryId(null);setCategoryForm(emptyCategory)}}>Hủy sửa</button>}</div>
              </form>
            </div>
            <div className="panel"><div className="panel-heading"><div><h3>Danh mục hiện có</h3><p>{categories.length} danh mục trong hệ thống</p></div></div><div className="table-wrap"><table><thead><tr><th>Danh mục</th><th>Mô tả</th><th>Trạng thái</th><th></th></tr></thead><tbody>{categories.map(c=><tr key={c.id}><td><strong>{c.name}</strong><small className="subline">#{c.id}</small></td><td>{c.description || '—'}</td><td><span className={`pill ${c.isActive?'green':'gray'}`}>{c.isActive?'Hoạt động':'Tạm dừng'}</span></td><td className="actions"><button onClick={()=>editCategory(c)}>Sửa</button><button className="danger-link" onClick={()=>void deleteCategory(c.id)}>Xóa</button></td></tr>)}{!categories.length && <EmptyRow colSpan={4}/>}</tbody></table></div></div>
          </div>}

          {tab === 'orders' && <div className="orders-layout">
            <div className="panel"><div className="panel-heading"><div><h3>Tạo đơn hàng</h3><p>Chọn sản phẩm và số lượng. Backend tự lấy giá từ cơ sở dữ liệu.</p></div></div>
              <div className="cart-controls"><label>Sản phẩm<select value={cartProductId} onChange={e=>setCartProductId(e.target.value)}><option value="">Chọn sản phẩm</option>{products.filter(p=>p.isAvailable).map(p=><option key={p.id} value={p.id}>{p.name} — {money(p.price)}</option>)}</select></label><label>Số lượng<input type="number" min="1" value={cartQuantity} onChange={e=>setCartQuantity(e.target.value)}/></label><button className="button secondary" onClick={addCartItem}>+ Thêm vào đơn</button></div>
              <div className="table-wrap"><table><thead><tr><th>Sản phẩm</th><th>Số lượng</th><th>Đơn giá</th><th>Tạm tính</th><th></th></tr></thead><tbody>{cart.map(item=>{const p=products.find(x=>x.id===item.productId);return <tr key={item.productId}><td>{p?.name || `#${item.productId}`}</td><td>{item.quantity}</td><td>{money(p?.price || 0)}</td><td className="price">{money((p?.price || 0)*item.quantity)}</td><td><button className="danger-link" onClick={()=>setCart(current=>current.filter(x=>x.productId!==item.productId))}>Bỏ</button></td></tr>})}{!cart.length && <EmptyRow colSpan={5} text="Chưa có sản phẩm trong đơn hàng"/>}</tbody></table></div>
              <div className="cart-footer"><strong>Tạm tính: {money(cart.reduce((sum,x)=>sum+(products.find(p=>p.id===x.productId)?.price||0)*x.quantity,0))}</strong><button className="button primary" disabled={busy || !cart.length} onClick={()=>void createOrder()}>Tạo đơn hàng</button></div>
            </div>
            <div className="panel"><div className="panel-heading"><div><h3>Lịch sử đơn hàng</h3><p>{orders.length} đơn hàng đã ghi nhận</p></div></div><OrderTable orders={orders} onUpdate={updateOrder}/></div>
          </div>}
        </>}
      </section>
      <footer className="footer">BearCafe Management System · ASP.NET Core Web API · React + TypeScript · SQL Server</footer>
    </main>
  </div>;
}

function Stat({label,value,note,icon}:{label:string;value:string|number;note:string;icon:string}) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><i>{icon}</i></div><strong>{value}</strong><small>{note}</small></div>;
}
function EmptyRow({colSpan,text='Chưa có dữ liệu'}:{colSpan:number;text?:string}) { return <tr><td colSpan={colSpan} className="empty-cell">{text}</td></tr>; }
function OrderTable({orders,onUpdate}:{orders:Order[];onUpdate:(order:Order,status:string,paymentStatus:string)=>Promise<void>}) {
  if (!orders.length) return <div className="empty">Chưa có đơn hàng. Hãy tạo đơn hàng đầu tiên.</div>;
  return <div className="table-wrap"><table><thead><tr><th>Mã đơn</th><th>Thời gian</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thanh toán</th><th>Cập nhật</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><strong>#{o.id}</strong></td><td>{new Date(o.createdAt).toLocaleString('vi-VN')}</td><td>{o.items?.map(i=>`${i.productName} × ${i.quantity}`).join(', ') || '—'}</td><td className="price">{money(o.totalAmount)}</td><td><span className={`pill ${o.status==='Completed'?'green':'gray'}`}>{o.status}</span></td><td><span className={`pill ${o.paymentStatus==='Paid'?'green':'amber'}`}>{o.paymentStatus}</span></td><td><div className="order-edit"><select aria-label="Trạng thái đơn hàng" value={o.status} onChange={e=>void onUpdate(o,e.target.value,o.paymentStatus)}><option>Pending</option><option>Processing</option><option>Completed</option><option>Cancelled</option></select><select aria-label="Trạng thái thanh toán" value={o.paymentStatus} onChange={e=>void onUpdate(o,o.status,e.target.value)}><option>Unpaid</option><option>Paid</option><option>Refunded</option></select></div></td></tr>)}</tbody></table></div>;
}
