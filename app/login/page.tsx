"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOPICS = [
   "جراحی", "اطفال", "زنان", 
   "داخلی - قلب", "داخلی - روماتولوژی", "داخلی - ریه", "داخلی - گوارش", "داخلی - نفرولوژی", "داخلی - غدد",
   "داخلی - هماتولوژی","ارتوپدی","ارولوژی","پوست","پاتولوژی",
  "روانپزشکی", "عفونی", "نورولوژی", "چشم", 
  "فارماکولوژی", "ENT", " رادیو", "آمار و اپیدمی",
  "صلاحیت بالینی", "QA"
];

const WEEK_DAYS = [
  { id: 6, name: "شنبه" },
  { id: 0, name: "یکشنبه" },
  { id: 1, name: "دوشنبه" },
  { id: 2, name: "سه‌شنبه" },
  { id: 3, name: "چهارشنبه" },
  { id: 4, name: "پنج‌شنبه" },
  { id: 5, name: "جمعه" },
];

const toPersianDigits = (num: string | number) => {
  const id = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
  const pd = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/[0-9]/g, (w) => pd[id.indexOf(w)]);
};

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<"mostafa" | "saghar" | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "add" | "overview" | "weeks">("history");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [hours, setHours] = useState("");
  const [note, setNote] = useState(""); 
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0); 
  const [isSubmitting, setIsSubmitting] = useState(false); // جلوگیری از دبل‌کلیک و ریکوئست همزمان
  
  const [logs, setLogs] = useState<any[]>([]);
  const [weekPerformance, setWeekPerformance] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [streak, setStreak] = useState(0);
  const [currentWeekTotal, setCurrentWeekTotal] = useState(0);
  const [last4Weeks, setLast4Weeks] = useState<any[]>([]);

  const [opponentToday, setOpponentToday] = useState(0);
  const [opponentWeek, setOpponentWeek] = useState(0);

  const fetchDatabaseData = async (user: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/study-logs?user=${user}`, { cache: "no-store" });
      const opponent = user === "mostafa" ? "saghar" : "mostafa";
      const resOpponent = await fetch(`/api/study-logs?user=${opponent}`, { cache: "no-store" });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setWeekPerformance(data.performance || []);
        setStreak(data.streak || 0);
        setCurrentWeekTotal(data.currentWeekTotal || 0);
        setLast4Weeks(data.last4Weeks || []);
      }

      if (resOpponent.ok) {
        const opponentData = await resOpponent.json();
        setOpponentToday(opponentData.todayTotal || 0);
        setOpponentWeek(opponentData.currentWeekTotal || 0);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user === "mostafa" || data.user === "saghar") {
            setCurrentUser(data.user);
            fetchDatabaseData(data.user);
            return;
          }
        }
        setCurrentUser("mostafa");
        fetchDatabaseData("mostafa");
      } catch (err) {
        console.error("Auth verification failed:", err);
        setCurrentUser("mostafa");
        fetchDatabaseData("mostafa");
      }
    };
    checkAuth();
  }, []);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !hours || !currentUser || isSubmitting) return;

    setIsSubmitting(true); // قفل کردن دکمه فرم

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + selectedDayOffset);

    try {
      const res = await fetch("/api/study-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedTopic,
          hours: hours,
          note: note.trim(), 
          user: currentUser,
          customDate: targetDate.toISOString()
        }),
      });

      if (res.ok) {
        setSelectedTopic("");
        setHours("");
        setNote(""); 
        setSelectedDayOffset(0);
        setActiveTab("history");
        await fetchDatabaseData(currentUser);
      } else {
        alert("خطا در ثبت اطلاعات روی سرور دیتابیس");
      }
    } catch (err) {
      console.error("API submission failed:", err);
    } finally {
      setIsSubmitting(false); // باز کردن مجدد قفل دکمه در پایان عملیات
    }
  };

  const quickAddHours = (amount: number) => {
    const current = parseFloat(hours) || 0;
    setHours((current + amount).toString());
  };

  const todayTotalHours = logs.reduce((sum, log) => {
    const logDate = new Date(log.createdAt).toDateString();
    const todayDate = new Date().toDateString();
    return logDate === todayDate ? sum + (parseFloat(log.hours) || 0) : sum;
  }, 0);

  const getAvailableDaysToRegister = () => {
    const days = [];
    const today = new Date();
    const currentDayOfWeek = today.getDay(); 
    const stepsFromSaturday = currentDayOfWeek === 6 ? 0 : currentDayOfWeek + 1;

    for (let i = stepsFromSaturday; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dayName = WEEK_DAYS.find(wd => wd.id === d.getDay())?.name || "";
      days.push({
        label: i === 0 ? "امروز" : i === 1 ? "دیروز" : dayName,
        offset: -i,
        dateString: d.toDateString()
      });
    }
    return days.reverse(); 
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F9F8F4] flex flex-col items-center justify-center font-sans" dir="rtl">
        <div className="w-8 h-8 border-2 border-[#2C2A27] border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs text-neutral-400 font-medium tracking-wide">در حال بررسی دسترسی...</span>
      </div>
    );
  }

  const isMostafa = currentUser === "mostafa";
  const userColorClass = isMostafa ? "bg-[#0D5236]" : "bg-[#ef89b2]";
  const userTextColorClass = isMostafa ? "text-[#0D5236]" : "text-[#ef89b2]";
  const userBgLightClass = isMostafa ? "bg-[#0D5236]/10" : "bg-[#ef89b2]/10";

  const opponentName = isMostafa ? "ساغر" : "مصطفی";
  const opponentColorClass = isMostafa ? "bg-[#DB2777]" : "bg-[#c68b87]";
  const opponentTextColorClass = isMostafa ? "text-[#DB2777]" : "text-[#c68b87]";
  const opponentBgLightClass = isMostafa ? "bg-[#DB2777]/10" : "bg-[#c68b87]/10";

  const getTileBg = (hrs: number) => {
    if (hrs === 0) return "bg-neutral-100 text-neutral-400";
    if (hrs < 4) return isMostafa ? "bg-[#0D5236]/15 text-[#0D5236]" : "bg-[#c68b87]/15 text-[#c68b87]";
    if (hrs < 7) return isMostafa ? "bg-[#0D5236]/40 text-[#0D5236]" : "bg-[#c68b87]/40 text-[#c68b87]";
    return isMostafa ? "bg-[#0D5236] text-white" : "bg-[#c68b87] text-white";
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4] text-[#2C2A27] flex flex-col relative pb-36" dir="rtl">
      
      <header className="p-6 flex justify-between items-center bg-white/70 backdrop-blur-md sticky top-0 z-10 max-w-md mx-auto w-full border-b border-[#EAE8E2]/60">
        <div>
          <span className="text-[9px] font-bold tracking-widest text-neutral-400 block uppercase">RESIDENCY JOURNAL</span>
          <h1 className="text-lg font-bold text-[#1C1B19] mt-0.5">میز مطالعه من</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isLoading && (
            <div className={`text-[11px] font-bold px-3 py-1 rounded-full transition-all ${userBgLightClass} ${userTextColorClass}`}>
              {isMostafa ? "مصطفی" : "ساغر"}
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow p-5 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HISTORY & PERFORMANCE */}
          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className={`w-6 h-6 border-2 border-t-transparent rounded-full animate-spin ${userTextColorClass}`} />
                </div>
              ) : (
                <>
                  <div className="bg-white p-5 border border-[#EAE8E3]/80 relative overflow-hidden flex justify-between items-center">
                    <div className={`absolute top-0 right-0 w-2 h-full ${userColorClass}`} />
                    <div>
                      <span className="text-xs font-medium text-neutral-400 block">میزان مطالعه امروز شما</span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className={`text-4xl font-black font-mono ${userTextColorClass}`}>
                          {toPersianDigits(todayTotalHours.toFixed(1))}
                        </span>
                        <span className="text-xs text-neutral-400">ساعت</span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-xl transition-all duration-300 ${userBgLightClass} ${userTextColorClass}`}>
                      {isMostafa ? "🧠" : "🎀"}
                    </div>
                  </div>

                  <div className="bg-white p-5 border border-[#EAE8E2]/50 shadow-sm space-y-4">
                    <div className="flex items-center justify-between px-0.5">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">وضعیت عملکرد ۷ روز گذشته</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="grid grid-cols-4 gap-2">
                        {weekPerformance.slice(0, 4).map((perf, index) => (
                          <div key={index} className={`p-2.5 h-20 rounded-sm flex flex-col items-center justify-center border border-black/5 text-center ${getTileBg(perf.hours)}`}>
                            <span className="text-[10px] font-bold block opacity-80">{perf.day}</span>
                            <span className="text-sm font-black font-mono block mt-1">{toPersianDigits(perf.hours.toFixed(1))}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center gap-2 w-full">
                        {weekPerformance.slice(4, 7).map((perf, index) => (
                          <div key={index} className={`p-2.5 h-20 rounded-sm flex flex-col items-center justify-center border border-black/5 text-center w-[23%] ${getTileBg(perf.hours)}`}>
                            <span className="text-[10px] font-bold block opacity-80">{perf.day}</span>
                            <span className="text-sm font-black font-mono block mt-1">{toPersianDigits(perf.hours.toFixed(1))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">گزارش‌های ثبت‌شده امروز</h3>
                    <div className="space-y-2.5">
                      {logs.filter(log => new Date(log.createdAt).toDateString() === new Date().toDateString()).length === 0 ? (
                        <div className="text-center py-6 text-xs text-neutral-400 bg-white rounded-md border border-dashed border-[#EAE8E2]">
                          هیچ رکوردی برای امروز ثبت نشده است.
                        </div>
                      ) : (
                        logs
                          .filter(log => new Date(log.createdAt).toDateString() === new Date().toDateString())
                          .map((log) => (
                            <div key={log.id} className="bg-white p-4 rounded-lg border border-[#EAE8E2]/40 shadow-sm flex flex-col gap-2.5">
                              <div className="flex justify-between items-center w-full">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-8 rounded-full ${userColorClass}`} />
                                  <div>
                                    <h4 className="text-sm font-bold text-[#2C2A27]">{log.topic}</h4>
                                    <span className="text-[10px] text-neutral-400 block mt-0.5">امروز</span>
                                  </div>
                                </div>
                                <span className="text-base font-bold font-mono text-[#1C1B19]">{toPersianDigits(log.hours)} ساعت</span>
                              </div>
                              {log.note && <div className="bg-[#FBFBFA] rounded-md border border-[#EAE8E2]/60 p-2.5 text-[11px] text-neutral-500">{log.note}</div>}
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* TAB 2: REGISTER WITH DAY SELECTION */}
          {activeTab === "add" && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="bg-white p-6 rounded-sm border border-[#EAE8E2]/50 shadow-sm space-y-6"
            >
              <form onSubmit={handleAddLog} className="space-y-6">
                
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-3">۱. انتخاب روز گزارش</label>
                  <div className="flex flex-wrap gap-2">
                    {getAvailableDaysToRegister().map((day) => {
                      const isSelected = selectedDayOffset === day.offset;
                      return (
                        <button
                          key={day.offset}
                          type="button"
                          onClick={() => setSelectedDayOffset(day.offset)}
                          className={`px-4 py-2 text-xs rounded-full border transition-all ${
                            isSelected 
                              ? "bg-zinc-900 text-white border-zinc-900 font-bold" 
                              : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:border-zinc-400"
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-3">۲. انتخاب مبحث دستیاری</label>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 border border-zinc-100 rounded-lg">
                    {TOPICS.map((topic) => {
                      const isSelected = selectedTopic === topic;
                      return (
                        <button
                          key={topic}
                          type="button"
                          onClick={() => setSelectedTopic(topic)}
                          className={`p-3 text-right text-xs rounded-xl border transition-all ${
                            isSelected 
                              ? "bg-[#2C2A27] text-white border-[#2C2A27] font-bold" 
                              : "bg-[#FBFBFA] text-[#2C2A27] border-[#EAE8E2] hover:border-[#2C2A27]"
                          }`}
                        >
                          {topic}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-2.5">۳. مدت زمان مطالعه</label>
                  <div className="space-y-3">
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="0.0"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="w-full p-4 bg-[#FBFBFA] border border-[#EAE8E2] focus:border-[#2C2A27] rounded-xl focus:outline-none font-mono text-left text-sm font-bold pl-16"
                      />
                      <span className="absolute left-4 text-xs font-bold text-neutral-400 pointer-events-none">ساعت</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[0.5, 1.0, 2.0].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => quickAddHours(amount)}
                          className="py-2.5 text-xs font-bold bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-700 font-mono"
                        >
                          +{toPersianDigits(amount)} ساعت
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-2.5">۴. توضیحات یا یادداشت (اختیاری)</label>
                  <textarea
                    rows={2}
                    placeholder="نکات کلیدی یا یادداشت..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full p-4 bg-[#FBFBFA] border border-[#EAE8E2] focus:border-[#2C2A27] rounded-xl focus:outline-none text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTopic || !hours}
                  className="w-full p-4 bg-[#2C2A27] text-white text-xs font-bold uppercase rounded-xl hover:bg-neutral-800 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "در حال ذخیره..." : "ذخیره و آپدیت بورد"}
                </button>
              </form>
            </motion.div>
          )}

          {/* TAB 3: OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-5 border border-[#EAE8E2]/60 shadow-sm flex flex-col justify-between">
                  <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">روزهای متوالی (Streak)</div>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className={`text-3xl font-black font-mono ${userTextColorClass}`}>{toPersianDigits(streak)}</span>
                    <span className="text-xs text-neutral-400 font-medium">روز</span>
                  </div>
                </div>

                <div className="bg-white p-5 border border-[#EAE8E2]/60 shadow-sm flex flex-col justify-between">
                  <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">کل هفته شما (شنبه - جمعه)</div>
                  <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-3xl font-black font-mono text-[#1C1B19]">{toPersianDigits(currentWeekTotal.toFixed(1))}</span>
                    <span className="text-xs text-neutral-400 font-medium">ساعت</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 border border-[#EAE8E2]/60 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-full h-[3px] ${opponentColorClass}`} />
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-[#1C1B19]">وضعیت رقیب ({opponentName})</h3>
                  </div>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${opponentBgLightClass} ${opponentTextColorClass}`}>LIVE</div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="border-l border-[#EAE8E2]/60 pl-2">
                    <span className="text-[10px] font-medium text-neutral-400 block">مطالعه امروزش</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className={`text-2xl font-black font-mono ${opponentTextColorClass}`}>{toPersianDigits(opponentToday.toFixed(1))}</span>
                    </div>
                  </div>
                  <div className="pr-2">
                    <span className="text-[10px] font-medium text-neutral-400 block">کل این هفته اش</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-black font-mono text-[#1C1B19]">{toPersianDigits(opponentWeek.toFixed(1))}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 border border-[#EAE8E2]/60 shadow-sm space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">تاریخچه روند ۴ هفته اخیر</h3>
                </div>
                <div className="divide-y divide-[#EAE8E2]/60">
                  {last4Weeks.map((week, index) => (
                    <div key={index} className="flex justify-between items-center py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 ${index === 0 ? userColorClass : "bg-neutral-300"}`} />
                        <span className="text-xs text-neutral-600">{week.label}</span>
                      </div>
                      <span className="text-sm font-bold font-mono text-[#2C2A27]">{toPersianDigits(week.hours.toFixed(1))} ساعت</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: COMPLETE 4 WEEKS ARCHIVE */}
          {activeTab === "weeks" && (
            <motion.div
              key="weeks"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="px-1">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">درس‌های خوانده‌شده (۴ هفته اخیر)</h3>
                <p className="text-[10px] text-neutral-400 mt-1">آرشیو تمام کارت‌ها و گزارش‌های ثبت شده در این دوره</p>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {logs.length === 0 ? (
                  <div className="text-center py-10 text-xs text-neutral-400 bg-white rounded-md border border-dashed border-[#EAE8E2]">
                    هیچ رکوردی در ۴ هفته گذشته یافت نشد.
                  </div>
                ) : (
                  logs.map((log) => {
                    const formattedDate = new Date(log.createdAt).toLocaleDateString("fa-IR", {
                      month: "long",
                      day: "numeric",
                    });

                    return (
                      <div key={log.id} className="bg-white p-4 rounded-lg border border-[#EAE8E2]/40 shadow-sm flex flex-col gap-2.5">
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 rounded-full opacity-70 ${userColorClass}`} />
                            <div>
                              <h4 className="text-sm font-bold text-[#2C2A27]">{log.topic}</h4>
                              <span className="text-[10px] text-neutral-400 block mt-0.5 font-mono">{toPersianDigits(formattedDate)}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold font-mono text-[#1C1B19]">{toPersianDigits(log.hours)} ساعت</span>
                        </div>
                        {log.note && <div className="bg-[#FBFBFA] border border-[#EAE8E2]/60 p-2.5 text-[11px] text-neutral-500">{log.note}</div>}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FLOATING BOTTOM NAV WITH SVG ICONS */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-transparent z-20 max-w-md mx-auto w-full">
        <nav className="bg-white/90 backdrop-blur-md border border-[#EAE8E2]/70 shadow-xl h-20 px-2 flex items-center w-full rounded-2xl">
          <div className="w-full grid grid-cols-4 h-14">
            
            {/* دکمه کارنامه (Tab 1) */}
            <button 
              onClick={() => setActiveTab("history")} 
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "history" ? "text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              <span className="text-[10px] tracking-tight">کارنامه</span>
            </button>

            {/* دکمه ثبت دستی (Tab 2) */}
            <button 
              onClick={() => setActiveTab("add")} 
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "add" ? "text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-[10px] tracking-tight">ثبت دستی</span>
            </button>

            {/* دکمه وضعیت (Tab 3) */}
            <button 
              onClick={() => setActiveTab("overview")} 
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "overview" ? "text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
              </svg>
              <span className="text-[10px] tracking-tight">وضعیت</span>
            </button>

            {/* دکمه مرور درس‌ها (Tab 4) */}
            <button 
              onClick={() => setActiveTab("weeks")} 
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "weeks" ? "text-zinc-950 font-bold" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-[10px] tracking-tight">مرور درس‌ها</span>
            </button>

          </div>
        </nav>
      </div>
    </div>
  );
}