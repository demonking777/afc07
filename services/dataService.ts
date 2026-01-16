
import { db, isFirebaseEnabled } from './firebase';
import { MenuItem, Order, DailySales, AppSettings, Announcement, PreviewVideo } from '../types';
import { INITIAL_MENU, APP_CONFIG } from '../constants';

// Define collection names
const MENU_COLLECTION = 'menu_items';
const ORDER_COLLECTION = 'orders';
const SETTINGS_COLLECTION = 'settings';
const ANNOUNCEMENTS_COLLECTION = 'announcements';
const VIDEO_COLLECTION = 'preview_videos';
const SETTINGS_DOC_ID = 'config';

// Local storage keys
const LS_MENU_KEY = 'amma_menu_local';
const LS_ORDERS_KEY = 'amma_orders_local';
const LS_SETTINGS_KEY = 'amma_settings_local';
const LS_ANNOUNCEMENTS_KEY = 'amma_announcements_local';
const LS_VIDEO_KEY = 'amma_video_local';

// --- Local Storage Helpers (Fallback) ---

// Helper to safely save to localStorage with quota handling
const persistToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    console.warn(`Failed to save to ${key}:`, e);
    // Check for quota exceeded error (names vary by browser)
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
      alert("Local Storage Full! \n\nCannot save large data (like videos/images) locally because the browser's storage limit (usually 5MB) is exceeded.\n\nPlease use the 'Reset Demo Data' button in the Admin sidebar to free up space, or use external URLs.");
    }
  }
};

export const clearLocalData = () => {
  try {
    localStorage.removeItem(LS_MENU_KEY);
    localStorage.removeItem(LS_ORDERS_KEY);
    localStorage.removeItem(LS_SETTINGS_KEY);
    localStorage.removeItem(LS_ANNOUNCEMENTS_KEY);
    localStorage.removeItem(LS_VIDEO_KEY);
    window.location.reload();
  } catch (e) {
    console.error("Failed to clear local data", e);
  }
};

const getLocalMenu = (): MenuItem[] => {
  const stored = localStorage.getItem(LS_MENU_KEY);
  return stored ? JSON.parse(stored) : INITIAL_MENU;
};

const saveLocalMenu = (items: MenuItem[]) => persistToStorage(LS_MENU_KEY, items);

const getLocalOrders = (): Order[] => {
  const stored = localStorage.getItem(LS_ORDERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveLocalOrders = (orders: Order[]) => persistToStorage(LS_ORDERS_KEY, orders);

const getLocalSettings = (): AppSettings => {
  const stored = localStorage.getItem(LS_SETTINGS_KEY);
  return stored ? JSON.parse(stored) : { whatsappNumber: APP_CONFIG.whatsappNumber };
};

const saveLocalSettings = (settings: AppSettings) => persistToStorage(LS_SETTINGS_KEY, settings);

const getLocalAnnouncements = (): Announcement[] => {
  const stored = localStorage.getItem(LS_ANNOUNCEMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveLocalAnnouncements = (items: Announcement[]) => persistToStorage(LS_ANNOUNCEMENTS_KEY, items);

const getLocalVideos = (): PreviewVideo[] => {
  const stored = localStorage.getItem(LS_VIDEO_KEY);
  return stored ? JSON.parse(stored) : [];
};

const saveLocalVideos = (items: PreviewVideo[]) => persistToStorage(LS_VIDEO_KEY, items);

// --- Settings Operations ---

export const getSettings = async (): Promise<AppSettings> => {
  if (!isFirebaseEnabled || !db) return getLocalSettings();

  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const snap = await docRef.get();
    if (snap.exists) {
      return snap.data() as AppSettings;
    }
    return getLocalSettings();
  } catch (error) {
    console.warn("Firebase settings fetch failed, using local fallback");
    return getLocalSettings();
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  saveLocalSettings(settings); // Always save local backup

  if (!isFirebaseEnabled || !db) return;

  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    await docRef.set(settings, { merge: true });
  } catch (error) {
    console.warn("Remote settings save failed, saved locally only");
  }
};

export const subscribeToSettings = (callback: (settings: AppSettings) => void) => {
  if (!isFirebaseEnabled || !db) {
    callback(getLocalSettings());
    return () => {};
  }

  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    return docRef.onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data() as AppSettings;
        callback(data);
        saveLocalSettings(data);
      } else {
        callback(getLocalSettings());
      }
    }, (error) => {
      console.warn("Settings subscription failed");
      callback(getLocalSettings());
    });
  } catch (error) {
    callback(getLocalSettings());
    return () => {};
  }
};

// --- Menu Operations ---

export const getMenu = async (): Promise<MenuItem[]> => {
  if (!isFirebaseEnabled || !db) return getLocalMenu();

  try {
    const querySnapshot = await db.collection(MENU_COLLECTION).get();
    if (querySnapshot.empty) {
      return getLocalMenu(); 
    }
    const items = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
    saveLocalMenu(items); // Sync cache
    return items;
  } catch (error) {
    console.warn("Firebase menu fetch failed, using local fallback");
    return getLocalMenu();
  }
};

