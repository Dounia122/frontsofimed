import React, { useState, useEffect, useRef } from 'react';
import { FileUp, Send, AlertCircle, CheckCircle, Loader, MessageCircle, User, Phone, Mail, Calendar } from 'lucide-react';
import axios from 'axios';
import './DemandeDevis.css';
import NewDevisForm from './NewDevisForm';

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

  // Supprimer ou commenter le premier useEffect qui charge les données mockées
  // useEffect(() => {
  //   const user = JSON.parse(localStorage.getItem('user'));
  //   if (user) {
  //     setUserData(user);
  //   }
    
  //   setDevisList(mockDevisList);
  //   setLoading(false);
  // }, []);

  useEffect(() => {
    // Scroll to bottom of messages when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    console.log('DemandeDevis.js - useEffect initial');
    const user = getCurrentUser();
    if (user) {
      console.log('DemandeDevis.js - Utilisateur trouvé:', user);
      setUserData(user);
      fetchDevisList();
    } else {
      console.log('DemandeDevis.js - Aucun utilisateur trouvé');
      setError("Utilisateur non connecté. Veuillez vous reconnecter.");
      setLoading(false);
    }
  }, []);

  const fetchDevisList = async () => {
    console.log('DemandeDevis.js - Début fetchDevisList');
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');
    const user = getCurrentUser();
    
    try {
      console.log('DemandeDevis.js - Tentative de récupération des devis pour userId:', user.id);
      const response = await axios({
        method: 'get',
        url: `http://localhost:8080/api/devis/client/${user.id}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('DemandeDevis.js - Réponse reçue:', response.data);
      
      if (!response.data || response.data.length === 0) {
        console.log('DemandeDevis.js - Aucun devis trouvé');
        setDevisList([]);
        return;
      }
      
      const formattedDevis = response.data.map(devis => {
        // Ajout du log pour l'imageUrl du commercial
        if (devis.commercial && devis.commercial.imageUrl) {
          console.log('Image URL du commercial:', devis.commercial.imageUrl);
          console.log('Nom du commercial:', devis.commercial.firstName, devis.commercial.lastName);
        }
        
        return ({
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
        });
      });
      
      console.log('DemandeDevis.js - Devis formatés:', formattedDevis);
      setDevisList(formattedDevis);
      setError('');
    } catch (err) {
      console.error('DemandeDevis.js - Erreur détaillée:', err);
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
      // Use mock messages as fallback for development
      setMessages(mockMessages.filter(msg => msg.devisId === devisId));
    }
  };

  const handleOpenChat = async (devis) => {
    setActiveDevis(devis);
    setShowChat(true);
    await fetchMessages(devis.id);
    
    // Mark messages as read
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
      
      // Add new message to the list
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
      
      // For development: add message locally if API fails
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
        console.warn('Invalid date string received:', dateString);
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
    // Add the new devis to the list
    setDevisList([newDevis, ...devisList]);
  };

  // Mock data for demonstration
  const mockDevisList = [
    {
      id: 1,
      reference: 'DEV-2023-001',
      title: 'Demande de devis pour pompes industrielles',
      status: 'EN_ATTENTE',
      createdAt: '2023-11-15T10:30:00',
      updatedAt: '2023-11-15T10:30:00',
      unreadMessages: 2,
      commercial: {
        id: 101,
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 'sophie.martin@sofimed.com',
        phone: '+212 6 12 34 56 78',
        employeeCode: 'COM-2023-101'
      }
    },
    {
      id: 2,
      reference: 'DEV-2023-002',
      title: 'Devis pour équipement médical',
      status: 'EN_COURS',
      createdAt: '2023-11-10T14:45:00',
      updatedAt: '2023-11-12T09:15:00',
      unreadMessages: 0,
      commercial: {
        id: 102,
        firstName: 'Thomas',
        lastName: 'Dubois',
        email: 'thomas.dubois@sofimed.com',
        phone: '+212 6 23 45 67 89',
        employeeCode: 'COM-2023-102'
      }
    },
    {
      id: 3,
      reference: 'DEV-2023-003',
      title: 'Devis pour valves et raccords',
      status: 'TERMINÉ',
      createdAt: '2023-11-05T11:20:00',
      updatedAt: '2023-11-08T16:30:00',
      unreadMessages: 0,
      commercial: {
        id: 103,
        firstName: 'Amina',
        lastName: 'Benali',
        email: 'amina.benali@sofimed.com',
        phone: '+212 6 34 56 78 90',
        employeeCode: 'COM-2023-103'
      }
    }
  ];

  // Mock messages for demonstration
  const mockMessages = [
    {
      id: 1,
      devisId: 1,
      senderId: 101,
      senderName: 'Sophie Martin',
      recipientId: userData?.id,
      content: 'Bonjour, j\'ai bien reçu votre demande de devis pour les pompes industrielles. Pouvez-vous me préciser les spécifications techniques dont vous avez besoin?',
      timestamp: '2023-11-15T11:30:00',
      read: true
    },
    {
      id: 2,
      devisId: 1,
      senderId: userData?.id,
      senderName: userData?.username,
      recipientId: 101,
      content: 'Bonjour Sophie, merci pour votre réponse rapide. Nous recherchons des pompes avec un débit de 500L/min et une pression de 10 bars.',
      timestamp: '2023-11-15T11:45:00',
      read: true
    },
    {
      id: 3,
      devisId: 1,
      senderId: 101,
      senderName: 'Sophie Martin',
      recipientId: userData?.id,
      content: 'Parfait, je vais préparer un devis avec plusieurs options qui correspondent à vos besoins. Avez-vous une préférence pour la marque?',
      timestamp: '2023-11-15T12:00:00',
      read: false
    }
  ];

  return (
    <div className="devis-container">
      <header className="devis-header">
        <h2>Demandes de Devis</h2>
        {/* Supprimer le bouton Nouvelle demande */}
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
                        <p className="devis-total">Total: {devis.totale.toFixed(2)} €</p>
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
                        className="chat-btn"
                        onClick={() => handleOpenChat(devis)}
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
      
      {/* Chat Modal - Messenger-like interface */}
      {showChat && activeDevis && (
        <div className="chat-modal">
          <div className="chat-container">
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-header-avatar">
                  {activeDevis.commercial && activeDevis.commercial.imageUrl ? (
                    <img 
                      src={require(`../Commercial/photo/${activeDevis.commercial.imageUrl}`)}
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
                    `${activeDevis.commercial.firstName.charAt(0)}${activeDevis.commercial.lastName.charAt(0)}`
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
                  <p>Commencez la conversation avec {activeDevis.commercial.firstName}.</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`message ${msg.senderId === userData?.id ? 'sent' : 'received'}`}
                  >
                    {msg.senderId !== userData?.id && (
                      <div className="message-avatar">
                        {activeDevis.commercial && activeDevis.commercial.imageUrl ? (
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
                    src={require(`../Commercial/photo/${selectedCommercial.imageUrl}`)}
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
    </div>
  );
};

const CommercialDetails = ({ commercial, onClose }) => {
  return (
    <div className="commercial-details-modal">
      <div className="commercial-details-container">
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="commercial-info">
          {commercial.imageUrl ? (
            <img 
              src={require(`../Commercial/photo/${commercial.imageUrl}`)} 
              alt={`${commercial.firstName} ${commercial.lastName}`}
              className="commercial-avatar"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `${commercial.firstName.charAt(0)}${commercial.lastName.charAt(0)}`;
              }}
            />
          ) : (
            <div className="commercial-initials">
              {commercial.firstName.charAt(0)}{commercial.lastName.charAt(0)}
            </div>
          )}
          <h3>{commercial.firstName} {commercial.lastName}</h3>
          <p className="commercial-role">Commercial SOFIMED</p>
          
          <div className="contact-details">
            <div className="contact-item">
              <Phone size={16} />
              <span>{commercial.phone}</span>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <span>{commercial.email}</span>
            </div>
            <div className="contact-item">
              <User size={16} />
              <span>Code: {commercial.employeeCode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemandeDevis;
