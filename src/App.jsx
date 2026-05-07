import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { 
  Bus, LogOut, User, Shield, CreditCard, Clock, CheckCircle, 
  ChevronRight, AlertCircle, Calendar, Download, Menu, X, 
  Clipboard, Ticket, MapPin, Search, Loader2, Sparkles, TrendingUp, Users, Check,
  Zap, Smartphone, BarChart3, Filter, FileText, UserCheck, XCircle, MessageSquare
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line 
} from 'recharts'
// NOTE: BarChart (recharts chart component) and BarChart3 (lucide icon) are intentionally separate
import { dbService } from './services/db'
import './App.css'

// --- REUSABLE COMPONENTS ---

const Spinner = ({ size = 20, className = "" }) => (
  <Loader2 size={size} className={`animate-spin ${className}`} />
)

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type} animate-fade-in`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
      <span>{message}</span>
    </div>
  );
};

const ProtectedRoute = ({ children, allowedRole = null }) => {
  const user = dbService.getCurrentUser();
  if (!user) return <Navigate to="/login" />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" />;
  return children;
};

// --- REJECTION MODAL ---

const RejectModal = ({ pass, onConfirm, onClose }) => {
  const [reason, setReason] = useState('')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <XCircle size={22} color="#ef4444" /> Reject Application
          </h2>
          <button onClick={onClose} style={{ color: '#94a3b8' }}><X size={20} /></button>
        </div>
        
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Applicant</p>
          <p style={{ fontWeight: '700', marginBottom: '0.25rem' }}>{pass.userName}</p>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{pass.passType} — {pass.userEmail}</p>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <MessageSquare size={16} /> Reason for Rejection <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea 
            placeholder="e.g., Incomplete documentation, invalid student ID, address mismatch..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            style={{ resize: 'vertical', minHeight: '80px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={onClose} className="glass-btn" style={{ flex: 1, padding: '0.75rem' }}>Cancel</button>
          <button 
            onClick={() => { if (reason.trim()) onConfirm(reason.trim()) }}
            disabled={!reason.trim()}
            className="btn-primary" 
            style={{ flex: 1, padding: '0.75rem', background: reason.trim() ? '#ef4444' : '#334155', boxShadow: reason.trim() ? '0 4px 12px rgba(239,68,68,0.3)' : 'none' }}
          >
            Confirm Rejection
          </button>
        </div>
      </div>
    </div>
  )
}

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const conductor = dbService.getConductorSession();

  const handleAllLogout = () => {
    if (conductor) {
      dbService.conductorLogout();
      navigate('/conductor');
    } else {
      onLogout();
    }
  }

  const activeUser = user || conductor;

  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to={user?.role === 'admin' ? '/admin' : '/'} className="logo">
          <Sparkles size={28} className="text-secondary" />
          <span>TransitPass</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div className="desktop-only" style={{ gap: '1.5rem' }}>
            {user?.role === 'admin' ? (
              <>
                <Link to="/admin" className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}>Dashboard</Link>
                <Link to="/admin/applications" className={`nav-link ${location.pathname.includes('/applications') ? 'active' : ''}`}>Applications</Link>
                <Link to="/admin/users" className={`nav-link ${location.pathname.includes('/users') ? 'active' : ''}`}>Users</Link>
              </>
            ) : user?.role === 'user' ? (
              <>
                <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
                <Link to="/apply" className={`nav-link ${location.pathname === '/apply' ? 'active' : ''}`}>Apply Pass</Link>
                <Link to="/my-pass" className={`nav-link ${location.pathname === '/my-pass' ? 'active' : ''}`}>My Pass</Link>
              </>
            ) : conductor ? (
               <Link to="/conductor/verify" className={`nav-link active`}>Verification Portal</Link>
            ) : (
              <Link to="/" className="nav-link">Explore</Link>
            )}
          </div>

          {activeUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="desktop-only" style={{ flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>{activeUser.name || activeUser.fullName}</span>
                <span style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: '800', letterSpacing: '1px' }}>{conductor ? 'CONDUCTOR' : activeUser.role.toUpperCase()}</span>
              </div>
              <button onClick={handleAllLogout} className="logout-btn" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}>Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// --- PAGES ---

const LoginPage = ({ onLogin, showToast }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { document.title = 'Login — TransitPass' }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const data = await dbService.loginUser(email, password)
      onLogin(data.user)
      showToast('Welcome back!', 'success')
      if (data.user.role === 'admin') navigate('/admin')
      else navigate('/')
    } catch (err) { 
      showToast(err.message, 'error') 
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-form-container">
      <div className="glass-card auth-card animate-fade-in">
        <div className="auth-card-content">
          <div className="auth-tabs">
            <div className="auth-tab active">Login</div>
            <Link to="/register" className="auth-tab">Register</Link>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Email / Username</label>
              <input type="text" placeholder="admin or email@example.com" required onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" required onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? <><Spinner size={18} /> Logging in...</> : 'Continue'}
            </button>
            
            <div className="admin-demo-box">
              <p>For Demo — Admin: <strong>admin</strong> / <strong>password@123</strong></p>
              <p>Conductor Portal: <Link to="/conductor" style={{ color: 'var(--primary)', fontWeight: '700' }}>Access Here</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const RegisterPage = ({ onLogin, showToast }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { document.title = 'Register — TransitPass' }, [])

  const handleRegister = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const data = await dbService.registerUser(formData)
      showToast('Account created successfully!', 'success')
      if (data.user) onLogin(data.user)
      navigate('/')
    } catch (err) { 
      showToast(err.message, 'error') 
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-form-container">
      <div className="glass-card auth-card animate-fade-in">
        <div className="auth-card-content">
          <div className="auth-tabs">
            <Link to="/login" className="auth-tab">Login</Link>
            <div className="auth-tab active">Register</div>
          </div>
          
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" required onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" required onChange={e => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Password (Min 6 chars)</label>
              <input type="password" required minLength="6" onChange={e => setFormData({...formData, password: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? <><Spinner size={18} /> Creating Account...</> : 'Create Free Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

const UserHomePage = () => {
  const navigate = useNavigate();
  const user = dbService.getCurrentUser();

  useEffect(() => { document.title = 'TransitPass — Digital Bus Registration' }, [])

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content animate-fade-in">
            <div className="badge-pill">🚀 REVOLUTIONIZING CITY TRANSIT</div>
            <h1 className="hero-title">
              The Future of <br />
              <span className="text-secondary">Bus Travel</span> is Here.
            </h1>
            <p className="hero-subtitle">
              Get your official digital pass in minutes. Secure, eco-friendly, and always in your pocket. No more physical cards, no more queues.
            </p>
            <div className="hero-actions">
              {user ? (
                <Link to="/apply" className="btn-primary">Go to Dashboard <ChevronRight size={20} /></Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary">Apply Now <ChevronRight size={20} /></Link>
                  <Link to="/login" className="glass-btn">Member Login</Link>
                </>
              )}
            </div>
          </div>
          <div className="hero-visual animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="visual-card">
              <img src="/hero.png" alt="Digital Pass" className="hero-main-img" />
              <div className="floating-badge fb-1"><Ticket size={16} /> Student Pass Approved</div>
              <div className="floating-badge fb-2"><Shield size={16} /> Secure Verification</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Digital?</h2>
            <p>Experience the most efficient transit management system</p>
          </div>
          <div className="responsive-grid">
            {[
              { icon: Zap, title: "Instant Approval", desc: "No more waiting for days. Get your pass verified swiftly." },
              { icon: Shield, title: "Fraud Proof", desc: "Encoded unique IDs and QR-ready verification for security." },
              { icon: Smartphone, title: "Always Ready", desc: "Access your pass offline anytime from your account." },
              { icon: BarChart3, title: "Smart Tracking", desc: "Real-time validity counting and automatic expiry alerts." }
            ].map((f, i) => (
              <div key={i} className="glass-card feature-card">
                <div className="feat-icon"><f.icon size={24} /></div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Conductor CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="glass-card cta-card">
             <div className="cta-content">
                <h2>Transit Authority?</h2>
                <p>Log in to the Conductor Portal to verify passenger passes in real-time using our encrypted scanning tool.</p>
                <Link to="/conductor" className="btn-secondary">Conductor Portal <Shield size={18} /></Link>
             </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="categories-section">
        <div className="container">
           <div className="section-header">
              <h2>Options for Everyone</h2>
              <p>Tailored pass categories for every citizen</p>
           </div>
           <div className="responsive-grid">
              <div className="glass-card cat-card">
                 <div className="cat-tag">CONCESSION</div>
                 <h3>Student Pass</h3>
                 <p>Special subsidized rates for scholars and university students.</p>
              </div>
              <div className="glass-card cat-card">
                 <div className="cat-tag">POPULAR</div>
                 <h3>General Pass</h3>
                 <p>Standard monthly and quarterly passes for daily commuters.</p>
              </div>
              <div className="glass-card cat-card">
                 <div className="cat-tag">FREE</div>
                 <h3>Senior Citizen</h3>
                 <p>Zero-cost or discounted travel for our valued elders.</p>
              </div>
           </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
           <div className="footer-content">
              <span className="logo" style={{ marginBottom: '1rem' }}><Bus size={24} /> TransitPass</span>
              <p>© 2026 TransitPass Technologies. Empowering Urban Mobility.</p>
           </div>
        </div>
      </footer>
    </div>
  )
}

const ApplyPassPage = ({ showToast }) => {
  const [formData, setFormData] = useState({ fullName: '', email: '', phone: '', passType: 'General Pass', startDate: '', duration: 1 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expiryPreview, setExpiryPreview] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Apply Pass — TransitPass'
    const draft = sessionStorage.getItem('passDraft')
    if (draft) {
      setFormData(JSON.parse(draft))
      showToast('Restored your draft', 'info')
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('passDraft', JSON.stringify(formData))
    if (formData.startDate) {
      setExpiryPreview(dbService.calculateExpiry(formData.startDate, formData.duration))
    }
  }, [formData])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await dbService.submitPass(formData)
      sessionStorage.removeItem('passDraft')
      showToast('Application submitted successfully!', 'success')
      navigate('/my-pass')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container" style={{ padding: '40px 0 100px' }}>
      <div className="glass-card form-card animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Apply for Transit Pass</h2>
          <p style={{ color: '#94a3b8' }}>Fill in the details below to generate your digital ID</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Pass Category</label>
              <select value={formData.passType} onChange={e => setFormData({...formData, passType: e.target.value})}>
                <option>Student Pass (Concession)</option>
                <option>General Pass</option>
                <option>Senior Citizen Pass</option>
                <option>Ladies Special Pass</option>
                <option>Employee Pass</option>
              </select>
            </div>
            <div className="form-group">
              <label>Effective Date</label>
              <input type="date" required value={formData.startDate} min={new Date().toISOString().split('T')[0]} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>Pass Duration</label>
            <div className="toggle-group">
              <button type="button" className={`toggle-btn ${formData.duration == 1 ? 'active' : ''}`} onClick={() => setFormData({...formData, duration: 1})}>1 Month</button>
              <button type="button" className={`toggle-btn ${formData.duration == 3 ? 'active' : ''}`} onClick={() => setFormData({...formData, duration: 3})}>3 Months (Save 10%)</button>
            </div>
          </div>

          <div className="preview-card">
            <div className="preview-icon"><Calendar size={20} /></div>
            <div className="preview-content">
              {formData.startDate ? (
                <p>Pass valid from: <span>{new Date(formData.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span> → <span>{new Date(expiryPreview).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span> ({formData.duration} Month{formData.duration > 1 ? 's' : ''})</p>
              ) : (
                <p style={{ color: '#94a3b8' }}>Select an effective date to see pass validity</p>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '2rem' }} disabled={isSubmitting}>
            {isSubmitting ? <><Spinner size={20} /> Processing...</> : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}

const MyPassPage = ({ showToast }) => {
  const [passes, setPasses] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    document.title = 'My Passes — TransitPass'
    const fetchPasses = async () => {
      try {
        const data = await dbService.getUserPasses()
        setPasses(data)
      } catch (err) { showToast(err.message, 'error') }
      finally { setIsLoading(false) }
    }
    fetchPasses()
  }, [])

  if (isLoading) return <div className="container" style={{ padding: '10rem', textAlign: 'center' }}><Spinner size={40} className="text-primary" /></div>

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 120px' }}>
      <h2 style={{ marginBottom: '2rem' }}>My Registered Passes</h2>
      <div className="responsive-grid">
        {passes.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1/-1', padding: '5rem', textAlign: 'center' }}>
            <CreditCard size={48} className="text-muted" style={{ margin: '0 auto 1.5rem', opacity: 0.3 }} />
            <p style={{ color: '#94a3b8' }}>No recorded passes found.</p>
            <Link to="/apply" className="btn-primary" style={{ marginTop: '1.5rem', display: 'inline-flex' }}>Apply Now</Link>
          </div>
        ) : (
          passes.map(pass => (
            <div key={pass.id} className="glass-card pass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{pass.passType} Pass</h3>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {pass.passId || pass.id.split('_')[1]}</p>
                </div>
                <span className={`status-badge status-${pass.status}`}>{pass.status}</span>
              </div>
              
              <div className="grid-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', gap: '1rem' }}>
                 <div>
                    <p className="label">HOLDER</p>
                    <p className="val">{pass.fullName}</p>
                 </div>
                 <div>
                    <p className="label">VALID UNTIL</p>
                    <p className="val">{new Date(pass.expiryDate).toLocaleDateString()}</p>
                 </div>
              </div>

              {/* Show rejection reason if pass was rejected */}
              {pass.status === 'rejected' && pass.rejectionReason && (
                <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: '700', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>REJECTION REASON</p>
                  <p style={{ fontSize: '0.85rem', color: '#fca5a5' }}>{pass.rejectionReason}</p>
                </div>
              )}

              {pass.status === 'approved' && (
                <button 
                  className="btn-primary" 
                  style={{ marginTop: 'auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}
                  onClick={() => {
                    showToast('Generating PDF Pass...', 'success')
                    setTimeout(() => window.print(), 1000)
                  }}
                >
                  <Download size={18} /> Download
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// --- ADMIN PAGES (Separated) ---

// Admin Overview — Analytics Dashboard
const AdminOverview = ({ passes, users }) => {
  const stats = [
    { label: 'Total Citizens', val: users.length, icon: Users, color: '#6366f1' },
    { label: 'Total Apps', val: passes.length, icon: CreditCard, color: '#ec4899' },
    { label: 'Approved', val: passes.filter(p => p.status === 'approved' || p.status === 'active').length, icon: CheckCircle, color: '#10b981' },
    { label: 'Pending', val: passes.filter(p => p.status === 'pending').length, icon: Clock, color: '#f59e0b' },
  ]

  const categoryData = Array.from(new Set(passes.map(p => p.passType))).map(type => ({
      name: type.split(' ')[0],
      count: passes.filter(p => p.passType === type).length
  }))

  const statusData = [
    { name: 'Approved', value: passes.filter(p => ['approved','active','upcoming','expired'].includes(p.status)).length },
    { name: 'Pending', value: passes.filter(p => p.status === 'pending').length },
    { name: 'Declined', value: passes.filter(p => p.status === 'rejected').length }
  ]

  const recentPasses = passes.slice(0, 5)

  return (
    <>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Admin Command Center</h1>
        <p style={{ color: '#94a3b8' }}>Monitor and manage city-wide transit operations</p>
      </div>

      <div className="stat-grid animate-fade-in">
        {stats.map((s, i) => (
          <div key={i} className="glass-card stat-card" style={{ borderLeft: `4px solid ${s.color}` }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>{s.label.toUpperCase()}</span>
                <s.icon size={20} style={{ color: s.color }} />
             </div>
             <p style={{ fontSize: '1.75rem', fontWeight: '800' }}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid-2 animate-fade-in" style={{ marginTop: '2rem' }}>
         <div className="glass-card" style={{ padding: '1.5rem', height: '300px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Applications by Category</h3>
            <ResponsiveContainer width="100%" height="80%">
               <BarChart data={categoryData}>
                  <XAxis dataKey="name" fontSize={10} stroke="#475569" />
                  <ChartTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{background: '#1e293b', border: 'none', borderRadius: '8px'}} />
                  <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
               </BarChart>
            </ResponsiveContainer>
         </div>
         <div className="glass-card" style={{ padding: '1.5rem', height: '300px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Overall Approval Rate</h3>
            <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#10b981" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                  </Pie>
                  <ChartTooltip />
                </PieChart>
            </ResponsiveContainer>
         </div>
      </div>

      {/* Quick recent list */}
      <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Ticket className="text-secondary" size={18} /> Recent Applications</h3>
          <Link to="/admin/applications" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '600' }}>View All →</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {recentPasses.map(pass => (
            <div key={pass.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
              <div>
                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{pass.userName}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '0.75rem' }}>{pass.passType}</span>
              </div>
              <span className={`status-badge status-${pass.status}`}>{pass.status}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// Admin Applications — Full table with search/filter
const AdminApplications = ({ passes, onStatusUpdate, showToast }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [rejectTarget, setRejectTarget] = useState(null) // pass object for modal

  const categories = [...new Set(passes.map(p => p.passType))]
  
  const filtered = passes.filter(p => {
    const matchSearch = !searchTerm || 
      p.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.passId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    const matchCategory = filterCategory === 'all' || p.passType === filterCategory
    return matchSearch && matchStatus && matchCategory
  })

  const handleReject = async (reason) => {
    if (!rejectTarget) return
    try {
      await dbService.updatePassStatus(rejectTarget.id, 'rejected', reason)
      showToast(`Application rejected with reason`, 'success')
      onStatusUpdate()
    } catch (err) { showToast(err.message, 'error') }
    setRejectTarget(null)
  }

  const handleApprove = async (passId) => {
    try {
      await dbService.updatePassStatus(passId, 'approved')
      showToast('Pass approved successfully', 'success')
      onStatusUpdate()
    } catch (err) { showToast(err.message, 'error') }
  }

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Application Management</h1>
        <p style={{ color: '#94a3b8' }}>Review, approve, or reject pass applications</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="admin-filter-bar">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name, email, or Pass ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
          <div className="filter-selects">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          Showing <strong style={{ color: '#fff' }}>{filtered.length}</strong> of {passes.length} applications
          {searchTerm && <> matching "<strong style={{ color: 'var(--primary)' }}>{searchTerm}</strong>"</>}
        </div>
      </div>

      {/* Table (Desktop) */}
      <div className="glass-card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
        <div className="table-container desktop-only">
          <table style={{ minWidth: '900px' }}>
            <thead>
              <tr style={{ color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                <th style={{ textAlign: 'left' }}>Applicant</th>
                <th style={{ textAlign: 'left' }}>Pass ID</th>
                <th style={{ textAlign: 'left' }}>Category</th>
                <th style={{ textAlign: 'left' }}>Dates</th>
                <th style={{ textAlign: 'left' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No applications match your filters</td></tr>
              ) : filtered.map(pass => (
                <tr key={pass.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{pass.userName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{pass.userEmail}</div>
                  </td>
                  <td><code style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{pass.passId}</code></td>
                  <td><span style={{ fontSize: '0.85rem' }}>{pass.passType}</span></td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>{new Date(pass.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>→ {new Date(pass.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</div>
                  </td>
                  <td><span className={`status-badge status-${pass.status}`}>{pass.status}</span></td>
                  <td>
                    {pass.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="action-btn approve-btn" onClick={() => handleApprove(pass.id)} title="Approve">
                          <CheckCircle size={18} color="#10b981" />
                        </button>
                        <button className="action-btn reject-btn" onClick={() => setRejectTarget(pass)} title="Reject">
                          <X size={18} color="#ef4444" />
                        </button>
                      </div>
                    ) : pass.status === 'rejected' && pass.rejectionReason ? (
                      <span title={pass.rejectionReason} style={{ fontSize: '0.7rem', color: '#94a3b8', cursor: 'help' }}>
                        <MessageSquare size={14} style={{ verticalAlign: 'middle' }} /> Reason noted
                      </span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-only">
          <div className="mobile-stack">
            {filtered.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No applications match your filters</p>
            ) : filtered.map(pass => (
              <div key={pass.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ fontWeight: '700' }}>{pass.userName}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{pass.userEmail}</div>
                  </div>
                  <span className={`status-badge status-${pass.status}`}>{pass.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{pass.passType}</div>
                <code style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>{pass.passId}</code>

                {pass.status === 'rejected' && pass.rejectionReason && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.06)', borderRadius: '8px', fontSize: '0.8rem', color: '#fca5a5' }}>
                    <strong style={{ fontSize: '0.65rem', color: '#ef4444' }}>REASON: </strong>{pass.rejectionReason}
                  </div>
                )}

                {pass.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button onClick={() => handleApprove(pass.id)} className="btn-primary" style={{ flex: 1, padding: '0.6rem', fontSize: '0.8rem' }}>Approve</button>
                    <button onClick={() => setRejectTarget(pass)} style={{ flex: 1, color: '#ef4444', fontWeight: '600', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px' }}>Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectTarget && (
        <RejectModal 
          pass={rejectTarget}
          onConfirm={handleReject}
          onClose={() => setRejectTarget(null)}
        />
      )}
    </>
  )
}

// Admin Users — User directory with search
const AdminUserList = ({ users, passes }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = users.filter(u => {
    if (!searchTerm) return true
    return u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getPassCount = (userId) => passes.filter(p => p.userId === userId).length

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Registered Citizens</h1>
        <p style={{ color: '#94a3b8' }}>Complete directory of all registered users</p>
      </div>

      {/* Search */}
      <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#94a3b8' }}>
          Showing <strong style={{ color: '#fff' }}>{filtered.length}</strong> of {users.length} citizens
        </div>
      </div>

      {/* User Grid */}
      <div className="responsive-grid">
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1/-1', padding: '4rem', textAlign: 'center' }}>
            <Users size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p style={{ color: '#94a3b8' }}>No users match your search</p>
          </div>
        ) : (
          filtered.map(user => (
            <div key={user.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="user-avatar">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: '700', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--primary)' }}>{getPassCount(user.id)}</p>
                <p style={{ fontSize: '0.6rem', color: '#94a3b8', letterSpacing: '0.5px' }}>PASSES</p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}

// Admin Layout — Wraps all admin pages, handles shared data
const AdminLayout = ({ showToast }) => {
  const [passes, setPasses] = useState([])
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  const fetchData = async () => {
    try {
      const [p, u] = await Promise.all([dbService.getAllPasses(), dbService.getAllUsers()])
      setPasses(p); setUsers(u)
    } catch (err) { showToast(err.message, 'error') }
    finally { setIsLoading(false) }
  }

  useEffect(() => {
    document.title = 'Admin — TransitPass'
    fetchData()
  }, [])

  if (isLoading) return <div className="container" style={{ padding: '10rem', textAlign: 'center' }}><Spinner size={40} className="text-primary" /></div>

  // Determine which admin page to show based on path
  const path = location.pathname

  return (
    <div className="container dashboard-container">
      {path.includes('/applications') ? (
        <AdminApplications passes={passes} onStatusUpdate={fetchData} showToast={showToast} />
      ) : path.includes('/users') ? (
        <AdminUserList users={users} passes={passes} />
      ) : (
        <AdminOverview passes={passes} users={users} />
      )}
    </div>
  )
}

const ConductorLoginPage = ({ showToast }) => {
  const [formData, setFormData] = useState({ id: '', pin: '' })
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => { document.title = 'Conductor Login — TransitPass' }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await dbService.conductorLogin(formData.id, formData.pin)
      showToast('Conductor verified', 'success')
      navigate('/conductor/verify')
    } catch (err) { showToast(err.message, 'error') }
    finally { setIsLoading(false) }
  }

  return (
    <div className="auth-form-container">
      <div className="glass-card auth-card animate-fade-in" style={{ padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="success-icon-wrapper" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>
            <Shield size={32} />
          </div>
          <h2>Conductor Portal</h2>
          <p style={{ color: '#94a3b8' }}>Secure access for transit verification</p>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label>Conductor ID</label>
            <input type="text" placeholder="COND001" required onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
          </div>
          <div className="form-group">
            <label>PIN Code</label>
            <input type="password" placeholder="••••" required onChange={e => setFormData({...formData, pin: e.target.value})} />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isLoading}>
            {isLoading ? <><Spinner size={18} /> Verifying...</> : 'Login to Portal'}
          </button>
          <div className="admin-demo-box">
            <p>Demo — ID: <strong>COND001</strong> / PIN: <strong>1234</strong></p>
          </div>
        </form>
      </div>
    </div>
  )
}

const ConductorDashboard = ({ showToast }) => {
  const [passId, setPassId] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const [isVerifying, setIsVerifying] = useState(false)
  const session = dbService.getConductorSession()
  const navigate = useNavigate()

  useEffect(() => {
    document.title = 'Verification Portal — TransitPass'
    const saved = JSON.parse(sessionStorage.getItem('conductor_history') || '[]')
    setHistory(saved)
  }, [])

  const handleVerify = async (e) => {
    if (e) e.preventDefault()
    if (!passId.trim()) return
    setIsVerifying(true)
    
    try {
      const res = await dbService.verifyPass(passId)
      setResult(res)
      
      const newEntry = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id: passId.toUpperCase(),
        name: res.pass?.fullName || 'N/A',
        result: res.result
      }
      
      const updated = [newEntry, ...history].slice(0, 20)
      setHistory(updated)
      sessionStorage.setItem('conductor_history', JSON.stringify(updated))
      showToast(`Verification complete: ${res.result}`, res.result === 'ACTIVE' ? 'success' : 'info')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setIsVerifying(false)
    }
  }

  if (!session) return <Navigate to="/conductor" />

  return (
    <div className="container" style={{ padding: '2rem 1.25rem 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
         <div>
            <h1>Transit Verification</h1>
            <p style={{ color: '#94a3b8' }}>{session.name} • {session.route}</p>
         </div>
         <button onClick={() => {dbService.conductorLogout(); navigate('/conductor')}} className="logout-btn">
            <X size={20} />
         </button>
      </div>

      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <form onSubmit={handleVerify} className="mobile-stack">
           <input 
             type="text" placeholder="Enter ID (e.g. TP-GN...)" 
             value={passId} onChange={e => setPassId(e.target.value.toUpperCase())}
             className="verify-input" style={{ flex: 1 }}
           />
           <button type="submit" className="btn-primary" disabled={isVerifying} style={{ minWidth: '150px' }}>
             {isVerifying ? <Spinner size={20} /> : 'Verify Status'}
           </button>
        </form>

        {result && (
          <div className={`result-card result-${result.result.toLowerCase()} animate-fade-in`} style={{ marginTop: '2rem' }}>
             <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '15px' }}>
                   {result.result === 'ACTIVE' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                </div>
                <div>
                   <h2 style={{ textTransform: 'uppercase' }}>{result.result}</h2>
                   <p style={{ opacity: 0.8 }}>Holder: {result.pass?.fullName || 'Unknown'}</p>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: '1.5rem' }}>
         <h3 style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.8rem' }}>RECENT VERIFICATIONS</h3>
         <div className="history-list">
            {history.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#475569', fontSize: '0.85rem' }}>No verifications yet this session</p>
            ) : history.map((h, i) => (
              <div key={i} className="history-item">
                 <span style={{ color: '#475569', fontSize: '0.75rem' }}>{h.time}</span>
                 <strong style={{ fontFamily: 'monospace' }}>{h.id}</strong>
                 <span style={{ flex: 1, marginLeft: '1rem' }}>{h.name}</span>
                 <span className={`status-badge status-${h.result.toLowerCase()}`} style={{ fontSize: '0.6rem' }}>{h.result}</span>
              </div>
            ))}
         </div>
      </div>
    </div>
  )
}

const NotFoundPage = () => (
  <div className="container" style={{ padding: '10rem 2rem', textAlign: 'center' }}>
     <Bus size={64} className="text-secondary" style={{ margin: '0 auto 2rem', opacity: 0.5 }} />
     <h1 style={{ fontSize: '4rem' }}>404</h1>
     <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Oops! This route doesn't exist in our network.</p>
     <Link to="/" className="btn-primary">Back to Safety</Link>
  </div>
)

// --- MAIN APP ---

function App() {
  const [user, setUser] = useState(null)
  const [toasts, setToasts] = useState([])

  const showToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  useEffect(() => {
    setUser(dbService.getCurrentUser())
  }, [])

  const handleLogout = () => {
    dbService.logout()
    setUser(null); window.location.href = '/login'
  }

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} />
        
        <main style={{ flex: 1, paddingTop: '80px' }}>
          <Routes>
            <Route path="/login" element={<LoginPage onLogin={setUser} showToast={showToast} />} />
            <Route path="/register" element={<RegisterPage onLogin={setUser} showToast={showToast} />} />
            <Route path="/conductor" element={<ConductorLoginPage showToast={showToast} />} />
            
            <Route path="/" element={<UserHomePage />} />
            <Route path="/apply" element={<ProtectedRoute allowedRole="user"><ApplyPassPage showToast={showToast}/></ProtectedRoute>} />
            <Route path="/my-pass" element={<ProtectedRoute allowedRole="user"><MyPassPage showToast={showToast}/></ProtectedRoute>} />
            
            {/* Separate admin routes — all handled by AdminLayout */}
            <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminLayout showToast={showToast} /></ProtectedRoute>} />
            <Route path="/admin/applications" element={<ProtectedRoute allowedRole="admin"><AdminLayout showToast={showToast} /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminLayout showToast={showToast} /></ProtectedRoute>} />
            
            <Route path="/conductor/verify" element={<ConductorDashboard showToast={showToast} />} />
            
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <div className="toast-container">
          {toasts.map(t => <Toast key={t.id} {...t} onClose={() => removeToast(t.id)} />)}
        </div>
      </div>
    </Router>
  )
}

export default App
