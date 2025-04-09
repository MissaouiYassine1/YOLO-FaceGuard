import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const faceAPI = {
  // Détection
  detect: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return axios.post(`${API_BASE}/detect`, formData, {
      headers: {'Content-Type': 'multipart/form-data'}
    });
  },

  // Reconnaissance
  recognize: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return axios.post(`${API_BASE}/recognize`, formData);
  },

  // Enregistrement
  register: async (name, imageFile) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', imageFile);
    return axios.post(`${API_API}/register`, formData);
  }
};