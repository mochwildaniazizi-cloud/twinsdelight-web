import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import RetroSelect from './components/ui/RetroSelect';
import RetroDatePicker from './components/ui/RetroDatePicker';
import AdminDashboard from './pages/AdminDashboard';
import ToastContainer from './components/ui/Toast';
import { useToast } from './hooks/useToast';
import ConfirmModal from './components/ui/ConfirmModal';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.SUPABASE_ANON_KEY || '';

// Inisialisasi client hanya jika kredensial telah diset secara valid dan bukan placeholder
const isSupabaseConfigured = 
  supabaseUrl && 
  typeof supabaseUrl === 'string' &&
  supabaseUrl.startsWith('http') && 
  supabaseUrl !== 'https://your-project-ref.supabase.co' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'undefined' && 
  supabaseAnonKey !== 'null' && 
  supabaseAnonKey !== '';

const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

const flavorOptions = [
  { value: 'Cokelat (8 pcs)', label: '🍫 Cokelat (8 pcs) — Rp 40k' },
  { value: 'Keju (8 pcs)', label: '🧀 Keju (8 pcs) — Rp 40k' },
  { value: 'Cokelat Keju (8 pcs)', label: '🍫🧀 Cokelat Keju (8 pcs) — Rp 45k' },
  { value: 'Tape (8 pcs)', label: '🍌 Tape (8 pcs) — Rp 40k' },
  { value: 'Box Mix (8 pcs)', label: '🎁 Box Mix (8 pcs, 2 rasa) — Rp 40k' },
];

// Pilihan rasa untuk Box Mix (4 pcs per rasa)
const mixFlavorOptions = [
  { value: 'Cokelat', label: '🍫 Cokelat' },
  { value: 'Keju', label: '🧀 Keju' },
  { value: 'Cokelat Keju', label: '🍫🧀 Cokelat Keju' },
  { value: 'Tape', label: '🍌 Tape' },
];

// Hitung harga per box
const getBoxPrice = (flavor, mix = {}) => {
  if (flavor === 'Cokelat Keju (8 pcs)') return 45000;
  if (flavor && flavor.startsWith('Box Mix')) {
    // Box Mix 45k jika salah satu rasa mengandung Cokelat Keju
    if (mix.flavor1 === 'Cokelat Keju' || mix.flavor2 === 'Cokelat Keju') return 45000;
    return 40000;
  }
  return 40000;
};


// Data awal sebagai contoh jika LocalStorage masih kosong
const initialMockData = [
  {
    id: 'ORD-1001',
    name: 'Kak Sarah',
    phone: '08123456789',
    date: '2026-08-12',
    totalBoxes: 2,
    status: 'Menunggu',
    boxesDetail: [
      { flavor: 'Cokelat (8 pcs)' },
      { flavor: 'Box Mix (8 pcs)', mix: { flavor1: 'Keju', flavor2: 'Tape' } }
    ]
  }
];


function App() {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('Ambil Sendiri (TwinsDelight, Jl. Danau Sentani Utara II, Madyopuro, Kec. Kedungkandang, Kota Malang, Jawa Timur H3D19)');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup'); // 'pickup' atau 'delivery'
  const [orderDate, setOrderDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const [productionDateFilter, setProductionDateFilter] = useState('ALL');
  const [userRole, setUserRole] = useState('buyer'); // 'buyer' atau 'seller'
  const [submittedOrder, setSubmittedOrder] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('twinsbollen');

  // State Login & Keamanan Penjual
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('admin_logged_in') === 'true';
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [customProductionDate, setCustomProductionDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });


  // State Form Box
  const [boxes, setBoxes] = useState([{ 
    id: Date.now(), 
    flavor: 'Cokelat (8 pcs)', 
    mix: { flavor1: 'Cokelat', flavor2: 'Keju' } 
  }]);

  // State Orders: Membaca dari LocalStorage sebagai fallback awal sebelum fetching dari database
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('twins_orders');
    return saved ? JSON.parse(saved) : initialMockData;
  });

  const { toasts, removeToast, toast } = useToast();

  // State untuk modal konfirmasi hapus
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, orderId: null });

  const fetchOrders = async () => {
    if (!supabase) {
      console.warn('Supabase not configured. Using local storage cache.');
      const saved = localStorage.getItem('twins_orders');
      if (saved) setOrders(JSON.parse(saved));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, name, phone, address, date, status, boxesDetail:boxesdetail, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const sanitized = data.map(o => ({
          ...o,
          totalBoxes: o.totalBoxes !== undefined && o.totalBoxes !== null
            ? Number(o.totalBoxes)
            : (o.boxesDetail ? o.boxesDetail.length : 0)
        }));
        setOrders(sanitized);
        localStorage.setItem('twins_orders', JSON.stringify(sanitized));
      }
    } catch (err) {
      console.error('Error fetching orders from Supabase, using cache:', err);
      toast.warning('Mode Offline', 'Menampilkan data dari cache lokal.');
      const saved = localStorage.getItem('twins_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        const sanitized = parsed.map(o => ({
          ...o,
          totalBoxes: o.totalBoxes !== undefined && o.totalBoxes !== null
            ? Number(o.totalBoxes)
            : (o.boxesDetail ? o.boxesDetail.length : 0)
        }));
        setOrders(sanitized);
      }
    }
  };

  // --- FUNGSI ROUTING SEKRET/TERSEMBUNYI UNTUK ADMIN ---
  useEffect(() => {
    const checkAdminRoute = () => {
      if (window.location.pathname === '/admin') {
        if (isLoggedIn) {
          setUserRole('seller');
        } else {
          setShowLoginModal(true);
        }
      } else {
        setUserRole('buyer');
      }
    };

    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    return () => window.removeEventListener('popstate', checkAdminRoute);
  }, [isLoggedIn]);

  useEffect(() => {
    fetchOrders();
  }, [userRole]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Database change detected:', payload);
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // --- FUNGSI LOGIN & LOGOUT PENJUAL ---
  const handleLoginSubmit = () => {
    if (loginUsername.trim().toLowerCase() === 'admin' && loginPassword === 'twinsdelight') {
      setIsLoggedIn(true);
      localStorage.setItem('admin_logged_in', 'true');
      setUserRole('seller');
      setShowLoginModal(false);
      setLoginUsername('');
      setLoginPassword('');
      setLoginError('');
      if (window.location.pathname !== '/admin') {
        window.history.pushState({}, '', '/admin');
      }
    } else {
      setLoginError('Username atau password salah!');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('admin_logged_in');
    setUserRole('buyer');
    setSubmittedOrder(null);
    window.history.pushState({}, '', '/');
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
    setLoginError('');
    setLoginUsername('');
    setLoginPassword('');
    window.history.pushState({}, '', '/');
  };

  // --- FUNGSI MANAJEMEN FORM BOX ---
  const addBox = () => setBoxes([...boxes, { id: Date.now(), flavor: 'Cokelat (8 pcs)', mix: { flavor1: 'Cokelat', flavor2: 'Keju' } }]);
  const removeBox = (id) => setBoxes(boxes.filter(box => box.id !== id));
  const updateBoxFlavor = (id, newFlavor) => setBoxes(boxes.map(box => box.id === id ? { ...box, flavor: newFlavor } : box));
  const updateMixFlavor = (id, field, value) => setBoxes(boxes.map(box => box.id === id ? { ...box, mix: { ...box.mix, [field]: value } } : box));

  // --- LOGIKA FORM VALIDATION & SAVE ORDER ---
  const isFormValid = customerName.trim() !== '' && 
                      customerPhone.trim() !== '' && 
                      customerAddress.trim() !== '' && 
                      orderDate !== '' && 
                      boxes.every(box => 
                        box.flavor?.startsWith('Box Mix') ? (box.mix?.flavor1 && box.mix?.flavor2 && box.mix?.flavor1 !== box.mix?.flavor2) : true
                      );

  const handleSaveOrder = async () => {
    if (!isFormValid) return;

    const updatedBoxesDetail = boxes.map(b => ({
      flavor: b.flavor,
      mix: b.flavor?.startsWith('Box Mix') ? { ...b.mix } : null
    }));

    if (editingOrderId) {
      const updatedData = {
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        date: orderDate,
        boxesDetail: updatedBoxesDetail
      };

      // Optimistic update
      setOrders(orders.map(order => {
        if (order.id === editingOrderId) {
          return {
            ...order,
            ...updatedData,
            totalBoxes: boxes.length
          };
        }
        return order;
      }));

      if (supabase) {
        try {
          const { error } = await supabase
            .from('orders')
            .update({
              name: updatedData.name,
              phone: updatedData.phone,
              address: updatedData.address,
              date: updatedData.date,
              boxesdetail: updatedData.boxesDetail
            })
            .eq('id', editingOrderId);

          if (error) throw error;
          toast.success('Pesanan Diperbarui', `Pesanan ${updatedData.name} berhasil diubah.`);
          fetchOrders();
        } catch (err) {
          console.error('Error updating order in Supabase:', err);
          toast.error('Gagal Menyimpan', 'Perubahan tidak dapat disimpan. Coba lagi.');
        }
      } else {
        const updatedOrders = orders.map(order => {
          if (order.id === editingOrderId) {
            return { ...order, ...updatedData, totalBoxes: boxes.length };
          }
          return order;
        });
        localStorage.setItem('twins_orders', JSON.stringify(updatedOrders));
      }
      setEditingOrderId(null);
    } else {
      const newOrder = {
        id: `ORD-${Date.now().toString().slice(-4)}`,
        name: customerName,
        phone: customerPhone,
        address: customerAddress,
        date: orderDate,
        totalBoxes: boxes.length,
        status: 'Menunggu',
        boxesDetail: updatedBoxesDetail
      };

      // Optimistic update
      setOrders([newOrder, ...orders]);

      if (supabase) {
        try {
          const { error } = await supabase
            .from('orders')
            .insert([
              {
                id: newOrder.id,
                name: newOrder.name,
                phone: newOrder.phone,
                address: newOrder.address,
                date: newOrder.date,
                status: newOrder.status,
                boxesdetail: newOrder.boxesDetail
              }
            ]);

          if (error) throw error;
          toast.success('Pesanan Terkirim! 🎉', `Terima kasih, ${newOrder.name}! Pesanan kamu sudah kami terima.`);
          fetchOrders();
        } catch (err) {
          console.error('Error saving order to Supabase:', err);
          toast.error('Gagal Mengirim', 'Pesanan tidak tersimpan. Mohon coba lagi.');
        }
      } else {
        const updatedOrders = [newOrder, ...orders];
        localStorage.setItem('twins_orders', JSON.stringify(updatedOrders));
      }

      if (userRole === 'buyer') {
        setSubmittedOrder(newOrder);
      }
    }

    // Reset Form Input
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('Ambil Sendiri (TwinsDelight, Jl. Danau Sentani Utara II, Madyopuro, Kec. Kedungkandang, Kota Malang, Jawa Timur H3D19)');
    setDeliveryMethod('pickup');
    setOrderDate('');
    setBoxes([{ id: Date.now(), flavor: 'Cokelat (8 pcs)', mix: { flavor1: 'Cokelat', flavor2: 'Keju' } }]);
    
    // Close Modal
    setIsFormOpen(false);
  };

  // --- FUNGSI TOGGLE STATUS PESANAN ---
  const toggleOrderStatus = async (orderId) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const newStatus = order.status === 'Menunggu' ? 'Selesai' : 'Menunggu';

    // Optimistic update
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    if (supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .update({ status: newStatus })
          .eq('id', orderId);

        if (error) throw error;
        toast.info(
          newStatus === 'Selesai' ? '✅ Pesanan Selesai' : '🔄 Status Diperbarui',
          `Status pesanan berhasil diubah ke "${newStatus}".`
        );
        fetchOrders();
      } catch (err) {
        console.error('Error updating status in Supabase:', err);
        toast.error('Gagal Update Status', 'Status pesanan tidak dapat diubah.');
      }
    } else {
      const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
      localStorage.setItem('twins_orders', JSON.stringify(updatedOrders));
      toast.info('Status Diperbarui', `Status berhasil diubah ke "${newStatus}".`);
    }
  };

  const startEditOrder = (order) => {
    // Pastikan halaman admin aktif
    setUserRole('seller');
    window.history.pushState({}, '', '/admin');
    setEditingOrderId(order.id);
    setCustomerName(order.name);
    setCustomerPhone(order.phone || '');
    const isPickup = order.address && order.address.startsWith('Ambil Sendiri');
    setDeliveryMethod(isPickup ? 'pickup' : 'delivery');
    setCustomerAddress(order.address || '');
    setOrderDate(order.date);
    setBoxes(order.boxesDetail.map((b, idx) => ({
      id: Date.now() + idx,
      flavor: b.flavor,
      mix: b.mix ? { ...b.mix } : { flavor1: 'Cokelat', flavor2: 'Keju' }
    })));
    setIsFormOpen(true);
  };

  const cancelEdit = () => {
    setEditingOrderId(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('Ambil Sendiri (TwinsDelight, Jl. Danau Sentani Utara II, Madyopuro, Kec. Kedungkandang, Kota Malang, Jawa Timur H3D19)');
    setDeliveryMethod('pickup');
    setOrderDate('');
    setBoxes([{ id: Date.now(), flavor: 'Cokelat (8 pcs)', mix: { flavor1: 'Cokelat', flavor2: 'Keju' } }]);
    setIsFormOpen(false);
  };

  const getWhatsAppLink = (phone) => {
    if (!phone) return '';
    let clean = phone.replace(/\D/g, ''); 
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (clean.startsWith('62')) {
      // already starts with 62
    } else if (!clean.startsWith('62') && clean.length > 0) {
      clean = '62' + clean;
    }
    return `https://wa.me/${clean}`;
  };

  // Buka modal konfirmasi hapus
  const deleteOrder = (orderId) => {
    setConfirmModal({ isOpen: true, orderId });
  };

  // Eksekusi hapus setelah dikonfirmasi
  const confirmDeleteOrder = async () => {
    const orderId = confirmModal.orderId;
    setConfirmModal({ isOpen: false, orderId: null });

    if (editingOrderId === orderId) cancelEdit();

    // Optimistic update
    setOrders(orders.filter(order => order.id !== orderId));

    if (supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);

        if (error) throw error;
        toast.success('Pesanan Dihapus', 'Data pesanan berhasil dihapus dari database.');
        fetchOrders();
      } catch (err) {
        console.error('Error deleting order in Supabase:', err);
        toast.error('Gagal Menghapus', 'Pesanan tidak dapat dihapus. Coba lagi.');
      }
    } else {
      const updatedOrders = orders.filter(order => order.id !== orderId);
      localStorage.setItem('twins_orders', JSON.stringify(updatedOrders));
      toast.success('Pesanan Dihapus', 'Data pesanan berhasil dihapus.');
    }
  };


  const getLocalDateString = (offsetDays = 0) => {
    const d = new Date();
    if (offsetDays !== 0) d.setDate(d.getDate() + offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(0);
  const tomorrowStr = getLocalDateString(1);

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const m = months[d.getMonth()];
    const y = d.getFullYear();
    return `${day} ${m} ${y}`;
  };

  // --- FUNGSI KALKULATOR TOTAL BENTO GRID (DARI SELURUH PESANAN TERMASUK INPUTAN LIVE) ---
  const calculateTotals = () => {
    let totalBox = 0;
    let totalPcs = 0;
    let totalHarga = 0;
    let cokelat = 0; let keju = 0; let coklatKeju = 0; let tape = 0;

    let targetDate = null;
    if (productionDateFilter === 'TODAY') targetDate = todayStr;
    else if (productionDateFilter === 'TOMORROW') targetDate = tomorrowStr;
    else if (productionDateFilter === 'CUSTOM') targetDate = customProductionDate;

    // Hitung dari pesanan terdaftar
    const filteredOrders = targetDate
      ? orders.filter(o => o.date === targetDate)
      : orders;

    filteredOrders.forEach(order => {
      const boxesCount = order.totalBoxes !== undefined && order.totalBoxes !== null
        ? Number(order.totalBoxes)
        : (order.boxesDetail ? order.boxesDetail.length : 0);
      totalBox += boxesCount;
      
      if (order.boxesDetail) {
        order.boxesDetail.forEach(box => {
          totalHarga += getBoxPrice(box.flavor, box.mix);
          if (box.flavor === 'Cokelat (8 pcs)') { cokelat += 8; totalPcs += 8; }
          else if (box.flavor === 'Keju (8 pcs)') { keju += 8; totalPcs += 8; }
          else if (box.flavor === 'Cokelat Keju (8 pcs)') { coklatKeju += 8; totalPcs += 8; }
          else if (box.flavor === 'Tape (8 pcs)') { tape += 8; totalPcs += 8; }
          else if (box.flavor && box.flavor.startsWith('Box Mix') && box.mix) {
            const pcsPerFlavor = box.flavor.includes('4 pcs') ? 2 : 4;
            totalPcs += pcsPerFlavor * 2;
            const addMixFlavor = (fl) => {
              if (fl === 'Cokelat') cokelat += pcsPerFlavor;
              else if (fl === 'Keju') keju += pcsPerFlavor;
              else if (fl === 'Cokelat Keju') coklatKeju += pcsPerFlavor;
              else if (fl === 'Tape') tape += pcsPerFlavor;
            };
            addMixFlavor(box.mix.flavor1);
            addMixFlavor(box.mix.flavor2);
          }
          // backward compat: old flavor names
          else if (box.flavor === 'Mix (4 Cokelat, 4 Keju)') { cokelat += 4; keju += 4; totalPcs += 8; }
          else if (box.flavor === 'Custom (Pilih Sendiri)' && box.custom) {
            const total = (box.custom.cokelat || 0) + (box.custom.keju || 0) + (box.custom.tape || 0);
            cokelat += box.custom.cokelat || 0;
            keju += box.custom.keju || 0;
            tape += box.custom.tape || 0;
            totalPcs += total;
          }
        });
      }
    });

    return { totalBox, totalPcs, totalHarga, cokelat, keju, coklatKeju, tape };
  };

  const getOrderFlavorSummary = (boxesDetail) => {
    if (!boxesDetail || boxesDetail.length === 0) {
      return <div className="text-gray-400 font-medium italic">Belum ada rasa</div>;
    }

    return (
      <div className="text-[11px] text-gray-500 font-semibold space-y-1 leading-tight">
        {boxesDetail.map((box, i) => {
          let label = box.flavor;
          if (box.flavor && box.flavor.startsWith('Box Mix') && box.mix) {
            const countStr = box.flavor.includes('4 pcs') ? '2+2 pcs' : '4+4 pcs';
            label = `Box Mix: ${box.mix.flavor1} & ${box.mix.flavor2} (${countStr})`;
          } else if (box.flavor === 'Custom (Pilih Sendiri)' && box.custom) {
            // backward compat
            const parts = [];
            if (box.custom.cokelat > 0) parts.push(`Cokelat: ${box.custom.cokelat} pcs`);
            if (box.custom.keju > 0) parts.push(`Keju: ${box.custom.keju} pcs`);
            if (box.custom.tape > 0) parts.push(`Tape: ${box.custom.tape} pcs`);
            label = `Custom (${parts.join(', ')})`;
          }
          
          let emoji = '📦';
          if (box.flavor === 'Cokelat (8 pcs)') emoji = '🍫';
          else if (box.flavor === 'Keju (8 pcs)') emoji = '🧀';
          else if (box.flavor === 'Cokelat Keju (8 pcs)') emoji = '🍫🧀';
          else if (box.flavor === 'Tape (8 pcs)') emoji = '🍌';
          else if (box.flavor && box.flavor.startsWith('Box Mix')) emoji = '🎁';
          else if (box.flavor === 'Mix (4 Cokelat, 4 Keju)') emoji = '🍰'; // backward compat
          else if (box.flavor === 'Custom (Pilih Sendiri)') emoji = '⚙️'; // backward compat

          return (
            <div key={i} className="flex items-start gap-1">
              <span>{emoji}</span>
              <span>Box {i + 1}: {label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const totals = calculateTotals();


  const handleShareWhatsApp = () => {
    let dateLabel = 'Semua Tanggal';
    if (productionDateFilter === 'TODAY') dateLabel = `Hari Ini (${formatDateDisplay(todayStr)})`;
    else if (productionDateFilter === 'TOMORROW') dateLabel = `Besok (${formatDateDisplay(tomorrowStr)})`;
    else if (productionDateFilter === 'CUSTOM') dateLabel = formatDateDisplay(customProductionDate);

    const messageText = `🍩 *REKAP PRODUKSI TWINSBOLLEN*
📅 Tanggal: ${dateLabel}
----------------------------------------
📦 Total: ${totals.totalBox} Box (${totals.totalPcs} pcs)
💰 Total Omzet: Rp ${(totals.totalHarga / 1000).toFixed(0)}k

Rincian Adonan:
🍫 Cokelat: ${totals.cokelat} pcs
🧀 Keju: ${totals.keju} pcs
🍫🧀 Cokelat Keju: ${totals.coklatKeju} pcs
🍌 Tape: ${totals.tape} pcs

_TwinsDelight Dashboard_`;

    const encodedText = encodeURIComponent(messageText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleConfirmOrderWhatsApp = (newOrder) => {
    const summaryText = `🍩 *PESANAN BARU TWINSBOLLEN*
----------------------------------------
📌 *ID:* ${newOrder.id}
👤 *Nama:* ${newOrder.name}
📞 *WA:* ${newOrder.phone}
📍 *Alamat:* ${newOrder.address}
📅 *Tanggal Ambil:* ${formatDateDisplay(newOrder.date)}
📦 *Jumlah:* ${newOrder.totalBoxes} Box

*Rincian Rasa:*
${newOrder.boxesDetail.map((box, i) => {
  if (box.flavor && box.flavor.startsWith('Box Mix') && box.mix) {
    const countStr = box.flavor.includes('4 pcs') ? '2+2 pcs' : '4+4 pcs';
    return `- Box ${i+1}: 🎁 Box Mix (${box.mix.flavor1} & ${box.mix.flavor2}, ${countStr}) — Rp ${(getBoxPrice(box.flavor, box.mix)/1000).toFixed(0)}k`;
  }
  return `- Box ${i+1}: ${box.flavor} — Rp ${(getBoxPrice(box.flavor)/1000).toFixed(0)}k`;
}).join('\n')}

💰 *Total Harga: Rp ${(newOrder.boxesDetail.reduce((sum, b) => sum + getBoxPrice(b.flavor, b.mix), 0) / 1000).toFixed(0)}k*

Mohon segera diproses ya, terima kasih!`;

    const encodedTextUrl = encodeURIComponent(summaryText);
    window.open(`https://wa.me/6285646674868?text=${encodedTextUrl}`, '_blank');
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex justify-center">
      {userRole === 'seller' ? (
        <AdminDashboard
          orders={orders}
          fetchOrders={fetchOrders}
          totals={totals}
          formatDateDisplay={formatDateDisplay}
          getWhatsAppLink={getWhatsAppLink}
          toggleOrderStatus={toggleOrderStatus}
          deleteOrder={deleteOrder}
          startEditOrder={startEditOrder}
          editingOrderId={editingOrderId}
          handleLogout={handleLogout}
          handleShareWhatsApp={handleShareWhatsApp}
          productionDateFilter={productionDateFilter}
          setProductionDateFilter={setProductionDateFilter}
          customProductionDate={customProductionDate}
          setCustomProductionDate={setCustomProductionDate}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          setSelectedOrder={setSelectedOrder}
          getOrderFlavorSummary={getOrderFlavorSummary}
        />
      ) : (
        <div className="w-full max-w-4xl space-y-6 pb-20">
          {/* HEADER FOR BUYER */}
          <header className="card-retro p-4 relative flex flex-col sm:flex-row justify-center items-center gap-3">
            <div className="flex justify-center items-center select-none w-full">
              <img src="/TwinsDelight-Logo.png" alt="TwinsDelight Logo" className="w-80 h-40 object-contain animate-fade-in" />
            </div>
            
            {isLoggedIn && (
              <button
                onClick={() => {
                  setUserRole('seller');
                  window.history.pushState({}, '', '/admin');
                }}
                className="sm:absolute sm:right-6 sm:top-1/2 sm:-translate-y-1/2 px-3.5 py-1.5 bg-retro-orange text-retro-dark text-xs font-black rounded-lg border-2 border-retro-dark shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer select-none"
              >
                ⚙️ Dashboard
              </button>
            )}
          </header>

          {/* BUYER MODE: SUCCESS CONFIRMATION SCREEN */}
          {submittedOrder ? (
            <section className="card-retro p-6 bg-white space-y-5 animate-fade-in text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 border-4 border-green-600 rounded-full text-green-600 text-3xl font-extrabold shadow-retro-sm">
                ✓
              </div>
              <div>
                <h2 className="text-xl font-bold">Pesanan Berhasil Dicatat!</h2>
                <p className="text-xs text-gray-500 font-bold mt-1">ID Pesanan: {submittedOrder.id}</p>
              </div>
              
              <div className="text-left bg-retro-bg p-4 border-2 border-retro-dark rounded-xl space-y-2 text-xs font-semibold leading-relaxed">
                <p><span className="text-gray-500">Nama Pemesan:</span> <span className="font-bold">{submittedOrder.name}</span></p>
                <p><span className="text-gray-500">Nomor WhatsApp:</span> <span className="font-bold text-green-600">{submittedOrder.phone}</span></p>
                <p>
                  <span className="text-gray-500">Metode Penerimaan:</span>{' '}
                  <span className="font-bold">
                    {submittedOrder.address.startsWith('Ambil Sendiri') ? '🛍️ Ambil Sendiri' : '🚚 Pengantaran'}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Alamat:</span>{' '}
                  <span className="font-bold">
                    {submittedOrder.address.startsWith('Ambil Sendiri') 
                      ? 'TwinsDelight, Jl. Danau Sentani Utara II, Madyopuro, Kec. Kedungkandang, Kota Malang, Jawa Timur H3D19' 
                      : submittedOrder.address}
                  </span>
                </p>
                <p><span className="text-gray-500">Tanggal Pengambilan:</span> <span className="font-bold">{formatDateDisplay(submittedOrder.date)}</span></p>
                <p><span className="text-gray-500">Total Box:</span> <span className="font-bold">{submittedOrder.totalBoxes} Box</span></p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleConfirmOrderWhatsApp(submittedOrder)}
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-sm font-bold py-3 px-4 border-2 border-retro-dark rounded-xl shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.714-1.465L0 24zm6.59-4.846c1.6.95 3.198 1.451 4.797 1.452 5.482 0 9.94-4.46 9.943-9.94.002-2.654-1.031-5.148-2.909-7.026-1.879-1.878-4.372-2.91-7.026-2.913-5.485 0-9.94 4.46-9.943 9.94-.001 1.904.509 3.761 1.482 5.395l-.974 3.565 3.63-.952zm10.934-7.505c-.328-.164-1.942-.959-2.242-1.069-.3-.11-.518-.165-.736.164-.218.328-.844 1.069-1.034 1.288-.19.219-.38.247-.708.083-.328-.164-1.385-.51-2.64-1.627-.977-.872-1.637-1.95-1.828-2.278-.19-.328-.02-.505.145-.669.148-.148.328-.383.491-.575.163-.192.218-.328.327-.547.11-.219.055-.411-.027-.575-.082-.164-.736-1.776-1.008-2.434-.266-.643-.56-.554-.766-.564-.197-.01-.424-.012-.65-.012-.226 0-.594.085-.904.425-.31.339-1.185 1.161-1.185 2.83 0 1.67 1.218 3.28 1.385 3.507.167.227 2.392 3.653 5.795 5.123.809.35 1.442.559 1.933.715.813.258 1.554.222 2.138.135.652-.097 1.942-.794 2.215-1.56.272-.767.272-1.423.19-1.56-.081-.137-.299-.219-.627-.383z"/>
                  </svg>
                  Kirim Konfirmasi WA
                </button>
                <button
                  onClick={() => setSubmittedOrder(null)}
                  className="w-full bg-white text-retro-dark text-xs font-bold py-2.5 border-2 border-retro-dark rounded-xl shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer"
                >
                  ➕ Buat Pesanan Baru
                </button>
              </div>
            </section>
          ) : (
            /* BUYER MODE: HERO LANDING CARD */
            <section className="card-retro p-6 bg-white text-center space-y-4 animate-fade-in">
              <img src="/TwinsBollen.png" alt="TwinsBollen Logo" className="w-64 mx-auto object-contain select-none" />
              <p className="text-sm font-semibold text-gray-500 max-w-md mx-auto leading-relaxed">
                Kulit pastry renyah berpadu dengan isian melimpah khas TwinsDelight. 
                Tersedia rasa Cokelat, Keju, Cokelat-Keju, dan Tape.
              </p>

              {/* SLIDING IMAGE MARQUEE GALLERY */}
              <div className="w-full overflow-hidden space-y-4 my-6 select-none bg-white py-4">
                {/* ROW 1: SLIDE TO LEFT */}
                <div className="relative flex overflow-x-hidden w-full">
                  <div className="animate-marquee-left flex shrink-0 gap-4 pr-4">
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                  </div>
                  <div className="animate-marquee-left flex shrink-0 gap-4 pr-4" aria-hidden="true">
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                  </div>
                </div>

                {/* ROW 2: SLIDE TO RIGHT */}
                <div className="relative flex overflow-x-hidden w-full">
                  <div className="animate-marquee-right flex shrink-0 gap-4 pr-4">
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                  </div>
                  <div className="animate-marquee-right flex shrink-0 gap-4 pr-4" aria-hidden="true">
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_sliced.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                    <img src="/twins_bollen_pastry.png" className="w-40 h-40 object-cover rounded-none shrink-0" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    cancelEdit();
                    setIsFormOpen(true);
                  }}
                  className="btn-retro-primary text-md py-3 px-6 cursor-pointer"
                >
                  🛒 Mulai Pemesanan
                </button>
              </div>
            </section>
          )}


          {/* POP-UP MODAL INPUT PESANAN PEMBELI — hanya tampil saat bukan mode edit */}
          {isFormOpen && !editingOrderId && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="card-retro bg-white w-full max-w-md p-5 space-y-4 animate-fade-in relative my-8">
                <div className="flex justify-between items-center border-b-4 border-retro-dark border-dotted pb-3">
                  <h2 className="text-xl font-bold">
                    {editingOrderId ? 'Edit Detail Pesanan' : 'Form Pemesanan TwinsBollen'}
                  </h2>
                  <button 
                    onClick={() => {
                      cancelEdit();
                      setIsFormOpen(false);
                    }}
                    className="bg-red-500 text-white font-bold text-xs px-2.5 py-1 border-2 border-retro-dark rounded-md shadow-retro-sm active:translate-y-0.5 active:shadow-none cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  <div>
                    <label className="block text-sm font-bold mb-2">Nama Pemesan</label>
                    <input type="text" className="input-retro" placeholder="Misal: Kak Sarah" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Nomor WhatsApp</label>
                    <input type="text" className="input-retro" placeholder="Misal: 08123456789" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                  </div>

                  <div className="pt-4 border-t-4 border-retro-dark border-dotted mt-6">
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-bold">Detail Box</label>
                      <button onClick={addBox} className="bg-retro-orange text-retro-dark text-xs font-bold px-3 py-2 border-2 border-retro-dark rounded-xl shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all">
                        + Tambah Box
                      </button>
                    </div>

                    {boxes.map((box, index) => {
                      const isMixValid = box.mix?.flavor1 && box.mix?.flavor2 && box.mix?.flavor1 !== box.mix?.flavor2;
                      const boxPrice = getBoxPrice(box.flavor, box.mix);

                      return (
                        <div key={box.id} className="mb-4 p-4 bg-retro-bg border-2 border-retro-dark rounded-xl shadow-retro-sm transition-all duration-300">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-sm font-bold">Box {index + 1} <span className="text-xs font-semibold text-retro-blue">— Rp {(boxPrice/1000).toFixed(0)}k</span></p>
                            {boxes.length > 1 && (
                              <button onClick={() => removeBox(box.id)} className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 border-[1.5px] border-retro-dark rounded-md shadow-[2px_2px_0px_0px_#2B2A2A] active:translate-y-0.5 active:shadow-none">Hapus</button>
                            )}
                          </div>

                          <RetroSelect
                            options={flavorOptions}
                            value={box.flavor}
                            onChange={(val) => updateBoxFlavor(box.id, val)}
                          />

                          {box.flavor && box.flavor.startsWith('Box Mix') && (
                            <div className="mt-3 p-3 bg-white border-2 border-retro-dark rounded-xl animate-fade-in space-y-2">
                              <p className="text-xs font-bold text-gray-600">Pilih 2 rasa berbeda (masing-masing 4 pcs):</p>
                              <div>
                                <label className="text-[11px] font-bold text-gray-500 mb-1 block">Rasa 1 (4 pcs)</label>
                                <RetroSelect
                                  options={mixFlavorOptions}
                                  value={box.mix?.flavor1 || 'Cokelat'}
                                  onChange={(val) => updateMixFlavor(box.id, 'flavor1', val)}
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-bold text-gray-500 mb-1 block">Rasa 2 (4 pcs)</label>
                                <RetroSelect
                                  options={mixFlavorOptions.filter(o => o.value !== (box.mix?.flavor1 || 'Cokelat'))}
                                  value={box.mix?.flavor2 || 'Keju'}
                                  onChange={(val) => updateMixFlavor(box.id, 'flavor2', val)}
                                />
                              </div>
                              <div className="mt-2 text-center">
                                {isMixValid
                                  ? <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md border border-green-600">✓ 4 pcs {box.mix.flavor1} + 4 pcs {box.mix.flavor2}</span>
                                  : <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-md border border-red-500">Pilih 2 rasa berbeda</span>
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Metode Penerimaan</label>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMethod('pickup');
                          setCustomerAddress('Ambil Sendiri (TwinsDelight, Jl. Danau Sentani Utara II, Madyopuro, Kec. Kedungkandang, Kota Malang, Jawa Timur H3D19)');
                        }}
                        className={`py-2 px-3 text-xs font-bold border-2 border-retro-dark rounded-xl transition-all cursor-pointer shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 ${
                          deliveryMethod === 'pickup'
                            ? 'bg-retro-orange text-retro-dark'
                            : 'bg-white text-retro-dark hover:bg-retro-bg'
                        }`}
                      >
                        🛍️ Ambil Sendiri
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMethod('delivery');
                          setCustomerAddress('');
                        }}
                        className={`py-2 px-3 text-xs font-bold border-2 border-retro-dark rounded-xl transition-all cursor-pointer shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 ${
                          deliveryMethod === 'delivery'
                            ? 'bg-retro-orange text-retro-dark'
                            : 'bg-white text-retro-dark hover:bg-retro-bg'
                        }`}
                      >
                        🚚 Pengantaran
                      </button>
                    </div>

                    {deliveryMethod === 'pickup' ? (
                      <div className="bg-retro-bg p-3 border-2 border-retro-dark rounded-xl text-xs font-bold animate-fade-in">
                        <p className="text-retro-blue mb-1">📍 Alamat Pengambilan TwinsDelight:</p>
                        <p className="text-gray-700 font-semibold leading-relaxed">TwinsDelight, Jl. Danau Sentani Utara II, Madyopuro, Kec. Kedungkandang, Kota Malang, Jawa Timur H3D19</p>
                      </div>
                    ) : (
                      <div className="animate-fade-in">
                        <label className="block text-xs font-bold mb-1.5 text-gray-600">Alamat Pengiriman</label>
                        <textarea 
                          className="input-retro min-h-[70px] py-2 resize-none" 
                          placeholder="Masukkan alamat pengiriman lengkap Anda" 
                          value={customerAddress.startsWith('Ambil Sendiri') ? '' : customerAddress} 
                          onChange={(e) => setCustomerAddress(e.target.value)} 
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2">Tanggal Pengambilan</label>
                    <RetroDatePicker value={orderDate} onChange={(date) => setOrderDate(date)} />
                  </div>

                  {/* SUMMARY ESTIMASI HARGA */}
                  <div className="bg-retro-orange/20 border-2 border-retro-dark p-3 rounded-xl flex justify-between items-center text-xs font-bold mt-4">
                    <div>
                      <span className="text-gray-600 block">Total Pesanan: {boxes.length} Box</span>
                      <span className="text-[10px] text-gray-500 font-semibold">Harga final saat konfirmasi</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">Estimasi Total</span>
                      <span className="text-lg font-black text-retro-dark">
                        Rp {(boxes.reduce((sum, b) => sum + getBoxPrice(b.flavor, b.mix), 0)).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-2 border-t-2 border-retro-dark border-dashed">
                  {editingOrderId ? (
                    <>
                      <button
                        onClick={handleSaveOrder}
                        disabled={!isFormValid}
                        className={`flex-1 text-lg transition-all duration-300 cursor-pointer ${
                          isFormValid 
                            ? 'btn-retro-primary bg-retro-blue text-white' 
                            : 'bg-gray-300 text-gray-500 font-bold py-3 px-6 border-2 border-gray-400 rounded-xl cursor-not-allowed shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]'
                        }`}
                      >
                        Simpan Perubahan
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="bg-retro-orange text-retro-dark text-lg font-bold py-3 px-4 border-2 border-retro-dark rounded-xl shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleSaveOrder}
                      disabled={!isFormValid} 
                      className={`w-full text-lg transition-all duration-300 cursor-pointer ${isFormValid ? 'btn-retro-primary' : 'bg-gray-300 text-gray-500 font-bold py-3 px-6 border-2 border-gray-400 rounded-xl cursor-not-allowed shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]'}`}
                    >
                      {isFormValid ? 'Pesan Sekarang' : 'Lengkapi Form Pemesanan'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* POP-UP MODAL DETAIL RASA */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="card-retro bg-white w-full max-w-sm p-5 space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b-4 border-retro-dark border-dotted pb-3">
                  <div>
                    <h3 className="text-lg font-bold">{selectedOrder.name}</h3>
                    <p className="text-xs text-gray-500 font-bold">{selectedOrder.id} • {selectedOrder.date}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="bg-red-500 text-white font-bold text-xs px-2.5 py-1 border-2 border-retro-dark rounded-md shadow-retro-sm active:translate-y-0.5 active:shadow-none"
                  >
                    ✕
                  </button>
                </div>

                {selectedOrder.address && (
                  <div className="bg-retro-bg p-3 border-2 border-retro-dark rounded-xl text-xs font-bold leading-normal">
                    <p className="text-retro-blue mb-1">Alamat Pengiriman</p>
                    <p className="text-gray-700 font-semibold">📍 {selectedOrder.address}</p>
                  </div>
                )}

                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {selectedOrder.boxesDetail.map((box, idx) => (
                    <div key={idx} className="bg-retro-bg p-3 border-2 border-retro-dark rounded-xl text-xs font-bold">
                      <p className="text-retro-blue mb-1">Box {idx + 1}</p>
                      {box.flavor === 'Custom (Pilih Sendiri)' && box.custom ? (
                        <div>
                          <p className="font-bold text-retro-dark">Custom:</p>
                          <ul className="list-disc list-inside text-gray-600 font-semibold mt-1 space-y-0.5">
                            {box.custom.cokelat > 0 && <li>Cokelat: {box.custom.cokelat} pcs</li>}
                            {box.custom.keju > 0 && <li>Keju: {box.custom.keju} pcs</li>}
                            {box.custom.tape > 0 && <li>Tape: {box.custom.tape} pcs</li>}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-gray-700">{box.flavor}</p>
                      )}
                    </div>
                  ))}
                </div>

                <button onClick={() => setSelectedOrder(null)} className="btn-retro-primary w-full text-sm py-2">
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <footer className="text-center pt-8 pb-4 text-xs font-bold text-gray-400 select-none">
            <p>© 2026 TwinsDelight. All Rights Reserved.</p>
          </footer>
        </div>
      )}

      {/* ===== MODAL EDIT PESANAN — tampil di halaman admin ===== */}
      {isFormOpen && editingOrderId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="card-retro bg-white w-full max-w-md p-5 space-y-4 animate-fade-in relative my-8">
            <div className="flex justify-between items-center border-b-4 border-retro-dark border-dotted pb-3">
              <h2 className="text-xl font-bold">✏️ Edit Detail Pesanan</h2>
              <button 
                onClick={() => { cancelEdit(); setIsFormOpen(false); }}
                className="bg-red-500 text-white font-bold text-xs px-2.5 py-1 border-2 border-retro-dark rounded-md shadow-retro-sm active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-sm font-bold mb-2">Nama Pemesan</label>
                <input type="text" className="input-retro" placeholder="Misal: Kak Sarah" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Nomor WhatsApp</label>
                <input type="text" className="input-retro" placeholder="Misal: 08123456789" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              </div>

              <div className="pt-4 border-t-4 border-retro-dark border-dotted mt-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-bold">Detail Box</label>
                  <button onClick={addBox} className="bg-retro-orange text-retro-dark text-xs font-bold px-3 py-2 border-2 border-retro-dark rounded-xl shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all">
                    + Tambah Box
                  </button>
                </div>

                {boxes.map((box, index) => {
                  const isMixValid = box.mix?.flavor1 && box.mix?.flavor2 && box.mix?.flavor1 !== box.mix?.flavor2;
                  const boxPrice = getBoxPrice(box.flavor, box.mix);

                  return (
                    <div key={box.id} className="mb-4 p-4 bg-retro-bg border-2 border-retro-dark rounded-xl shadow-retro-sm transition-all duration-300">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm font-bold">Box {index + 1} <span className="text-xs font-semibold text-retro-blue">— Rp {(boxPrice/1000).toFixed(0)}k</span></p>
                        {boxes.length > 1 && (
                          <button onClick={() => removeBox(box.id)} className="text-[10px] font-bold text-white bg-red-500 px-2 py-1 border-[1.5px] border-retro-dark rounded-md shadow-[2px_2px_0px_0px_#2B2A2A] active:translate-y-0.5 active:shadow-none">Hapus</button>
                        )}
                      </div>

                      <RetroSelect
                        options={flavorOptions}
                        value={box.flavor}
                        onChange={(val) => updateBoxFlavor(box.id, val)}
                      />

                      {box.flavor && box.flavor.startsWith('Box Mix') && (
                        <div className="mt-3 p-3 bg-white border-2 border-retro-dark rounded-xl animate-fade-in space-y-2">
                          <p className="text-xs font-bold text-gray-600">Pilih 2 rasa berbeda (masing-masing 4 pcs):</p>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 mb-1 block">Rasa 1 (4 pcs)</label>
                            <RetroSelect
                              options={mixFlavorOptions}
                              value={box.mix?.flavor1 || 'Cokelat'}
                              onChange={(val) => updateMixFlavor(box.id, 'flavor1', val)}
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 mb-1 block">Rasa 2 (4 pcs)</label>
                            <RetroSelect
                              options={mixFlavorOptions.filter(o => o.value !== (box.mix?.flavor1 || 'Cokelat'))}
                              value={box.mix?.flavor2 || 'Keju'}
                              onChange={(val) => updateMixFlavor(box.id, 'flavor2', val)}
                            />
                          </div>
                          <div className="mt-2 text-center">
                            {isMixValid
                              ? <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md border border-green-600">✓ 4 pcs {box.mix.flavor1} + 4 pcs {box.mix.flavor2}</span>
                              : <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-md border border-red-500">Pilih 2 rasa berbeda</span>
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Metode Penerimaan</label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => { setDeliveryMethod('pickup'); setCustomerAddress('Ambil Sendiri (TwinsDelight, Jl. Danau Sentani Utara II, Madyopuro, Kec. Kedungkandang, Kota Malang, Jawa Timur H3D19)'); }}
                    className={`py-2 px-3 text-xs font-bold border-2 border-retro-dark rounded-xl transition-all cursor-pointer shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 ${deliveryMethod === 'pickup' ? 'bg-retro-orange text-retro-dark' : 'bg-white text-retro-dark hover:bg-retro-bg'}`}
                  >
                    🛍️ Ambil Sendiri
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeliveryMethod('delivery'); setCustomerAddress(''); }}
                    className={`py-2 px-3 text-xs font-bold border-2 border-retro-dark rounded-xl transition-all cursor-pointer shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 ${deliveryMethod === 'delivery' ? 'bg-retro-orange text-retro-dark' : 'bg-white text-retro-dark hover:bg-retro-bg'}`}
                  >
                    🚚 Pengantaran
                  </button>
                </div>

                {deliveryMethod === 'pickup' ? (
                  <div className="bg-retro-bg p-3 border-2 border-retro-dark rounded-xl text-xs font-bold animate-fade-in">
                    <p className="text-retro-blue mb-1">📍 Alamat Pengambilan TwinsDelight:</p>
                    <p className="text-gray-700 font-semibold leading-relaxed">TwinsDelight, Jl. Danau Sentani Utara II, Madyopuro, Kec. Kedungkandang, Kota Malang, Jawa Timur H3D19</p>
                  </div>
                ) : (
                  <div className="animate-fade-in">
                    <label className="block text-xs font-bold mb-1.5 text-gray-600">Alamat Pengiriman</label>
                    <textarea 
                      className="input-retro min-h-[70px] py-2 resize-none" 
                      placeholder="Masukkan alamat pengiriman lengkap" 
                      value={customerAddress.startsWith('Ambil Sendiri') ? '' : customerAddress} 
                      onChange={(e) => setCustomerAddress(e.target.value)} 
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Tanggal Pengambilan</label>
                <RetroDatePicker value={orderDate} onChange={(date) => setOrderDate(date)} />
              </div>

              {/* SUMMARY ESTIMASI HARGA */}
              <div className="bg-retro-orange/20 border-2 border-retro-dark p-3 rounded-xl flex justify-between items-center text-xs font-bold mt-4">
                <div>
                  <span className="text-gray-600 block">Total Pesanan: {boxes.length} Box</span>
                  <span className="text-[10px] text-gray-500 font-semibold">Estimasi Total Perubahan</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Total Harga</span>
                  <span className="text-lg font-black text-retro-dark">
                    Rp {(boxes.reduce((sum, b) => sum + getBoxPrice(b.flavor, b.mix), 0)).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-2 border-t-2 border-retro-dark border-dashed">
              <button
                onClick={handleSaveOrder}
                disabled={!isFormValid}
                className={`flex-1 text-lg transition-all duration-300 cursor-pointer ${
                  isFormValid 
                    ? 'btn-retro-primary bg-retro-blue text-white' 
                    : 'bg-gray-300 text-gray-500 font-bold py-3 px-6 border-2 border-gray-400 rounded-xl cursor-not-allowed shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]'
                }`}
              >
                Simpan Perubahan
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-retro-orange text-retro-dark text-lg font-bold py-3 px-4 border-2 border-retro-dark rounded-xl shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL DETAIL PESANAN — tampil dari manapun ===== */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card-retro bg-white w-full max-w-sm p-5 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b-4 border-retro-dark border-dotted pb-3">
              <div>
                <h3 className="text-lg font-bold">{selectedOrder.name}</h3>
                <p className="text-xs text-gray-500 font-bold">{selectedOrder.id} • {selectedOrder.date}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="bg-red-500 text-white font-bold text-xs px-2.5 py-1 border-2 border-retro-dark rounded-md shadow-retro-sm active:translate-y-0.5 active:shadow-none"
              >
                ✕
              </button>
            </div>

            {selectedOrder.address && (
              <div className="bg-retro-bg p-3 border-2 border-retro-dark rounded-xl text-xs font-bold leading-normal">
                <p className="text-retro-blue mb-1">Alamat Pengiriman</p>
                <p className="text-gray-700 font-semibold">📍 {selectedOrder.address}</p>
              </div>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {selectedOrder.boxesDetail.map((box, idx) => (
                <div key={idx} className="bg-retro-bg p-3 border-2 border-retro-dark rounded-xl text-xs font-bold">
                  <p className="text-retro-blue mb-1">Box {idx + 1}</p>
                  {box.flavor === 'Custom (Pilih Sendiri)' && box.custom ? (
                    <div>
                      <p className="font-bold text-retro-dark">Custom:</p>
                      <ul className="list-disc list-inside text-gray-600 font-semibold mt-1 space-y-0.5">
                        {box.custom.cokelat > 0 && <li>Cokelat: {box.custom.cokelat} pcs</li>}
                        {box.custom.keju > 0 && <li>Keju: {box.custom.keju} pcs</li>}
                        {box.custom.tape > 0 && <li>Tape: {box.custom.tape} pcs</li>}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-700">{box.flavor}</p>
                  )}
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedOrder(null)} className="btn-retro-primary w-full text-sm py-2">
              Tutup
            </button>
          </div>
        </div>
      )}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card-retro bg-white w-full max-w-sm p-6 space-y-4 relative">
            <div className="flex justify-between items-center border-b-4 border-retro-dark border-dotted pb-3">
              <h3 className="text-lg font-black">🔐 Login Penjual</h3>
              <button 
                onClick={handleCloseLogin}
                className="bg-red-500 text-white font-bold text-xs px-2.5 py-1 border-2 border-retro-dark rounded-md shadow-retro-sm active:translate-y-0.5 active:shadow-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loginError && (
              <div className="p-3 bg-red-100 border-2 border-red-500 text-red-700 text-xs font-bold rounded-lg animate-fade-in">
                ⚠️ {loginError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-600">Username</label>
                <input 
                  type="text" 
                  className="input-retro py-2 text-sm" 
                  placeholder="Masukkan username" 
                  value={loginUsername} 
                  onChange={(e) => setLoginUsername(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-gray-600">Password</label>
                <input 
                  type="password" 
                  className="input-retro py-2 text-sm" 
                  placeholder="Masukkan password" 
                  value={loginPassword} 
                  onChange={(e) => setLoginPassword(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLoginSubmit();
                  }}
                />
              </div>
            </div>

            <button 
              onClick={handleLoginSubmit}
              className="btn-retro-primary w-full text-sm py-2.5 cursor-pointer"
            >
              Masuk ke Dashboard
            </button>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* CONFIRM MODAL HAPUS PESANAN */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Hapus Pesanan?"
        message="Pesanan yang dihapus tidak dapat dikembalikan. Apakah kamu yakin ingin menghapus pesanan ini?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        confirmType="danger"
        onConfirm={confirmDeleteOrder}
        onCancel={() => setConfirmModal({ isOpen: false, orderId: null })}
      />
    </div>
  );
}

export default App;