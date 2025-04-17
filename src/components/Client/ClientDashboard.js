import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, MessageCircle, Truck, History, Settings, HelpCircle, LogOut, ShoppingCart, Book } from "lucide-react";
import logo from '../../assets/logosofi1.png'; 
import './ClienDashboard.css';
import { Routes, Route } from 'react-router-dom';
import CatalogueProduits from './CatalogueProduits';

const ClientDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from navigation state or localStorage
    const user = location.state?.userData || JSON.parse(localStorage.getItem('user'));
    
    if (!user) {
      navigate('/login');
      return;
    }
    
    setUserData(user);
  }, [navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
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
            <li className="nav-item">
              <ShoppingCart className="nav-icon" size={18} />
              <span>Mon Panier</span>
              <span className="cart-badge">2</span>
            </li>
            <li className="nav-item">
              <FileText className="nav-icon" size={18} />
              <span>Demande de consultation</span>
            </li>
            <li className="nav-item">
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
          <Route path="/" element={
            <>
              <header className="main-header">
                <h2>Tableau de Bord</h2>
                <div className="header-actions">
                  <button className="notification-badge">
                    <span className="badge-count">3</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </button>
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
                      <button className="btn btn-primary">
                        <Book size={16} style={{ marginRight: 8 }} />
                        Parcourir le catalogue
                      </button>
                      <button className="btn btn-secondary">
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
                  {/* Add new stat card */}
                  <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: '#F0F9FF' }}>
                      <ShoppingCart size={20} color="#0EA5E9" />
                    </div>
                    <div className="stat-info">
                      <p className="stat-label">Panier actuel</p>
                      <p className="stat-value">2 articles</p>
                      <p className="stat-change">Total: 1,250.00 €</p>
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
                      <p className="stat-value">3</p>
                      <p className="stat-change negative">Réponse urgente</p>
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