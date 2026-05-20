// src/api/axios.js
import axios from "axios";

// For local development
const VITE_API_URL = "http://localhost:8080";

// For Kubernetes (when deploying node ip)
//const VITE_API_URL = 'http://172.30.3.10:30176';

const apiClient = axios.create({
  baseURL: VITE_API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
