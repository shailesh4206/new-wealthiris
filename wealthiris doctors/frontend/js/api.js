const API_URL = 'https://new-wealthiris.onrender.com/api';

const api = {
  // Setup authorization header
  getHeaders: (isMultipart = false) => {
    const token = localStorage.getItem('doctorToken');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isMultipart) headers['Content-Type'] = 'application/json';
    return headers;
  },

  // Auth
  registerDoctor: async (formData) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      body: formData // Note: no headers for multipart so fetch auto-sets boundary
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  loginDoctor: async (credentials) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: api.getHeaders(),
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  // Dashboard & Profile
  getDashboardStats: async () => {
    const res = await fetch(`${API_URL}/doctor/dashboard`, { headers: api.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${API_URL}/doctor/profile`, { headers: api.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return await res.json();
  },
  
  updateProfile: async (formData) => {
    const res = await fetch(`${API_URL}/doctor/profile`, { 
      method: 'PUT',
      headers: api.getHeaders(true),
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Failed to update profile');
    return data;
  },

  // Appointments
  getDoctorAppointments: async () => {
    const res = await fetch(`${API_URL}/appointments/doctor`, { headers: api.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch appointments');
    return await res.json();
  },

  updateAppointmentStatus: async (id, status, notes = '') => {
    const res = await fetch(`${API_URL}/appointments/${id}/status`, {
      method: 'PUT',
      headers: api.getHeaders(),
      body: JSON.stringify({ status, prescriptionNotes: notes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Failed to update status');
    return data;
  }
};
