import { useState, useEffect } from 'react';
import { Sparkles, ArrowLeft, Plus, Trash2, HardDrive, UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';
import './AdminDashboard.css';

export default function AdminDashboard({ token, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Status check states
  const [serverStatus, setServerStatus] = useState({ database: 'loading', storage: 'loading' });

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTemplatesAndStatus = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch templates
      const templatesRes = await fetch('/api/templates');
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        setTemplates(templatesData);
      }

      // 2. Fetch server integration statuses
      const statusRes = await fetch('/api/status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setServerStatus(statusData);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplatesAndStatus();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    if (!title || !file) {
      setErrorMsg('Template title and image file are required.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('templateImage', file);

    try {
      setUploadProgress(40);
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      setUploadProgress(80);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload template.');
      }

      setUploadProgress(100);
      setSuccessMsg('Template added and processed successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      
      // Reset file input element
      const fileInput = document.getElementById('adminFileInput');
      if (fileInput) fileInput.value = '';

      // Reload lists
      fetchTemplatesAndStatus();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteTemplate = async (id, title) => {
    if (!confirm(`Are you sure you want to permanently delete template: "${title}"?`)) {
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete template.');
      }

      setSuccessMsg(`Template "${title}" has been deleted.`);
      fetchTemplatesAndStatus();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="upload-hero admin-container">
      
      {/* Dashboard Header */}
      <div className="admin-header">
        <div>
          <button
            onClick={onClose}
            className="btn-secondary btn-back"
          >
            <ArrowLeft size={16} />
            <span>Back to Gallery</span>
          </button>
          <h2 className="admin-title">
            Super Admin Template Console
          </h2>
          <p className="admin-desc">
            Manage poster templates, upload high-res poster frames, and inspect cloud system integrations.
          </p>
        </div>
      </div>


      {/* Notifications */}
      {successMsg && (
        <div className="glass-panel admin-notify-success">
          <CheckCircle size={20} style={{ color: '#10b981', flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="glass-panel admin-notify-error">
          <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Split grid for Dashboard Console */}
      <div className="admin-grid">
        
        {/* Form panel to upload templates */}
        <div className="glass-panel admin-card">
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
            <Plus size={20} style={{ color: 'var(--primary)' }} />
            <span>Upload Poster Frame</span>
          </h3>

          <form onSubmit={handleUploadTemplate} className="admin-form">
            
            {/* Title */}
            <div className="admin-form-group">
              <label className="admin-form-label">Template Name</label>
              <input
                type="text"
                placeholder="e.g. Immunity Achievers Frame"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="admin-input"
              />
            </div>

            {/* Description */}
            <div className="admin-form-group">
              <label className="admin-form-label">Description</label>
              <textarea
                placeholder="Brief guidelines or branding info..."
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="admin-textarea"
              />
            </div>

            {/* File drop zone upload */}
            <div className="admin-form-group">
              <label className="admin-form-label">Template Image File</label>
              
              <div
                onClick={() => document.getElementById('adminFileInput').click()}
                className="admin-file-zone"
              >
                <input
                  id="adminFileInput"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  required
                />
                
                <div className="admin-file-icon">
                  <UploadCloud size={32} />
                </div>
                
                <span className="admin-file-text" style={{ color: file ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {file ? file.name : 'Select high-res image (PNG/JPG)'}
                </span>
                
                {file && (
                  <div className="admin-file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div style={{ marginTop: '0.5rem' }}>
                <div className="progress-info-row">
                  <span>Uploading to server...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="loading-progress-bar" style={{ height: '6px' }}>
                  <div className="loading-progress-fill" style={{ width: `${uploadProgress}%`, animation: 'none' }}></div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isUploading}
              className="btn-primary"
              style={{ padding: '0.8rem', borderRadius: '12px', fontSize: '0.95rem', width: '100%', marginTop: '0.5rem' }}
            >
              {isUploading ? 'Processing upload...' : 'Add Template Frame'}
            </button>

          </form>
        </div>

        {/* Existing templates catalog grid */}
        <div>
          <h3 className="catalog-title">
            Active Templates ({templates.length})
          </h3>

          {isLoading ? (
            <div className="catalog-list">
              {[1, 2].map(n => (
                <div key={n} className="glass-panel skeleton" style={{ height: '100px', borderRadius: '16px' }} />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <div className="glass-panel catalog-empty-state">
              <HardDrive size={36} style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', opacity: 0.5 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>No active poster templates found in DB.</p>
            </div>
          ) : (
            <div className="catalog-list">
              {templates.map((template) => (
                <div
                  key={template._id}
                  className="glass-panel catalog-item"
                >
                  {/* Small Preview image */}
                  <div className="catalog-img-wrap">
                    <img
                      src={template.url}
                      alt=""
                      className="catalog-img"
                      onError={(e) => { e.target.src = '/template.jpg'; }}
                    />
                  </div>

                  {/* Title & Storage details */}
                  <div className="catalog-details">
                    <h4 className="catalog-item-title">
                      {template.title}
                    </h4>
                    <p className="catalog-item-desc">
                      {template.description || 'No description.'}
                    </p>
                    <div className="catalog-tags">
                      <span className="tag-id">
                        ID: {template.fileId.substring(0, 15)}...
                      </span>
                      <span className={`tag-storage ${template.storage === 'idrive-e2' || template.storage === 'google-drive' ? 'cloud' : 'local'}`}>
                        {template.storage === 'idrive-e2' ? 'iDrive E2 S3' : template.storage === 'google-drive' ? 'Google Drive' : 'Local Disk'}
                      </span>
                    </div>
                  </div>

                  {/* Action delete (default vaccine frame can't be deleted) */}
                  <div>
                    {template.fileId === 'template.jpg' ? (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', padding: '0.5rem' }}>System Protected</span>
                    ) : (
                      <button
                        onClick={() => handleDeleteTemplate(template._id, template.title)}
                        className="btn-delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      
    </div>
  );
}

