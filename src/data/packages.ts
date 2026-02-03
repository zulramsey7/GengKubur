import { Package } from "@/types/booking";

export const packages: Package[] = [
  {
    id: "A",
    name: "Pakej A",
    price: 300,
    description: "Rumput Bahagian Atas Sahaja",
    features: [
      "Penanaman rumput bahagian atas",
      "Pembersihan kawasan",
      "Japanese Grass / Philippines Grass",
      "Penyelenggaraan asas 2 minggu"
    ],
  },
  {
    id: "B",
    name: "Pakej B",
    price: 350,
    description: "Rumput Atas dan Bawah",
    features: [
      "Penanaman rumput atas dan bawah",
      "Pembersihan menyeluruh",
      "Japanese Grass / Philippines Grass",
      "Penyelenggaraan lengkap 2 Minggu"
    ],
    popular: true,
  },
  {
    id: "C",
    name: "Pakej C",
    price: 450,
    description: "Rumput Atas, Bawah dan Cat",
    features: [
      "Penanaman rumput atas & bawah",
      "Pengecatan semula",
      "Japanese Grass / Philippines Grass",
      "Penyelenggaraan lengkap 2 Minggu"
    ],
  },
  {
    id: "D",
    name: "Pakej D",
    price: 250,
    description: "Upah Sahaja (Tidak Termasuk Barangan)",
    features: [
      "Khidmat tenaga kerja",
      "Pembersihan kawasan",
      "Barangan oleh pelanggan"
    ],
  },
  {
    id: "E",
    name: "Pakej E",
    price: 200,
    description: "Cat dan Kepok",
    features: [
      "Pengecatan kubur",
      "Pasang Kepok",
      "Tambah Tanah"
    ],
  },
  {
    id: "F",
    name: "Pakej F",
    price: 100,
    description: "Cat Sahaja",
    features: [
      "Pengecatan kubur",
      "Sentuhan semula warna",
      "Pembersihan ringkas"
    ],
  },
  {
    id: "G",
    name: "Pakej G",
    price: 150,
    description: "Siram Kubur Sebulan",
    features: [
      "Seminggu 4 Hari Siram",
      "Setiap Pagi Petang",
      "Pembersihan ringkas"
    ],
  },
  {
    id: "H",
    name: "Pakej H",
    price: 100,
    description: "Kepok sahaja",
    features: [
      "pasang kepok",
      "tambah tanah",
    ],
  },
  {
    id: "addon",
    name: "addon",
    price: 0,
    description: "addon",
    features: [
      "Pokok Jasmine Medium RM 38",
      "Pokok Jasmine Small RM 28",
      "Pokok Latana RM 20",
      "Batu Sungai Putih Besar RM 50",
      "Batu Sungai Putih Kecil RM 30"
    ],
  },
  {
    id: "custom",
    name: "Pakej Custom",
    price: 0,
    description: "Pakej Mengikut Permintaan Anda",
    features: [
      "Pilih servis yang anda mahukan",
      "Harga akan dikira oleh admin",
      "Fleksibel mengikut bajet",
      "Hubungi kami untuk perbincangan"
    ],
  },
];
