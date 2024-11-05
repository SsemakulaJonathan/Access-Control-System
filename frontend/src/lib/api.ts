// src/lib/api.ts
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface VerifyAccessResponse {
  status: 'granted' | 'denied' | 'error';
  face?: string;
  plate?: string;
  message?: string;
}

interface RegisterUserData {
  name: string;
  contact: string;
  carPlate: string;
  imageUrl: string;
}

export const apiService = {
  verifyAccess: async (imageBlob: Blob): Promise<VerifyAccessResponse> => {
    const formData = new FormData();
    formData.append('image', imageBlob);

    const response = await fetch(`${API_URL}/verify-access`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to verify access');
    }

    return response.json();
  },

  registerUser: async (userData: RegisterUserData) => {
    const response = await fetch(`${API_URL}/register-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Failed to register user');
    }

    return response.json();
  },

  getCameras: async () => {
    const response = await fetch(`${API_URL}/cameras`);
    if (!response.ok) {
      throw new Error('Failed to fetch cameras');
    }
    return response.json();
  },
};