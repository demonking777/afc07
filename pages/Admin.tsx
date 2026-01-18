
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
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value.replace(/\D/g, '');
    const newSettings = { ...settings, whatsappNumber: newNumber };
    setSettings(newSettings);
    setSaveStatus('saving');

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(async () => {
      await saveSettings(newSettings);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

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
      <aside className="bg-gray-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-gray-800">
           <h1 className="text-xl font-bold mb-4">Amma Food Admin</h1>
           <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
             <div className="flex justify-between items-center mb-1">
               <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">WhatsApp Number</label>
               {saveStatus === 'saving' && <Loader2 size={10} className="animate-spin text-blue-400" />}
               {saveStatus === 'saved' && <CheckCircle size={10} className="text-green-400 animate-fade-in" />}
             </div>
             <input 
               type="text" 
               value={settings.whatsappNumber} 
               onChange={handleSettingsChange}
               className="w-full bg-gray-900 border border-blue-500/50 text-white text-sm rounded px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
               placeholder="919876543210"
             />
           </div>
        </div>
        <nav className="p-4 space-y-2 flex-1">
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <LayoutDashboard size={20} /> Orders
          </button>
          <button onClick={() => setActiveTab('menu')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'menu' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <UtensilsCrossed size={20} /> Menu
          </button>
          <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'announcements' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Megaphone size={20} /> Ads
          </button>
           <button onClick={() => setActiveTab('video')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'video' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Video size={20} /> Video
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'analytics' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-800'}`}>
            <TrendingUp size={20} /> Analytics
          </button>
        </nav>
        <div className="p-4 mt-auto border-t border-gray-800 space-y-2">
           <button onClick={() => { if(confirm('Reset all local data?')) clearLocalData(); }} className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 px-4 py-2 rounded-lg text-sm hover:bg-gray-800">
             <Trash2 size={16} /> Reset Demo Data
           </button>
           <Link to="/">
             <Button variant="ghost" fullWidth className="text-gray-400 hover:text-white justify-start gap-2">
               <LogOut size={18} /> Exit Admin
             </Button>
           </Link>
        </div>
      </aside>

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

// --- Menu Management Sub-Component ---

const MenuManager: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<MenuItem>>({});
  const [loading, setLoading] = useState(true);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToMenu((menuItems) => {
      setItems(menuItems);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentItem.name || !currentItem.price) return;
    const newItem = {
      id: currentItem.id,
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
    if (e) { e.stopPropagation(); e.preventDefault(); }
    if (!id) return;
    if (confirm('Delete this item?')) {
        setItems(prev => prev.filter(item => item.id !== id));
        await deleteMenuItem(id);
    }
  };

  /**
   * Automatic Image Resizing & Compression Logic
   * 1. Resizes to max width of 500px
   * 2. Compresses to 70% quality JPEG
   */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingImage(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Step 1: Resize logic - Max width 500px, maintain aspect ratio
          const MAX_WIDTH = 500;
          if (width > MAX_WIDTH) {
             const scale = MAX_WIDTH / width;
             width = MAX_WIDTH;
             height = height * scale;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            // Fill with white background (useful for transparent PNGs converted to JPEGs)
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            // Step 2: Compress to JPEG 70% quality (0.7)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setCurrentItem(prev => ({...prev, image: dataUrl}));
          }
          setIsProcessingImage(false);
        };
        img.onerror = () => {
          alert("Failed to load image for processing.");
          setIsProcessingImage(false);
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
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 animate-slide-up relative mb-8">
          <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <XCircle size={20} />
          </button>
          
          <h3 className="font-bold mb-6 text-lg border-b pb-2">{currentItem.id ? 'Edit Item' : 'New Item'}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</label>
              <input className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" value={currentItem.name || ''} onChange={e => setCurrentItem({...currentItem, name: e.target.value})} />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price ({APP_CONFIG.currency})</label>
              <input type="number" className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" value={currentItem.price || ''} onChange={e => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</label>
              <select className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white" value={currentItem.category} onChange={e => setCurrentItem({...currentItem, category: e.target.value as any})}>
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

             <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
              <select className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white" value={currentItem.type} onChange={e => setCurrentItem({...currentItem, type: e.target.value as any})}>
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
                       className="flex-1 border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none font-mono text-sm" 
                       value={currentItem.image || ''} 
                       onChange={e => setCurrentItem({...currentItem, image: e.target.value})} 
                     />
                     <label className="cursor-pointer bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shrink-0">
                        {isProcessingImage ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        <span className="text-sm font-medium hidden sm:inline">{isProcessingImage ? 'Processing...' : 'Upload'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isProcessingImage} />
                     </label>
                   </div>
                   <p className="text-[10px] text-gray-400">Paste URL or upload image (Auto-resized to 500px, 70% JPEG quality)</p>
                </div>
                
                <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {currentItem.image ? (
                    <>
                      <img src={currentItem.image} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setCurrentItem({...currentItem, image: ''})} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Trash2 size={20} />
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
              <textarea className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" rows={2} value={currentItem.description || ''} onChange={e => setCurrentItem({...currentItem, description: e.target.value})} />
            </div>

             <label className="flex items-center gap-3 md:col-span-2 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200">
              <input type="checkbox" className="w-5 h-5 text-primary rounded" checked={currentItem.isAvailable ?? true} onChange={e => setCurrentItem({...currentItem, isAvailable: e.target.checked})} />
              <span className="text-sm font-medium text-gray-700">Available for Order</span>
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isProcessingImage}>Save Item</Button>
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
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block uppercase font-bold">
                        {item.category}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setCurrentItem(item); setIsEditing(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors">
                      <Edit2 size={16}/>
                    </button>
                    <button onClick={(e) => handleDelete(item.id, e)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
                
                <div className="mt-auto flex justify-between items-end">
                    <span className="font-bold text-gray-900">{APP_CONFIG.currency}{item.price}</span>
                    <div className={`w-2.5 h-2.5 rounded-full border ${item.type === 'veg' ? 'bg-green-500 border-green-600' : 'bg-red-500 border-red-600'}`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Other Views (Minimal Stubs/Original Code) ---

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
    await saveAnnouncement({ id: '', type: newItem.type || 'text', content: newItem.content, isActive: newItem.isActive ?? true });
    setNewItem({ type: 'text', content: '', isActive: true });
  };

  const handleDelete = async (id: string) => {
     if(!id) return;
     if(confirm("Delete this announcement?")) {
        setItems(prev => prev.filter(i => i.id !== id));
        await deleteAnnouncement(id);
     }
  };

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">Ads & Announcements</h2>
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <h3 className="font-bold mb-4 text-gray-700">Add New</h3>
         <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              {['text', 'image'].map(t => (
                <label key={t} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-all ${newItem.type === t ? 'border-primary ring-2 ring-primary/10' : 'border-gray-200'}`}>
                   <input type="radio" className="hidden" checked={newItem.type === t} onChange={() => setNewItem({...newItem, type: t as any})} />
                   <span className="text-sm font-semibold capitalize">{t}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 h-11">
               <input className="flex-1 bg-gray-50 border border-gray-200 px-4 rounded-lg outline-none text-sm" placeholder="Enter content or URL..." value={newItem.content} onChange={e => setNewItem({...newItem, content: e.target.value})} />
               <Button onClick={handleAdd}>Add</Button>
            </div>
         </div>
       </div>
       <div className="grid gap-3">
          {items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                   <div className="bg-orange-50 w-10 h-10 flex items-center justify-center rounded-lg text-primary">
                      {item.type === 'text' ? <Megaphone size={18} /> : <ImageIcon size={18} />}
                   </div>
                   <p className="font-medium text-gray-800 truncate">{item.content}</p>
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                   <Trash2 size={18} />
                </button>
            </div>
          ))}
       </div>
    </div>
  );
};

const VideoManager: React.FC = () => {
  const [videos, setVideos] = useState<PreviewVideo[]>([]);
  const [newVideo, setNewVideo] = useState<Partial<PreviewVideo>>({ url: '', isActive: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return subscribeToVideos((data) => { setVideos(data); setLoading(false); });
  }, []);

  const handleAdd = async () => {
    if (!newVideo.url) return;
    await savePreviewVideo({ id: '', url: newVideo.url, isActive: newVideo.isActive || false, createdAt: Date.now() });
    setNewVideo({ url: '', isActive: false });
  };

  const toggleActive = async (video: PreviewVideo) => { await savePreviewVideo({ ...video, isActive: !video.isActive }); };
  const handleDelete = async (id: string) => { if (confirm("Delete?")) await deletePreviewVideo(id); };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Preview Video</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
         <div className="flex gap-2">
           <input className="flex-1 bg-gray-50 border border-gray-200 p-2.5 rounded-lg outline-none" placeholder="Video MP4 URL..." value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} />
           <Button onClick={handleAdd}>Add</Button>
         </div>
      </div>
      <div className="grid gap-4">
        {videos.map(v => (
          <div key={v.id} className={`bg-white p-4 rounded-xl border flex items-center justify-between ${v.isActive ? 'border-primary' : 'border-gray-100'}`}>
             <span className="truncate flex-1 text-sm font-mono text-gray-500">{v.url}</span>
             <div className="flex gap-2 ml-4">
               <Button size="sm" variant={v.isActive ? "primary" : "outline"} onClick={() => toggleActive(v)}>{v.isActive ? 'Active' : 'Activate'}</Button>
               <button onClick={() => handleDelete(v.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { return subscribeToOrders(setOrders); }, []);
  const getStatusColor = (s: string) => {
    switch(s) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
      <div className="grid gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900">#{order.id.slice(-6)}</span>
                <span className="text-sm text-gray-500">{new Date(order.timestamp).toLocaleString()}</span>
              </div>
              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block mb-3 ${getStatusColor(order.status)}`}>{order.status}</div>
              <div className="text-sm text-gray-700 font-bold mb-1">{order.customer.name}</div>
              <div className="text-xs text-gray-500 mb-4">{order.customer.address}</div>
              <div className="space-y-1">
                {order.items.map((it, idx) => (
                  <div key={idx} className="text-sm text-gray-600 flex justify-between">
                    <span>{it.quantity}x {it.name}</span>
                    <span className="font-bold">{APP_CONFIG.currency}{it.price * it.quantity}</span>
                  </div>
                ))}
                <div className="pt-2 border-t mt-2 flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>{APP_CONFIG.currency}{order.totalAmount}</span>
                </div>
              </div>
            </div>
            <div className="flex lg:flex-col gap-2 border-t lg:border-t-0 lg:border-l lg:pl-6 pt-4 lg:pt-0">
               <Button size="sm" variant="outline" className="text-blue-600" onClick={() => updateOrderStatus(order.id, 'preparing')}>Prepare</Button>
               <Button size="sm" variant="outline" className="text-purple-600" onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}>Dispatch</Button>
               <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateOrderStatus(order.id, 'delivered')}>Complete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalyticsView: React.FC = () => {
  const [data, setData] = useState<DailySales[]>([]);
  useEffect(() => { getSalesData().then(setData); }, []);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Analytics</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#F97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
