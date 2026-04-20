import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

const formatPrice = (price) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price);

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { wishlistIds, toggle } = useWishlist();
  const navigate = useNavigate();

  const isWishlisted = wishlistIds.has(product.id);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to add items to cart'); navigate('/login'); return; }
    if (product.variants?.length) { toast('Select a variant on the product page'); navigate(`/product/${product.id}`); return; }
    await addToCart(product.id, 1);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to save items'); navigate('/login'); return; }
    const added = await toggle(product.id);
    if (added === true) toast.success('Added to wishlist');
    else if (added === false) toast('Removed from wishlist');
  };

  const imageUrl = product.image ? `${API_BASE}${product.image}` : null;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Link to={`/product/${product.id}`} className="group block">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        {/* Image */}
        <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Heart button */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow hover:scale-110 transition-transform"
            title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-gray-400 fill-none'}`} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Low stock badge */}
          {lowStock && (
            <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Only {product.stock} left
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {product.category && (
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">{product.category.name}</span>
          )}
          <h3 className="font-semibold text-gray-900 dark:text-white mt-1 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {product.name}
          </h3>

          {/* Rating display */}
          {product.averageRating && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-400 text-xs">{'★'.repeat(Math.round(product.averageRating))}{'☆'.repeat(5 - Math.round(product.averageRating))}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">({product.reviewCount})</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-blue-600 dark:text-blue-400 font-bold">{formatPrice(product.price)}</span>
            <span className={`text-xs ${product.stock > 5 ? 'text-green-600 dark:text-green-400' : product.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
              {product.stock === 0 ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : `Stock: ${product.stock}`}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="mt-3 w-full btn-primary text-sm py-2 disabled:opacity-40"
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}
