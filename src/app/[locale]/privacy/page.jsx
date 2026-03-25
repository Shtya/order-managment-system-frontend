import { Link } from "@/i18n/navigation";

const content = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: March 25, 2026",
    intro:
      "This Privacy Policy explains how we collect, use, and protect personal and business information when you use the Order Management System.",
    sections: [
      {
        title: "Information We Collect",
        body: "We may collect profile details, business information, order records, and technical usage data needed to provide and improve the service.",
      },
      {
        title: "How We Use Data",
        body: "Data is used to operate the platform, process workflows, provide support, improve features, and communicate important account updates.",
      },
      {
        title: "Data Sharing",
        body: "We do not sell your personal data. Data may be shared with trusted service providers only when required to run core platform operations.",
      },
      {
        title: "Security",
        body: "We apply reasonable technical and organizational measures to protect data from unauthorized access, loss, or misuse.",
      },
      {
        title: "Retention",
        body: "We retain data as long as necessary for service delivery, compliance, and legitimate business purposes, unless deletion is required by law.",
      },
      {
        title: "Your Rights",
        body: "You can request access, correction, or deletion of your data according to applicable regulations and platform capabilities.",
      },
    ],
    back: "Back to sign in",
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 25 مارس 2026",
    intro:
      "توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات الشخصية والتجارية عند استخدام نظام إدارة الطلبات.",
    sections: [
      {
        title: "البيانات التي نجمعها",
        body: "قد نجمع بيانات الملف الشخصي ومعلومات النشاط التجاري وسجلات الطلبات وبيانات الاستخدام التقنية اللازمة لتقديم الخدمة وتطويرها.",
      },
      {
        title: "كيفية استخدام البيانات",
        body: "تستخدم البيانات لتشغيل المنصة وتنفيذ العمليات وتقديم الدعم وتحسين الميزات وإرسال التحديثات المهمة المتعلقة بالحساب.",
      },
      {
        title: "مشاركة البيانات",
        body: "لا نقوم ببيع بياناتك الشخصية. قد تتم مشاركة البيانات مع مزودي خدمات موثوقين فقط عند الحاجة لتشغيل المنصة.",
      },
      {
        title: "الأمان",
        body: "نطبق إجراءات تقنية وتنظيمية معقولة لحماية البيانات من الوصول غير المصرح به أو الفقد أو سوء الاستخدام.",
      },
      {
        title: "الاحتفاظ بالبيانات",
        body: "نحتفظ بالبيانات طالما كان ذلك ضروريا لتقديم الخدمة والامتثال والاحتياجات التشغيلية المشروعة، ما لم يتطلب القانون الحذف.",
      },
      {
        title: "حقوقك",
        body: "يمكنك طلب الوصول إلى بياناتك أو تعديلها أو حذفها وفقا للأنظمة المعمول بها وإمكانات المنصة.",
      },
    ],
    back: "العودة لتسجيل الدخول",
  },
};

export default async function PrivacyPage({ params }) {
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
