// src/api/axios.js
import axios from "axios";
// localhost environment from .env file
// Read from environment variable (injected by Kubernetes) since image when build ignores .env file
// So this is set from configmap.yaml file
const VITE_API_URL = import.meta.env.VITE_API_URL 
                   
const apiClient = axios.create({
  baseURL: VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
