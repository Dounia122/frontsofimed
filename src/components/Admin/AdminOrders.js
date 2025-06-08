import React, { useState, useEffect } from 'react';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/orders');
        if (!response.ok) throw new Error('Erreur lors du chargement des commandes');
        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const calculateDeliveryTime = (distance) => {
    // Estimation basée sur la distance (à personnaliser selon vos besoins)
    const baseTime = 24; // Heures de base
    const timePerKm = 0.5; // Heures supplémentaires par km
    return Math.round(baseTime + (distance * timePerKm));
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'en_attente': 'var(--warning)',
      'en_preparation': 'var(--info)',
      'en_livraison': 'var(--primary)',
      'livree': 'var(--success)',
      'annulee': 'var(--danger)'
    };
    return statusColors[status] || 'var(--text-secondary)';
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-orders-container">
      <header className="admin-orders-header">
        <h2>Gestion des Commandes</h2>
        <div className="filter-controls">
          <input
            type="text"
            className="search-input"
            placeholder="Rechercher une commande..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="en_preparation">En préparation</option>
            <option value="en_livraison">En livraison</option>
            <option value="livree">Livrée</option>
            <option value="annulee">Annulée</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Chargement des commandes...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <p>Une erreur est survenue : {error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty-state">
          <p>Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Commande #{order.orderNumber}</h3>
                  <span className="order-date">{formatDate(order.orderDate)}</span>
                </div>
                <div className="order-status" style={{ backgroundColor: getStatusColor(order.status) }}>
                  {order.status.replace('_', ' ')}
                </div>
              </div>

              <div className="order-content">
                <div className="customer-info">
                  <strong>Client:</strong>
                  <span>{order.customerName}</span>
                </div>
                <div className="delivery-info">
                  <strong>Adresse de livraison:</strong>
                  <span>{order.deliveryAddress}</span>
                </div>
                <div className="delivery-estimate">
                  <strong>Délai de livraison estimé:</strong>
                  <span>{calculateDeliveryTime(order.distance)}h</span>
                </div>
                <div className="order-items">
                  <strong>Articles:</strong>
                  <ul>
                    {order.items.map((item, index) => (
                      <li key={index}>
                        {item.quantity}x {item.name} - {item.price}€
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="order-total">
                  <strong>Total:</strong>
                  <span>{order.total}€</span>
                </div>
              </div>

              <div className="order-actions">
                <select 
                  className="status-select"
                  value={order.status}
                  onChange={(e) => {
                    // Ici, ajoutez la logique pour mettre à jour le statut
                    console.log(`Mise à jour du statut de la commande ${order.id} à ${e.target.value}`);
                  }}
                >
                  <option value="en_attente">En attente</option>
                  <option value="en_preparation">En préparation</option>
                  <option value="en_livraison">En livraison</option>
                  <option value="livree">Livrée</option>
                  <option value="annulee">Annulée</option>
                </select>
                <button className="action-button">
                  Mettre à jour
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;