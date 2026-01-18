
import { db, auth, isFirebaseEnabled } from './firebase';
import { MenuItem, Order, DailySales, AppSettings, Announcement, PreviewVideo, AdminUser } from '../types';
import { INITIAL_MENU, APP_CONFIG, DEMO_ADMIN_CREDENTIALS } from '../constants';

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
const LS_AUTH_TOKEN_KEY = 'amma_auth_session';

// --- Auth Operations ---

export const loginAdmin = async (email: string, password: string): Promise<void> => {
  if (isFirebaseEnabled && auth) {
    await auth.signInWithEmailAndPassword(email, password);
    return;
  }

  // Local Fallback Login Logic
  if (email === DEMO_ADMIN_CREDENTIALS.email && password === DEMO_ADMIN_CREDENTIALS.password) {
    const fakeToken = {
      email,
      uid: 'demo_user_123',
      expires: Date.now() + (1000 * 60 * 60 * 24), // 24h
      isAnonymous: false
    };
    sessionStorage.setItem(LS_AUTH_TOKEN_KEY, JSON.stringify(fakeToken));
    return;
  }
  
  throw new Error("Invalid credentials");
};

export const logoutAdmin = async (): Promise<void> => {
  if (isFirebaseEnabled && auth) {
    await auth.signOut();
  }
  sessionStorage.removeItem(LS_AUTH_TOKEN_KEY);
};

export const subscribeToAuth = (callback: (user: AdminUser | null) => void) => {
  if (isFirebaseEnabled && auth) {
    return auth.onAuthStateChanged((user) => {
      if (user) {
        callback({
          email: user.email || '',
          uid: user.uid,
          isAnonymous: user.isAnonymous
        });
      } else {
        callback(null);
      }
    });
  }

  // Local fallback subscription
  const checkLocal = () => {
    const stored = sessionStorage.getItem(LS_AUTH_TOKEN_KEY);
    if (stored) {
      const token = JSON.parse(stored);
      if (token.expires > Date.now()) {
        callback(token);
        return;
      }
      sessionStorage.removeItem(LS_AUTH_TOKEN_KEY);
    }
    callback(null);
  };

  checkLocal();
  const interval = setInterval(checkLocal, 2000);
  return () => clearInterval(interval);
};

// --- Local Storage Helpers ---

const persistToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e: any) {
    console.warn(`Failed to save to ${key}:`, e);
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
      alert("Local Storage Full! \n\nPlease use the 'Reset Demo Data' button to free up space.");
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
  const defaultSettings = { 
    whatsappNumber: APP_CONFIG.whatsappNumber,
    categories: [...APP_CONFIG.defaultCategories]
  };
  if (!stored) return defaultSettings;
  const parsed = JSON.parse(stored);
  return { ...defaultSettings, ...parsed };
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
  const local = getLocalSettings();
  if (!isFirebaseEnabled || !db) return local;
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const snap = await docRef.get();
    if (snap.exists) {
        const data = snap.data() as AppSettings;
        return { ...local, ...data };
    }
    return local;
  } catch (error) {
    return local;
  }
};

export const saveSettings = async (settings: AppSettings): Promise<void> => {
  saveLocalSettings(settings);
  if (!isFirebaseEnabled || !db) return;
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    await docRef.set(settings, { merge: true });
  } catch (error) {
    console.warn("Remote settings save failed");
  }
};

export const subscribeToSettings = (callback: (settings: AppSettings) => void) => {
  const local = getLocalSettings();
  if (!isFirebaseEnabled || !db) {
    callback(local);
    return () => {};
  }
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    return docRef.onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data() as AppSettings;
        const merged = { ...local, ...data };
        callback(merged);
        saveLocalSettings(merged);
      } else {
        callback(local);
      }
    });
  } catch (error) {
    callback(local);
    return () => {};
  }
};

// --- Menu Operations ---

export const getMenu = async (): Promise<MenuItem[]> => {
  if (!isFirebaseEnabled || !db) return getLocalMenu();
  try {
    const querySnapshot = await db.collection(MENU_COLLECTION).get();
    if (querySnapshot.empty) return getLocalMenu();
    const items = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
    saveLocalMenu(items);
    return items;
  } catch (error) {
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
      saveLocalMenu(menu);
      callback(menu);
    });
  } catch (error) {
    callback(getLocalMenu());
    return () => {};
  }
};

