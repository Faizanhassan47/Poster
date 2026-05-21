import { useState, useRef, useEffect } from 'react';
import { removeBackground } from '@imgly/background-removal';
import { fabric } from 'fabric';
import {
  UploadCloud,
  Sparkles,
  RefreshCw,
  Download,
  ZoomIn,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Layers,
  Info,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

import Auth from './components/Auth/Auth';
import TemplateSelect from './components/TemplateSelect/TemplateSelect';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import './App.css';

function App() {
  // Phase state: 'AUTH', 'TEMPLATE_SELECT', 'ADMIN_DASHBOARD', 'UPLOAD', 'PROCESSING', 'STUDIO'
  const [phase, setPhase] = useState('TEMPLATE_SELECT');

  // Auth States
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);

  // Selected Template State
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Progress states
  const [loadingStep, setLoadingStep] = useState('');
  const [percentProgress, setPercentProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Editing control states
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Export format: 'PNG', 'JPG', 'PDF'
  const [exportFormat, setExportFormat] = useState('PNG');

  // References
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const userPhotoRef = useRef(null);
  const templateOverlayRef = useRef(null);
  const originalUserPhotoUrlRef = useRef(null);

  // Auto-login or session restoration
  useEffect(() => {
    if (token) {
      const apiBase = import.meta.env.VITE_API_URL || '';
      fetch(`${apiBase}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Session expired');
        })
        .then(data => {
          setUser(data.user);
          // If they were on the AUTH page, redirect them to the template select gallery
          setPhase(prev => prev === 'AUTH' ? 'TEMPLATE_SELECT' : prev);
        })
        .catch(err => {
          console.error('Auto-login session expired:', err.message);
          localStorage.removeItem('token');
          setToken('');
          setUser(null);
          setPhase('TEMPLATE_SELECT');
        });
    } else {
      setUser(null);
      // Fallback to gallery if not logging in
      setPhase(prev => prev === 'AUTH' ? 'AUTH' : 'TEMPLATE_SELECT');
    }
  }, [token]);

  // Clean up Object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (originalUserPhotoUrlRef.current) {
        URL.revokeObjectURL(originalUserPhotoUrlRef.current);
      }
    };
  }, []);

  const handleAuthSuccess = (newToken, authUser) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(authUser);
    setPhase('TEMPLATE_SELECT');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setSelectedTemplate(null);
    setPhase('TEMPLATE_SELECT');
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setPhase('UPLOAD');
  };

  /**
   * Phase 1 & 2: Handles the image upload and triggers the background removal AI.
   */
  const handleImageUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file.');
      return;
    }

    setPhase('PROCESSING');
    setLoadingStep('Downloading AI models & initializing...');
    setPercentProgress(15);
    setErrorMsg('');

    try {
      // 1. Process User Image Background Removal
      const transparentBlob = await removeBackground(file, {
        progress: (key, current, total) => {
          const stepPercent = Math.round((current / total) * 100);
          setPercentProgress(stepPercent);

          if (key === 'fetch') {
            setLoadingStep(`Downloading AI model resources... ${stepPercent}%`);
          } else if (key === 'compute') {
            setLoadingStep(`Removing background using browser AI... ${stepPercent}%`);
          } else {
            setLoadingStep(`Processing image layers... ${stepPercent}%`);
          }
        }
      });

      setLoadingStep('Finalizing transparent cutout...');
      setPercentProgress(95);

      const transparentUrl = URL.createObjectURL(transparentBlob);
      originalUserPhotoUrlRef.current = transparentUrl;

      // 2. Load the poster template image
      setLoadingStep('Preparing poster template...');
      const templateImg = new Image();
      templateImg.crossOrigin = 'anonymous'; // Avoid taining canvas with cloud URLs
      templateImg.src = selectedTemplate?.url || '/template.jpg';

      templateImg.onload = () => {
        // Move to Design Studio phase
        setPhase('STUDIO');

        // Initialize Fabric canvas in next tick after DOM is rendered
        setTimeout(() => {
          initializeDesignStudio(transparentUrl, templateImg.naturalWidth, templateImg.naturalHeight);
        }, 100);
      };

      templateImg.onerror = () => {
        console.error('Failed to load template image:', selectedTemplate?.url);
        setErrorMsg('Failed to load the poster template. Standard local frame will be used.');

        // Fallback to local default template
        templateImg.src = '/template.jpg';
      };

    } catch (error) {
      console.error('Error in background removal or template processing:', error);
      setErrorMsg('AI background removal failed. This can happen if the image is too large or unsupported. Please try another image.');
      setPhase('UPLOAD');
    }
  };

  /**
   * Drag & Drop event handlers
   */
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  /**
   * Phase 3: Initializes the Fabric.js Design Studio Canvas.
   * Loads images in strict order: User Photo (bottom) -> Processed Template Overlay (top)
   */
  const initializeDesignStudio = (userPhotoUrl, width, height) => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
    }

    // Programmatically calculate safe display scale constraints based on viewport
    const isMobile = window.innerWidth <= 1024;
    const maxWidth = isMobile
      ? Math.max(280, window.innerWidth - 80)
      : Math.max(300, Math.min(width, window.innerWidth - 480));
    const maxHeight = window.innerHeight * 0.65;

    // Scale to fit the smaller dimension constraint
    const scaleFactor = Math.min(1, Math.min(maxWidth / width, maxHeight / height));
    const displayWidth = width * scaleFactor;
    const displayHeight = height * scaleFactor;

    // Set an optimized working height/width for canvas container on screen,
    // but preserve the original aspect ratio and dimensions for perfect exports.
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: displayWidth,
      height: displayHeight,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true, // Strict layering
    });

    // Store dimensions for high-resolution exports
    canvas.scaleFactor = scaleFactor;
    canvas.naturalWidth = width;
    canvas.naturalHeight = height;

    fabricCanvasRef.current = canvas;

    // Load selected Template first (Bottom layer)
    const templateUrl = selectedTemplate?.url || '/template.jpg';
    fabric.Image.fromURL(templateUrl, (templateImg) => {
      templateImg.set({
        left: 0,
        top: 0,
        scaleX: scaleFactor,
        scaleY: scaleFactor,
        selectable: false, // The template remains perfectly fixed
        evented: false,    // Pointer events do not affect the template
      });

      canvas.add(templateImg);
      templateOverlayRef.current = templateImg;

      // Load User Photo second (Top layer)
      fabric.Image.fromURL(userPhotoUrl, (userImg) => {
        // Calculate a generous default size (scale to fit about 75% of canvas height)
        const targetHeight = canvas.height * 0.75;
        const scale = targetHeight / userImg.height;

        // Position the user photo so they slide nicely into the beige column on the left
        const defaultLeft = canvas.width * 0.1;
        const defaultTop = canvas.height * 0.15;

        userImg.set({
          left: defaultLeft,
          top: defaultTop,
          scaleX: scale,
          scaleY: scale,
          cornerColor: '#f27a18', // Matches Virionza orange theme
          cornerStrokeColor: '#ffffff',
          borderColor: '#f27a18',
          cornerSize: 18,
          transparentCorners: false,
          borderScaleFactor: 3,
          padding: 5,
          hasRotatingPoint: true,
        });

        canvas.add(userImg);
        userPhotoRef.current = userImg;
        userImg.bringToFront();

        // Auto-select the user photo layer so controls show immediately
        canvas.setActiveObject(userImg);
        canvas.renderAll();

        // Initialize Zoom slider with the relative scale
        setZoom(Math.round((scale / scaleFactor) * 100));
        setRotation(0);

        // Listen for user modifications to update UI control states
        canvas.on('object:scaling', () => updateControlStates(userImg));
        canvas.on('object:moving', () => updateControlStates(userImg));
        canvas.on('object:rotating', () => updateControlStates(userImg));
      }, { crossOrigin: 'anonymous' });
    }, { crossOrigin: 'anonymous' });
  };

  /**
   * Sync sliders with direct canvas actions
   */
  const updateControlStates = (userImg) => {
    // Rotation
    setRotation(Math.round(userImg.angle || 0));
    // Zoom relative to the template dimension (accounting for canvas display scale)
    const scale = userImg.scaleX || 1;
    const scaleFactor = fabricCanvasRef.current?.scaleFactor || 1;
    setZoom(Math.round((scale / scaleFactor) * 100));
  };

  /**
   * Control Handlers for the sidebar
   */
  const handleZoomChange = (e) => {
    const val = parseFloat(e.target.value);
    setZoom(val);
    if (userPhotoRef.current && fabricCanvasRef.current) {
      const scaleFactor = fabricCanvasRef.current.scaleFactor || 1;
      const scale = (val / 100) * scaleFactor;
      userPhotoRef.current.set({
        scaleX: scale,
        scaleY: scale
      });
      userPhotoRef.current.setCoords();
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleRotationChange = (e) => {
    const val = parseInt(e.target.value);
    setRotation(val);
    if (userPhotoRef.current && fabricCanvasRef.current) {
      userPhotoRef.current.set('angle', val);
      userPhotoRef.current.setCoords();
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleFlipHorizontal = () => {
    if (userPhotoRef.current && fabricCanvasRef.current) {
      userPhotoRef.current.set('flipX', !userPhotoRef.current.flipX);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleFlipVertical = () => {
    if (userPhotoRef.current && fabricCanvasRef.current) {
      userPhotoRef.current.set('flipY', !userPhotoRef.current.flipY);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleResetControls = () => {
    if (userPhotoRef.current && fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      const scaleFactor = canvas.scaleFactor || 1;
      const targetHeight = canvas.height * 0.75;
      const scale = targetHeight / userPhotoRef.current.height;

      userPhotoRef.current.set({
        left: canvas.width * 0.1,
        top: canvas.height * 0.15,
        scaleX: scale,
        scaleY: scale,
        angle: 0,
        flipX: false,
        flipY: false
      });
      userPhotoRef.current.setCoords();
      canvas.setActiveObject(userPhotoRef.current);
      canvas.renderAll();

      setZoom(Math.round((scale / scaleFactor) * 100));
      setRotation(0);
    }
  };

  /**
   * Helper function to trigger browser download
   */
  const triggerDownload = (dataUrl, filename) => {
    const downloadLink = document.createElement('a');
    downloadLink.href = dataUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  /**
   * Phase 4: Exports the canvas, merges the layers, and downloads via a programmatically triggered link click.
   * Supports PNG, JPG, and PDF formats.
   */
  const handleExport = () => {
    if (!fabricCanvasRef.current) return;

    // Deselect any active objects so selection borders do not render on exported image
    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();

    const canvas = fabricCanvasRef.current;
    const scaleFactor = canvas.scaleFactor || 1;
    const multiplier = 1 / scaleFactor;

    if (exportFormat === 'PNG') {
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: multiplier,
      });
      triggerDownload(dataUrl, 'virionza-immunity-poster.png');
    } else if (exportFormat === 'JPG') {
      const dataUrl = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.95,
        multiplier: multiplier,
      });
      triggerDownload(dataUrl, 'virionza-immunity-poster.jpg');
    } else if (exportFormat === 'PDF') {
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: multiplier,
      });

      // Dynamically load jsPDF to optimize bundle size
      import('jspdf').then(({ jsPDF }) => {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.naturalWidth || canvas.width, canvas.naturalHeight || canvas.height]
        });

        pdf.addImage(dataUrl, 'PNG', 0, 0, canvas.naturalWidth || canvas.width, canvas.naturalHeight || canvas.height);
        pdf.save('virionza-immunity-poster.pdf');

        // Re-select the user image for editor convenience
        if (userPhotoRef.current) {
          canvas.setActiveObject(userPhotoRef.current);
          canvas.renderAll();
        }
      }).catch(err => {
        console.error("Failed to load jsPDF dynamically:", err);
        alert("Failed to export PDF. Please try again or download as PNG.");
      });
      return; // Skip standard download cleanups as they are handled inside promise
    }

    // Re-select the user image for editor convenience
    if (userPhotoRef.current) {
      canvas.setActiveObject(userPhotoRef.current);
      canvas.renderAll();
    }
  };

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="header-container">
          <div
            onClick={() => {
              if (phase === 'AUTH' || phase === 'ADMIN_DASHBOARD') {
                setPhase('TEMPLATE_SELECT');
              } else if (phase === 'STUDIO') {
                if (confirm('Are you sure you want to go back? Your current canvas adjustments will be lost.')) {
                  setPhase('TEMPLATE_SELECT');
                }
              } else if (phase !== 'TEMPLATE_SELECT') {
                setPhase('TEMPLATE_SELECT');
              }
            }}
            className="logo-wrap"
            style={{ cursor: phase !== 'TEMPLATE_SELECT' ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
          >
            <img
              src="/logo.png"
              alt="Visole"
              style={{ height: '38px', width: 'auto', display: 'block', objectFit: 'contain' }}
            />
          </div>
          <div className="header-info" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {user ? (
              <>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Hello, <strong>{user.name}</strong>
                </span>
                {user.role === 'admin' && phase !== 'ADMIN_DASHBOARD' && (
                  <button
                    onClick={() => setPhase('ADMIN_DASHBOARD')}
                    className="btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: 'rgba(242, 122, 24, 0.4)', color: 'var(--primary)', margin: 0 }}
                  >
                    Admin Dashboard
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', margin: 0 }}
                >
                  Log Out
                </button>
              </>
            ) : (
              phase !== 'AUTH' && (
                <button
                  onClick={() => setPhase('AUTH')}
                  className="btn-primary"
                  style={{ padding: '0.4rem 1rem', fontSize: '0.75rem', margin: 0 }}
                >
                  Admin Login
                </button>
              )
            )}

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`app-content${phase === 'ADMIN_DASHBOARD' ? ' app-content--full' : ''}`}>

        {/* PHASE: AUTH */}
        {phase === 'AUTH' && (
          <div className="upload-hero" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ textAlign: 'left', marginBottom: '1.5rem', width: '100%', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
              <button
                onClick={() => setPhase('TEMPLATE_SELECT')}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <ArrowLeft size={16} />
                <span>Back to Template Gallery</span>
              </button>
            </div>
            <Auth onAuthSuccess={handleAuthSuccess} />
          </div>
        )}

        {/* PHASE: TEMPLATE SELECT */}
        {phase === 'TEMPLATE_SELECT' && (
          <TemplateSelect
            user={user}
            token={token}
            onSelectTemplate={handleSelectTemplate}
            onOpenAdmin={() => setPhase('ADMIN_DASHBOARD')}
            onLogout={handleLogout}
          />
        )}

        {/* PHASE: ADMIN DASHBOARD */}
        {phase === 'ADMIN_DASHBOARD' && (
          <AdminDashboard
            token={token}
            onClose={() => setPhase('TEMPLATE_SELECT')}
          />
        )}

        {/* PHASE 1: Upload Panel */}
        {phase === 'UPLOAD' && (
          <div className="upload-hero">

            {/* Back to Gallery */}
            <div style={{ textAlign: 'left', marginBottom: '1.5rem', width: '100%', maxWidth: '640px', margin: '0 auto 1.5rem auto' }}>
              <button
                onClick={() => setPhase('TEMPLATE_SELECT')}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              >
                <ArrowLeft size={16} />
                <span>Choose Different Template</span>
              </button>
            </div>

            <div className="hero-tag">
              <Sparkles size={14} />
              <span>Next-Gen Client-Side AI</span>
            </div>
            <h1>Upload Your Photo</h1>
            <p>
              Applying template: <strong>{selectedTemplate?.title || 'Default Vaccine Frame'}</strong>.
              <br />
              Upload your portrait, and our client-side neural AI will isolate your background instantly.
            </p>

            {errorMsg && (
              <div className="glass-panel" style={{ borderColor: '#fecaca', background: '#fef2f2', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#991b1b', fontSize: '0.9rem', textAlign: 'left' }}>
                <AlertCircle size={20} style={{ flexShrink: 0, color: '#ef4444' }} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div
              className="glass-panel drop-zone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <input
                id="fileInput"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div className="drop-zone-icon">
                <UploadCloud size={40} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Drag and drop your photo here</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>or click to browse local files</span>
              </div>
              <button className="btn-upload">Select Image</button>
            </div>
          </div>
        )}

        {/* PHASE 1/2: Processing Loader */}
        {phase === 'PROCESSING' && (
          <div className="glass-panel spinner-container">
            <div className="pulse-circle">
              <div className="spinner-ring"></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <span className="loading-text">{loadingStep}</span>
              <span className="loading-sub">Do not close this tab. Processing is performed locally on your device.</span>
              <div className="loading-progress-bar">
                <div
                  className="loading-progress-fill"
                  style={{ width: `${percentProgress}%`, animation: 'none', transition: 'width 0.4s ease' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 3: Design Studio */}
        {phase === 'STUDIO' && (
          <div className="studio-layout">

            {/* Design Workspace */}
            <div className="canvas-wrapper">
              <div className="canvas-badge" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '90%', margin: '0 auto 0.75rem auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="badge-dot"></span>
                  <span style={{ fontWeight: 600 }}>Design Studio Active</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Template: <strong>{selectedTemplate?.title || 'Default'}</strong>
                </div>
              </div>
              <canvas ref={canvasRef} id="canvas" />
            </div>

            {/* Editing Controls Panel */}
            <div className="glass-panel control-panel">
              <div className="panel-section">
                <h3 className="section-title">
                  <Layers size={16} />
                  <span>Layer Controls</span>
                </h3>
                <div className="instruction-box">
                  <Info size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <p className="instruction-text">
                    The background frame is fixed. You can <strong>drag, scale, rotate</strong>, and position your isolated user cutout.
                  </p>
                </div>
              </div>

              <div className="panel-divider"></div>

              {/* Adjustments */}
              <div className="panel-section">
                <h3 className="section-title">Adjust Photo</h3>

                {/* Scale (Zoom) Slider */}
                <div className="control-group">
                  <div className="control-label">
                    <span>Scale Size</span>
                    <span className="control-value">{zoom}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    value={zoom}
                    onChange={handleZoomChange}
                    className="range-input"
                  />
                </div>

                {/* Rotation Slider */}
                <div className="control-group" style={{ marginTop: '0.5rem' }}>
                  <div className="control-label">
                    <span>Rotate Angle</span>
                    <span className="control-value">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={rotation}
                    onChange={handleRotationChange}
                    className="range-input"
                  />
                </div>
              </div>

              <div className="panel-divider"></div>

              {/* Quick Actions */}
              <div className="panel-section">
                <h3 className="section-title">Quick Actions</h3>
                <div className="button-grid">
                  <button onClick={handleFlipHorizontal} className="btn-secondary">
                    <FlipHorizontal size={16} />
                    <span>Flip H</span>
                  </button>
                  <button onClick={handleFlipVertical} className="btn-secondary">
                    <FlipVertical size={16} />
                    <span>Flip V</span>
                  </button>
                </div>
                <button onClick={handleResetControls} className="btn-secondary" style={{ width: '100%', marginTop: '0.25rem' }}>
                  <RefreshCw size={16} />
                  <span>Reset Alignment</span>
                </button>
              </div>

              <div className="panel-divider"></div>

              {/* Export Panel */}
              <div className="panel-section" style={{ marginTop: 'auto' }}>
                <h3 className="section-title">Export Options</h3>

                {/* Format Selector Tab Group */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.03)', padding: '0.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '0.25rem' }}>
                  {['PNG', 'JPG', 'PDF'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      style={{
                        flex: 1,
                        background: exportFormat === fmt ? 'var(--primary)' : 'transparent',
                        color: exportFormat === fmt ? 'white' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>

                <button onClick={handleExport} className="btn-primary">
                  <Download size={18} />
                  <span>Download as .{exportFormat.toLowerCase()}</span>
                </button>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to change your photo? Your current canvas adjustments will be lost.')) {
                        setPhase('UPLOAD');
                        setErrorMsg('');
                      }
                    }}
                    className="btn-secondary"
                    style={{ flex: 1.2, fontSize: '0.8rem', padding: '0.6rem 0.4rem' }}
                  >
                    <span>Change Photo</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to exit to gallery? Your progress on this canvas will be lost.')) {
                        setPhase('TEMPLATE_SELECT');
                      }
                    }}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem 0.4rem' }}
                  >
                    <span>Back to Gallery</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="app-footer">© 2026 Visole Poster Studio. Powered by GMS.
        <p></p>
      </footer>
    </>
  );
}

export default App;
