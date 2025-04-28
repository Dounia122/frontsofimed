import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, FileText, MessageCircle, Users, History, Settings, HelpCircle, LogOut, ChartBar, Bell } from "lucide-react";
import logo from '../../assets/logosofi1.png';
import './CommercialDashboard.css';

const CommercialDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const user = location.state?.userData || JSON.parse(localStorage.getItem('user'));
    if (!user) navigate('/login');
    setUserData(user);
  }, [navigate, location]);

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
            <img src={logo} alt="SOFIMED Logo" />
          </div>
          <p className="brand-subtitle">Espace Commercial</p>
        </div>
        
        <nav className="sidebar-nav">
          {[
            { icon: Home, label: "Tableau de bord", path: "" },
            { icon: Users, label: "Gestion Clients", path: "clients" },
            { icon: FileText, label: "Devis", path: "devis" },
            { icon: MessageCircle, label: "Consultations", path: "consultations" },
            { icon: ChartBar, label: "Statistiques", path: "statistiques" },
            { icon: History, label: "Historique" }
          ].map((item, index) => (
            <div 
              key={index}
              className="nav-item"
              onClick={() => item.path && navigate(item.path)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </div>
          ))}
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
          
          <div className="footer-menu">
            <div className="footer-item">
              <Settings size={16} />
              <span>Paramètres</span>
            </div>
            <div className="footer-item">
              <HelpCircle size={16} />
              <span>Aide & Support</span>
            </div>
            <div className="footer-item" onClick={handleLogout}>
              <LogOut size={16} />
              <span>Déconnexion</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="main-header">
          <h2>Tableau de Bord Commercial</h2>
          <div className="header-actions">
            <button className="notification-badge">
              <Bell size={20} />
            </button>
          </div>
        </header>
        
        <div className="content-wrapper">
          <div className="welcome-card">
            <div className="card-content">
              <h1>Bienvenue dans votre espace Commercial</h1>
              <p className="welcome-text">
                Gérez vos clients, consultez les devis et suivez vos performances.
              </p>
              <div className="card-actions">
                <button className="btn btn-primary" onClick={() => navigate('clients')}>
                  <Users size={16} />
                  <span>Gérer mes clients</span>
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('devis')}>
                  <FileText size={16} />
                  <span>Voir les devis</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="stats-grid">
            {[
              { icon: Users, label: "Clients actifs", value: "45", change: "+3 ce mois", positive: true },
              { icon: FileText, label: "Devis en attente", value: "12", change: "À traiter" },
              { icon: ChartBar, label: "Taux de conversion", value: "68%", change: "+5% ce mois", positive: true },
              { icon: MessageCircle, label: "Consultations", value: "8", change: "En attente" }
            ].map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">
                  <stat.icon size={20} color={stat.color} />
                </div>
                <div className="stat-info">
                  <p className="stat-label">{stat.label}</p>
                  <p className="stat-value">{stat.value}</p>
                  <p className={`stat-change ${stat.positive ? 'positive' : ''}`}>
                    {stat.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommercialDashboard;