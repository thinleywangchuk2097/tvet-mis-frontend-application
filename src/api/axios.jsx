// src/api/axios.js
import axios from "axios";
// localhost environment
const VITE_API_URL = import.meta.env.VITE_API_URL;

// production environment - uses runtime config from ConfigMap
//const VITE_API_URL = window.__RUNTIME_CONFIG__?.VITE_API_URL
                   
const apiClient = axios.create({
  baseURL: VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
