import React from 'react';
import { MenuItem } from '../types';
import { Button } from './ui/Button';
import { APP_CONFIG } from '../constants';
import { Plus, Minus, Ban } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, quantity, onAdd, onRemove }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full animate-fade-in hover:shadow-md transition-shadow">
      <div className="relative h-40 overflow-hidden">
        <img 
          src={item.image} 
          alt={item.name} 
          className={`w-full h-full object-cover transition-transform duration-500 hover:scale-105 ${!item.isAvailable ? 'grayscale' : ''}`}
        />
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Ban size={12} /> SOLD OUT
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded-md shadow-sm">
           {item.type === 'veg' ? (
             <div className="border border-green-600 p-[1px] w-4 h-4 flex items-center justify-center">
               <div className="w-2 h-2 rounded-full bg-green-600"></div>
             </div>
           ) : (
             <div className="border border-red-600 p-[1px] w-4 h-4 flex items-center justify-center">
               <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-red-600"></div>
             </div>
           )}
        </div>
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-semibold text-gray-800 text-lg leading-tight">{item.name}</h3>
        </div>
        <p className="text-gray-500 text-sm line-clamp-2 mb-3 flex-1">{item.description}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="font-bold text-gray-900 text-lg">{APP_CONFIG.currency}{item.price}</span>
          
          {item.isAvailable ? (
            quantity === 0 ? (
              <Button onClick={onAdd} size="sm" variant="outline" className="border-primary text-primary hover:bg-orange-50">
                ADD
              </Button>
            ) : (
              <div className="flex items-center gap-3 bg-orange-50 rounded-lg p-1">
                <button onClick={onRemove} className="w-7 h-7 flex items-center justify-center bg-white rounded-md shadow-sm text-primary hover:bg-gray-50">
                  <Minus size={16} />
                </button>
                <span className="font-semibold text-gray-900 w-4 text-center">{quantity}</span>
                <button onClick={onAdd} className="w-7 h-7 flex items-center justify-center bg-primary rounded-md shadow-sm text-white hover:bg-secondary">
                  <Plus size={16} />
                </button>
              </div>
            )
          ) : (
             <span className="text-gray-400 text-sm font-medium">Unavailable</span>
          )}
        </div>
      </div>
    </div>
  );
};
