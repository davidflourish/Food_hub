import { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
// import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  LogOut,
  Settings,
  Bell,
  BarChart3,
  MapPin,
  Clock,
  Phone,
  Mail,
  Shield,
  Save
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { getAdminCredentials, updateAdminCredentials } from '../utils/adminAuth';

interface User {
  id: string;
  email: string;
  businessName?: string;
  location?: string;
  role: 'vendor' | 'admin' | 'customer';
  isVerified?: boolean;
}

interface FoodHubAdminDashboardProps {
  user: User;
  onSignOut: () => void;
}

interface Vendor {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  location: string;
  cuisine: string;
  rating: number;
  totalOrders: number;
  revenue: number;
  status: 'active' | 'inactive' | 'suspended';
  joinDate: string;
  lastActive: string;
  isVerified: boolean;
}

interface Order {
  id: string;
  vendorId: string;
  vendorName: string;
  customerName: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderTime: string;
}

interface Review {
  id: string;
  vendorId: string;
  vendorName: string;
  customerName: string;
  rating: number;
  review: string;
  date: string;
}

export function FoodHubAdminDashboard({ user, onSignOut }: FoodHubAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  
  // Admin settings state
  const [adminCredentials, setAdminCredentials] = useState(() => getAdminCredentials());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newCredentials, setNewCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [commissionData, setCommissionData] = useState<any>(null);
  const [loadingCommissions, setLoadingCommissions] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load vendors
        const vendorData = await adminAPI.getVendors();
        setVendors(vendorData.vendors || []);
        
        // Load commission data
        const commissionResponse = await adminAPI.getCommissions();
        setCommissionData(commissionResponse);
      } catch (error) {
        console.error('Error loading data:', error);
        setVendors([]);
        setCommissionData(null);
      } finally {
        setLoadingVendors(false);
        setLoadingCommissions(false);
      }
    };

    loadData();
  }, []);

  const handleDeleteVendor = async (vendorId: string, vendorName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${vendorName}? This action cannot be undone and will delete all their menu items and orders.`)) {
      return;
    }

    try {
      toast.loading('Deleting vendor...');
      
      const response = await adminAPI.deleteVendor(vendorId);
      
      if (response.success) {
        setVendors(prev => prev.filter(v => v.id !== vendorId));
        toast.success('Vendor deleted successfully');
      } else {
        throw new Error('Failed to delete vendor');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast.error('Failed to delete vendor. Please try again.');
    } finally {
      toast.dismiss();
    }
  };

  const [orders] = useState<Order[]>([
    {
      id: 'ORD001',
      vendorId: '1',
      vendorName: 'Spice Garden Restaurant',
      customerName: 'Sarah Johnson',
      amount: 24.99,
      status: 'preparing',
      orderTime: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: 'ORD002',
      vendorId: '2',
      vendorName: 'Healthy Bites Co.',
      customerName: 'Mike Chen',
      amount: 18.50,
      status: 'ready',
      orderTime: new Date(Date.now() - 25 * 60 * 1000).toISOString()
    },
    {
      id: 'ORD003',
      vendorId: '1',
      vendorName: 'Spice Garden Restaurant',
      customerName: 'Emma Davis',
      amount: 32.75,
      status: 'delivered',
      orderTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const [reviews] = useState<Review[]>([
    {
      id: '1',
      vendorId: '1',
      vendorName: 'Spice Garden Restaurant',
      customerName: 'John Smith',
      rating: 5,
      review: 'Amazing food! The chicken tikka masala was absolutely delicious and arrived hot.',
      date: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      vendorId: '2',
      vendorName: 'Healthy Bites Co.',
      customerName: 'Lisa Brown',
      rating: 4,
      review: 'Great healthy options. The quinoa bowl was fresh and filling.',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      vendorId: '3',
      vendorName: 'Pizza Palace',
      customerName: 'David Wilson',
      rating: 3,
      review: 'Pizza was good but delivery was a bit slow. Could improve on timing.',
      date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  const totalRevenue = vendors.reduce((sum, vendor) => sum + vendor.revenue, 0);
  const totalOrders = vendors.reduce((sum, vendor) => sum + vendor.totalOrders, 0);
  const activeVendors = vendors.filter(vendor => vendor.status === 'active').length;
  const averageRating = vendors.reduce((sum, vendor) => sum + vendor.rating, 0) / vendors.length;
  const platformEarnings = commissionData?.summary?.totalEarnings || 0;

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = vendorFilter === 'all' || vendor.status === vendorFilter;
    return matchesSearch && matchesFilter;
  });

  const filteredReviews = reviews.filter(review => {
    if (vendorFilter === 'all') return true;
    return review.vendorId === vendorFilter;
  });

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCredentials.email || !newCredentials.password) {
      toast.error('Please fill in all fields');
      return;
    }
    
    if (newCredentials.password !== newCredentials.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (newCredentials.password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (updateAdminCredentials(newCredentials.email, newCredentials.password)) {
      setAdminCredentials({ email: newCredentials.email, password: newCredentials.password });
    } else {
      toast.error('Failed to update credentials');
      return;
    }
    setNewCredentials({ email: '', password: '', confirmPassword: '' });
    setIsSettingsOpen(false);
    
    toast.success('Admin credentials updated successfully!');
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
                  FoodHub Admin
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Platform Administrator</p>
              </div>
            </div>

            {/* Action Buttons Section */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Notification Bell */}
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
              </Button>
              
              {/* Settings */}
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
                    <Settings className="h-5 w-5" />
                  </Button>
                </DialogTrigger>
              </Dialog>
              
              {/* User Profile Section */}
              <div className="flex items-center gap-3 ml-2">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-r from-red-500 to-green-500 text-white">
                    A
                  </AvatarFallback>
                </Avatar>
                
                <div className="hidden sm:block min-w-0">
                  <p className="text-sm font-medium text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500">Administrator</p>
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
              <BarChart3 className="h-5 w-5" />
              <span className="text-xs font-medium">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="commissions" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-xs font-medium">💰 Earnings</span>
            </TabsTrigger>
            <TabsTrigger 
              value="vendors" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium">Vendors</span>
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <ShoppingBag className="h-5 w-5" />
              <span className="text-xs font-medium">Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-gradient-to-br data-[state=active]:from-red-50 data-[state=active]:to-green-50 data-[state=active]:text-red-700"
            >
              <Star className="h-5 w-5" />
              <span className="text-xs font-medium">Reviews</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-red-500 to-green-500 rounded-2xl p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome to FoodHub Admin</h2>
              <p className="text-red-100">Monitor vendor performance, track orders, and manage the platform</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Platform Revenue</p>
                      <p className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-700">💰 Your Earnings</p>
                      <p className="text-2xl font-bold text-green-600">₦{platformEarnings.toLocaleString()}</p>
                    </div>
                    <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    {((commissionData?.commissionRate || 0) * 100).toFixed(1)}% commission on all orders
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold">{totalOrders}</p>
                    </div>
                    <ShoppingBag className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Vendors</p>
                      <p className="text-2xl font-bold">{activeVendors}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Rating</p>
                      <p className="text-2xl font-bold">{averageRating.toFixed(1)}</p>
                    </div>
                    <Star className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-gray-600">{order.vendorName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${order.amount}</p>
                          <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Reviews</CardTitle>
                  <CardDescription>Latest customer feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{review.customerName}</p>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm">{review.rating}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{review.review}</p>
                        <p className="text-xs text-gray-500">{review.vendorName}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-6">
            {/* Commission Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-green-600">
                        ₦{commissionData?.summary?.totalEarnings?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">This Month</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ₦{commissionData?.summary?.currentMonthEarnings?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Commission Rate</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {((commissionData?.commissionRate || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg per Order</p>
                      <p className="text-2xl font-bold text-orange-600">
                        ₦{commissionData?.summary?.averageCommissionPerOrder?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Commission Records */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Commission Earnings</CardTitle>
                <CardDescription>Your latest commission earnings from platform orders</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingCommissions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading commission data...</p>
                  </div>
                ) : commissionData?.recentCommissions?.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {commissionData.recentCommissions.map((commission: any) => (
                      <div key={commission.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-sm text-gray-600">#{commission.orderId}</span>
                            <Badge className="bg-green-100 text-green-800">
                              +₦{commission.commissionAmount}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            Order Amount: ₦{commission.orderAmount} • 
                            Commission: {((commission.commissionRate || 0) * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(commission.createdAt).toLocaleDateString()} at {new Date(commission.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            ₦{commission.commissionAmount}
                          </div>
                          <div className="text-xs text-gray-500">
                            {commission.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No Commissions Yet</h3>
                    <p className="text-gray-600">Commission earnings will appear here as orders are placed on the platform.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            {/* Vendor Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vendors..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Vendors List */}
            <div className="grid grid-cols-1 gap-4">
              {loadingVendors ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading vendors...</p>
                </div>
              ) : filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-gradient-to-r from-red-500 to-green-500 text-white">
                            {vendor.businessName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{vendor.businessName}</h3>
                            <Badge className={`${getStatusColor(vendor.status)}`}>
                              {vendor.status}
                            </Badge>
                            {vendor.isVerified && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {vendor.email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {vendor.phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {vendor.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Last active: {vendor.lastActive}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="font-medium">{vendor.rating}</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {vendor.totalOrders} orders
                            </div>
                            <div className="text-sm text-gray-600">
                              ₦{vendor.revenue.toLocaleString()} revenue
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {vendor.status === 'active' ? (
                          <Button variant="outline" size="sm" className="text-red-600">
                            Suspend
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" className="text-green-600">
                            Activate
                          </Button>
                        )}
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteVendor(vendor.id, vendor.businessName)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No Vendors Found</h3>
                  <p className="text-gray-600">No vendors have registered on the platform yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                          <span className="font-mono text-sm text-gray-600">#{order.id}</span>
                          <span className="text-sm text-gray-500">{getTimeAgo(order.orderTime)}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Customer</p>
                            <p className="font-medium">{order.customerName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Vendor</p>
                            <p className="font-medium">{order.vendorName}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Amount</p>
                            <p className="font-semibold text-green-600">₦{order.amount}</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            {/* Review Filters */}
            <div className="flex gap-4">
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.businessName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reviews List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{review.customerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">{review.customerName}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${
                                  i < review.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {getTimeAgo(review.date)}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{review.review}</p>
                        <p className="text-sm text-gray-500">
                          {review.vendorName}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Admin Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Admin Settings
            </DialogTitle>
            <DialogDescription>
              Update your admin login credentials. These changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateCredentials} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                placeholder="Enter new admin email"
                value={newCredentials.email}
                onChange={(e) => setNewCredentials(prev => ({ ...prev, email: e.target.value }))}
                required
              />
              <p className="text-xs text-gray-500">Current: {adminCredentials.email}</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminPassword">New Password</Label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="Enter new password"
                value={newCredentials.password}
                onChange={(e) => setNewCredentials(prev => ({ ...prev, password: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={newCredentials.confirmPassword}
                onChange={(e) => setNewCredentials(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important Security Notice</p>
                  <p>Changing these credentials will update your admin login details. Make sure to save them securely.</p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsSettingsOpen(false);
                  setNewCredentials({ email: '', password: '', confirmPassword: '' });
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600"
              >
                <Save className="h-4 w-4 mr-2" />
                Update Credentials
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}