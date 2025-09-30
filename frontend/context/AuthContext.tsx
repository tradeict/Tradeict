import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import axios from 'axios';
import Constants from 'expo-constants';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  phone_number?: string;
  role: string;
  virtual_balance: number;
  earnings_balance: number;
  task_balance: number;
  total_investment: number;
  available_for_investment: number;
  available_for_coupons: number;
  total_balance: number;
  profile_picture?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ dailyBonus?: number }>;
  register: (email: string, name: string, phone: string, password: string, verificationToken: string) => Promise<void>;
  loginWithGoogle: (sessionId: string) => Promise<{ needsPhoneNumber?: boolean }>;
  logout: () => Promise<void>;
  loading: boolean;
  refreshUser: () => Promise<void>;
  sendOTP: (email: string, phone?: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<string>;
  updatePhoneNumber: (phoneNumber: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => ({}),
  register: async () => {},
  loginWithGoogle: async () => ({}),
  logout: async () => {},
  loading: true,
  refreshUser: async () => {},
  sendOTP: async () => {},
  verifyOTP: async () => '',
  updatePhoneNumber: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Navigation logic
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    const inLanding = segments[0] === 'landing';
    
    if (!loading) {
      if (!user && !inAuthGroup && !inLanding) {
        router.replace('/landing');
      } else if (user && (inAuthGroup || inLanding)) {
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments]);

  // Check for existing session on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('auth_token');
      const savedUser = await AsyncStorage.getItem('user_data');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        
        // Refresh user data to get latest balances
        await refreshUserSilently(savedToken);
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUserSilently = async (authToken?: string) => {
    try {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      const response = await axios.get(`${API_URL}/api/wallet`, { headers });
      
      if (response.data) {
        const updatedUser = {
          ...user!,
          ...response.data,
        };
        setUser(updatedUser);
        await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error refreshing user silently:', error);
    }
  };

  const refreshUser = async () => {
    try {
      if (!token) return;
      
      const response = await axios.get(`${API_URL}/api/wallet`);
      const updatedUser = {
        ...user!,
        ...response.data,
      };
      
      setUser(updatedUser);
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const sendOTP = async (email: string, phone?: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/send-otp`, {
        email,
        phone_number: phone,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to send OTP');
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email,
        otp,
      });
      return response.data.verification_token;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'OTP verification failed');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { access_token, user: userData, daily_bonus } = response.data;
      
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      return { dailyBonus: daily_bonus };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const register = async (email: string, name: string, phone: string, password: string, verificationToken: string) => {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('name', name);
      formData.append('phone_number', phone);
      formData.append('password', password);
      formData.append('verification_token', verificationToken);

      const response = await axios.post(`${API_URL}/api/auth/register`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { access_token, user: userData } = response.data;
      
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Registration failed');
    }
  };

  const loginWithGoogle = async (sessionId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/session-data`, {
        headers: {
          'X-Session-ID': sessionId,
        },
      });

      const { user: userData, session_token, needs_phone_number } = response.data;
      
      await AsyncStorage.setItem('auth_token', session_token);
      await AsyncStorage.setItem('user_data', JSON.stringify(userData));
      
      setToken(session_token);
      setUser(userData);
      
      return { needsPhoneNumber: needs_phone_number };
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Google login failed');
    }
  };

  const updatePhoneNumber = async (phoneNumber: string) => {
    try {
      const formData = new FormData();
      formData.append('phone_number', phoneNumber);
      
      await axios.post(`${API_URL}/api/auth/update-phone`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Update local user data
      if (user) {
        const updatedUser = { ...user, phone_number: phoneNumber };
        setUser(updatedUser);
        await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Failed to update phone number');
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${API_URL}/api/auth/logout`);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_data');
      
      setToken(null);
      setUser(null);
      
      delete axios.defaults.headers.common['Authorization'];
      
      router.replace('/landing');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        loginWithGoogle,
        logout,
        loading,
        refreshUser,
        sendOTP,
        verifyOTP,
        updatePhoneNumber,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}