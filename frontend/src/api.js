// frontend/src/api.js
import axios from 'axios';
import { toast } from 'react-toastify';

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const MAX_RETRIES = 3;
const TIMEOUT = 30000; // 30 seconds

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  }
});

// Request interceptor
apiClient.interceptors.request.use(config => {
  // Add timestamp to avoid caching
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: Date.now()
    };
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor
apiClient.interceptors.response.use(
  response => {
    // Log performance metrics
    if (response.headers['x-process-time']) {
      console.debug(`API ${response.config.url} took ${response.headers['x-process-time']}ms`);
    }
    return response.data;
  },
  async error => {
    const originalRequest = error.config;
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please try again');
      return Promise.reject('Request timeout');
    }
    
    // Handle server errors with retry
    if (error.response?.status >= 500 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Exponential backoff
      const delay = Math.pow(2, originalRequest._retryCount || 1) * 1000;
      await new Promise(res => setTimeout(res, delay));
      
      return apiClient(originalRequest);
    }
    
    // Extract error message
    const errorMsg = error.response?.data?.detail || 
                    error.message || 
                    'Network error';
    
    // Show user-friendly messages
    const friendlyErrors = {
      413: 'Image too large (max 5MB)',
      400: 'Invalid image format',
      404: 'API endpoint not found'
    };
    
    toast.error(friendlyErrors[error.response?.status] || errorMsg);
    return Promise.reject(errorMsg);
  }
);

// API Methods
export default {
  // Face detection
  async detectFaces(imageBlob) {
    const formData = new FormData();
    formData.append('file', imageBlob, `detect-${Date.now()}.jpg`);
    
    return apiClient.post('/api/detect', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Face recognition
  async recognizeFace(imageBlob) {
    const formData = new FormData();
    formData.append('file', imageBlob, `recognize-${Date.now()}.jpg`);
    
    return apiClient.post('/api/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // Register new face
  async registerFace(name, imageBlobs) {
    const formData = new FormData();
    formData.append('name', name);
    
    imageBlobs.forEach((blob, i) => {
      formData.append('files', blob, `face-${Date.now()}-${i}.jpg`);
    });
    
    return apiClient.post('/api/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  // List registered faces
  listFaces() {
    return apiClient.get('/api/faces');
  },

  // Health check
  checkHealth() {
    return apiClient.get('/api/health');
  },

  // Utility to convert canvas to blob
  canvasToBlob(canvas, quality = 0.9) {
    return new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', quality);
    });
  }
};