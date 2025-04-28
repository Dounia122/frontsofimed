import React, { useState, useEffect } from 'react';
import { FileUp, Send, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import axios from 'axios';
import './DemandeConsultation.css';

const DemandeConsultation = () => {
  const [userData, setUserData] = useState(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      setUserData(user);
    }
    
    // Fetch previous consultations
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/consultations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setConsultations(response.data);
    } catch (err) {
      console.error('Erreur lors du chargement des consultations:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file size (limit to 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Le fichier est trop volumineux. Taille maximale: 5MB');
        return;
      }
      
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      setError('Veuillez saisir un sujet pour votre demande');
      return;
    }
    
    if (!message.trim()) {
      setError('Veuillez saisir un message pour votre demande');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('message', message);
      if (file) {
        formData.append('file', file);
      }
      
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/consultations', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess(true);
      setSubject('');
      setMessage('');
      setFile(null);
      setFileName('');
      
      // Refresh consultations list
      fetchConsultations();
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Erreur lors de l\'envoi de la demande:', err);
      setError('Une erreur est survenue lors de l\'envoi de votre demande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="consultation-container">
      <header className="consultation-header">
        <h2>Demande de Consultation</h2>
      </header>
      
      <div className="consultation-content">
        <div className="consultation-form-container">
          <h3>Nouvelle demande</h3>
          
          {success && (
            <div className="success-message">
              <CheckCircle size={20} />
              <span>Votre demande a été envoyée avec succès!</span>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="consultation-form">
            <div className="form-group">
              <label htmlFor="subject">Sujet</label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Demande d'information sur les pompes industrielles"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Décrivez votre demande en détail..."
                rows={6}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="file">Pièce jointe (optionnel)</label>
              <div className="file-upload-container">
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  className="file-input"
                  disabled={loading}
                />
                <div className="file-upload-button">
                  <FileUp size={18} />
                  <span>Choisir un fichier</span>
                </div>
                {fileName && (
                  <div className="file-name">
                    {fileName}
                  </div>
                )}
              </div>
              <p className="file-info">Formats acceptés: PDF, DOCX, XLSX, JPG, PNG (Max: 5MB)</p>
            </div>
            
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={18} className="spinner" />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Envoyer la demande</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="previous-consultations">
          <h3>Mes demandes précédentes</h3>
          
          {consultations.length === 0 ? (
            <div className="empty-consultations">
              <p>Vous n'avez pas encore effectué de demande de consultation.</p>
            </div>
          ) : (
            <div className="consultations-list">
              {consultations.map((consultation) => (
                <div key={consultation.id} className="consultation-card">
                  <div className="consultation-header">
                    <h4>{consultation.subject}</h4>
                    <span className={`status ${consultation.status.toLowerCase()}`}>
                      {consultation.status === 'PENDING' ? 'En attente' : 
                       consultation.status === 'IN_PROGRESS' ? 'En traitement' : 
                       consultation.status === 'COMPLETED' ? 'Complétée' : 'Fermée'}
                    </span>
                  </div>
                  
                  <div className="consultation-meta">
                    <span className="date">Créée le {formatDate(consultation.createdAt)}</span>
                    {consultation.updatedAt !== consultation.createdAt && (
                      <span className="date">Mise à jour le {formatDate(consultation.updatedAt)}</span>
                    )}
                  </div>
                  
                  <p className="consultation-message">{consultation.message}</p>
                  
                  {consultation.fileUrl && (
                    <a 
                      href={`http://localhost:8080/api/consultations/files/${consultation.id}`}
                      className="attachment-link"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileUp size={16} />
                      <span>Pièce jointe</span>
                    </a>
                  )}
                  
                  {consultation.response && (
                    <div className="consultation-response">
                      <h5>Réponse de notre équipe:</h5>
                      <p>{consultation.response}</p>
                      <span className="response-date">
                        Répondu le {formatDate(consultation.responseDate)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DemandeConsultation;