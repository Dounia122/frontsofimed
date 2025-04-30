import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { ShoppingCart, Loader, AlertCircle, Search, ChevronDown, Star, Heart } from 'lucide-react';
import debounce from 'lodash.debounce';
import './CatalogueProduits.css';
// Add this import
import noImage from '../../assets/no-image.png';
import { useNavigate } from 'react-router-dom'; // Add this import for navigation

const API_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const BASE_URL = 'http://localhost:8080';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalConfig = error.config;

    if (error.code === 'ERR_NETWORK') {
      console.error('Erreur réseau - Vérifiez votre connexion');
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login?sessionExpired=true';
      return Promise.reject(error);
    }

    if (error.code === 'ECONNABORTED' && !originalConfig._retry) {
      originalConfig._retry = true;
      let retryCount = originalConfig.retryCount || 0;

      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Nouvelle tentative (${retryCount}/${MAX_RETRIES})`);
        originalConfig.retryCount = retryCount;
        return axiosInstance(originalConfig);
      }
    }

    return Promise.reject(error);
  }
);

const CatalogueProduits = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  // Add cart state
  const [cart, setCart] = useState(() => {
    // Initialize cart from localStorage if available
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const navigate = useNavigate(); // For navigation to cart page
  
  // Add state for product details modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [sortOption, setSortOption] = useState('featured');

  // Add totalItems state
  const [totalItems, setTotalItems] = useState(0);
  
  // Modify the fetchData function to handle pagination
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
  
      const [categoriesRes, brandsRes, productsRes] = await Promise.all([
        axiosInstance.get('/api/categories'),
        axiosInstance.get('/api/marques'),
        axiosInstance.get('/api/produits', {
          params: {
            categorieId: selectedCategory || undefined,
            marqueId: selectedBrand || undefined,
            page: currentPage - 1, // Backend pages start at 0
            size: itemsPerPage,
            search: searchQuery || undefined
          },
        })
      ]);
  
      // Check if responses are valid
      if (!categoriesRes.data || !brandsRes.data || !productsRes.data) {
        throw new Error('Invalid response data from server');
      }
  
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      setBrands(Array.isArray(brandsRes.data) ? brandsRes.data : []);
  
      // Process the products from the response
      const productsData = productsRes.data.content || [];
      // Set total items from the response
      setTotalItems(productsRes.data.totalElements || 0);
      
      // Update the handleImageError function at component level
      const handleImageError = (e) => {
        if (e.target.src.includes('no-image.png')) {
          return; // Prevent infinite loop
        }
        console.error('Failed to load image:', e.target.src);
        e.target.onerror = null;
        e.target.src = `${BASE_URL}/api/images/no-image.png`;
      };
  
      // In the fetchData function, update the image URL processing
      // Dans la fonction fetchData, modifiez la partie qui traite les produits
      const processedProducts = productsData.map(product => {
        let imageUrl;
        if (product.imageUrl) {
          try {
            imageUrl = require(`../../assets/products/${product.imageUrl}`);
          } catch {
            imageUrl = noImage;
          }
        } else {
          imageUrl = noImage;
        }
  
        return {
          ...product,
          imageUrl,
          prix: null,
          prixFormatted: 'Sur demande',
          reference: product.reference || 'N/A',
          entreeAir: product.entreeAir || 'Non spécifié',
          entreeLiquide: product.entreeLiquide || 'Non spécifié',
          sortieLiquide: product.sortieLiquide || 'Non spécifié',
          typeConnexion: product.typeConnexion || 'Non spécifié',
          debitMaximum: product.debitMaximum || 'Non spécifié',
          pressionMaximale: product.pressionMaximale || 'Non spécifié',
          diametreSolideMax: product.diametreSolideMax || 'Non spécifié',
          caracteristiques: product.caracteristiques || []
        };
      });
  
      setProducts(processedProducts);
      setFilteredProducts(processedProducts);
      
    } catch (err) {
      console.error('Erreur de chargement:', err);
      setError(`Erreur lors du chargement des données: ${err.message}. Veuillez réessayer.`);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedBrand, currentPage, itemsPerPage, searchQuery]); // Add currentPage, itemsPerPage and searchQuery as dependencies

  const filterProducts = useMemo(() => debounce((query) => {
    if (!query) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.nom.toLowerCase().includes(query.toLowerCase()) ||
      product.description?.toLowerCase().includes(query.toLowerCase()) ||
      product.reference?.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredProducts(filtered);
  }, 300), [products]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleBrandChange = (e) => {
    setSelectedBrand(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    filterProducts(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    sortProducts(e.target.value);
  };

  const sortProducts = (option) => {
    let sorted = [...filteredProducts];
    
    switch(option) {
      case 'price-asc':
        sorted.sort((a, b) => a.prix - b.prix);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.prix - a.prix);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        sorted.sort((a, b) => b.reviews - a.reviews);
        break;
      default:
        // featured - keep original order
        break;
    }
    
    setFilteredProducts(sorted);
  };

  const toggleWishlist = (productId) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  useEffect(() => {
    fetchData();
  }, [fetchData, currentPage]); // Add currentPage as dependency

  useEffect(() => {
    return () => filterProducts.cancel();
  }, [filterProducts]);

  // Replace the client-side pagination calculation
  // const paginatedProducts = useMemo(() => {
  //   const startIndex = (currentPage - 1) * itemsPerPage;
  //   return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  // }, [filteredProducts, currentPage, itemsPerPage]);
  
  // Use filteredProducts directly since they're already paginated from the server
  const paginatedProducts = filteredProducts;
  
  // Calculate total pages based on total items from server
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleImageError = (e) => {
    console.error('Failed to load image:', e.target.src);
    e.target.onerror = null;
    e.target.src = '/images/no-image.png'; // Image de remplacement
  };

  // Add function to fetch product details
  const fetchProductDetails = async (productId) => {
    try {
      setLoadingDetails(true);
      const response = await axiosInstance.get(`/api/produits/${productId}`);
      
      const details = response.data;
      setProductDetails(details); // Store the complete product details
    } catch (err) {
      console.error('Erreur lors du chargement des détails:', err);
      setProductDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Add function to open product details modal
  const openProductDetails = (product) => {
    setSelectedProduct(product);
    fetchProductDetails(product.id);
  };

  // Add function to close product details modal
  const closeProductDetails = () => {
    setSelectedProduct(null);
    setProductDetails(null);
  };

  // Add state for image zoom
  const [zoomedImage, setZoomedImage] = useState(null);
  
  // Add function to handle image zoom
  const handleImageZoom = (imageUrl) => {
    setZoomedImage(imageUrl);
  };

  // Add function to close zoomed image
  const closeZoomedImage = () => {
    setZoomedImage(null);
  };

  // Add function to handle adding product to cart
  // ...
  // Ajouter l'état pour stocker l'ID du panier actif
  const [activeCartId, setActiveCartId] = useState(null);
  
  // Ajouter la fonction pour récupérer le panier actif
  const fetchActiveCart = async () => {
      try {
          const userString = localStorage.getItem('user');
          if (!userString) {
              console.log('Utilisateur non trouvé');
              navigate('/login');
              return;
          }
  
          const user = JSON.parse(userString);
          const response = await axiosInstance.get(`/api/carts/current/${user.id}`);
  
          // La réponse contient directement l'ID du panier
          if (response.data) {
              setActiveCartId(response.data);
              return response.data;
          }
          return null;
      } catch (error) {
          if (error.response?.status === 404) {
              console.error('Aucun panier trouvé pour cet utilisateur');
          } else {
              console.error('Erreur lors de la récupération du panier:', error);
          }
          return null;
      }
  };
  
  // Utiliser useEffect pour charger le panier au montage du composant
  useEffect(() => {
    fetchActiveCart();
  }, []);
  
  // Modifier la fonction addToCart
  const addToCart = async (product) => {
    try {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');
  
      if (!token || !userString) {
        navigate('/login');
        return;
      }
  
      let user;
      try {
        user = JSON.parse(userString);
      } catch (parseError) {
        console.error("Erreur de parsing utilisateur:", parseError);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
  
      if (user?.role !== 'CLIENT') {
        alert("Seuls les clients peuvent ajouter des produits au panier");
        return;
      }

      // Use activeCartId from state instead of hardcoded value
      if (!activeCartId) {
        // If no active cart, try to fetch it again
        await fetchActiveCart();
        if (!activeCartId) {
          alert("Impossible de récupérer votre panier. Veuillez réessayer.");
          return;
        }
      }

      try {
        // Ajouter le produit au panier
        const cartItemResponse = await axiosInstance.post(`/api/carts/${activeCartId}/items`, {
          produitId: product.id,
          quantity: 1
        });

        if (!cartItemResponse?.data) {
          throw new Error("Erreur l'ajout du produit au panier");
        }

        // Mise à jour du panier local
        const updatedCart = cart.find(item => item.id === product.id)
          ? cart.map(item => 
              item.id === product.id 
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          : [...cart, { ...product, quantity: 1 }];

        setCart(updatedCart);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        
        showCartNotification(product);
  
      } catch (error) {
        if (error.response?.status === 404) {
          alert("Le panier n'existe pas. Veuillez contacter le support.");
          return;
        }
        throw error;
      }
  
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { 
          state: { message: "Votre session a expiré. Veuillez vous reconnecter." }
        });
        return;
      }
  
      if (error.response?.status === 403) {
        alert("Vous n'avez pas les permissions nécessaires pour cette action. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
  
      alert(error.message || "Une erreur est survenue lors de l'ajout au panier. Veuillez réessayer.");
    }
  };
  
  // Add custom notification function
  const showCartNotification = (product) => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    
    // Create notification content
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
        </div>
        <div class="notification-message">
          <p class="notification-title">Produit ajouté au panier</p>
          <p class="notification-product">${product.nom}</p>
        </div>
        <button class="notification-view-cart" onclick="window.location.href='/client/panier'">
          Voir le panier
        </button>
        <button class="notification-close">×</button>
      </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Add event listener to close button
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
      notification.classList.add('notification-hiding');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        notification.classList.add('notification-hiding');
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
    
    // Animate in
    setTimeout(() => {
      notification.classList.add('notification-visible');
    }, 10);
  };

  return (
    <div className="ecommerce-container">
      <div className="catalogue-header">
        <h1>Catalogue des Produits</h1>
        <div className="search-container">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher des produits..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>Catégories</label>
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="filter-select"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.nom}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="dropdown-icon" />
        </div>

        <div className="filter-group">
          <label>Marques</label>
          <select
            value={selectedBrand}
            onChange={handleBrandChange}
            className="filter-select"
          >
            <option value="">Toutes les marques</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.nom}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="dropdown-icon" />
        </div>

        <div className="filter-group">
          <label>Trier par</label>
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="filter-select"
          >
            <option value="featured">En vedette</option>
            <option value="price-asc">Prix: croissant</option>
            <option value="price-desc">Prix: décroissant</option>
            <option value="rating">Meilleures notes</option>
            <option value="reviews">Plus de commentaires</option>
          </select>
          <ChevronDown size={16} className="dropdown-icon" />
        </div>
      </div>

      {/* Products Display */}
      {loading ? (
        <div className="loading-state">
          <Loader className="spinner" size={48} />
          <p>Chargement des produits...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>{error}</h3>
          <button onClick={fetchData} className="retry-btn">
            Réessayer
          </button>
        </div>
      ) : (
        <>
          <div className="products-grid">
            {paginatedProducts.length > 0 ? (
              paginatedProducts.map(product => (
                <div key={product.id} className="product-card">
                  <div className="product-badges">
                    <button 
                      className={`wishlist-btn ${wishlist.includes(product.id) ? 'active' : ''}`}
                      onClick={() => toggleWishlist(product.id)}
                    >
                      <Heart 
                        size={20} 
                        fill={wishlist.includes(product.id) ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>
                  
                  <div className="product-image-container">
                    
                    <img
                      src={product.imageUrl}
                      alt={product.nom}
                      className="product-image"
                      onError={handleImageError} // Use the updated error handler
                      onClick={() => handleImageZoom(product.imageUrl)}
                    />
                   
                  </div>

                  <div className="product-info">
                    <div className="product-meta">
                      <span className="product-category">
                        {product.categorie?.nom || 'Non catégorisé'}
                      </span>
                      <span className="product-ref">Ref: {product.reference}</span>
                    </div>

                    <h3 className="product-title">{product.nom}</h3>

                    
                    <div className="product-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={`${product.id}-star-${i}`}
                          size={16} 
                          fill={i < product.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                      <span>({product.reviews})</span>
                    </div>

                    {/* Remplacer l'affichage du prix par un simple div */}
                    <div className="product-price">Sur demande</div>

                    <div className="product-footer">
                   
                      
                      <div className="product-actions">
                        <button 
                          className="view-details-btn"
                          onClick={() => openProductDetails(product)}
                        >
                          Voir détails
                        </button>
                        
                        <button 
                          className="add-to-cart"
                          onClick={() => addToCart(product)}
                        >
                          <ShoppingCart size={16} />
                          Ajouter au panier
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <h3>Aucun produit ne correspond à vos critères</h3>
                <button 
                  onClick={() => {
                    setSelectedCategory('');
                    setSelectedBrand('');
                    setSearchQuery('');
                    setSortOption('featured');
                  }}
                  className="reset-filters"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
                onClick={() => setCurrentPage(prev => prev - 1)}
                disabled={currentPage === 1}
              >
                Précédent
              </button>

              <div className="page-numbers">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={`page-${pageNum}`} // Added unique key
                      className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="ellipsis">...</span>
                )}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <button
                    className={`page-btn ${currentPage === totalPages ? 'active' : ''}`}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </button>
                )}
              </div>

              <button
                className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage === totalPages}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="product-details-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={closeProductDetails}>×</button>
            
            {loadingDetails ? (
              <div className="loading-state">
                <Loader className="spinner" size={32} />
                <p>Chargement des détails...</p>
              </div>
            ) : (
              <div className="product-details">
                <div className="product-details-header">
                  <div className="product-details-image">
                    <img 
                      src={selectedProduct.imageUrl} 
                      alt={selectedProduct.nom}
                      onError={handleImageError}
                      onClick={() => handleImageZoom(selectedProduct.imageUrl)}
                    />
                  
                  </div>
                  
                  <div className="product-details-info">
                    <h2>{selectedProduct.nom}</h2>
                    <p className="product-reference">Référence: {selectedProduct.reference}</p>
                    <p className="product-brand">Marque: {selectedProduct.marque?.nom || 'N/A'}</p>
                    <p className="product-category">Catégorie: {selectedProduct.categorie?.nom || 'Non catégorisé'}</p>
                    
                    {/* Remplacer l'affichage du prix par un simple paragraphe */}
                    <p className="product-price-display">Sur demande</p>
                    
                    <div className="product-description">
                      <p>{selectedProduct.description || "La pompe pneumatique à double membrane (AODD) en plastique boulonné Wilden® combine des performances et une efficacité maximales avec un confinement supérieur."}</p>
                    </div>

                    
                    <div className="product-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={`${selectedProduct.id}-star-${i}`}
                          size={16} 
                          fill={i < selectedProduct.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                      <span>({selectedProduct.reviews})</span>
                    </div>
                    
                    <button 
                      className="add-to-cart-large"
                      onClick={() => addToCart(selectedProduct)}
                    >
                      <ShoppingCart size={20} />
                      Ajouter au panier
                    </button>
                  </div>
                </div>
                
                <div className="product-details-body">
                  {/* Removing the duplicate product description */}
                  
                 
                  <div className="technical-specs-container">
                    {productDetails && Object.entries(productDetails)
                      .filter(([key, value]) => 
                        typeof value !== 'object' && 
                        key !== 'id' && 
                        key !== 'nom' && 
                        key !== 'prix' && 
                        key !== 'imageUrl' &&
                        key !== 'dateCreation' &&
                        key !== 'dateModification'
                      )
                      .map(([key, value]) => (
                        <div key={`spec-${key}`} className="spec-group"> 
                          <div className="spec-title">
                            {key.split(/(?=[A-Z])/).join(' ').toUpperCase()}
                          </div>
                          <div className="spec-value">{value || 'Non spécifié'}</div>
                        </div>
                      ))
                    }
                  </div>
                                  
                  {productDetails?.caracteristiques && (
                    <div className="technical-section">
                      <h3>Caractéristiques techniques</h3>
                      <ul>
                        {Array.isArray(productDetails.caracteristiques) 
                          ? productDetails.caracteristiques.map((char, index) => (
                              <li key={`char-${index}-${char.substring(0, 0)}`}>{char}</li> // Enhanced unique key
                            ))
                          : <li>{productDetails.caracteristiques}</li>
                        }1
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Zoomed Image Modal */}
      {zoomedImage && (
        <div className="zoomed-image-container" onClick={closeZoomedImage}>
          <img 
            src={zoomedImage} 
            alt="Produit agrandi" 
            className="zoomed-image"
            onError={handleImageError}
          />
        </div>
      )}
    </div>
  );
};

export default CatalogueProduits;
