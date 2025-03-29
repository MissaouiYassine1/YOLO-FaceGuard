// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export const detectFaces = async (imageData) => {
  const formData = new FormData();
  
  // Convert data URL to blob if needed
  if (imageData.startsWith('data:')) {
    const res = await fetch(imageData);
    const blob = await res.blob();
    formData.append('image', blob, 'capture.jpg');
  } else {
    formData.append('image', imageData);
  }

  const response = await api.post('/detect', formData);
  return response.data;
};