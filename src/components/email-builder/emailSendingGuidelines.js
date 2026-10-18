const text = (ar, en) => ({ ar, en });
const advice = (type, arTitle, enTitle, ar, en) => ({
  type,
  title: text(arTitle, enTitle),
  description: text(ar, en),
});

export const EMAIL_GUIDELINE_TYPES = {
  required: text("إلزامي", "Required"),
  recommended: text("مُستحسن", "Recommended"),
  prohibited: text("ممنوع", "Prohibited"),
  platform: text("ما يفعله مدار", "Madar behavior"),
};

export const EMAIL_SENDING_GUIDELINES = [
  {
    id: "consent",
    title: text("قبل إنشاء الحملة: القائمة والموافقة", "Before the campaign: list and consent"),
    advices: [
      advice("required", "موافقة واضحة", "Clear consent", "أرسل الرسائل التسويقية فقط لمن وافق عن علم، واحتفظ بتاريخ الموافقة ومصدرها. الشراء السابق وحده لا يكفي.", "Send marketing email only to people who knowingly consented. Keep the consent date and source; a previous purchase alone is insufficient."),
      advice("recommended", "تأكيد الاشتراك", "Confirm subscriptions", "استخدم التأكيد المزدوج عند الإمكان، وأعد تأكيد رغبة المشتركين دوريًا.", "Use double opt-in when practical and periodically reconfirm subscriber interest."),
      advice("required", "احترم الإلغاء", "Honor unsubscribes", "استبعد من ألغى اشتراكه ونفّذ طلب الإلغاء بأسرع وقت، وبحد أقصى 48 ساعة.", "Exclude unsubscribed recipients and process requests promptly, within 48 hours at most."),
      advice("recommended", "قائمة نظيفة", "Keep a clean list", "أزل العناوين المكررة وغير الصالحة والمرتدة نهائيًا ومن اشتكى سابقًا.", "Remove duplicates, invalid addresses, permanent bounces, and previous complainers."),
      advice("recommended", "قسّم الجمهور", "Segment the audience", "أرسل للمستلمين ما طلبوه فقط، واشرح عند التسجيل نوع الرسائل ووتيرتها.", "Send only what recipients requested and explain message type and frequency at signup."),
      advice("recommended", "افصل أنواع الرسائل", "Separate message types", "افصل التسويق عن الإيصالات وكلمات المرور، ولا تشترط الموافقة التسويقية لتلقي الرسائل الأساسية.", "Separate marketing from receipts and security messages; do not make essential email conditional on marketing consent."),
      advice("recommended", "اختبر قبل الإطلاق", "Test before launch", "أرسل رسالة اختبار وراجع الجوال والروابط وإلغاء الاشتراك.", "Send a test and review mobile rendering, links, and unsubscribe behavior."),
      advice("prohibited", "لا تشترِ القوائم", "Do not buy lists", "لا تشترِ العناوين أو تجمعها أو تخمّنها، ولا تعتبر استيراد CSV دليلًا على الموافقة.", "Do not buy, scrape, or guess addresses. Importing a CSV does not prove consent."),
      advice("prohibited", "لا تعِد المشترك الملغي", "Do not re-add unsubscribers", "لا تعِد إضافة من ألغى اشتراكه ولا تستخدم خانات اشتراك مفعّلة مسبقًا.", "Do not re-add unsubscribed people or use preselected consent boxes."),
      advice("prohibited", "لا تفاجئ قائمة قديمة", "Do not blast an old list", "لا ترسل حملة كبيرة مفاجئة لقائمة قديمة قبل التحقق من الإذن والتفاعل.", "Do not suddenly send a large campaign to an old list before checking permission and engagement."),
      advice("prohibited", "لا تنتحل الهوية", "Do not impersonate", "لا تستخدم اسم جهة أخرى أو نطاقها أو شعارها دون إذن.", "Do not use another organization’s name, domain, or logo without permission."),
      advice("prohibited", "لا تدوّر الحسابات", "Do not rotate accounts", "لا تبدّل حسابات Gmail للتهرب من حدود الإرسال أو إجراءات Google.", "Do not rotate Gmail accounts to evade sending limits or enforcement."),
    ],
  },
  {
    id: "sender",
    title: text("اسم المرسل", "Sender identity"),
    advices: [
      advice("recommended", "هوية ثابتة وحقيقية", "Use a real, stable identity", "اجعل اسم المرسل والعنوان والرد ثابتة وصحيحة وتعرّف بنشاطك الحقيقي.", "Keep sender name, address, and reply details stable, accurate, and tied to your real business."),
      advice("prohibited", "لا تضع إعلانًا في الاسم", "Do not advertise in the name", "لا تضع في اسم المرسل عبارات مثل «عاجل» أو «آخر فرصة».", "Do not put subject-like text such as “Urgent” or “Last chance” in the sender name."),
      advice("prohibited", "لا تقلّد محادثة", "Do not imitate a conversation", "لا تضع اسم المستلم أو ما يوحي بمحادثة مثل User (2).", "Do not use the recipient’s name or conversation-like labels such as User (2)."),
      advice("prohibited", "لا تستخدم رموزًا مضللة", "Avoid deceptive symbols", "لا تستخدم رموز توثيق أو إيموجي مضللًا أو عنوان Gmail كاسم عرض.", "Do not use fake verification marks, deceptive emoji, or a Gmail address as the display name."),
      advice("prohibited", "لا تتظاهر بعلاقة شخصية", "Do not fake a relationship", "لا تتظاهر بأنك صديق أو موظف أو جهة ليست المرسل الحقيقي.", "Do not pretend to be a friend, employee, or organization that is not the true sender."),
    ],
  },
  {
    id: "subject",
    title: text("العنوان والنص التمهيدي", "Subject and preheader"),
    advices: [
      advice("required", "عنوان صادق", "Use an honest subject", "يجب أن يصف العنوان محتوى الرسالة فعلاً.", "The subject must accurately describe the message."),
      advice("recommended", "ضع الأهم أولًا", "Lead with what matters", "كن محددًا، وضع الأهم أولًا، وراجع كيف يُقص العنوان على الجوال.", "Be specific, put the key information first, and check mobile truncation."),
      advice("recommended", "نص تمهيدي متوافق", "Match the preheader", "اجعل النص التمهيدي يدعم العنوان ولا يناقضه.", "Make the preheader support rather than contradict the subject."),
      advice("recommended", "تخصيص آمن", "Personalize safely", "استخدم بيانات صحيحة وقيمة بديلة عند غياب اسم العميل أو بياناته.", "Use accurate personalization and a fallback when customer data is missing."),
      advice("recommended", "كتابة طبيعية", "Write naturally", "تجنب الأحرف الكبيرة المفرطة وعلامات التعجب الكثيرة؛ إيموجي واحد مناسب مقبول.", "Avoid excessive capitals and exclamation marks; one relevant emoji can be acceptable."),
      advice("prohibited", "لا تستخدم Re: أو Fwd: زائفة", "No fake Re: or Fwd:", "لا تستخدم Re: أو Fwd: إلا لرد أو إعادة توجيه حقيقية.", "Use Re: or Fwd: only for a real reply or forwarded message."),
      advice("prohibited", "لا تدّعِ حدثًا زائفًا", "Do not invent events", "لا تدّعِ فاتورة أو تعليق حساب أو فشل توصيل أو طارئًا أمنيًا غير حقيقي.", "Do not invent invoices, account suspension, delivery failure, or security emergencies."),
      advice("prohibited", "لا تستخدم وعودًا كاذبة", "No false promises", "لا تدّعِ خصومات أو مخزونًا أو جوائز أو أسعارًا أو مواعيد غير حقيقية.", "Do not make false claims about discounts, stock, prizes, prices, or deadlines."),
      advice("prohibited", "لا توحِ بتوثيق مزيف", "No fake verification", "لا تستخدم رموزًا أو صياغة توحي بتوثيق أو انتماء موثوق غير حقيقي.", "Do not use symbols or wording that falsely imply verification or trusted affiliation."),
    ],
  },
  {
    id: "content",
    title: text("المحتوى والتصميم", "Content and design"),
    advices: [
      advice("required", "عرّف بنشاطك", "Identify your business", "اذكر نشاطك الحقيقي وسبب وصول الرسالة، ولا تضلل في المحتوى أو الروابط.", "Identify your real business and why the recipient is receiving the email; keep content and links truthful."),
      advice("required", "إلغاء اشتراك ظاهر", "Visible unsubscribe", "يجب أن تحتوي الرسالة التسويقية على رابط إلغاء اشتراك ظاهر.", "Every marketing message must contain a visible unsubscribe link."),
      advice("recommended", "بيانات تواصل حقيقية", "Real contact details", "ضع وسيلة تواصل حقيقية وعنوانًا بريديًا حيث يشترط القانون.", "Provide real contact details and a postal address where legally required."),
      advice("recommended", "روابط وأزرار واضحة", "Clear links and buttons", "استخدم أزرارًا واضحة الوجهة وروابط بنطاقات معروفة، ويفضل HTTPS، واختبر كل رابط.", "Use destination-specific buttons and recognizable domains, prefer HTTPS, and test every link."),
      advice("recommended", "تصميم قابل للقراءة", "Accessible design", "استخدم خطًا مقروءًا ونصًا بديلًا وتباينًا جيدًا وتصميمًا متجاوبًا مع نسخة نصية.", "Use readable fonts, alt text, sufficient contrast, responsive layout, and a plain-text version."),
      advice("recommended", "رسالة خفيفة", "Keep messages light", "اضغط الصور وتجنب المرفقات الكبيرة وأكواد التتبع غير الضرورية.", "Compress images and avoid large attachments and unnecessary tracking code."),
      advice("recommended", "اشرح شروط العرض", "Explain offer terms", "اذكر الانتهاء والأهلية والاستثناءات ودقق اللغة والأسعار والمتغيرات.", "State expiry, eligibility, and exclusions; verify language, prices, and variables."),
      advice("recommended", "تفضيلات المشترك", "Offer preferences", "اسمح بتفضيلات التكرار والموضوع إلى جانب الإلغاء الكامل.", "Offer frequency and topic preferences in addition to full unsubscribe."),
      advice("prohibited", "لا تخفِ المحتوى", "Do not hide content", "لا تخفِ نصًا أو روابط باستخدام HTML أو CSS.", "Do not conceal text or links with HTML or CSS."),
      advice("prohibited", "لا محتوى ضارًا", "No harmful content", "لا تصيّد أو برمجيات خبيثة أو عروض احتيالية أو تحويلات مضللة أو مرفقات غير آمنة.", "No phishing, malware, fraud, deceptive redirects, or unsafe attachments."),
      advice("prohibited", "لا روابط مختصرة غامضة", "No obscured short links", "لا تستخدم روابط مختصرة أو ملتبسة تخفي الوجهة.", "Do not use shortened or ambiguous links that hide their destination."),
      advice("prohibited", "لا تسويقًا متنكرًا", "Do not disguise marketing", "لا تخفِ التسويق كرسالة معاملات، ولا ترسل صورة فقط بلا نص.", "Do not disguise marketing as transactional email or send image-only messages."),
      advice("prohibited", "لا متغيرات مكسورة", "No broken variables", "لا ترسل متغيرات غير مستبدلة أو روابط معطلة، ولا تضع بيانات حساسة في العنوان.", "Do not send unresolved variables or broken links, and never put sensitive customer data in the subject."),
    ],
  },
  {
    id: "unsubscribe",
    title: text("إلغاء الاشتراك", "Unsubscribe"),
    advices: [
      advice("required", "رابط بلا عوائق", "Frictionless link", "وفّر رابطًا ظاهرًا يعمل بلا تسجيل دخول أو استبيان.", "Provide a visible link that works without login or a survey."),
      advice("required", "نفّذ خلال 48 ساعة", "Process within 48 hours", "نفّذ طلب الإلغاء خلال 48 ساعة كحد أقصى.", "Process unsubscribe requests within 48 hours at most."),
      advice("required", "إلغاء بنقرة واحدة", "One-click unsubscribe", "عند إرسال نحو 5,000 رسالة يوميًا إلى Gmail، استخدم إلغاء بنقرة واحدة RFC 8058 إضافة إلى رابط التذييل.", "At roughly 5,000 daily messages to Gmail, implement RFC 8058 one-click unsubscribe in addition to the footer link."),
      advice("required", "سجل دائم", "Permanent suppression", "احتفظ بسجل إلغاء دائم وطبقه على الاستيرادات والحملات التالية.", "Keep a durable suppression record and apply it to imports and future campaigns."),
      advice("required", "افصل التسويق عن الضروري", "Separate essential email", "إلغاء التسويق لا يوقف رسائل الأمان والمعاملات الضرورية.", "Marketing unsubscribe must not block necessary security or transactional messages."),
      advice("recommended", "مركز تفضيلات", "Preference center", "يمكن توفير مركز تفضيلات بشرط ألا يعيق الإلغاء الكامل.", "A preference center is useful as long as it does not obstruct full unsubscribe."),
    ],
  },
  {
    id: "pace",
    title: text("وتيرة الإرسال وحدود Gmail", "Sending pace and Gmail limits"),
    advices: [
      advice("recommended", "ابدأ تدريجيًا", "Ramp up gradually", "ابدأ بالمشتركين المتفاعلين وبحجم صغير، وزد الحجم تدريجيًا.", "Start with engaged subscribers and a small volume, then increase gradually."),
      advice("recommended", "وتيرة ثابتة", "Keep a steady pace", "تجنب الدفعات الكبيرة والقفزات المفاجئة في الحجم.", "Avoid large bursts and sudden volume jumps."),
      advice("recommended", "استجب للمؤشرات", "React to warning signals", "عند ارتفاع الرفض أو التأجيل أو الشكاوى، أبطئ أو أوقف وافحص السبب.", "Slow or stop when rejection, deferral, or complaint rates rise, then investigate."),
      advice("required", "احترم حدود Gmail", "Respect Gmail limits", "حدود الحساب ليست تصريحًا بإرسال رسائل غير مطلوبة.", "Account limits are not permission to send unsolicited mail."),
      advice("required", "لا تتحايل", "Do not evade enforcement", "لا تدوّر الحسابات أو تستخدم عدة حسابات للتحايل على الإنفاذ.", "Do not rotate or multiply accounts to evade enforcement."),
      advice("recommended", "إرسال متسلسل", "Serialize account sends", "لا ترسل بالتوازي من الحساب نفسه، واحترم توقيت إعادة المحاولة.", "Do not send concurrently from one account; respect retry timing."),
      advice("prohibited", "لا شبكات تسخين مصطنعة", "No artificial warm-up networks", "لا تعتمد على شبكات تسخين أو تفاعل مصطنع.", "Do not rely on artificial warm-up or engagement networks."),
    ],
  },
  {
    id: "reputation",
    title: text("السمعة وصحة القائمة", "Reputation and list health"),
    advices: [
      advice("recommended", "راقب الشكاوى", "Monitor complaints", "استهدف معدل شكاوى أقل من 0.1% وتجنب بلوغ 0.3%.", "Aim for complaints below 0.1% and avoid reaching 0.3%."),
      advice("recommended", "استخدم Postmaster Tools", "Use Postmaster Tools", "استخدم Postmaster Tools للنطاقات الموثقة؛ قد لا تظهر بيانات لعناوين Gmail الفردية.", "Use Postmaster Tools for verified domains; personal Gmail addresses may not receive data."),
      advice("recommended", "راقب مؤشرات الإرسال", "Track sending signals", "راقب الارتداد والتأجيل والشكاوى والرفض؛ Gmail API لا يوفر تقارير فتح ونقر وتسليم كاملة.", "Monitor bounces, deferrals, complaints, and rejections; Gmail API does not provide complete delivery, open, or click reporting."),
      advice("recommended", "أوقف العناوين السيئة", "Suppress bad addresses", "أوقف المرتد نهائيًا وخفف أو أوقف إرسال غير المتفاعلين.", "Suppress permanent bounces and reduce or stop sends to unengaged recipients."),
      advice("recommended", "سهّل الإلغاء", "Make unsubscribe easy", "اجعل الإلغاء أسهل من الإبلاغ كمزعج، وافصل القوائم حسب الاهتمام.", "Make unsubscribe easier than reporting spam and segment lists by interest."),
      advice("recommended", "راجع الحملات السيئة", "Review harmful campaigns", "راجع أي حملة تسبب قفزة في الشكاوى أو الرفض أو الإلغاءات.", "Review any campaign that causes a spike in complaints, rejections, or unsubscribes."),
      advice("prohibited", "لا تصيّد تجريبيًا", "No phishing simulations", "لا ترسل حملات تصيد تجريبية من نطاق الإرسال التسويقي.", "Do not send phishing simulations from your marketing domain."),
    ],
  },
  {
    id: "technical",
    title: text("تقنية: لمسؤول النطاق", "Technical: domain administrator"),
    advices: [
      advice("required", "مصادقة وتنسيق صحيح", "Authenticate and format correctly", "استخدم SPF أو DKIM وDNS أماميًا وعكسيًا وTLS وتنسيق RFC 5322 وMessage-ID صالحًا وترويسات مرسل دقيقة.", "Use SPF or DKIM, forward and reverse DNS, TLS, RFC 5322 formatting, a valid Message-ID, and accurate sender headers."),
      advice("required", "شكاوى أقل من 0.3%", "Keep complaints below 0.3%", "حافظ على معدل شكاوى Postmaster Tools أقل من 0.3%.", "Keep the Postmaster Tools complaint rate below 0.3%."),
      advice("required", "متطلبات المرسل الكبير", "Bulk sender requirements", "من نحو 5,000 رسالة يوميًا استخدم SPF وDKIM معًا وDMARC ومحاذاة النطاق وإلغاء بنقرة واحدة.", "At roughly 5,000 daily messages, use SPF and DKIM together, DMARC, domain alignment, and one-click unsubscribe."),
      advice("recommended", "مفتاح DKIM قوي", "Use a strong DKIM key", "استخدم مفتاح DKIM بطول 1024 بت على الأقل، ويفضل 2048.", "Use at least a 1024-bit DKIM key; 2048 bits is preferred."),
      advice("recommended", "وقّع ترويسات الإلغاء", "Sign unsubscribe headers", "اجعل DKIM يغطي ترويسات الإلغاء وافحص الترويسات الواصلة فعليًا.", "Have DKIM cover unsubscribe headers and inspect the headers that actually arrive."),
    ],
  },
  {
    id: "failures",
    title: text("الأخطاء والإيقاف", "Failures and stopping behavior"),
    advices: [
      advice("platform", "حد الإرسال 429", "429 sending limit", "يوقف مدار الحساب ويحترم توقيت Google. مع 4.7.28 لا يعيد الإرسال قبل عشر دقائق على الأقل.", "Madar pauses the account and respects Google timing. For 4.7.28, it waits at least ten minutes."),
      advice("platform", "وصول ملغى 401", "401 revoked access", "يوقف مدار الإرسال ويطلب إعادة ربط الحساب.", "Madar stops sending and requires account reconnection."),
      advice("platform", "سياسة أو صلاحيات 403", "403 policy or permission", "يتوقف مدار ويعرض التشخيص دون إعادة محاولة تلقائية.", "Madar stops and reports the problem without automatic retry."),
      advice("platform", "أخطاء الخادم 5xx", "5xx server errors", "يستخدم مدار تراجعًا أسيًا محدودًا مع تباين عشوائي.", "Madar uses bounded exponential backoff with random jitter."),
      advice("platform", "رفض دائم", "Permanent rejection", "يحظر مدار العنوان المرفوض نهائيًا ولا يعيد المحاولة.", "Madar suppresses permanently rejected addresses and does not retry."),
      advice("platform", "تدهور السمعة", "Reputation degradation", "عند ارتفاع الارتداد أو الشكاوى، يوقف مدار الحملة أو الحساب للفحص.", "When bounces or complaints rise, Madar pauses the campaign or account for review."),
      advice("platform", "نتيجة غير مؤكدة", "Unknown outcome", "لا يعيد مدار الإرسال تلقائيًا عند انتهاء المهلة دون نتيجة مؤكدة حتى لا تتكرر الرسالة.", "Madar does not automatically resend after an uncertain timeout, preventing duplicate delivery."),
    ],
    note: text("نجاح Gmail API يعني قبول الطلب، وليس تأكيد وصول الرسالة.", "Gmail API success means the request was accepted, not that delivery was confirmed."),
  },
];

export const EMAIL_GUIDELINE_SOURCES = [
  { title: text("إرشادات مرسلي Gmail", "Gmail sender guidelines"), url: "https://support.google.com/mail/answer/81126" },
  { title: text("إرشادات الاشتراك", "Email subscription guidelines"), url: "https://support.google.com/mail/answer/15263077" },
  { title: text("حدود إرسال Gmail", "Gmail sending limits"), url: "https://support.google.com/mail/answer/22839" },
];
