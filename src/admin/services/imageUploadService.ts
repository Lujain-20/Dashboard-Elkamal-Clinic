import apiClient from './apiClient';

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<{ url: string }>(
    '/Doctors/upload-image',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );

  return data.url;
}