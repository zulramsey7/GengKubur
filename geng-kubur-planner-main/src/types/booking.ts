export interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface BookingDetails {
  customerName: string;
  phoneNumber: string;
  location: string;
  selectedPackage: Package | null;
  notes?: string;
}

export interface OrderSummary extends BookingDetails {
  orderId: string;
  orderDate: string;
  totalAmount: number;
}