export const seedInitialMenu = async () => {
  saveLocalMenu(INITIAL_MENU);
  
  if (!isFirebaseEnabled || !db) return;

  try {
    const batchPromises = INITIAL_MENU.map(item => {
      const { id, ...data } = item;
      return db!.collection(MENU_COLLECTION).doc(id).set(data);
    });
    await Promise.all(batchPromises);
  } catch (e) {
    console.warn("Could not seed remote DB");
  }
};

export const subscribeToMenu = (callback: (menu: MenuItem[]) => void) => {
  if (!isFirebaseEnabled || !db) {
    callback(getLocalMenu());
    const interval = setInterval(() => callback(getLocalMenu()), 1000);
    return () => clearInterval(interval);
  }
  
  try {
    return db.collection(MENU_COLLECTION).onSnapshot((snapshot) => {
      const menu = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
      // Source of truth is Firestore. Sync it to local storage.
      saveLocalMenu(menu);
      callback(menu);
    }, (error) => {
      console.warn("Menu subscription failed, using local data");
      callback(getLocalMenu());
    });
  } catch (error) {
    console.warn("Menu subscription error");
    callback(getLocalMenu());
    return () => {};
  }
};

export const saveMenuItem = async (item: MenuItem): Promise<void> => {
  if (isFirebaseEnabled && db) {
    try {
      if (!item.id || item.id.startsWith('local_')) {
        // Create new in Firestore to get ID
        const { id, ...data } = item;
        const docRef = await db.collection(MENU_COLLECTION).add(data);
        item.id = docRef.id; // Assign real ID
      } else {
        // Update existing
        const { id, ...data } = item;
        await db.collection(MENU_COLLECTION).doc(item.id).set(data, { merge: true });
      }
    } catch (error) {
      console.warn("Remote save failed, falling back to local ID");
      if (!item.id) item.id = `local_${Date.now()}`;
    }
  } else {
    // Local mode only
    if (!item.id) item.id = `local_${Date.now()}`;
  }

  // Save to Local Storage (now with correct ID if Firebase succeeded)
  const currentMenu = getLocalMenu();
  const index = currentMenu.findIndex(i => i.id === item.id);

  if (index >= 0) {
    currentMenu[index] = item;
  } else {
    currentMenu.push(item);
  }
  saveLocalMenu(currentMenu);
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  // Optimistic local delete
  const currentMenu = getLocalMenu().filter(i => i.id !== id);
  saveLocalMenu(currentMenu);

  if (!isFirebaseEnabled || !db) return;

  try {
    await db.collection(MENU_COLLECTION).doc(id).delete();
  } catch (error) {
    console.warn("Remote delete failed");
  }
};

// --- Announcement Operations ---

export const subscribeToAnnouncements = (callback: (items: Announcement[]) => void) => {
  if (!isFirebaseEnabled || !db) {
    callback(getLocalAnnouncements());
    const interval = setInterval(() => callback(getLocalAnnouncements()), 1000);
    return () => clearInterval(interval);
  }

  try {
    return db.collection(ANNOUNCEMENTS_COLLECTION).onSnapshot((snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Announcement));
      saveLocalAnnouncements(items);
      callback(items);
    }, () => callback(getLocalAnnouncements()));
  } catch (error) {
    callback(getLocalAnnouncements());
    return () => {};
  }
};

export const saveAnnouncement = async (item: Announcement): Promise<void> => {
  if (isFirebaseEnabled && db) {
    try {
      if (!item.id || item.id.startsWith('ann_')) {
        const { id, ...data } = item;
        const docRef = await db.collection(ANNOUNCEMENTS_COLLECTION).add(data);
        item.id = docRef.id;
      } else {
        const { id, ...data } = item;
        await db.collection(ANNOUNCEMENTS_COLLECTION).doc(item.id).set(data, { merge: true });
      }
    } catch (e) {
      if (!item.id) item.id = `ann_${Date.now()}`;
    }
  } else {
    if (!item.id) item.id = `ann_${Date.now()}`;
  }

  const current = getLocalAnnouncements();
  const index = current.findIndex(i => i.id === item.id);
  
  if (index >= 0) current[index] = item;
  else current.push(item);
  
  saveLocalAnnouncements(current);
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  const current = getLocalAnnouncements().filter(i => i.id !== id);
  saveLocalAnnouncements(current);

  if (!isFirebaseEnabled || !db) return;
  try {
    await db.collection(ANNOUNCEMENTS_COLLECTION).doc(id).delete();
  } catch (e) {
    console.warn("Remote delete announcement failed");
  }
};


// --- Video Operations ---

export const subscribeToVideos = (callback: (items: PreviewVideo[]) => void) => {
  if (!isFirebaseEnabled || !db) {
    callback(getLocalVideos());
    return () => {};
  }
  
  try {
    return db.collection(VIDEO_COLLECTION).orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PreviewVideo));
      saveLocalVideos(items);
      callback(items);
    });
  } catch(e) {
    callback(getLocalVideos());
    return () => {};
  }
};

