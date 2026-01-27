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
}

interface ReceiptProps {
  booking: Booking;
}

const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ booking }, ref) => {
  const additionalItemsTotal = booking.additional_items?.reduce((sum, item) => sum + item.price, 0) || 0;
  const totalAmount = booking.package_price + additionalItemsTotal;

  return (
    <div 
      ref={ref} 
      className="bg-white p-8 w-[210mm] min-h-[297mm] mx-auto text-black"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-12 border-b pb-8">
        <div className="flex items-center gap-4">
          {/* Placeholder for Logo - User can replace src later */}
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center border-2 border-primary">
            <span className="text-2xl font-bold text-primary">GK</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">GENGKUBUR</h1>
            <p className="text-sm text-gray-500 mt-1">Perkhidmatan Pembersihan & Penjagaan Kubur</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-4xl font-light text-gray-300 mb-2">RESIT</h2>
          <p className="font-mono text-gray-600">#{booking.order_id}</p>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString("ms-MY", { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Diterima Daripada</h3>
          <div className="bg-gray-50 p-6 rounded-xl">
            <p className="text-lg font-bold text-gray-900 mb-1">{booking.customer_name}</p>
            <p className="text-gray-600">{booking.phone_number}</p>
            <p className="text-gray-600 mt-2 text-sm">{booking.location}</p>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Butiran Pembayaran</h3>
          <div className="space-y-3">
            <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
              <span className="text-gray-600">Status</span>
              <span className="font-medium capitalize text-green-600">{booking.status}</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
              <span className="text-gray-600">Kaedah</span>
              <span className="font-medium">
                {(booking.payment_method === 'cash' || booking.notes?.includes('(Bayaran: Tunai)')) ? 'Tunai' : 'Online Transfer'}
              </span>
            </div>
            <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
              <span className="text-gray-600">Tarikh Tempahan</span>
              <span className="font-medium">
                {new Date(booking.created_at).toLocaleDateString("ms-MY")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mb-12">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-100">
              <th className="text-left py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Perkara</th>
              <th className="text-right py-4 text-sm font-bold text-gray-400 uppercase tracking-wider w-32">Harga</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            <tr>
              <td className="py-6">
                <p className="font-bold text-gray-900 text-lg mb-1">{booking.package_name}</p>
                <p className="text-gray-500 text-sm">{booking.notes || "Tiada catatan tambahan"}</p>
              </td>
              <td className="py-6 text-right font-medium text-gray-900">
                RM {booking.package_price.toFixed(2)}
              </td>
            </tr>
            {booking.additional_items?.map((item, index) => (
              <tr key={index}>
                <td className="py-6">
                  <p className="font-bold text-gray-900 text-lg mb-1">{item.description}</p>
                </td>
                <td className="py-6 text-right font-medium text-gray-900">
                  RM {item.price.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-8 text-right font-bold text-gray-900">Jumlah Besar</td>
              <td className="pt-8 text-right font-bold text-2xl text-primary">
                RM {totalAmount.toFixed(2)}
              </td>
            </tr>
            {booking.payment_balance && booking.payment_balance > 0 && (
              <tr>
                <td className="pt-2 text-right font-bold text-gray-500">Baki Perlu Dibayar</td>
                <td className="pt-2 text-right font-bold text-xl text-red-500">
                  RM {booking.payment_balance.toFixed(2)}
                </td>
              </tr>
            )}
          </tfoot>
        </table>
        
        {booking.admin_remarks && (
          <div className="mt-8 border-t pt-4">
             <h4 className="font-bold text-gray-900 mb-2">Catatan Admin:</h4>
             <p className="text-gray-600">{booking.admin_remarks}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-12 border-t border-gray-100">
        <div className="flex justify-between items-end">
          <div>
            <p className="font-bold text-gray-900 mb-2">Terima Kasih!</p>
            <p className="text-sm text-gray-500 max-w-sm">
              Kami menghargai kepercayaan anda menggunakan perkhidmatan GengKubur.
              Untuk sebarang pertanyaan, sila hubungi kami.
            </p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>GengKubur Services</p>
            <p>+60 17-330 4906</p>
          </div>
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";

export default Receipt;
