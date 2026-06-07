import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('boltrain_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const registrar = (datos) => api.post('/auth/register', datos);
export const iniciarSesion = (datos) => api.post('/auth/login', datos);
export const obtenerPerfil = () => api.get('/auth/me');

export default api;
