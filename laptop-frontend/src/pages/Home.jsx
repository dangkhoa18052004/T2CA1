import { useEffect, useState, useMemo } from 'react';
import { getFormOptions, runRecommendation } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Monitor, Zap, HardDrive, Filter, LayoutGrid, MemoryStick } from 'lucide-react';

export default function Home() {
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    mode: "advanced",
    usageProfile: '',
    budget: { min: 0, max: 200000000 },
    filters: {
      brandCode: null,
      cpuCode: null, 
      gpuCode: null, 
      minRamGb: 0,   // Đổi mặc định về 0 (Bất kỳ) để lấy được các máy RAM nhỏ
      minSsdGb: 0,   // Đổi mặc định về 0 (Bất kỳ) để không chặn các máy SSD 16, 32, 64
      screenSizeMin: 0,
      screenSizeMax: 99,
      maxWeightKg: 10,
      minBatteryHours: 0
    }
  });

  useEffect(() => {
    getFormOptions().then(res => {
      setOptions(res.data);
      if (res.data.usageProfiles?.length > 0) {
        setForm(prev => ({ ...prev, usageProfile: res.data.usageProfiles[0].code }));
      }
    }).catch(() => console.error("Lỗi kết nối Backend!"));
  }, []);

  // ==========================================
  // LOGIC ĐỒNG BỘ: RÀNG BUỘC RAM VÀ SSD
  // ==========================================
  const availableSSDs = useMemo(() => {
    const ram = form.filters.minRamGb;
    
    // ĐÃ BỔ SUNG ĐẦY ĐỦ CÁC MỨC SSD NHỎ
    const allSSDs = [
      { val: 0, label: "Bất kỳ dung lượng" },
      { val: 16, label: "Từ 16 GB" },
      { val: 32, label: "Từ 32 GB" },
      { val: 64, label: "Từ 64 GB" },
      { val: 128, label: "Từ 128 GB" },
      { val: 256, label: "Từ 256 GB" },
      { val: 512, label: "Từ 512 GB" },
      { val: 1000, label: "Từ 1 TB" },
      { val: 2000, label: "Từ 2 TB" }
    ];

    // Chặn yêu cầu vô lý dựa trên RAM
    if (ram === 4) {
      // RAM 4GB -> Chỉ cho phép SSD tối đa 512GB
      return allSSDs.filter(s => s.val <= 512);
    } 
    if (ram === 8) {
      // RAM 8GB -> Cho phép SSD tối đa 1TB
      return allSSDs.filter(s => s.val <= 1000);
    }
    
    // RAM >= 16GB hoặc Bất kỳ (0) -> Mở khóa toàn bộ SSD
    return allSSDs;
  }, [form.filters.minRamGb]);

  // Tự động Reset SSD nếu giá trị hiện tại không còn nằm trong danh sách hợp lệ
  useEffect(() => {
    const currentSsd = form.filters.minSsdGb;
    const isValid = availableSSDs.some(s => s.val === currentSsd);
    
    if (!isValid) {
      // Nếu không hợp lệ -> Reset về Bất kỳ (0)
      setForm(prev => ({ ...prev, filters: { ...prev.filters, minSsdGb: 0 } }));
    }
  }, [availableSSDs, form.filters.minSsdGb]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await runRecommendation(form);
      // Gửi data thành công sẽ chuyển sang trang Kết quả (Dashboard)
      navigate(`/dashboard/${res.data.session.sessionKey}`);
    } catch (err) {
      alert("Lỗi kết nối Backend! Hãy kiểm tra server.");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#06080a] text-white p-6 md:p-10 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-formula-red/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-formula-blue/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-14 pl-6 border-l-4 border-formula-red relative">
          <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Laptop Selector
          </h1>
          <p className="text-formula-red font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs mt-3 flex items-center gap-2">
            <Zap size={14} className="animate-pulse" /> Smart Hardware Validation
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* BƯỚC 1: CƠ BẢN */}
          <div className="lg:col-span-4 bg-[#0d1117]/80 backdrop-blur-md p-8 rounded-2xl border border-gray-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative overflow-hidden h-fit">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-formula-red to-transparent opacity-80"></div>
            <h2 className="text-formula-red font-black italic mb-8 uppercase flex items-center gap-3 text-lg">
              <LayoutGrid size={22} /> 01. Nhu cầu cơ bản
            </h2>
            
            <div className="space-y-7">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-wider">Mục đích sử dụng</label>
                <select value={form.usageProfile} onChange={e => setForm({...form, usageProfile: e.target.value})} className="w-full bg-black/40 text-white border border-gray-800 p-3.5 rounded-xl outline-none focus:border-formula-red transition-all cursor-pointer">
                  {options?.usageProfiles.map(p => <option key={p.code} value={p.code} className="bg-[#0d1117]">{p.name}</option>)}
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2 tracking-wider">Ngân sách tối đa</label>
                <select value={form.budget.max} onChange={e => setForm({...form, budget: {...form.budget, max: parseInt(e.target.value)}})} className="w-full bg-black/40 text-white border border-gray-800 p-3.5 rounded-xl outline-none focus:border-formula-red transition-all cursor-pointer font-mono">
                  <option value="200000000" className="bg-[#0d1117]">Không giới hạn (Bất kỳ)</option>
                  <option value="15000000" className="bg-[#0d1117]">Dưới 15 Triệu</option>
                  <option value="20000000" className="bg-[#0d1117]">Dưới 20 Triệu</option>
                  <option value="25000000" className="bg-[#0d1117]">Dưới 25 Triệu</option>
                  <option value="30000000" className="bg-[#0d1117]">Dưới 30 Triệu</option>
                  <option value="40000000" className="bg-[#0d1117]">Dưới 40 Triệu</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-3 tracking-wider">Hãng sản xuất</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => setForm({...form, filters: {...form.filters, brandCode: null}})} className={`py-3 px-1 text-[10px] font-bold uppercase rounded-xl transition-all ${form.filters.brandCode === null ? 'bg-gradient-to-br from-formula-red to-red-800 text-white shadow-[0_0_15px_rgba(225,6,0,0.4)] border border-red-500' : 'bg-black/30 border border-gray-800 text-gray-400 hover:border-gray-500'}`}>Tất cả</button>
                  {options?.brands.map(brand => (
                    <button key={brand.code} type="button" onClick={() => setForm({...form, filters: {...form.filters, brandCode: brand.code}})} className={`py-3 px-1 text-[10px] font-bold uppercase rounded-xl transition-all truncate ${form.filters.brandCode === brand.code ? 'bg-gradient-to-br from-formula-red to-red-800 text-white shadow-[0_0_15px_rgba(225,6,0,0.4)] border border-red-500' : 'bg-black/30 border border-gray-800 text-gray-400 hover:border-gray-500'}`}>
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* BƯỚC 2: CẤU HÌNH CHI TIẾT */}
          <div className="lg:col-span-8 bg-[#0d1117]/80 backdrop-blur-md p-8 rounded-2xl border border-gray-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.3)] relative flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-formula-blue to-transparent opacity-80"></div>
            
            <div>
              <h2 className="text-formula-blue font-black italic mb-8 uppercase flex items-center gap-3 text-lg">
                <Filter size={22} /> 02. Yêu cầu phần cứng
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                
                {/* Cột Trái: Bộ nhớ */}
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-3"><MemoryStick size={12} className="inline mr-1 text-formula-blue"/> Dung lượng RAM</label>
                    <select 
                      value={form.filters.minRamGb} 
                      onChange={e => setForm({...form, filters: {...form.filters, minRamGb: parseInt(e.target.value)}})} 
                      className="w-full bg-black/40 text-white border border-gray-800 p-4 rounded-xl outline-none focus:border-formula-blue cursor-pointer text-center font-mono text-sm"
                    >
                      <option value="0" className="bg-[#0d1117]">Bất kỳ</option>
                      <option value="4" className="bg-[#0d1117]">Từ 4 GB (Tối thiểu)</option>
                      <option value="8" className="bg-[#0d1117]">Từ 8 GB (Cơ bản)</option>
                      <option value="16" className="bg-[#0d1117]">Từ 16 GB (Khuyên dùng)</option>
                      <option value="24" className="bg-[#0d1117]">Từ 24 GB (Nâng cao)</option>
                      <option value="32" className="bg-[#0d1117]">Từ 32 GB (Chuyên nghiệp)</option>
                      <option value="64" className="bg-[#0d1117]">Từ 64 GB (Tối đa)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase flex justify-between items-center mb-3">
                      <span><HardDrive size={12} className="inline mr-1 text-formula-blue"/> Ổ cứng SSD</span>
                      {form.filters.minRamGb <= 8 && form.filters.minRamGb > 0 && (
                        <span className="text-[8px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 italic">
                          Giới hạn theo RAM
                        </span>
                      )}
                    </label>
                    <select 
                      value={form.filters.minSsdGb} 
                      onChange={e => setForm({...form, filters: {...form.filters, minSsdGb: parseInt(e.target.value)}})} 
                      className="w-full bg-black/40 text-white border border-gray-800 p-4 rounded-xl outline-none focus:border-formula-blue cursor-pointer text-center font-mono text-sm"
                    >
                      {availableSSDs.map(ssd => (
                        <option key={ssd.val} value={ssd.val} className="bg-[#0d1117]">
                          {ssd.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cột Phải: Vật lý & Màn hình */}
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1.5 mb-3"><Monitor size={12} className="text-formula-blue"/> Kích thước Màn hình</label>
                    <select onChange={e => { const [min, max] = e.target.value.split('-').map(Number); setForm({...form, filters: {...form.filters, screenSizeMin: min, screenSizeMax: max}}); }} className="w-full bg-black/40 text-white border border-gray-800 p-4 rounded-xl outline-none focus:border-formula-blue cursor-pointer text-center text-sm">
                      <option value="0-99" className="bg-[#0d1117]">Bất kỳ kích thước</option>
                      <option value="13.0-14.5" className="bg-[#0d1117]">Nhỏ gọn (13" - 14.5")</option>
                      <option value="15.0-16.0" className="bg-[#0d1117]">Tiêu chuẩn (15" - 16")</option>
                      <option value="16.1-99" className="bg-[#0d1117]">Lớn (16" trở lên)</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-3"><HardDrive size={10} className="inline mr-1"/>Trọng lượng</label>
                      <select value={form.filters.maxWeightKg} onChange={e => setForm({...form, filters: {...form.filters, maxWeightKg: parseFloat(e.target.value)}})} className="w-full bg-black/40 text-white border border-gray-800 p-3.5 rounded-xl outline-none focus:border-gray-500 cursor-pointer text-center text-xs">
                        <option value="10" className="bg-[#0d1117]">Bất kỳ</option>
                        <option value="1.5" className="bg-[#0d1117]">Siêu nhẹ &lt; 1.5 Kg</option>
                        <option value="2.0" className="bg-[#0d1117]">Vừa phải &lt; 2.0 Kg</option>
                        <option value="2.5" className="bg-[#0d1117]">Phổ thông &lt; 2.5 Kg</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase block mb-3"><Zap size={10} className="inline mr-1"/>Pin tối thiểu</label>
                      <select value={form.filters.minBatteryHours} onChange={e => setForm({...form, filters: {...form.filters, minBatteryHours: parseInt(e.target.value)}})} className="w-full bg-black/40 text-white border border-gray-800 p-3.5 rounded-xl outline-none focus:border-gray-500 cursor-pointer text-center text-xs">
                        <option value="0" className="bg-[#0d1117]">Bất kỳ</option>
                        <option value="4" className="bg-[#0d1117]">&gt; 4 giờ</option>
                        <option value="6" className="bg-[#0d1117]">&gt; 6 giờ</option>
                        <option value="8" className="bg-[#0d1117]">&gt; 8 giờ</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button disabled={loading} className="group relative w-full mt-12 bg-formula-red text-white font-black py-5 rounded-xl uppercase italic tracking-[0.2em] overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(225,6,0,0.6)] active:scale-95 disabled:opacity-70">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                {loading ? "ĐANG TIẾN HÀNH LỌC DỮ LIỆU..." : <><Zap size={20} /> KIẾN TẠO CẤU HÌNH</>}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}