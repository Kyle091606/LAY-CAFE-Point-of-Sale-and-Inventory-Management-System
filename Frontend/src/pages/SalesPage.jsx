import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { peso } from '../utils/peso';
import { Heading, Notice, Empty, Modal } from '../Components/UI';
import Icon from '../Components/Icon';
import Receipt from '../Components/Receipt';
export default function SalesPage({ role }) {
  const [sales, setSales] = useState([]),
    [details, setDetails] = useState(null),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);
  async function load(f = from, t = to) {
    setLoading(true);
    try {
      const query = f && t ? `?from=${f}&to=${t}` : '';
      setSales(await api(`/sales${query}`));
      setError('');
    }
    catch (e) {
      setError(e.message);
    }
    finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    api('/sales').then(setSales).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, []);
  async function openSale(id) {
    try {
      setDetails(await api(`/sales/${id}`));
    }
    catch (e) {
      setError(e.message);
    }
  }
  const total = sales.reduce((sum, s) => sum + Number(s.total), 0);
  return <>
    <Heading
      eyebrow={`${role.toUpperCase()} · TRANSACTION RECORDS`}
      title="Sales history"
      description="A clear view of what you've sold, from the first order to the last."
      actions={<button className="btn btn-outline" onClick={() => load()}><Icon name="refresh" size={16} /> Refresh</button>}
    />
    <Notice message={error} />
    <div className="sales-overview">
      <div>
        <span>RECORDS SHOWN</span>
        <strong>
          {sales.length}
        </strong>
      </div>
      <div>
        <span>TOTAL REVENUE SHOWN</span>
        <strong>
          {peso(total)}
        </strong>
      </div>
      <div>
        <span>RECORD LIMIT</span>
        <strong>Latest 150</strong>
      </div>
    </div>
    <section className="surface inventory-surface">
      <div className="surface-header">
        <div>
          <div className="section-eyebrow">TRANSACTION LOG</div>
          <h2>Recorded sales</h2>
        </div>
      </div>
      <form
        className="sales-filters"
        onSubmit={e => {
          e.preventDefault();
          load();
        }}
      >
        <label>From <input type="date" value={from} onChange={e => setFrom(e.target.value)} /></label>
        <label>To <input
          type="date"
          min={from || undefined}
          value={to}
          onChange={e => setTo(e.target.value)}
        /></label>
        <button className="btn btn-primary" disabled={Boolean(from) !== Boolean(to)}>Apply dates</button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            setFrom('');
            setTo('');
            load('', '');
          }}
        >Reset</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Order type</th>
              <th>Date & time</th>
              <th>Order status</th>
              <th>Amount</th>
              <th className="text-right">View</th>
            </tr>
          </thead>
          <tbody>
            {sales.map(s => <tr key={s.id}>
              <td>
                <strong>#{String(s.id).padStart(4, '0')}</strong>
              </td>
              <td>
                {s.orderType === 'take_out' ? 'Take Out' : 'Dine In'}
              </td>
              <td className="subtle-label">
                {new Date(s.createdAt).toLocaleString('en-PH')}
              </td>
              <td>
                <span className={`status-badge ${s.status}`}>
                  {s.status}
                </span>
              </td>
              <td>
                <b>
                  {peso(s.total)}
                </b>
              </td>
              <td className="text-right">
                <button className="small-text-btn" onClick={() => openSale(s.id)}>Details <Icon name="arrow" size={15} /></button>
              </td>
            </tr>)}
          </tbody>
        </table>
        {!loading && !sales.length && <Empty
          icon="receipt"
          title="No sales in this period"
          description="Once the cashier completes payments, transactions appear here."
        />}
      </div>
    </section>
    {details && <Modal
      title={`Order #${String(details.id).padStart(4, '0')}`}
      subtitle={`${details.orderType === 'take_out' ? 'Take Out' : 'Dine In'} · ${new Date(details.createdAt).toLocaleString('en-PH')}`}
      onClose={() => setDetails(null)}
    >
      <div className="sale-detail-list">
        {details.items.map((i, n) => <div key={n}>
          <span>{i.quantity} × {i.name}</span>
          <strong>
            {peso(i.subtotal)}
          </strong>
        </div>)}
      </div>
      <div className="bill-divider" />
      <div className="bill-row total">
        <span>Order total</span>
        <strong>
          {peso(details.total)}
        </strong>
      </div>
      <div className="bill-row">
        <span>Cash received</span>
        <b>
          {peso(details.payment)}
        </b>
      </div>
      <div className="bill-row">
        <span>Change</span>
        <b>
          {peso(details.change)}
        </b>
      </div>
      <div className="bill-row">
        <span>Kitchen status</span>
        <span className={`status-badge ${details.status}`}>
          {details.status}
        </span>
      </div>
      <Receipt sale={details} />
      <div className="modal-actions">
        <button className="btn btn-outline" onClick={() => setDetails(null)}>Done</button>
        <button className="btn btn-primary" onClick={() => window.print()}><Icon name="print" size={16} /> Print Receipt</button>
      </div>
    </Modal>}
  </>;
}
