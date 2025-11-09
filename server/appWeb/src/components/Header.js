import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = ({ isConfigured, onResetConfig }) => {
  const location = useLocation();

  return (
    <header className="header">
      <div className="container">
        <h1>Gestión de Tickets</h1>
        
        {isConfigured && (
          <nav className="nav">
            <Link 
              to="/tickets" 
              className={`nav-link ${location.pathname === '/tickets' ? 'active' : ''}`}
            >
              Lista de Tickets
            </Link>
            <Link 
              to="/config" 
              className={`nav-link ${location.pathname === '/config' ? 'active' : ''}`}
            >
              Configuración
            </Link>
            <button 
              onClick={onResetConfig}
              className="nav-link"
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: 'inherit',
                cursor: 'pointer'
              }}
            >
              Resetear Config
            </button>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;