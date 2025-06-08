import React, { useState, useEffect, useRef } from 'react';
import { FileUp, Send, AlertCircle, CheckCircle, Loader, MessageCircle, User, Phone, Mail } from 'lucide-react';
import axios from 'axios';
import './DemandeDevis.css';
import NewDevisForm from './NewDevisForm';
import { Eye } from 'lucide-react';

const getCurrentUser = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const token = localStorage.getItem('token');
  
  if (!user || !token) {
    return null;
  }
  return user;
};

const DemandeDevis = () => {
  const [userData, setUserData] = useState(null);
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDevis, setActiveDevis] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCommercialDetails, setShowCommercialDetails] = useState(false);
  const [selectedCommercial, setSelectedCommercial] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);
  const [showNewDevisForm, setShowNewDevisForm] = useState(false);
  const [showCartDetails, setShowCartDetails] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserData(user);
      fetchDevisList();
    } else {
      setError("Utilisateur non connecté. Veuillez vous reconnecter.");
      setLoading(false);
    }
  }, []);

  const fetchDevisList = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const user = getCurrentUser();
    
    try {
      const response = await axios({
        method: 'get',
        url: `http://localhost:8080/api/devis/client/${user.id}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const formattedDevis = response.data.map(devis => ({
        id: devis.id,
        title: devis.cart ? `Devis pour ${devis.cart.name}` : 'Sans titre',
        reference: devis.reference || `DEV-${devis.id}`,
        status: devis.status || 'EN_ATTENTE',
        createdAt: devis.createdAt,
        updatedAt: devis.updatedAt,
        paymentMethod: devis.paymentMethod || 'Non spécifié',
        commentaire: devis.commentaire || '',
        totale: devis.totale || 0,
        commercial: devis.commercial ? {
          id: devis.commercial.id,
          firstName: devis.commercial.firstName || '',
          lastName: devis.commercial.lastName || '',
          email: devis.commercial.email || '',
          phone: devis.commercial.phone || '',
          employeeCode: devis.commercial.employeeCode || '',
          imageUrl: devis.commercial.imageUrl || null
        } : null
      }));
      
      setDevisList(formattedDevis);
    } catch (err) {
      console.error('Erreur lors de la récupération des devis:', err);
      setError("Une erreur s'est produite lors de la récupération des devis.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (devisId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/messages/devis/${devisId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setMessages(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
      setMessages([]);
    }
  };

  const handleViewCart = async (devis) => {
    setLoadingCart(true);
    setSelectedDevis(devis);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/devis/${devis.id}/itemss`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Dans la fonction handleViewCart
      const itemsWithCorrectImagePaths = response.data.map(item => ({
        ...item,
        imageUrl: item.imageUrl 
          ? require(`../../assets/products/${item.imageUrl}`)
          : require('../../assets/no-image.png')
      }));
      
      setCartItems(itemsWithCorrectImagePaths);
      setShowCartDetails(true);
    } catch (err) {
      console.error('Erreur lors du chargement des détails du devis:', err);
      setError("Une erreur s'est produite lors du chargement des détails du devis.");
    } finally {
      setLoadingCart(false);
    }
  };

  const handleOpenChat = async (devis) => {
    setActiveDevis(devis);
    setShowChat(true);
    await fetchMessages(devis.id);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/messages/devis/${devis.id}/read`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (err) {
      console.error('Erreur lors du marquage des messages comme lus:', err);
    }
  };

  const handleCloseChat = () => {
    setShowChat(false);
    setActiveDevis(null);
    setMessages([]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeDevis) return;
    
    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/messages', {
        devisId: activeDevis.id,
        content: newMessage,
        senderId: userData.id,
        recipientId: activeDevis.commercial.id
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      const newMsg = {
        id: Date.now(),
        devisId: activeDevis.id,
        senderId: userData?.id,
        senderName: userData?.username,
        recipientId: activeDevis.commercial.id,
        content: newMessage,
        timestamp: new Date().toISOString(),
        read: false
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleViewCommercialDetails = (commercial) => {
    if (!commercial) {
      setError("Aucun commercial n'est assigné à ce devis");
      return;
    }
    setSelectedCommercial(commercial);
    setShowCommercialDetails(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date non disponible';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  };

  const getUnreadMessagesCount = (devis) => {
    return devis.unreadMessages || 0;
  };

  const handleCreateNewDevis = () => {
    setShowNewDevisForm(true);
  };

  const handleCloseNewDevisForm = () => {
    setShowNewDevisForm(false);
  };

  const handleDevisCreated = (newDevis) => {
    setShowNewDevisForm(false);
    setDevisList([newDevis, ...devisList]);
  };

  return (
    <div className="devis-container">
      <header className="devis-header">
        <h2>Demandes de Devis</h2>
      </header>
      
      <div className="devis-content">
        {showNewDevisForm ? (
          <NewDevisForm 
            onClose={handleCloseNewDevisForm} 
            onSuccess={handleDevisCreated} 
          />
        ) : loading ? (
          <div className="loading-state">
            <Loader className="spinner" size={32} />
            <p>Chargement de vos demandes de devis...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button onClick={fetchDevisList} className="retry-btn">Réessayer</button>
          </div>
        ) : (
          <div className="devis-list-container">
            {devisList.length === 0 ? (
              <div className="empty-state">
                <p>Vous n'avez pas encore effectué de demande de devis.</p>
                <button className="create-devis-btn" onClick={handleCreateNewDevis}>
                  Créer votre première demande
                </button>
              </div>
            ) : (
              <div className="devis-list">
                {devisList.map((devis) => (
                  <div key={devis.id} className="devis-card">
                    <div className="devis-card-header">
                      <h3>{devis.title}</h3>
                      <span className={`status-badge ${devis.status.toLowerCase().replace('é', 'e')}`}>
                        {devis.status === 'EN_ATTENTE' ? 'En attente' : 
                         devis.status === 'EN_COURS' ? 'En cours' : 
                         devis.status === 'TERMINÉ' ? 'Terminé' : devis.status}
                      </span>
                    </div>
                    
                    <div className="devis-card-info">
                      <p className="devis-reference">Référence: {devis.reference}</p>
                      <p className="devis-date">Créé le: {formatDate(devis.createdAt)}</p>
                      <p className="devis-payment">Mode de paiement: {devis.paymentMethod}</p>
                      {devis.totale > 0 && (
                        <p className="devis-total">{devis.totale.toFixed(2)} MAD</p>
                      )}
                      {devis.commentaire && (
                        <p className="devis-comment">Commentaire: {devis.commentaire}</p>
                      )}
                    </div>
                    
                    <div className="devis-card-commercial">
                      <p className="commercial-info">
                        <span>Commercial assigné:</span> 
                        {devis.commercial ? 
                          `${devis.commercial.firstName} ${devis.commercial.lastName}` : 
                          'Non assigné'
                        }
                      </p>
                    </div>
                    
                    <div className="devis-card-actions">
                      <button 
                        className="view-commercial-btn"
                        onClick={() => handleViewCommercialDetails(devis.commercial)}
                        disabled={!devis.commercial}
                      >
                        <User size={16} />
                        {devis.commercial ? 'Voir profil' : 'Pas de commercial'}
                      </button>
                      
                      <button 
                        className="view-cart-btn"
                        onClick={() => handleViewCart(devis)}
                      >
                        <Eye className="icon" size={16} />
                        <span>Détails du devis</span>
                      </button>
                      
                      <button 
                        className="chat-btn"
                        onClick={() => handleOpenChat(devis)}
                        disabled={!devis.commercial}
                      >
                        <MessageCircle size={16} />
                        Contacter
                        {getUnreadMessagesCount(devis) > 0 && (
                          <span className="unread-badge">{getUnreadMessagesCount(devis)}</span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Chat Modal */}
      {showChat && activeDevis && (
        <div className="chat-modal">
          <div className="chat-container">
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  {activeDevis.commercial?.imageUrl ? (
                    <img 
                      src={`http://localhost:8080/api/commercials/images/${activeDevis.commercial.imageUrl}`}
                      alt={`${activeDevis.commercial.firstName} ${activeDevis.commercial.lastName}`}
                      className="commercial-avatar-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        const parent = e.target.parentElement;
                        parent.textContent = `${activeDevis.commercial.firstName.charAt(0)}${activeDevis.commercial.lastName.charAt(0)}`;
                      }}
                    />
                  ) : (
                    `${activeDevis.commercial?.firstName?.charAt(0)}${activeDevis.commercial?.lastName?.charAt(0)}`
                  )}
                </div>
                <div className="chat-header-text">
                  <h3>
                    {activeDevis.commercial ? 
                      `${activeDevis.commercial.firstName} ${activeDevis.commercial.lastName}` :
                      'Commercial non assigné'
                    }
                  </h3>
                  <p>Devis: {activeDevis.reference}</p>
                </div>
              </div>
              <button className="close-chat-btn" onClick={handleCloseChat}>×</button>
            </div>
            
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="no-messages">
                  <p>Commencez la conversation avec {activeDevis.commercial?.firstName}.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.senderId === userData?.id ? 'sent' : 'received'}`}
                  >
                    {msg.senderId !== userData?.id && (
                      <div className="message-avatar">
                        {activeDevis.commercial?.imageUrl ? (
                          <img 
                            src={`http://localhost:8080/api/commercials/images/${activeDevis.commercial.imageUrl}`}
                            alt={msg.senderName || activeDevis.commercial.firstName}
                            className="message-avatar-img"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              const parent = e.target.parentElement;
                              parent.textContent = msg.senderName?.charAt(0) || activeDevis.commercial.firstName.charAt(0);
                            }}
                          />
                        ) : (
                          msg.senderName?.charAt(0) || activeDevis.commercial.firstName.charAt(0)
                        )}
                      </div>
                    )}
                    <div className="message-content">
                      <p>{msg.content}</p>
                      <span className="message-time">
                        {formatDate(msg.timestamp)}
                      </span>
                      {msg.senderId === userData?.id && (
                        <span className="message-status">
                          {msg.read ? <CheckCircle size={12} /> : <CheckCircle size={12} opacity={0.5} />}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez votre message ici..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button 
                className="send-message-btn"
                onClick={handleSendMessage}
                disabled={sendingMessage || !newMessage.trim()}
              >
                {sendingMessage ? <Loader size={18} className="spinner" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Commercial Details Modal */}
      {showCommercialDetails && selectedCommercial && (
        <div className="commercial-details-modal">
          <div className="commercial-details-container">
            <button 
              className="close-details-btn"
              onClick={() => setShowCommercialDetails(false)}
            >
              ×
            </button>
            
            <div className="commercial-profile">
              <div className="commercial-image">
                {selectedCommercial.imageUrl ? (
                  <img 
                    src={`http://localhost:8080/api/commercials/images/${selectedCommercial.imageUrl}`}
                    alt={`${selectedCommercial.firstName} ${selectedCommercial.lastName}`}
                    className="commercial-profile-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      parent.textContent = `${selectedCommercial.firstName.charAt(0)}${selectedCommercial.lastName.charAt(0)}`;
                    }}
                  />
                ) : (
                  `${selectedCommercial.firstName.charAt(0)}${selectedCommercial.lastName.charAt(0)}`
                )}
              </div>
              
              <h3 className="commercial-name">
                {`${selectedCommercial.firstName} ${selectedCommercial.lastName}`}
              </h3>
              <p className="commercial-title">Commercial SOFIMED</p>
              
              <div className="commercial-contact-info">
                <div className="contact-item">
                  <Mail size={16} />
                  <span>{selectedCommercial.email}</span>
                </div>
                <div className="contact-item">
                  <Phone size={16} />
                  <span>{selectedCommercial.phone}</span>
                </div>
                <div className="contact-item">
                  <User size={16} />
                  <span>Code: {selectedCommercial.employeeCode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Cart Details Modal */}
      {showCartDetails && selectedDevis && (
        <div className="devis-details-modall">
          <div className="devis-details-containerr">
            <div className="devis-details-headerr">
              <div className="devis-details-titlee">
                <img className="product-imagee" src={require('../../assets/logosofi1.png')} alt="SOFIMED Logo" />
                <div>
                  <h3>Détails du devis {selectedDevis.reference}</h3>
                  <p className="devis-details-datee">Date: {formatDate(selectedDevis.createdAt)}</p>
                </div>
              </div>
              <button className="close-details-btnn" onClick={() => setShowCartDetails(false)}>×</button>
            </div>
            
            {loadingCart ? (
              <div className="loading-state">
                <Loader className="spinner" size={32} />
                <p>Chargement des détails...</p>
              </div>
            ) : (
              <div className="cart-items-listt">
                {cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <div key={item.id} className="cart-itemm">
                      <div className="cart-item-imagee">
                        {item.imageUrl && (
                          <img 
                            src={item.imageUrl}
                            alt={item.nom}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = require('../../assets/no-image.png');
                            }}
                          />
                        )}
                      </div>
                      <div className="cart-item-detailss">
                        <h4>{item.nom}</h4>
                        <p className="item-referencee">Réf: {item.reference}</p>
                        {item.categorie && (
                          <p className="item-categoryy">Catégorie: {item.categorie.nom}</p>
                        )}
                        <div className="item-pricingg">
                          <p className="item-quantityy">Quantité: {item.quantity}</p>
                          <p className="item-pricee">Prix unitaire: {item.prixUnitaire?.toFixed(2) || '0.00'} MAD</p>
                          <p className="item-discountt">Remise: {item.remisePourcentage || 0}% ({(item.remiseMontant || 0).toFixed(2)} MAD)</p>
                          <p className="item-totall">Total: {(item.totalItem || 0).toFixed(2)} MAD</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-cart">
                    <p>Aucun article trouvé dans ce devis</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandeDevis;