import { useState, useEffect } from 'react';
import { FoodHubLanding } from './components/FoodHubLanding';
import { VendorDashboard } from './components/VendorDashboard';
import { FoodHubAdminDashboard } from './components/FoodHubAdminDashboard';
import { CustomerApp } from './components/CustomerApp';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';
import { supabase, type User } from './utils/supabase/client';
import { projectId, publicAnonKey } from './utils/supabase/info';
import './utils/errorHandler';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing Supabase session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
        } else if (session?.user) {
          const supabaseUser = session.user;
          const mappedUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            businessName: supabaseUser.user_metadata?.businessName,
            location: supabaseUser.user_metadata?.location,
            role: supabaseUser.user_metadata?.role || 'customer',
            isVerified: supabaseUser.user_metadata?.isVerified || false,
            phone: supabaseUser.user_metadata?.phone,
            cuisine: supabaseUser.user_metadata?.cuisine
          };
          setUser(mappedUser);
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const supabaseUser = session.user;
        const mappedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          businessName: supabaseUser.user_metadata?.businessName,
          location: supabaseUser.user_metadata?.location,
          role: supabaseUser.user_metadata?.role || 'customer',
          isVerified: supabaseUser.user_metadata?.isVerified || false,
          phone: supabaseUser.user_metadata?.phone,
          cuisine: supabaseUser.user_metadata?.cuisine
        };
        setUser(mappedUser);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    getSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuth = (newUser: User) => {
    setUser(newUser);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear admin user from localStorage
      localStorage.removeItem('foodhub_admin_user');
      setUser(null);
    } catch (error) {
      console.error('Error during sign out:', error);
      // Clear admin user even if Supabase sign out fails
      localStorage.removeItem('foodhub_admin_user');
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-green-50">
        <div className="text-center">
          <div className="relative mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-red-500 to-green-500 rounded-2xl flex items-center justify-center">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">🍽️</span>
                </div>
              </div>
            </div>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent mx-auto mb-4"></div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent mb-2">
            FoodHub
          </h2>
          <p className="text-gray-600">Connecting Food Lovers with Local Vendors</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {user?.role === 'admin' ? (
          <FoodHubAdminDashboard 
            user={user} 
            onSignOut={handleSignOut} 
          />
        ) : user?.role === 'customer' ? (
          <CustomerApp 
            user={user} 
            onSignOut={handleSignOut} 
          />
        ) : user?.role === 'vendor' ? (
          <VendorDashboard 
            user={user} 
            onSignOut={handleSignOut} 
          />
        ) : (
          <FoodHubLanding onAuth={handleAuth} />
        )}
        <Toaster position="top-right" richColors />
      </div>
    </ErrorBoundary>
  );
}