import './Dashboard.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import logo from '../../assets/logosofi1.png';
import AdminConsultations from './AdminConsultations';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [notifications, setNotifications] = useState({
    devis: 3,
    consultations: 5,
    reclamations: 2
  });
  const [showNotifications, setShowNotifications] = useState(false);

  // Modifions la fonction handleNavigation
  const handleNavigation = (route) => {
    setActiveItem(route);
    if (route === 'dashboard') {
      navigate('/admin/dashboard');
    } else {
      navigate(`/admin/dashboard/${route}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <img src={logo} alt="SOFIMED Logo" className="logo-img" />
          </div>
          <p className="brand-subtitle">Espace Administrateur</p>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-menu">
            <li 
              className={`nav-item ${activeItem === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleNavigation('dashboard')}
            >
              <span className="nav-icon">📊</span>
              <span>Tableau de bord</span>
            </li>
            <li 
              className={`nav-item ${activeItem === 'users' ? 'active' : ''}`}
              onClick={() => handleNavigation('users')}
            >
              <span className="nav-icon">👥</span>
              <span>Gestion Utilisateurs</span>
            </li>
            <li 
              className={`nav-item ${activeItem === 'products' ? 'active' : ''}`}
              onClick={() => handleNavigation('products')}
            >
              <span className="nav-icon">📦</span>
              <span>Gestion Produits</span>
            </li>
            <li 
              className={`nav-item ${activeItem === 'devis' ? 'active' : ''}`}
              onClick={() => handleNavigation('devis')}
            >
              <span className="nav-icon">📄</span>
              <span>Demandes de devis</span>
              {notifications.devis > 0 && <span className="badge">{notifications.devis}</span>}
            </li>
            <li 
              className={`nav-item ${activeItem === 'consultations' ? 'active' : ''}`}
              onClick={() => handleNavigation('consultations')}
            >
              <span className="nav-icon">💬</span>
              <span>Consultations</span>
              {notifications.consultations > 0 && <span className="badge">{notifications.consultations}</span>}
            </li>
            <li 
              className={`nav-item ${activeItem === 'reclamations' ? 'active' : ''}`}
              onClick={() => handleNavigation('reclamations')}
            >
              <span className="nav-icon">⚠️</span>
              <span>Réclamations</span>
              {notifications.reclamations > 0 && <span className="badge">{notifications.reclamations}</span>}
            </li>
            <li 
              className={`nav-item ${activeItem === 'stats' ? 'active' : ''}`}
              onClick={() => handleNavigation('stats')}
            >
              <span className="nav-icon">📈</span>
              <span>Statistiques</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">A</div>
            <div className="user-info">
              <p className="user-name">Admin</p>
              <p className="user-email">admin@sofimed.com</p>
            </div>
          </div>
          <ul className="footer-menu">
            <li className="footer-item">
              <span className="nav-icon">⚙️</span>
              <span>Paramètres</span>
            </li>
            <li className="footer-item" onClick={handleLogout}>
              <span className="nav-icon">🚪</span>
              <span>Déconnexion</span>
            </li>
          </ul>
        </div>
      </aside>

      <main className="dashboard-main">
        <Routes>
          <Route path="/" element={
            <>
              <header className="main-header">
                <h2>Tableau de Bord Administrateur</h2>
                <div className="header-actions">
                  <button className="notif-btn" onClick={() => setShowNotifications(!showNotifications)}>
                    <span className="nav-icon">🔔</span>
                    {(notifications.devis + notifications.consultations + notifications.reclamations) > 0 && (
                      <span className="notif-badge">
                        {notifications.devis + notifications.consultations + notifications.reclamations}
                      </span>
                    )}
                  </button>
                </div>
              </header>
              
              <div className="content-wrapper">
                <div className="welcome-card">
                  <div className="card-content">
                    <h1>Bienvenue dans l'espace administrateur</h1>
                    <p className="welcome-text">
                      Gérez les utilisateurs, les produits et suivez l'activité de la plateforme.
                    </p>
                  </div>
                </div>
                
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <span>👥</span>
                    </div>
                    <div className="stat-info">
                      <p className="stat-label">Utilisateurs actifs</p>
                      <p className="stat-value">150</p>
                      <p className="stat-change positive">+12 ce mois</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">
                      <span>📦</span>
                    </div>
                    <div className="stat-info">
                      <p className="stat-label">Produits</p>
                      <p className="stat-value">1,240</p>
                      <p className="stat-change">En stock</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">
                      <span>📄</span>
                    </div>
                    <div className="stat-info">
                      <p className="stat-label">Devis en attente</p>
                      <p className="stat-value">{notifications.devis}</p>
                      <p className="stat-change negative">Nécessite attention</p>
                    </div>
                  </div>
                  
                  <div className="stat-card">
                    <div className="stat-icon">
                      <span>💬</span>
                    </div>
                    <div className="stat-info">
                      <p className="stat-label">Consultations</p>
                      <p className="stat-value">{notifications.consultations}</p>
                      <p className="stat-change">À traiter</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          } />
          <Route path="consultations" element={<AdminConsultations />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
