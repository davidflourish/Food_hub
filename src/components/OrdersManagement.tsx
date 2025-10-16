import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  Phone,
  MapPin,
  DollarSign,
  Star,
  AlertCircle,
  Truck,
  Timer,
  ChefHat
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface User {
  id: string;
  email: string;
  businessName?: string;
  location?: string;
  role: 'vendor' | 'admin' | 'customer';
  isVerified?: boolean;
}

interface Order {
  id: string;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }[];
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderTime: string;
  deliveryTime?: string;
  paymentMethod: string;
  customerRating?: number;
  customerReview?: string;
}

interface OrdersManagementProps {
  user: User;
}

export function OrdersManagement({ user }: OrdersManagementProps) {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD001',
      customer: {
        name: 'Sarah Johnson',
        phone: '+1 (555) 123-4567',
        address: '123 Main St, Apt 4B, Downtown'
      },
      items: [
        { name: 'Chicken Tikka Masala', quantity: 1, price: 18.99 },
        { name: 'Basmati Rice', quantity: 1, price: 4.99 }
      ],
      total: 23.98,
      status: 'pending',
      orderTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      paymentMethod: 'Credit Card'
    },
    {
      id: 'ORD002',
      customer: {
        name: 'Mike Chen',
        phone: '+1 (555) 987-6543',
        address: '456 Oak Avenue, Suite 12, Midtown'
      },
      items: [
        { name: 'Quinoa Buddha Bowl', quantity: 2, price: 14.99 },
        { name: 'Green Smoothie', quantity: 1, price: 6.99 }
      ],
      total: 36.97,
      status: 'preparing',
      orderTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      paymentMethod: 'PayPal'
    },
    {
      id: 'ORD003',
      customer: {
        name: 'Emma Davis',
        phone: '+1 (555) 456-7890',
        address: '789 Pine Street, Floor 3, Uptown'
      },
      items: [
        { name: 'Classic Margherita Pizza', quantity: 1, price: 16.50, specialInstructions: 'Extra cheese, light sauce' }
      ],
      total: 16.50,
      status: 'ready',
      orderTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      paymentMethod: 'Cash'
    },
    {
      id: 'ORD004',
      customer: {
        name: 'John Smith',
        phone: '+1 (555) 234-5678',
        address: '321 Elm Street, House 45, Suburbs'
      },
      items: [
        { name: 'Chicken Tikka Masala', quantity: 1, price: 18.99 },
        { name: 'Naan Bread', quantity: 2, price: 3.99 },
        { name: 'Mango Lassi', quantity: 1, price: 4.99 }
      ],
      total: 31.96,
      status: 'delivered',
      orderTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      deliveryTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      paymentMethod: 'Credit Card',
      customerRating: 5,
      customerReview: 'Amazing food! Fast delivery and everything was hot and fresh.'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <ChefHat className="h-4 w-4" />;
      case 'ready': return <Timer className="h-4 w-4" />;
      case 'delivered': return <Truck className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
    
    toast.success(`Order ${orderId} status updated to ${newStatus}`);
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

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  const pendingOrders = getOrdersByStatus('pending');
  const preparingOrders = getOrdersByStatus('preparing');
  const readyOrders = getOrdersByStatus('ready');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Orders Management</h2>
          <p className="text-gray-600">Track and manage your customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-50">
            {pendingOrders.length} Pending
          </Badge>
          <Badge variant="outline" className="bg-orange-50">
            {preparingOrders.length} Preparing
          </Badge>
          <Badge variant="outline" className="bg-green-50">
            {readyOrders.length} Ready
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold">${orders.reduce((sum, order) => sum + order.total, 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">4.8</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold">96%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search orders by customer name or order ID..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders
              .filter(order => !['delivered', 'cancelled'].includes(order.status))
              .map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <span className="font-mono text-sm text-gray-600">#{order.id}</span>
                        <span className="text-sm text-gray-500">{getTimeAgo(order.orderTime)}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{order.customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{order.customer.name}</p>
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Phone className="h-3 w-3" />
                                {order.customer.phone}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-start gap-1 text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{order.customer.address}</span>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Order Items:</h4>
                          <ul className="space-y-1">
                            {order.items.map((item, index) => (
                              <li key={index} className="text-sm">
                                <span className="text-gray-600">{item.quantity}x</span> {item.name}
                                <span className="text-green-600 ml-2">${item.price}</span>
                                {item.specialInstructions && (
                                  <p className="text-xs text-orange-600 italic">
                                    Note: {item.specialInstructions}
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 pt-2 border-t">
                            <p className="font-semibold">Total: <span className="text-green-600">${order.total}</span></p>
                            <p className="text-sm text-gray-500">Payment: {order.paymentMethod}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 min-w-0 lg:min-w-[120px]">
                      {order.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Confirm
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            className="text-red-600 hover:text-red-700"
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'preparing')}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Start Preparing
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'ready')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateOrderStatus(order.id, 'delivered')}
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredOrders
              .filter(order => ['delivered', 'cancelled'].includes(order.status))
              .map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge className={`${getStatusColor(order.status)} flex items-center gap-1`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <span className="font-mono text-sm text-gray-600">#{order.id}</span>
                        <span className="text-sm text-gray-500">{getTimeAgo(order.orderTime)}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium">{order.customer.name}</p>
                          <p className="text-sm text-gray-600">{order.customer.phone}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Total: <span className="text-green-600">${order.total}</span></p>
                          <p className="text-sm text-gray-500">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {order.customerRating && (
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end mb-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{order.customerRating}/5</span>
                        </div>
                        {order.customerReview && (
                          <p className="text-sm text-gray-600 max-w-xs">{order.customerReview}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {orders
              .filter(order => order.customerRating && order.customerReview)
              .map((order) => (
              <Card key={order.id}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{order.customer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-medium">{order.customer.name}</p>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-4 w-4 ${
                                i < (order.customerRating || 0) 
                                  ? 'text-yellow-400 fill-current' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-500">
                          {getTimeAgo(order.deliveryTime || order.orderTime)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{order.customerReview}</p>
                      <p className="text-sm text-gray-500">
                        Order #{order.id} • {order.items.map(item => item.name).join(', ')}
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
  );
}