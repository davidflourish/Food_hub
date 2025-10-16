import { useState, useEffect } from 'react';
import { menuAPI } from '../utils/api';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Upload,
  DollarSign,
  Clock,
  Star,
  Eye,
  EyeOff,
  Camera,
  Leaf,
  Wheat,
  Flame,
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

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  ingredients: string[];
  dietaryTags: string[];
  preparationTime: number;
  isAvailable: boolean;
  rating: number;
  orders: number;
}

interface MenuManagementProps {
  user: User;
}

export function MenuManagement({ user }: MenuManagementProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        const data = await menuAPI.getItems();
        setItems(data.menuItems || []);
      } catch (error) {
        console.log('New vendor detected - starting with empty menu');
        // Start with empty menu for new vendors - this is expected
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [filter, setFilter] = useState('all');

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    ingredients: '',
    dietaryTags: [] as string[],
    preparationTime: '',
    image: ''
  });

  const categories = ['Appetizers', 'Main Course', 'Pizza', 'Desserts', 'Beverages', 'Healthy', 'Specials'];
  const dietaryOptions = ['Vegan', 'Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb', 'Spicy', 'Healthy'];

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!newItem.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }
    
    if (!newItem.description.trim()) {
      toast.error('Please enter a description');
      return;
    }
    
    if (!newItem.price || parseFloat(newItem.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    
    if (!newItem.category) {
      toast.error('Please select a category');
      return;
    }
    
    if (!newItem.ingredients.trim()) {
      toast.error('Please enter ingredients');
      return;
    }
    
    if (!newItem.preparationTime || parseInt(newItem.preparationTime) <= 0) {
      toast.error('Please enter a valid preparation time');
      return;
    }
    
    try {
      const menuItemData = {
        name: newItem.name.trim(),
        description: newItem.description.trim(),
        price: parseFloat(newItem.price),
        category: newItem.category,
        image: newItem.image.trim() || 'https://images.unsplash.com/photo-1645066803695-f0dbe2c33e42?w=400',
        ingredients: newItem.ingredients.split(',').map(i => i.trim()).filter(i => i.length > 0),
        dietaryTags: newItem.dietaryTags,
        preparationTime: parseInt(newItem.preparationTime),
        isAvailable: true,
        rating: 0,
        orders: 0
      };

      // Save to backend
      const response = await menuAPI.addItem(menuItemData);
      
      // Add to local state with the returned ID
      const item: MenuItem = {
        ...menuItemData,
        id: response.itemId
      };
      
      setItems(prev => [...prev, item]);
      toast.success('Menu item added successfully! Your stats have been updated.');
      setIsAddItemOpen(false);
      setNewItem({
        name: '',
        description: '',
        price: '',
        category: '',
        ingredients: '',
        dietaryTags: [],
        preparationTime: '',
        image: ''
      });
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast.error('Failed to add menu item');
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) return;
    
    try {
      const updatedData = {
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        category: newItem.category,
        ingredients: newItem.ingredients.split(',').map(i => i.trim()),
        dietaryTags: newItem.dietaryTags,
        preparationTime: parseInt(newItem.preparationTime)
      };

      await menuAPI.updateItem(selectedItem.id, updatedData);
      
      setItems(prev => prev.map(item => 
        item.id === selectedItem.id 
          ? { ...item, ...updatedData }
          : item
      ));
      
      toast.success('Menu item updated successfully!');
      setIsEditItemOpen(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast.error('Failed to update menu item. Please try again.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await menuAPI.deleteItem(itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Menu item deleted successfully!');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item. Please try again.');
    }
  };

  const toggleAvailability = async (itemId: string) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const newAvailability = !item.isAvailable;
      await menuAPI.updateItem(itemId, { isAvailable: newAvailability });
      
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, isAvailable: newAvailability }
          : item
      ));
      
      toast.success(`Item ${newAvailability ? 'made available' : 'made unavailable'}`);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability. Please try again.');
    }
  };

  const openEditDialog = (item: MenuItem) => {
    setSelectedItem(item);
    setNewItem({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      ingredients: item.ingredients.join(', '),
      dietaryTags: item.dietaryTags,
      preparationTime: item.preparationTime.toString(),
      image: item.image || ''
    });
    setIsEditItemOpen(true);
  };

  const toggleDietaryTag = (tag: string) => {
    setNewItem(prev => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter(t => t !== tag)
        : [...prev.dietaryTags, tag]
    }));
  };

  const getDietaryIcon = (tag: string) => {
    switch (tag) {
      case 'Vegan': return <Leaf className="h-3 w-3" />;
      case 'Vegetarian': return <Leaf className="h-3 w-3" />;
      case 'Gluten-Free': return <Wheat className="h-3 w-3" />;
      case 'Spicy': return <Flame className="h-3 w-3" />;
      default: return null;
    }
  };

  const filteredItems = items.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'available') return item.isAvailable;
    if (filter === 'unavailable') return !item.isAvailable;
    return item.category === filter;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Menu Management</h2>
          <p className="text-gray-600">
            {items.length === 0 
              ? "Start building your menu! Add your first delicious dish to attract customers."
              : "Manage your food items, prices, and availability"
            }
          </p>
        </div>
        <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600">
              <Plus className="h-4 w-4 mr-2" />
              Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
              <DialogDescription>
                Create a new food item for your menu
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    placeholder="e.g., Chicken Tikka Masala"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={newItem.price}
                    onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe your delicious dish..."
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Preparation Time (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="15"
                    min="1"
                    value={newItem.preparationTime}
                    onChange={(e) => setNewItem(prev => ({ ...prev, preparationTime: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Ingredients (comma separated)</Label>
                <Input
                  placeholder="e.g., Chicken, Tomatoes, Cream, Onions"
                  value={newItem.ingredients}
                  onChange={(e) => setNewItem(prev => ({ ...prev, ingredients: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Dietary Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((tag) => (
                    <Badge
                      key={tag}
                      variant={newItem.dietaryTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleDietaryTag(tag)}
                    >
                      {getDietaryIcon(tag)}
                      <span className="ml-1">{tag}</span>
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Image URL (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={newItem.image}
                    onChange={(e) => setNewItem(prev => ({ ...prev, image: e.target.value }))}
                  />
                  <Button type="button" variant="outline">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddItemOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600">
                  Add Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All Items ({items.length})
        </Button>
        <Button
          variant={filter === 'available' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('available')}
        >
          Available ({items.filter(i => i.isAvailable).length})
        </Button>
        <Button
          variant={filter === 'unavailable' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unavailable')}
        >
          Unavailable ({items.filter(i => !i.isAvailable).length})
        </Button>
      </div>

      {/* Menu Items Grid */}
      {filteredItems.length === 0 ? (
        <Card className="p-8 text-center">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {items.length === 0 ? "No menu items yet" : "No items match your filter"}
          </h3>
          <p className="text-gray-600 mb-6">
            {items.length === 0 
              ? "Start building your menu by adding your first delicious dish! This will help customers discover your restaurant."
              : "Try adjusting your filter to see more items."
            }
          </p>
          {items.length === 0 && (
            <Button 
              onClick={() => setIsAddItemOpen(true)}
              className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Dish
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              {item.image ? (
                <ImageWithFallback
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gradient-to-br from-red-100 to-green-100 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2 bg-white/80 rounded-full p-1">
                <Switch
                  checked={item.isAvailable}
                  onCheckedChange={() => toggleAvailability(item.id)}
                />
              </div>
              <div className="absolute top-2 left-2">
                <Badge variant={item.isAvailable ? 'default' : 'secondary'} className="shadow-sm">
                  {item.isAvailable ? (
                    <><Eye className="h-3 w-3 mr-1" /> Available</>
                  ) : (
                    <><EyeOff className="h-3 w-3 mr-1" /> Unavailable</>
                  )}
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">₦{item.price.toLocaleString()}</p>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {item.dietaryTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {getDietaryIcon(tag)}
                    <span className="ml-1">{tag}</span>
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{item.preparationTime} mins</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400" />
                  <span>{item.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  <span>{item.orders} orders</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => openEditDialog(item)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteItem(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
            <DialogDescription>
              Update your menu item details
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input
                  placeholder="e.g., Chicken Tikka Masala"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={newItem.price}
                  onChange={(e) => setNewItem(prev => ({ ...prev, price: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your delicious dish..."
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Preparation Time (minutes)</Label>
                <Input
                  type="number"
                  placeholder="15"
                  min="1"
                  value={newItem.preparationTime}
                  onChange={(e) => setNewItem(prev => ({ ...prev, preparationTime: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Ingredients (comma separated)</Label>
              <Input
                placeholder="e.g., Chicken, Tomatoes, Cream, Onions"
                value={newItem.ingredients}
                onChange={(e) => setNewItem(prev => ({ ...prev, ingredients: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Dietary Tags</Label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((tag) => (
                  <Badge
                    key={tag}
                    variant={newItem.dietaryTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleDietaryTag(tag)}
                  >
                    {getDietaryIcon(tag)}
                    <span className="ml-1">{tag}</span>
                  </Badge>
                ))}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditItemOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-red-500 to-green-500 hover:from-red-600 hover:to-green-600">
                Update Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}