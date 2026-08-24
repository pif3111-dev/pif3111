import React, { useEffect, useState } from 'react';
import { Lock, RefreshCw, X, Download, Trash2, DollarSign, ClipboardList, Activity, Edit, Plus, LogOut } from 'lucide-react';
import { Order, CartItem } from '../types';
import { signInWithGoogle, auth, db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const PRODUCT_OPTIONS = [
  { type: 'set', name: 'A 經典雙響豬牛餐', price: 666 },
  { type: 'set', name: 'B 極致肉食豪華餐', price: 988 },
  { type: 'set', name: 'C 豪氣羊牛大賞餐', price: 1388 },
  { type: 'set', name: 'D 經典超值餐', price: 555 },
  { type: 'addon', name: '加購A：極上日本和牛板腱烤肉片 (300g)', price: 799 },
  { type: 'addon', name: '加購B：極致霸氣大戰斧豬排 (1支)', price: 199 },
] as const;

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formReferrer, setFormReferrer] = useState('');
  const [formDeliveryDate, setFormDeliveryDate] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formBankLast5, setFormBankLast5] = useState('');
  const [formNote, setFormNote] = useState('');
  
  const [formItems, setFormItems] = useState<CartItem[]>([]);
  const [formDiscount, setFormDiscount] = useState<string>('100');

  const recalculateAmount = (items: CartItem[], discountStr: string) => {
    const sub = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const d = parseFloat(discountStr);
    const discount = isNaN(d) ? 100 : d;
    return Math.round(sub * (discount / 100));
  };

  const handleAddItem = () => {
    const newItems = [...formItems, { type: 'set', name: PRODUCT_OPTIONS[0].name, price: PRODUCT_OPTIONS[0].price, qty: 1 } as CartItem];
    setFormItems(newItems);
    setFormAmount(recalculateAmount(newItems, formDiscount).toString());
  };

  const handleUpdateItem = (index: number, field: keyof CartItem, value: any) => {
    const newItems = [...formItems];
    if (field === 'name') {
      const product = PRODUCT_OPTIONS.find(p => p.name === value);
      if (product) {
         newItems[index] = { ...newItems[index], name: product.name, price: product.price, type: product.type };
      } else {
         newItems[index] = { ...newItems[index], name: value };
      }
    } else if (field === 'qty') {
      newItems[index] = { ...newItems[index], qty: parseInt(value) || 1 };
    } else if (field === 'price') {
      newItems[index] = { ...newItems[index], price: parseInt(value) || 0 };
    }
    setFormItems(newItems);
    setFormAmount(recalculateAmount(newItems, formDiscount).toString());
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formItems.filter((_, i) => i !== index);
    setFormItems(newItems);
    setFormAmount(recalculateAmount(newItems, formDiscount).toString());
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormDiscount(e.target.value);
    setFormAmount(recalculateAmount(formItems, e.target.value).toString());
  };

  const openForm = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setFormName(order.customerName);
      setFormPhone(order.phone);
      setFormAddress(order.address);
      setFormReferrer(order.referrer || '');
      setFormDeliveryDate(order.deliveryDate || '');
      setFormAmount(order.totalAmount.toString());
      setFormBankLast5(order.bankLast5);
      setFormNote(order.note || '');
      setFormItems(order.items || []);
      setFormDiscount('100');
    } else {
      setEditingOrder(null);
      setFormName('');
      setFormPhone('');
      setFormAddress('');
      setFormReferrer('');
      setFormDeliveryDate('');
      setFormAmount('0');
      setFormBankLast5('');
      setFormNote('');
      setFormItems([]);
      setFormDiscount('100');
    }
    setIsFormOpen(true);
  };

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        customerName: formName,
        phone: formPhone,
        address: formAddress,
        referrer: formReferrer,
        deliveryDate: formDeliveryDate,
        totalAmount: parseInt(formAmount) || 0,
        bankLast5: formBankLast5,
        note: formNote,
        deliveryMethod: editingOrder ? editingOrder.deliveryMethod : '人工新增',
        items: formItems,
        subtotal: formItems.reduce((sum, i) => sum + i.price * i.qty, 0),
        shipping: editingOrder ? editingOrder.shipping : 0,
        status: editingOrder ? editingOrder.status : '未對帳'
      };

      if (editingOrder) {
        // Update
        const docRef = doc(db, 'orders', editingOrder.id);
        await updateDoc(docRef, payload);
      } else {
        // Create
        payload.createdAt = new Date().toISOString();
        const docRef = doc(collection(db, 'orders'));
        payload.id = docRef.id;
        await setDoc(docRef, payload);
      }
      await fetchOrders();
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      alert('儲存失敗，請確認您是否有管理員權限');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'orders'));
      const data: Order[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Order);
      });
      data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(data);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchOrders();
    }
    if (!isOpen) {
      // Reset state when closed
      setIsFormOpen(false);
    }
  }, [isOpen, isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithGoogle();
    } catch (err) {
      alert('登入失敗，請重試！');
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const docRef = doc(db, 'orders', id);
      await updateDoc(docRef, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('更新狀態失敗，請確認您是否有管理員權限');
    }
  };

  const deleteOrder = async (id: string) => {
    if (!window.confirm('確定要刪除這筆訂單嗎？此操作無法還原。')) {
      return;
    }
    
    try {
      const docRef = doc(db, 'orders', id);
      await deleteDoc(docRef);
      setOrders(prev => prev.filter(o => o.id !== id));
    } catch (err) {
      alert('刪除訂單失敗，請確認您是否有管理員權限');
    }
  };

  const handleExportExcel = () => {
    if (orders.length === 0) {
      alert('目前沒有訂單資料可供匯出');
      return;
    }

    const headers = ['訂單編號', '訂購時間', '推薦人', '客戶姓名', '聯絡電話', '配送地址/方式', '取貨/寄出日期', '訂購品項', '備註', '總金額', '匯款末五碼', '訂單狀態'];
    const rows = orders.map(r => [
      r.id,
      new Date(r.createdAt).toLocaleString(),
      r.referrer || '無',
      r.customerName,
      r.phone,
      r.address || '面交自取',
      r.deliveryDate || '未指定',
      r.items.map(i => `${i.name} x ${i.qty}`).join(' ; '),
      r.note || '無',
      r.totalAmount,
      r.bankLast5,
      r.status
    ]);
    
    // Convert to CSV string escaping quotes correctly
    const csvContent = [headers, ...rows].map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(',')).join('\n');
    
    // Add UTF-8 BOM for Excel to properly read Chinese characters
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `烤肉訂單資料_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 w-full max-w-4xl rounded-3xl border border-stone-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-stone-800 flex justify-between items-center bg-stone-950">
          <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Lock size={20} /> 廠商後台：訂單管理與對帳系統
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-2">
            <X size={24} />
          </button>
        </div>
        
        {!isAuthenticated ? (
          <div className="p-10 flex flex-col items-center justify-center space-y-6">
            <div className="bg-stone-800 p-4 rounded-full text-amber-400 mb-2">
              <Lock size={48} />
            </div>
            <h4 className="text-xl font-bold text-white">需要管理員權限</h4>
            <p className="text-stone-400 text-sm text-center">請使用管理員 Google 帳號登入以存取後台管理系統</p>
            <form onSubmit={handleLogin} className="flex flex-col w-full max-w-xs space-y-4">
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-3 rounded-xl transition-all shadow-md w-full"
              >
                使用 Google 登入
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-6">
            
            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col justify-between shadow-inner">
                <div className="flex justify-between items-start">
                  <div className="text-stone-400 text-xs mb-2">總訂單數</div>
                  <ClipboardList size={16} className="text-amber-500" />
                </div>
                <div className="text-3xl font-black text-white">{orders.length} <span className="text-xs font-normal text-stone-500">筆</span></div>
              </div>
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col justify-between shadow-inner">
                <div className="flex justify-between items-start">
                  <div className="text-stone-400 text-xs mb-2">總營業額</div>
                  <DollarSign size={16} className="text-green-500" />
                </div>
                <div className="text-3xl font-black text-white"><span className="text-sm font-normal text-stone-500 mr-1">$</span>{orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}</div>
              </div>
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex flex-col justify-between col-span-2 shadow-inner">
                <div className="flex justify-between items-start">
                  <div className="text-stone-400 text-xs mb-2">出貨狀態分布</div>
                  <Activity size={16} className="text-blue-400" />
                </div>
                <div className="grid grid-cols-4 gap-2 text-center mt-auto bg-stone-900 rounded-xl p-2 border border-stone-800/50">
                  <div className="flex flex-col items-center">
                    <div className="text-lg font-bold text-red-400">{orders.filter(o => o.status === '未對帳').length}</div>
                    <div className="text-[10px] text-stone-400">未對帳</div>
                  </div>
                  <div className="flex flex-col items-center border-l border-stone-800">
                    <div className="text-lg font-bold text-amber-400">{orders.filter(o => o.status === '已匯款/備貨中').length}</div>
                    <div className="text-[10px] text-stone-400">備貨中</div>
                  </div>
                  <div className="flex flex-col items-center border-l border-stone-800">
                    <div className="text-lg font-bold text-blue-400">{orders.filter(o => o.status === '已出貨/可自取').length}</div>
                    <div className="text-[10px] text-stone-400">可自取/出貨</div>
                  </div>
                  <div className="flex flex-col items-center border-l border-stone-800">
                    <div className="text-lg font-bold text-green-400">{orders.filter(o => o.status === '已完成').length}</div>
                    <div className="text-[10px] text-stone-400">已完成</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <p className="text-xs text-stone-400">以下顯示所有客戶透過網頁送出的烤肉訂單與匯款後五碼資料：</p>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => openForm()} className="bg-stone-800 hover:bg-stone-700 text-blue-400 text-xs px-3 py-1.5 rounded-xl border border-stone-700 flex items-center gap-1 transition-colors">
                  <Plus size={14} /> 新增訂單
                </button>
                <button onClick={handleExportExcel} disabled={orders.length === 0} className="bg-stone-800 hover:bg-stone-700 text-green-400 text-xs px-3 py-1.5 rounded-xl border border-stone-700 flex items-center gap-1 disabled:opacity-50 transition-colors">
                  <Download size={14} /> 匯出 Excel
                </button>
                <button onClick={fetchOrders} disabled={loading} className="bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs px-3 py-1.5 rounded-xl border border-stone-700 flex items-center gap-1 disabled:opacity-50 transition-colors">
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 重新整理
                </button>
                <button onClick={handleLogout} className="bg-stone-800 hover:bg-stone-700 text-red-400 text-xs px-3 py-1.5 rounded-xl border border-stone-700 flex items-center gap-1 transition-colors">
                  <LogOut size={14} /> 登出
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-stone-300">
                <thead className="bg-stone-950 text-xs text-amber-400 uppercase border-b border-stone-800">
                  <tr>
                    <th className="p-3 whitespace-nowrap">訂單編號 / 時間</th>
                    <th className="p-3 whitespace-nowrap">客戶資訊</th>
                    <th className="p-3">訂購品項</th>
                    <th className="p-3 whitespace-nowrap">金額 / 配送</th>
                    <th className="p-3 whitespace-nowrap">匯款末五碼</th>
                    <th className="p-3 whitespace-nowrap">狀態管理</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800">
                  {loading && orders.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-stone-500">載入中...</td></tr>
                  ) : error ? (
                    <tr><td colSpan={6} className="p-6 text-center text-red-400">{error}</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={6} className="p-6 text-center text-stone-500">目前尚無任何客戶訂單紀錄。</td></tr>
                  ) : (
                    orders.map(r => (
                      <tr key={r.id} className="hover:bg-stone-950/60 transition-colors">
                        <td className="p-3 text-xs align-top">
                          <span className="font-mono text-amber-400">{r.id.substring(0,6)}...</span><br/>
                          <span className="text-stone-500">{new Date(r.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="p-3 text-xs align-top">
                          <strong className="text-white">{r.customerName}</strong><br/>
                          <span>{r.phone}</span><br/>
                          <span className="text-stone-400 line-clamp-2 max-w-[150px]">{r.address || '面交自取'}</span><br/>
                          <span className="text-amber-400/80 text-[10px] mt-1 inline-block">推薦人: {r.referrer || '無'}</span>
                        </td>
                        <td className="p-3 align-top">
                          {r.items.map((i, idx) => (
                            <div key={idx} className="text-xs text-stone-300">• {i.name} x {i.qty}</div>
                          ))}
                          {r.note && (
                            <div className="mt-2 text-xs text-stone-400 bg-stone-900/50 p-2 rounded border border-stone-800">
                              <span className="text-amber-500 font-bold">備註：</span>{r.note}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-xs align-top">
                          <span className="font-bold text-amber-400">${r.totalAmount}</span><br/>
                          <span className="text-stone-400">{r.deliveryMethod}</span><br/>
                          <span className="text-stone-400 text-[10px] bg-stone-900 px-1 py-0.5 rounded border border-stone-800 mt-1 inline-block">日期: {r.deliveryDate || '未指定'}</span>
                        </td>
                        <td className="p-3 text-xs align-top">
                          <span className="bg-amber-950/40 border border-amber-600/40 text-amber-300 px-2 py-1 rounded font-mono font-bold">{r.bankLast5}</span>
                        </td>
                        <td className="p-3 text-xs align-top">
                          <div className="flex flex-col gap-2">
                            <select 
                              value={r.status}
                              onChange={(e) => updateOrderStatus(r.id, e.target.value)}
                              className="bg-stone-950 border border-stone-700 rounded px-2 py-1 text-white text-xs w-full"
                            >
                              <option value="未對帳">未對帳</option>
                              <option value="已匯款/備貨中">已匯款/備貨中</option>
                              <option value="已出貨/可自取">已出貨/可自取</option>
                              <option value="已完成">已完成</option>
                            </select>
                            <button 
                              onClick={() => openForm(r)}
                              className="flex items-center justify-center gap-1 w-full bg-blue-950/40 hover:bg-blue-900/60 text-blue-400 border border-blue-900/50 rounded px-2 py-1 transition-colors"
                            >
                              <Edit size={12} /> 修改訂單
                            </button>
                            <button 
                              onClick={() => deleteOrder(r.id)}
                              className="flex items-center justify-center gap-1 w-full bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/50 rounded px-2 py-1 transition-colors"
                            >
                              <Trash2 size={12} /> 刪除訂單
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Order Form Modal (Add / Edit) */}
        {isFormOpen && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-amber-400">
                  {editingOrder ? '修改訂單' : '新增人工訂單'}
                </h3>
                <button onClick={() => setIsFormOpen(false)} className="text-stone-400 hover:text-white transition-colors bg-stone-800 p-1.5 rounded-full">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={saveOrder} className="overflow-y-auto custom-scrollbar pr-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">客戶姓名 *</label>
                    <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">聯絡電話 *</label>
                    <input type="text" required value={formPhone} onChange={e => setFormPhone(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">配送地址</label>
                  <input type="text" value={formAddress} onChange={e => setFormAddress(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors" />
                </div>
                
                {/* 訂購品項區塊 */}
                <div className="bg-stone-950/50 p-4 rounded-xl border border-stone-800">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-xs font-bold text-amber-500">訂購品項</label>
                    <button type="button" onClick={handleAddItem} className="text-xs bg-stone-800 hover:bg-stone-700 text-amber-400 px-2 py-1 rounded-md flex items-center gap-1 transition-colors">
                      <Plus size={12} /> 新增品項
                    </button>
                  </div>
                  {formItems.length === 0 ? (
                    <div className="text-center text-xs text-stone-500 py-2">目前沒有品項</div>
                  ) : (
                    <div className="space-y-2">
                      {formItems.map((item, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-stone-900 p-2 rounded-lg border border-stone-700/50">
                          <select 
                            value={item.name} 
                            onChange={e => handleUpdateItem(idx, 'name', e.target.value)}
                            className="flex-grow bg-stone-950 border border-stone-700 rounded-md px-2 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          >
                            {PRODUCT_OPTIONS.map((p, pIdx) => (
                              <option key={pIdx} value={p.name}>{p.name} (${p.price})</option>
                            ))}
                          </select>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <input 
                              type="number" 
                              min="1"
                              value={item.qty} 
                              onChange={e => handleUpdateItem(idx, 'qty', e.target.value)}
                              className="w-16 bg-stone-950 border border-stone-700 rounded-md px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-amber-500"
                              placeholder="數量"
                            />
                            <input 
                              type="number" 
                              value={item.price} 
                              onChange={e => handleUpdateItem(idx, 'price', e.target.value)}
                              className="w-20 bg-stone-950 border border-stone-700 rounded-md px-2 py-1.5 text-xs text-center text-white focus:outline-none focus:border-amber-500"
                              placeholder="單價"
                            />
                            <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-300 p-1.5 bg-red-950/30 rounded-md">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">折扣折數 (%)</label>
                    <div className="relative">
                      <input type="number" min="0" max="100" value={formDiscount} onChange={handleDiscountChange} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors" placeholder="100 為無折扣" />
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-stone-400 mb-1">總金額 (折扣後)*</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">$</span>
                      <input type="number" required value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl pl-7 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">取貨/寄出日期</label>
                    <input type="date" value={formDeliveryDate} onChange={e => setFormDeliveryDate(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">匯款末五碼</label>
                    <input type="text" value={formBankLast5} onChange={e => setFormBankLast5(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-stone-400 mb-1">推薦人</label>
                    <input type="text" value={formReferrer} onChange={e => setFormReferrer(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1">備註 (可記錄人工新增的品項或折扣說明)</label>
                  <textarea rows={3} value={formNote} onChange={e => setFormNote(e.target.value)} className="w-full bg-stone-950 border border-stone-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"></textarea>
                </div>
                <div className="pt-4 mt-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-sm font-bold text-stone-400 hover:text-white hover:bg-stone-800 rounded-xl transition-colors">
                    取消
                  </button>
                  <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-2.5 rounded-xl transition-colors shadow-md">
                    儲存訂單
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
