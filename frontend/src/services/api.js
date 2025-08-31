// Updated src/services/api.js with CrewAI integration

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
};

export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  getDoctors: () => api.get('/users/doctors'),
  getPatients: () => api.get('/users/patients'),
};

// Traditional appointment API (without CrewAI)
export const appointmentAPI = {
  // Traditional methods
  create: (appointmentData) => api.post('/appointments', appointmentData),
  getAll: () => api.get('/appointments'),
  update: (id, updateData) => api.put(`/appointments/${id}`, updateData),
  
  // CrewAI-powered methods
  bookWithAI: (bookingData) => api.post('/appointments/book-with-ai', bookingData),
  confirmWithAI: (confirmationData) => api.post('/appointments/confirm-with-ai', confirmationData),
  getPendingConfirmations: () => api.get('/appointments/pending-confirmations'),
  getWorkflowStatus: (appointmentId) => api.get(`/appointments/workflow-status/${appointmentId}`),
  batchConfirm: (confirmationRequests) => api.post('/appointments/batch-confirm', confirmationRequests),
  getDoctorDashboardSummary: () => api.get('/appointments/doctor/dashboard-summary'),
};

// Dashboard API
export const dashboardAPI = {
  getDoctorSummary: () => api.get('/appointments/doctor/dashboard-summary'),
  getPatientSummary: () => api.get('/dashboard/patient-summary'),
  getStats: () => api.get('/dashboard/stats'),
};

// Notification API (for future use)
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Utility function to handle API errors
export const handleAPIError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return data.detail || 'Bad request. Please check your input.';
      case 401:
        return 'Your session has expired. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        // Validation error
        if (data.detail && Array.isArray(data.detail)) {
          return data.detail.map(err => err.msg).join(', ');
        }
        return data.detail || 'Validation error. Please check your input.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return data.detail || 'An unexpected error occurred.';
    }
  } else if (error.request) {
    // Network error
    return 'Network error. Please check your connection and try again.';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred.';
  }
};

// Utility function to format dates for API
export const formatDateForAPI = (date) => {
  if (!date) return null;
  
  // If it's already a string in ISO format, return as is
  if (typeof date === 'string' && date.includes('T')) {
    return date;
  }
  
  // If it's a Date object, convert to ISO string
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  // If it's a string in datetime-local format (YYYY-MM-DDTHH:mm)
  if (typeof date === 'string' && date.includes('T')) {
    return new Date(date).toISOString();
  }
  
  return date;
};

// Enhanced appointment API with error handling
export const appointmentAPIWithErrorHandling = {
  async bookWithAI(bookingData) {
    try {
      // Format the date
      const formattedData = {
        ...bookingData,
        preferred_date: formatDateForAPI(bookingData.preferred_date)
      };
      
      const response = await appointmentAPI.bookWithAI(formattedData);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  },

  async confirmWithAI(confirmationData) {
    try {
      const response = await appointmentAPI.confirmWithAI(confirmationData);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  },

  async getPendingConfirmations() {
    try {
      const response = await appointmentAPI.getPendingConfirmations();
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  },

  async getWorkflowStatus(appointmentId) {
    try {
      const response = await appointmentAPI.getWorkflowStatus(appointmentId);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  },

  async batchConfirm(confirmationRequests) {
    try {
      const response = await appointmentAPI.batchConfirm(confirmationRequests);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = handleAPIError(error);
      return { success: false, error: errorMessage };
    }
  }
};

// WebSocket connection for real-time updates (for future implementation)
export class AppointmentWebSocket {
  constructor(userId, userRole) {
    this.userId = userId;
    this.userRole = userRole;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.callbacks = new Map();
  }

  connect() {
    const wsUrl = `ws://localhost:8000/ws/${this.userRole}/${this.userId}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleMessage(data) {
    const { type, payload } = data;
    const callback = this.callbacks.get(type);
    if (callback) {
      callback(payload);
    }
  }

  subscribe(eventType, callback) {
    this.callbacks.set(eventType, callback);
  }

  unsubscribe(eventType) {
    this.callbacks.delete(eventType);
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, 1000 * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.clear();
  }
}

// Toast notification utility
export const showToast = {
  success: (message) => {
    createToast(message, 'success');
  },
  error: (message) => {
    createToast(message, 'error');
  },
  info: (message) => {
    createToast(message, 'info');
  },
  warning: (message) => {
    createToast(message, 'warning');
  }
};

function createToast(message, type) {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} transform transition-all duration-300 translate-x-full`;
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  const colors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
    warning: 'bg-yellow-500 text-black'
  };

  toast.innerHTML = `
    <div class="flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg ${colors[type]}">
      <span class="text-lg">${icons[type]}</span>
      <span class="font-medium">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-lg opacity-70 hover:opacity-100">
        ×
      </button>
    </div>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full');
  }, 10);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add('translate-x-full');
      setTimeout(() => toast.remove(), 300);
    }
  }, 5000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'fixed top-20 right-6 z-50 space-y-2';
  document.body.appendChild(container);
  return container;
}

// API request queue for offline support (for future implementation)
class APIRequestQueue {
  constructor() {
    this.queue = JSON.parse(localStorage.getItem('api_queue') || '[]');
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  addToQueue(request) {
    this.queue.push({
      ...request,
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    this.saveQueue();

    if (this.isOnline) {
      this.processQueue();
    }
  }

  async processQueue() {
    while (this.queue.length > 0 && this.isOnline) {
      const request = this.queue.shift();
      try {
        await this.executeRequest(request);
        this.saveQueue();
      } catch (error) {
        // Put request back in queue if it failed
        this.queue.unshift(request);
        this.saveQueue();
        break;
      }
    }
  }

  async executeRequest(request) {
    const { method, url, data } = request;
    return api.request({
      method,
      url,
      data
    });
  }

  saveQueue() {
    localStorage.setItem('api_queue', JSON.stringify(this.queue));
  }

  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }
}

// Create global instances
export const apiQueue = new APIRequestQueue();

// Export everything
export default api;

// Additional utility functions
export const apiUtils = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  },

  // Format appointment display data
  formatAppointmentForDisplay: (appointment) => ({
    id: appointment.id,
    date: new Date(appointment.appointment_date).toLocaleDateString(),
    time: new Date(appointment.appointment_date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    datetime: new Date(appointment.appointment_date),
    status: appointment.status,
    reason: appointment.reason,
    notes: appointment.notes,
    workflowStatus: appointment.notes?.includes('CONFIRMED') ? 'confirmed' : 
                   appointment.notes?.includes('REJECTED') ? 'rejected' :
                   appointment.notes?.includes('Scheduled') ? 'scheduled' : 'pending'
  }),

  // Calculate appointment stats
  calculateAppointmentStats: (appointments) => {
    const total = appointments.length;
    const completed = appointments.filter(apt => apt.status === 'completed').length;
    const cancelled = appointments.filter(apt => apt.status === 'cancelled').length;
    const scheduled = appointments.filter(apt => apt.status === 'scheduled').length;

    return {
      total,
      completed,
      cancelled,
      scheduled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0
    };
  },

  // Get next appointment
  getNextAppointment: (appointments) => {
    const now = new Date();
    const upcoming = appointments
      .filter(apt => new Date(apt.appointment_date) > now && apt.status === 'scheduled')
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));
    
    return upcoming[0] || null;
  },

  // Get today's appointments
  getTodayAppointments: (appointments) => {
    const today = new Date().toDateString();
    return appointments.filter(apt => 
      new Date(apt.appointment_date).toDateString() === today
    );
  }
};