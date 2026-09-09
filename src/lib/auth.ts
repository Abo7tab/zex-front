import api from './axios';
import Cookies from 'js-cookie';

export const login = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  const token = res.data?.token || res.data?.data?.token;
  if (token) {
    Cookies.set('zex_token', token, { expires: 7, secure: true, sameSite: 'strict' });
  }
  return res.data;
};

export const logout = async () => {
  Cookies.remove('zex_token');
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};
