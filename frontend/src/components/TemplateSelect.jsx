import { useState, useEffect } from 'react';
import { Sparkles, Settings, LogOut, ArrowRight, LayoutGrid, AlertCircle, RefreshCw } from 'lucide-react';
import './TemplateSelect.css';

export default function TemplateSelect({ user, onSelectTemplate, onOpenAdmin, onLogout, token }) {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchTemplates = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/templates');
      if (!response.ok) {
        throw new Error('Failed to load templates from the API.');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setErrorMsg('Could not fetch design templates. Running offline mode fallback.');

      // Fallback offline templates
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="upload-hero template-select-container">

      {/* Top Navbar Section */}
      <div className="template-navbar">
        <div className="template-header-info">
          <div className="hero-tag" style={{ margin: 0 }}>
            <Sparkles size={14} />
            <span>{user ? `Logged in as ${isAdmin ? 'Super Admin' : 'Creator'}` : 'Public Gallery'}</span>
          </div>
          <h2 className="template-title">
            Hello, {user?.name || 'Guest Designer'}!
          </h2>
          <p className="template-subtitle">
            Select a designer template background to start creating your poster
          </p>
        </div>

        {/* Buttons Row */}
        <div className="template-nav-actions">
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="btn-secondary btn-admin-dashboard"
            >
              <Settings size={18} />
              <span>Admin Dashboard</span>
            </button>
          )}

          {user && (
            <button
              onClick={onLogout}
              className="btn-secondary btn-sign-out"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="glass-panel template-error-msg">
          <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
          <span style={{ flexGrow: 1 }}>{errorMsg}</span>
          <button onClick={fetchTemplates} className="btn-secondary btn-retry">
            <RefreshCw size={12} style={{ marginRight: '0.25rem' }} /> Retry
          </button>
        </div>
      )}

      {/* Templates Grid */}
      {isLoading ? (
        <div className="template-grid-container" style={{ marginTop: '1rem' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel skeleton" style={{ height: '380px', borderRadius: '20px', padding: 0 }} />
          ))}
        </div>
      ) : (
        <>
          {templates.length === 0 ? (
            <div className="glass-panel template-empty-state">
              <LayoutGrid size={48} style={{ color: 'var(--text-secondary)', marginBottom: '1rem', opacity: 0.5 }} />
              <h3>No templates available</h3>
              <p className="template-empty-desc">
                Admin hasn't uploaded any custom poster templates yet.
              </p>
              {isAdmin && (
                <button onClick={onOpenAdmin} className="btn-primary" style={{ display: 'inline-flex', alignSelf: 'center' }}>
                  Add Your First Template
                </button>
              )}
            </div>
          ) : (
            <div className="template-grid-container">
              {templates.map((template) => (
                <div
                  key={template._id}
                  className="glass-panel template-card"
                  onClick={() => onSelectTemplate(template)}
                >

                  {/* Template Image Header */}
                  <div className="template-card-image-wrap">
                    <img
                      src={template.url}
                      alt={template.title}
                      className="template-card-image"
                      onError={(e) => {
                        e.target.src = '/template.jpg'; // Fallback if image fails to render
                      }}
                    />
                  </div>

                  {/* Template Info Body */}
                  <div className="template-card-body">
                    <div>
                      <h4 className="template-card-title">
                        {template.title}
                      </h4>
                      <p className="template-card-desc">
                        {template.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="template-card-footer">
                      <span className="template-card-date">
                        Created {new Date(template.createdAt).toLocaleDateString()}
                      </span>
                      <span className="template-card-action">
                        <span>Use This</span>
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </>
      )}

    </div>
  );
}

