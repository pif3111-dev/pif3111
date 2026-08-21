import React, { useState } from 'react';
import { ShoppingCart, X, Minus, Plus, ReceiptText, Send } from 'lucide-react';
import { CartItem, Order } from '../types';

interface CartModalProps {
  isOpen: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQty: (index: number, delta: number) => void;
  onSubmit: (order: Partial<Order>) => Promise<void>;
}

export function CartModal({ isOpen, cart, onClose, onUpdateQty, onSubmit }: CartModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('宅配');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [address, setAddress] = useState('');
  const [bankLast5, setBankLast5] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = deliveryMethod === '宅配' && subtotal > 0 && subtotal < 2000 ? 100 : 0;
  const totalAmount = subtotal + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (bankLast5.length !== 5) {
      alert("請填寫正確的匯款帳號「後五碼」以便對帳！");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        customerName: name,
        phone,
        deliveryMethod,
        deliveryDate,
        address: deliveryMethod === '自取' ? '公司面交自取：新北市三重區光復路一段68巷5號' : address,
        bankLast5,
        note,
        items: cart,
        subtotal,
        shipping,
        totalAmount,
      });
      // reset form
      setName('');
      setPhone('');
      setDeliveryMethod('宅配');
      setDeliveryDate('');
      setAddress('');
      setBankLast5('');
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 w-full max-w-2xl rounded-3xl border border-stone-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-stone-950">
          <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <ShoppingCart size={20} /> 您的訂購明細
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6">
          <div className="space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-sm">購物車目前是空的，快去挑選美味烤肉套餐吧！</div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="bg-stone-950 p-3 rounded-2xl border border-stone-800 flex items-center justify-between gap-3">
                  <div>
                    <h5 className="text-sm font-bold text-white">{item.name}</h5>
                    <p className="text-xs text-amber-400 font-bold">${item.price} 元</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onUpdateQty(idx, -1)} className="w-7 h-7 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg flex items-center justify-center text-xs">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                    <button onClick={() => onUpdateQty(idx, 1)} className="w-7 h-7 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg flex items-center justify-center text-xs">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-amber-950/20 border border-amber-600/40 rounded-2xl p-4 space-y-2">
            <p className="text-amber-400 font-bold text-sm flex items-center gap-2">
              <ReceiptText size={16} /> 匯款轉帳資訊
            </p>
            <div className="text-xs text-stone-300 space-y-1 bg-stone-950 p-3 rounded-xl border border-stone-800">
              <p><span className="text-stone-400">戶名：</span><strong className="text-amber-300">賴怡中</strong></p>
              <p><span className="text-stone-400">銀行分行：</span><strong className="text-amber-300">中國信託二重埔分行</strong></p>
              <p><span className="text-stone-400">銀行帳號：</span><strong className="text-amber-300 text-sm tracking-wider font-mono">123540088692</strong></p>
            </div>
            <p className="text-[11px] text-amber-200/60">💡 轉帳完成後請於下方填寫您的帳號末五碼以便對帳出貨。</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-stone-800">
            <h4 className="text-sm font-bold text-amber-400">收件人 / 聯絡資訊</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-400 mb-1">訂購人姓名 *</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">連絡電話 *</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-stone-400 mb-1">取貨/配送方式 *</label>
                <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                  <option value="宅配">低溫冷凍宅配 (滿$2,000免運，未滿$100運費)</option>
                  <option value="自取">公司面交自取 (免運費｜三重區光復路一段68巷5號)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">匯款帳號後五碼 *</label>
                <input type="text" required maxLength={5} placeholder="例如: 88692" value={bankLast5} onChange={e => setBankLast5(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {deliveryMethod === '宅配' && (
              <div>
                <label className="block text-xs text-stone-400 mb-1">收件地址 *</label>
                <input type="text" required placeholder="請輸入完整宅配地址" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
              </div>
            )}

            <div>
              <label className="block text-xs text-stone-400 mb-1">
                取貨/到貨日期 * <span className="text-amber-400 ml-1">(宅配恕無法指定日期、時段到貨，統一於9/14那週出貨)</span>
              </label>
              <input type="date" required value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>

            <div>
              <label className="block text-xs text-stone-400 mb-1">備註事項</label>
              <textarea rows={2} value={note} onChange={e => setNote(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"></textarea>
            </div>

            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-1 text-sm">
              <div className="flex justify-between text-stone-400">
                <span>商品小計：</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between text-stone-400">
                <span>運費：</span>
                <span>${shipping}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-amber-400 pt-2 border-t border-stone-800">
                <span>總計金額：</span>
                <span>${totalAmount}</span>
              </div>
            </div>

            <button disabled={isSubmitting} type="submit" className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
              <Send size={18} /> {isSubmitting ? '正在送出訂單...' : '確認送出訂單'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
