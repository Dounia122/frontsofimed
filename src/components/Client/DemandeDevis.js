import React, { useState, useEffect, useRef } from 'react';
import { FileUp, Send, AlertCircle, CheckCircle, Loader, MessageCircle, User, Phone, Mail, Calendar } from 'lucide-react';
import axios from 'axios';
import './DemandeDevis.css';
import NewDevisForm from './NewDevisForm';

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

  useEffect(() => {
    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserData(user);
    }
    
    // For development, use mock data directly
    setDevisList(mockDevisList);
    setLoading(false);
    
    // Comment out the API call for now
    // fetchDevisList();
  }, []);

  useEffect(() => {
    // Scroll to bottom of messages when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchDevisList = async () => {
    setLoading(true);
    // Move user declaration outside of try block so it's accessible in the catch block
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.id) {
      setError("Utilisateur non connecté. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }
    
    try {
      console.log("Fetching devis for user ID:", user.id);
      console.log("Using token:", token ? "Token exists" : "No token found");
      
      // Make sure we're using the correct endpoint format and properly sending the token
      const response = await axios({
        method: 'get',
        url: `http://localhost:8080/api/devis/user/${user.id}`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log("API Response:", response.data);
      
      if (Array.isArray(response.data)) {
        setDevisList(response.data);
        setError('');
      } else {
        console.error("Response is not an array:", response.data);
        setError("Format de réponse incorrect");
        // Fallback to mock data
        setDevisList(mockDevisList);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des devis:', err);
      
      // Handle authentication errors
      if (err.response) {
        console.log("Error response status:", err.response.status);
        console.log("Error response data:", err.response.data);
        
        if (err.response.status === 401) {
          setError("Session expirée. Veuillez vous reconnecter.");
          // Force user to re-login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (err.response.status === 403) {
          setError("Accès refusé. Vous n'avez pas les permissions nécessaires pour accéder à ces données. Veuillez vous reconnecter ou contacter l'administrateur.");
        } else {
          const errorMessage = err.response.data.message || 'Impossible de charger vos demandes de devis';
          setError(`Erreur ${err.response.status}: ${errorMessage}`);
        }
      } else if (err.request) {
        // Request was made but no response received
        setError("Le serveur ne répond pas. Veuillez réessayer plus tard.");
      } else {
        // Something else caused the error
        setError("Une erreur s'est produite lors de la récupération des données.");
      }
      
      // Use mock data as fallback for development
      console.log("Using mock data as fallback");
      setDevisList(mockDevisList);
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
    setSelectedCommercial(commercial);
    setShowCommercialDetails(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
        <div className="header-actions">
          {/* Removed the refresh button */}
          <button className="new-devis-btn" onClick={handleCreateNewDevis}>
            + Nouvelle demande
          </button>
        </div>
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
                      {devis.updatedAt !== devis.createdAt && (
                        <p className="devis-date">Mis à jour le: {formatDate(devis.updatedAt)}</p>
                      )}
                    </div>
                    
                    <div className="devis-card-commercial">
                      <p className="commercial-info">
                        <span>Commercial assigné:</span> {devis.commercial.firstName} {devis.commercial.lastName}
                      </p>
                    </div>
                    
                    <div className="devis-card-actions">
                      <button 
                        className="view-commercial-btn"
                        onClick={() => handleViewCommercialDetails(devis.commercial)}
                      >
                        <User size={16} />
                        Voir le profil
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
                  {activeDevis.commercial.firstName.charAt(0)}{activeDevis.commercial.lastName.charAt(0)}
                </div>
                <div className="chat-header-text">
                  <h3>{activeDevis.commercial.firstName} {activeDevis.commercial.lastName}</h3>
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
                        {msg.senderName?.charAt(0) || activeDevis.commercial.firstName.charAt(0)}
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
              <div className="commercial-avatar">
                {selectedCommercial.firstName.charAt(0)}{selectedCommercial.lastName.charAt(0)}
              </div>
              
              <h3 className="commercial-name">
                {selectedCommercial.firstName} {selectedCommercial.lastName}
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
              
              <button 
                className="contact-commercial-btn"
                onClick={() => {
                  setShowCommercialDetails(false);
                  // Find the devis associated with this commercial
                  const devis = devisList.find(d => d.commercial.id === selectedCommercial.id);
                  if (devis) {
                    handleOpenChat(devis);
                  }
                }}
              >
                <MessageCircle size={18} />
                Contacter par message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemandeDevis;