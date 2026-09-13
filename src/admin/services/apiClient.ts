import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://elkamal.runasp.net/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // لا نطبق منطق تسجيل الخروج الإجباري على طلب تسجيل الدخول نفسه،
    // وإلا هيحصل reload/loop لما المستخدم يدخل بيانات غلط
    const isLoginRequest = error?.config?.url?.includes('/Auth/login');
    if (error?.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;