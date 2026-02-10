// src/api/axios.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080', // Change this to your backend API URL(auth-application)
  timeout: 10000, // 10 seconds instead of 1000ms
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
