import Icon from './Icon';
import logo from '../assets/laycafe.jpg';
export default function CashierHeader({ itemCount = 0 }) {
  return <div className="cashier-brand-head">
    <div className="cashier-heading-left">
      <img src={logo} className="cashier-heading-logo" alt="Lay Café" />
      <div>
        <span className="eyebrow">CASHIER WORKSPACE · EST. 2021</span>
        <h1>Point of sale</h1>
        <p>Choose favorites, prepare an order, and complete payment smoothly.</p>
      </div>
    </div>
    <span className="heading-counter"><Icon name="cart" size={17} /> {itemCount} item{itemCount === 1 ? '' : 's'} in cart</span>
  </div>;
}
