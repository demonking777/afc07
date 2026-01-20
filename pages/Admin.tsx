
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  subscribeToOrders, subscribeToMenu, saveMenuItem, deleteMenuItem, 
  updateOrderStatus, getSalesData, getSettings, saveSettings,
  subscribeToAnnouncements, saveAnnouncement, deleteAnnouncement,
  subscribeToVideos, savePreviewVideo, deletePreviewVideo,
  clearLocalData, loginAdmin, logoutAdmin, subscribeToAuth,
  getMenu
} from '../services/dataService';
import { Order, MenuItem, DailySales, AppSettings, Announcement, PreviewVideo, AdminUser, GoogleSheetsConfig } from '../types';
import { Button } from '../components/ui/Button';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
  LayoutDashboard, UtensilsCrossed, TrendingUp, LogOut, 
  CheckCircle, Clock, XCircle, Truck, ShoppingBag, Plus, Trash2, Edit2, Loader2, Image as ImageIcon, Upload, Settings, ShieldCheck, Megaphone, Type, Link as LinkIcon, Video, PlayCircle, Mail, Lock, Layers, Check, X, Database,
  RefreshCcw, AlertTriangle
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

  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'categories' | 'analytics' | 'announcements' | 'video' | 'integrations'>('orders');
  const [settings, setSettings] = useState<AppSettings>({ 
    whatsappNumber: APP_CONFIG.whatsappNumber, 
    categories: APP_CONFIG.defaultCategories,
    googleSheets: { spreadsheetId: '', sheetName: 'Orders', syncEnabled: false, lastSyncAt: 0, isConnected: false }
  });
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
      setLoginError(err.message || 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Logout?")) {
      await logoutAdmin();
      navigate('/');
    }
  };

  if (isInitializing) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fade-in border border-gray-100">
          <div className="text-center mb-8">
            <div className="bg-orange-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100"><ShieldCheck className="text-primary" size={32} /></div>
            <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
            <p className="text-gray-500 text-sm mt-1">Management dashboard access</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type="email" placeholder="admin@ammafood.com" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/50" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
            </div>
            {loginError && <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg flex items-center gap-2 border border-red-100"><XCircle size={14} /> {loginError}</div>}
            <Button fullWidth type="submit" size="lg" disabled={isLoggingIn} className="shadow-lg shadow-orange-500/20 h-12">
              {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : "Enter Dashboard"}
            </Button>
          </div>
          <div className="text-center mt-8">
            <Link to="/" className="text-[10px] text-gray-400 hover:text-primary transition-colors font-bold tracking-widest uppercase">← Back to Store</Link>
          </div>
        </form>
      </div>
    );
  }

  const navItems = [
    { id: 'orders', label: 'Orders', icon: LayoutDashboard },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'categories', label: 'Tabs', icon: Layers },
    { id: 'announcements', label: 'Ads', icon: Megaphone },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'analytics', label: 'Stats', icon: TrendingUp },
    { id: 'integrations', label: 'Sync', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-20 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex bg-gray-900 text-white w-64 flex-shrink-0 flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-800">
           <div className="flex items-center gap-2 mb-4">
             <ShieldCheck className="text-primary" size={24} />
             <h1 className="text-lg font-bold">Admin Panel</h1>
           </div>
           <div className="bg-gray-800 rounded-xl p-3 border border-gray-700">
             <div className="flex justify-between items-center mb-1">
               <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Gateway Status</label>
               {saveStatus === 'saving' && <Loader2 size={10} className="animate-spin text-blue-400" />}
               {saveStatus === 'saved' && <CheckCircle size={10} className="text-green-400" />}
             </div>
             <input type="text" value={settings.whatsappNumber} onChange={handleSettingsChange} className="w-full bg-gray-900 border border-gray-700 text-white text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-primary outline-none" />
           </div>
        </div>
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-primary text-white shadow-md' : 'text-gray-400 hover:bg-gray-800'}`}>
              <item.icon size={18} /> <span className="text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 mt-auto border-t border-gray-800">
           <button onClick={handleLogout} className="w-full flex items-center gap-2 text-gray-400 hover:text-white px-4 py-2 rounded-xl text-xs hover:bg-red-500/10 transition-colors">
             <LogOut size={16} /> Logout
           </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center gap-2">
           <ShieldCheck className="text-primary" size={20} />
           <span className="font-bold text-gray-800">Management</span>
        </div>
        <button onClick={handleLogout} className="p-2 text-gray-400"><LogOut size={18}/></button>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-1 py-2 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id as any)} 
            className={`flex flex-col items-center gap-1 flex-1 py-1 transition-all ${activeTab === item.id ? 'text-primary' : 'text-gray-400'}`}
          >
            <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'menu' && <MenuManager categories={settings.categories} />}
          {activeTab === 'categories' && <CategoryManager settings={settings} onUpdate={setSettings} />}
          {activeTab === 'announcements' && <AnnouncementsManager />}
          {activeTab === 'video' && <VideoManager />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'integrations' && <IntegrationsManager settings={settings} onUpdate={setSettings} />}
        </div>
      </main>
    </div>
  );
};

