import { Link } from "@/i18n/navigation";

const content = {
  en: {
    title: "Terms and Conditions",
    updated: "Last updated: March 25, 2026",
    intro:
      "These Terms and Conditions govern your access to and use of the Order Management System platform and related services.",
    sections: [
      {
        title: "Account and Access",
        body: "You are responsible for keeping your login credentials secure and for all activities performed under your account.",
      },
      {
        title: "Acceptable Use",
        body: "You agree to use the platform only for lawful business activities and not to misuse, disrupt, or attempt unauthorized access.",
      },
      {
        title: "Billing and Subscription",
        body: "Certain features may require an active subscription. Fees, renewals, and plan limits are applied according to your selected plan.",
      },
      {
        title: "Data Responsibility",
        body: "You are responsible for the accuracy and legality of the data you upload, process, or share through the system.",
      },
      {
        title: "Service Availability",
        body: "We work to maintain reliable service but do not guarantee uninterrupted availability at all times.",
      },
      {
        title: "Termination",
        body: "We may suspend or terminate access if these terms are violated or if continued access creates legal or security risk.",
      },
    ],
    back: "Back to sign in",
  },
  ar: {
    title: "الشروط والأحكام",
    updated: "آخر تحديث: 25 مارس 2026",
    intro:
      "تنظم هذه الشروط والأحكام وصولك واستخدامك لمنصة نظام إدارة الطلبات والخدمات المرتبطة بها.",
    sections: [
      {
        title: "الحساب وصلاحية الوصول",
        body: "أنت مسؤول عن حماية بيانات تسجيل الدخول الخاصة بك وعن جميع الأنشطة التي تتم من خلال حسابك.",
      },
      {
        title: "الاستخدام المقبول",
        body: "تتعهد باستخدام المنصة في أنشطة تجارية قانونية فقط وعدم إساءة الاستخدام أو تعطيل الخدمة أو محاولة الوصول غير المصرح به.",
      },
      {
        title: "الاشتراك والفوترة",
        body: "قد تتطلب بعض الميزات اشتراكا فعالا. يتم تطبيق الرسوم والتجديد وحدود الخطة وفقا للخطة التي تختارها.",
      },
      {
        title: "مسؤولية البيانات",
        body: "أنت مسؤول عن دقة ومشروعية البيانات التي تقوم برفعها أو معالجتها أو مشاركتها عبر النظام.",
      },
      {
        title: "توفر الخدمة",
        body: "نعمل على توفير خدمة مستقرة، لكن لا نضمن الاستمرارية دون انقطاع في جميع الأوقات.",
      },
      {
        title: "إنهاء الاستخدام",
        body: "يجوز لنا تعليق أو إنهاء الوصول عند مخالفة هذه الشروط أو عند وجود مخاطر قانونية أو أمنية.",
      },
    ],
    back: "العودة لتسجيل الدخول",
  },
};

export default async function TermsPage({ params }) {
  const { locale } = await params;
  const isArabic = locale === "ar";
  const t = isArabic ? content.ar : content.en;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eeedf6 0%, #f7f7fc 100%)",
        padding: "40px 20px",
        fontFamily: "Cairo, sans-serif",
      }}
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          background: "rgba(255,255,255,0.98)",
          border: "1px solid #e3e2f0",
          borderRadius: 20,
          boxShadow: "0 20px 50px rgba(32,27,86,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: 4,
            background: "linear-gradient(90deg, #6763AF 0%, #9d9bd8 50%, #6763AF 100%)",
          }}
        />
        <section style={{ padding: "28px 28px 20px" }}>
          <h1 style={{ color: "#16162a", fontSize: 30, fontWeight: 800 }}>{t.title}</h1>
          <p style={{ color: "#9090b0", marginTop: 6, fontSize: 13 }}>{t.updated}</p>
          <p style={{ marginTop: 16, color: "#4b4b6a", lineHeight: 1.85 }}>{t.intro}</p>
        </section>
        <section style={{ padding: "0 28px 24px" }}>
          {t.sections.map((item) => (
            <article
              key={item.title}
              style={{
                background: "#f7f7fc",
                border: "1px solid #e3e2f0",
                borderRadius: 12,
                padding: "16px 14px",
                marginBottom: 12,
              }}
            >
              <h2 style={{ fontSize: 18, color: "#16162a", marginBottom: 6 }}>{item.title}</h2>
              <p style={{ color: "#4b4b6a", lineHeight: 1.8 }}>{item.body}</p>
            </article>
          ))}
          <Link
            href="/auth?mode=signin"
            style={{
              display: "inline-block",
              marginTop: 4,
              color: "#6763AF",
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            {t.back}
          </Link>
        </section>
      </div>
    </main>
  );
}
