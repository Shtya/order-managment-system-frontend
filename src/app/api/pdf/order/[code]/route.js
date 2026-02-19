import puppeteer from 'puppeteer';

export async function GET(req, { params }) {
  const { code } = params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'ar';
 
  const baseUrl = process.env.BASE_URL_FRONT;
  if (!baseUrl) {
    return new Response('Missing BASE_URL in env', { status: 500 });
  }

  const printUrl = `${baseUrl}/${locale}/warehouse/print/${encodeURIComponent(code)}`;

  const browser = await puppeteer.launch({
    headless: 'new',
  });

  try {
    const page = await browser.newPage();

    // مهم: خلي الخلفيات تطلع (Tailwind gradients/bg)
    await page.goto(printUrl, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
    <div style="font-size:10px;width:100%;padding:0 12mm;color:#6b7280;display:flex;justify-content:space-between;">
      <span>Order: ${code}</span>
      <span style="margin-left:auto;">Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>
  `,
      margin: { top: '14mm', right: '12mm', bottom: '16mm', left: '12mm' },
    });

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="order_${code}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
