// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3
};

// Authentication Constants
export const AUTH_CONFIG = {
  TOKEN_KEY: 'clinic_auth_token',
  USER_KEY: 'clinic_user_data',
  REFRESH_TOKEN_KEY: 'clinic_refresh_token',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutes in milliseconds
};

// User Roles
export const USER_ROLES = {
  DOCTOR: 'doctor',
  PATIENT: 'patient',
  ADMIN: 'admin'
};

// Appointment Status
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESCHEDULED: 'rescheduled',
  NO_SHOW: 'no_show'
};

// Appointment Status Colors
export const STATUS_COLORS = {
  [APPOINTMENT_STATUS.SCHEDULED]: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  [APPOINTMENT_STATUS.COMPLETED]: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  [APPOINTMENT_STATUS.CANCELLED]: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  [APPOINTMENT_STATUS.RESCHEDULED]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  [APPOINTMENT_STATUS.NO_SHOW]: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  }
};

// Date and Time Formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM DD, YYYY',
  DISPLAY_TIME: 'hh:mm A',
  DISPLAY_DATETIME: 'MMM DD, YYYY hh:mm A',
  API_DATE: 'YYYY-MM-DD',
  API_DATETIME: 'YYYY-MM-DDTHH:mm:ss',
  INPUT_DATETIME: 'YYYY-MM-DDTHH:mm'
};

// Business Hours
export const BUSINESS_HOURS = {
  START_TIME: '08:00',
  END_TIME: '18:00',
  LUNCH_START: '12:00',
  LUNCH_END: '13:00',
  APPOINTMENT_DURATION: 30, // minutes
  BREAK_BETWEEN_APPOINTMENTS: 15 // minutes
};

// Working Days
export const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // Monday to Saturday (0 = Sunday)

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50]
};

// Form Validation
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  REASON_MAX_LENGTH: 500,
  NOTES_MAX_LENGTH: 1000
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'Session expired. Please login again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  LOGIN_FAILED: 'Invalid email or password.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  APPOINTMENT_BOOKING_FAILED: 'Failed to book appointment. Please try again.',
  APPOINTMENT_UPDATE_FAILED: 'Failed to update appointment. Please try again.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  APPOINTMENT_BOOKED: 'Appointment booked successfully!',
  APPOINTMENT_UPDATED: 'Appointment updated successfully!',
  APPOINTMENT_CANCELLED: 'Appointment cancelled successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!'
};

// Loading States
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'clinic_theme',
  LANGUAGE: 'clinic_language',
  SIDEBAR_STATE: 'clinic_sidebar_state',
  LAST_VISIT: 'clinic_last_visit'
};

// Theme Configuration
export const THEME = {
  PRIMARY_COLOR: '#3b82f6',
  SECONDARY_COLOR: '#f1f5f9',
  SUCCESS_COLOR: '#10b981',
  WARNING_COLOR: '#f59e0b',
  ERROR_COLOR: '#ef4444',
  INFO_COLOR: '#06b6d4'
};

// Medical Specialties (for future use)
export const MEDICAL_SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
  'Urology',
  'Gynecology',
  'Ophthalmology',
  'ENT',
  'Pulmonology',
  'Nephrology',
  'Rheumatology',
  'Emergency Medicine'
];

// Common Appointment Reasons
export const COMMON_REASONS = [
  'General Check-up',
  'Follow-up Visit',
  'Vaccination',
  'Lab Results Review',
  'Prescription Refill',
  'Symptom Consultation',
  'Preventive Care',
  'Chronic Disease Management',
  'Emergency Consultation',
  'Second Opinion',
  'Pre-operative Assessment',
  'Post-operative Care',
  'Health Screening',
  'Physical Therapy',
  'Mental Health Consultation'
];

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// File Upload Configuration
export const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']
};

// Dashboard Refresh Intervals
export const REFRESH_INTERVALS = {
  APPOINTMENTS: 30000, // 30 seconds
  NOTIFICATIONS: 60000, // 1 minute
  DASHBOARD_STATS: 300000 // 5 minutes
};

// Routes
export const ROUTES = {
  // Auth Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Patient Routes
  PATIENT_DASHBOARD: '/patient-dashboard',
  PATIENT_APPOINTMENTS: '/patient-appointments',
  BOOK_APPOINTMENT: '/book-appointment',
  MEDICAL_HISTORY: '/medical-history',
  
  // Doctor Routes
  DOCTOR_DASHBOARD: '/doctor-dashboard',
  DOCTOR_APPOINTMENTS: '/doctor-appointments',
  DOCTOR_PATIENTS: '/doctor-patients',
  DOCTOR_SCHEDULE: '/doctor-schedule',
  
  // Common Routes
  PROFILE: '/profile',
  SETTINGS: '/settings',
  HELP: '/help',
  CONTACT: '/contact'
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  
  // Users
  USERS: '/users',
  DOCTORS: '/users/doctors',
  PATIENTS: '/users/patients',
  PROFILE: '/users/me',
  
  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENT_BY_ID: (id) => `/appointments/${id}`,
  
  // Dashboard
  DASHBOARD_STATS: '/dashboard/stats',
  DASHBOARD_APPOINTMENTS: '/dashboard/appointments'
};

export default {
  API_CONFIG,
  AUTH_CONFIG,
  USER_ROLES,
  APPOINTMENT_STATUS,
  STATUS_COLORS,
  DATE_FORMATS,
  BUSINESS_HOURS,
  WORKING_DAYS,
  PAGINATION,
  VALIDATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_STATES,
  STORAGE_KEYS,
  THEME,
  MEDICAL_SPECIALTIES,
  COMMON_REASONS,
  NOTIFICATION_TYPES,
  FILE_UPLOAD,
  REFRESH_INTERVALS,
  ROUTES,
  API_ENDPOINTS
};