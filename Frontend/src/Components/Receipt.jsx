import { peso } from '../utils/peso';
// Reusable for the cashier's successful checkout and reprinting from sales history.
// Only render using a sale returned by the backend after a committed transaction.
export default function Receipt({ sale }) {
  if (!sale)
    return null;
  const kind = sale.orderType === 'take_out' ? 'Take Out' : 'Dine In';
  const timestamp = sale.createdAt
    ? new Date(sale.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
    : '';
  const number = String(sale.id).padStart(4, '0');
  return <section
    id="print-receipt"
    className="receipt-paper"
    aria-label={`Receipt for order ${number}`}
  >
    <div className="receipt-head">LAY CAFÉ<small>Please enjoy your happiness</small></div>
    <div className="receipt-divider" />
    <div className="receipt-meta">
      <div>
        <span>ORDER NO.</span>
        <b>#{number}</b>
      </div>
      <div>
        <span>ORDER TYPE</span>
        <b>
          {kind}
        </b>
      </div>
      {timestamp && <div>
        <span>DATE &amp; TIME</span>
        <b>
          {timestamp}
        </b>
      </div>}
    </div>
    <div className="receipt-divider" />
    <div className="receipt-items-title">
      <span>ORDER ITEMS</span>
      <span>AMOUNT</span>
    </div>
    {sale.items?.map((line, i) => <div key={`${line.productId || i}-${i}`} className="receipt-item">
      <div>
        <b>{line.quantity} × {line.name}</b>
        <small>{peso(line.unitPrice)} each</small>
      </div>
      <strong>
        {peso(line.subtotal)}
      </strong>
    </div>)}
    <div className="receipt-divider" />
    <div className="bill-row">
      <span>Subtotal</span>
      <b>
        {peso(sale.total)}
      </b>
    </div>
    <div className="bill-row total">
      <span>TOTAL</span>
      <strong>
        {peso(sale.total)}
      </strong>
    </div>
    <div className="bill-row">
      <span>Cash received</span>
      <b>
        {peso(sale.payment)}
      </b>
    </div>
    <div className="bill-row">
      <span>Change</span>
      <b>
        {peso(sale.change)}
      </b>
    </div>
    <div className="receipt-divider" />
    <div className="receipt-foot">Thank you for visiting Lay Café!<small>Keep this receipt for your reference.</small></div>
  </section>;
}
