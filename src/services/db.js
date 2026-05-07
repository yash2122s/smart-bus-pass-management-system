const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://smart-bus-pass-backend.onrender.com/api'
    : 'http://localhost:8000/api');

const getAuthHeaders = () => {
  const data = JSON.parse(localStorage.getItem('transit_current_user') || '{}');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token || ''}`
  };
};

export const dbService = {
  // Authentication
  registerUser: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      
      localStorage.setItem('transit_current_user', JSON.stringify(data));
      return data;
    } catch (err) {
      throw new Error(err.message || 'Network error occurred during registration');
    }
  },

  loginUser: async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Invalid credentials');
      
      localStorage.setItem('transit_current_user', JSON.stringify(data));
      return data;
    } catch (err) {
      throw new Error(err.message || 'Connection to server failed. Is the backend running?');
    }
  },

  // Conductor Authentication — now backend-verified with JWT
  conductorLogin: async (id, pin) => {
    try {
      const response = await fetch(`${API_BASE_URL}/conductor/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, pin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Invalid Conductor ID or PIN');

      const session = { ...data.conductor, token: data.token, loggedIn: true };
      sessionStorage.setItem('conductor_session', JSON.stringify(session));
      return session;
    } catch (err) {
      throw new Error(err.message || 'Connection to server failed. Is the backend running?');
    }
  },

  getConductorSession: () => JSON.parse(sessionStorage.getItem('conductor_session')),
  
  conductorLogout: () => sessionStorage.removeItem('conductor_session'),

  getCurrentUser: () => {
    const data = JSON.parse(localStorage.getItem('transit_current_user') || 'null');
    return data ? data.user : null;
  },

  getToken: () => {
    const data = JSON.parse(localStorage.getItem('transit_current_user') || 'null');
    return data ? data.token : null;
  },

  logout: () => localStorage.removeItem('transit_current_user'),

  // Pass Management
  submitPass: async (passData) => {
    try {
      const currentUser = dbService.getCurrentUser();
      const token = dbService.getToken();
      
      if (!token) throw new Error('Session expired. Please login again.');

      const passId = dbService.generatePassId(passData.passType, passData.startDate);
      const expiryDate = dbService.calculateExpiry(passData.startDate, passData.duration);

      const response = await fetch(`${API_BASE_URL}/passes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...passData,
          passId,
          expiryDate,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Submission failed');
      return data;
    } catch (err) {
      throw err;
    }
  },

  generatePassId: (category, startDate) => {
    const codes = {
      "Student Pass (Concession)": "ST",
      "General Pass": "GN",
      "Senior Citizen Pass": "SR",
      "Ladies Special Pass": "LD",
      "Employee Pass": "EM"
    };
    const code = codes[category] || "GN";
    const date = new Date(startDate);
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.random().toString(16).slice(2, 8).toUpperCase();
    return `TP-${code}${year}${month}${random}`;
  },

  calculateExpiry: (startDate, durationMonths) => {
    const end = new Date(startDate);
    end.setMonth(end.getMonth() + parseInt(durationMonths));
    end.setDate(end.getDate() - 1);
    return end.toISOString().split('T')[0];
  },

  getAllPasses: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/passes`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch passes');
      return data;
    } catch (err) { throw err; }
  },

  getUserPasses: async () => {
    try {
      const user = dbService.getCurrentUser();
      if (!user) return [];
      const response = await fetch(`${API_BASE_URL}/passes/user/${user.id}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch passes');
      return data;
    } catch (err) { throw err; }
  },

  verifyPass: async (passId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/passes/verify/${passId}`);
      if (response.status === 404) return { result: "NOT_FOUND" };
      if (!response.ok) throw new Error('Verification failed');
      
      const pass = await response.json();
      // Server already computes status, but we can do extra logic if needed
      return { 
        result: pass.status.toUpperCase(), 
        pass 
      };
    } catch (err) { throw err; }
  },

  // Updated: now supports rejectionReason
  updatePassStatus: async (passId, status, rejectionReason = null) => {
    try {
      const body = { status };
      if (status === 'rejected' && rejectionReason) {
        body.rejectionReason = rejectionReason;
      }

      const response = await fetch(`${API_BASE_URL}/passes/${passId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed');
      return data;
    } catch (err) { throw err; }
  },

  getAllUsers: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch users');
      return data;
    } catch (err) { throw err; }
  }
};
