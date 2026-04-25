import { Shield, Users, Heart } from "lucide-react";

const AboutSection = () => {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tentang Kami</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Geng Kubur ditubuhkan dengan misi untuk memudahkan waris menjaga dan memelihara pusara orang tersayang dengan penuh amanah dan tanggungjawab.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Amanah & Dipercayai</h3>
            <p className="text-gray-600">
              Setiap tugasan dilaksanakan dengan penuh tanggungjawab dan bukti bergambar akan diberikan.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Pasukan Terlatih</h3>
            <p className="text-gray-600">
              Petugas kami berpengalaman dalam kerja-kerja pembersihan dan penjagaan landskap kubur.
            </p>
          </div>

          <div className="text-center p-6 rounded-lg bg-gray-50 hover:bg-green-50 transition-colors">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Khidmat Sepenuh Hati</h3>
            <p className="text-gray-600">
              Kami memahami nilai sentimental pusara, justeru kami melakukannnya dengan penuh keikhlasan.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
