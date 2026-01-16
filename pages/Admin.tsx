
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  subscribeToOrders, subscribeToMenu, saveMenuItem, deleteMenuItem, 
  updateOrderStatus, getSalesData, getSettings, saveSettings,
  subscribeToAnnouncements, saveAnnouncement, deleteAnnouncement,
  subscribeToVideos, savePreviewVideo, deletePreviewVideo,
  clearLocalData
} from '../services/dataService';
import { Order, MenuItem, DailySales, AppSettings, Announcement, PreviewVideo } from '../types';
import { Button } from '../components/ui/Button';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
  LayoutDashboard, UtensilsCrossed, TrendingUp, LogOut, 
  CheckCircle, Clock, XCircle, Truck, ShoppingBag, Plus, Trash2, Edit2, Loader2, Image as ImageIcon, Upload, Settings, ShieldCheck, Megaphone, Type, Link as LinkIcon, Video, PlayCircle
} from 'lucide-react';
import { APP_CONFIG, CATEGORIES } from '../constants';

export const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'analytics' | 'announcements' | 'video'>('orders');
  const [settings, setSettings] = useState<AppSettings>({ whatsappNumber: APP_CONFIG.whatsappNumber });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load initial settings
    getSettings().then(setSettings);
  }, []);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/\D/g, ''); // Allow only numbers
    const newSettings = { ...settings, whatsappNumber: newNumber };
    setSettings(newSettings);
    setSaveStatus('saving');

    // Debounce save
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(async () => {
      await saveSettings(newSettings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  // Login (Simulated security for prototype - In prod use Firebase Auth)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === APP_CONFIG.adminPassword) setIsAuthenticated(true);
    else alert('Invalid Password');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Admin Login</h2>
          <input
            type="password"
            placeholder="Enter Password"
            className="w-full p-3 border rounded-lg mb-4 outline-none focus:ring-2 focus:ring-primary"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button fullWidth type="submit">Access Dashboard</Button>
          <div className="text-center mt-4">
            <Link to="/" className="text-sm text-gray-500 hover:underline">Back to Shop</Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="bg-gray-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-gray-800">
           <h1 className="text-xl font-bold mb-4">Amma Food Admin</h1>
           <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
             <div className="flex justify-between items-center mb-1">
               <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">WhatsApp Order Number</label>
               {saveStatus === 'saving' && <Loader2 size={10} className="animate-spin text-blue-400" />}
               {saveStatus === 'saved' && <CheckCircle size={10} className="text-green-400 animate-fade-in" />}
             </div>
             <input 
               type="text" 
               value={settings.whatsappNumber} 
               onChange={handleSettingsChange}
               className="w-full bg-gray-900 border border-blue-500/50 text-white text-sm rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-600 font-mono shadow-inner tracking-wide"
               placeholder="919876543210"
             />
             <div className="flex items-center gap-1.5 mt-2">
                <ShieldCheck size={10} className={saveStatus === 'saved' ? 'text-green-500' : 'text-gray-500'} />
                <span className="text-[9px] text-gray-500 font-medium">
                  {saveStatus === 'saving' ? 'Syncing...' : 'Securely saved'}
                </span>
             </div>
           </div>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <LayoutDashboard size={20} /> Orders
          </button>
          <button 
            onClick={() => setActiveTab('menu')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'menu' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <UtensilsCrossed size={20} /> Menu
          </button>
          <button 
            onClick={() => setActiveTab('announcements')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'announcements' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Megaphone size={20} /> Ads
          </button>
           <button 
            onClick={() => setActiveTab('video')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'video' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <Video size={20} /> Video
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}
          >
            <TrendingUp size={20} /> Analytics
          </button>
        </nav>
        <div className="p-4 mt-auto border-t border-gray-800 space-y-2">
           <button 
             onClick={() => { if(confirm('Reset all local data? This will clear menu items, orders, videos, and ads stored in your browser. This action cannot be undone.')) clearLocalData(); }}
             className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 px-4 py-2 rounded-lg transition-colors text-sm hover:bg-gray-800"
           >
             <Trash2 size={16} /> Reset Demo Data
           </button>
           <Link to="/">
             <Button variant="ghost" fullWidth className="text-gray-400 hover:text-white justify-start gap-2">
               <LogOut size={18} /> Exit Admin
             </Button>
           </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'menu' && <MenuManager />}
        {activeTab === 'announcements' && <AnnouncementsManager />}
        {activeTab === 'video' && <VideoManager />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>
    </div>
  );
};

// --- Sub Components ---

const VideoManager: React.FC = () => {
  const [videos, setVideos] = useState<PreviewVideo[]>([]);
  const [newVideo, setNewVideo] = useState<Partial<PreviewVideo>>({ url: '', poster: '', isActive: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeToVideos((data) => {
      setVideos(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    if (!newVideo.url) {
      alert("Please enter a video URL");
      return;
    }
    // Simple extension validation
    if (!newVideo.url.match(/\.(mp4|webm)$/i) && !newVideo.url.includes('data:video')) {
       // Allow bypassing this check for blob urls or specific cdn urls if needed, but warn
       if(!confirm("URL doesn't end in .mp4 or .webm. It might not play on all devices. Continue?")) return;
    }

    await savePreviewVideo({
      id: '',
      url: newVideo.url,
      poster: newVideo.poster || '',
      isActive: newVideo.isActive || false,
      createdAt: Date.now()
    });
    setNewVideo({ url: '', poster: '', isActive: false });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this video?")) {
      await deletePreviewVideo(id);
    }
  };

  const toggleActive = async (video: PreviewVideo) => {
    await savePreviewVideo({ ...video, isActive: !video.isActive });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) { // Limit to 1.5MB
        alert("File too large for local storage (Max 1.5MB). Please use a URL for larger videos, or clear data if storage is full.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewVideo(prev => ({ ...prev, url: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 0.5 * 1024 * 1024) { // Limit poster to 500KB
         alert("Image too large (Max 500KB). Please compress it.");
         return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewVideo(prev => ({ ...prev, poster: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Preview Video Manager</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h3 className="font-bold mb-4 text-gray-700">Add New Video</h3>
         <div className="grid gap-4">
            <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Video Source URL (MP4/WebM)</label>
               <div className="relative">
                 <input 
                   className="w-full bg-gray-50 border border-gray-200 p-2.5 pr-12 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                   placeholder="https://example.com/video.mp4"
                   value={newVideo.url}
                   onChange={e => setNewVideo({...newVideo, url: e.target.value})}
                 />
                 <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-gray-600 transition-colors" title="Upload Video">
                    <Upload size={16} />
                    <input type="file" accept="video/mp4,video/webm" className="hidden" onChange={handleVideoUpload} />
                 </label>
               </div>
               <p className="text-[10px] text-gray-400 mt-1">Paste URL or upload MP4/WebM (Max 1.5MB for demo)</p>
            </div>
            <div>
               <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Poster Image URL (Optional)</label>
               <div className="relative">
                 <input 
                   className="w-full bg-gray-50 border border-gray-200 p-2.5 pr-12 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none"
                   placeholder="https://example.com/poster.jpg"
                   value={newVideo.poster}
                   onChange={e => setNewVideo({...newVideo, poster: e.target.value})}
                 />
                 <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md text-gray-600 transition-colors" title="Upload Poster">
                    <Upload size={16} />
                    <input type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} />
                 </label>
               </div>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-primary rounded"
                checked={newVideo.isActive}
                onChange={e => setNewVideo({...newVideo, isActive: e.target.checked})}
              />
              <span className="text-sm font-semibold text-gray-700">Set as Active (Will replace current)</span>
            </label>

            <Button onClick={handleAdd} className="w-full sm:w-auto">Add Video</Button>
         </div>
         
         {newVideo.url && (
            <div className="mt-4 bg-gray-100 rounded-lg p-2 max-w-sm">
               <p className="text-xs text-gray-500 mb-1">Preview:</p>
               <video 
                 src={newVideo.url} 
                 poster={newVideo.poster} 
                 controls 
                 className="w-full rounded shadow-sm bg-black" 
               />
            </div>
         )}
      </div>

      <div className="space-y-3">
         {videos.map(video => (
           <div key={video.id} className={`bg-white p-4 rounded-xl border flex flex-col sm:flex-row gap-4 transition-all ${video.isActive ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-gray-100 shadow-sm'}`}>
              <div className="w-full sm:w-48 aspect-video bg-black rounded-lg overflow-hidden shrink-0 relative">
                 <video src={video.url} poster={video.poster} className="w-full h-full object-cover" />
                 <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <PlayCircle className="text-white opacity-70" size={24} />
                 </div>
              </div>
              
              <div className="flex-1">
                 <div className="flex justify-between items-start">
                    <div>
                       <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-800">Preview Video</span>
                          {video.isActive && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Active</span>}
                       </div>
                       <p className="text-xs text-gray-500 truncate max-w-xs">{video.url}</p>
                       <p className="text-xs text-gray-400 mt-1">Added: {new Date(video.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" variant={video.isActive ? "secondary" : "outline"} onClick={() => toggleActive(video)}>
                          {video.isActive ? "Deactivate" : "Activate"}
                       </Button>
                       <button onClick={() => handleDelete(video.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                       </button>
                    </div>
                 </div>
              </div>
           </div>
         ))}
         
         {videos.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-400">
               <Video size={40} className="mx-auto mb-2 opacity-50" />
               <p>No videos added yet.</p>
            </div>
         )}
      </div>
    </div>
  );
};

const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time subscription
    const unsubscribe = subscribeToOrders((updatedOrders) => {
      setOrders(updatedOrders);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusUpdate = async (id: string, status: Order['status']) => {
    await updateOrderStatus(id, status);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading live orders...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Live Orders</h2>
      <div className="grid gap-4">
        {orders.length === 0 ? <p className="text-gray-500">No orders yet.</p> : null}
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col lg:flex-row gap-6 animate-fade-in">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">#{order.id.slice(-6)}</span>
                <span className="text-sm text-gray-500">{new Date(order.timestamp).toLocaleString()}</span>
              </div>
              <div className="flex items-start gap-2 mb-4">
                <div className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                  {order.status.replace('_', ' ')}
                </div>
              </div>
              
              <div className="space-y-1 mb-4">
                <div className="text-sm font-medium text-gray-900">{order.customer.name}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1"><Clock size={14}/> {order.customer.phone}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1"><Truck size={14}/> {order.customer.address}</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                {order.items.map((item, idx) => (
                   <div key={idx} className="flex justify-between items-center text-sm mb-2 last:mb-0">
                     <div className="flex items-center gap-2">
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover bg-gray-200 border border-gray-100" />
                        )}
                        <span className="text-gray-700 font-medium">{item.quantity} x {item.name}</span>
                     </div>
                     <span className="font-medium text-gray-900">{APP_CONFIG.currency}{item.price * item.quantity}</span>
                   </div>
                ))}
                <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{APP_CONFIG.currency}{order.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="flex lg:flex-col gap-2 justify-center border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-6">
               <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusUpdate(order.id, 'confirmed')}>Accept</Button>
               <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleStatusUpdate(order.id, 'out_for_delivery')}>Dispatch</Button>
               <Button size="sm" variant="outline" className="text-gray-600 border-gray-200 hover:bg-gray-50" onClick={() => handleStatusUpdate(order.id, 'delivered')}>Complete</Button>
               <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleStatusUpdate(order.id, 'cancelled')}>Reject</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MenuManager: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use subscription for real-time menu updates
    const unsubscribe = subscribeToMenu((menuItems) => {
      setItems(menuItems);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentItem.name || !currentItem.price) return;
    const newItem = {
      id: currentItem.id, // ID might be undefined for new items, handled in service
      name: currentItem.name,
      description: currentItem.description || '',
      price: Number(currentItem.price),
      type: currentItem.type || 'veg',
      category: currentItem.category || 'Main Course',
      isAvailable: currentItem.isAvailable ?? true,
      image: currentItem.image || `https://picsum.photos/400/300?random=${Date.now()}`
    } as MenuItem;
    
    await saveMenuItem(newItem);
    setIsEditing(false);
    setCurrentItem({});
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (!id) return;

    if (confirm('Delete this item?')) {
        // Optimistic update for immediate UI feedback
        setItems(prev => prev.filter(item => item.id !== id));
        await deleteMenuItem(id);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize logic: Max width 500px, maintain aspect ratio
          const MAX_WIDTH = 500;
          if (width > MAX_WIDTH) {
             const scale = MAX_WIDTH / width;
             width = MAX_WIDTH;
             height = height * scale;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG 70% quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setCurrentItem(prev => ({...prev, image: dataUrl}));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
        <Button onClick={() => { setCurrentItem({ type: 'veg', category: 'Main Course', isAvailable: true }); setIsEditing(true); }} className="gap-2">
          <Plus size={18} /> Add Item
        </Button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-slide-up relative">
          <button 
            onClick={() => setIsEditing(false)} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <XCircle size={20} />
          </button>
          
          <h3 className="font-bold mb-6 text-lg border-b pb-2">{currentItem.id ? 'Edit Item' : 'New Item'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</label>
              <input 
                placeholder="e.g. Butter Chicken" 
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                value={currentItem.name || ''} 
                onChange={e => setCurrentItem({...currentItem, name: e.target.value})} 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price ({APP_CONFIG.currency})</label>
              <input 
                type="number" 
                placeholder="0" 
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                value={currentItem.price || ''} 
                onChange={e => setCurrentItem({...currentItem, price: Number(e.target.value)})} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
              <select 
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none bg-white transition-all"
                value={currentItem.category}
                onChange={e => setCurrentItem({...currentItem, category: e.target.value as any})}
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

             <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
              <select 
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none bg-white transition-all"
                value={currentItem.type}
                onChange={e => setCurrentItem({...currentItem, type: e.target.value as any})}
              >
                <option value="veg">Veg</option>
                <option value="non-veg">Non-Veg</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon size={14} /> Item Image
              </label>
              <div className="flex gap-3 items-start">
                <div className="flex-1 space-y-2">
                   <div className="flex gap-2">
                     <input 
                       placeholder="https://example.com/image.jpg" 
                       className="flex-1 border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all font-mono text-sm text-gray-600" 
                       value={currentItem.image || ''} 
                       onChange={e => setCurrentItem({...currentItem, image: e.target.value})} 
                     />
                     <label className="cursor-pointer bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0">
                        <Upload size={18} />
                        <span className="text-sm font-medium hidden sm:inline">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                     </label>
                   </div>
                   <p className="text-[10px] text-gray-400">Paste URL or upload image (Auto-resized to max width 500px)</p>
                </div>
                
                <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {currentItem.image ? (
                    <>
                      <img src={currentItem.image} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      <button 
                        onClick={() => setCurrentItem({...currentItem, image: ''})}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <XCircle size={20} />
                      </button>
                    </>
                  ) : (
                    <ImageIcon size={24} className="text-gray-300" />
                  )}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
              <textarea 
                placeholder="Brief description of the dish..." 
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all" 
                rows={3}
                value={currentItem.description || ''} 
                onChange={e => setCurrentItem({...currentItem, description: e.target.value})} 
              />
            </div>

             <label className="flex items-center gap-3 md:col-span-2 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
              <input 
                type="checkbox" 
                className="w-5 h-5 text-primary rounded focus:ring-primary border-gray-300"
                checked={currentItem.isAvailable ?? true}
                onChange={e => setCurrentItem({...currentItem, isAvailable: e.target.checked})}
              />
              <span className="text-sm font-medium text-gray-700">Available for Order</span>
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Item</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <Loader2 size={32} className="animate-spin mb-2" />
          <p>Loading menu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4 shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative w-24 h-24 shrink-0">
                 <img src={item.image} alt={item.name} className="w-full h-full rounded-lg object-cover bg-gray-100" />
                 {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold px-1.5 py-0.5 bg-red-600 rounded">SOLD OUT</span>
                    </div>
                 )}
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block">
                        {item.category}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => { setCurrentItem(item); setIsEditing(true); }} 
                      className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                      title="Edit Item"
                    >
                      <Edit2 size={18}/>
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)} 
                      className="text-red-600 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>
                
                <div className="mt-auto flex justify-between items-end">
                    <span className="font-bold text-gray-900">{APP_CONFIG.currency}{item.price}</span>
                    <div className={`w-3 h-3 rounded-full border ${item.type === 'veg' ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600'}`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AnnouncementsManager: React.FC = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState<Partial<Announcement>>({ type: 'text', content: '', isActive: true });

  useEffect(() => {
    return subscribeToAnnouncements((data) => {
      setItems(data);
      setLoading(false);
    });
  }, []);

  const handleAdd = async () => {
    if (!newItem.content) return;
    await saveAnnouncement({
      id: '',
      type: newItem.type || 'text',
      content: newItem.content,
      isActive: newItem.isActive ?? true
    });
    setNewItem({ type: 'text', content: '', isActive: true });
  };

  const handleDelete = async (id: string) => {
     if(!id) return;
     if(confirm("Delete this announcement?")) {
        setItems(prev => prev.filter(i => i.id !== id)); // Optimistic delete
        await deleteAnnouncement(id);
     }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          // Resize to max 800px width
          const MAX_WIDTH = 800;
          if (width > MAX_WIDTH) {
             const scale = MAX_WIDTH / width;
             width = MAX_WIDTH;
             height = height * scale;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setNewItem(prev => ({...prev, content: dataUrl}));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">Ads & Announcements</h2>
       
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h3 className="font-bold mb-4 text-gray-700">Add New Announcement</h3>
         
         <div className="flex flex-col gap-4">
            {/* Toggle Buttons */}
            <div className="flex gap-4">
              <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-all ${newItem.type === 'text' ? 'bg-white border-orange-200 text-gray-900 ring-2 ring-primary/20 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                 <input 
                   type="radio" 
                   name="adType" 
                   className="hidden"
                   checked={newItem.type === 'text'} 
                   onChange={() => setNewItem({...newItem, type: 'text', content: ''})}
                 />
                 <Type size={18} className={newItem.type === 'text' ? 'text-primary' : 'text-gray-400'} />
                 <span className="text-sm font-semibold">Text</span>
              </label>
              
              <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-all ${newItem.type === 'image' ? 'bg-white border-orange-200 text-gray-900 ring-2 ring-primary/20 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                 <input 
                   type="radio" 
                   name="adType" 
                   className="hidden"
                   checked={newItem.type === 'image'} 
                   onChange={() => setNewItem({...newItem, type: 'image', content: ''})}
                 />
                 <ImageIcon size={18} className={newItem.type === 'image' ? 'text-primary' : 'text-gray-400'} />
                 <span className="text-sm font-semibold">Image URL</span>
              </label>
            </div>

            {/* Input Area */}
            <div className="flex gap-2 h-12">
               <div className="flex-1 relative">
                 <input 
                   className="w-full h-full bg-gray-800 border border-gray-700 text-white px-4 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none placeholder-gray-500 transition-all"
                   placeholder={newItem.type === 'text' ? "Enter announcement text..." : "Enter image URL..."}
                   value={newItem.content}
                   onChange={e => setNewItem({...newItem, content: e.target.value})}
                 />
                 {newItem.type === 'image' && (
                    <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300 transition-colors" title="Upload Image">
                       <Upload size={16} />
                       <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                 )}
               </div>
               
               <Button onClick={handleAdd} className="h-full px-6 bg-primary hover:bg-orange-600 text-white rounded-lg font-semibold shadow-lg shadow-orange-500/20">
                 Add
               </Button>
            </div>
         </div>
       </div>

       <div className="grid gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm animate-fade-in group">
                <div className="flex items-center gap-4 flex-1 overflow-hidden">
                   {item.type === 'text' ? (
                     <div className="bg-orange-50 w-12 h-12 flex items-center justify-center rounded-lg text-primary shrink-0">
                        <Megaphone size={20} />
                     </div>
                   ) : (
                     <div className="w-16 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                        <img src={item.content} alt="Ad" className="w-full h-full object-cover" />
                     </div>
                   )}
                   <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate" title={item.content}>{item.content}</p>
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-1">{item.type}</span>
                   </div>
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors">
                   <Trash2 size={18} />
                </button>
            </div>
          ))}
          {items.length === 0 && !loading && (
             <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
               <Megaphone size={32} className="mx-auto mb-2 opacity-50" />
               <p>No active announcements.</p>
             </div>
          )}
       </div>
    </div>
  );
};

const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<DailySales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const sales = await getSalesData();
      setData(sales);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Calculating analytics...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Sales Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="text-gray-500 text-sm mb-1">Total Revenue (7 Days)</div>
           <div className="text-3xl font-bold text-primary">{APP_CONFIG.currency}{data.reduce((a, b) => a + b.amount, 0)}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="text-gray-500 text-sm mb-1">Total Orders (7 Days)</div>
           <div className="text-3xl font-bold text-gray-900">{data.reduce((a, b) => a + b.orders, 0)}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
           <div className="text-gray-500 text-sm mb-1">Avg. Order Value</div>
           <div className="text-3xl font-bold text-gray-900">{APP_CONFIG.currency}{Math.round(data.reduce((a, b) => a + b.amount, 0) / (data.reduce((a, b) => a + b.orders, 0) || 1))}</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
        <h3 className="font-bold mb-4 text-gray-700">Daily Revenue Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" axisLine={false} tickLine={false} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip 
               contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Bar dataKey="amount" fill="#F97316" radius={[4, 4, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
