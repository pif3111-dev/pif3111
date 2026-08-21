import React, { useState } from 'react';
import { Flame, ShoppingCart, Lock, Truck, Store, Utensils, Star, Plus, Crown, Info } from 'lucide-react';
import { CartItem, Order } from './types';
import { CartModal } from './components/CartModal';
import { AdminModal } from './components/AdminModal';
import { MessageModal } from './components/MessageModal';

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  const [msgModal, setMsgModal] = useState<{
    isOpen: boolean;
    title: string;
    body: string;
    type: 'success' | 'warning' | 'error';
  }>({
    isOpen: false,
    title: '',
    body: '',
    type: 'success'
  });

  const cartTotalCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const showMsg = (title: string, body: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setMsgModal({ isOpen: true, title, body, type });
  };

  const addToCart = (type: 'set' | 'addon', name: string, price: number) => {
    if (type === 'addon') {
      const hasSetItem = cart.some(item => item.type === 'set');
      if (!hasSetItem) {
        showMsg("提示", "加購部分要購買套餐才能購買喔！請先挑選喜歡的套餐。", "warning");
        return;
      }
    }

    setCart(prev => {
      const existing = prev.find(item => item.name === name);
      if (existing) {
        return prev.map(item => item.name === name ? { ...item, qty: item.qty + 1 } : item);
      } else {
        return [...prev, { type, name, price, qty: 1 }];
      }
    });
    showMsg("加入成功", `已將「${name}」加入購物車！`, "success");
  };

  const handleUpdateQty = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index] = { ...newCart[index], qty: newCart[index].qty + delta };
    
    if (newCart[index].qty <= 0) {
      newCart.splice(index, 1);
    }
    
    const hasSetItem = newCart.some(item => item.type === 'set');
    const hasAddon = newCart.some(item => item.type === 'addon');
    
    if (!hasSetItem && hasAddon) {
      setCart(newCart.filter(item => item.type === 'set'));
      showMsg("提示", "由於購物車內已無套餐，加購商品已一併自動移除。", "warning");
    } else {
      setCart(newCart);
    }
  };

  const handleOpenCart = () => {
    if (cart.length === 0) {
      showMsg("提示", "您的購物車內還沒有商品，請先選擇套餐或加購品！", "warning");
      return;
    }
    setIsCartOpen(true);
  };

  const handleSubmitOrder = async (order: Partial<Order>) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (!res.ok) throw new Error('Failed to submit order');
      
      const saved = await res.json();
      
      showMsg(
        "訂單成立",
        `感謝您的預購！您的訂單已成功送出。\n總金額 $${saved.totalAmount} 元，請記得完成匯款（中國信託二重埔 123540088692），我們將盡速為您處理！`,
        "success"
      );
      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      console.error("Order submit error:", err);
      showMsg("錯誤", "送出訂單發生錯誤，請稍後再試或直接聯繫客服。", "error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans text-stone-100 selection:bg-amber-500/30">
      <header className="hero-banner border-b border-amber-900/40 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-600 text-white p-2 rounded-xl text-xl shadow-lg">
              <Flame size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-amber-400 tracking-wider">中秋特選烤肉饗宴</h1>
              <p className="text-xs text-amber-200/70">嚴選肉品 · 極致美味 · 預購熱烈開跑</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button onClick={handleOpenCart} className="relative bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2">
              <ShoppingCart size={18} />
              <span>檢視購物車</span>
              {cartTotalCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold border-2 border-stone-900">
                  {cartTotalCount}
                </span>
              )}
            </button>
            <button onClick={() => setIsAdminOpen(true)} className="bg-stone-800 hover:bg-stone-700 text-stone-300 px-3 py-2.5 rounded-xl text-sm border border-stone-700 transition-all flex items-center gap-1.5">
              <Lock size={14} /> 廠商後台
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full space-y-12">
        <section className="relative rounded-3xl overflow-hidden card-gold-border p-6 sm:p-10 text-center bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-4">
            <div className="inline-block bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">
              🌕 中秋團圓 烤肉首選 🌕
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 leading-tight">
              中秋特選烤肉套餐 & 豪華加購
            </h2>
            <p className="text-stone-300 text-sm sm:text-base leading-relaxed">
              嚴選頂級肉品、極致饗宴。即日起至 <span className="text-amber-400 font-bold">2026年8月31日止</span> 限時預購，限量供應、售完為止！
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm pt-2">
              <div className="bg-stone-800/80 border border-stone-700 px-4 py-2 rounded-xl flex items-center gap-2">
                <Truck className="text-amber-400" size={16} /> 低溫冷凍宅配（滿 $2,000 即享免運）
              </div>
              <div className="bg-stone-800/80 border border-stone-700 px-4 py-2 rounded-xl flex items-center gap-2">
                <Store className="text-amber-400" size={16} /> 公司面交自取（免運費、最方便）
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-black text-amber-400 flex items-center justify-center gap-2">
              <Utensils size={24} /> 特選烤肉套餐系列
            </h3>
            <p className="text-stone-400 text-sm mt-1">挑選您喜愛的套餐組合，滿足所有肉食主義者的味蕾</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 套餐 A */}
            <div className="bg-stone-900 rounded-3xl p-6 card-gold-border flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black text-xl flex items-center justify-center shadow-lg">A</span>
                    <div>
                      <h4 className="text-xl font-bold text-amber-300">經典雙響豬牛餐</h4>
                      <p className="text-xs text-stone-400">主打基本款、高 CP 值，入門首選小資餐</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-400">$666</span>
                </div>
                <ul className="space-y-2.5 text-sm text-stone-300 border-t border-b border-stone-800 py-4 my-3">
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 美國板腱烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 美國牛五花烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 國產黑金豬梅花烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 西班牙豬五花烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 三節翅(雞肉) 6 隻</li>
                </ul>
              </div>
              <button onClick={() => addToCart('set', 'A 經典雙響豬牛餐', 666)} className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                <Plus size={18} /> 加入購物車
              </button>
            </div>

            {/* 套餐 B */}
            <div className="bg-stone-900 rounded-3xl p-6 card-gold-border flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black text-xl flex items-center justify-center shadow-lg">B</span>
                    <div>
                      <h4 className="text-xl font-bold text-amber-300">極致肉食豪華餐</h4>
                      <p className="text-xs text-stone-400">全牛陣容加上精緻肉品，嗜肉族最愛</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-400">$988</span>
                </div>
                <ul className="space-y-2.5 text-sm text-stone-300 border-t border-b border-stone-800 py-4 my-3">
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 美國板腱烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 美國牛五花烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 澳洲骰子牛(肋條) 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 美國帶骨牛小排 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 西班牙豬五花烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 三節翅(雞肉) 6 隻</li>
                </ul>
              </div>
              <button onClick={() => addToCart('set', 'B 極致肉食豪華餐', 988)} className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                <Plus size={18} /> 加入購物車
              </button>
            </div>

            {/* 套餐 C */}
            <div className="bg-stone-900 rounded-3xl p-6 card-gold-border flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black text-xl flex items-center justify-center shadow-lg">C</span>
                    <div>
                      <h4 className="text-xl font-bold text-amber-300">豪氣羊牛大賞餐</h4>
                      <p className="text-xs text-stone-400">豪氣羊肩排配澳洲牛小排，饕客聚會首選</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-400">$1,388</span>
                </div>
                <ul className="space-y-2.5 text-sm text-stone-300 border-t border-b border-stone-800 py-4 my-3">
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 紐西蘭羊肩排 1 包</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 澳洲牛小排烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 黑金豬梅花烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 澳洲骰子牛(肋條) 300g</li>
                </ul>
              </div>
              <button onClick={() => addToCart('set', 'C 豪氣羊牛大賞餐', 1388)} className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                <Plus size={18} /> 加入購物車
              </button>
            </div>

            {/* 套餐 D */}
            <div className="bg-stone-900 rounded-3xl p-6 card-gold-border flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 font-black text-xl flex items-center justify-center shadow-lg">D</span>
                    <div>
                      <h4 className="text-xl font-bold text-amber-300">經典超值餐</h4>
                      <p className="text-xs text-stone-400">方便燒烤的羊腩條搭配經典雙拼，超值首選</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-400">$555</span>
                </div>
                <ul className="space-y-2.5 text-sm text-stone-300 border-t border-b border-stone-800 py-4 my-3">
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 紐西蘭羊腩條 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 西班牙豬五花烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 國產黑金豬梅花烤肉片 300g</li>
                  <li className="flex items-center gap-2"><Star className="text-amber-500" size={12} /> 三節翅(雞肉) 6 隻</li>
                </ul>
              </div>
              <button onClick={() => addToCart('set', 'D 經典超值餐', 555)} className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                <Plus size={18} /> 加入購物車
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="text-center bg-gradient-to-r from-amber-900/40 via-amber-800/20 to-amber-900/40 py-6 rounded-3xl border border-amber-500/30">
            <h3 className="text-2xl font-black text-amber-400 flex items-center justify-center gap-2">
              <Crown className="text-amber-500" size={24} /> 中秋限定：強勢雙強加價購
            </h3>
            <p className="text-stone-300 text-sm mt-1">凡購買上述任一套餐，即可用超殺價加購頂級食材！</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 加購 A */}
            <div className="bg-stone-900 rounded-3xl p-6 border border-stone-800 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">加購 A</span>
                    <div>
                      <h4 className="text-lg font-bold text-amber-300">極上日本和牛板腱烤肉片</h4>
                      <p className="text-xs text-stone-400">300g 重磅組！市價破千、鮮嫩多汁、入口即化！</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-400">$799</span>
                </div>
              </div>
              <button onClick={() => addToCart('addon', '加購A：極上日本和牛板腱烤肉片 (300g)', 799)} className="w-full mt-4 bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold py-3 rounded-xl border border-amber-500/40 transition-all flex items-center justify-center gap-2">
                <Plus size={18} /> 加購此品項
              </button>
            </div>

            {/* 加購 B */}
            <div className="bg-stone-900 rounded-3xl p-6 border border-stone-800 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 rounded-xl bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase tracking-wider">加購 B</span>
                    <div>
                      <h4 className="text-lg font-bold text-amber-300">極致霸氣 大戰斧豬排 (1支/限量)</h4>
                      <p className="text-xs text-stone-400">帶骨大分量、厚實美味，烤網上的絕對吸睛焦點！</p>
                    </div>
                  </div>
                  <span className="text-2xl font-black text-amber-400">$199</span>
                </div>
              </div>
              <button onClick={() => addToCart('addon', '加購B：極致霸氣大戰斧豬排 (1支)', 199)} className="w-full mt-4 bg-stone-800 hover:bg-stone-700 text-amber-400 font-bold py-3 rounded-xl border border-amber-500/40 transition-all flex items-center justify-center gap-2">
                <Plus size={18} /> 加購此品項
              </button>
            </div>
          </div>
        </section>

        <section className="bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-800 space-y-4">
          <h4 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Info size={20} /> 重要配送與預購說明
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-stone-300">
            <div className="space-y-2 bg-stone-950 p-4 rounded-2xl border border-stone-800">
              <p className="font-bold text-amber-300 flex items-center gap-2"><Truck size={16} /> 低溫冷凍宅配</p>
              <p>• 滿 <span className="text-amber-400 font-bold">$2,000</span> 即享免運！</p>
              <p>• 未滿 $2,000 酌收冷凍運費 $100。</p>
            </div>
            <div className="space-y-2 bg-stone-950 p-4 rounded-2xl border border-stone-800">
              <p className="font-bold text-amber-300 flex items-center gap-2"><Store size={16} /> 公司面交自取（免運費、最方便）</p>
              <p>• 電話：(02)8512-3111</p>
              <p>• 地址：新北市三重區光復路一段68巷5號</p>
            </div>
          </div>
        </section>

      </main>

      <footer className="bg-stone-950 border-t border-stone-800 py-6 text-center text-xs text-stone-500 space-y-1 mt-auto">
        <p className="text-amber-400/80 font-bold">中秋團圓，美為相伴，讓烤肉更精彩！</p>
        <p>圖片僅供參考，商品以實際出貨為準。© 2026 中秋特選烤肉訂購系統</p>
      </footer>

      <CartModal 
        isOpen={isCartOpen}
        cart={cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQty={handleUpdateQty}
        onSubmit={handleSubmitOrder}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <MessageModal
        {...msgModal}
        onClose={() => setMsgModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

