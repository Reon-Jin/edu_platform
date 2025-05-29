import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 5000,
});

// 命名导出 (named exports)
export function register(data) {
  return api.post('/auth/register', data);
}

export function login(data) {
  return api.post('/auth/login', data);
}