// --- Integrations Component ---
const IntegrationsManager: React.FC<{settings: AppSettings, onUpdate: (s: AppSettings) => void}> = ({ settings, onUpdate }) => {
  const [config, setConfig] = useState<GoogleSheetsConfig>(settings.googleSheets || {
    spreadsheetId: '', sheetName: 'Orders', syncEnabled: false, lastSyncAt: 0, isConnected: false
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);

  const handleSave = async (updatedConfig: GoogleSheetsConfig) => {
    const updatedSettings = { ...settings, googleSheets: updatedConfig };
    onUpdate(updatedSettings);
    await saveSettings(updatedSettings);
  };

  const handleConnect = () => {
    // If no real Client ID is provided, use Simulation Mode
    if (!APP_CONFIG.googleClientId || APP_CONFIG.googleClientId === 'G_CLIENT_ID') {
      const demoConfig = { 
        ...config, 
        isConnected: true, 
        accessToken: 'demo_token_simulated',
        syncEnabled: true 
      };
      setConfig(demoConfig);
      handleSave(demoConfig);
      setTestResult({ success: true, message: "Demo Mode Active: UI enabled, real syncing disabled." });
      return;
    }

    try {
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: APP_CONFIG.googleClientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: (response: any) => {
          if (response.access_token) {
            const updated = { ...config, isConnected: true, accessToken: response.access_token };
            setConfig(updated);
            handleSave(updated);
          }
        },
      });
      client.requestAccessToken();
    } catch (e) { 
      alert("Failed to initialize Google Auth. Please check your network connection."); 
    }
  };

  const handleTest = async () => {
    if (!config.spreadsheetId || !config.accessToken) return;
    setIsTesting(true);
    
    // Simulate Check for Demo Token
    if (config.accessToken === 'demo_token_simulated') {
       setTimeout(() => {
          setTestResult({ success: true, message: "Demo Connection Successful!" });
          setIsTesting(false);
       }, 800);
       return;
    }

    try {
      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}`, {
        headers: { 'Authorization': `Bearer ${config.accessToken}` }
      });
      if (response.ok) {
        setTestResult({ success: true, message: "Connection successful!" });
      } else {
        const err = await response.json();
        setTestResult({ success: false, message: err.error?.message || "Connection failed" });
      }
    } catch (e: any) { setTestResult({ success: false, message: e.message || "Network error" }); }
    finally { setIsTesting(false); }
  };

  const isDemo = config.accessToken === 'demo_token_simulated';

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-start">
          <h2 className="text-2xl font-bold text-gray-800">Integrations</h2>
          {isDemo && (
             <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-200 flex items-center gap-1">
                <AlertTriangle size={12} /> DEMO MODE
             </span>
          )}
       </div>
       <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center"><Database className="text-green-600" /></div>
            <div><h3 className="font-bold">Google Sheets Sync</h3><p className="text-xs text-gray-500">Real-time order export</p></div>
          </div>
          <div className="grid gap-6">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Spreadsheet ID</label>
                <input className="w-full bg-gray-50 border border-gray-200 p-2.5 rounded-xl text-sm font-mono" value={config.spreadsheetId} onChange={e => { const u = {...config, spreadsheetId: e.target.value}; setConfig(u); handleSave(u); }} placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" />
             </div>
             <div className="flex gap-4">
                <Button variant={config.isConnected ? 'outline' : 'primary'} onClick={handleConnect} className="flex-1">
                    {config.isConnected ? 'Re-authorize' : (APP_CONFIG.googleClientId ? 'Connect Account' : 'Connect (Demo)')}
                </Button>
                <Button variant="outline" onClick={handleTest} disabled={isTesting || !config.isConnected} className="flex-1">{isTesting ? '...' : 'Test Connection'}</Button>
             </div>
             
             {testResult && <div className={`p-3 rounded-xl text-xs font-bold ${testResult.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{testResult.message}</div>}
             
             {!APP_CONFIG.googleClientId && !isDemo && (
               <div className="bg-gray-50 text-gray-500 text-xs p-3 rounded-xl border border-gray-200">
                 Running in <b>Simulation Mode</b>. Connection will be mocked for UI testing.
               </div>
             )}
          </div>
       </div>
    </div>
  );
};

