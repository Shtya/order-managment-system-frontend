import { Link } from "@/i18n/navigation";

const content = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: October 19, 2026",
    intro:
      "Madar (available at getmadar.net) is a multi-tenant e-commerce operations, WhatsApp CRM, and email campaign platform. We help businesses manage customer communication, orders, shipping, products, suppliers, and store operations from one dashboard.",
    sections: [
      {
        title: "Who We Are",
        body: `
          <p>This Privacy Policy applies to all users of the Madar platform, including business owners ("Authorized Users") who create accounts and their end customers whose data is processed through the platform. By accessing or using Madar, you agree to the practices described in this policy.</p>
        `,
      },
      {
        title: "Information We Collect",
        body: `
          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">Account & Business Information</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>Name, email address, phone number, and password when you register</li>
            <li>Business name, address, and operational details</li>
            <li>Profile and configuration preferences for your workspace</li>
          </ul>

          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">Commerce & Operational Data</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>Order records including customer name, contact information, items purchased, prices, and order status</li>
            <li>Product catalog data: names, descriptions, prices, and stock information</li>
            <li>Supplier records and purchase order information</li>
            <li>Store configuration, shipping provider details, and delivery tracking numbers</li>
            <li>Customer profiles created or imported into the platform</li>
          </ul>

          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">WhatsApp Communication Data</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>Message content sent and received through WhatsApp conversations</li>
            <li>Message delivery and read receipt statuses</li>
            <li>WhatsApp Business Account ID, Phone Number ID, and associated metadata</li>
            <li>Approved WhatsApp message templates and their statuses</li>
            <li>Customer phone numbers used for WhatsApp messaging</li>
          </ul>
        `,
      },
      {
        title: "Meta & WhatsApp Data",
        body: `
          <p>Madar integrates with the <strong>Meta WhatsApp Cloud API</strong> via Meta's Embedded Signup flow. When you connect a WhatsApp Business Account to Madar, we collect and process data obtained through Meta's Platform under two permission areas:</p>
          
          <div class="grid gap-3 my-4">
            <div class="bg-white/50 p-3 rounded-lg border border-gray-200">
              <code class="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">whatsapp_business_management</code>
              <p class="text-xs mt-1 text-gray-600">Used to connect your WhatsApp Business Account, register phone numbers, subscribe to webhooks, and manage message templates.</p>
            </div>
            <div class="bg-white/50 p-3 rounded-lg border border-gray-200">
              <code class="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">whatsapp_business_messaging</code>
              <p class="text-xs mt-1 text-gray-600">Used to send and receive WhatsApp messages between you and your customers, including text, media, and approved templates.</p>
            </div>
          </div>

          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">What Meta Data We Store</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>WhatsApp Business Account ID and associated phone number details</li>
            <li>Access tokens required to authenticate API requests on your behalf</li>
            <li>Webhook event payloads including incoming messages and delivery statuses</li>
            <li>Message templates synced from your Meta account</li>
            <li>WhatsApp business profile information (display name, description, etc.)</li>
          </ul>

          <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
            <span class="text-[10px] font-mono text-blue-600 uppercase tracking-widest block mb-1">Meta Platform Compliance</span>
            <p class="text-xs text-blue-800 leading-relaxed">Data obtained through Meta's Platform is used exclusively to provide the features described in this policy. We do not use Meta Platform data for advertising, sell it to third parties, or use it beyond delivering the Madar service.</p>
          </div>
        `,
      },
      {
        title: "Google & Gmail Data",
        body: `
          <p>Madar lets an authorized user connect a Gmail account and send email campaigns or test messages from that account. The connection uses the <code class="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">openid</code>, <code class="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">email</code>, and <code class="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">https://www.googleapis.com/auth/gmail.send</code> scopes.</p>

          <h3 class="text-sm font-bold text-gray-800 mt-4 mb-1 uppercase tracking-wider">Google Data We Access and Store</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>Your Google account identifier, verified email address, display name if supplied by Google, and granted OAuth scopes</li>
            <li>An OAuth refresh token, encrypted at rest and stored only on Madar's servers, so requested messages can be sent from the connected account</li>
            <li>Technical sending records, including the connected sender, recipient, delivery state, and Gmail message identifier when returned</li>
          </ul>

          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">How We Use Google Data</h3>
          <p class="mb-3">We use your Google identity only to identify and display the connected sender and bind it to the correct Madar user and tenant. We use Gmail access only to send test emails and campaigns that an authorized user creates and initiates in Madar.</p>

          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">Data We Do Not Access</h3>
          <p class="mb-3">Madar does not read, list, download, delete, or modify your inbox messages, received mail, drafts, contacts, attachments, labels, or mailbox history.</p>

          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">Your Control</h3>
          <p class="mb-3">You choose whether to authorize a Gmail connection. Madar supports disconnecting the account and revoking its Google token, and you can revoke Madar's access at any time from your Google Account permissions.</p>

          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">Sharing and Limited Use</h3>
          <p class="mb-3">Google data is disclosed only to Google/Gmail to perform sending requested through Madar, to infrastructure processors acting on our behalf where necessary to operate and secure the service, or when legally required. It is not sold, shared between tenants, used for advertising or profiling, disclosed to data brokers or information resellers, used for credit or lending decisions, or used to create unrelated databases.</p>
          <p>Madar does not use Google Workspace API data to develop, improve, or train generalized or non-personalized artificial intelligence or machine-learning models. Madar's use and transfer of information received from Google APIs complies with the <a class="font-semibold text-blue-700 underline" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including its Limited Use requirements.</p>
        `,
      },
      {
        title: "How We Use Your Data",
        body: `
          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">To Operate the Platform</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>Authenticate your account and provide access to the dashboard</li>
            <li>Process and display order, shipping, product, and customer records</li>
            <li>Connect and manage your WhatsApp Business Account through Embedded Signup</li>
            <li>Send and receive WhatsApp messages on behalf of your business</li>
            <li>Deliver automated WhatsApp notifications for order confirmations and updates</li>
            <li>Sync templates, message statuses, and business profile data from Meta</li>
          </ul>

          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">To Improve and Support</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>Diagnose technical issues and fix bugs using error and usage logs</li>
            <li>Analyze platform usage patterns to improve features and performance</li>
            <li>Respond to support inquiries and provide customer assistance</li>
          </ul>

          <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 mt-2">
            <span class="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">We Do Not</span>
            <p class="text-xs text-gray-200 leading-relaxed">We do not use your data or your customers' data to train machine learning or AI models. We do not use Meta Platform data for advertising or sell it to any third party.</p>
          </div>
        `,
      },
      {
        title: "How We Share Your Data",
        body: `
          <p>We do not sell your personal data. We share data only in the following limited circumstances:</p>
          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">Service Providers</h3>
          <p class="mb-3">We work with trusted third-party service providers (cloud hosting, payment processors, email delivery) who process data on our behalf solely to operate the platform.</p>
          
          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">Meta (WhatsApp API)</h3>
          <p class="mb-3">Data is transmitted to and from Meta's servers as part of the WhatsApp Cloud API integration, governed by WhatsApp's Business Policy and Meta's Platform Terms.</p>

          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">Google (Gmail API)</h3>
          <p class="mb-3">When you request an email send, the sender identity, recipient, subject, message content, and required technical metadata are transmitted to Google through the Gmail API. Google data is otherwise shared only with processors necessary to operate and secure Madar, or where disclosure is legally required.</p>
          
          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">Business Users & Customers</h3>
          <p>Madar is a multi-tenant platform. Each business user can only access their own data. Data from one business tenant is not shared with or accessible to other tenants.</p>
        `,
      },
      {
        title: "Data Obtained via Meta Platform",
        body: `
          <ul class="list-disc list-inside space-y-1">
            <li>We only request permissions necessary for core functionality</li>
            <li>We do not use Meta data to build user profiles outside of the service</li>
            <li>We do not transfer Meta data to data brokers or advertising networks</li>
            <li>We do not use Meta data to target advertising on or off Meta products</li>
            <li>We store access tokens and sensitive credentials securely</li>
            <li>We comply with data deletion requirements when you disconnect or delete your workspace</li>
          </ul>
        `,
      },
      {
        title: "Cookies & Technical Data",
        body: `
          <p>Madar uses essential cookies required for the platform to function (session maintenance, security). We also use analytics tools to understand usage patterns and improve performance. Analytics data is aggregated and does not personally identify you.</p>
        `,
      },
      {
        title: "Data Security",
        body: `
          <ul class="list-disc list-inside space-y-1">
            <li>Encryption of data in transit using TLS/HTTPS</li>
            <li>Encryption of sensitive credentials at rest</li>
            <li>Google OAuth refresh tokens remain on the server and are never exposed in frontend responses</li>
            <li>Access controls restricting employee access to production data</li>
            <li>Owner-level authorization and multi-tenant data isolation for connected Gmail accounts</li>
          </ul>
          <p class="mt-3 text-xs italic">While we take commercially reasonable measures to protect your data, no system is completely immune to security risks. We cannot guarantee absolute security.</p>
        `,
      },
      {
        title: "Data Retention",
        body: `
          <ul class="list-disc list-inside space-y-1">
            <li>Order and commerce data: up to 7 years for financial compliance</li>
            <li>WhatsApp message history: retained until conversation or account deletion</li>
            <li>Meta access tokens: retained only while the account is connected</li>
            <li>Google OAuth credentials: retained while the Gmail account is connected. On disconnect, Madar requests token revocation and removes the stored credential after revocation processing.</li>
            <li>Minimal Google connection identity metadata may be retained for account ownership integrity, security, fraud prevention, and legal obligations.</li>
            <li>Email campaign and sending records are retained only as long as needed to operate and secure the service, maintain audit records, resolve delivery issues, and meet legal obligations.</li>
          </ul>
          <p class="mt-3">You may request access to or deletion of applicable Google data by emailing <a class="font-semibold text-blue-700 underline" href="mailto:info@getmadar.net">info@getmadar.net</a>. Some information may be retained where necessary for security, fraud prevention, legal compliance, dispute resolution, or recordkeeping.</p>
        `,
      },

      {
        title: "Your Rights",
        body: `
          <p>Subject to applicable law, you may request <strong>access, correction, deletion, portability, restriction, objection,</strong> or <strong>withdrawal of consent</strong>. To exercise these rights, email <a class="font-semibold text-blue-700 underline" href="mailto:info@getmadar.net">info@getmadar.net</a>.</p>
        `,
      },
      {
        title: "Changes to This Policy",
        body: `
          <p>We keep this policy current. If we materially change how Madar accesses, uses, stores, or shares Google user data, we will update the date above and notify affected users through the application or by email before the change takes effect where required.</p>
        `,
      },
      {
        title: "Contact Us",
        body: `
          <div class="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-2">
            <p class="text-xs flex items-center gap-2"><span class="font-mono text-gray-400 w-16 uppercase">Platform</span> Madar — getmadar.net</p>
            <p class="text-xs flex items-center gap-2"><span class="font-mono text-gray-400 w-16 uppercase">Privacy</span> <a class="text-blue-700 underline" href="mailto:info@getmadar.net">info@getmadar.net</a></p>
          </div>
        `,
      },
    ],
    back: "Back to sign in",
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 19 أكتوبر 2026",
    intro:
      "تعد منصة مدار (المتاحة عبر getmadar.net) منصة متعددة المستخدمين لإدارة عمليات التجارة الإلكترونية وعلاقات العملاء عبر واتساب وحملات البريد الإلكتروني. نحن نساعد الشركات على إدارة اتصالات العملاء والطلبات والشحن والمنتجات والموردين وعمليات المتجر من لوحة تحكم واحدة.",
    sections: [
      {
        title: "من نحن",
        body: `
          <p>تنطبق سياسة الخصوصية هذه على جميع مستخدمي منصة مدار، بما في ذلك أصحاب الأعمال ("المستخدمون المصرح لهم") الذين ينشئون حسابات، وعملاؤهم النهائيون الذين تتم معالجة بياناتهم من خلال المنصة. من خلال الوصول إلى مدار أو استخدامه، فإنك توافق على الممارسات الموضحة في هذه السياسة.</p>
        `,
      },
      {
        title: "البيانات التي نجمعها",
        body: `
          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">معلومات الحساب والنشاط التجاري</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>الاسم، عنوان البريد الإلكتروني، رقم الهاتف، وكلمة المرور عند التسجيل</li>
            <li>اسم النشاط التجاري، العنوان، والتفاصيل التشغيلية</li>
            <li>تفضيلات الملف الشخصي والتكوين لمساحة العمل الخاصة بك</li>
          </ul>

          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">بيانات التجارة والعمليات</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>سجلات الطلبات بما في ذلك اسم العميل، معلومات الاتصال، المنتجات المشتراة، الأسعار، وحالة الطلب</li>
            <li>بيانات كتالوج المنتجات: الأسماء، الأوصاف، الأسعار، ومعلومات المخزون</li>
            <li>سجلات الموردين ومعلومات أوامر الشراء</li>
            <li>تكوين المتجر، تفاصيل مزودي الشحن، وأرقام تتبع التسليم</li>
            <li>ملفات تعريف العملاء التي تم إنشاؤها أو استيرادها إلى المنصة</li>
          </ul>

          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">بيانات اتصالات واتساب</h3>
          <ul class="list-disc list-inside space-y-1">
            <li>محتوى الرسائل المرسلة والمستلمة من خلال محادثات واتساب</li>
            <li>حالات تسليم الرسائل وقراءتها</li>
            <li>معرف حساب واتساب للأعمال، ومعرف رقم الهاتف، والبيانات الوصفية المرتبطة بها</li>
            <li>قوالب رسائل واتساب المعتمدة وحالاتها</li>
            <li>أرقام هواتف العملاء المستخدمة لمراسلات واتساب</li>
          </ul>
        `,
      },
      {
        title: "بيانات ميتا وواتساب",
        body: `
          <p>تتكامل مدار مع <strong>واجهة برمجة تطبيقات واتساب السحابية من ميتا</strong> عبر تدفق التسجيل المدمج. عندما تقوم بربط حساب واتساب للأعمال بمدار، فإننا نجمع ونعالج البيانات التي يتم الحصول عليها من خلال منصة ميتا بموجب منطقتي تصريح:</p>
          
          <div class="grid gap-3 my-4">
            <div class="bg-white/50 p-3 rounded-lg border border-gray-200">
              <code class="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">whatsapp_business_management</code>
              <p class="text-xs mt-1 text-gray-600">تُستخدم لربط حساب واتساب للأعمال الخاص بك، وتسجيل أرقام الهواتف، والاشتراك في الويب هوك، وإدارة قوالب الرسائل.</p>
            </div>
            <div class="bg-white/50 p-3 rounded-lg border border-gray-200">
              <code class="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">whatsapp_business_messaging</code>
              <p class="text-xs mt-1 text-gray-600">تُستخدم لإرسال واستقبال رسائل واتساب بينك وبين عملائك، بما في ذلك النصوص والوسائط والقوالب المعتمدة.</p>
            </div>
          </div>

          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">ما هي بيانات ميتا التي نخزنها</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>معرف حساب واتساب للأعمال وتفاصيل رقم الهاتف المرتبط به</li>
            <li>رموز الوصول المطلوبة للمصادقة على طلبات واجهة برمجة التطبيقات نيابة عنك</li>
            <li>حمولات أحداث الويب هوك بما في ذلك الرسائل الواردة وحالات التسليم</li>
            <li>قوالب الرسائل التي تمت مزامنتها من حساب ميتا الخاص بك</li>
            <li>معلومات الملف الشخصي لنشاط واتساب التجاري (اسم العرض، الوصف، إلخ)</li>
          </ul>

          <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
            <span class="text-[10px] font-mono text-blue-600 uppercase tracking-widest block mb-1">الامتثال لمنصة ميتا</span>
            <p class="text-xs text-blue-800 leading-relaxed">تُستخدم البيانات التي يتم الحصول عليها من خلال منصة ميتا حصرياً لتوفير الميزات الموضحة في هذه السياسة. نحن لا نستخدم بيانات منصة ميتا للإعلان، ولا نبيعها لأطراف ثالثة، ولا نستخدمها بما يتجاوز تقديم خدمة مدار.</p>
          </div>
        `,
      },
      {
        title: "بيانات Google وGmail",
        body: `
          <p>تتيح مدار للمستخدم المصرح له ربط حساب Gmail وإرسال حملات بريد إلكتروني أو رسائل اختبار من هذا الحساب. يستخدم الربط نطاقات الصلاحية <code class="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">openid</code> و<code class="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">email</code> و<code class="text-xs font-mono bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">https://www.googleapis.com/auth/gmail.send</code>.</p>

          <h3 class="text-sm font-bold text-gray-800 mt-4 mb-1 uppercase tracking-wider">بيانات Google التي نصل إليها ونخزنها</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>معرف حساب Google وعنوان البريد الإلكتروني المؤكد واسم العرض إذا قدمته Google ونطاقات OAuth الممنوحة</li>
            <li>رمز تحديث OAuth مشفر أثناء التخزين ومحفوظ على خوادم مدار فقط لإرسال الرسائل المطلوبة من الحساب المربوط</li>
            <li>سجلات الإرسال التقنية، ومنها المرسل المربوط والمستلم وحالة التسليم ومعرف رسالة Gmail عند إرجاعه</li>
          </ul>

          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">كيف نستخدم بيانات Google</h3>
          <p class="mb-3">نستخدم هوية Google فقط للتعرف على المرسل المربوط وعرضه وربطه بالمستخدم ومساحة العمل الصحيحة في مدار. ونستخدم صلاحية Gmail فقط لإرسال رسائل الاختبار والحملات التي ينشئها مستخدم مصرح له ويبدأ إرسالها عبر مدار.</p>

          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">بيانات لا نصل إليها</h3>
          <p class="mb-3">لا تقرأ مدار رسائل صندوق الوارد أو الرسائل المستلمة أو المسودات أو جهات الاتصال أو المرفقات أو التصنيفات أو سجل صندوق البريد، ولا تعرضها أو تنزلها أو تحذفها أو تعدلها.</p>

          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">تحكمك في الاتصال</h3>
          <p class="mb-3">أنت من يختار السماح بربط حساب Gmail. تدعم مدار قطع اتصال الحساب وإلغاء رمز Google الخاص به، ويمكنك إلغاء وصول مدار في أي وقت من أذونات حساب Google.</p>

          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">المشاركة والاستخدام المحدود</h3>
          <p class="mb-3">لا تُفصح بيانات Google إلا إلى Google وGmail لتنفيذ الإرسال المطلوب عبر مدار، أو إلى مزودي البنية التحتية الذين يعالجونها نيابة عنا عند الحاجة لتشغيل الخدمة وتأمينها، أو عندما يفرض القانون ذلك. لا نبيع هذه البيانات، ولا نشاركها بين مساحات العمل، ولا نستخدمها للإعلانات أو إنشاء الملفات التعريفية، ولا نفصح عنها لوسطاء البيانات أو بائعي المعلومات، ولا نستخدمها لقرارات الائتمان أو الإقراض أو لإنشاء قواعد بيانات غير مرتبطة بالخدمة.</p>
          <p>لا تستخدم مدار بيانات واجهات Google Workspace لتطوير نماذج ذكاء اصطناعي أو تعلم آلي عامة أو غير مخصصة أو تحسينها أو تدريبها. يلتزم استخدام مدار للمعلومات المستلمة من واجهات Google ونقلها بـ<a class="font-semibold text-blue-700 underline" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">سياسة بيانات مستخدمي خدمات Google API</a>، بما في ذلك متطلبات الاستخدام المحدود.</p>
        `,
      },
      {
        title: "كيف نستخدم بياناتك",
        body: `
          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">لتشغيل المنصة</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>المصادقة على حسابك وتوفير الوصول إلى لوحة التحكم</li>
            <li>معالجة وعرض سجلات الطلبات والشحن والمنتجات والعملاء</li>
            <li>ربط وإدارة حساب واتساب للأعمال الخاص بك من خلال التسجيل المدمج</li>
            <li>إرسال واستقبال رسائل واتساب نيابة عن نشاطك التجاري</li>
            <li>تقديم إشعارات واتساب الآلية لتأكيدات الطلبات والتحديثات</li>
            <li>مزامنة القوالب وحالات الرسائل وبيانات الملف الشخصي للنشاط التجاري من ميتا</li>
          </ul>

          <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mt-2 mb-1 uppercase tracking-wider">للتحسين والدعم</h3>
          <ul class="list-disc list-inside space-y-1 mb-4">
            <li>تشخيص المشكلات الفنية وإصلاح الأخطاء باستخدام سجلات الأخطاء والاستخدام</li>
            <li>تحليل أنماط استخدام المنصة لتحسين الميزات والأداء</li>
            <li>الرد على استفسارات الدعم وتقديم المساعدة للعملاء</li>
          </ul>

          <div class="bg-gray-800 p-4 rounded-xl border border-gray-700 mt-2 text-right" dir="rtl">
            <span class="text-[10px] font-mono text-gray-400 uppercase tracking-widest block mb-1">نحن لا نقوم بـ</span>
            <p class="text-xs text-gray-200 leading-relaxed">نحن لا نستخدم بياناتك أو بيانات عملائك لتدريب نماذج التعلم الآلي أو الذكاء الاصطناعي. نحن لا نستخدم بيانات منصة ميتا للإعلان ولا نبيعها لأي طرف ثالث.</p>
          </div>
        `,
      },
      {
        title: "كيف نشارك بياناتك",
        body: `
          <p>نحن لا نبيع بياناتك الشخصية. نحن نشارك البيانات فقط في الحالات المحدودة التالية:</p>
          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">مزودو الخدمة</h3>
          <p class="mb-3">نحن نعمل مع مزودي خدمة خارجيين موثوقين (الاستضافة السحابية، معالجو الدفع، توصيل البريد الإلكتروني) الذين يعالجون البيانات نيابة عنا فقط لتشغيل المنصة.</p>
          
          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">ميتا (واجهة برمجة تطبيقات واتساب)</h3>
          <p class="mb-3">يتم نقل البيانات من وإلى خوادم ميتا كجزء من تكامل واتساب السحابي، وهو ما يخضع لسياسة واتساب للأعمال وشروط منصة ميتا.</p>

          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">Google (واجهة Gmail API)</h3>
          <p class="mb-3">عندما تطلب إرسال رسالة بريد إلكتروني، يُنقل إلى Google عبر واجهة Gmail كل من هوية المرسل والمستلم والعنوان ومحتوى الرسالة والبيانات التقنية اللازمة. ولا تُشارك بيانات Google فيما عدا ذلك إلا مع الجهات المعالجة اللازمة لتشغيل مدار وتأمينها، أو عندما يفرض القانون الإفصاح.</p>
          
          <h3 class="text-sm font-bold text-gray-800 mt-3 mb-1 uppercase tracking-wider">مستخدمو الأعمال والعملاء</h3>
          <p>مدار منصة متعددة المستخدمين. يمكن لكل مستخدم أعمال الوصول فقط إلى بياناته الخاصة. بيانات مستخدم أعمال واحد لا تتم مشاركتها أو الوصول إليها من قبل مستخدمين آخرين.</p>
        `,
      },
      {
        title: "البيانات التي يتم الحصول عليها عبر منصة ميتا",
        body: `
          <ul class="list-disc list-inside space-y-1">
            <li>نطلب فقط الأذونات اللازمة للوظائف الأساسية</li>
            <li>لا نستخدم بيانات ميتا لإنشاء ملفات تعريف مستخدمين خارج الخدمة</li>
            <li>لا ننقل بيانات ميتا لوسطاء البيانات أو شبكات الإعلان</li>
            <li>لا نستخدم بيانات ميتا لاستهداف الإعلانات داخل أو خارج منتجات ميتا</li>
            <li>نخزن رموز الوصول وبيانات الاعتماد الحساسة بشكل آمن</li>
            <li>نلتزم بمتطلبات حذف البيانات عند قطع الاتصال أو حذف مساحة العمل</li>
          </ul>
        `,
      },
      {
        title: "ملفات تعريف الارتباط والبيانات التقنية",
        body: `
          <p>تستخدم مدار ملفات تعريف الارتباط الأساسية اللازمة لعمل المنصة (الحفاظ على الجلسة، الأمان). نستخدم أيضاً أدوات التحليل لفهم أنماط الاستخدام وتحسين الأداء. بيانات التحليل مجمعة ولا تحدد هويتك الشخصية.</p>
        `,
      },
      {
        title: "أمن البيانات",
        body: `
          <ul class="list-disc list-inside space-y-1">
            <li>تشفير البيانات أثناء النقل باستخدام TLS/HTTPS</li>
            <li>تشفير بيانات الاعتماد الحساسة عند التخزين</li>
            <li>تبقى رموز تحديث Google OAuth على الخادم ولا تظهر مطلقاً في استجابات الواجهة الأمامية</li>
            <li>ضوابط الوصول التي تقيد وصول الموظفين إلى بيانات الإنتاج</li>
            <li>تفويض على مستوى المالك وعزل بيانات مساحات العمل للحسابات المرتبطة بـGmail</li>
          </ul>
          <p class="mt-3 text-xs italic">بينما نتخذ تدابير معقولة تجارياً لحماية بياناتك، لا يوجد نظام محصن تماماً ضد المخاطر الأمنية. لا يمكننا ضمان الأمن المطلق.</p>
        `,
      },
      {
        title: "الاحتفاظ بالبيانات",
        body: `
          <ul class="list-disc list-inside space-y-1">
            <li>بيانات الطلبات والتجارة: حتى 7 سنوات للامتثال المالي</li>
            <li>سجل رسائل واتساب: يتم الاحتفاظ به حتى حذف المحادثة أو الحساب</li>
            <li>رموز وصول ميتا: يتم الاحتفاظ بها فقط طالما أن الحساب متصل</li>
            <li>بيانات اعتماد Google OAuth: يُحتفظ بها أثناء اتصال حساب Gmail. وعند قطع الاتصال، تطلب مدار إلغاء الرمز وتحذف بيانات الاعتماد المخزنة بعد اكتمال معالجة الإلغاء.</li>
            <li>قد نحتفظ بالحد الأدنى من بيانات هوية اتصال Google لحماية ملكية الحساب والأمان ومنع الاحتيال والوفاء بالالتزامات القانونية.</li>
            <li>يُحتفظ بسجلات حملات البريد والإرسال فقط للمدة اللازمة لتشغيل الخدمة وتأمينها والاحتفاظ بسجلات التدقيق ومعالجة مشكلات التسليم والوفاء بالالتزامات القانونية.</li>
          </ul>
          <p class="mt-3">يمكنك طلب الوصول إلى بيانات Google المنطبقة أو حذفها عبر البريد <a class="font-semibold text-blue-700 underline" href="mailto:info@getmadar.net">info@getmadar.net</a>. وقد نحتفظ ببعض المعلومات عند الحاجة للأمان أو منع الاحتيال أو الامتثال القانوني أو حل النزاعات أو حفظ السجلات.</p>
        `,
      },
      {
        title: "حقوقك",
        body: `
          <p>وفقاً للقانون المعمول به، لديك الحق في <strong>الوصول، التصحيح، الحذف، النقل، التقييد، الاعتراض،</strong> و<strong>سحب الموافقة</strong>. لممارسة هذه الحقوق، راسلنا عبر <a class="font-semibold text-blue-700 underline" href="mailto:info@getmadar.net">info@getmadar.net</a>.</p>
        `,
      },
      {
        title: "التغييرات على هذه السياسة",
        body: `
          <p>نحافظ على تحديث هذه السياسة. إذا أجرينا تغييراً جوهرياً على كيفية وصول مدار إلى بيانات مستخدم Google أو استخدامها أو تخزينها أو مشاركتها، فسنحدث التاريخ أعلاه ونبلغ المستخدمين المتأثرين داخل التطبيق أو عبر البريد الإلكتروني قبل سريان التغيير عندما يكون ذلك مطلوباً.</p>
        `,
      },
      {
        title: "اتصل بنا",
        body: `
          <div class="bg-white/50 p-4 rounded-xl border border-gray-100 space-y-2">
            <p class="text-xs flex items-center gap-2 text-left" dir="ltr"><span class="font-mono text-gray-400 w-16 uppercase">Platform</span> Madar — getmadar.net</p>
            <p class="text-xs flex items-center gap-2 text-left" dir="ltr"><span class="font-mono text-gray-400 w-16 uppercase">Privacy</span> <a class="text-blue-700 underline" href="mailto:info@getmadar.net">info@getmadar.net</a></p>
          </div>
        `,
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