export const saveMenuItem = async (item: MenuItem): Promise<void> => {
  if (isFirebaseEnabled && db) {
    try {
      if (!item.id || item.id.startsWith('local_')) {
        const { id, ...data } = item;
        const docRef = await db.collection(MENU_COLLECTION).add(data);
        item.id = docRef.id;
      } else {
        const { id, ...data } = item;
        await db.collection(MENU_COLLECTION).doc(item.id).set(data, { merge: true });
      }
    } catch (error) {
      if (!item.id) item.id = `local_${Date.now()}`;
    }
  } else if (!item.id) {
    item.id = `local_${Date.now()}`;
  }
  const currentMenu = getLocalMenu();
  const index = currentMenu.findIndex(i => i.id === item.id);
  if (index >= 0) currentMenu[index] = item;
  else currentMenu.push(item);
  saveLocalMenu(currentMenu);
};

export const deleteMenuItem = async (id: string): Promise<void> => {
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
    });
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
  } else if (!item.id) {
    item.id = `ann_${Date.now()}`;
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
  } catch (e) {}
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
    return getLocalVideos().find(v => v.isActive) || null;
  }
  try {
    const snap = await db.collection(VIDEO_COLLECTION).where('isActive', '==', true).limit(1).get();
    if (!snap.empty) return { ...snap.docs[0].data(), id: snap.docs[0].id } as PreviewVideo;
    return null;
  } catch (e) {
    return null;
  }
};

export const savePreviewVideo = async (video: PreviewVideo): Promise<void> => {
  if (video.isActive) {
     const allVideos = getLocalVideos();
     allVideos.forEach(v => {
       if (v.id !== video.id && v.isActive) {
         v.isActive = false;
         if (isFirebaseEnabled && db) db.collection(VIDEO_COLLECTION).doc(v.id).update({ isActive: false });
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
  } else if (!video.id) {
    video.id = `vid_${Date.now()}`;
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
  if (isFirebaseEnabled && db) await db.collection(VIDEO_COLLECTION).doc(id).delete();
};

// --- Order Operations ---

export const createOrder = async (order: Order): Promise<string> => {
  if (isFirebaseEnabled && db) {
    try {
      const { id, ...orderData } = order;
      const docRef = await db.collection(ORDER_COLLECTION).add({ ...orderData, timestamp: Date.now() });
      const newOrder = { ...order, id: docRef.id };
      const orders = getLocalOrders();
      orders.unshift(newOrder);
      saveLocalOrders(orders);
      return docRef.id;
    } catch (error) {}
  }
  const newOrder = { ...order, id: `ord_${Date.now()}` };
  const orders = getLocalOrders();
  orders.unshift(newOrder); 
  saveLocalOrders(orders);
  return newOrder.id;
};

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  if (!isFirebaseEnabled || !db) {
    callback(getLocalOrders());
    const intervalId = setInterval(() => callback(getLocalOrders()), 2000);
    return () => clearInterval(intervalId);
  }
  try {
    const q = db.collection(ORDER_COLLECTION).orderBy('timestamp', 'desc');
    return q.onSnapshot((snapshot) => {
      const orders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
      saveLocalOrders(orders);
      callback(orders);
    });
  } catch (error) {
    callback(getLocalOrders());
    return () => {};
  }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  const orders = getLocalOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    saveLocalOrders(orders);
  }
  if (!isFirebaseEnabled || !db) return;
  try {
    await db.collection(ORDER_COLLECTION).doc(orderId).update({ status });
  } catch (error) {}
};

// --- Analytics ---

export const getSalesData = async (): Promise<DailySales[]> => {
  let orders: Order[] = [];
  if (isFirebaseEnabled && db) {
    try {
        const snapshot = await db.collection(ORDER_COLLECTION).get();
        if (!snapshot.empty) {
            orders = snapshot.docs.map(doc => doc.data() as Order);
            saveLocalOrders(orders);
        } else orders = [];
    } catch (e) {
        orders = getLocalOrders();
    }
  } else orders = getLocalOrders();

  const salesMap = new Map<string, { amount: number; count: number }>();
  orders.forEach(order => {
    if (order.status === 'cancelled') return;
    const date = new Date(order.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const current = salesMap.get(date) || { amount: 0, count: 0 };
    salesMap.set(date, { amount: current.amount + order.totalAmount, count: current.count + 1 });
  });

  return Array.from(salesMap.entries()).map(([date, data]) => ({
    date,
    amount: data.amount,
    orders: data.count
  })).reverse().slice(0, 7).reverse();
};
