import React, { useState, useEffect } from 'react';
import './AdminConsultations.css';

const AdminConsultations = () => {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalFileUrl, setModalFileUrl] = useState(null);
  const [modalFileName, setModalFileName] = useState('');

  useEffect(() => {
    fetch('http://localhost:8080/api/consultations')
      .then(response => {
        if (!response.ok) throw new Error('Erreur lors du chargement des consultations');
        return response.json();
      })
      .then(data => {
        setConsultations(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Erreur :', error);
        setLoading(false);
      });
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

  return (
    <>
      <header className="admin-consultations-header">
        <h2>Gestion des Consultations</h2>
      </header>

      <div className="consultations-container">
        {loading ? (
          <div className="loading">Chargement des consultations...</div>
        ) : consultations.length === 0 ? (
          <div className="no-consultations">Aucune consultation à afficher</div>
        ) : (
          <div className="consultations-list">
            {consultations.map((consultation) => (
              <div key={consultation.id} className="consultation-card">
                <div className="consultation-header">
                  <h3>{consultation.userName}</h3>
                  <span className={`status ${consultation.status.toLowerCase()}`}>
                    {consultation.status}
                  </span>
                </div>
                <div className="consultation-info">
                  <p><strong>Objet :</strong> {consultation.subject}</p>
                  <p><strong>Message :</strong> {consultation.message}</p>
                  <p><strong>Créée le :</strong> {new Date(consultation.createdAt).toLocaleDateString()}</p>
                  {consultation.fileName ? (
                    <p>
                      <strong>Document :</strong>{' '}
                      <button className="document-button" onClick={() => openModal(consultation.fileName)}>
                        Voir {consultation.fileName}
                      </button>
                    </p>
                  ) : (
                    <p><strong>Document :</strong> Aucun</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalFileUrl && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={closeModal}>×</button>
            <h3>{modalFileName}</h3>
            {isImage(modalFileName) ? (
              <img src={modalFileUrl} alt={modalFileName} className="modal-image" />
            ) : isPDF(modalFileName) ? (
              <iframe src={modalFileUrl} title="Document PDF" className="modal-pdf" width="100%" height="500px" />
            ) : (
              <p>Prévisualisation non disponible pour ce type de fichier.</p>
            )}
            <a href={modalFileUrl} className="modal-download" download>
              Télécharger le fichier
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminConsultations;
