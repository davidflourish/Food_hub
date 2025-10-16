import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  ChefHat, 
  MapPin, 
  Clock, 
  Star, 
  Users, 
  TrendingUp,
  Shield,
  Smartphone,
  Heart,
  CheckCircle,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { checkAdminCredentials, createAdminUser } from '../utils/adminAuth';
import { supabase } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface User {
  id: string;
  email: string;
  businessName?: string;
  location?: string;
  role: 'vendor' | 'admin' | 'customer';
  isVerified?: boolean;
}

interface FoodHubLandingProps {
  onAuth: (user: User) => void;
}

export function FoodHubLanding({ onAuth }: FoodHubLandingProps) {
  const [currentView, setCurrentView] = useState<'landing' | 'about' | 'contact'>('landing');
  const registrationRef = useRef<HTMLDivElement>(null);
  
  const [registrationData, setRegistrationData] = useState({
    email: '',
    password: '',
    businessName: '',
    location: '',
    phone: '',
    cuisine: ''
  });

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic form validation
    if (!registrationData.email || !registrationData.password || !registrationData.businessName || !registrationData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (registrationData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    if (!registrationData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsRegistering(true);
    
    try {
      // Check for secret admin credentials in registration form too
      if (checkAdminCredentials(registrationData.email, registrationData.password)) {
        toast.loading('Setting up admin access...');
        
        try {
          // Use simplified admin authentication
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8966d869/admin/authenticate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: registrationData.email,
              password: registrationData.password
            })
          });

          const responseData = await response.json();
          
          if (!response.ok) {
            throw new Error(responseData.error || 'Failed to setup admin access');
          }

          // Create admin user object and authenticate directly
          const adminUser = {
            id: responseData.user.id,
            email: responseData.user.email,
            businessName: responseData.user.businessName,
            role: 'admin' as const,
            isVerified: true
          };

          // Store admin user for API calls
          localStorage.setItem('foodhub_admin_user', JSON.stringify(adminUser));

          toast.dismiss();
          toast.success('Admin access granted!');
          setIsRegistering(false);
          onAuth(adminUser);
          return;
        } catch (error) {
          toast.dismiss();
          console.error('Admin setup error:', error);
          toast.error(`Failed to setup admin access: ${error.message}`);
          setIsRegistering(false);
          return;
        }
      }
      
      // Create vendor account via Supabase
      toast.loading('Creating your account...');
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8966d869/signup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: registrationData.email.toLowerCase().trim(),
          password: registrationData.password,
          businessName: registrationData.businessName.trim(),
          location: registrationData.location.trim(),
          phone: registrationData.phone.trim(),
          cuisine: registrationData.cuisine.trim(),
          role: 'vendor'
        })
      });

      const data = await response.json();
      toast.dismiss(); // Remove loading toast

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Sign in the user after successful registration
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: registrationData.email.toLowerCase().trim(),
        password: registrationData.password
      });

      if (signInError) {
        toast.error(`Registration successful but login failed: ${signInError.message}. Please try logging in manually.`);
        return;
      }

      toast.success('Registration successful! Welcome to FoodHub!');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic form validation
    if (!loginData.email || !loginData.password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    if (!loginData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      // Secret admin login pattern - no hints in UI
      if (checkAdminCredentials(loginData.email, loginData.password)) {
        toast.loading('Authenticating admin...');
        
        try {
          // Use simplified admin authentication
          const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8966d869/admin/authenticate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: loginData.email,
              password: loginData.password
            })
          });

          const responseData = await response.json();
          console.log('Admin authentication response:', responseData);

          if (!response.ok) {
            throw new Error(responseData.error || 'Authentication failed');
          }

          // Create admin user object and authenticate directly
          const adminUser = {
            id: responseData.user.id,
            email: responseData.user.email,
            businessName: responseData.user.businessName,
            role: 'admin' as const,
            isVerified: true
          };

          // Store admin user for API calls
          localStorage.setItem('foodhub_admin_user', JSON.stringify(adminUser));

          toast.dismiss();
          toast.success('Admin access granted!');
          setIsLoggingIn(false);
          onAuth(adminUser);
          return;
        } catch (error) {
          toast.dismiss();
          console.error('Admin authentication error:', error);
          toast.error(`Authentication failed: ${error.message}`);
          setIsLoggingIn(false);
          return;
        }
      }
      
      // Regular user login via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email.toLowerCase().trim(),
        password: loginData.password
      });

      if (error) {
        // Handle specific Supabase errors with better messages
        if (error.message === 'Invalid login credentials') {
          toast.error('Account not found. Please register first or check your email/password.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please check your email to confirm your account.');
        } else {
          toast.error(`Login failed: ${error.message}`);
        }
        return;
      }

      toast.success('Login successful!');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again or register if you don\'t have an account.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const scrollToRegistration = () => {
    registrationRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'center'
    });
  };

  const features = [
    {
      icon: ChefHat,
      title: 'Easy Menu Management',
      description: 'Upload photos, set prices, and manage your menu items with our intuitive interface.'
    },
    {
      icon: Users,
      title: 'Customer Reach',
      description: 'Connect with food lovers in your area and grow your customer base.'
    },
    {
      icon: TrendingUp,
      title: 'Sales Analytics',
      description: 'Track your performance with detailed analytics and insights.'
    },
    {
      icon: Smartphone,
      title: 'Mobile Optimized',
      description: 'Manage your business on the go with our mobile-friendly platform.'
    }
  ];

  const benefits = [
    'Zero setup fees - Start selling immediately',
    'Real-time order notifications',
    'Integrated payment processing',
    'Customer review management',
    'Delivery coordination support',
    '24/7 customer support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-green-500 rounded-xl flex items-center justify-center mr-3">
                <span className="text-white text-xl">🍽️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
                  FoodHub
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost">About</Button>
                </DialogTrigger>
              </Dialog>
              
              <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost">Contact</Button>
                </DialogTrigger>
              </Dialog>
              
              <Button 
                variant="outline"
                onClick={() => {
                  const customerUser: User = {
                    id: 'customer-demo',
                    email: 'customer@demo.com',
                    role: 'customer'
                  };
                  onAuth(customerUser);
                }}
              >
                Customer App
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1757332914538-4b5ed7ae95e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMGNvbG9yZnVsJTIwZm9vZCUyMGluZ3JlZGllbnRzJTIwdmVnZXRhYmxlc3xlbnwxfHx8fDE3NTkzNTk4MjN8MA&ixlib=rb-4.1.0&q=80&w=1080)`
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Turn Your
                <span className="bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent"> Kitchen </span>
                Into a Business
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Join thousands of food vendors who are already growing their business with FoodHub. 
                Easy setup, powerful tools, and hungry customers waiting for your delicious food.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 w-full sm:w-auto"
                  onClick={scrollToRegistration}
                >
                  Start Selling Today
                </Button>
                
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 mt-8">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-sm text-gray-600">4.9/5 from 2,500+ vendors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">Secure & Trusted</span>
                </div>
              </div>
              
              {/* <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4 mt-6 max-w-md mx-auto lg:mx-0">
                <p className="text-sm text-blue-800">
                  <strong>🚀 First time here?</strong><br />
                  New users must register first. Try the "Create Demo Account" button in the login form for instant access!
                </p>
              </div> */}
            </div>

            {/* Registration Form */}
            <div ref={registrationRef} className="w-full max-w-md mx-auto lg:max-w-md lg:ml-auto lg:mx-0">
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl sm:text-2xl">Join FoodHub</CardTitle>
                  <CardDescription>
                    Start your food business journey today<br />
                    <span className="text-xs text-green-600 font-medium">✨ New to FoodHub? Register below to get started!</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="register" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="register">Register</TabsTrigger>
                      <TabsTrigger value="login">Login</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="register" className="space-y-4">
                      <form onSubmit={handleRegistration} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={registrationData.email}
                            onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            placeholder="Create a strong password"
                            value={registrationData.password}
                            onChange={(e) => setRegistrationData(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="businessName">Business Name</Label>
                          <Input
                            id="businessName"
                            placeholder="Your Restaurant Name"
                            value={registrationData.businessName}
                            onChange={(e) => setRegistrationData(prev => ({ ...prev, businessName: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            placeholder="City, Area"
                            value={registrationData.location}
                            onChange={(e) => setRegistrationData(prev => ({ ...prev, location: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={registrationData.phone}
                            onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cuisine">Cuisine Type</Label>
                          <Input
                            id="cuisine"
                            placeholder="e.g., Italian, Mexican, Asian"
                            value={registrationData.cuisine}
                            onChange={(e) => setRegistrationData(prev => ({ ...prev, cuisine: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600"
                          disabled={isRegistering}
                        >
                          {isRegistering ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Creating Account...
                            </div>
                          ) : (
                            'Create Vendor Account'
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="login" className="space-y-4">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="loginEmail">Email Address</Label>
                          <Input
                            id="loginEmail"
                            type="email"
                            placeholder="your@email.com"
                            value={loginData.email}
                            onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="loginPassword">Password</Label>
                          <Input
                            id="loginPassword"
                            type="password"
                            placeholder="Enter your password"
                            value={loginData.password}
                            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600"
                          disabled={isLoggingIn}
                        >
                          {isLoggingIn ? (
                            <div className="flex items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Signing In...
                            </div>
                          ) : (
                            'Sign In'
                          )}
                        </Button>
                        
                        <div className="text-center space-y-2">
                          <Button variant="link" size="sm">
                            Forgot Password?
                          </Button>
                          
                          <div className="text-xs text-gray-500">
                            Don't have an account?{' '}
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 h-auto text-xs text-red-600 hover:text-red-700"
                              onClick={() => {
                                // Switch to registration tab
                                const registrationTab = document.querySelector('[value="register"]') as HTMLElement;
                                registrationTab?.click();
                              }}
                            >
                              Sign up here
                            </Button>
                          </div>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to <span className="text-red-500">Succeed</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform provides all the tools you need to manage your food business efficiently and grow your customer base.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-red-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose <span className="text-green-500">FoodHub?</span>
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button size="lg" className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600">
                  Get Started Now
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="text-2xl font-bold text-red-500 mb-2">2,500+</div>
                    <div className="text-gray-600">Active Vendors</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="text-2xl font-bold text-green-500 mb-2">50K+</div>
                    <div className="text-gray-600">Happy Customers</div>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="text-2xl font-bold text-red-500 mb-2">98%</div>
                    <div className="text-gray-600">Satisfaction Rate</div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="text-2xl font-bold text-green-500 mb-2">24/7</div>
                    <div className="text-gray-600">Support</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-green-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white">🍽️</span>
                </div>
                <span className="text-xl font-bold">FoodHub</span>
              </div>
              <p className="text-gray-400">
                Connecting food lovers with local vendors, one meal at a time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Vendors</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Getting Started</li>
                <li>Pricing</li>
                <li>Support</li>
                <li>Resources</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Download App</li>
                <li>How it Works</li>
                <li>Help Center</li>
                <li>Safety</li>
              </ul>
            </div>
            {/* <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>About Us</li>
                <li>Careers</li>
                <li>Press</li>
                <li>Contact</li>
              </ul>
            </div> */}
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 FoodHub. All rights reserved. Build by CODEX.</p>
          </div>
        </div>
      </footer>

      {/* About Dialog */}
      <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">About FoodHub</DialogTitle>
            <DialogDescription>
              Connecting food lovers with local vendors across the globe
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Our Mission</h3>
              <p className="text-gray-600">
                FoodHub is dedicated to empowering local food vendors and connecting them with food enthusiasts 
                in their communities. We believe that great food should be accessible to everyone, and every 
                talented cook deserves a platform to share their culinary creations.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">What We Do</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Provide an easy-to-use platform for food vendors to showcase their dishes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Connect customers with authentic, local food experiences</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Support small businesses and entrepreneurs in the food industry</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Facilitate seamless ordering and delivery experiences</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Our Values</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <h4 className="font-medium">Quality First</h4>
                  <p className="text-sm text-gray-600">We prioritize food quality and safety above all</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h4 className="font-medium">Community Focus</h4>
                  <p className="text-sm text-gray-600">Building stronger local food communities</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Dialog */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Contact Us</DialogTitle>
            <DialogDescription>
              Get in touch with the FoodHub team
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="font-medium">Email Support</h4>
                  <p className="text-sm text-gray-600">support@foodhub.com</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium">Phone Support</h4>
                  <p className="text-sm text-gray-600">+1 (555) 123-FOOD</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium">Live Chat</h4>
                  <p className="text-sm text-gray-600">Available 24/7 on our website</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Business Hours</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p>Saturday: 10:00 AM - 4:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
            
            <div className="text-center">
              <Button className="w-full bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600">
                Send us a Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}