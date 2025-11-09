import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import ConfigForm from './components/ConfigForm';
import TicketList from './components/TicketList';
import TicketDetail from './components/TicketDetail';
import { couchDBService } from './services/couchDBService';

function App() {
  const [config, setConfig] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Cargar configuración guardada
    const savedConfig = localStorage.getItem('couchdb-config');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
        couchDBService.setConfig(parsedConfig);
        setIsConfigured(true);
      } catch (error) {
        console.error('Error al cargar configuración:', error);
      }
    }
  }, []);

  const handleConfigSave = (newConfig) => {
    setConfig(newConfig);
    couchDBService.setConfig(newConfig);
    localStorage.setItem('couchdb-config', JSON.stringify(newConfig));
    setIsConfigured(true);
  };

  const handleResetConfig = () => {
    setConfig(null);
    setIsConfigured(false);
    localStorage.removeItem('couchdb-config');
    couchDBService.setConfig(null);
  };

  return (
    <Router>
      <div className="App">
        <Header 
          isConfigured={isConfigured} 
          onResetConfig={handleResetConfig}
        />
        
        <main className="container" style={{ marginTop: '2rem', paddingBottom: '2rem' }}>
          <Routes>
            <Route 
              path="/" 
              element={
                !isConfigured ? (
                  <ConfigForm onSave={handleConfigSave} />
                ) : (
                  <Navigate to="/tickets" replace />
                )
              } 
            />
            <Route 
              path="/config" 
              element={<ConfigForm onSave={handleConfigSave} currentConfig={config} />} 
            />
            <Route 
              path="/tickets" 
              element={
                isConfigured ? (
                  <TicketList />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/tickets/:ticketId" 
              element={
                isConfigured ? (
                  <TicketDetail />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;