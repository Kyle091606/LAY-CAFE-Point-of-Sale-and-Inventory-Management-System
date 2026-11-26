import { useEffect, useState } from 'react';
import { api, patch } from '../lib/api';
import { Heading, Notice, Empty, Stat } from '../Components/UI';
import Icon from '../Components/Icon';
const COLUMNS = [
  ['pending', 'New orders', 'Newly paid orders', 'Start preparing', 'preparing'],
  ['preparing', 'In progress', 'Being made with care', 'Mark ready', 'ready'],
  ['ready', 'Ready to serve', 'Waiting for pickup', 'Complete order', 'completed']
];
function time(v) {
  return new Date(v).toLocaleString('en-PH', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });
}
export default function KitchenPage() {
  const [orders, setOrders] = useState([]),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(0),
    [last, setLast] = useState(null);
  async function refresh() {
    try {
      const data = await api('/kitchen/orders');
      setOrders(data);
      setError('');
      setLast(new Date());
    }
    catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, []);
  async function advance(order, status) {
    setBusy(order.id);
    try {
      await patch(`/kitchen/orders/${order.id}/status`, { status });
      await refresh();
    }
    catch (e) {
      setError(e.message);
      await refresh();
    }
    finally {
      setBusy(0);
    }
  }
  const count = status => orders.filter(o => o.status === status).length;
  return <>
    <Heading
      eyebrow="KITCHEN DISPLAY SYSTEM"
      title="Kitchen board"
      description="Every order, from the counter to the kitchen, right on time."
      actions={<button className="btn btn-outline" onClick={refresh}><Icon name="refresh" size={17} /> Refresh orders</button>}
    />
    <Notice message={error} />
    <div className="stats-grid kitchen-stats">
      <Stat icon="receipt" label="New orders" value={count('pending')} sub="Waiting to start" />
      <Stat
        icon="clock"
        label="Preparing"
        value={count('preparing')}
        sub="Currently in progress"
        tone="accent"
      />
      <Stat icon="check" label="Ready to serve" value={count('ready')} sub="Awaiting pickup" />
      <Stat
        icon="kitchen"
        label="Completed"
        value={count('completed')}
        sub="Latest 120 orders"
      />
    </div>
    <div className="kitchen-meta"><span className="live-dot" />Auto-refresh every 8 seconds <span>·</span> Last updated {last ? last.toLocaleTimeString('en-PH') : '—'}</div>
    <div className="kanban-grid">
      {COLUMNS.map(([status, title, subtitle, action, next]) => <section className={`kanban-column ${status}`} key={status}>
        <div className="kanban-head">
          <div>
            <h2>
              {title}
            </h2>
            <p>
              {subtitle}
            </p>
          </div>
          <span>
            {count(status)}
          </span>
        </div>
        <div className="kanban-cards">
          {orders.filter(o => o.status === status).length ? orders.filter(o => o.status === status).map(o => <article key={o.id} className="kitchen-order">
            <div className="kitchen-order-head">
              <b>#{String(o.id).padStart(4, '0')}</b>
              <span>
                {time(o.createdAt)}
              </span>
            </div>
            <h3>
              {o.customer}
            </h3>
            <div className="kitchen-order-kind">
              {o.orderType === 'take_out' ? '🛍️ Take Out' : '🍽️ Dine In'}
            </div>
            <div className="kitchen-items">
              {o.items.map((line, i) => <div key={i}>
                <strong>{line.quantity}×</strong>
                <span>
                  {line.name}
                </span>
              </div>)}
            </div>
            <button
              disabled={busy === o.id}
              className={`btn kanban-action ${status}`}
              onClick={() => advance(o, next)}
            >
              {busy === o.id ? 'Updating…' : action}
              <Icon name="arrow" size={16} />
            </button>
          </article>) : <Empty icon="check" title="All caught up" description="No orders in this stage." />}
        </div>
      </section>)}
    </div>
    <section className="completed-footer">
      <div><Icon name="check" /> {count('completed')} completed orders in recent history</div>
      <p>Orders progress through New → Preparing → Ready → Completed.</p>
    </section>
  </>;
}
