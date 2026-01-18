import React, { useState } from 'react';
import { CartItem, CustomerInfo } from '../types';
import { Button } from './ui/Button';
import { APP_CONFIG } from '../constants';
import { X, MessageCircle, MapPin, Phone, User } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  onComplete: (customer: CustomerInfo) => void;
  whatsappNumber?: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, cart, total, onComplete, whatsappNumber }) => {
  const [customer, setCustomer] = useState<CustomerInfo>({ name: '', phone: '', address: '' });
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Partial<CustomerInfo> = {};
    
    // Name Validation (Mandatory per request)
    if (!customer.name.trim()) {
        newErrors.name = "Name is required";
    }

    // Phone Validation (Indian 10-digit format)
    // Starts with 6-9, followed by 9 digits
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!customer.phone) {
       newErrors.phone = "Mobile number is required";
    } else if (!phoneRegex.test(customer.phone)) {
       newErrors.phone = "Enter valid 10-digit Indian number";
    }

    // Address Validation
    if (!customer.address.trim()) {
        newErrors.address = "Delivery address required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onComplete(customer);

    // WhatsApp Construction
    const itemsList = cart.map(i => `▪ ${i.quantity} x ${i.name} (${APP_CONFIG.currency}${i.price})`).join('\n');
    const message = `*New Order @ ${APP_CONFIG.name}* 🥘%0a%0a` +
      `*Customer:* ${customer.name}%0a` +
      `*Phone:* ${customer.phone}%0a` +
      `*Address:* ${customer.address}%0a%0a` +
      `*Order Details:*%0a${itemsList}%0a` +
      `------------------------%0a` +
      `*Total Amount: ${APP_CONFIG.currency}${total}*`;
    
    // Use the dynamic number if provided, otherwise fall back to config
    const targetNumber = whatsappNumber || APP_CONFIG.whatsappNumber;
    const whatsappUrl = `https://wa.me/${targetNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
            <div className="relative">
              <Phone className={`absolute left-3 top-3.5 transition-colors ${errors.phone ? 'text-red-400' : 'text-gray-400'}`} size={18} />
              <input
                type="tel"
                value={customer.phone}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setCustomer({...customer, phone: val});
                }}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-all ${
                   errors.phone 
                     ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400 focus:ring-2 focus:ring-red-300' 
                     : 'border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-primary/50'
                }`}
                placeholder="10-digit number"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
            <div className="relative">
              <MapPin className={`absolute left-3 top-3.5 transition-colors ${errors.address ? 'text-red-400' : 'text-gray-400'}`} size={18} />
              <textarea
                value={customer.address}
                onChange={e => setCustomer({...customer, address: e.target.value})}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-all resize-none ${
                   errors.address
                     ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400 focus:ring-2 focus:ring-red-300'
                     : 'border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-primary/50'
                }`}
                placeholder="House No, Street, Landmark"
                rows={2}
              />
            </div>
             {errors.address && <p className="text-red-500 text-xs mt-1 font-medium">{errors.address}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
             <div className="relative">
              <User className={`absolute left-3 top-3.5 transition-colors ${errors.name ? 'text-red-400' : 'text-gray-400'}`} size={18} />
              <input
                type="text"
                value={customer.name}
                onChange={e => setCustomer({...customer, name: e.target.value})}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border outline-none transition-all ${
                   errors.name
                     ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400 focus:ring-2 focus:ring-red-300'
                     : 'border-gray-200 bg-gray-100 text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-primary/50'
                }`}
                placeholder="Your Name"
              />
            </div>
            {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-xl mb-6">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>Items Total ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
                <span>{APP_CONFIG.currency}{total}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-gray-900 text-lg border-t border-orange-200 pt-2">
                <span>To Pay</span>
                <span>{APP_CONFIG.currency}{total}</span>
            </div>
        </div>

        <Button onClick={handleSubmit} fullWidth size="lg" className="gap-2 shadow-lg shadow-orange-500/30">
          <MessageCircle size={20} />
          Place Order via WhatsApp
        </Button>
      </div>
    </div>
  );
};