import { useState, useEffect } from 'react';
import { vendorAPI } from '../utils/api';
import { toast } from 'sonner@2.0.3';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MenuManagement } from './MenuManagement';
import { OrdersManagement } from './OrdersManagement';
import { VendorProfile } from './VendorProfile';
import { VendorWallet } from './VendorWallet';
import { 
  Home,
  ChefHat,
  ShoppingBag,
  User,
  Wallet,
  LogOut,
  TrendingUp,
  DollarSign,
  Star,
  Clock,
  Bell,
  Settings
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  businessName?: string;
  location?: string;
  role: 'vendor' | 'admin' | 'customer';
  isVerified?: boolean;
}

interface VendorDashboardProps {
  user: User;
  onSignOut: () => void;
}

export function VendorDashboard({ user, onSignOut }: VendorDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVendorData = async () => {
      try {
        // Load vendor stats which includes profile, orders, and metrics
        const statsData = await vendorAPI.getStats();
        
        setVendorProfile({
          businessName: statsData.stats.businessName || user.businessName || 'Your Restaurant',
          rating: statsData.stats.rating || 0.0,
          totalOrders: statsData.stats.totalOrders || 0,
          revenue: statsData.stats.revenue || 0,
          isVerified: statsData.stats.isVerified || false,
          activeMenuItems: statsData.stats.activeMenuItems || 0,
          todaysOrders: statsData.stats.todaysOrders || 0,
          todaysRevenue: statsData.stats.todaysRevenue || 0,
          averageOrderValue: statsData.stats.averageOrderValue || 0,
          joinDate: statsData.stats.joinDate || new Date().toISOString(),
          lastActive: statsData.stats.lastActive || new Date().toISOString()
        });
        
        setRecentOrders(statsData.stats.recentOrders || []);
      } catch (error) {
        console.error('Error loading vendor data:', error);
        
        // Set fresh vendor state - all zeros for new vendors
        setVendorProfile({
          businessName: user.businessName || 'Your Restaurant',
          rating: 0.0,
          totalOrders: 0,
          revenue: 0,
          isVerified: false,
          activeMenuItems: 0,
          todaysOrders: 0,
          todaysRevenue: 0,
          averageOrderValue: 0,
          joinDate: new Date().toISOString(),
          lastActive: new Date().toISOString()
        });
        setRecentOrders([]);
        
        // Don't show error for fresh vendors - this is expected
        console.log('New vendor detected - starting with fresh data');
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [user]);

  const stats = vendorProfile ? [
    {
      title: "Today's Orders",
      value: vendorProfile.todaysOrders?.toString() || '0',
      change: vendorProfile.totalOrders > 0 ? `${vendorProfile.totalOrders} total` : 'Start selling today!',
      icon: ShoppingBag,
      color: 'text-blue-600'
    },
    {
      title: 'Total Revenue',
      value: `₦${vendorProfile.revenue?.toLocaleString() || '0'}`,
      change: vendorProfile.todaysRevenue > 0 ? `₦${vendorProfile.todaysRevenue.toLocaleString()} today` : 'No revenue yet',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Average Rating',
      value: vendorProfile.rating?.toFixed(1) || '0.0',
      change: vendorProfile.rating > 0 ? 'Great work!' : 'Get your first review',
      icon: Star,
      color: 'text-yellow-500'
    },
    {
      title: 'Menu Items',
      value: vendorProfile.activeMenuItems?.toString() || '0',
      change: vendorProfile.activeMenuItems > 0 ? 'Active items' : 'Add your first dish',
      icon: ChefHat,
      color: 'text-blue-600'
    }
  ] : [];

  // recentOrders is now loaded from API in useEffect

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'preparing': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-green-500 rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                <span className="text-white text-xl">🍽️</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-green-500 bg-clip-text text-transparent">
                  FoodHub
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Vendor Dashboard</p>
              </div>
            </div>

            {/* Action Buttons Section */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Notification Bell */}
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
              </Button>
              
              {/* User Profile Section */}
              <div className="flex items-center gap-3 ml-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-r from-red-500 to-green-500 text-white">
                    {user.businessName?.split(' ').map(n => n[0]).join('') || 'V'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Desktop User Info */}
                <div className="hidden sm:block min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.businessName || 'Vendor'}</p>
                  <p className="text-xs text-gray-500 truncate">{user.location || 'Location'}</p>
                </div>
              </div>
              
              {/* Sign Out Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSignOut} 
                className="ml-2 hidden sm:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              
              {/* Mobile Sign Out */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSignOut} 
                className="h-10 w-10 p-0 sm:hidden"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-white shadow-sm border">
            <TabsTrigger 
              value="overview" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="menu" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <ChefHat className="h-5 w-5" />
              <span className="text-xs font-medium">Menu</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="text-xs font-medium">Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="wallet" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <Wallet className="h-5 w-5" />
              <span className="text-xs font-medium">Wallet</span>
            </TabsTrigger>
            <TabsTrigger 
              value="profile" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <User className="h-5 w-5" />
              <span className="text-xs font-medium">Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Loading vendor data...</p>
              </div>
            ) : (
              <>
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-red-500 to-green-500 rounded-2xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        Welcome back, {vendorProfile?.businessName || user.businessName || 'Vendor'}! 👋
                      </h2>
                      <p className="text-red-100">
                        {vendorProfile?.totalOrders === 0 
                          ? "Welcome to FoodHub! Start by adding menu items to attract your first customers."
                          : recentOrders.length > 0 
                            ? `You have ${recentOrders.filter(order => order.status === 'pending').length} new orders waiting for preparation`
                            : "Great job! Keep providing excellent service to your customers."
                        }
                      </p>
                    </div>
                    {!vendorProfile?.isVerified && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Verification Pending
                      </Badge>
                    )}
                  </div>
                </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <stat.icon className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
                <CardDescription>Your latest customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-gray-600">
                              {order.items?.map((item: any) => `${item.name} x${item.quantity}`).join(', ') || 'Order details'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.createdAt).toLocaleString('en-NG', {
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₦{order.amount?.toLocaleString()}</p>
                          <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No recent orders</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('menu')}>
                <CardContent className="p-6 text-center">
                  <ChefHat className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Add New Dish</h3>
                  <p className="text-sm text-gray-600">Upload a new menu item</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab('orders')}>
                <CardContent className="p-6 text-center">
                  <ShoppingBag className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">View Orders</h3>
                  <p className="text-sm text-gray-600">Manage customer orders</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">View Analytics</h3>
                  <p className="text-sm text-gray-600">Check your performance</p>
                </CardContent>
              </Card>
            </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="menu">
            <MenuManagement user={user} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersManagement user={user} />
          </TabsContent>

          <TabsContent value="wallet">
            <VendorWallet />
          </TabsContent>

          <TabsContent value="profile">
            <VendorProfile user={user} onSignOut={onSignOut} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}