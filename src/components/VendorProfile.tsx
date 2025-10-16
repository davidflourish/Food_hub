import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Star,
  Camera,
  Edit,
  Save,
  Shield,
  Bell,
  Eye,
  TrendingUp,
  Award
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { vendorAPI } from '../utils/api';

interface User {
  id: string;
  email: string;
  businessName?: string;
  location?: string;
  role: 'vendor' | 'admin' | 'customer';
  isVerified?: boolean;
}

interface VendorProfileProps {
  user: User;
  onSignOut?: () => void;
}

export function VendorProfile({ user, onSignOut }: VendorProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    businessName: user.businessName || '',
    email: user.email,
    phone: '+1 (555) 123-4567',
    address: user.location || '',
    description: 'Authentic homemade dishes made with love and fresh ingredients. Specializing in Indian cuisine with a modern twist.',
    cuisine: 'Indian, Asian Fusion',
    openingHours: {
      monday: { open: '09:00', close: '22:00', isOpen: true },
      tuesday: { open: '09:00', close: '22:00', isOpen: true },
      wednesday: { open: '09:00', close: '22:00', isOpen: true },
      thursday: { open: '09:00', close: '22:00', isOpen: true },
      friday: { open: '09:00', close: '23:00', isOpen: true },
      saturday: { open: '10:00', close: '23:00', isOpen: true },
      sunday: { open: '10:00', close: '21:00', isOpen: true }
    },
    notifications: {
      newOrders: true,
      customerReviews: true,
      promotions: false,
      systemUpdates: true
    },
    privacy: {
      showPhone: true,
      showAddress: true,
      showRating: true
    }
  });

  const stats = [
    { label: 'Total Orders', value: '1,247', icon: TrendingUp, color: 'text-blue-600' },
    { label: 'Customer Rating', value: '4.8/5', icon: Star, color: 'text-yellow-500' },
    { label: 'Response Time', value: '< 15 min', icon: Clock, color: 'text-green-600' },
    { label: 'Success Rate', value: '96%', icon: Award, color: 'text-purple-600' }
  ];

  const achievements = [
    { title: 'Top Rated Vendor', description: 'Maintained 4.8+ rating for 6 months', earned: true },
    { title: 'Fast Response', description: 'Average response time under 15 minutes', earned: true },
    { title: 'Customer Favorite', description: '500+ positive reviews', earned: true },
    { title: 'Consistency Pro', description: '95%+ order completion rate', earned: false }
  ];

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully!');
    setIsEditing(false);
  };

  const updateNotificationSetting = (key: string, value: boolean) => {
    setProfileData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
    toast.success(`${key} notifications ${value ? 'enabled' : 'disabled'}`);
  };

  const updatePrivacySetting = (key: string, value: boolean) => {
    setProfileData(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
    toast.success(`Privacy setting updated`);
  };

  const updateOpeningHours = (day: string, field: string, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day as keyof typeof prev.openingHours],
          [field]: value
        }
      }
    }));
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'This action cannot be undone. Type "DELETE" to confirm account deletion:'
    );
    
    if (confirmation !== 'DELETE') {
      toast.error('Account deletion cancelled');
      return;
    }

    const finalConfirmation = window.confirm(
      'Are you absolutely sure? This will permanently delete your account, all menu items, orders, and business data. This cannot be undone.'
    );

    if (!finalConfirmation) {
      toast.error('Account deletion cancelled');
      return;
    }

    try {
      toast.loading('Deleting your account...');
      
      const response = await vendorAPI.deleteAccount();
      
      if (response.success) {
        toast.success('Account deleted successfully');
        setTimeout(() => {
          if (onSignOut) {
            onSignOut();
          }
        }, 2000);
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account. Please try again or contact support.');
    } finally {
      toast.dismiss();
    }
  };

  const dayNames = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Vendor Profile</h2>
          <p className="text-gray-600">Manage your business information and settings</p>
        </div>
        <div className="flex items-center gap-2">
          {user.isVerified ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Shield className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
              <Eye className="h-3 w-3 mr-1" />
              Pending Verification
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="hours">Opening Hours</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-gradient-to-r from-red-500 to-green-500 text-white text-2xl">
                      {profileData.businessName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button size="sm" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 p-0">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold">{profileData.businessName}</h3>
                    <Button
                      variant={isEditing ? "default" : "outline"}
                      onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                    >
                      {isEditing ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{profileData.email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      <span>{profileData.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600">{profileData.address}</span>
                  </div>
                  <p className="text-gray-700">{profileData.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input
                    value={profileData.businessName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, businessName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cuisine Type</Label>
                  <Input
                    value={profileData.cuisine}
                    onChange={(e) => setProfileData(prev => ({ ...prev, cuisine: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Business Description</Label>
                <Textarea
                  value={profileData.description}
                  onChange={(e) => setProfileData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your vendor milestones and badges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      achievement.earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Award className={`h-5 w-5 ${
                        achievement.earned ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Opening Hours</CardTitle>
              <CardDescription>Set your business operating hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(dayNames).map(([key, dayName]) => {
                const hours = profileData.openingHours[key as keyof typeof profileData.openingHours];
                return (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={hours.isOpen}
                        onCheckedChange={(checked) => updateOpeningHours(key, 'isOpen', checked)}
                      />
                      <span className="font-medium min-w-[100px]">{dayName}</span>
                    </div>
                    
                    {hours.isOpen ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => updateOpeningHours(key, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span>to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => updateOpeningHours(key, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">Closed</Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(profileData.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <p className="text-sm text-gray-600">
                      {key === 'newOrders' && 'Get notified when you receive new orders'}
                      {key === 'customerReviews' && 'Get notified when customers leave reviews'}
                      {key === 'promotions' && 'Receive promotional offers and marketing updates'}
                      {key === 'systemUpdates' && 'Important system updates and announcements'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => updateNotificationSetting(key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control what information is visible to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(profileData.privacy).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <div>
                    <h4 className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <p className="text-sm text-gray-600">
                      {key === 'showPhone' && 'Display your phone number on your vendor profile'}
                      {key === 'showAddress' && 'Show your business address to customers'}
                      {key === 'showRating' && 'Display your customer ratings and reviews'}
                    </p>
                  </div>
                  <Switch
                    checked={value}
                    onCheckedChange={(checked) => updatePrivacySetting(key, checked)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Dangerous Actions */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions that will permanently affect your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                <div>
                  <h4 className="font-medium text-red-800">Delete Account</h4>
                  <p className="text-sm text-red-600 mt-1">
                    Permanently delete your vendor account and all associated data. This action cannot be undone.
                  </p>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  className="ml-4"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-xl font-bold">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your business performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm text-gray-600">96%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Order Completion Rate</span>
                    <span className="text-sm text-gray-600">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm text-gray-600">Excellent</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}