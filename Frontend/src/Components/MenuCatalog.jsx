import Icon from './Icon';
import { peso } from '../utils/peso';
import { Empty } from './UI';
const categorySymbols = {
  'Iced Coffee': '☕', 'Kyoto Matcha': '🍵', 'Ade, Tea & Latte': '🫖',
  'Smoothie': '🥤', 'Pasta & Noodles': '🍝', 'Bread': '🥪',
  'Rice': '🍛', 'Snacks & Appetizers': '🍟', 'Pastries & Waffles': '🧇', 'Add-ons': '✨'
};
// Kept from the original ZIP: the cashier's product selection component.
export default function MenuCatalog({ products, categories, category, onCategoryChange, query, onQueryChange, order, onAdd, loading = false }) {
  return <section className="catalog" aria-label="Café menu">
    <div className="catalog-toolbar">
      <div className="search-field">
        <Icon name="search" />
        <input
          type="search"
          aria-label="Search menu"
          placeholder="Search coffee, pasta, pastries…"
          value={query}
          onChange={e => onQueryChange(e.target.value)}
        />
      </div>
      <span className="catalog-count">{products.length} menu items</span>
    </div>
    <div className="category-scroll" aria-label="Menu categories">
      {categories.map(c => <button
        type="button"
        key={c}
        className={`category-tab ${category === c ? 'active' : ''}`}
        onClick={() => onCategoryChange(c)}
        aria-pressed={category === c}
      >
        {c === 'All items' ? '✦' : categorySymbols[c] || '🍴'}
        {c}
      </button>)}
    </div>
    {loading ? <div className="loading-skeleton">Loading café menu…</div> : products.length === 0 ?
      <Empty
        icon="search"
        title="No matching items"
        description="Try a different search or category."
      /> :
      <div className="product-grid">
        {products.map(p => <button
          type="button"
          key={p.id}
          className={`product-card ${order[p.id] ? 'chosen' : ''}`}
          onClick={() => onAdd(p)}
        >
          <div className="product-art">
            <span>
              {categorySymbols[p.category] || '🍽️'}
            </span>
            {order[p.id] > 0 && <b className="product-qty">
              {order[p.id]}
            </b>}
          </div>
          <div className="product-card-copy">
            <small>
              {p.category}
            </small>
            <strong>
              {p.name}
            </strong>
            <div>
              <b>
                {peso(p.price)}
              </b>
              <span className="add-round">
                <Icon name="plus" size={17} />
              </span>
            </div>
          </div>
        </button>)}
      </div>}
  </section>;
}
