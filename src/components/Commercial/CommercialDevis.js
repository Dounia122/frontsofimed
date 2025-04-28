import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CommercialDevis.css';
import { FileText, MessageCircle, User, Search, Filter, Download, Eye, AlertCircle, Loader, Home, Users, ChartBar, History, Settings, HelpCircle, LogOut, Bell } from 'lucide-react';
import axios from 'axios';
import './CommercialDashboard.css';
import CommercialChat from './CommercialChat';
import logo from '../../assets/logosofi1.png';

const CommercialDevis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [devisList, setDevisList] = useState([]); // Initialiser avec un tableau vide au lieu des données mockées
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TOUS');
  const [showChat, setShowChat] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [showPrixModal, setShowPrixModal] = useState(false);
  const [selectedDevisForPrix, setSelectedDevisForPrix] = useState(null);

  const handleViewDevis = (devis) => {
    console.log('Devis sélectionné:', devis); // Vérifiez la console pour ce log
    setSelectedDevisForPrix(devis);
    setShowPrixModal(true);
  };

  useEffect(() => {
    fetchDevisList();
  }, []);

  const fetchDevisList = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const user = JSON.parse(localStorage.getItem('user'));
      console.log('User data:', user);

      if (!user || !user.id) {
        setError("Informations utilisateur non disponibles");
        setLoading(false);
        return;
      }
      
      // Récupérer d'abord l'ID commercial
      const commercialResponse = await axios.get(`http://localhost:8080/api/commercials/user/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!commercialResponse.data || !commercialResponse.data.id) {
        setError("Impossible de récupérer les informations du commercial");
        setLoading(false);
        return;
      }

      const commercialId = commercialResponse.data.id;
      console.log('Commercial ID récupéré:', commercialId);
      
      // Utiliser l'ID commercial pour récupérer les devis
      const response = await axios.get(`http://localhost:8080/api/devis/commercial/${commercialId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setDevisList(response.data);
      }
      setError('');
    } catch (err) {
      console.error('Erreur complète:', {
        message: err.message,
        response: err.response,
        data: err.response?.data
      });
      
      if (err.response?.status === 403) {
        setError("Accès refusé. Veuillez vérifier vos permissions.");
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else if (err.response?.status === 500 && 
                 typeof err.response.data === 'string' &&
                 err.response.data.toLowerCase().includes("erreur serveur : aucun devis trouvé")) {
        // Cas spécifique : aucun devis trouvé
        setDevisList([]);
        setError(''); // État normal, pas d'erreur
      } else if (err.response?.status === 500) {
        setError("Une erreur technique est survenue. Veuillez réessayer ultérieurement.");
      } else {
        setError(err.response?.data || "Impossible de charger la liste des devis");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDevis = async (devisId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/devis/download/${devisId}`, {
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis-${devisId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      alert('Erreur lors du téléchargement du devis');
    }
  };

  const handleOpenChat = (devis) => {
    setSelectedDevis(devis);
    setShowChat(true);
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setSelectedDevis(null);
  };

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

  // Keep only these single declarations
  const filteredDevis = devisList.filter(devis => {
    const matchesSearch = devis.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         devis.client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         devis.client.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'TOUS' || devis.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'status-pending';
      case 'EN_COURS': return 'status-progress';
      case 'TERMINÉ': return 'status-completed';
      default: return '';
    }
  };

  // Ajout de la fonction pour déterminer le statut du client
  // Optimisation de la fonction getClientStatus
const getClientStatus = (client) => {
  const orderCount = client.orderCount || 0;
  
  if (client.isNew || orderCount === 0) {
    return { label: 'Nouveau Client', class: 'client-new' };
  } else if (orderCount > 10) {
    return { label: 'Client Fidèle', class: 'client-loyal' };
  } else if (orderCount > 5) {
    return { label: 'Client Potentiel', class: 'client-potential' };
  }
  return { label: 'Client Régulier', class: 'client-regular' };
};

// Ajout d'un loader plus élégant
const LoadingState = () => (
  <div className="loading-state">
    <div className="spinner"></div>
    <p>Chargement en cours...</p>
  </div>
);

  // Dans le rendu du tableau, modifiez la structure pour ajouter la nouvelle colonne
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
              className={`nav-item ${location.pathname.includes(item.path) ? 'active' : ''}`}
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
        <div className="commercial-devis-container">
          <div className="devis-header">
            <h1>Gestion des Devis</h1>
            <div className="devis-actions">
              <div className="search-bar">
                <Search size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un devis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="status-filter"
              >
                <option value="TOUS">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="EN_COURS">En cours</option>
                <option value="TERMINÉ">Terminé</option>
              </select>
            </div>
          </div>

          <div className="devis-list">
            {loading ? (
              <div className="loading-state">
                <Loader className="spinner" />
                <p>Chargement des devis...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <AlertCircle />
                <p>{error}</p>
              </div>
            ) : filteredDevis.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} />
                <p>Vous n'avez pas encore de devis associés à votre compte</p>
              </div>
            ) : (
              <table className="devis-table">
                <thead>
                  <tr>
                    <th>Référence</th>
                    <th>Client</th>
                    <th>Statut Client</th>
                    <th>Date de création</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevis.map(devis => (
                    <tr key={devis.id}>
                      <td>{devis.reference}</td>
                      <td>
                        <div className="client-info">
                          <User size={16} />
                          <span>{devis.client.firstName} {devis.client.lastName}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`client-status-badge ${getClientStatus(devis.client).class}`}>
                          {getClientStatus(devis.client).label}
                        </span>
                      </td>
                      <td>{new Date(devis.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(devis.status)}`}>
                          {devis.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="devis-actions-buttons">
                          <button 
                            className="action-btn view" 
                            title="Voir le devis"
                            onClick={() => handleViewDevis(devis)}
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            className="action-btn download" 
                            title="Télécharger"
                            onClick={() => handleDownloadDevis(devis.id)}
                          >
                            <Download size={16} />
                          </button>
                          <button 
                            className="action-btn chat" 
                            title="Discuter avec le client"
                            onClick={() => handleOpenChat(devis)}
                          >
                            <MessageCircle size={16} />
                            {devis.unreadMessages > 0 && (
                              <span className="notification-badge">{devis.unreadMessages}</span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {showChat && selectedDevis && (
            <ChatModal 
              devis={selectedDevis} 
              onClose={handleCloseChat} 
            />
          )}
          {showPrixModal && selectedDevisForPrix && (
            <PrixModal 
              devis={selectedDevisForPrix} 
              onClose={() => setShowPrixModal(false)}
              onUpdate={fetchDevisList}
            />
          )}
        </div>
      </main>
    </div>
  );
};

// Supprimer ou commenter les données mockées
// const mockDevisList = [ ... ];

export default CommercialDevis;

const ChatModal = ({ devis, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message = {
      id: Date.now(),
      text: newMessage,
      sender: 'commercial',
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  return (
    <div className="chat-modal">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar">
              {devis.client.firstName[0] + devis.client.lastName[0]}
            </div>
            <div className="chat-header-text">
              <h3>{devis.client.firstName} {devis.client.lastName}</h3>
              <p>Devis: {devis.reference}</p>
            </div>
          </div>
          <button className="close-chat-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="no-messages">
              Commencez la conversation avec votre client
            </div>
          ) : (
            messages.map(message => (
              <div key={message.id} 
                   className={`message ${message.sender === 'commercial' ? 'sent' : 'received'}`}>
                {message.sender === 'client' && (
                  <div className="message-avatar">
                    {devis.client.firstName[0] + devis.client.lastName[0]}
                  </div>
                )}
                <div className="message-content">
                  <p>{message.text}</p>
                  <span className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <textarea
            placeholder="Écrivez votre message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button 
            className="send-message-btn"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PrixModal = ({ devis, onClose, onUpdate }) => {
  const [prix, setPrix] = useState(devis.prix || 0);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8080/api/devis/${devis.id}/produits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setProduits(response.data);
      } catch (err) {
        console.error('Erreur lors de la récupération des produits:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduits();
  }, [devis.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/devis/${devis.id}/prix`, 
        { prix: parseFloat(prix) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Erreur lors de la mise à jour du prix:', err);
      alert('Erreur lors de la mise à jour du prix');
    }
  };

  return (
    <div className="prix-modal">
      <div className="prix-container">
        <div className="prix-header">
          <h3>Détails du devis</h3>
          <button className="close-prix-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="prix-content">
          <div className="devis-info">
            <h4>Informations générales</h4>
            <p>Référence: {devis.reference}</p>
            <p>Client: {devis.client.firstName} {devis.client.lastName}</p>
            <p>Statut: {devis.status}</p>
          </div>

          <div className="produits-list">
            <h4>Produits du devis</h4>
            {loading ? (
              <div className="loading-produits">
                Chargement des produits...
              </div>
            ) : produits.length === 0 ? (
              <div className="no-produits">
                Aucun produit dans ce devis
              </div>
            ) : (
              produits.map(produit => (
                <div key={produit.id} className="produit-item">
                  <div className="produit-image">
                    <img 
                      src={produit.imageUrl} 
                      alt={produit.nom}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.png';
                      }}
                    />
                  </div>
                  <div className="produit-info">
                    <h5>{produit.nom}</h5>
                    <p className="produit-description">{produit.description}</p>
                    <p className="produit-prix">{produit.prix} €</p>
                    <p className="produit-quantite">Quantité: {produit.quantite}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="prix-total">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="prix">Prix total (DH)</label>
                <input
                  type="number"
                  id="prix"
                  value={prix}
                  onChange={(e) => setPrix(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div className="prix-actions">
                <button type="submit" className="submit-prix-btn">
                  Mettre à jour le prix
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const PrixForm = ({ devis, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    prix: devis.prix || 0,
    produits: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:8080/api/devis/${devis.id}/produits`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setFormData(prev => ({
          ...prev,
          produits: response.data
        }));
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduits();
  }, [devis.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/devis/${devis.id}/prix`, 
        { prix: parseFloat(formData.prix) },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  return (
    <form className="prix-form" onSubmit={handleSubmit}>
      <h3>Détails du devis #{devis.reference}</h3>
      
      <div className="form-group">
        <label>Client</label>
        <input 
          type="text"
          value={`${devis.client.firstName} ${devis.client.lastName}`}
          readOnly 
        />
      </div>

      <div className="form-group">
        <label>Prix total (DH)</label>
        <input
          type="number"
          name="prix"
          value={formData.prix}
          onChange={handleChange}
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="produits-list">
        <h4>Produits ({formData.produits.length})</h4>
        {loading ? (
          <div>Chargement...</div>
        ) : (
          formData.produits.map(produit => (
            <div key={produit.id} className="produit-item">
              <p><strong>{produit.nom}</strong></p>
              <p>Prix unitaire: {produit.prix} DH</p>
              <p>Quantité: {produit.quantite}</p>
            </div>
          ))
        )}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onClose}>
          Annuler
        </button>
        <button type="submit" className="primary">
          Enregistrer
        </button>
      </div>
    </form>
  );
};
