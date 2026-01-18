
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  subscribeToOrders, subscribeToMenu, saveMenuItem, deleteMenuItem, 
  updateOrderStatus, getSalesData, getSettings, saveSettings,
  subscribeToAnnouncements, saveAnnouncement, deleteAnnouncement,
  subscribeToVideos, savePreviewVideo, deletePreviewVideo,
  clearLocalData, loginAdmin, logoutAdmin, subscribeToAuth
} from '../services/dataService';
import { Order, MenuItem, DailySales, AppSettings, Announcement, PreviewVideo, AdminUser } from '../types';
import { Button } from '../components/ui/Button';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
  LayoutDashboard, UtensilsCrossed, TrendingUp, LogOut, 
  CheckCircle, Clock, XCircle, Truck, ShoppingBag, Plus, Trash2, Edit2, Loader2, Image as ImageIcon, Upload, Settings, ShieldCheck, Megaphone, Type, Link as LinkIcon, Video, PlayCircle, Mail, Lock, Layers, Check, X
} from 'lucide-react';
import { APP_CONFIG, DEMO_ADMIN_CREDENTIALS } from '../constants';
import { isFirebaseEnabled } from '../services/firebase';

export const Admin: React.FC = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'categories' | 'analytics' | 'announcements' | 'video'>('orders');
  const [settings, setSettings] = useState<AppSettings>({ whatsappNumber: APP_CONFIG.whatsappNumber, categories: APP_CONFIG.defaultCategories });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToAuth((adminUser) => {
      setUser(adminUser);
      setIsInitializing(false);
    });
    getSettings().then(setSettings);
    return () => unsubscribe();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      await loginAdmin(email, password);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logoutAdmin();
      navigate('/');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
               <ShieldCheck className="text-primary" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Admin Portal</h2>
            <p className="text-gray-500 text-sm mt-1">Secure access to Amma Food Dashboard</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="email"
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {loginError && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 animate-shake flex items-center gap-2">
                <XCircle size={14} /> {loginError}
              </div>
            )}
            {!isFirebaseEnabled && (
              <div className="bg-blue-50 text-blue-700 text-[10px] p-3 rounded-lg border border-blue-100">
                <p className="font-bold mb-1 uppercase tracking-tighter">Demo Credentials:</p>
                <p>Email: {DEMO_ADMIN_CREDENTIALS.email}</p>
                <p>Pass: {DEMO_ADMIN_CREDENTIALS.password}</p>
              </div>
            )}
            <Button fullWidth type="submit" size="lg" disabled={isLoggingIn} className="h-12 shadow-lg shadow-orange-500/20">
              {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : "Sign In to Dashboard"}
            </Button>
          </div>
          <div className="text-center mt-6">
            <Link to="/" className="text-xs text-gray-400 hover:text-primary transition-colors hover:underline">Return to Public Store</Link>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      <aside className="bg-gray-900 text-white w-full md:w-64 flex-shrink-0 flex flex-col">
        <div className="p-6 border-b border-gray-800">
           <div className="flex items-center gap-2 mb-4">
             <ShieldCheck className="text-primary" size={24} />
             <h1 className="text-lg font-bold">Admin Panel</h1>
           </div>
           <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
             <div className="flex justify-between items-center mb-1">
               <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">WhatsApp Gateway</label>
               {saveStatus === 'saving' && <Loader2 size={10} className="animate-spin text-blue-400" />}
               {saveStatus === 'saved' && <CheckCircle size={10} className="text-green-400 animate-fade-in" />}
             </div>
             <input 
               type="text" 
               value={settings.whatsappNumber} 
               onChange={handleSettingsChange}
               className="w-full bg-gray-900 border border-blue-500/50 text-white text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-blue-500 outline-none font-mono"
               placeholder="919876543210"
             />
           </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'orders' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800'}`}>
            <LayoutDashboard size={20} /> <span className="text-sm font-semibold">Orders</span>
          </button>
          <button onClick={() => setActiveTab('menu')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'menu' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800'}`}>
            <UtensilsCrossed size={20} /> <span className="text-sm font-semibold">Menu</span>
          </button>
          <button onClick={() => setActiveTab('categories')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'categories' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Layers size={20} /> <span className="text-sm font-semibold">Categories</span>
          </button>
          <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'announcements' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Megaphone size={20} /> <span className="text-sm font-semibold">Ads</span>
          </button>
           <button onClick={() => { setActiveTab('video'); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'video' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800'}`}>
            <Video size={20} /> <span className="text-sm font-semibold">Video</span>
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'analytics' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-800'}`}>
            <TrendingUp size={20} /> <span className="text-sm font-semibold">Analytics</span>
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-gray-800 space-y-2">
           <div className="px-4 py-2 text-[10px] text-gray-500 uppercase font-bold tracking-widest truncate">Logged as: {user.email}</div>
           <button onClick={() => { if(confirm('Reset all local data?')) clearLocalData(); }} className="w-full flex items-center gap-2 text-gray-400 hover:text-red-400 px-4 py-2.5 rounded-xl text-xs hover:bg-gray-800 transition-colors">
             <Trash2 size={16} /> Reset Demo Data
           </button>
           <button onClick={handleLogout} className="w-full flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2.5 rounded-xl text-xs hover:bg-red-600/20 transition-all border border-transparent hover:border-red-900">
             <LogOut size={16} /> Logout Session
           </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {activeTab === 'orders' && <OrdersView />}
        {activeTab === 'menu' && <MenuManager categories={settings.categories} />}
        {activeTab === 'categories' && <CategoryManager settings={settings} onUpdate={setSettings} />}
        {activeTab === 'announcements' && <AnnouncementsManager />}
        {activeTab === 'video' && <VideoManager />}
        {activeTab === 'analytics' && <AnalyticsView />}
      </main>
    </div>
  );
};

// --- Category Management Component ---

const CategoryManager: React.FC<{settings: AppSettings, onUpdate: (s: AppSettings) => void}> = ({ settings, onUpdate }) => {
  const [newCat, setNewCat] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!newCat.trim()) return;
    if (settings.categories.includes(newCat.trim())) {
      alert("Category already exists");
      return;
    }
    const updated = { ...settings, categories: [...settings.categories, newCat.trim()] };
    setIsSaving(true);
    await saveSettings(updated);
    onUpdate(updated);
    setNewCat('');
    setIsSaving(false);
  };

  const startEdit = (index: number, val: string) => {
    setEditingIndex(index);
    setEditValue(val);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleEditSave = async (index: number) => {
    if (!editValue.trim()) return;
    const newCategories = [...settings.categories];
    newCategories[index] = editValue.trim();
    const updated = { ...settings, categories: newCategories };
    setIsSaving(true);
    await saveSettings(updated);
    onUpdate(updated);
    setEditingIndex(null);
    setEditValue('');
    setIsSaving(false);
  };

  const handleRemove = async (cat: string) => {
    if (confirm(`Remove category "${cat}"? Items assigned to this category will still exist but won't be filterable correctly.`)) {
      const updated = { ...settings, categories: settings.categories.filter(c => c !== cat) };
      setIsSaving(true);
      await saveSettings(updated);
      onUpdate(updated);
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-bold text-gray-700">Add New Category</h3>
        <div className="flex gap-2">
          <input 
            className="flex-1 bg-gray-50 border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 transition-all" 
            placeholder="e.g. Main Course, Desserts..." 
            value={newCat} 
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={isSaving}>Add</Button>
        </div>
      </div>
      
      <div className="grid gap-3">
        {settings.categories.map((cat, index) => (
          <div key={`${cat}-${index}`} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
             {editingIndex === index ? (
               <div className="flex items-center gap-2 flex-1 mr-4">
                 <input 
                   className="flex-1 bg-white border border-primary p-2 rounded-lg outline-none text-sm font-semibold" 
                   value={editValue} 
                   onChange={e => setEditValue(e.target.value)}
                   autoFocus
                   onKeyDown={(e) => e.key === 'Enter' && handleEditSave(index)}
                 />
                 <button onClick={() => handleEditSave(index)} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    <Check size={16} />
                 </button>
                 <button onClick={cancelEdit} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors">
                    <X size={16} />
                 </button>
               </div>
             ) : (
               <>
                 <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-primary border border-orange-100">
                     <Layers size={20} />
                   </div>
                   <span className="font-bold text-gray-700 text-lg">{cat}</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <button 
                     onClick={() => startEdit(index, cat)} 
                     className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                     title="Rename"
                   >
                     <Edit2 size={18} />
                   </button>
                   <button 
                     onClick={() => handleRemove(cat)} 
                     className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                     title="Delete"
                   >
                     <Trash2 size={18} />
                   </button>
                 </div>
               </>
             )}
          </div>
        ))}
        {settings.categories.length === 0 && (
          <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">
             <Layers size={32} className="mx-auto mb-2 opacity-20" />
             <p>No categories added yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Menu Management Sub-Component ---

const MenuManager: React.FC<{categories: string[]}> = ({ categories }) => {
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
      category: currentItem.category || (categories.length > 0 ? categories[0] : 'General'),
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
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setCurrentItem(prev => ({...prev, image: dataUrl}));
          }
          setIsProcessingImage(false);
        };
        img.onerror = () => { alert("Failed to load image."); setIsProcessingImage(false); };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
        <Button onClick={() => { setCurrentItem({ type: 'veg', category: categories[0] || '', isAvailable: true }); setIsEditing(true); }} className="gap-2">
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
              <select className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none bg-white" value={currentItem.category} onChange={e => setCurrentItem({...currentItem, category: e.target.value})}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                {categories.length === 0 && <option value="">No categories defined</option>}
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
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">Image</label>
              <div className="flex gap-3 items-start">
                <div className="flex-1 space-y-2">
                   <div className="flex gap-2">
                     <input 
                       placeholder="https://example.com/image.jpg" 
                       className="flex-1 border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none font-mono text-sm" 
                       value={currentItem.image || ''} 
                       onChange={e => setCurrentItem({...currentItem, image: e.target.value})} 
                     />
                     <label className="cursor-pointer bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 shrink-0">
                        {isProcessingImage ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                        <span className="text-sm font-medium hidden sm:inline">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isProcessingImage} />
                     </label>
                   </div>
                </div>
                <div className="w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {currentItem.image ? (
                    <>
                      <img src={currentItem.image} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setCurrentItem({...currentItem, image: ''})} className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Trash2 size={20} /></button>
                    </>
                  ) : (<ImageIcon size={24} className="text-gray-300" />)}
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
              <textarea className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-primary/50 outline-none" rows={2} value={currentItem.description || ''} onChange={e => setCurrentItem({...currentItem, description: e.target.value})} />
            </div>
             <label className="flex items-center gap-3 md:col-span-2 cursor-pointer bg-gray-50 p-3 rounded-lg border border-gray-200">
              <input type="checkbox" className="w-5 h-5 text-primary rounded" checked={currentItem.isAvailable ?? true} onChange={e => setCurrentItem({...currentItem, isAvailable: e.target.checked})} />
              <span className="text-sm font-medium text-gray-700">Available</span>
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isProcessingImage}>Save</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400"><Loader2 size={32} className="animate-spin mb-2" /><p>Loading...</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => (
            <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex gap-4 shadow-sm hover:shadow-md transition-shadow group">
              <div className="relative w-24 h-24 shrink-0">
                 <img src={item.image} alt={item.name} className="w-full h-full rounded-lg object-cover bg-gray-100" />
                 {!item.isAvailable && (<div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center"><span className="text-white text-[10px] font-bold px-1.5 py-0.5 bg-red-600 rounded">SOLD OUT</span></div>)}
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800 line-clamp-1">{item.name}</h4>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block uppercase font-bold">{item.category}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setCurrentItem(item); setIsEditing(true); }} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={(e) => handleDelete(item.id, e)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={16}/></button>
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

const VideoManager: React.FC = () => {
  const [videos, setVideos] = useState<PreviewVideo[]>([]);
  const [newVideo, setNewVideo] = useState<Partial<PreviewVideo>>({ url: '', poster: '', isActive: false });
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingPoster, setIsProcessingPoster] = useState(false);

  useEffect(() => {
    return subscribeToVideos((data) => { setVideos(data); setLoading(false); });
  }, []);

  const handleAdd = async () => {
    if (!newVideo.url) {
      alert("Please enter a video URL or upload a file.");
      return;
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

  const toggleActive = async (video: PreviewVideo) => { 
    await savePreviewVideo({ ...video, isActive: !video.isActive }); 
  };

  const handleDelete = async (id: string) => { 
    if (confirm("Delete this video?")) await deletePreviewVideo(id); 
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Video too large (Max 5MB for demo).");
        return;
      }
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewVideo(prev => ({ ...prev, url: event.target?.result as string }));
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessingPoster(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          if (width > MAX_WIDTH) {
             const scale = MAX_WIDTH / width;
             width = MAX_WIDTH;
             height = height * scale;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            setNewVideo(prev => ({...prev, poster: dataUrl}));
          }
          setIsProcessingPoster(false);
        };
        img.onerror = () => { alert("Failed to load image."); setIsProcessingPoster(false); };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Preview Video Management</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
         <h3 className="font-bold text-gray-700">Add New Video</h3>
         <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">1. Video Source (MP4/WebM)</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <input 
                  className="w-full bg-gray-50 border border-gray-200 p-2.5 pr-12 rounded-lg outline-none focus:ring-2 focus:ring-primary/50" 
                  placeholder="Paste MP4 URL (H.264 recommended)..." 
                  value={newVideo.url} 
                  onChange={e => setNewVideo({...newVideo, url: e.target.value})} 
                />
                <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-500 border border-gray-200 transition-colors">
                  {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} disabled={isProcessing} />
                </label>
              </div>
            </div>
         </div>
         <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">2. Video Poster / Thumbnail (Optional)</label>
            <div className="flex gap-3 items-start">
               <div className="flex-1 relative">
                  <input 
                    className="w-full bg-gray-50 border border-gray-200 p-2.5 pr-12 rounded-lg outline-none focus:ring-2 focus:ring-primary/50" 
                    placeholder="Poster URL (Shown while video loads)..." 
                    value={newVideo.poster} 
                    onChange={e => setNewVideo({...newVideo, poster: e.target.value})} 
                  />
                  <label className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-500 border border-gray-200 transition-colors">
                    {isProcessingPoster ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <input type="file" accept="image/*" className="hidden" onChange={handlePosterUpload} disabled={isProcessingPoster} />
                  </label>
               </div>
               {newVideo.poster && (
                  <div className="w-12 h-12 bg-black rounded border border-gray-200 overflow-hidden shrink-0">
                     <img src={newVideo.poster} alt="Poster" className="w-full h-full object-cover" />
                  </div>
               )}
            </div>
         </div>
         {(newVideo.url || newVideo.poster) && (
            <div className="animate-fade-in p-4 bg-gray-900 rounded-xl flex flex-col sm:flex-row gap-4">
               {newVideo.url && (
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">Video Preview</p>
                    <video key={newVideo.url} src={newVideo.url} poster={newVideo.poster} controls className="w-full rounded-lg shadow-lg bg-black aspect-video max-h-40">
                      Your browser does not support the video tag.
                    </video>
                  </div>
               )}
               {newVideo.poster && !newVideo.url && (
                 <div className="flex-1">
                    <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">Poster Preview</p>
                    <img src={newVideo.poster} className="w-full rounded-lg shadow-lg bg-black aspect-video object-contain max-h-40" alt="Poster" />
                 </div>
               )}
            </div>
         )}
         <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={newVideo.isActive} onChange={e => setNewVideo({...newVideo, isActive: e.target.checked})} className="w-4 h-4 text-primary rounded" />
                <span className="text-sm text-gray-600 font-medium">Activate immediately</span>
            </label>
            <Button onClick={handleAdd} className="h-11 px-8" disabled={isProcessing || isProcessingPoster}>Add to Library</Button>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map(v => (
          <div key={v.id} className={`bg-white p-4 rounded-xl border flex flex-col gap-3 transition-all ${v.isActive ? 'border-primary ring-1 ring-primary/20 shadow-md' : 'border-gray-100 shadow-sm'}`}>
             <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
                <video src={v.url} poster={v.poster} className="w-full h-full object-cover" preload="metadata" controls />
                <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none">
                  {v.isActive && <span className="bg-primary/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>}
                  {v.poster && <span className="bg-blue-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">With Poster</span>}
                </div>
             </div>
             <div className="flex-1 flex flex-col gap-2">
               <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Video URL</span>
                  <p className="truncate text-[10px] font-mono text-gray-500 bg-gray-50 p-1.5 rounded border border-gray-100" title={v.url}>{v.url}</p>
               </div>
               <div className="flex gap-2 pt-2 border-t border-gray-50">
                 <Button size="sm" variant={v.isActive ? "primary" : "outline"} className="flex-1" onClick={() => toggleActive(v)}>
                   {v.isActive ? 'Active Now' : 'Set as Active'}
                 </Button>
                 <button onClick={() => handleDelete(v.id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors border border-gray-100">
                   <Trash2 size={18}/>
                 </button>
               </div>
             </div>
          </div>
        ))}
      </div>
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
              <div className="flex justify-between items-center mb-2">
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
