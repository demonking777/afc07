
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MenuItem, CartItem, Announcement, PreviewVideo } from '../types';
import { getMenu, createOrder, seedInitialMenu, getSettings, subscribeToSettings, subscribeToAnnouncements, getActivePreviewVideo } from '../services/dataService';
import { MenuCard } from '../components/MenuCard';
import { CheckoutModal } from '../components/CheckoutModal';
import { APP_CONFIG, CATEGORIES } from '../constants';
import { ShoppingBag, Search, Filter, RefreshCcw, Megaphone, Shield, Volume2, VolumeX, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState(APP_CONFIG.whatsappNumber);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState<PreviewVideo | null>(null);
  
  // Video Player State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [items, settings, video] = await Promise.all([
        getMenu(), 
        getSettings(),
        getActivePreviewVideo()
      ]);
      setMenu(items);
      setWhatsappNumber(settings.whatsappNumber);
      setActiveVideo(video);
      setLoading(false);
    };
    loadData();

    // Subscribe to settings changes
    const unsubscribeSettings = subscribeToSettings((settings) => {
      setWhatsappNumber(settings.whatsappNumber);
    });
    
    // Subscribe to Announcements
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

  // Robust Video Autoplay Logic
  useEffect(() => {
    if (activeVideo && videoRef.current) {
        const video = videoRef.current;
        // Always start muted for browser policy compliance
        video.muted = true;
        setIsMuted(true);
        
        const attemptPlay = async () => {
            try {
                // Ensure the video is ready
                if (video.readyState >= 2) {
                    await video.play();
                } else {
                    video.oncanplay = async () => {
                        await video.play();
                        video.oncanplay = null; // cleanup
                    };
                }
                setIsVideoPlaying(true);
            } catch (err) {
                console.log("Autoplay prevented by browser, waiting for user interaction.", err);
                setIsVideoPlaying(false);
            }
        };
        attemptPlay();
    }
  }, [activeVideo]);

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(e => console.error("Play failed", e));
      setIsVideoPlaying(true);
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

  // Debug tool to seed data if empty
  const handleSeed = async () => {
    if (confirm("Seed initial menu data to Firebase?")) {
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
      id: '', // Will be generated by Firestore
      customer,
      items: cart,
      totalAmount: cartTotal,
      status: 'pending',
      timestamp: Date.now(),
      platform: 'whatsapp'
    });
    setCart([]); // Clear cart locally after "sending" to WhatsApp
    setLastAddedId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with Top Right Cart */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 transition-all">
        <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/3448/3448606.png" 
              alt="Amma Food Center" 
              className="w-10 h-10 object-contain bg-orange-50 rounded-full p-1 border border-orange-100 shadow-sm"
            />
            <div>
              <h1 className="font-bold text-gray-900 leading-none text-lg tracking-tight">{APP_CONFIG.name}</h1>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Mumbai • Fast Delivery</span>
            </div>
          </div>
          
          {/* Top Right Cart Access */}
          <button 
            onClick={() => setIsCheckoutOpen(true)}
            className="relative p-2.5 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-primary rounded-xl transition-all active:scale-95 border border-gray-100"
            aria-label="View Cart"
          >
            <ShoppingBag size={22} strokeWidth={2.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-fade-in">
                {cartCount}
              </span>
            )}
          </button>
        </div>
        
        {/* Search & Filter Bar */}
        <div className="max-w-4xl mx-auto px-4 py-2 overflow-x-auto scrollbar-hide border-t border-gray-50">
          <div className="flex gap-2">
             <div className="relative min-w-[180px] flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
                <input 
                  type="text" 
                  placeholder="Search dishes..." 
                  className="w-full pl-9 pr-4 py-2 bg-gray-100/80 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow border-transparent border focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             {CATEGORIES.map(cat => (
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

      {/* Ads / Announcements Slider */}
      {announcements.length > 0 && (
         <div className="max-w-4xl mx-auto mt-4 px-4 w-full">
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
              
              {/* Dots Indicator */}
              {announcements.length > 1 && (
                 <div className="absolute bottom-1.5 flex gap-1 z-20">
                    {announcements.map((_, idx) => (
                       <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentAdIndex ? 'bg-primary' : 'bg-gray-300'}`}></div>
                    ))}
                 </div>
              )}
            </div>
         </div>
      )}

      {/* Hero Video Preview Section */}
      {announcements.length === 0 && activeVideo && (
        <div className="max-w-4xl mx-auto mt-4 px-4 w-full animate-fade-in">
          <div 
            className="relative w-full aspect-[16/9] sm:aspect-[21/9] sm:h-64 bg-black rounded-2xl overflow-hidden shadow-md border border-gray-900 group cursor-pointer"
            onClick={toggleVideoPlay}
          >
            <video 
              ref={videoRef}
              key={activeVideo.url} // Forces remount on URL change to prevent stale source
              className="w-full h-full object-cover"
              src={activeVideo.url}
              muted
              loop
              playsInline // Critical for iOS
              preload="auto"
              poster={activeVideo.poster || undefined}
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>
            
            {/* Play/Pause Overlay */}
            <div className={`absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity duration-300 ${isVideoPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                {!isVideoPlaying && (
                    <div className="bg-black/40 rounded-full p-4 backdrop-blur-sm border border-white/20 shadow-xl transform transition-transform hover:scale-110">
                         <PlayCircle size={48} className="text-white fill-white/20" />
                    </div>
                )}
            </div>
            
            {/* Badges */}
            <div className="absolute top-4 left-4 pointer-events-none z-10">
              <div className="flex items-center gap-2">
                  <span className="bg-primary/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm border border-white/10">Featured</span>
              </div>
            </div>

             {/* Mute Control */}
             <div className="absolute bottom-4 right-4 z-20">
               <button 
                 onClick={toggleMute}
                 className="p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md border border-white/10 transition-colors"
               >
                 {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 pt-6 w-full flex-1">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
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
            </div>
            
            {filteredMenu.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Filter className="mx-auto mb-2" size={48} />
                <p>No items found.</p>
                {menu.length === 0 && (
                   <button onClick={handleSeed} className="mt-4 text-primary text-sm flex items-center gap-1 mx-auto hover:underline">
                     <RefreshCcw size={14} /> Seed Demo Data
                   </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer / Bottom Admin Link */}
      <footer className="w-full bg-white border-t border-gray-100 py-6 mt-auto">
        <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center gap-4">
           <p className="text-xs text-gray-400 text-center">
             © {new Date().getFullYear()} {APP_CONFIG.name}. All rights reserved.
           </p>
           
           <Link 
             to="/admin" 
             className="flex items-center gap-2 text-[10px] font-semibold text-gray-300 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors"
           >
             <Shield size={10} />
             ADMIN LOGIN
           </Link>
        </div>
      </footer>

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        total={cartTotal}
        onComplete={handleOrderComplete}
        whatsappNumber={whatsappNumber}
      />
    </div>
  );
};
