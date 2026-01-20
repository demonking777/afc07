
import { db, auth, isFirebaseEnabled } from './firebase';
import { MenuItem, Order, DailySales, AppSettings, Announcement, PreviewVideo, AdminUser } from '../types';
import { INITIAL_MENU, APP_CONFIG, DEMO_ADMIN_CREDENTIALS } from '../constants';

const MENU_COLLECTION = 'menu_items';
const ORDER_COLLECTION = 'orders';
const SETTINGS_COLLECTION = 'settings';
const ANNOUNCEMENTS_COLLECTION = 'announcements';
const VIDEO_COLLECTION = 'preview_videos';
const SETTINGS_DOC_ID = 'config';

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
  if (email === DEMO_ADMIN_CREDENTIALS.email && password === DEMO_ADMIN_CREDENTIALS.password) {
    const fakeToken = {
      email,
      uid: 'demo_user_123',
      expires: Date.now() + (1000 * 60 * 60 * 24),
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
  }
};

export const clearLocalData = () => {
  localStorage.clear();
  window.location.reload();
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
  const defaultSettings: AppSettings = { 
    whatsappNumber: APP_CONFIG.whatsappNumber,
    categories: [...APP_CONFIG.defaultCategories],
    googleSheets: {
      spreadsheetId: '',
      sheetName: 'Orders',
      syncEnabled: false,
      lastSyncAt: 0,
      isConnected: false
    }
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

// --- Google Sheets Sync Engine ---

const syncOrderToSheets = async (order: Order) => {
  const settings = getLocalSettings();
  if (!settings.googleSheets?.syncEnabled || !settings.googleSheets?.accessToken || !settings.googleSheets?.spreadsheetId) return;

  // Handle Demo/Simulation Mode
  if (settings.googleSheets.accessToken === 'demo_token_simulated') {
    console.log(`[Demo Sync] Order ${order.id} would be synced to Sheet ${settings.googleSheets.spreadsheetId}`);
    return;
  }

  try {
    const range = `${settings.googleSheets.sheetName}!A:L`;
    const values = [[
      order.id,
      order.customer.phone, // using phone as customer id for demo
      order.customer.name,
      order.customer.phone,
      order.customer.email || 'N/A',
      order.items.map(i => i.name).join(', '),
      order.items.reduce((acc, i) => acc + i.quantity, 0),
      order.totalAmount,
      'N/A', // payment status
      order.status,
      new Date(order.timestamp).toISOString(),
      order.platform
    ]];

    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${settings.googleSheets.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.googleSheets.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });

    if (response.ok) {
      console.log("Successfully synced order to Google Sheets");
      const updatedSettings = {
        ...settings,
        googleSheets: { ...settings.googleSheets, lastSyncAt: Date.now() }
      };
      saveSettings(updatedSettings);
    } else {
      console.error("Failed to sync to Google Sheets:", await response.json());
    }
  } catch (error) {
    console.error("Google Sheets sync error:", error);
  }
};

// --- Settings Operations ---

export const getSettings = async (): Promise<AppSettings> => {
  const local = getLocalSettings();
  if (!isFirebaseEnabled || !db) return local;
  try {
    const docRef = db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC_ID);
    const snap = await docRef.get();
    if (snap.exists) {
        return { ...local, ...(snap.data() as AppSettings) };
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
        const merged = { ...local, ...(doc.data() as AppSettings) };
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

// --- Order Operations ---

export const createOrder = async (order: Order): Promise<string> => {
  let orderId = '';
  if (isFirebaseEnabled && db) {
    try {
      const { id, ...orderData } = order;
      const docRef = await db.collection(ORDER_COLLECTION).add({ ...orderData, timestamp: Date.now() });
      orderId = docRef.id;
    } catch (error) {}
  }
  
  if (!orderId) {
    orderId = `ord_${Date.now()}`;
  }

  const newOrder = { ...order, id: orderId };
  const orders = getLocalOrders();
  orders.unshift(newOrder); 
  saveLocalOrders(orders);

  // Real-time Sync Trigger
  syncOrderToSheets(newOrder);
  
  return orderId;
};

export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  const orders = getLocalOrders();
  const order = orders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    saveLocalOrders(orders);
    syncOrderToSheets(order); 
  }
  if (!isFirebaseEnabled || !db) return;
  try {
    await db.collection(ORDER_COLLECTION).doc(orderId).update({ status });
  } catch (error) {}
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

// --- Menu, Announcements, Videos (Existing logic preserved) ---

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
  if (isFirebaseEnabled && db) await db.collection(MENU_COLLECTION).doc(id).delete();
};

export const getMenu = async (): Promise<MenuItem[]> => {
  if (!isFirebaseEnabled || !db) return getLocalMenu();
  try {
    const querySnapshot = await db.collection(MENU_COLLECTION).get();
    if (querySnapshot.empty) return getLocalMenu();
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
  } catch (error) {
    return getLocalMenu();
  }
};

export const seedInitialMenu = async () => {
  saveLocalMenu(INITIAL_MENU);
  if (isFirebaseEnabled && db) {
    const batchPromises = INITIAL_MENU.map(item => {
      const { id, ...data } = item;
      return db!.collection(MENU_COLLECTION).doc(id).set(data);
    });
    await Promise.all(batchPromises);
  }
};

export const subscribeToAnnouncements = (callback: (items: Announcement[]) => void) => {
  if (!isFirebaseEnabled || !db) {
    callback(getLocalAnnouncements());
    const interval = setInterval(() => callback(getLocalAnnouncements()), 1000);
    return () => clearInterval(interval);
  }
  return db.collection(ANNOUNCEMENTS_COLLECTION).onSnapshot((snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Announcement)));
  });
};

