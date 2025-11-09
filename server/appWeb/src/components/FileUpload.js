import React, { useState, useCallback } from 'react';

const FileUpload = ({ onUpload, disabled }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter(file => {
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`El archivo ${file.name} es demasiado grande. Máximo 10MB.`);
        return false;
      }
      
      // Validar tipo
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        alert(`El tipo de archivo ${file.name} no está permitido.`);
        return false;
      }
      
      return true;
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    await onUpload(selectedFiles);
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <div
        className={`file-upload-zone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input').click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.txt"
          disabled={disabled}
        />
        
        <div className="file-upload-text">
          📁 Haz clic aquí o arrastra archivos para subir
        </div>
        <div className="file-upload-hint">
          Formatos permitidos: JPG, PNG, GIF, WebP, PDF, DOC, DOCX, TXT<br />
          Tamaño máximo: 10MB por archivo
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="file-list">
          <h4>Archivos Seleccionados:</h4>
          {selectedFiles.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="file-remove"
                disabled={disabled}
              >
                ×
              </button>
            </div>
          ))}
          
          <div style={{ marginTop: '15px' }}>
            <button
              type="button"
              onClick={handleUpload}
              disabled={disabled || selectedFiles.length === 0}
              className="btn btn-primary"
            >
              {disabled ? 'Subiendo...' : `Subir ${selectedFiles.length} archivo${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              disabled={disabled}
              className="btn btn-secondary"
              style={{ marginLeft: '10px' }}
            >
              Limpiar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;