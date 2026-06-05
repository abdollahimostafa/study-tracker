// app/api/study-logs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma"; // مطمئن شوید مسیر نسبی به پوشه lib درست است

// ۱. متد GET: دریافت گزارش‌های امروز و عملکرد ۷ روز گذشته
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get("user");

    if (!user || (user !== "mostafa" && user !== "saghar")) {
      return NextResponse.json({ error: "کاربر نامعتبر است" }, { status: 400 });
    }

    // بازه زمانی امروز
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // بازه زمانی ۷ روز گذشته
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // واکشی هم‌زمان داده‌ها از دیتابیس برای پرفورمنس بالاتر
    const [logs, weeklyLogs] = await Promise.all([
      prisma.studyLog.findMany({
        where: { user, createdAt: { gte: startOfToday } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.studyLog.findMany({
        where: { user, createdAt: { gte: sevenDaysAgo } },
      }),
    ]);

    // گروه‌بندی عملکرد ۷ روز گذشته
    const daysOfWeek = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"];
    const performance = daysOfWeek.map((dayName) => {
      const totalHours = weeklyLogs
        .filter((log) => {
          const logDay = new Date(log.createdAt).toLocaleDateString("fa-IR", { weekday: "long" });
          return logDay === dayName;
        })
        .reduce((sum, log) => sum + log.hours, 0);

      return { day: dayName, hours: totalHours };
    });

    return NextResponse.json({ logs, performance });
  } catch (error) {
    console.error("GET API Error:", error);
    return NextResponse.json({ error: "خطا در برقراری ارتباط با دیتابیس" }, { status: 500 });
  }
}

// ۲. متد POST: ثبت یک گزارش مطالعه جدید
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, hours, user } = body;

    if (!topic || !hours || hours <= 0 || !user) {
      return NextResponse.json({ error: "اطلاعات ارسالی ناقص یا نامعتبر است" }, { status: 400 });
    }

    const newLog = await prisma.studyLog.create({
      data: {
        topic,
        hours: parseFloat(hours),
        user,
      },
    });

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error("POST API Error:", error);
    return NextResponse.json({ error: "خطا در ثبت رکورد جدید" }, { status: 500 });
  }
}