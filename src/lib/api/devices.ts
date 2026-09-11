import api from '../axios';

export const getDevices = () => api.get('/devices').then(res => res.data.data || res.data);
export const getDevice = (id: number | string) => api.get(`/devices/${id}`).then(res => res.data.data || res.data);
export const screamDevice = (id: number | string) => api.post(`/devices/${id}/scream`).then(res => res.data);
export const stopScreamDevice = (id: number | string, password: string) => api.post(`/devices/${id}/stop-scream`, { password }).then(res => res.data);
export const locateDevice = (id: number | string) => api.post(`/devices/${id}/locate`).then(res => res.data);
export const startSearchMode = (id: number | string, interval_seconds: number = 30) => api.post(`/devices/${id}/search-mode`, { interval_seconds }).then(res => res.data);
export const stopSearchMode = (id: number | string) => api.post(`/devices/${id}/stop-search`).then(res => res.data);
export const markStolen = (id: number | string) => api.post(`/devices/${id}/stolen`).then(res => res.data);
export const markFound = (id: number | string, pin_code: string) => api.post(`/devices/${id}/found`, { pin_code }).then(res => res.data);
export const deleteDevice = (id: number | string, password?: string) => api.delete(`/devices/${id}`, { data: { password } }).then(res => res.data);