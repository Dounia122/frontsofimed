import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Panier.css';
import noImage from '../../assets/no-image.png';
import axios from 'axios';

const Panier = () => {
  const [cart, setCart] = useState([]);
  const cartId = 17; // Use a constant for the cart ID
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Strict authentication check
    const token = localStorage.getItem('token');
    let user;
    
    try {
      user = JSON.parse(localStorage.getItem('user'));
    } catch (e) {
      user = null;
    }
    
    if (!token || !user || token === 'undefined' || token === 'null') {
      localStorage.clear();
      navigate('/login', { replace: true });
      return;
    }

    // REMOVE or COMMENT OUT the dynamic cartId fetching below:
    // const fetchCartId = async () => {
    //   try {
    //     const response = await axios.get('http://localhost:8080/api/carts/current', {
    //       headers: { 'Authorization': `Bearer ${token}` }
    //     });
    //     setCartId(response.data.id);
    //     // Optionally, sync cart items from backend:
    //     // setCart(response.data.items);
    //   } catch (err) {
    //     setError("Unable to fetch active cart.");
    //   }
    // };
    // fetchCartId();

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, [navigate]);

  const handleDevisRequest = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setIsLoading(false);
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.id) {
        setError("Informations utilisateur non disponibles");
        setIsLoading(false);
        return;
      }

      if (!cartId) {
        setError("Aucun panier actif trouvé.");
        setIsLoading(false);
        return;
      }

      // Ajouter les articles au panier
      const cartItems = cart.map(item => ({
        produitId: item.id,
        quantity: item.quantity
      }));

      await axios.post(
        `http://localhost:8080/api/carts/${cartId}/items`,
        cartItems,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      clearCart();
      navigate('/client/dashboard/catalogue');
      
    } catch (err) {
      console.error('Erreur complète:', {
        message: err.message,
        response: err.response,
        data: err.response?.data
      });
      
      if (err.response?.status === 404) {
        setError("Impossible de trouver le panier actif");
      } else if (err.response?.status === 403) {
        setError("Accès refusé. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError("Une erreur est survenue lors de la sauvegarde du panier");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  // Remove the first removeItem function that doesn't handle server communication
  // const removeItem = (productId) => {
  //   const updatedCart = cart.filter(item => item.id !== productId);
  //   updateCart(updatedCart);
  // };

  const updateQuantity = async (productId, newQuantity) => {
    try {
      if (newQuantity < 1) return;
      
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');
  
      if (!token || !userString) {
        setError("Session expirée. Veuillez vous reconnecter.");
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
        alert("Seuls les clients peuvent modifier le panier");
        return;
      }
  
      if (!cartId) {
        setError("Aucun panier actif trouvé.");
        return;
      }
  
      await axios.put(
        `http://localhost:8080/api/carts/${cartId}/items/${productId}`,
        { quantity: newQuantity },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      const updatedCart = cart.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
      updateCart(updatedCart);
  
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { 
          state: { message: "Votre session a expiré. Veuillez vous reconnecter." }
        });
        return;
      }
  
      if (error.response?.status === 403) {
        setError("Vous n'avez pas les permissions nécessaires pour cette action. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
  
      setError(error.message || "Une erreur est survenue lors de la mise à jour de la quantité. Veuillez réessayer.");
    }
  };

  // Keep this async removeItem function that handles server communication
  // Ajouter en haut du fichier
  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 10000,
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
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login?sessionExpired=true';
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );
  const removeItem = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const userString = localStorage.getItem('user');
  
      if (!token || !userString) {
        setError("Session expirée. Veuillez vous reconnecter.");
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
        alert("Seuls les clients peuvent modifier le panier");
        return;
      }
  
      if (!cartId) {
        setError("Aucun panier actif trouvé.");
        return;
      }
  
      await axios.delete(`http://localhost:8080/api/carts/${cartId}/items/${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const updatedCart = cart.filter(item => item.id !== productId);
      updateCart(updatedCart);
  
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { 
          state: { message: "Votre session a expiré. Veuillez vous reconnecter." }
        });
        return;
      }
  
      if (error.response?.status === 403) {
        setError("Vous n'avez pas les permissions nécessaires pour cette action. Veuillez vous reconnecter.");
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }
  
      setError("Une erreur est survenue lors de la suppression du produit. Veuillez réessayer plus tard.");
    }
};

  const clearCart = () => {
    updateCart([]);
  };

  const handleImageError = (e) => {
    console.error('Failed to load image:', e.target.src);
    e.target.onerror = null;
    e.target.src = noImage;
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="panier-container">
      <div className="panier-header">
        <button className="back-button" onClick={() => navigate('/client/dashboard/catalogue')}>
          <ArrowLeft size={20} />
          Retour au catalogue
        </button>
        <h1>
          <ShoppingCart size={28} className="cart-icon" />
          Mon Panier
        </h1>
        {cart.length > 0 && (
          <button className="clear-cart" onClick={clearCart}>
            Vider le panier
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="empty-cart">
          <ShoppingCart size={64} />
          <h2>Votre panier est vide</h2>
          <p>Ajoutez des produits à votre panier pour les retrouver ici.</p>
          <button className="continue-shopping" onClick={() => navigate('/client/dashboard/catalogue')}>
            Continuer mes achats
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-items">
            <div className="cart-header">
              <span className="header-product">Produit</span>
              <span className="header-quantity">Quantité</span>
              <span className="header-actions">Actions</span>
            </div>
            
            {cart.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <img 
                    src={item.imageUrl} 
                    alt={item.nom} 
                    className="item-image"
                    onError={handleImageError}
                  />
                  <div className="item-details">
                    <h3>{item.nom}</h3>
                    <p className="item-reference">Réf: {item.reference}</p>
                    <p className="item-category">{item.categorie?.nom || 'Non catégorisé'}</p>
                  </div>
                </div>
                
                <div className="item-quantity">
                  <button 
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button 
                    className="quantity-btn"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="item-actions">
                  <button 
                    className="remove-item"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="cart-summary-panel">
            <h2>Résumé de la commande</h2>
            <div className="summary-row">
              <span>Nombre d'articles:</span>
              <span>{getTotalItems()}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>Sur demande</span>
            </div>
            <button 
              className="checkout-btn"
              onClick={handleDevisRequest}
              disabled={isLoading || cart.length === 0}
            >
              {isLoading ? 'Envoi en cours...' : 'Demander un devis'}
            </button>
            <button 
              className="continue-shopping" 
              onClick={() => navigate('/client/dashboard/catalogue')}
              disabled={isLoading}
            >
              Continuer mes achats
            </button>
          </div>
        </div>
      )}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default Panier;