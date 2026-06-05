"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (res.ok) {
        // کوکی با موفقیت حذف شده است؛ کاربر به صفحه اصلی یا لاگین هدایت می‌شود
        router.push("/");
        router.refresh();
      } else {
        setError("خطایی در فرآیند خروج رخ داد. لطفا دوباره تلاش کنید.");
      }
    } catch (err) {
      setError("ارتباط با سرور برقرار نشد.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans p-6">
      {/* باکس مکسیمال/مینیمال با خطوط تیز و استایل گرید */}
      <div className="w-full max-w-md border border-zinc-900 bg-white p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 mb-2">
          خروج از حساب کاربری
        </h1>
        <p className="text-sm text-zinc-500 mb-8">
          آیا برای خارج شدن از سیستم و حذف نشست خود مطمئن هستید؟
        </p>

        {error && (
          <div className="mb-6 border border-red-900 bg-red-50 p-3 text-sm text-red-900">
            {error}
          </div>
        )}

        {/* گرید دکمه‌ها بدون هیچ‌گونه Border Radius */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => router.back()}
            disabled={isLoading}
            className="border border-zinc-300 bg-white py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
          >
            بازگشت
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="border border-zinc-950 bg-zinc-950 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "در حال خروج..." : "تایید خروج"}
          </button>
        </div>
      </div>
    </div>
  );
}