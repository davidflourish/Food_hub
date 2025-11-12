import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase/client';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  ShoppingCart, 
  Heart,
  Filter,
  Plus,
  Minus,
  LogOut,
  User,
  Home,
  Receipt,
  ChefHat
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { customerAPI, paymentAPI } from '../utils/api';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { formatNaira, nigerianBanks } from '../utils/paystack';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';

interface User {
  id: string;
  email: string;
  businessName?: string;
  location?: string;
  role: 'vendor' | 'admin' | 'customer';
  isVerified?: boolean;
}

interface CustomerAppProps {
  user: User;
  onSignOut?: () => void;  // Optional now
}

interface Vendor {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  image: string;
  isOpen: boolean;
  deliveryFee: number;
  distance: string;
}

interface MenuItem {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  dietaryTags: string[];
  isAvailable: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
}

export function CustomerApp({ user, onSignOut }: CustomerAppProps) {
  const [activeTab, setActiveTab] = useState('browse');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMenus, setLoadingMenus] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    const loadVendorsAndMenus = async () => {
      try {
        const data = await customerAPI.getVendors();
        
        // Transform vendor data from API to match our interface
        const transformedVendors = (data.vendors || []).map((vendor: any) => ({
          id: vendor.id,
          name: vendor.businessName || 'Restaurant',
          cuisine: vendor.cuisine || 'Food',
          rating: vendor.rating || 0,
          deliveryTime: '20-30 min', // Default for now
          image: 'https://images.unsplash.com/photo-1645066803695-f0dbe2c33e42?w=400', // Default image
          isOpen: vendor.status === 'active',
          deliveryFee: 250, // Default delivery fee
          distance: '1-2 km' // Default distance
        }));
        
        setVendors(transformedVendors);

        // Load menu items only when needed (not all at once)
        setMenuItems([]);
        setLoadingMenus(false);
      } catch (error) {
        console.log('Loading vendors from API...');
        // Set empty array for fresh start - no demo vendors
        setVendors([]);
        setMenuItems([]);
      } finally {
        setLoading(false);
        setLoadingMenus(false);
      }
    };

    loadVendorsAndMenus();
  }, []);

  const handleLocalSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();  // Modern v2 call
      if (error) throw error;
      
      toast.success('Signed out successfully!');
      // Redirect or emit event to parent
      window.location.href = '/';  // Simple redirect
      localStorage.removeItem('foodhub_admin_user');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out—try refreshing.');
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
    toast.success(`${item.name} added to cart!`);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      } else {
        return prev.filter(cartItem => cartItem.id !== itemId);
      }
    });
  };

  const toggleFavorite = (vendorId: string) => {
    setFavorites(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getFinalTotal = () => {
    const subtotal = getTotalPrice();
    const deliveryFee = 250; // Hidden from customer
    const tax = Math.round(subtotal * 0.05); // 5% tax - Hidden from customer
    return subtotal + deliveryFee + tax;
  };

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!customerPhone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please enter a delivery address');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setProcessingPayment(true);
   

    try {
      // Group cart items by vendor
      const vendorGroups = cart.reduce((groups, item) => {
        if (!groups[item.vendorId]) {
          groups[item.vendorId] = [];
        }
        groups[item.vendorId].push(item);
        return groups;
      }, {} as Record<string, CartItem[]>);

      // For now, we'll handle single vendor checkout
      // In production, you might want to create separate orders for each vendor
      const vendorId = Object.keys(vendorGroups)[0];
      const finalTotal = getFinalTotal();

      // Create order first
      const orderResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8966d869/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          vendorId,
          customerId: user.id,
          customerEmail: user.email,
          customerName: customerName || user.businessName || user.email,
          customerPhone: customerPhone || 'N/A',
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          amount: finalTotal,
          deliveryAddress,
          deliveryNotes,
          subtotal: getTotalPrice(),
          deliveryFee: 250, // Hidden from customer
          tax: Math.round(getTotalPrice() * 0.05) // 5% tax - Hidden from customer
        })
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create order');
      }

      setShowCheckoutDialog(false);
      const orderId = orderData.orderId;
      
      // Initialize Paystack payment
      const paymentResponse = await paymentAPI.initialize(orderId, user.email, finalTotal);

      if (!paymentResponse.success) {
        throw new Error('Failed to initialize payment');
      }

      // Add Paystack script if not already loaded
      if (!(window as any).PaystackPop) {
        const script = document.createElement('script');
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        document.body.appendChild(script);

        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Open Paystack payment popup
      const paystackPublicKey = 'pk_live_66da9b621828a364e77c12d4dcd98d28888f9607'; // Paystack live public key
      const handler = (window as any).PaystackPop.setup({
        key: paystackPublicKey,
        email: user.email,
        amount: finalTotal * 100, // Convert to kobo
        currency: 'NGN',
        ref: paymentResponse.reference,
        onClose: function() {
          setProcessingPayment(false);
          toast.info('Payment cancelled');
        },
        callback: function(response: any) {
          console.log('Paystack success:', response);  // Debug log (remove after testing)
          // Verify payment
          paymentAPI.verify(response.reference).then((verifyResponse) => {
            if (verifyResponse.success) {
              toast.success('Payment successful! Order confirmed.');
              setCart([]);
              setDeliveryAddress('');
              setDeliveryNotes('');
              setCustomerName('');
              setCustomerPhone('');
              setActiveTab('orders');
            } else {
              toast.error('Payment verification failed');
            }
          }).catch((error) => {
            console.error('Payment verification error:', error);
            toast.error('Failed to verify payment');
          }).finally(() => {
            setProcessingPayment(false);
          });
        }
      });

      handler.openIframe();
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process checkout');
      setProcessingPayment(false);
    }
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.cuisine.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getVendorMenuItems = (vendorId: string) => {
    return menuItems.filter(item => item.vendorId === vendorId);
  };

  // Load menu items for a specific vendor when viewing their menu
  const loadVendorMenu = async (vendorId: string) => {
    // Check if we already have menu items for this vendor
    if (menuItems.some(item => item.vendorId === vendorId)) {
      return;
    }

    setLoadingMenus(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-8966d869/vendor/menu-items/${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const menuData = await response.json();
        const vendorMenuItems = (menuData.menuItems || []).map((item: any) => ({
          id: item.id,
          vendorId: vendorId,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image || 'https://images.unsplash.com/photo-1645066803695-f0dbe2c33e42?w=300',
          category: item.category,
          dietaryTags: item.dietaryTags || [],
          isAvailable: item.isAvailable !== false
        }));
        
        setMenuItems(prev => [...prev, ...vendorMenuItems]);
      }
    } catch (error) {
      console.log(`Error loading menu for vendor ${vendorId}:`, error);
    } finally {
      setLoadingMenus(false);
  
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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
                <p className="text-xs text-gray-500">Customer App</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Cart Icon */}
              <Button variant="ghost" size="sm" className="relative" onClick={() => setActiveTab('cart')}>
                <ShoppingCart className="h-5 w-5" />
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </Button>

              {/* User Profile */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-r from-red-500 to-green-500 text-white">
                    {user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium">Customer</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>

              <Button variant="outline" size="sm" onClick={onSignOut || handleLocalSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-white shadow-sm border">
            <TabsTrigger 
              value="browse" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs font-medium">Browse</span>
            </TabsTrigger>
            <TabsTrigger 
              value="search" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <Search className="h-5 w-5" />
              <span className="text-xs font-medium">Search</span>
            </TabsTrigger>
            <TabsTrigger 
              value="cart" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-xs font-medium">Cart ({getCartItemCount()})</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <Receipt className="h-5 w-5" />
              <span className="text-xs font-medium">Orders</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading vendors...</p>
              </div>
            ) : selectedVendor ? (
              // Vendor Menu View
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Button variant="outline" onClick={() => setSelectedVendor(null)}>
                    ← Back to Vendors
                  </Button>
                  <h2 className="text-2xl font-bold">
                    {vendors.find(v => v.id === selectedVendor)?.name}
                  </h2>
                </div>

                {loadingMenus ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading menu items...</p>
                  </div>
                ) : getVendorMenuItems(selectedVendor).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getVendorMenuItems(selectedVendor).map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge variant={item.isAvailable ? 'default' : 'secondary'}>
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2">{item.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                        
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.dietaryTags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-green-600">₦{item.price.toLocaleString()}</span>
                          <Button 
                            onClick={() => addToCart(item)}
                            disabled={!item.isAvailable}
                            className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChefHat className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Menu Items Yet</h3>
                    <p className="text-gray-600">This vendor hasn't added any menu items yet. Check back soon!</p>
                  </div>
                )}
              </div>
            ) : (
              // Vendors List View
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Popular Vendors Near You</h2>
                  <p className="text-gray-600">Discover amazing food from local vendors</p>
                </div>

                {vendors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vendors.map((vendor) => (
                      <Card key={vendor.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="relative" onClick={() => {
                          setSelectedVendor(vendor.id);
                          loadVendorMenu(vendor.id);
                        }}>
                          <img
                            src={vendor.image}
                            alt={vendor.name}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-2 left-2">
                            <Badge variant={vendor.isOpen ? 'default' : 'secondary'}>
                              {vendor.isOpen ? 'Open' : 'Closed'}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(vendor.id);
                            }}
                          >
                            <Heart 
                              className={`h-4 w-4 ${favorites.includes(vendor.id) ? 'text-red-500 fill-current' : 'text-gray-600'}`} 
                            />
                          </Button>
                        </div>
                        <CardContent className="p-4" onClick={() => {
                          setSelectedVendor(vendor.id);
                          loadVendorMenu(vendor.id);
                        }}>
                          <h3 className="font-semibold text-lg mb-1">{vendor.name}</h3>
                          <p className="text-gray-600 text-sm mb-2">{vendor.cuisine}</p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span>{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{vendor.deliveryTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{vendor.distance}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Delivery: ₦{vendor.deliveryFee.toLocaleString()}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVendor(vendor.id);
                                loadVendorMenu(vendor.id);
                              }}
                            >
                              View Menu
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChefHat className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Vendors Available Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Restaurants are joining FoodHub! Check back soon for delicious food options.
                    </p>
                    <div className="bg-gradient-to-r from-red-50 to-green-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm text-red-800">
                        <strong>Are you a restaurant owner?</strong><br />
                        Join FoodHub today and start reaching hungry customers!
                      </p>
                      <Button 
                        className="mt-3 w-full bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600 text-white"
                        onClick={() => window.location.reload()}
                      >
                        Refresh to Check for New Vendors
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for food, vendors, or cuisines..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={vendor.image}
                      alt={vendor.name}
                      className="w-full h-48 object-cover"
                    />
                    <Badge 
                      className="absolute top-2 left-2"
                      variant={vendor.isOpen ? 'default' : 'secondary'}
                    >
                      {vendor.isOpen ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{vendor.name}</h3>
                    <p className="text-gray-600 text-sm mb-2">{vendor.cuisine}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm">{vendor.rating > 0 ? vendor.rating.toFixed(1) : 'New'}</span>
                      <span className="text-sm text-gray-500">• {vendor.deliveryTime}</span>
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => {
                        setSelectedVendor(vendor.id);
                        loadVendorMenu(vendor.id);
                        setActiveTab('browse');
                      }}
                    >
                      View Menu
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cart" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Cart</h2>
              <p className="text-gray-600">Review your items before checkout</p>
            </div>

            {cart.length === 0 ? (
              <Card className="p-8 text-center">
                <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-4">Start browsing vendors to add delicious items!</p>
                <Button onClick={() => setActiveTab('browse')}>
                  Browse Vendors
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.name}</h3>
                          <p className="text-sm text-gray-600">₦{item.price.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToCart(item)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                        <span>₦{getTotalPrice().toLocaleString()}</span>
                      </div>
                      <hr />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total to Pay:</span>
                        <span className="text-green-600">₦{getFinalTotal().toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-500">Total includes delivery fee and applicable taxes</p>
                    </div>
                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600"
                      onClick={() => setShowCheckoutDialog(true)}
                      disabled={cart.length === 0}
                    >
                      Proceed to Checkout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Orders</h2>
              <p className="text-gray-600">Track your current and past orders</p>
            </div>

            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-4">Your order history will appear here once you place your first order</p>
                <Button onClick={() => setActiveTab('browse')}>
                  Start Ordering
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>
              Complete your order details and proceed to payment
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Your Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter your full name..."
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                type="tel"
                placeholder="e.g., 08012345678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Delivery Address *</Label>
              <textarea
                id="deliveryAddress"
                className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                placeholder="Enter your complete delivery address..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
              <textarea
                id="deliveryNotes"
                className="w-full min-h-[60px] px-3 py-2 border rounded-md"
                placeholder="Any special instructions for delivery..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
              />
            </div>

            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="space-y-3">
                  {/* Show items list */}
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium">₦{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  
                  <hr className="my-3" />
                  
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items):</span>
                    <span>₦{getTotalPrice().toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total to Pay:</span>
                    <span className="text-green-600">₦{getFinalTotal().toLocaleString()}</span>
                  </div>
                  
                  <p className="text-xs text-gray-500 italic">
                    *Total includes delivery and applicable charges
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCheckoutDialog(false)}
              disabled={processingPayment}
            >
              Cancel
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600"
              onClick={handleCheckout}
              disabled={processingPayment || !deliveryAddress.trim() || !customerName.trim() || !customerPhone.trim()}
            >
              {processingPayment ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Processing...
                </div>
              ) : (
                `Pay ₦${getFinalTotal().toLocaleString()}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}