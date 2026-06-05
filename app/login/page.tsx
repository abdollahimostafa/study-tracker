"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", { // مطمئن شو مسیر API درست است
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // انتقال به داشبورد پس از موفقیت
        router.push("/");
        router.refresh();
      } else {
        setError(data.error || "ورود ناموفق بود");
      }
    } catch (err) {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-[#2C2A27] flex flex-col justify-center items-center p-6" dir="rtl">
      <div className="w-full max-w-md bg-white border border-[#EAE8E2] p-8 shadow-sm relative">
        {/* خط تزیینی بالای کارت - وفادار به متد مینی‌مال */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#2C2A27]" />

        {/* هدر مینی‌مال */}
        <div className="mb-8 text-center md:text-right">
          <span className="text-[10px] font-bold tracking-widest text-neutral-400 block uppercase mb-1">
            RESIDENCY JOURNAL SYSTEM
          </span>
          <h2 className="text-xl font-black text-[#1C1B19]">احراز هویت اعضا</h2>
          <p className="text-xs text-neutral-400 mt-1.5 font-medium">لطفاً نام کاربری خود را جهت ورود به میز مطالعه وارد کنید.</p>
        </div>

        {/* فرم ورود */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
              نام کاربری
            </label>
            <input
              type="text"
              placeholder="Saghar or Mostafa"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
              className="w-full p-4 bg-[#FBFBFA] border border-[#EAE8E2] focus:border-[#2C2A27] font-mono text-left text-sm font-bold focus:outline-none transition-all placeholder:text-neutral-300"
              style={{ borderRadius: "0px" }} // ساختار کاملاً جعبه‌ای
              autoFocus
            />
          </div>

          {/* نمایش خطا با لایه انیمیشنی تمیز */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="bg-red-50 border-r-2 border-red-500 p-3 flex items-center gap-2 text-red-700 text-xs font-bold"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* دکمه سابمیت ریجید و مینی‌مال */}
          <button
            type="submit"
            disabled={isLoading || !username.trim()}
            className="w-full p-4 bg-[#2C2A27] hover:bg-neutral-800 text-white text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderRadius: "0px" }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال تایید دسترسی...</span>
              </>
            ) : (
              <span>ورود به پرتال</span>
            )}
          </button>
        </form>
      </div>

      {/* فوتر مینی‌مال پایینی */}
      <span className="text-[10px] text-neutral-400 font-mono mt-6 tracking-wide opacity-60">
        SECURE SESSION · CLIENT INTERFACE V1.0
      </span>
    </div>
  );
}