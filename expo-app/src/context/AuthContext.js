import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      
      // Simulation d'API call
      const mockResponse = {
        success: true,
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: 'user_' + Date.now(),
          email: email,
          name: 'Utilisateur Demo',
          phone: '+221 77 123 45 67',
          avatar: null
        }
      };

      if (mockResponse.success) {
        await AsyncStorage.setItem('authToken', mockResponse.token);
        await AsyncStorage.setItem('user', JSON.stringify(mockResponse.user));
        
        setToken(mockResponse.token);
        setUser(mockResponse.user);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erreur de connexion' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      
      // Simulation d'API call
      const mockResponse = {
        success: true,
        token: 'mock_jwt_token_' + Date.now(),
        user: {
          id: 'user_' + Date.now(),
          email: userData.email,
          name: userData.name,
          phone: userData.phone,
          avatar: null
        }
      };

      if (mockResponse.success) {
        await AsyncStorage.setItem('authToken', mockResponse.token);
        await AsyncStorage.setItem('user', JSON.stringify(mockResponse.user));
        
        setToken(mockResponse.token);
        setUser(mockResponse.user);
        
        return { success: true };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Erreur d\'inscription' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      const updatedUser = { ...user, ...updatedData };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Erreur de mise à jour' };
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};