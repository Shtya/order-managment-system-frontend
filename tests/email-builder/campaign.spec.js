import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page, context, baseURL }) => {
  // Synthetic app session plus intercepted API: never connect/send/save against a real tenant.
  const user = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Editor test",
    role: { name: "admin", permissionNames: ["*"] },
    subscriptions: [{ plan: { name: "Test" } }],
    onboardingStatus: "completed",
    isActive: true,
    permissions: [],
  };
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, isOnboarding: false }),
  ).toString("base64url");
  const token = `eyJhbGciOiJIUzI1NiJ9.${payload}.test-only`;
  await context.addCookies([
    { name: "user", value: JSON.stringify(user), url: baseURL },
  ]);
  await page.addInitScript(
    ({ user, token }) => {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    },
    { user, token },
  );
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(baseURL).origin) return route.continue();
    if (!["fetch", "xhr"].includes(route.request().resourceType()))
      return route.abort();
    const path = url.pathname;
    if (["/email/content/preview", "/email/content/validate"].includes(path)) {
      const payload = route.request().postDataJSON();
      if (
        Object.keys(payload).some(
          (key) =>
            ![
              "subject",
              "preheader",
              "businessIdentity",
              "document",
              "variables",
            ].includes(key),
        )
      )
        return route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ message: "Unexpected content property" }),
        });
    }
    const seed = {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Saved email design",
      status: "draft",
      channel: "email",
      category: "general_marketing",
      audienceType: "manual",
      audienceManualSnapshot: [
        { email: "saved@example.com", name: "Saved contact" },
      ],
      templateConfigSnapshot: {
        accountId: "22222222-2222-4222-8222-222222222222",
        subject: "Saved subject",
        businessIdentity: "Test store",
        document: {
          schemaVersion: 2,
          direction: "ltr",
          width: 600,
          blocks: [
            {
              id: "section",
              type: "section",
              children: [
                {
                  id: "column",
                  type: "column",
                  children: [
                    {
                      id: "text",
                      type: "text",
                      content: {
                        type: "doc",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "Saved content" }],
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      products: [],
    };
    const body =
      path === "/campaigns/33333333-3333-4333-8333-333333333333"
        ? seed
        : path === "/users/me"
          ? user
          : path.includes("check-name")
            ? { isUnique: true }
            : path === "/email/accounts"
              ? [
                  {
                    id: "22222222-2222-4222-8222-222222222222",
                    email: "sender@example.com",
                    status: "connected",
                  },
                ]
              : path.includes("sending-status")
                ? {
                    accountId: "22222222-2222-4222-8222-222222222222",
                    status: "connected",
                  }
                : path === "/email/content/preview"
                  ? { html: "<html><body>Preview</body></html>", htmlBytes: 46 }
                  : path === "/email/content/validate"
                    ? { valid: true }
                    : path === "/campaigns" &&
                        route.request().method() === "POST"
                      ? { id: "test-campaign" }
                      : path.includes("preferences")
                        ? {}
                        : [];
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
});

async function openBuilder(page) {
  await page.goto("/en/campaigns/new/email");
  await page
    .getByRole("textbox")
    .first()
    .fill(`Editor regression ${Date.now()}`);
  await expect
    .poll(async () => await page.getByText(/checking/i).count())
    .toBe(0);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("button", { name: /Add email addresses|Add numbers manually/ })
    .click();
  await page
    .getByPlaceholder("customer@example.com")
    .fill("preview@example.com");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByText("Design preview — approximate", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Read-only preview", { exact: true }),
  ).toBeVisible();
}
test("email text, structural history and mobile preview", async ({ page }) => {
  await openBuilder(page);
  await page
    .getByRole("button", { name: "Button", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Button text", { exact: true })).toHaveValue(
    "Button",
  );
  await page
    .getByLabel("Button text", { exact: true })
    .fill("A personal offer");
  await expect(
    page.getByText("A personal offer", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.getByRole("button", { name: "Mobile", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Desktop", exact: true }),
  ).toBeVisible();
  await page.addStyleTag({
    content: "body{font-family:Arial,sans-serif!important}",
  });
  await expect(page).toHaveScreenshot("email-builder-mobile.png", {
    fullPage: false,
    maxDiffPixelRatio: 0.02,
  });
});
test("formats selected rich text from the toolbar", async ({ page }) => {
  await openBuilder(page);
  await page
    .getByRole("button", { name: "Insert variable", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: /Customer email/ }).click();
  await expect(
    page.locator('#email-subject [data-variable="customer.email"]'),
  ).toBeVisible();

  await page.getByText("Hello {{customer.name}},", { exact: true }).click();
  const editor = page.locator(".email-rich-editor");
  await editor.selectText();
  await page.getByRole("button", { name: "Bold", exact: true }).click();
  await expect(editor.locator("strong")).toContainText("Hello");

  await editor.selectText();
  await page.getByRole("button", { name: "Underline", exact: true }).click();
  await expect(editor.locator("u")).toContainText("Hello");

  await editor.selectText();
  await page.getByRole("button", { name: "Strike", exact: true }).click();
  await expect(editor.locator("s")).toContainText("Hello");

  await expect(
    editor.locator('[data-variable="customer.name"]'),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Insert variable", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: /Customer email/ }).click();
  await expect(
    editor.locator('[data-variable="customer.email"]'),
  ).toBeVisible();
});
test("recovery excludes recipients and requires explicit restoration", async ({
  page,
}) => {
  await openBuilder(page);
  await page
    .getByRole("textbox", { name: /^Subject/ })
    .fill("Recovered design");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Restore recovered design" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Restore recovered design" }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page
    .getByRole("button", { name: /Add email addresses|Add numbers manually/ })
    .click();
  await expect(
    page.getByText("preview@example.com", { exact: true }),
  ).toHaveCount(0);
});
test("table editor exposes structural operations when enabled", async ({
  page,
}) => {
  test.skip(
    process.env.NEXT_PUBLIC_EMAIL_TABLES_ENABLED !== "true",
    "Release 2 feature flag is off.",
  );
  await openBuilder(page);
  await page
    .getByRole("button", { name: "Table", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "Merge cells", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Split cell", exact: true }),
  ).toBeVisible();
  const rows = page.locator(".email-table-editor tr");
  await expect(rows).toHaveCount(3);
  await page.locator(".email-table-editor th").first().click();
  await page.getByRole("button", { name:"Add row", exact:true }).click();
  await expect(rows).toHaveCount(4);
  await page.getByRole("button", { name:"Undo", exact:true }).click();
  await expect(rows).toHaveCount(3);
  await page.getByRole("button", { name:"Redo", exact:true }).click();
  await expect(rows).toHaveCount(4);
});

test("creates an email campaign with email recipients and a version 2 design", async ({
  page,
}) => {
  await openBuilder(page);
  await page
    .getByRole("combobox", { name: "Sender account", exact: true })
    .selectOption("22222222-2222-4222-8222-222222222222");
  await page
    .getByRole("textbox", { name: /^Subject/ })
    .fill("Campaign subject");
  await page
    .getByRole("textbox", {
      name: "Business identity / postal address",
      exact: true,
    })
    .fill("Test store, Cairo");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const request = page.waitForRequest(
    (req) =>
      new URL(req.url()).pathname === "/campaigns" && req.method() === "POST",
  );
  await page
    .getByRole("button", { name: "Save campaign", exact: true })
    .click();
  const body = (await request).postData();
  expect(body).toContain('"channel":"email"');
  expect(body).toContain('"schemaVersion":2');
  expect(body).toContain("preview@example.com");
  expect(body).not.toContain('"whatsapp":');
});
for (const mode of ["edit", "copy"]) {
  test(`${mode} preserves saved email content and email-only recipients`, async ({
    page,
  }) => {
    await page.goto(
      mode === "edit"
        ? "/en/campaigns/33333333-3333-4333-8333-333333333333/edit"
        : "/en/campaigns/new/email?fromId=33333333-3333-4333-8333-333333333333",
    );
    if (mode === "copy")
      await page.getByRole("textbox").first().fill("Copied email design");
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByText("saved@example.com", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("textbox", { name: /^Subject/ })).toHaveValue(
      "Saved subject",
    );
    await expect(
      page.getByText("Saved content", { exact: true }),
    ).toBeVisible();
  });
}
