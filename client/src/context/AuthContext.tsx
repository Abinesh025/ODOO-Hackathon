import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import api from '../api/client';
import { io, type Socket } from 'socket.io-client';

export type Role = 'admin' | 'manager' | 'employee';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  companyId: string;
  preferredCurrency: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: {
    email: string;
    password: string;
    name: string;
    countryCode: string;
  }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  socket: Socket | null;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);

  const refreshMe = useCallback(async () => {
    const t = localStorage.getItem('token');
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    if (!user?.id || !token) {
      socket?.disconnect();
      setSocket(null);
      return;
    }
    const s = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
    });
    s.on('connect', () => {
      s.emit('join', { userId: user.id, companyId: user.companyId });
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, [user?.id, user?.companyId, token]);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (payload: {
    email: string;
    password: string;
    name: string;
    countryCode: string;
  }) => {
    const { data } = await api.post('/auth/signup', payload);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      signup,
      logout,
      refreshMe,
      socket,
    }),
    [user, token, loading, refreshMe, socket]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
