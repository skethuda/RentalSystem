import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, dbQuery, AppUser } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<AppUser>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // 3 saniye timeout - eğer auth kontrolü tamamlanmazsa loading'i kapat
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.log('AuthContext: Timeout - loading kapatılıyor');
        setLoading(false);
      }
    }, 3000);

    // Mevcut oturumu kontrol et
    console.log('AuthContext: Oturum kontrol ediliyor...');
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        console.log('AuthContext: Oturum yanıtı:', session ? 'Oturum var' : 'Oturum yok');
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchAppUser(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error('AuthContext: Session fetch error:', error);
        setLoading(false);
      });

    // Auth değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchAppUser(session.user.id);
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchAppUser = async (authId: string) => {
    try {
      const { data, error } = await dbQuery('app_users')
        .select('*')
        .eq('auth_id', authId)
        .single()
        .execute();

      if (error && error.code !== 'PGRST116') {
        console.error('App user fetch error:', error);
      }
      
      setAppUser(data);
    } catch (error) {
      console.error('Error fetching app user:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
    try {
      // Supabase Auth ile kayıt
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) return { error: authError };

      if (data.user) {
        // app_users tablosuna kayıt
        const { error: dbError } = await dbQuery('app_users')
          .insert({
            auth_id: data.user.id,
            email,
            first_name: firstName,
            last_name: lastName,
            phone,
            role: 'member',
            is_active: true,
            is_approved: true
          });

        if (dbError) {
          console.error('DB insert error:', dbError);
          return { error: dbError };
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Giriş deneniyor...', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('AuthContext: Giriş hatası:', error);
        return { error };
      }
      
      if (data.user) {
        console.log('AuthContext: Giriş başarılı, app user yükleniyor...', data.user.id);
        await fetchAppUser(data.user.id);
      }
      
      return { error: null };
    } catch (error) {
      console.error('AuthContext: Giriş exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAppUser(null);
    setSession(null);
  };

  const updateProfile = async (data: Partial<AppUser>) => {
    if (!appUser?.id) return { error: 'No user logged in' };

    try {
      const { error } = await dbQuery('app_users')
        .eq('id', appUser.id)
        .update(data);

      if (!error) {
        setAppUser({ ...appUser, ...data });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      appUser,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

