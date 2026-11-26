import Icon from './Icon';
import { peso } from '../utils/peso';
const categorySymbols = {
  'Iced Coffee': '☕',
  'Kyoto Matcha': '🍵',
  'Ade, Tea & Latte': '🫖',
  'Smoothie': '🥤',
  'Pasta & Noodles': '🍝',
  'Bread': '🥪',
  'Rice': '🍛',
  'Snacks & Appetizers': '🍟',
  'Pastries & Waffles': '🧇',
  'Add-ons': '✨'
};
// The original order panel now handles real checkout instead of logging to console.
export default function OrderPanel({ lines, itemCount, total, orderType, onOrderTypeChange, onSetQty, onClear, payment, onPaymentChange, onCheckout, submitting }) {
  const numericPayment = Number(payment);
  const change = Math.max(0, Math.round((numericPayment - total) * 100) / 100);
  const canPay = Boolean(lines.length) && !submitting && Boolean(orderType) && payment !== '' && Number.isFinite(numericPayment) && numericPayment >= total;
  return <aside className="checkout-panel" aria-label="Current order">
    <div className="checkout-top">
      <div>
        <div className="section-eyebrow">CURRENT TRANSACTION</div>
        <h2>Your order</h2>
      </div>
      <span className="checkout-count">{itemCount} items</span>
    </div>
    <label className="field-label">Order type
      <select value={orderType} onChange={e => onOrderTypeChange(e.target.value)} required>
        <option value="" disabled>Select Dine In or Take Out</option>
        <option value="dine_in">🍽️ Dine In</option>
        <option value="take_out">🛍️ Take Out</option>
      </select>
    </label>
    <div className="checkout-lines">
      {!lines.length ? <div className="cart-empty">
        <div>🛍️</div>
        <strong>Your cart is empty</strong>
        <p>Choose an item from the menu to begin.</p>
      </div> :
        lines.map(line => <div className="cart-line" key={line.id}>
          <div className="cart-icon">
            {categorySymbols[line.category] || '🍽️'}
          </div>
          <div className="cart-line-main">
            <strong>
              {line.name}
            </strong>
            <small>{peso(line.price)} each</small>
            <div className="quantity-step">
              <button
                type="button"
                onClick={() => onSetQty(line, line.qty - 1)}
                aria-label={`Remove one ${line.name}`}
              >
                <Icon name="minus" size={14} />
              </button>
              <span>
                {line.qty}
              </span>
              <button
                type="button"
                onClick={() => onSetQty(line, line.qty + 1)}
                aria-label={`Add one ${line.name}`}
              >
                <Icon name="plus" size={14} />
              </button>
            </div>
          </div>
          <div className="cart-line-price">
            <b>
              {peso(line.subtotal)}
            </b>
            <button
              type="button"
              onClick={() => onSetQty(line, 0)}
              aria-label={`Remove ${line.name}`}
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        </div>)}
    </div>
    <div className="payment-area">
      <div className="bill-row">
        <span>Subtotal</span>
        <b>
          {peso(total)}
        </b>
      </div>
      <div className="bill-row minor">
        <span>Total items</span>
        <span>
          {itemCount}
        </span>
      </div>
      <div className="bill-divider" />
      <div className="bill-row total">
        <span>Total due</span>
        <strong>
          {peso(total)}
        </strong>
      </div>
      <label className="field-label">Cash received (₱)<input
        type="number"
        step="0.01"
        min="0"
        value={payment}
        onChange={e => onPaymentChange(e.target.value)}
        placeholder="0.00"
      /></label>
      <div className="bill-row change">
        <span>Change</span>
        <strong>
          {peso(change)}
        </strong>
      </div>
      <button
        type="button"
        className="btn btn-primary checkout-button"
        disabled={!canPay}
        onClick={onCheckout}
      >
        <Icon name="check" size={19} />
        {submitting ? 'Processing order…' : 'Complete payment'}
      </button>
      {lines.length > 0 && <button type="button" className="btn btn-link" onClick={onClear}>Clear order</button>}
    </div>
  </aside>;
}
