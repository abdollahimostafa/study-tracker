// app/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * ۱. دریافت تمام گزارش‌های مطالعه امروز برای یک کاربر خاص
 */
export async function getTodayLogs(user: "mostafa" | "saghar") {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const logs = await prisma.studyLog.findMany({
      where: {
        user: user,
        createdAt: {
          gte: startOfToday,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return logs;
  } catch (error) {
    console.error("خطا در دریافت گزارش‌های امروز:", error);
    return [];
  }
}

/**
 * ۲. دریافت و گروه‌بندی داده‌های ۷ روز گذشته برای تایل‌های مینی‌مال
 */
export async function getWeeklyPerformance(user: "mostafa" | "saghar") {
  try {
    const sevenDaysAgo = new Date();
    // بازگشت به ۷ روز قبل از شروع امروز
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await prisma.studyLog.findMany({
      where: {
        user: user,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // آرایه ثابت روزهای هفته برای چیدمان گرید
    const daysOfWeek = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];

    // محاسبه و جمع زدن ساعت‌های مطالعه برای هر روز به صورت داینامیک
    return daysOfWeek.map((dayName) => {
      const totalHours = logs
        .filter((log) => {
          // تبدیل تاریخ میلادی دیتابیس به نام روز فارسی
          const logDay = new Date(log.createdAt).toLocaleDateString("fa-IR", { weekday: "long" });
          return logDay === dayName;
        })
        .reduce((sum, log) => sum + log.hours, 0);

      return {
        day: dayName,
        hours: totalHours,
      };
    });
  } catch (error) {
    console.error("خطا در محاسبه عملکرد هفتگی:", error);
    // بازگرداندن آرایه خالی استاندارد در صورت بروز خطا برای جلوگیری از کرش کردن فرانت‌اند
    return [
      { day: "شنبه", hours: 0 },
      { day: "یکشنبه", hours: 0 },
      { day: "دوشنبه", hours: 0 },
      { day: "سه‌شنبه", hours: 0 },
      { day: "چهارشنبه", hours: 0 },
      { day: "پنجشنبه", hours: 0 },
      { day: "جمعه", hours: 0 },
    ];
  }
}

/**
 * ۳. ثبت یک رکورد مطالعه جدید در دیتابیس
 */
export async function addStudyLog(topic: string, hours: number, user: "mostafa" | "saghar") {
  try {
    if (!topic || !hours || hours <= 0) {
      throw new Error("اطلاعات وارد شده برای ثبت معتبر نیست.");
    }

    const log = await prisma.studyLog.create({
      data: {
        topic,
        hours,
        user,
      },
    });

    // پاک کردن کش روت اصلی برای واکشی مجدد و زنده داده‌ها در کامپوننت‌های سروری
    revalidatePath("/");
    return log;
  } catch (error) {
    console.error("خطا در ثبت رکورد جدید:", error);
    throw error;
  }
}