export const saveAnnouncement = async (item: Announcement): Promise<void> => {
  if (isFirebaseEnabled && db) {
    if (!item.id || item.id.startsWith('ann_')) {
      const { id, ...data } = item;
      const docRef = await db.collection(ANNOUNCEMENTS_COLLECTION).add(data);
      item.id = docRef.id;
    } else {
      const { id, ...data } = item;
      await db.collection(ANNOUNCEMENTS_COLLECTION).doc(item.id).set(data, { merge: true });
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
  saveLocalAnnouncements(getLocalAnnouncements().filter(i => i.id !== id));
  if (isFirebaseEnabled && db) await db.collection(ANNOUNCEMENTS_COLLECTION).doc(id).delete();
};

export const subscribeToVideos = (callback: (items: PreviewVideo[]) => void) => {
  if (!isFirebaseEnabled || !db) {
    callback(getLocalVideos());
    return () => {};
  }
  return db.collection(VIDEO_COLLECTION).orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PreviewVideo)));
  });
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
    if (!video.id || video.id.startsWith('vid_')) {
      const { id, ...data } = video;
      const docRef = await db.collection(VIDEO_COLLECTION).add(data);
      video.id = docRef.id;
    } else {
      const { id, ...data } = video;
      await db.collection(VIDEO_COLLECTION).doc(video.id).set(data, { merge: true });
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
  saveLocalVideos(getLocalVideos().filter(v => v.id !== id));
  if (isFirebaseEnabled && db) await db.collection(VIDEO_COLLECTION).doc(id).delete();
};

export const getActivePreviewVideo = async (): Promise<PreviewVideo | null> => {
  if (!isFirebaseEnabled || !db) return getLocalVideos().find(v => v.isActive) || null;
  const snap = await db.collection(VIDEO_COLLECTION).where('isActive', '==', true).limit(1).get();
  if (!snap.empty) return { ...snap.docs[0].data(), id: snap.docs[0].id } as PreviewVideo;
  return null;
};

export const getSalesData = async (): Promise<DailySales[]> => {
  const orders = getLocalOrders();
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
