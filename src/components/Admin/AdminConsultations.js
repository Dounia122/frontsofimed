import React, { useState, useEffect } from 'react';
import './AdminConsultations.css';

const AdminConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalFileUrl, setModalFileUrl] = useState(null);
  const [modalFileName, setModalFileName] = useState('');
  const [selectedCommercial, setSelectedCommercial] = useState('');

  // Liste des commerciaux disponibles
  const commercials = [
    { id: 1, name: "Jean Dupont" },
    { id: 2, name: "Marie Martin" },
    { id: 3, name: "Pierre Durand" },
    { id: 4, name: "Sophie Lambert" }
  ];

  useEffect(() => {
    const fetchConsultations = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/consultations');
        if (!response.ok) throw new Error('Erreur lors du chargement des consultations');
        const data = await response.json();
        setConsultations(data);
      } catch (err) {
        console.error('Erreur :', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchConsultations();
  }, []);

  const openModal = (fileName) => {
    setModalFileUrl(`http://localhost:8080/uploads/${fileName}`);
    setModalFileName(fileName);
  };

  const closeModal = () => {
    setModalFileUrl(null);
    setModalFileName('');
  };

  const getFileExtension = (fileName) => fileName.split('.').pop().toLowerCase();

  const isImage = (fileName) => ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(getFileExtension(fileName));
  const isPDF = (fileName) => getFileExtension(fileName) === 'pdf';

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = consultation.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         consultation.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         consultation.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         consultation.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const getUserInitials = (name) => {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const handleAssignCommercial = (consultationId) => {
    if (!selectedCommercial) {
      alert('Veuillez sélectionner un commercial');
      return;
    }
    
    // Ici vous ajouteriez la logique pour affecter le commercial
    console.log(`Affectation du commercial ${selectedCommercial} à la consultation ${consultationId}`);
    
    // Exemple de mise à jour locale (à remplacer par un appel API en production)
    setConsultations(consultations.map(consultation => 
      consultation.id === consultationId 
        ? { ...consultation, assignedTo: selectedCommercial } 
        : consultation
    ));
    
    alert(`Commercial affecté avec succès à la consultation ${consultationId}`);
  };

  return (
    <div className="admin-consultations-container">
      <header className="admin-consultations-header">
        <h2>Gestion des Consultations</h2>
        <div className="filter-controls">
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="closed">Fermé</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Chargement des consultations...</p>
        </div>
      ) : error ? (
        <div className="empty-state">
          <p>Une erreur est survenue : {error}</p>
        </div>
      ) : filteredConsultations.length === 0 ? (
        <div className="empty-state">
          <p>Aucune consultation trouvée</p>
        </div>
      ) : (
        <div className="consultations-grid">
          {filteredConsultations.map((consultation) => (
            <div key={consultation.id} className="consultation-card">
              <div className="consultation-header">
                <div className="user-info">
                  <div className="user-avatar">
                    {getUserInitials(consultation.userName)}
                  </div>
                  <div>
                    <h3>{consultation.userName}</h3>
                    <small>{formatDate(consultation.createdAt)}</small>
                  </div>
                </div>
                <span className={`status ${consultation.status.toLowerCase()}`}>
                  {consultation.status.replace('_', ' ')}
                </span>
              </div>

              <div className="consultation-content">
                <div className="consultation-meta">
                  <div className="meta-item">
                    <strong>Objet :</strong>
                    <span>{consultation.subject}</span>
                  </div>
                  {consultation.assignedTo && (
                    <div className="meta-item">
                      <strong>Commercial :</strong>
                      <span>{consultation.assignedTo}</span>
                    </div>
                  )}
                </div>

                <div className="consultation-message">
                  <p>{consultation.message}</p>
                </div>

                {consultation.fileName && (
                  <div className="document-actions">
                    <button 
                      className="document-button"
                      onClick={() => openModal(consultation.fileName)}
                    >
                      <i className="icon-file"></i>
                      Voir le document ({getFileExtension(consultation.fileName).toUpperCase()})
                    </button>
                    <button 
                      className="assign-button"
                      onClick={() => handleAssignCommercial(consultation.id)}
                    >
                      <i className="icon-user"></i>
                      Affecter commercial
                    </button>
                    <select 
                      value={selectedCommercial}
                      onChange={(e) => setSelectedCommercial(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                    >
                      <option value="">Sélectionner un commercial</option>
                      {commercials.map(commercial => (
                        <option key={commercial.id} value={commercial.name}>
                          {commercial.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="status-actions">
                <select className="status-select">
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="closed">Fermé</option>
                </select>
                <button className="action-button primary-button">
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalFileUrl && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={closeModal}>×</button>
            <div className="modal-header">
              <h3>{modalFileName}</h3>
            </div>
            <div className="modal-body">
              {isImage(modalFileName) ? (
                <img src={modalFileUrl} alt={modalFileName} className="modal-image" />
              ) : isPDF(modalFileName) ? (
                <iframe src={modalFileUrl} title="Document PDF" className="modal-pdf" />
              ) : (
                <p>Prévisualisation non disponible pour ce type de fichier.</p>
              )}
            </div>
            <div className="modal-footer">
              <a href={modalFileUrl} className="modal-download" download>
                <i className="icon-download"></i>
                Télécharger
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminConsultations;