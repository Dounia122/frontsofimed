import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';


import './CommercialDevis.css'; // Ajoutez cette ligne
import { FileText, MessageCircle, User, Search, Filter, Download, Eye, AlertCircle, Loader, Home, Users, ChartBar, History, Settings, HelpCircle, LogOut, Bell, Mail, Phone, Send, CheckCircle } from 'lucide-react';
import axios from 'axios';
import './CommercialDashboard.css';
import logo from '../../assets/logosofi1.png';


const CommercialDevis = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TOUS');
  const [showChat, setShowChat] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);
  const [showPrixModal, setShowPrixModal] = useState(false);
  const [selectedDevisForPrix, setSelectedDevisForPrix] = useState(null);
  const [showClientDetails, setShowClientDetails] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const handleViewClient = async (devis) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }
  
      const response = await axios.get(`http://localhost:8080/api/devis/${devis.id}/client`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data) {
        setSelectedClient({
          ...response.data,
          // Assurez-vous que ces champs existent dans la réponse
          firstName: response.data.firstName || 'Non spécifié',
          lastName: response.data.lastName || 'Non spécifié',
          email: response.data.email || 'Non spécifié',
          phone: response.data.phone || 'Non spécifié',
          orderCount: response.data.orderCount || 0,
          lastOrderDate: response.data.lastOrderDate || null
        });
        setShowClientDetails(true);
      }
    } catch (err) {
      console.error('Erreur client:', err.response?.data || err.message);
      setError(err.response?.data?.message || "Erreur lors de la récupération des informations client");
    }
  };

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
      
      // Utiliser l'endpoint /api/devis/commercial/{commercialId}
      const response = await axios.get(`http://localhost:8080/api/devis/commercial/${commercialId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        setDevisList(response.data);
        setError('');
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des devis:', err);
      if (err.response?.status === 403) {
        setError("Accès refusé. Veuillez vérifier vos permissions.");
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError("Impossible de charger la liste des devis");
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

  const handleOpenChat = async (devis) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      // Récupérer d'abord les informations du client
      const response = await axios.get(`http://localhost:8080/api/devis/${devis.id}/client`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        // Mettre à jour le devis avec les informations complètes du client
        const devisWithClient = {
          ...devis,
          client: response.data
        };
        setSelectedDevis(devisWithClient);
        setShowChat(true);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du client:', err);
      alert('Impossible de charger les informations du client');
    }
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
    // Vérification de sécurité pour les propriétés
    const reference = devis?.reference?.toLowerCase() || '';
    const firstName = devis?.client?.firstName?.toLowerCase() || '';
    const lastName = devis?.client?.lastName?.toLowerCase() || '';
    const searchTermLower = searchTerm.toLowerCase();
  
    const matchesSearch = 
        reference.includes(searchTermLower) ||
        firstName.includes(searchTermLower) ||
        lastName.includes(searchTermLower);
    
    const matchesFilter = filterStatus === 'TOUS' || devis?.status === filterStatus;
    
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
                        <div className="client-info clickable" onClick={() => handleViewClient(devis)}>
                          <User size={16} />
                          <span>
                            {devis.client ? `${devis.client.firstName || ''} ${devis.client.lastName || ''}` : 'Client '}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`client-status-badge ${devis.client ? getClientStatus(devis.client).class : 'client-unknown'}`}>
                          {devis.client ? getClientStatus(devis.client).label : 'Statut inconnu'}
                        </span>
                      </td>
                      <td>{new Date(devis.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(devis.status)}`}>
                          {devis.status ? devis.status.replace('_', ' ') : 'Status inconnu'}
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
                            className="contact-btn"
                            onClick={() => handleOpenChat(devis)}
                            disabled={!devis.id}
                          >
                            <MessageCircle size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {showClientDetails && selectedClient && (
            <div className="client-details-modal">
              <div className="client-details-container">
                <div className="client-details-header">
                  <h3>Détails du Client</h3>
                  <button className="close-details-btn" onClick={() => setShowClientDetails(false)}>
                    &times;
                  </button>
                </div>
                
                <div className="client-info-section">
                  <h4>
                    <User size={24} /> 
                    Informations Personnelles
                  </h4>
                  <div className="client-info-row">
                    <span className="client-info-label">
                      <User size={18} /> 
                      Nom complet
                    </span>
                    <span className="client-info-value">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </span>
                  </div>
                  <div className="client-info-row">
                    <span className="client-info-label">
                      <Mail size={18} /> 
                      Email
                    </span>
                    <span className="client-info-value">
                      {selectedClient.email || 'Non spécifié'}
                    </span>
                  </div>
                  <div className="client-info-row">
                    <span className="client-info-label">
                      <Phone size={18} /> 
                      Téléphone
                    </span>
                    <span className="client-info-value">
                      {selectedClient.phone || 'Non spécifié'}
                    </span>
                  </div>
                </div>
                
                <div className="client-info-section">
                  <h4>
                    <ChartBar size={24} /> 
                    Statistiques Client
                  </h4>
                  <div className="client-info-row">
                    <span className="client-info-label">
                      <FileText size={18} /> 
                      Nombre de commandes
                    </span>
                    <span className="client-info-value">
                      {selectedClient.orderCount || '0'}
                    </span>
                  </div>
                  <div className="client-info-row">
                    <span className="client-info-label">
                      <History size={18} /> 
                      Dernière commande
                    </span>
                    <span className="client-info-value">
                      {selectedClient.lastOrderDate ? new Date(selectedClient.lastOrderDate).toLocaleDateString('fr-FR') : 'Aucune commande'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
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
      
      {/* Ajouter le ChatModal ici, à l'intérieur du composant principal */}
      {showChat && selectedDevis && (
        <ChatModal 
          devis={selectedDevis}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
};

export default CommercialDevis;

// Définition du composant ChatModal
const ChatModal = ({ devis, onClose }) => {
  return (
    <div className="chat-modal">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-user-info">
            <div className="chat-avatar">
              {devis.client?.firstName?.charAt(0) || 'C'}
            </div>
            <div className="chat-user-details">
              <h3>
                {devis.client ? 
                  `${devis.client.firstName} ${devis.client.lastName}` :
                  'Client non identifié'
                }
              </h3>
              <p className="devis-reference">Devis: {devis.reference}</p>
            </div>
          </div>
          <button className="close-chat-btn" onClick={onClose}>×</button>
        </div>

        <div className="chat-messages">
          <div className="no-messages">
            <p>Conversation avec {devis.client?.firstName} {devis.client?.lastName}</p>
          </div>
        </div>

        <div className="chat-input-container">
          <textarea
            className="message-input"
            placeholder="Écrivez un message..."
          />
          <button 
            className="send-message-btn"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Définition du composant PrixModal
const PrixModal = ({ devis, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [produits, setProduits] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Add the getStatusColor function here to make it available in this component
  const getStatusColor = (status) => {
    switch(status) {
      case 'EN_ATTENTE': return 'status-pending';
      case 'EN_COURS': return 'status-progress';
      case 'TERMINÉ': return 'status-completed';
      default: return '';
    }
  };

  useEffect(() => {
    const fetchProduits = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Session expirée. Veuillez vous reconnecter.");
          return;
        }

        // Récupérer les produits du devis
        const response = await axios.get(`http://localhost:8080/api/devis/${devis.id}/items`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data) {
          setProduits(response.data);
          // Calculer le prix total
          const total = response.data.reduce((sum, item) => sum + (item.prix * item.quantity), 0);
          setTotalPrice(total);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des produits:', err);
        setError("Impossible de charger les produits du devis");
      } finally {
        setLoading(false);
      }
    };

    fetchProduits();
  }, [devis.id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
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

  return (
    <div className="prix-modal">
      <div className="prix-modal-content">
        <div className="prix-modal-header">
          <h3>Détails du devis: {devis.reference}</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>

        <div className="devis-info-section">
          <div className="devis-info-row">
            <span className="devis-info-label">Client:</span>
            <span className="devis-info-value">
              {devis.client ? `${devis.client.firstName} ${devis.client.lastName}` : 'Non spécifié'}
            </span>
          </div>
          <div className="devis-info-row">
            <span className="devis-info-label">Date de création:</span>
            <span className="devis-info-value">
              {new Date(devis.createdAt).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="devis-info-row">
            <span className="devis-info-label">Statut:</span>
            <span className={`status-badge ${getStatusColor(devis.status)}`}>
              {devis.status ? devis.status.replace('_', ' ') : 'Status inconnu'}
            </span>
          </div>
        </div>

        <div className="produits-list-container">
          <h4>Produits</h4>
          
          {loading ? (
            <div className="loading-state">
              <Loader className="spinner" />
              <p>Chargement des produits...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle />
              <p>{error}</p>
            </div>
          ) : produits.length === 0 ? (
            <div className="empty-state">
              <p>Aucun produit associé à ce devis</p>
            </div>
          ) : (
            <>
              <table className="produits-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Référence</th>
                    <th>Prix unitaire</th>
                    <th>Quantité</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map(produit => (
                    <tr key={produit.id}>
                      <td>
                        <div className="produit-info">
                          {produit.imageUrl && (
                            <img 
                              src={produit.imageUrl.startsWith('http') ? produit.imageUrl : require(`../../assets/products/${produit.imageUrl}`)} 
                              alt={produit.nom} 
                              className="produit-thumbnail"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '../../assets/no-image.png';
                              }}
                            />
                          )}
                          <span>{produit.nom}</span>
                        </div>
                      </td>
                      <td>{produit.reference || 'N/A'}</td>
                      <td>{formatPrice(produit.prix)}</td>
                      <td>{produit.quantity}</td>
                      <td>{formatPrice(produit.prix * produit.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="total-label">Total</td>
                    <td className="total-value">{formatPrice(totalPrice)}</td>
                  </tr>
                </tfoot>
              </table>
              
              <div className="devis-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleDownloadDevis(devis.id)}
                >
                  <Download size={16} />
                  Télécharger le devis
                </button>
              </div>
            </>
          )}
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
