import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, CheckCircle, Loader, MessageCircle, FileUp, Download } from 'lucide-react';
import axios from 'axios';
import './CommercialChat.css';

const CommercialChat = () => {
  const [userData, setUserData] = useState(null);
  const [devisList, setDevisList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDevis, setActiveDevis] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserData(user);
      fetchDevisList(user.id);
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchDevisList = async (commercialId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`http://localhost:8080/api/devis/commercial/${commercialId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDevisList(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Erreur lors du chargement des devis";
      setError(errorMessage);
      console.error("Détails de l'erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (devisId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/messages/devis/${devisId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setMessages(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des messages:', err);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !activeDevis) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('devisId', activeDevis.id);
      formData.append('content', newMessage);
      formData.append('senderId', userData.id);
      formData.append('recipientId', activeDevis.client.id);
      
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      const response = await axios.post('http://localhost:8080/api/messages', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessages([...messages, response.data]);
      setNewMessage('');
      setSelectedFile(null);
    } catch (err) {
      console.error('Erreur lors de l\'envoi du message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleDownloadFile = async (filePath, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8080/api/messages/files/${filePath}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Erreur lors du téléchargement du fichier:', err);
    }
  };

  return (
    <div className="commercial-chat-container">
      <div className="devis-list-sidebar">
        <h2>Conversations</h2>
        {loading ? (
          <div className="loading-state">
            <Loader className="spinner" />
            <p>Chargement...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle />
            <p>{error}</p>
          </div>
        ) : (
          <div className="devis-list">
            {devisList.map((devis) => (
              <div
                key={devis.id}
                className={`devis-item ${activeDevis?.id === devis.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveDevis(devis);
                  fetchMessages(devis.id);
                }}
              >
                <div className="devis-item-header">
                  <h3>{devis.reference}</h3>
                  <span className={`status-badge ${devis.status.toLowerCase()}`}>
                    {devis.status}
                  </span>
                </div>
                <p className="client-name">{devis.client.firstName} {devis.client.lastName}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chat-main">
        {activeDevis ? (
          <>
            <div className="chat-header">
              <div>
                <h3>{activeDevis.reference}</h3>
                <p>{activeDevis.client.firstName} {activeDevis.client.lastName}</p>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.sender.id === userData?.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">
                    <p>{message.content}</p>
                    {message.fileName && (
                      <div className="file-attachment">
                        <span>{message.fileName}</span>
                        <button onClick={() => handleDownloadFile(message.filePath, message.fileName)}>
                          <Download size={16} />
                        </button>
                      </div>
                    )}
                    <span className="message-time">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                    {message.sender.id === userData?.id && (
                      <span className="message-status">
                        {message.read ? <CheckCircle size={12} /> : <CheckCircle size={12} opacity={0.5} />}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
              <div className="input-container">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <div className="input-actions">
                  <label className="file-input-label">
                    <FileUp size={20} />
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {selectedFile && (
                    <span className="selected-file">{selectedFile.name}</span>
                  )}
                  <button
                    className="send-button"
                    onClick={handleSendMessage}
                    disabled={sendingMessage || (!newMessage.trim() && !selectedFile)}
                  >
                    {sendingMessage ? <Loader className="spinner" /> : <Send />}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <MessageCircle size={48} />
            <p>Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommercialChat;