import React from 'react';
import RetroSelect from '../components/ui/RetroSelect';
import RetroDatePicker from '../components/ui/RetroDatePicker';

export default function AdminDashboard({
  orders,
  fetchOrders,
  totals,
  formatDateDisplay,
  getWhatsAppLink,
  toggleOrderStatus,
  deleteOrder,
  startEditOrder,
  editingOrderId,
  handleLogout,
  handleShareWhatsApp,
  productionDateFilter,
  setProductionDateFilter,
  customProductionDate,
  setCustomProductionDate,
  activeCategory,
  setActiveCategory,
  setSelectedOrder,
  getOrderFlavorSummary
}) {
  return (
    <div className="w-full max-w-4xl space-y-6 pb-20 animate-fade-in">
      {/* HEADER FOR ADMIN */}
      <header className="card-retro p-4 relative flex flex-col sm:flex-row justify-center items-center gap-3">
        <div className="flex justify-center items-center select-none w-full">
          <img src="/TwinsDelight-Logo.png" alt="TwinsDelight Logo" className="w-80 h-40 object-contain animate-fade-in" />
        </div>
        
        <button
          onClick={handleLogout}
          className="sm:absolute sm:right-6 sm:top-1/2 sm:-translate-y-1/2 px-3.5 py-1.5 bg-red-500 text-white text-xs font-black rounded-lg border-2 border-retro-dark shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer select-none"
        >
          🚪 Keluar Admin
        </button>
      </header>

      {/* CATEGORY SWITCHER */}
      <div className="grid grid-cols-3 gap-2 bg-retro-bg border-2 border-retro-dark rounded-xl p-1 shadow-retro-sm select-none">
        {[
          { id: 'twinsbollen', label: <img src="/TwinsBollen.png" alt="TwinsBollen" className="h-12 mx-auto object-contain" /> },
          { id: 'twinsdonut', label: '🍩 TwinsDonut' },
          { id: 'twinscake', label: '🍰 TwinsCake' }
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`py-2 text-xs font-black rounded-lg transition-all cursor-pointer border-2 flex items-center justify-center ${
              activeCategory === cat.id
                ? 'bg-retro-orange text-retro-dark shadow-retro-sm border-retro-dark'
                : 'text-retro-dark border-transparent hover:bg-white/50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {activeCategory === 'twinsbollen' ? (
        <>
          {/* FILTER TANGGAL PRODUKSI */}
          <section className="card-retro p-4 bg-white space-y-3 animate-fade-in">
            <h2 className="text-sm font-bold text-gray-500 select-none">Filter Rekap Produksi</h2>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'TODAY', label: 'Hari Ini' },
                { id: 'TOMORROW', label: 'Besok' },
                { id: 'CUSTOM', label: 'Custom' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setProductionDateFilter(tab.id)}
                  className={`py-2 px-1 text-xs font-bold border-2 border-retro-dark rounded-xl transition-all cursor-pointer shadow-retro-sm active:translate-y-0.5 active:shadow-none ${
                    productionDateFilter === tab.id
                      ? 'bg-retro-blue text-white'
                      : 'bg-white text-retro-dark hover:bg-retro-bg'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {productionDateFilter === 'CUSTOM' && (
              <div className="pt-2 animate-fade-in">
                <label className="block text-xs font-bold mb-1.5 text-gray-600">Pilih Tanggal Produksi:</label>
                <RetroDatePicker value={customProductionDate} onChange={(date) => setCustomProductionDate(date)} />
              </div>
            )}
          </section>

          {/* BENTO GRID: REKAP PRODUKSI KESELURUHAN */}
          <section className="space-y-3 animate-fade-in">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xl font-bold">Total Target Produksi</h2>
              <button
                onClick={handleShareWhatsApp}
                className="bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-bold py-1.5 px-3 border-2 border-retro-dark rounded-xl shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.504-5.714-1.465L0 24zm6.59-4.846c1.6.95 3.198 1.451 4.797 1.452 5.482 0 9.94-4.46 9.943-9.94.002-2.654-1.031-5.148-2.909-7.026-1.879-1.878-4.372-2.91-7.026-2.913-5.485 0-9.94 4.46-9.943 9.94-.001 1.904.509 3.761 1.482 5.395l-.974 3.565 3.63-.952zm10.934-7.505c-.328-.164-1.942-.959-2.242-1.069-.3-.11-.518-.165-.736.164-.218.328-.844 1.069-1.034 1.288-.19.219-.38.247-.708.083-.328-.164-1.385-.51-2.64-1.627-.977-.872-1.637-1.95-1.828-2.278-.19-.328-.02-.505.145-.669.148-.148.328-.383.491-.575.163-.192.218-.328.327-.547.11-.219.055-.411-.027-.575-.082-.164-.736-1.776-1.008-2.434-.266-.643-.56-.554-.766-.564-.197-.01-.424-.012-.65-.012-.226 0-.594.085-.904.425-.31.339-1.185 1.161-1.185 2.83 0 1.67 1.218 3.28 1.385 3.507.167.227 2.392 3.653 5.795 5.123.809.35 1.442.559 1.933.715.813.258 1.554.222 2.138.135.652-.097 1.942-.794 2.215-1.56.272-.767.272-1.423.19-1.56-.081-.137-.299-.219-.627-.383z"/>
                </svg>
                Kirim Rekap WA
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="card-retro p-4 flex flex-col justify-center items-center">
                <span className="text-sm font-bold">Total Box</span>
                <span className="text-4xl font-bold text-retro-orange mt-1">{totals.totalBox}</span>
              </div>
              <div className="card-retro p-4 bg-retro-blue text-white flex flex-col justify-center items-center border-retro-dark">
                <span className="text-sm font-bold">Total Pcs</span>
                <span className="text-4xl font-bold mt-1">{totals.totalPcs}</span>
              </div>
              <div className="card-retro p-4 col-span-2 flex justify-around">
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-500">Cokelat</p>
                  <p className="font-bold text-xl">{totals.cokelat}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-500">Keju</p>
                  <p className="font-bold text-xl">{totals.keju}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-500">Tape</p>
                  <p className="font-bold text-xl">{totals.tape}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ORDER HISTORY SECTION */}
          <section className="space-y-4 pt-4 animate-fade-in">
            <h2 className="text-xl font-bold px-1">Riwayat Pesanan ({orders.length})</h2>

            {/* 1. MOBILE CARDS */}
            <div className="flex flex-col gap-4 md:hidden">
              {orders.map((order) => (
                <div key={order.id} className="card-retro p-4 bg-white">
                  <div className="flex justify-between items-center border-b-2 border-retro-dark pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg">{order.name}</h3>
                        {order.phone && (
                          <a 
                            href={getWhatsAppLink(order.phone)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#25D366] transition-colors inline-flex items-center gap-0.5 shadow-[1px_1px_0px_0px_#2B2A2A] active:translate-y-0.5 select-none"
                          >
                            💬 WA
                          </a>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-gray-500">
                        {order.id} {order.phone && `• ${order.phone}`}
                      </p>
                    </div>
                    <button 
                      onClick={() => toggleOrderStatus(order.id)}
                      className={`text-xs font-bold px-3 py-1 rounded-lg border-2 border-retro-dark shadow-retro-sm transition-all cursor-pointer ${order.status === 'Menunggu' ? 'bg-retro-orange text-retro-dark' : 'bg-green-400 text-retro-dark'}`}
                    >
                      {order.status}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400 uppercase select-none">Tanggal Pengambilan:</span>
                      <span className="text-retro-blue">📅 {formatDateDisplay(order.date)}</span>
                    </div>

                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-gray-400 uppercase select-none">Total Jumlah:</span>
                      <span className="bg-retro-bg px-2 py-0.5 border border-retro-dark rounded-md">{order.totalBoxes} Box</span>
                    </div>

                    <div className="bg-retro-bg/40 p-2.5 border border-retro-dark rounded-xl text-xs">
                      <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase select-none">Rincian Rasa:</span>
                      {getOrderFlavorSummary(order.boxesDetail)}
                    </div>

                    {order.address && (
                      <div className="bg-retro-bg/30 p-2.5 border-2 border-retro-dark border-dotted rounded-lg mb-3 text-xs leading-normal">
                        <span className="text-[10px] font-bold text-gray-400 block mb-1 uppercase select-none">Metode & Alamat:</span>
                        <span className="font-semibold text-gray-600">
                          {order.address.startsWith('Ambil Sendiri') 
                            ? '🛍️ Ambil Sendiri (Ruko TwinsDelight, Jl. Delis No. 12, Jakarta)' 
                            : `🚚 Pengantaran: ${order.address}`}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 mt-3">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="w-full py-2 bg-retro-bg text-retro-dark text-xs font-bold border-2 border-retro-dark rounded-lg shadow-retro-sm hover:translate-y-0.5 transition-all cursor-pointer"
                      >
                        Lihat Detail Rasa
                      </button>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => startEditOrder(order)}
                          className={`flex-1 py-2 text-xs font-bold border-2 border-retro-dark rounded-lg shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer ${editingOrderId === order.id ? 'bg-retro-blue text-white' : 'bg-retro-orange text-retro-dark'}`}
                        >
                          {editingOrderId === order.id ? 'Mengedit' : 'Edit'}
                        </button>
                        <button 
                          onClick={() => deleteOrder(order.id)}
                          className="flex-1 py-2 bg-red-500 text-white text-xs font-bold border-2 border-retro-dark rounded-lg shadow-retro-sm hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. LAPTOP TABLE */}
            <div className="hidden md:block card-retro p-4 bg-white overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-4 border-retro-dark text-xs font-bold uppercase tracking-wider text-gray-600 select-none">
                    <th className="pb-3">ID / Tanggal</th>
                    <th className="pb-3">Nama Pemesan</th>
                    <th className="pb-3">Total Box</th>
                    <th className="pb-3">Detail Rasa</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100 font-bold text-sm">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-retro-bg/50 transition-colors">
                      <td className="py-3">
                        <span className="block text-retro-blue">{order.id}</span>
                        <span className="text-xs text-gray-500">{order.date}</span>
                      </td>
                      <td className="py-3">
                        <div className="font-bold">{order.name}</div>
                        {order.phone && (
                          <a 
                            href={getWhatsAppLink(order.phone)} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:text-green-700 font-semibold inline-flex items-center gap-1 mt-0.5 transition-colors"
                          >
                            <span>💬</span> <span>{order.phone}</span>
                          </a>
                        )}
                        {order.address && (
                          <div className="text-xs text-gray-500 font-normal mt-1 leading-normal max-w-xs break-words">
                            {order.address.startsWith('Ambil Sendiri') 
                              ? '🛍️ Ambil Sendiri (Ruko TwinsDelight)' 
                              : `🚚 Pengantaran: ${order.address}`}
                          </div>
                        )}
                      </td>
                      <td className="py-3">{order.totalBoxes} Box</td>
                      <td className="py-3">{getOrderFlavorSummary(order.boxesDetail)}</td>
                      <td className="py-3">
                        <button 
                          onClick={() => toggleOrderStatus(order.id)}
                          className={`text-xs px-2.5 py-1 rounded-md border-2 border-retro-dark font-bold cursor-pointer transition-all ${order.status === 'Menunggu' ? 'bg-retro-orange text-retro-dark' : 'bg-green-400 text-retro-dark'}`}
                        >
                          {order.status}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1 bg-retro-blue text-white text-xs rounded-lg border-2 border-retro-dark shadow-retro-sm hover:translate-y-0.5 cursor-pointer"
                          >
                            Detail
                          </button>
                          <button 
                            onClick={() => startEditOrder(order)}
                            className={`px-3 py-1 text-xs rounded-lg border-2 border-retro-dark shadow-retro-sm hover:translate-y-0.5 cursor-pointer ${editingOrderId === order.id ? 'bg-retro-blue text-white' : 'bg-retro-orange text-retro-dark'}`}
                          >
                            {editingOrderId === order.id ? 'Mengedit' : 'Edit'}
                          </button>
                          <button 
                            onClick={() => deleteOrder(order.id)}
                            className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg border-2 border-retro-dark shadow-retro-sm hover:translate-y-0.5 cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="card-retro p-8 bg-white text-center space-y-4 animate-fade-in">
          <div className="text-5xl select-none">
            {activeCategory === 'twinsdonut' ? '🍩' : '🍰'}
          </div>
          <h2 className="text-2xl font-black capitalize">
            {activeCategory === 'twinsdonut' ? 'TwinsDonut' : 'TwinsCake'} Coming Soon!
          </h2>
          <p className="text-sm font-semibold text-gray-500 max-w-md mx-auto leading-relaxed">
            Fitur rekap target adonan, filter tanggal produksi harian, dan pencatatan pesanan khusus untuk {activeCategory === 'twinsdonut' ? 'TwinsDonut' : 'TwinsCake'} sedang dalam pengembangan.
          </p>
          <div className="pt-2 text-xs font-bold text-retro-blue uppercase tracking-wider animate-pulse">
            ✨ Menunggu Peluncuran Dapur...
          </div>
        </section>
      )}
    </div>
  );
}
