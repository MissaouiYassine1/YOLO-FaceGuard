import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const faceAPI = {
    detect: async (image) => {
        const formData = new FormData();
        formData.append('image', image);
        return axios.post(`${API_BASE}/api/detect`, formData);
    },
    recognize: async (faceImage) => {
        const formData = new FormData();
        formData.append('face', faceImage);
        return axios.post(`${API_BASE}/api/recognize`, formData);
    },
    register: async (name, images) => {
        const formData = new FormData();
        formData.append('name', name);
        images.forEach(img => {
            formData.append('images', img.blob, `face_${Date.now()}.jpg`);
        });
        return axios.post(`${API_BASE}/api/register`, formData);
    }
};