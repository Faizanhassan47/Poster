import { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, HardDrive, UploadCloud,
  CheckCircle, AlertCircle, UserPlus, User, Lock,
  Mail, Image, LayoutDashboard, RefreshCw, X, Eye, EyeOff
} from 'lucide-react';
import './AdminDashboard.css';

// ─── Sub-page: Upload Template ────────────────────────────────────────────────
function UploadTemplatePage({ token, onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    const el = document.getElementById('adminFileInput');
    if (el) el.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setErrorMsg('Template name is required.'); return; }
    if (!file) { setErrorMsg('Please select an image file.'); return; }

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('templateImage', file);

    try {
      setUploadProgress(40);
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/templates`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      setUploadProgress(85);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Upload failed.');

      setUploadProgress(100);
      setSuccessMsg(`✅ "${title}" uploaded successfully!`);
      setTitle('');
      setDescription('');
      clearFile();
      if (onSuccess) onSuccess();

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <div className="adp-page">
      <div className="adp-page-header">
        <div className="adp-page-icon" style={{ background: 'linear-gradient(135deg, #f27a18, #f59e0b)' }}>
          <UploadCloud size={22} color="white" />
        </div>
        <div>
          <h2 className="adp-page-title">Upload Poster Template</h2>
          <p className="adp-page-desc">Add a new high-resolution poster frame to the gallery</p>
        </div>
      </div>

      {successMsg && (
        <div className="adp-alert adp-alert-success">
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="adp-alert adp-alert-error">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="adp-alert-close"><X size={14} /></button>
        </div>
      )}

      <form onSubmit={handleUpload} className="adp-form">
        <div className="adp-form-row">
          {/* Left: Fields */}
          <div className="adp-form-fields">
            <div className="adp-field">
              <label className="adp-label">Template Name <span className="adp-required">*</span></label>
              <input
                type="text"
                placeholder="e.g. Immunity Achievers Frame"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="adp-input"
                required
              />
            </div>

            <div className="adp-field">
              <label className="adp-label">Description <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span></label>
              <textarea
                placeholder="Brief description or usage guidelines..."
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="adp-textarea"
              />
            </div>

            {isUploading && (
              <div className="adp-progress-wrap">
                <div className="adp-progress-row">
                  <span>Uploading to cloud storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="adp-progress-bar">
                  <div className="adp-progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={isUploading} className="adp-btn-primary">
              {isUploading ? (
                <><span className="adp-spinner" /> Uploading...</>
              ) : (
                <><UploadCloud size={18} /> Upload Template</>
              )}
            </button>
          </div>

          {/* Right: File Drop Zone + Preview */}
          <div className="adp-form-upload">
            <label className="adp-label">Image File <span className="adp-required">*</span></label>
            <div
              className={`adp-dropzone ${file ? 'has-file' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !file && document.getElementById('adminFileInput').click()}
            >
              <input
                id="adminFileInput"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {preview ? (
                <div className="adp-preview-wrap">
                  <img src={preview} alt="preview" className="adp-preview-img" />
                  <div className="adp-preview-info">
                    <span className="adp-preview-name">{file.name}</span>
                    <span className="adp-preview-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  <button type="button" onClick={clearFile} className="adp-preview-clear">
                    <X size={14} /> Remove
                  </button>
                </div>
              ) : (
                <div className="adp-dropzone-inner">
                  <div className="adp-dropzone-icon">
                    <Image size={36} />
                  </div>
                  <p className="adp-dropzone-text">Drop image here or <span className="adp-dropzone-link">browse</span></p>
                  <p className="adp-dropzone-hint">PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Sub-page: Manage Templates ───────────────────────────────────────────────
function ManageTemplatesPage({ token }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/templates`);
      if (res.ok) setTemplates(await res.json());
    } catch (err) {
      setErrorMsg('Failed to load templates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Permanently delete "${title}"?`)) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccessMsg(`"${title}" deleted.`);
      fetchTemplates();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="adp-page">
      <div className="adp-page-header">
        <div className="adp-page-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <LayoutDashboard size={22} color="white" />
        </div>
        <div>
          <h2 className="adp-page-title">Manage Templates</h2>
          <p className="adp-page-desc">{templates.length} template{templates.length !== 1 ? 's' : ''} in the gallery</p>
        </div>
        <button onClick={fetchTemplates} className="adp-btn-icon" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {successMsg && (
        <div className="adp-alert adp-alert-success">
          <CheckCircle size={18} /><span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="adp-alert adp-alert-error">
          <AlertCircle size={18} /><span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="adp-alert-close"><X size={14} /></button>
        </div>
      )}

      {isLoading ? (
        <div className="adp-skeleton-list">
          {[1, 2, 3].map(n => <div key={n} className="adp-skeleton" />)}
        </div>
      ) : templates.length === 0 ? (
        <div className="adp-empty">
          <HardDrive size={48} />
          <p>No templates found. Upload one to get started.</p>
        </div>
      ) : (
        <div className="adp-template-grid">
          {templates.map((t) => (
            <div key={t._id} className="adp-template-card">
              <div className="adp-template-img-wrap">
                <img
                  src={t.url}
                  alt={t.title}
                  className="adp-template-img"
                  onError={(e) => { e.target.src = '/template.jpg'; }}
                />
              </div>
              <div className="adp-template-body">
                <h4 className="adp-template-title">{t.title}</h4>
                <p className="adp-template-desc">{t.description || 'No description.'}</p>
                <div className="adp-template-meta">
                  <span className={`adp-badge ${t.storage === 'idrive-e2' || t.storage === 'google-drive' ? 'cloud' : 'local'}`}>
                    {t.storage === 'idrive-e2' ? '☁️ iDrive E2' : t.storage === 'google-drive' ? '☁️ Google Drive' : '💾 Local'}
                  </span>
                  <span className="adp-badge id">ID: {t.fileId.substring(0, 12)}…</span>
                </div>
              </div>
              <div className="adp-template-actions">
                {t.fileId === 'template.jpg' ? (
                  <span className="adp-protected">🔒 System</span>
                ) : (
                  <button
                    onClick={() => handleDelete(t._id, t.title)}
                    className="adp-btn-delete"
                    title="Delete template"
                  >
                    <Trash2 size={15} />
                    <span>Delete</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-page: Create Admin User ──────────────────────────────────────────────
function CreateAdminPage({ token }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setErrorMsg('All fields are required.');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/auth/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccessMsg(`Admin account for "${name}" created successfully!`);
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="adp-page">
      <div className="adp-page-header">
        <div className="adp-page-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
          <UserPlus size={22} color="white" />
        </div>
        <div>
          <h2 className="adp-page-title">Create Admin User</h2>
          <p className="adp-page-desc">Add a new administrator account to the system</p>
        </div>
      </div>

      {successMsg && (
        <div className="adp-alert adp-alert-success">
          <CheckCircle size={18} /><span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="adp-alert adp-alert-error">
          <AlertCircle size={18} /><span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="adp-alert-close"><X size={14} /></button>
        </div>
      )}

      <div className="adp-create-admin-wrap">
        <form onSubmit={handleSubmit} className="adp-form adp-create-admin-form">

          <div className="adp-field">
            <label className="adp-label">Full Name <span className="adp-required">*</span></label>
            <div className="adp-input-wrap">
              <User size={16} className="adp-input-icon" />
              <input
                type="text"
                placeholder="e.g. Umar Khan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="adp-input adp-input-icon-pad"
                required
              />
            </div>
          </div>

          <div className="adp-field">
            <label className="adp-label">Username / Email <span className="adp-required">*</span></label>
            <div className="adp-input-wrap">
              <Mail size={16} className="adp-input-icon" />
              <input
                type="text"
                placeholder="e.g. umarkhan or admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="adp-input adp-input-icon-pad"
                required
              />
            </div>
          </div>

          <div className="adp-field">
            <label className="adp-label">Password <span className="adp-required">*</span></label>
            <div className="adp-input-wrap">
              <Lock size={16} className="adp-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="adp-input adp-input-icon-pad adp-input-icon-pad-right"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="adp-pw-toggle"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="adp-info-box">
            <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <span>New admin accounts will have full access to the Admin Console. Only create accounts for trusted personnel.</span>
          </div>

          <button type="submit" disabled={isLoading} className="adp-btn-primary">
            {isLoading ? (
              <><span className="adp-spinner" /> Creating account...</>
            ) : (
              <><UserPlus size={18} /> Create Admin Account</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard Shell ───────────────────────────────────────────────
export default function AdminDashboard({ token, onClose }) {
  const [activePage, setActivePage] = useState('upload');
  const [templateCount, setTemplateCount] = useState(null);

  const refreshCount = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiBase}/api/templates`);
      if (res.ok) {
        const data = await res.json();
        setTemplateCount(data.length);
      }
    } catch {}
  };

  useEffect(() => { refreshCount(); }, []);

  const tabs = [
    { id: 'upload',  label: 'Upload Template',  icon: <UploadCloud size={17} /> },
    { id: 'manage',  label: 'Manage Templates', icon: <LayoutDashboard size={17} /> },
    { id: 'admin',   label: 'Create Admin',     icon: <UserPlus size={17} /> },
  ];

  return (
    <div className="adp-shell">
      {/* Sidebar */}
      <aside className="adp-sidebar">
        <div className="adp-sidebar-brand">
          <div className="adp-sidebar-logo">
            <LayoutDashboard size={20} color="white" />
          </div>
          <span>Admin Console</span>
        </div>

        <nav className="adp-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePage(tab.id)}
              className={`adp-nav-item ${activePage === tab.id ? 'active' : ''}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'manage' && templateCount !== null && (
                <span className="adp-nav-badge">{templateCount}</span>
              )}
            </button>
          ))}
        </nav>

        <button onClick={onClose} className="adp-nav-back">
          <ArrowLeft size={16} />
          <span>Back to Gallery</span>
        </button>
      </aside>

      {/* Main content area */}
      <main className="adp-main">
        {activePage === 'upload' && (
          <UploadTemplatePage token={token} onSuccess={refreshCount} />
        )}
        {activePage === 'manage' && (
          <ManageTemplatesPage token={token} />
        )}
        {activePage === 'admin' && (
          <CreateAdminPage token={token} />
        )}
      </main>
    </div>
  );
}