// --- Menu Manager Component ---

const MenuManager: React.FC<{categories: string[]}> = ({ categories }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem>>({});
  
  useEffect(() => subscribeToMenu(setItems), []);

  const handleDelete = async (id: string) => { if(confirm("Are you sure you want to delete this item?")) await deleteMenuItem(id); };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem({
      name: '',
      description: '',
      price: 0,
      type: 'veg',
      category: categories[0] || 'Main Course',
      isAvailable: true,
      image: 'https://picsum.photos/400/300'
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem.name || !editingItem.price) return;
    
    // Ensure all required fields are present
    const itemToSave = {
       id: editingItem.id, // Might be undefined for new items
       name: editingItem.name,
       description: editingItem.description || '',
       price: Number(editingItem.price),
       type: editingItem.type || 'veg',
       category: editingItem.category || 'Main Course',
       isAvailable: editingItem.isAvailable !== undefined ? editingItem.isAvailable : true,
       image: editingItem.image || 'https://picsum.photos/400/300'
    } as MenuItem;

    await saveMenuItem(itemToSave);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Menu Management</h2>
        <Button onClick={handleAddNew} size="sm" className="gap-2 shadow-lg shadow-orange-200">
          <Plus size={16} /> Add New Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(it => (
          <div key={it.id} className="bg-white p-3 rounded-xl border border-gray-100 flex gap-3 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-gray-100">
              <img src={it.image} alt={it.name} className={`w-full h-full object-cover ${!it.isAvailable ? 'grayscale' : ''}`} />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
               <h4 className="font-bold text-gray-800 truncate leading-tight mb-0.5">{it.name}</h4>
               <p className="text-xs text-gray-500 mb-1 truncate">{it.category}</p>
               <div className="flex items-center gap-2">
                  <span className="font-bold text-primary">{APP_CONFIG.currency}{it.price}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${it.type === 'veg' ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                    {it.type === 'veg' ? 'VEG' : 'NON'}
                  </span>
                  {!it.isAvailable && <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">SOLD OUT</span>}
               </div>
            </div>
            
            {/* Action Buttons Overlay */}
            <div className="absolute right-2 top-2 bottom-2 flex flex-col justify-between opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                 onClick={() => handleEdit(it)} 
                 className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-colors"
                 title="Edit"
               >
                 <Edit2 size={14} />
               </button>
               <button 
                 onClick={() => handleDelete(it.id)} 
                 className="p-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-500 hover:text-red-600 hover:border-red-200 transition-colors"
                 title="Delete"
               >
                 <Trash2 size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   {editingItem.id ? <Edit2 size={18} className="text-primary"/> : <Plus size={18} className="text-primary"/>}
                   {editingItem.id ? 'Edit Item' : 'New Menu Item'}
                 </h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                 <form id="menu-form" onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Item Name</label>
                          <input 
                            required 
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                            placeholder="e.g. Butter Chicken"
                            value={editingItem.name || ''}
                            onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                          />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Price ({APP_CONFIG.currency})</label>
                          <input 
                            required 
                            type="number" 
                            min="0"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                            placeholder="0"
                            value={editingItem.price || ''}
                            onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                          />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Description</label>
                        <textarea 
                          rows={2}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" 
                          placeholder="Describe the dish..."
                          value={editingItem.description || ''}
                          onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Category</label>
                          <select 
                             className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                             value={editingItem.category || ''}
                             onChange={e => setEditingItem({...editingItem, category: e.target.value})}
                          >
                             {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dietary Type</label>
                          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                             <button 
                               type="button"
                               onClick={() => setEditingItem({...editingItem, type: 'veg'})}
                               className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${editingItem.type === 'veg' ? 'bg-green-100 text-green-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                             >
                               VEG
                             </button>
                             <button 
                               type="button"
                               onClick={() => setEditingItem({...editingItem, type: 'non-veg'})}
                               className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${editingItem.type === 'non-veg' ? 'bg-red-100 text-red-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                             >
                               NON-VEG
                             </button>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Image URL</label>
                        <div className="relative">
                          <ImageIcon className="absolute left-3 top-2.5 text-gray-400" size={16} />
                          <input 
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                            placeholder="https://..."
                            value={editingItem.image || ''}
                            onChange={e => setEditingItem({...editingItem, image: e.target.value})}
                          />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer" onClick={() => setEditingItem({...editingItem, isAvailable: !editingItem.isAvailable})}>
                       <div className={`w-10 h-6 rounded-full p-1 transition-colors ${editingItem.isAvailable ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${editingItem.isAvailable ? 'translate-x-4' : ''}`}></div>
                       </div>
                       <span className="text-sm font-medium text-gray-700">Available for Ordering</span>
                    </div>
                 </form>
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                 <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Cancel</Button>
                 <Button type="submit" form="menu-form" className="flex-1 shadow-md shadow-orange-500/20">Save Changes</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// --- Other View Components ---

const CategoryManager: React.FC<{settings: AppSettings, onUpdate: (s: AppSettings) => void}> = ({ settings, onUpdate }) => {
  const [newCat, setNewCat] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAdd = async () => {
    if (!newCat.trim()) return;
    if (settings.categories.includes(newCat.trim())) {
        alert("Category already exists");
        return;
    }
    const updated = { ...settings, categories: [...settings.categories, newCat.trim()] };
    await saveSettings(updated);
    onUpdate(updated);
    setNewCat('');
  };

  const handleRemove = async (cat: string) => {
    if (!confirm(`Delete category "${cat}"? Items in this category will remain but may not be filterable.`)) return;
    const updated = { ...settings, categories: settings.categories.filter(c => c !== cat) };
    await saveSettings(updated);
    onUpdate(updated);
  };

  const startEdit = (cat: string) => {
    setEditingCat(cat);
    setEditValue(cat);
  };

  const saveEdit = async () => {
    if (!editingCat || !editValue.trim()) return;
    const newName = editValue.trim();
    if (newName === editingCat) {
        setEditingCat(null);
        return;
    }
    if (settings.categories.includes(newName)) {
        alert("Category already exists");
        return;
    }

    setIsProcessing(true);
    try {
        // Update Settings
        const newCategories = settings.categories.map(c => c === editingCat ? newName : c);
        const updatedSettings = { ...settings, categories: newCategories };
        await saveSettings(updatedSettings);
        onUpdate(updatedSettings);

        // Update Menu Items
        const allItems = await getMenu();
        const itemsToUpdate = allItems.filter(i => i.category === editingCat);
        if (itemsToUpdate.length > 0) {
            await Promise.all(itemsToUpdate.map(item => saveMenuItem({ ...item, category: newName })));
        }
    } catch (error) {
        console.error("Error updating category:", error);
        alert("Failed to update category name");
    } finally {
        setIsProcessing(false);
        setEditingCat(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
      <div className="flex gap-2">
         <input 
            className="flex-1 bg-white border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm" 
            placeholder="Add New Category..." 
            value={newCat} 
            onChange={e => setNewCat(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
         />
         <Button onClick={handleAdd} className="shadow-lg shadow-orange-500/20">
            <Plus size={18} />
         </Button>
      </div>

      <div className="grid gap-3">
        {settings.categories.map(c => (
           <div key={c} className="bg-white p-3 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm group">
             {editingCat === c ? (
                <div className="flex-1 flex gap-2 items-center animate-fade-in">
                    <input 
                      autoFocus
                      className="flex-1 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-primary"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit()}
                      disabled={isProcessing}
                    />
                    <button onClick={saveEdit} disabled={isProcessing} className="p-2 text-green-600 hover:bg-green-50 rounded-lg"><Check size={18} /></button>
                    <button onClick={() => setEditingCat(null)} disabled={isProcessing} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
                </div>
             ) : (
                <>
                  <span className="font-medium text-gray-700 pl-2">{c}</span>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => startEdit(c)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Rename">
                        <Edit2 size={16} />
                     </button>
                     <button onClick={() => handleRemove(c)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                        <Trash2 size={16} />
                     </button>
                  </div>
                </>
             )}
           </div>
        ))}
      </div>
    </div>
  );
};

const VideoManager: React.FC = () => {
  const [videos, setVideos] = useState<PreviewVideo[]>([]);
  const [url, setUrl] = useState('');
  const [poster, setPoster] = useState('');

  useEffect(() => subscribeToVideos(setVideos), []);
  
  const handleAdd = async () => {
    if (!url.trim()) return;
    await savePreviewVideo({
      id: '',
      url,
      poster,
      isActive: true, // Auto-activate new video
      createdAt: Date.now()
    });
    setUrl('');
    setPoster('');
  };

  const handleDelete = async (id: string) => { if(confirm("Delete video?")) await deletePreviewVideo(id); };

  const handleActivate = async (video: PreviewVideo) => {
     if (video.isActive) return; 
     await savePreviewVideo({ ...video, isActive: true });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Video Previews</h2>
      
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
         <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Video URL (MP4)</label>
            <input 
               className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
               placeholder="https://example.com/video.mp4"
               value={url}
               onChange={e => setUrl(e.target.value)}
            />
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Poster Image URL (Optional)</label>
            <input 
               className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
               placeholder="https://example.com/poster.jpg"
               value={poster}
               onChange={e => setPoster(e.target.value)}
            />
         </div>
         <Button fullWidth onClick={handleAdd} className="mt-2">Upload Preview Video</Button>
      </div>

      <div className="grid gap-4">
        {videos.map(v => (
          <div key={v.id} className={`bg-white p-4 rounded-xl border transition-all ${v.isActive ? 'border-primary ring-1 ring-primary shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
             <div className="flex gap-4">
                <div className="w-24 h-16 bg-black rounded-lg overflow-hidden shrink-0 relative">
                   <video src={v.url} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <PlayCircle className="text-white/80" size={20} />
                   </div>
                </div>
                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start">
                      <p className="text-xs text-gray-500 font-mono truncate">{v.url}</p>
                      {v.isActive && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle size={10} /> LIVE</span>}
                   </div>
                   <div className="mt-3 flex gap-2">
                      {!v.isActive && (
                        <button onClick={() => handleActivate(v)} className="text-xs font-bold text-primary hover:bg-orange-50 px-2 py-1 rounded transition-colors">
                           Set Active
                        </button>
                      )}
                      <button onClick={() => handleDelete(v.id)} className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                         Delete
                      </button>
                   </div>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnnouncementsManager: React.FC = () => {
  const [ads, setAds] = useState<Announcement[]>([]);
  const [content, setContent] = useState('');
  const [type, setType] = useState<'text' | 'image'>('text');

  useEffect(() => subscribeToAnnouncements(setAds), []);

  const handleAdd = async () => {
    if (!content.trim()) return;
    await saveAnnouncement({
      id: '',
      content,
      type,
      isActive: true
    });
    setContent('');
  };

  const toggleActive = async (ad: Announcement) => {
    await saveAnnouncement({ ...ad, isActive: !ad.isActive });
  };

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-800">Announcements (Ads)</h2>
       
       <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex gap-4">
             <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200 h-10">
                <button onClick={() => setType('text')} className={`px-3 text-xs font-bold rounded transition-all ${type === 'text' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Text</button>
                <button onClick={() => setType('image')} className={`px-3 text-xs font-bold rounded transition-all ${type === 'image' ? 'bg-white shadow text-primary' : 'text-gray-500'}`}>Image</button>
             </div>
             <input 
               className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
               placeholder={type === 'text' ? "Enter announcement text..." : "Enter image URL..."}
               value={content}
               onChange={e => setContent(e.target.value)}
             />
             <Button onClick={handleAdd}>Add</Button>
          </div>
       </div>

       <div className="grid gap-3">
         {ads.map(a => (
           <div key={a.id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between group">
             <div className="flex items-center gap-3 overflow-hidden">
                <div 
                  onClick={() => toggleActive(a)}
                  className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors shrink-0 ${a.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                   <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${a.isActive ? 'translate-x-4' : ''}`}></div>
                </div>
                {a.type === 'image' ? (
                   <img src={a.content} alt="Ad" className="h-10 w-10 object-cover rounded bg-gray-100 border" />
                ) : (
                   <Megaphone size={20} className="text-gray-400 shrink-0" />
                )}
                <span className="truncate text-sm font-medium text-gray-700">{a.content}</span>
             </div>
             <button onClick={() => deleteAnnouncement(a.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
               <Trash2 size={16}/>
             </button>
           </div>
         ))}
       </div>
    </div>
  );
};

const OrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => subscribeToOrders(setOrders), []);
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
      <div className="grid gap-4">
        {orders.map(o => (
          <div key={o.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
            <div><div className="font-bold text-gray-900">{o.customer.name}</div><div className="text-xs text-gray-500">{o.customer.phone} • {new Date(o.timestamp).toLocaleTimeString()}</div></div>
            <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => updateOrderStatus(o.id, 'delivered')}>Complete</Button></div>
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" /><YAxis /><Tooltip /><Bar dataKey="amount" fill="#F97316" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>
      </div>
    </div>
  );
};
