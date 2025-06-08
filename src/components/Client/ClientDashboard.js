import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, MessageCircle, Truck, History, Settings, HelpCircle, LogOut, ShoppingCart, Book } from "lucide-react";
import logo from '../../assets/logosofi1.png'; 
import './ClienDashboard.css';
import { Routes, Route } from 'react-router-dom';
import CatalogueProduits from './CatalogueProduits';
// Import the Panier component
import Panier from './Panier';
import DemandeConsultation from './DemandeConsultation';
import DemandeDevis from './DemandeDevis';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

const ClientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  // Add state for cart items
  const [cartItems, setCartItems] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [stompClient, setStompClient] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Get user data from navigation state or localStorage
    const user = location.state?.userData || JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    setUserData(user);
    
    // Load cart data from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      setCartItems(parsedCart);
    }
    // Ajout : Récupérer le nombre de messages non lus au chargement
    if (user) {
      fetchUnreadMessages(user.id);
    }
  }, [navigate, location]);

  // Add effect to update cart count when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      } else {
        setCartItems([]);
      }
    };

    // Listen for storage events (when cart is updated from other components)
    window.addEventListener('storage', handleStorageChange);
    
    // Check for cart updates every second (for same-tab updates)
    const interval = setInterval(() => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (JSON.stringify(parsedCart) !== JSON.stringify(cartItems)) {
          setCartItems(parsedCart);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [cartItems]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Calculate total items in cart
  const getTotalCartItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Fonction pour récupérer le nombre de messages non lus
  const fetchUnreadMessages = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/messages/unread/count?userId=${userId}&userType=client`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUnreadMessages(data.total || 0);
      }
    } catch (error) {
      setUnreadMessages(0);
    }
  };

  // Ajout : WebSocket pour notification en temps réel
  useEffect(() => {
    if (!userData) return;
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new StompClient({
      webSocketFactory: () => socket,
      onConnect: () => {
        // S'abonner au topic des messages pour ce client
        client.subscribe(`/topic/messages/${userData.id}`, () => {
          fetchUnreadMessages(userData.id);
        });
      }
    });
    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, [userData]);

  // Fonction pour récupérer les notifications
  const fetchNotifications = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/notifications/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des notifications:", error);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchNotifications(userData.id);
    }
  }, [userData]);

  // Fonction pour marquer une notification comme lue
  const markNotificationAsRead = async (notifId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notifId ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la notification:", error);
    }
  };

  // Quand on ouvre le menu, marquer toutes les notifications non lues comme lues
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      notifications
        .filter((notif) => !notif.isRead)
        .forEach((notif) => markNotificationAsRead(notif.id));
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <img src={logo} alt="SOFIMED Logo" className="logo-img" />
          </div>
          <p className="brand-subtitle">Espace Client Professionnel</p>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-menu">
            <li className="nav-item" onClick={() => navigate('')}>
              <Home className="nav-icon" size={18} />
              <span>Accueil</span>
            </li>
            <li className="nav-item" onClick={() => navigate('catalogue')}>
              <Book className="nav-icon" size={18} />
              <span>Catalogue Produits</span>
            </li>
            <li className="nav-item" onClick={() => navigate('panier')}>
              <ShoppingCart className="nav-icon" size={18} />
              <span>Mon Panier</span>
              {cartItems.length > 0 && (
                <span className="cart-badge">{getTotalCartItems()}</span>
              )}
            </li>
            <li className="nav-item" onClick={() => navigate('consultation')}>
              <FileText className="nav-icon" size={18} />
              <span>Demande de consultation</span>
            </li>
            <li className="nav-item" onClick={() => navigate('devis')}>
              <FileText className="nav-icon" size={18} />
              <span>Demande de devis</span>
            </li>
            <li className="nav-item">
              <MessageCircle className="nav-icon" size={18} />
              <span>Réclamations</span>
            </li>
            <li className="nav-item">
              <Truck className="nav-icon" size={18} />
              <span>Suivi de commande</span>
            </li>
            <li className="nav-item">
              <History className="nav-icon" size={18} />
              <span>Historique</span>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              {userData?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="user-info">
              <p className="user-name">{userData?.username}</p>
              <p className="user-email">{userData?.email}</p>
            </div>
          </div>
          <ul className="footer-menu">
            <li className="footer-item">
              <Settings size={16} />
              <span>Paramètres</span>
            </li>
            <li className="footer-item">
              <HelpCircle size={16} />
              <span>Aide & Support</span>
            </li>
            <li className="footer-item" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Déconnexion</span>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        <Routes>
          <Route path="/catalogue" element={<CatalogueProduits />} />
          <Route path="/panier" element={<Panier />} />
          <Route path="/consultation" element={<DemandeConsultation />} />
          <Route path="/devis" element={<DemandeDevis />} />
          {/* Add route for the shopping cart */}
          <Route path="/" element={
            <>
              <header className="main-header">
                <h2>Tableau de Bord</h2>
                <div className="header-actions" style={{ position: "relative" }}>
                  <button className="notif-btn" aria-label="Notifications" onClick={toggleNotifications}>
                    <span className="notif-icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </span>
                    {unreadMessages > 0 && (
                      <span className="notif-badge">{unreadMessages}</span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="notif-dropdown">
                      <div className="notif-dropdown-title">Notifications</div>
                      <ul className="notif-dropdown-list">
                        {notifications.length === 0 && (
                          <li className="notif-dropdown-item empty">Aucune notification</li>
                        )}
                        {notifications.map((notif) => (
                          <li
                            key={notif.id}
                            className={`notif-dropdown-item${notif.isRead ? " read" : " unread"}`}
                          >
                            {notif.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </header>
              
              <div className="content-wrapper">
                <div className="welcome-card">
                  <div className="card-content">
                    <h1>Bienvenue dans votre espace SOFIMED</h1>
                    <p className="welcome-text">
                      Découvrez notre catalogue complet de produits industriels et médicaux.
                      Commandez en ligne et profitez de nos offres exclusives.
                    </p>
                    <div className="card-actions">
                      <button className="btn btn-primary" onClick={() => navigate('catalogue')}>
                        <Book size={16} style={{ marginRight: 8 }} />
                        Parcourir le catalogue
                      </button>
                      <button className="btn btn-secondary" onClick={() => navigate('panier')}>
                        <ShoppingCart size={16} style={{ marginRight: 8 }} />
                        Voir mon panier
                      </button>
                    </div>
                  </div>
                  <div className="card-illustration">
                    <svg width="180" height="180" viewBox="0 0 200 200" fill="none">
                      <circle cx="100" cy="100" r="80" fill="#EFF6FF" />
                      <path d="M70 120L90 140L130 100" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" />
                      <path d="M60 80C60 68.9543 68.9543 60 80 60" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" />
                      <path d="M140 60C140 48.9543 148.954 40 160 40" stroke="#3B82F6" strokeWidth="8" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                
                <div className="stats-grid">
                  {/* Update cart stat card to show actual data */}
                  <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#F0F9FF' }}>
                      <ShoppingCart size={20} color="#0EA5E9" />
                    </div>
                    <div className="stat-info">
                      <p className="stat-label">Panier actuel</p>
                      <p className="stat-value">{getTotalCartItems()} article{getTotalCartItems() !== 1 ? 's' : ''}</p>
                      <p className="stat-change">
                        {cartItems.length > 0 ? 'Cliquez pour voir' : 'Panier vide'}
                      </p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#EFF6FF' }}>
                      <FileText size={20} color="#3B82F6" />
                    </div>
                    <div className="stat-info">
                      <p className="stat-label">Demandes en cours</p>
                      <p className="stat-value">5</p>
                      <p className="stat-change positive">+2 cette semaine</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#ECFDF5' }}>
                      <Truck size={20} color="#10B981" />
                    </div>
                    <div className="stat-info">
                      <p className="stat-label">Commandes actives</p>
                      <p className="stat-value">2</p>
                      <p className="stat-change">En traitement</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#FEF2F2' }}>
                      <MessageCircle size={20} color="#EF4444" />
                    </div>
                    <div className="stat-info">
                      <p className="stat-label">Messages non lus</p>
                      <p className="stat-value">{unreadMessages}</p>
                      <p className="stat-change negative">{unreadMessages > 0 ? 'Réponse urgente' : 'Aucun message'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          } />
        </Routes>
      </main>
    </div>
  );
};

export default ClientDashboard;