export const getActivePreviewVideo = async (): Promise<PreviewVideo | null> => {
  if (!isFirebaseEnabled || !db) {
    const local = getLocalVideos().find(v => v.isActive);
    return local || null;
  }
  
  try {
    const snap = await db.collection(VIDEO_COLLECTION).where('isActive', '==', true).limit(1).get();
    if (!snap.empty) {
      return { ...snap.docs[0].data(), id: snap.docs[0].id } as PreviewVideo;
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const savePreviewVideo = async (video: PreviewVideo): Promise<void> => {
  // If setting this video to active, deactivate all others first (Client-side logic for simplicity, ideal for Cloud Functions)
  if (video.isActive) {
     const allVideos = getLocalVideos();
     allVideos.forEach(v => {
       if (v.id !== video.id && v.isActive) {
         // Update local
         v.isActive = false;
         // Update remote
         if (isFirebaseEnabled && db) {
           db.collection(VIDEO_COLLECTION).doc(v.id).update({ isActive: false });
         }
       }
     });
     saveLocalVideos(allVideos);
  }

  if (isFirebaseEnabled && db) {
    try {
      if (!video.id || video.id.startsWith('vid_')) {
        const { id, ...data } = video;
        const docRef = await db.collection(VIDEO_COLLECTION).add(data);
        video.id = docRef.id;
      } else {
        const { id, ...data } = video;
        await db.collection(VIDEO_COLLECTION).doc(video.id).set(data, { merge: true });
      }
    } catch(e) {
       if (!video.id) video.id = `vid_${Date.now()}`;
    }
  } else {
     if (!video.id) video.id = `vid_${Date.now()}`;
  }

  const current = getLocalVideos();
  const index = current.findIndex(v => v.id === video.id);
  if (index >= 0) current[index] = video;
  else current.unshift(video);
  saveLocalVideos(current);
};

export const deletePreviewVideo = async (id: string): Promise<void> => {
  const current = getLocalVideos().filter(v => v.id !== id);
  saveLocalVideos(current);
  
  if (isFirebaseEnabled && db) {
    await db.collection(VIDEO_COLLECTION).doc(id).delete();
  }
};

// --- Order Operations ---

export const createOrder = async (order: Order): Promise<string> => {
  if (isFirebaseEnabled && db) {
    try {
      const { id, ...orderData } = order;
      const docRef = await db.collection(ORDER_COLLECTION).add({
        ...orderData,
        timestamp: Date.now()
      });
      // Return the real ID
      const newOrder = { ...order, id: docRef.id };
      
      // Sync local
      const orders = getLocalOrders();
      orders.unshift(newOrder);
      saveLocalOrders(orders);
      
      return docRef.id;
    } catch (error) {
      console.warn("Remote order creation failed");
    }
  }
  
  // Local fallback
  const newOrder = { ...order, id: `ord_${Date.now()}` };
  const orders = getLocalOrders();
  orders.unshift(newOrder); 
  saveLocalOrders(orders);
  return newOrder.id;
};

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  if (!isFirebaseEnabled || !db) {
    callback(getLocalOrders());
    const intervalId = setInterval(() => {
      callback(getLocalOrders());
    }, 2000);
    return () => clearInterval(intervalId);
  }

  try {
    const q = db.collection(ORDER_COLLECTION).orderBy('timestamp', 'desc');
    return q.onSnapshot((snapshot) => {
      const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      saveLocalOrders(orders);
      callback(orders);
    }, (error) => {
      console.warn("Order subscription failed, switching to local poll");
      callback(getLocalOrders());
    });
  } catch (error) {
    console.warn("Order setup error, using local");
    callback(getLocalOrders());
    return () => {};
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  // Local update
  const orders = getLocalOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    saveLocalOrders(orders);
  }

  if (!isFirebaseEnabled || !db) return;

  try {
    await db.collection(ORDER_COLLECTION).doc(orderId).update({ status });
  } catch (error) {
    console.warn("Remote status update failed, updated locally");
  }
};

// --- Analytics ---

export const getSalesData = async (): Promise<DailySales[]> => {
  let orders: Order[] = [];
  
  if (isFirebaseEnabled && db) {
    try {
        const snapshot = await db.collection(ORDER_COLLECTION).get();
        if (!snapshot.empty) {
            orders = snapshot.docs.map(doc => doc.data() as Order);
            saveLocalOrders(orders); // Sync
        } else {
            // If empty, assume empty
            orders = [];
        }
    } catch (e) {
        orders = getLocalOrders();
    }
  } else {
    orders = getLocalOrders();
  }

  const salesMap = new Map<string, { amount: number; count: number }>();

  orders.forEach(order => {
    if (order.status === 'cancelled') return;
    
    const date = new Date(order.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const current = salesMap.get(date) || { amount: 0, count: 0 };
    salesMap.set(date, {
      amount: current.amount + order.totalAmount,
      count: current.count + 1
    });
  });

  return Array.from(salesMap.entries()).map(([date, data]) => ({
    date,
    amount: data.amount,
    orders: data.count
  })).reverse().slice(0, 7).reverse();
};
