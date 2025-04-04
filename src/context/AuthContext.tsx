
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createUser?: (username: string, password: string, role: string) => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Context provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check for user on mount
  useEffect(() => {
    const checkUser = async () => {
      setIsLoading(true);
      try {
        // Check if there's a user in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Special case for admin password - direct mode
      if (password === 'zaladmin2025') {
        // Skip the login and redirect to a page where they can create a new user
        const tempUser: User = {
          id: 'temp-admin',
          username: 'temp-admin',
          role: 'admin'
        };
        setUser(tempUser);
        localStorage.setItem('user', JSON.stringify(tempUser));
        toast({
          title: "Modo administrador",
          description: "Has ingresado en modo de creación de usuarios",
          variant: "default",
        });
        return;
      }

      // Use the generic approach to avoid type errors
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();
      
      if (error) {
        throw new Error('Credenciales inválidas');
      }
      
      if (data) {
        // Compare the password with the stored one
        if (data.password === password) {
          const userData: User = {
            id: data.id,
            username: data.username,
            role: data.role
          };
          
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          toast({
            title: "Inicio de sesión exitoso",
            description: `Bienvenido, ${userData.username}`,
            variant: "default",
          });
        } else {
          throw new Error('Contraseña incorrecta');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Error al iniciar sesión');
      toast({
        title: "Error de inicio de sesión",
        description: error.message || 'Error al iniciar sesión',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create User function (admin only)
  const createUser = async (username: string, password: string, role: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if user already exists
      const { data: existingUser, error: existingError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      
      if (existingUser) {
        throw new Error('El usuario ya existe');
      }
      
      // Insert new user
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          username,
          password, // store plaintext for backward compatibility
          bcrypt_password: password, // for now, storing plaintext in bcrypt_password field for simplicity
          role
        });
      
      if (insertError) {
        throw new Error('Error al crear usuario: ' + insertError.message);
      }
      
      toast({
        title: "Usuario creado",
        description: `El usuario ${username} ha sido creado exitosamente`,
        variant: "default",
      });
    } catch (error: any) {
      console.error('Create user error:', error);
      setError(error.message || 'Error al crear usuario');
      toast({
        title: "Error",
        description: error.message || 'Error al crear usuario',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem('user');
      setUser(null);
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
        variant: "default",
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, createUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
