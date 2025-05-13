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
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const userData = JSON.parse(localStorage.getItem('user'));
  const [commercialId, setCommercialId] = useState(null);
  const [commercialName, setCommercialName] = useState('');

  useEffect(() => {
    fetchMessages();
    fetchCommercialId();
  }, [devis.id]);

  useEffect(() => {
    // Scroll vers le bas des messages quand ils changent
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchCommercialId = async () => {
    try {
      const token = localStorage.getItem('token');
      const commercialResponse = await axios.get(`http://localhost:8080/api/commercials/user/${userData.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (commercialResponse.data && commercialResponse.data.id) {
        setCommercialId(commercialResponse.data.id);
        // Récupérer aussi le nom du commercial pour l'envoi de messages
        setCommercialName(`${commercialResponse.data.firstName || ''} ${commercialResponse.data.lastName || ''}`.trim());
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des informations du commercial:', err);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log(`Récupération des messages pour le devis ${devis.id}`);
      
      const response = await axios.get(`http://localhost:8080/api/messages/devis/${devis.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Réponse API messages:', response.data);
      
      // S'assurer que messages est toujours un tableau et nettoyer les données circulaires
      const messagesData = Array.isArray(response.data) ? response.data.map(msg => {
        // Créer une copie propre du message sans références circulaires
        return {
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp,
          senderId: msg.senderId,
          senderName: msg.senderName,
          recipientId: msg.recipientId,
          read: msg.read,
          devisId: msg.devisId
        };
      }) : [];
      
      console.log('Messages formatés:', messagesData);
      setMessages(messagesData);
      
      // Marquer les messages comme lus
      await axios.put(`http://localhost:8080/api/messages/devis/${devis.id}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setError('');
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
      setError("Impossible de charger les messages. Veuillez réessayer.");
      // Réinitialiser messages à un tableau vide en cas d'erreur
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!commercialId) {
        throw new Error("ID du commercial non disponible");
      }
      
      const messageData = {
        devisId: devis.id,
        senderId: commercialId,
        senderName: commercialName || 'Commercial',
        recipientId: devis.client.id,
        content: newMessage.trim()
      };
      
      console.log('Envoi du message:', messageData);
      
      const response = await axios.post('http://localhost:8080/api/messages', messageData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Réponse après envoi:', response.data);
      
      // Ajouter le nouveau message à la liste en créant un objet propre
      if (response.data) {
        const newMsg = {
          id: response.data.id,
          content: response.data.content,
          timestamp: response.data.timestamp,
          senderId: response.data.senderId,
          senderName: response.data.senderName,
          recipientId: response.data.recipientId,
          read: response.data.read,
          devisId: response.data.devisId
        };
        
        setMessages(prevMessages => {
          // Vérifier que prevMessages est un tableau
          const currentMessages = Array.isArray(prevMessages) ? prevMessages : [];
          return [...currentMessages, newMsg];
        });
      }
      
      setNewMessage('');
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      alert('Impossible d\'envoyer le message. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  };

  // Fonction sécurisée pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.log('Date invalide:', dateString);
        return '';
      }
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return '';
    }
  };

  return (
    <div className="chat-modal">
      <div className="chat-container">
        <div className="chat-header">
          <div className="chat-user-info">
            <div className="chat-avatar">
              {devis.client?.firstName?.charAt(0) || 'C'}
            </div>
            <div className="chat-header-text">
              <h3>{devis.client?.firstName} {devis.client?.lastName}</h3>
              <p className="devis-reference">Devis: {devis.reference}</p>
            </div>
          </div>
          <button className="close-chat-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="chat-messages">
          {loading ? (
            <div className="loading-messages">
              <Loader size={24} className="spinner" />
              <p>Chargement des messages...</p>
            </div>
          ) : error ? (
            <div className="error-messages">
              <AlertCircle size={24} />
              <p>{error}</p>
              <button onClick={fetchMessages} className="retry-btn">Réessayer</button>
            </div>
          ) : !Array.isArray(messages) || messages.length === 0 ? (
            <div className="no-messages">
              <p>Aucun message dans cette conversation. Commencez à discuter avec {devis.client?.firstName}.</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => {
                // Déterminer si le message a été envoyé par le commercial connecté
                const isCommercial = msg.senderId === commercialId;
                
                return (
                  <div 
                    key={msg.id || index} 
                    className={`message ${isCommercial ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">
                      <p>{msg.content}</p>
                      <span className="message-time">
                        {formatDate(msg.timestamp)}
                        {isCommercial && (
                          <span className="message-status">
                            {msg.read ? (
                              <span className="read-status">
                                <CheckCircle size={12} />
                              </span>
                            ) : (
                              <span className="sent-status">
                                <CheckCircle size={12} opacity={0.5} />
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        <div className="chat-input-container">
          <textarea
            className="message-input"
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
            disabled={sending || !newMessage.trim()}
          >
            {sending ? <Loader size={16} className="spinner" /> : <Send size={16} />}
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
  const [clientInfo, setClientInfo] = useState(null);
  const [savingPrices, setSavingPrices] = useState(false);
  const [remises, setRemises] = useState({});  // État pour stocker les remises par produit

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
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Session expirée. Veuillez vous reconnecter.");
          return;
        }

        // Récupérer les produits du devis
        const produitsResponse = await axios.get(`http://localhost:8080/api/devis/${devis.id}/items`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // Récupérer les informations du client
        const clientResponse = await axios.get(`http://localhost:8080/api/devis/${devis.id}/client`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (produitsResponse.data) {
          const produitsData = produitsResponse.data;
          setProduits(produitsData);
          
          // Initialiser les remises à 0% pour chaque produit
          const remisesInitiales = {};
          produitsData.forEach(produit => {
            remisesInitiales[produit.id] = 0;
          });
          setRemises(remisesInitiales);
          
          // Calculer le prix total
          calculateTotal(produitsData, remisesInitiales);
        }

        if (clientResponse.data) {
          setClientInfo(clientResponse.data);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération des données:', err);
        setError("Impossible de charger les données du devis");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [devis.id]);

  const calculateTotal = (items, remisesObj) => {
    const total = items.reduce((sum, item) => {
      const prix = item.prix !== null ? item.prix : 0;
      const quantity = item.quantity || 0;
      const remise = remisesObj[item.id] || 0;
      
      // Calculer le prix après remise
      const prixApresRemise = prix * (1 - remise / 100);
      
      return sum + (prixApresRemise * quantity);
    }, 0);
    setTotalPrice(total);
  };

  const handlePriceChange = (id, newPrice) => {
    // Vérifier que le prix est un nombre valide ou zéro
    const parsedPrice = newPrice === '' ? 0 : parseFloat(newPrice);
    
    const updatedProduits = produits.map(produit => {
      if (produit.id === id) {
        return { ...produit, prix: parsedPrice };
      }
      return produit;
    });

    setProduits(updatedProduits);
    calculateTotal(updatedProduits, remises);
  };

  // Fonction pour gérer les changements de remise
  const handleRemiseChange = (id, newRemise) => {
    // Vérifier que la remise est un nombre valide entre 0 et 100
    let parsedRemise = newRemise === '' ? 0 : parseFloat(newRemise);
    parsedRemise = Math.min(Math.max(parsedRemise, 0), 100); // Limiter entre 0 et 100
    
    const updatedRemises = {
      ...remises,
      [id]: parsedRemise
    };
    
    setRemises(updatedRemises);
    calculateTotal(produits, updatedRemises);
  };

  // Fonction pour calculer le prix après remise
  const getPrixApresRemise = (produit) => {
    const prix = produit.prix !== null ? produit.prix : 0;
    const remise = remises[produit.id] || 0;
    return prix * (1 - remise / 100);
  };

  const formatNumber = (number) => {
    if (number === null || isNaN(number)) {
      return "0";
    }
    return new Intl.NumberFormat('fr-MA').format(number);
  };

  const formatTotalPrice = (price) => {
    if (price === null || isNaN(price)) {
      return "0 MAD";
    }
    return new Intl.NumberFormat('fr-MA').format(price) + " MAD";
  };

  // Fonction pour sauvegarder les modifications de prix et remises
  const handleSavePrices = async () => {
    try {
      setSavingPrices(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      // Préparer les données à envoyer
      const itemPrices = {};
      const itemDiscounts = {};
      
      produits.forEach(produit => {
        itemPrices[produit.id] = produit.prix;
        itemDiscounts[produit.id] = remises[produit.id] || 0;
      });

      // Envoyer la requête POST pour mettre à jour les prix et remises
      await axios.post(
        `http://localhost:8080/api/devis/${devis.id}/update-prices`,
        {
          itemPrices: itemPrices,
          itemDiscounts: itemDiscounts,
          total: totalPrice
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // Informer l'utilisateur et fermer le modal
      alert('Prix et remises mis à jour avec succès');
      onUpdate(); // Rafraîchir la liste des devis
      onClose(); // Fermer le modal
    } catch (err) {
      console.error('Erreur lors de la mise à jour des prix:', err);
      setError("Impossible de mettre à jour les prix: " + (err.response?.data || err.message));
    } finally {
      setSavingPrices(false);
    }
  };

  return (
    <div className="prix-modal">
      <div className="prix-modal-content">
        <div className="prix-modal-header">
          <h3>Détails du devis: {devis.reference}</h3>
          <button className="close-modal-btn" onClick={onClose}>×</button>
        </div>

        {/* Informations du client */}
        {clientInfo && (
          <div className="client-info-section">
            <h4>
              <User size={20} /> 
              Informations Client
            </h4>
            <div className="client-info-grid">
              <div className="client-info-item">
                <span className="client-info-label">Nom complet</span>
                <span className="client-info-value">{clientInfo.firstName} {clientInfo.lastName}</span>
              </div>
              <div className="client-info-item">
                <span className="client-info-label">Email</span>
                <span className="client-info-value">{clientInfo.email || 'Non spécifié'}</span>
              </div>
              <div className="client-info-item">
                <span className="client-info-label">Téléphone</span>
                <span className="client-info-value">{clientInfo.phone || 'Non spécifié'}</span>
              </div>
            </div>
          </div>
        )}

        <div className="devis-info-section">
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
                    <th>Remise (%)</th>
                    <th>Prix après remise</th>
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
                      <td>
                        <input 
                          type="text" 
                          className="price-input" 
                          value={produit.prix === null || produit.prix === 0 ? '0' : produit.prix} 
                          onChange={(e) => handlePriceChange(produit.id, e.target.value)}
                        />
                      </td>
                      <td className="remise-cell">
                        <input 
                          type="number" 
                          className="remise-input" 
                          value={remises[produit.id] || 0} 
                          onChange={(e) => handleRemiseChange(produit.id, e.target.value)}
                          min="0"
                          max="100"
                        />
                      </td>
                      <td className="prix-remise">
                        {formatNumber(getPrixApresRemise(produit))}
                      </td>
                      <td>{produit.quantity || 0}</td>
                      <td>{formatNumber(getPrixApresRemise(produit) * produit.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6" className="total-label">Total</td>
                    <td className="total-value">{formatTotalPrice(totalPrice)}</td>
                  </tr>
                </tfoot>
              </table>
              
              {/* Section de calcul global */}
              <div className="calcul-global-section">
                <h4 className="calcul-global-title">Calcul Global</h4>
                <div className="calcul-global-grid">
                  <div className="calcul-item">
                    <span className="calcul-label">Sous-total HT</span>
                    <span className="calcul-value">{formatTotalPrice(totalPrice)}</span>
                  </div>
                  <div className="calcul-item">
                    <span className="calcul-label">TVA (20%)</span>
                    <span className="calcul-value">{formatTotalPrice(totalPrice * 0.2)}</span>
                  </div>
                  <div className="calcul-item">
                    <span className="calcul-label">Frais de livraison</span>
                    <span className="calcul-value">{formatTotalPrice(0)}</span>
                  </div>
                  <div className="calcul-item">
                    <span className="calcul-label">Remise globale</span>
                    <span className="calcul-value">{formatTotalPrice(0)}</span>
                  </div>
                  <div className="calcul-total">
                    <span className="calcul-total-label">Total TTC</span>
                    <span className="calcul-total-value">{formatTotalPrice(totalPrice * 1.2)}</span>
                  </div>
                </div>
              </div>
              
              {/* Boutons d'action */}
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Annuler
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleSavePrices}
                  disabled={savingPrices}
                >
                  {savingPrices ? (
                    <>
                      <Loader size={16} className="spinner" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Enregistrer les modifications
                    </>
                  )}
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
