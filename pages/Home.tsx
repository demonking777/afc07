
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MenuItem, CartItem, Announcement, PreviewVideo, AppSettings } from '../types';
import { getMenu, createOrder, seedInitialMenu, getSettings, subscribeToSettings, subscribeToAnnouncements, getActivePreviewVideo } from '../services/dataService';
import { MenuCard } from '../components/MenuCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { APP_CONFIG } from '../constants';
import { ShoppingBag, Search, Filter, RefreshCcw, Megaphone, Shield, Volume2, VolumeX, PlayCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>({ whatsappNumber: APP_CONFIG.whatsappNumber, categories: APP_CONFIG.defaultCategories });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState<PreviewVideo | null>(null);
  
  // Video Player State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [items, currentSettings, video] = await Promise.all([
        getMenu(), 
        getSettings(),
        getActivePreviewVideo()
      ]);
      setMenu(items);
      setSettings(currentSettings);
      setActiveVideo(video);
      setLoading(false);
    };
    loadData();

    const unsubscribeSettings = subscribeToSettings((newSettings) => {
      setSettings(newSettings);
    });
    
    const unsubscribeAds = subscribeToAnnouncements((ads) => {
       setAnnouncements(ads.filter(a => a.isActive));
    });

    return () => {
      unsubscribeSettings();
      unsubscribeAds();
    };
  }, []);

  // Carousel Logic
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
       setCurrentAdIndex(prev => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements]);

  // Enhanced Video Autoplay Logic for Mobile
  useEffect(() => {
    if (activeVideo && videoRef.current) {
        const video = videoRef.current;
        video.muted = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        
        const attemptPlay = () => {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsVideoPlaying(true);
                    setVideoError(false);
                }).catch(err => {
                    console.log("Autoplay prevented", err);
                    setIsVideoPlaying(false);
                });
            }
        };

        if (video.readyState >= 3) {
            attemptPlay();
        } else {
            video.oncanplay = () => {
                attemptPlay();
                video.oncanplay = null;
            };
        }

        return () => {
            video.pause();
            video.oncanplay = null;
        };
    }
  }, [activeVideo]);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsVideoPlaying(true)).catch(() => setVideoError(true));
    } else {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleSeed = async () => {
    if (confirm("Seed initial menu data?")) {
      await seedInitialMenu();
      const items = await getMenu();
      setMenu(items);
    }
  };

  const addToCart = (item: MenuItem) => {
    setLastAddedId(item.id);
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.id === itemId) return { ...i, quantity: i.quantity - 1 };
        return i;
      }).filter(i => i.quantity > 0);
    });
  };

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menu, selectedCategory, searchQuery]);

  const handleOrderComplete = async (customer: any) => {
    await createOrder({
      id: '',
      customer,
      items: cart,
      totalAmount: cartTotal,
      status: 'pending',
      timestamp: Date.now(),
      platform: 'whatsapp'
    });
    setCart([]);
    setLastAddedId(null);
  };

  const allCategories = useMemo(() => ['All', ...(settings.categories || [])], [settings.categories]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/3448/3448606.png" 
              alt="Logo" 
              className="w-10 h-10 object-contain bg-orange-50 rounded-full p-1 border border-orange-100 shadow-sm"
            />
            <div>
              <h1 className="font-bold text-gray-900 leading-none text-lg tracking-tight">{APP_CONFIG.name}</h1>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Quality • Fast • Secure</span>
            </div>
          </div>
          
          <button 
            onClick={() => setIsCheckoutOpen(true)}
            className="relative p-2.5 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-primary rounded-xl transition-all active:scale-95 border border-gray-100"
          >
            <ShoppingBag size={22} strokeWidth={2.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 py-2 overflow-x-auto scrollbar-hide border-t border-gray-50">
          <div className="flex gap-2">
             <div className="relative min-w-[180px] flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
                <input 
                  type="text" 
                  placeholder="Find your favorite..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-100/80 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow border-transparent border focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             {allCategories.map(cat => (
               <button
                 key={cat}
                 onClick={() => setSelectedCategory(cat)}
                 className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-gray-900 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
               >
                 {cat}
               </button>
             ))}
          </div>
        </div>
      </header>

      {/* Hero Content (Ads/Video) */}
      <div className="max-w-4xl mx-auto mt-4 px-4 w-full">
        {announcements.length > 0 ? (
          <div className="relative w-full h-16 sm:h-20 bg-gradient-to-r from-orange-100 to-orange-50 rounded-xl border border-orange-100 overflow-hidden shadow-sm flex items-center justify-center">
            {announcements.map((ad, idx) => (
              <div 
                key={ad.id}
                className={`absolute inset-0 transition-opacity duration-700 flex items-center justify-center ${idx === currentAdIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                {ad.type === 'text' ? (
                   <div className="flex items-center gap-3 px-4">
                      <Megaphone className="text-primary shrink-0 animate-bounce" size={20} />
                      <span className="font-bold text-gray-800 text-sm sm:text-base text-center leading-tight">{ad.content}</span>
                   </div>
                ) : (
                   <img src={ad.content} alt="Ad" className="w-full h-full object-cover" />
                )}
              </div>
            ))}
          </div>
        ) : activeVideo && (
          <div 
            className="relative w-full aspect-[16/9] sm:aspect-[21/9] sm:max-h-[300px] bg-black rounded-2xl overflow-hidden shadow-md border border-gray-900 group cursor-pointer"
            onClick={toggleVideoPlay}
          >
            <video 
              ref={videoRef}
              key={activeVideo.url}
              className="w-full h-full object-cover"
              src={activeVideo.url}
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
              poster={activeVideo.poster || undefined}
            />
            <div className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity duration-300 ${isVideoPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
              {!isVideoPlaying && <PlayCircle size={64} className="text-white fill-white/10" />}
            </div>
            <div className="absolute bottom-4 right-4 z-20">
               <button onClick={toggleMute} className="p-3 bg-black/50 text-white rounded-full backdrop-blur-md border border-white/10">
                 {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
               </button>
            </div>
          </div>
        )}
      </div>

      <main className="max-w-4xl mx-auto p-4 pt-6 w-full flex-1">
        {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredMenu.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                quantity={cart.find(i => i.id === item.id)?.quantity || 0}
                onAdd={() => addToCart(item)}
                onRemove={() => removeFromCart(item.id)}
              />
            ))}
            {filteredMenu.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-400">
                <Filter className="mx-auto mb-2" size={48} />
                <p>Nothing matches your filter.</p>
                {menu.length === 0 && (
                   <button onClick={handleSeed} className="mt-4 text-primary text-sm flex items-center gap-1 mx-auto hover:underline">
                     <RefreshCcw size={14} /> Seed Menu
                   </button>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="w-full bg-white border-t border-gray-100 pt-12">
        <div className="max-w-4xl mx-auto px-4 pb-12 flex flex-col items-center justify-center gap-6">
           <div className="flex items-center gap-3 opacity-30 grayscale">
             <img src="https://cdn-icons-png.flaticon.com/512/3448/3448606.png" alt="Logo" className="w-8 h-8 object-contain" />
             <span className="font-bold text-sm tracking-widest uppercase">{APP_CONFIG.name}</span>
           </div>
           <p className="text-[10px] text-gray-400 text-center font-medium opacity-50 uppercase tracking-widest">
             © {new Date().getFullYear()} {APP_CONFIG.name} • Quality First
           </p>
        </div>

        {/* System Entry Layer - Fixed to absolute base, discrete and non-intrusive */}
        <div className="w-full py-4 bg-gray-50 border-t border-gray-100 flex justify-center">
           <Link 
             to="/admin" 
             className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-bold text-gray-300 hover:text-gray-500 hover:bg-white hover:shadow-sm transition-all duration-300 tracking-[0.15em] border border-transparent hover:border-gray-200 uppercase"
           >
             <Shield size={9} className="opacity-40" />
             System Access
           </Link>
        </div>
      </footer>

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        total={cartTotal}
        onComplete={handleOrderComplete}
        whatsappNumber={settings.whatsappNumber}
      />
    </div>
  );
};
