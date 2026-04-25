import { forwardRef } from "react";

interface Booking {
  id: string;
  created_at: string;
  customer_name: string;
  phone_number: string;
  location: string;
  notes: string | null;
  package_name: string;
  package_price: number;
  status: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  additional_items: { description: string; price: number }[] | null;
  admin_remarks: string | null;
  order_id: string;
  payment_balance: number | null;
  before_photo_url: string | null;
  after_photo_url: string | null;
}

interface ReceiptProps {
  booking: Booking;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ booking }, ref) => {
  const additionalItemsTotal = booking.additional_items?.reduce((sum, item) => sum + item.price, 0) || 0;
  const totalAmount = booking.package_price + additionalItemsTotal;
  const depositPaid = totalAmount - (booking.payment_balance || 0);

  return (
    <div 
      ref={ref} 
      className="bg-white p-8 sm:p-12 w-[210mm] min-h-[297mm] mx-auto text-black border shadow-sm relative flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Watermark / Logo Accent */}
      <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-primary/5 rounded-full blur-3xl z-0 pointer-events-none" />
      
      <div className="flex-1">
        {/* Header Section */}
        <div className="relative z-10 flex justify-between items-start mb-12 border-b-2 border-gray-100 pb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
              <span className="text-2xl sm:text-3xl font-black text-white">GK</span>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter uppercase italic">GENGKUBUR</h1>
              <p className="text-[10px] sm:text-sm font-bold text-primary tracking-[0.2em] uppercase mt-1">Perkhidmatan Profesional</p>
              <div className="flex items-center gap-3 mt-3 text-[10px] sm:text-xs text-gray-500 font-medium">
                <span>+60 17-330 4906</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>gengkubur@gmail.com</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-100 mb-2 uppercase tracking-tighter">RESIT</h2>
            <div className="inline-block bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-widest">
              #{booking.order_id}
            </div>
            <p className="text-[10px] sm:text-sm font-bold text-gray-500 mt-3 uppercase tracking-widest">
              {new Date().toLocaleDateString("ms-MY", { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-8 sm:gap-16 mb-12">
          <div>
            <h3 className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-3">PELANGGAN</h3>
            <div className="border-l-4 border-primary/20 pl-4 sm:pl-6 space-y-1 sm:space-y-2">
              <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{booking.customer_name}</p>
              <p className="text-base sm:text-lg font-medium text-gray-600 tracking-tight">{booking.phone_number}</p>
              <div className="flex items-start gap-2 mt-3 text-gray-500 max-w-[280px]">
                <span className="text-[10px] sm:text-xs leading-relaxed italic">"{booking.location}"</span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-3">PEMBAYARAN</h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest">Status</span>
                <span className="px-3 py-0.5 sm:px-4 sm:py-1 bg-green-50 text-green-700 text-[9px] sm:text-[10px] font-black uppercase rounded-full border border-green-200">
                  {booking.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest">Kaedah</span>
                <span className="text-xs sm:text-sm font-black text-gray-900 uppercase">
                  {(booking.payment_method === 'cash' || booking.notes?.includes('(Bayaran: Tunai)')) ? 'TUNAI' : 'ONLINE TRANSFER'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest">Tarikh</span>
                <span className="text-xs sm:text-sm font-black text-gray-900 uppercase">
                  {new Date(booking.created_at).toLocaleDateString("ms-MY")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="relative z-10 mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b-4 border-gray-900">
                <th className="text-left py-4 sm:py-6 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em]">KETERANGAN PERKHIDMATAN</th>
                <th className="text-right py-4 sm:py-6 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-[0.2em] w-32 sm:w-40">HARGA (RM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-6 sm:py-8">
                  <p className="text-lg sm:text-xl font-black text-gray-900 mb-1 sm:mb-2">{booking.package_name}</p>
                  <p className="text-[11px] sm:text-sm text-gray-500 font-medium italic">
                    {booking.notes?.replace('(Bayaran: Tunai)', '') || "Penyelenggaraan & Penjagaan Berkualiti"}
                  </p>
                </td>
                <td className="py-6 sm:py-8 text-right font-black text-lg sm:text-xl text-gray-900">
                  {booking.package_price.toFixed(2)}
                </td>
              </tr>
              {booking.additional_items?.map((item, index) => {
                const isDiscount = item.price < 0 || item.description.toLowerCase().includes('diskaun');
                return (
                  <tr key={index} className={isDiscount ? "bg-red-50/30" : ""}>
                    <td className="py-4 sm:py-6">
                      <p className={`text-base sm:text-lg font-bold ${isDiscount ? 'text-red-600 italic' : 'text-gray-900'}`}>
                        {item.description}
                      </p>
                    </td>
                    <td className={`py-4 sm:py-6 text-right font-bold text-base sm:text-lg ${isDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                      {item.price < 0 ? `- ${Math.abs(item.price).toFixed(2)}` : item.price.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Financial Summary */}
          <div className="mt-8 border-t-2 border-gray-900 pt-8">
            <div className="flex flex-col items-end gap-3 sm:gap-4">
              <div className="flex justify-between w-full max-w-[250px] sm:max-w-xs">
                <span className="text-[10px] sm:text-sm font-bold text-gray-400 uppercase tracking-widest">Jumlah Besar</span>
                <span className="text-lg sm:text-xl font-black text-gray-900">RM {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between w-full max-w-[250px] sm:max-w-xs text-green-600">
                <span className="text-[10px] sm:text-sm font-bold uppercase tracking-widest">Deposit Dibayar</span>
                <span className="text-lg sm:text-xl font-black">RM {depositPaid.toFixed(2)}</span>
              </div>
              {booking.payment_balance !== null && booking.payment_balance > 0 ? (
                <div className="flex justify-between w-full max-w-[250px] sm:max-w-xs p-3 sm:p-4 bg-red-50 rounded-xl border-2 border-red-100 mt-1 sm:mt-2">
                  <span className="text-[10px] sm:text-sm font-black text-red-600 uppercase tracking-widest">Baki Akhir</span>
                  <span className="text-xl sm:text-2xl font-black text-red-600">RM {booking.payment_balance.toFixed(2)}</span>
                </div>
              ) : (
                <div className="flex justify-between w-full max-w-[250px] sm:max-w-xs p-3 sm:p-4 bg-green-50 rounded-xl border-2 border-green-100 mt-1 sm:mt-2">
                  <span className="text-[10px] sm:text-sm font-black text-green-700 uppercase tracking-widest">Status Bayaran</span>
                  <span className="text-lg sm:text-xl font-black text-green-700">LUNAS</span>
                </div>
              )}
            </div>
          </div>
          
          {booking.admin_remarks && (
            <div className="mt-10 bg-gray-50 p-6 sm:p-8 rounded-2xl border-2 border-gray-100">
               <h4 className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-3">NOTA ADMIN</h4>
               <p className="text-gray-700 font-medium italic leading-relaxed text-xs sm:text-sm">"{booking.admin_remarks}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Signature & Footer */}
      <div className="mt-8 relative z-10 pt-10 border-t-2 border-gray-100 flex justify-between items-end pb-4">
        <div>
          <div className="mb-8 sm:mb-12">
            <div className="w-40 sm:w-48 h-16 sm:h-20 border-b-2 border-gray-200 relative">
               <span className="absolute bottom-2 left-0 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest italic">PENGURUSAN GENGKUBUR</span>
            </div>
            <p className="text-[9px] sm:text-xs font-bold text-gray-500 mt-2 sm:mt-3 uppercase tracking-widest">Tandatangan Rasmi</p>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight italic">Terima Kasih Atas Kepercayaan Anda.</p>
        </div>
        <div className="text-right space-y-1 sm:space-y-2">
          <p className="text-[10px] sm:text-sm font-black text-primary uppercase tracking-widest">GENGKUBUR SERVICES</p>
          <p className="text-[9px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest">Ampang, Selangor, Malaysia</p>
          <p className="text-[8px] sm:text-[9px] font-mono font-bold text-gray-400">gk-system-v2.0-resit</p>
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";

export default Receipt;
