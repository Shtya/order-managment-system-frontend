import { Link } from "@/i18n/navigation";

const content = {
  en: {
    title: "Terms and Conditions",
    updated: "Last updated: June 2, 2026",
    intro:
      "These Terms and Conditions govern your access to and use of the Madar platform (madartest.online). By using our services, you agree to comply with these terms and acknowledge our integration with Meta Platform APIs.",
    sections: [
      {
        title: "1. Scope of Service",
        body: `
          <p>Madar is a multi-tenant e-commerce operations and WhatsApp CRM platform. We provide tools for managing customer communication, orders, shipping, products, suppliers, and store operations. Our service integrates with the Meta WhatsApp Cloud API to enable business messaging and account management.</p>
        `,
      },
      {
        title: "2. Account Responsibility",
        body: `
          <p>You are responsible for maintaining the confidentiality of your login credentials. You agree to provide accurate business information and are solely responsible for all activities, including WhatsApp messaging and order management, conducted through your account.</p>
        `,
      },
      {
        title: "3. Meta Platform Integration",
        body: `
          <p>Our platform utilizes Meta Platform APIs via Embedded Signup. By connecting your WhatsApp Business Account (WABA), you agree to:</p>
          <ul class="list-disc list-inside space-y-1 mt-2">
            <li>Comply with <a href="https://developers.facebook.com/terms" target="_blank" class="text-blue-600 underline">Meta Platform Terms</a> and <a href="https://developers.facebook.com/devpolicy" target="_blank" class="text-blue-600 underline">Developer Policies</a>.</li>
            <li>Adhere to the <a href="https://www.whatsapp.com/legal/business-policy" target="_blank" class="text-blue-600 underline">WhatsApp Business Policy</a>.</li>
            <li>Grant Madar the necessary permissions (<code>whatsapp_business_management</code> and <code>whatsapp_business_messaging</code>) to manage your WABA, sync templates, and handle messaging on your behalf.</li>
          </ul>
        `,
      },
      {
        title: "4. Data Usage & Compliance",
        body: `
          <p>We process data obtained through Meta APIs solely to provide Madar's core functionalities. You represent that you have obtained all necessary consents from your customers before sending them WhatsApp messages or processing their commerce data through our platform.</p>
          <p class="mt-2">We do not use Meta Platform data for advertising, building profiles for third parties, or any purpose outside of delivering the Madar service.</p>
        `,
      },
      {
        title: "5. Operational Data",
        body: `
          <p>You retain ownership of the data you upload (orders, products, customer lists). You grant Madar a license to host, sync, and process this data to provide the services, including triggering automated notifications for order updates, shipping, and cancellations.</p>
        `,
      },
      {
        title: "6. Acceptable Use",
        body: `
          <p>You agree not to use the platform for any unlawful activities, spamming via WhatsApp, or any action that violates Meta's policies. Misuse of the WhatsApp Cloud API integration may lead to immediate suspension of your account.</p>
        `,
      },
      {
        title: "7. Termination",
        body: `
          <p>We reserve the right to suspend or terminate access if these terms are violated, if required by Meta, or if continued access creates legal or security risks for the platform or other tenants.</p>
        `,
      },
      {
        title: "8. Contact",
        body: `
          <p>For questions regarding these terms, please contact us at <a href="https://madartest.online/en/auth" class="text-blue-600 underline">madartest.online/en/auth</a>.</p>
        `,
      },
    ],
    back: "Back to sign in",
  },
  ar: {
    title: "الشروط والأحكام",
    updated: "آخر تحديث: 2 يونيو 2026",
    intro:
      "تنظم هذه الشروط والأحكام وصولك واستخدامك لمنصة مدار (madartest.online). باستخدامك لخدماتنا، فإنك توافق على الالتزام بهذه الشروط وتقر بتكاملنا مع واجهات برمجة تطبيقات منصة ميتا (Meta Platform APIs).",
    sections: [
      {
        title: "1. نطاق الخدمة",
        body: `
          <p>مدار هي منصة متعددة المستأجرين لإدارة عمليات التجارة الإلكترونية وإدارة علاقات العملاء عبر واتساب. نحن نوفر أدوات لإدارة اتصالات العملاء، الطلبات، الشحن، المنتجات، الموردين، وعمليات المتجر. تتكامل خدمتنا مع واجهة برمجة تطبيقات واتساب السحابية من ميتا لتمكين مراسلات الأعمال وإدارة الحسابات.</p>
        `,
      },
      {
        title: "2. مسؤولية الحساب",
        body: `
          <p>أنت مسؤول عن الحفاظ على سرية بيانات اعتماد تسجيل الدخول الخاصة بك. وتوافق على تقديم معلومات تجارية دقيقة وتتحمل المسؤولية الكاملة عن جميع الأنشطة، بما في ذلك مراسلات واتساب وإدارة الطلبات، التي تتم من خلال حسابك.</p>
        `,
      },
      {
        title: "3. التكامل مع منصة ميتا",
        body: `
          <p>تستخدم منصتنا واجهات برمجة تطبيقات منصة ميتا عبر التسجيل المدمج (Embedded Signup). بربطك لحساب واتساب للأعمال (WABA)، فإنك توافق على:</p>
          <ul class="list-disc list-inside space-y-1 mt-2">
            <li>الالتزام بـ <a href="https://developers.facebook.com/terms" target="_blank" class="text-blue-600 underline">شروط منصة ميتا</a> و <a href="https://developers.facebook.com/devpolicy" target="_blank" class="text-blue-600 underline">سياسات المطورين</a>.</li>
            <li>الالتزام بـ <a href="https://www.whatsapp.com/legal/business-policy" target="_blank" class="text-blue-600 underline">سياسة واتساب للأعمال</a>.</li>
            <li>منح مدار الأذونات اللازمة (<code>whatsapp_business_management</code> و <code>whatsapp_business_messaging</code>) لإدارة حسابك، مزامنة القوالب، ومعالجة المراسلات نيابة عنك.</li>
          </ul>
        `,
      },
      {
        title: "4. استخدام البيانات والامتثال",
        body: `
          <p>نحن نعالج البيانات التي يتم الحصول عليها من خلال واجهات برمجة تطبيقات ميتا فقط لتوفير وظائف مدار الأساسية. وتقر بأنك حصلت على جميع الموافقات اللازمة من عملائك قبل إرسال رسائل واتساب لهم أو معالجة بياناتهم التجارية من خلال منصتنا.</p>
          <p class="mt-2">نحن لا نستخدم بيانات منصة ميتا للإعلان، أو إنشاء ملفات تعريف لأطراف ثالثة، أو لأي غرض خارج نطاق تقديم خدمة مدار.</p>
        `,
      },
      {
        title: "5. البيانات التشغيلية",
        body: `
          <p>تحتفظ بملكية البيانات التي ترفعها (الطلبات، المنتجات، قوائم العملاء). وتمنح مدار ترخيصاً لاستضافة ومزامنة ومعالجة هذه البيانات لتقديم الخدمات، بما في ذلك إرسال الإشعارات التلقائية لتحديثات الطلبات والشحن والإلغاء.</p>
        `,
      },
      {
        title: "6. الاستخدام المقبول",
        body: `
          <p>توافق على عدم استخدام المنصة في أي أنشطة غير قانونية، أو إرسال رسائل مزعجة (Spam) عبر واتساب، أو أي عمل ينتهك سياسات ميتا. قد يؤدي إساءة استخدام التكامل مع واتساب إلى تعليق حسابك فوراً.</p>
        `,
      },
      {
        title: "7. إنهاء الخدمة",
        body: `
          <p>نحتفظ بالحق في تعليق أو إنهاء الوصول إذا تم انتهاك هذه الشروط، أو إذا طلبت ميتا ذلك، أو إذا تسبب استمرار الوصول في مخاطر قانونية أو أمنية للمنصة أو للمستأجرين الآخرين.</p>
        `,
      },
      {
        title: "8. التواصل",
        body: `
          <p>للاستفسارات المتعلقة بهذه الشروط، يرجى التواصل معنا عبر <a href="https://madartest.online/en/auth" class="text-blue-600 underline">madartest.online/en/auth</a>.</p>
        `,
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
              <div
                style={{ color: "#4b4b6a", lineHeight: 1.8, fontSize: 14 }}
                dangerouslySetInnerHTML={{ __html: item.body }}
              />
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
