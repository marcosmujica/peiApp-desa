import React, { useState, useEffect } from 'react';
import { couchDBService } from '../services/couchDBService';

const ConfigForm = ({ onSave, currentConfig }) => {
  const [config, setConfig] = useState({
    url: 'http://localhost:5984',
    username: '',
    password: '',
    database: 'tickets'
  });
  
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (currentConfig) {
      setConfig(currentConfig);
    }
  }, [currentConfig]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!config.url.trim()) {
      newErrors.url = 'La URL es requerida';
    } else if (!config.url.match(/^https?:\/\/.+/)) {
      newErrors.url = 'La URL debe comenzar con http:// o https://';
    }
    
    if (!config.username.trim()) {
      newErrors.username = 'El usuario es requerido';
    }
    
    if (!config.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    }
    
    if (!config.database.trim()) {
      newErrors.database = 'El nombre de la base de datos es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo si existe
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      return;
    }

    setTesting(true);
    setTestResult(null);
    
    try {
      // Configurar temporalmente el servicio para la prueba
      couchDBService.setConfig(config);
      
      // Probar conexión
      const result = await couchDBService.testConnection();
      
      if (result.success) {
        // Intentar crear la base de datos si no existe
        const dbResult = await couchDBService.createDatabase();
        if (dbResult.success) {
          setTestResult({
            success: true,
            message: 'Conexión exitosa y base de datos verificada'
          });
        } else {
          setTestResult({
            success: false,
            message: `Conexión exitosa pero error en base de datos: ${dbResult.error}`
          });
        }
      } else {
        setTestResult({
          success: false,
          message: `Error de conexión: ${result.error}`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error inesperado: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    if (!testResult || !testResult.success) {
      setTestResult({
        success: false,
        message: 'Por favor, prueba la conexión antes de guardar'
      });
      return;
    }

    onSave(config);
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2>Configuración de CouchDB</h2>
      </div>
      
      <div className="card-body">
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <label htmlFor="url" className="form-label">
              URL del servidor CouchDB
            </label>
            <input
              type="text"
              id="url"
              name="url"
              value={config.url}
              onChange={handleInputChange}
              className={`form-control ${errors.url ? 'error' : ''}`}
              placeholder="http://localhost:5984"
            />
            {errors.url && (
              <div className="alert alert-error mt-1" style={{ padding: '5px 10px', fontSize: '14px' }}>
                {errors.url}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="username" className="form-label">
              Usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={config.username}
              onChange={handleInputChange}
              className={`form-control ${errors.username ? 'error' : ''}`}
              placeholder="admin"
            />
            {errors.username && (
              <div className="alert alert-error mt-1" style={{ padding: '5px 10px', fontSize: '14px' }}>
                {errors.username}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={config.password}
              onChange={handleInputChange}
              className={`form-control ${errors.password ? 'error' : ''}`}
              placeholder="password"
            />
            {errors.password && (
              <div className="alert alert-error mt-1" style={{ padding: '5px 10px', fontSize: '14px' }}>
                {errors.password}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="database" className="form-label">
              Nombre de la base de datos
            </label>
            <input
              type="text"
              id="database"
              name="database"
              value={config.database}
              onChange={handleInputChange}
              className={`form-control ${errors.database ? 'error' : ''}`}
              placeholder="tickets"
            />
            {errors.database && (
              <div className="alert alert-error mt-1" style={{ padding: '5px 10px', fontSize: '14px' }}>
                {errors.database}
              </div>
            )}
          </div>

          {testResult && (
            <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'}`}>
              {testResult.message}
            </div>
          )}

          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="btn btn-secondary"
            >
              {testing ? 'Probando...' : 'Probar Conexión'}
            </button>
            
            <button
              type="button"
              onClick={handleSave}
              disabled={testing}
              className="btn btn-primary"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigForm;