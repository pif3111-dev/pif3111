import React, { useEffect, useState } from 'react';
import { Lock, RefreshCw, X } from 'lucide-react';
import { Order } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminModal({ isOpen, onClose }: AdminModalProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      // sort by date descending
      data.sort((a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      
      // Update local state to reflect change
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('更新狀態失敗，請稍後再試。');
    }
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
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-stone-400">以下顯示所有客戶透過網頁送出的烤肉訂單與匯款後五碼資料：</p>
            <button onClick={fetchOrders} disabled={loading} className="bg-stone-800 hover:bg-stone-700 text-amber-400 text-xs px-3 py-1.5 rounded-xl border border-stone-700 flex items-center gap-1 disabled:opacity-50">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 重新整理
            </button>
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
                        <span className="text-stone-400 line-clamp-2 max-w-[150px]">{r.address || '面交自取'}</span>
                      </td>
                      <td className="p-3 align-top">
                        {r.items.map((i, idx) => (
                          <div key={idx} className="text-xs text-stone-300">• {i.name} x {i.qty}</div>
                        ))}
                      </td>
                      <td className="p-3 text-xs align-top">
                        <span className="font-bold text-amber-400">${r.totalAmount}</span><br/>
                        <span className="text-stone-400">{r.deliveryMethod}</span>
                      </td>
                      <td className="p-3 text-xs align-top">
                        <span className="bg-amber-950/40 border border-amber-600/40 text-amber-300 px-2 py-1 rounded font-mono font-bold">{r.bankLast5}</span>
                      </td>
                      <td className="p-3 text-xs align-top">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
