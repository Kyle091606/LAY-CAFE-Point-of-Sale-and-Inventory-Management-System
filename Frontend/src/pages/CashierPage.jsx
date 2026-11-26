import { useEffect, useMemo, useState } from 'react';
import { api, post } from '../lib/api';
import { Notice, Modal } from '../Components/UI';
import Icon from '../Components/Icon';
import CashierHeader from '../Components/CashierHeader';
import MenuCatalog from '../Components/MenuCatalog';
import OrderPanel from '../Components/OrderPanel';
import Receipt from '../Components/Receipt';
const money = n => Math.round(n * 100) / 100;
export default function CashierPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({});
  const [category, setCategory] = useState('All items');
  const [search, setSearch] = useState('');
  const [orderType, setOrderType] = useState('');
  const [payment, setPayment] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api('/products?active=1').then(setProducts).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);
  const categories = useMemo(() => ['All items', ...new Set(products.map(p => p.category))], [products]);
  const visible = useMemo(
    () => products.filter(p => (category === 'All items' || p.category === category) && p.name.toLowerCase().includes(search.trim().toLowerCase())),
    [products, category, search]
  );
  const lines = products.filter(p => cart[p.id] > 0).map(p => ({ ...p, qty: cart[p.id], subtotal: money(p.price * cart[p.id]) }));
  const itemCount = lines.reduce((s, l) => s + l.qty, 0),
    total = money(lines.reduce((s, l) => s + l.subtotal, 0));
  function setQty(product, n) {
    setError('');
    setNotice('');
    setCart(prev => {
      const next = { ...prev };
      const value = Math.max(0, Math.min(100, Math.floor(Number(n) || 0)));
      if (value)
        next[product.id] = value;
      else
        delete next[product.id];
      return next;
    });
  }
  function clear() {
    setCart({});
    setPayment('');
    setOrderType('');
  }
  async function checkout() {
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const sale = await post('/sales', {
        orderType,
        items: lines.map(l => ({ productId: l.id, quantity: l.qty })),
        payment: Number(payment)
      });
      setReceipt(sale);
      clear();
      setNotice(`Order #${sale.id} processed. The kitchen has received it.`);
    }
    catch (e) {
      setError(e.message);
    }
    finally {
      setSubmitting(false);
    }
  }
  return <>
    <CashierHeader itemCount={itemCount} />
    <Notice message={error} onClose={() => setError('')} />
    <Notice message={notice} type="success" onClose={() => setNotice('')} />
    <div className="pos-grid">
      <MenuCatalog
        products={visible}
        categories={categories}
        category={category}
        onCategoryChange={setCategory}
        query={search}
        onQueryChange={setSearch}
        order={cart}
        onAdd={p => setQty(p, (cart[p.id] || 0) + 1)}
        loading={loading}
      />
      <OrderPanel
        lines={lines}
        itemCount={itemCount}
        total={total}
        orderType={orderType}
        onOrderTypeChange={setOrderType}
        onSetQty={setQty}
        onClear={clear}
        payment={payment}
        onPaymentChange={setPayment}
        onCheckout={checkout}
        submitting={submitting}
      />
    </div>
    {receipt && <Modal
      title="Payment successful!"
      subtitle={`Order #${String(receipt.id).padStart(4, '0')} · Receipt ready to print`}
      onClose={() => setReceipt(null)}
    >
      <Receipt sale={receipt} />
      <div className="modal-actions receipt-actions">
        <button type="button" className="btn btn-outline" onClick={() => setReceipt(null)}>Close</button>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}><Icon name="print" size={17} /> Print Receipt</button>
      </div>
    </Modal>}
  </>;
}
