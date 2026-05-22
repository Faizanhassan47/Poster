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

  // Overlay Configuration
  const [nameX, setNameX] = useState(10);
  const [nameY, setNameY] = useState(70);
  const [nameWidth, setNameWidth] = useState(80);
  const [nameHeight, setNameHeight] = useState(10);
  const [nameColor, setNameColor] = useState('#000000');
  const [nameSize, setNameSize] = useState(40);
  const [nameFont, setNameFont] = useState('Arial');

  // Drawing State
  const [drawingMode, setDrawingMode] = useState(null); // 'name' | null
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [currentMouse, setCurrentMouse] = useState({ x: 0, y: 0 });

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setDrawingMode(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setDrawingMode(null);
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

    const overlays = {
      name: { x: nameX, y: nameY, width: nameWidth, height: nameHeight, color: nameColor, fontSize: nameSize, fontFamily: nameFont },
      designation: { x: 0, y: 0, width: 0, height: 0, color: '#000000', fontSize: 0, fontFamily: 'Arial' }
    };
    formData.append('overlays', JSON.stringify(overlays));

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

  const handleMouseDown = (e) => {
    if (!drawingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDragStart({ x, y });
    setCurrentMouse({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !drawingMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    // Clamp to 0-100
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    setCurrentMouse({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !drawingMode) return;
    setIsDrawing(false);

    const x = Math.min(dragStart.x, currentMouse.x);
    const y = Math.min(dragStart.y, currentMouse.y);
    const w = Math.abs(currentMouse.x - dragStart.x);
    const h = Math.abs(currentMouse.y - dragStart.y);

    if (w > 2 && h > 2) {
      if (drawingMode === 'name') {
        setNameX(Math.round(x));
        setNameY(Math.round(y));
        setNameWidth(Math.round(w));
        setNameHeight(Math.round(h));
      }
    }
    setDrawingMode(null);
  };

  const handleTouchStart = (e) => {
    if (!drawingMode) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setDragStart({ x, y });
    setCurrentMouse({ x, y });
    setIsDrawing(true);
  };

  const handleTouchMove = (e) => {
    if (!isDrawing || !drawingMode) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    let x = ((touch.clientX - rect.left) / rect.width) * 100;
    let y = ((touch.clientY - rect.top) / rect.height) * 100;
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    setCurrentMouse({ x, y });
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  const getDrawnBoxStyle = (x, y, w, h) => {
    return {
      left: `${x}%`,
      top: `${y}%`,
      width: `${w}%`,
      height: `${h}%`
    };
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

            <div className="adp-field-overlay-settings">
              <label className="adp-label" style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Text Overlay Settings (Name & Designation)</label>
              <div className="adp-settings-grid">
                <div>
                  <label className="adp-label" style={{ fontSize: '0.8rem' }}>Font Style</label>
                  <select value={nameFont} onChange={(e) => setNameFont(e.target.value)} className="adp-input">
                    <option value="Arial">Arial</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Oswald">Oswald</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Merriweather">Merriweather</option>
                    <option value="Lobster">Lobster</option>
                    <option value="Pacifico">Pacifico</option>
                  </select>
                </div>
                <div>
                  <label className="adp-label" style={{ fontSize: '0.8rem' }}>Font Size</label>
                  <input type="number" min="10" max="200" value={nameSize} onChange={(e) => setNameSize(Number(e.target.value))} className="adp-input" />
                </div>
                <div>
                  <label className="adp-label" style={{ fontSize: '0.8rem' }}>Color</label>
                  <input type="color" value={nameColor} onChange={(e) => setNameColor(e.target.value)} style={{ width: '100%', height: '42px', padding: '0', border: 'none', borderRadius: '8px' }} />
                </div>
              </div>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', padding: '1rem' }}>
                  <div className="adp-draw-container">
                    <div className={`adp-draw-wrapper ${drawingMode ? 'drawing' : ''}`}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <img src={preview} alt="preview" className="adp-draw-img" draggable={false} />
                      
                      {/* Interactive Drawing Overlay */}
                      {drawingMode && (
                        <div className="adp-draw-overlay" />
                      )}

                      {/* Current Drawing Box */}
                      {isDrawing && (
                        <div className={`adp-draw-box ${drawingMode}`} style={getDrawnBoxStyle(
                          Math.min(dragStart.x, currentMouse.x),
                          Math.min(dragStart.y, currentMouse.y),
                          Math.abs(currentMouse.x - dragStart.x),
                          Math.abs(currentMouse.y - dragStart.y)
                        )}></div>
                      )}

                      {/* Saved Name Box */}
                      {nameWidth > 0 && (!isDrawing || drawingMode !== 'name') && (
                        <div className="adp-draw-box name" style={getDrawnBoxStyle(nameX, nameY, nameWidth, nameHeight)}>
                          <span className="adp-draw-label">Name & Designation</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDrawingMode(drawingMode === 'name' ? null : 'name'); }}
                      className={`adp-btn-secondary ${drawingMode === 'name' ? 'active-name' : ''}`}
                      style={{ maxWidth: '320px' }}
                    >
                      {drawingMode === 'name' ? 'Drawing Overlay Area...' : 'Draw Name & Designation Area'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                    <div className="adp-preview-info" style={{ flexDirection: 'row', gap: '0.5rem' }}>
                      <span className="adp-preview-name">{file.name}</span>
                      <span className="adp-preview-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }} className="adp-preview-clear">
                      <X size={14} /> Remove
                    </button>
                  </div>
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
