import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// تابع کمکی برای پیدا کردن روز شنبه‌ی همین هفته
function getStartOfThisWeek() {
  const today = new Date();
  const day = today.getDay(); // 0: یکشنبه, 6: شنبه
  const diff = today.getDate() - (day === 6 ? 0 : day + 1);
  const startOfWeek = new Date(today.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

// ۱. دریافت گزارش‌ها و آمار ۴ هفته اخیر
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user = searchParams.get("user");

    if (!user) {
      return NextResponse.json({ error: "کاربر مشخص نشده است" }, { status: 400 });
    }

    const now = new Date();
    // محاسبه ابتدای مرز ۴ هفته گذشته
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(now.getDate() - 28);
    fourWeeksAgo.setHours(0, 0, 0, 0);

    // واکشی تمام رکوردهای ۲۸ روز اخیر کاربر
    const logs = await prisma.studyLog.findMany({
      where: {
        user,
        createdAt: { gte: fourWeeksAgo },
      },
      orderBy: { createdAt: "desc" },
    });

    // آمارگیری تفکیک شده
    const todayStr = now.toDateString();
    const todayTotal = logs
      .filter((l) => new Date(l.createdAt).toDateString() === todayStr)
      .reduce((sum, l) => sum + l.hours, 0);

    // محاسبه مرز هفته جاری (شنبه تا جمعه)
    const startOfCurrentWeek = getStartOfThisWeek();
    const currentWeekTotal = logs
      .filter((l) => new Date(l.createdAt) >= startOfCurrentWeek)
      .reduce((sum, l) => sum + l.hours, 0);

    // محاسبه تفکیکی ۴ هفته برای تب وضعیت
    const last4Weeks = [];
    for (let i = 0; i < 4; i++) {
      const start = new Date(startOfCurrentWeek);
      start.setDate(start.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const weekHours = logs
        .filter((l) => {
          const d = new Date(l.createdAt);
          return d >= start && d < end;
        })
        .reduce((sum, l) => sum + l.hours, 0);

      last4Weeks.push({
        label: i === 0 ? "هفته جاری" : `${i} هفته قبل`,
        hours: weekHours,
      });
    }

    // تولید کادر کاشی‌کاری عملکرد ۷ روز گذشته (شنبه تا جمعه هفته فعلی)
    const weekDaysNames = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
    const performance = weekDaysNames.map((dayName, idx) => {
      const targetDay = new Date(startOfCurrentWeek);
      targetDay.setDate(targetDay.getDate() + idx);
      const targetDayStr = targetDay.toDateString();

      const dayHours = logs
        .filter((l) => new Date(l.createdAt).toDateString() === targetDayStr)
        .reduce((sum, l) => sum + l.hours, 0);

      return { day: dayName, hours: dayHours };
    });

    // محاسبه ساده استریک (تعداد روزهای متوالی مطالعه در کل آرشیو موجود)
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toDateString();
      const hasLogs = logs.some((l) => new Date(l.createdAt).toDateString() === dateStr);
      if (hasLogs) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return NextResponse.json({
      logs, // ارسال کل گزارشات ۴ هفته اخیر به سمت فرانت برای تب ۴
      performance,
      todayTotal,
      currentWeekTotal,
      last4Weeks,
      streak,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ۲. ثبت اطلاعات جدید با پشتیبانی از تاریخ سفارشی رکوردهای هفته
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, hours, note, user, customDate } = body;

    if (!topic || !hours || !user) {
      return NextResponse.json({ error: "اطلاعات اجباری فرم ناقص است" }, { status: 400 });
    }

    // اگر تاریخ سفارشی انتخاب شده بود از آن استفاده کند، در غیر این صورت تاریخ سرور (امروز)
    const logDate = customDate ? new Date(customDate) : new Date();

    const newLog = await prisma.studyLog.create({
      data: {
        topic,
        hours: parseFloat(hours),
        user,
        createdAt: logDate,
        ...(note && note.trim() ? { note: note.trim() } : {}),
      },
    });

    return NextResponse.json({ success: true, log: newLog });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در ثبت پایگاه داده" }, { status: 500 });
  }
}