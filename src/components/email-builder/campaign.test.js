import { describe, it, expect } from "vitest";
import {
  initialWizardData,
  buildCampaignPayload,
  validateStepMessage,
  validateStepOffer,
} from "@/app/[locale]/campaigns/atoms/wizard/wizardSchema";
import {
  emptyDocument,
  emailContentPayload,
  buildEmailPreviewPayload,
} from "./document";
import {
  shouldApplyTextStyleToAll,
  shouldSkipFormattingAction,
} from "./textFormatting";
import {
  EMAIL_DEFAULT_STYLE,
  EMAIL_ALLOWED_FONTS,
  EMAIL_FONT_FAMILY_PATTERN,
} from "./defaults";
import {
  EMAIL_GUIDELINE_SOURCES,
  EMAIL_SENDING_GUIDELINES,
} from "./emailSendingGuidelinesConfig";
describe("email campaign integration", () => {
  it("keeps every sending guideline and source bilingual", () => {
    expect(EMAIL_SENDING_GUIDELINES.length).toBeGreaterThan(0);
    for (const group of EMAIL_SENDING_GUIDELINES) {
      expect(group.title.ar).toBeTruthy();
      expect(group.title.en).toBeTruthy();
      for (const item of group.advices) {
        expect(item.type).toBeTruthy();
        expect(item.title.ar).toBeTruthy();
        expect(item.title.en).toBeTruthy();
        expect(item.description.ar).toBeTruthy();
        expect(item.description.en).toBeTruthy();
      }
    }
    expect(EMAIL_GUIDELINE_SOURCES).toHaveLength(3);
  });
  it("preserves email identities and content without submitting WhatsApp fields", () => {
    const email = {
      accountId: "account",
      subject: "Hello",
      businessIdentity: "Store",
      document: emptyDocument(),
    };
    const data = {
      ...initialWizardData,
      name: "Email campaign",
      channel: "email",
      email,
      audienceType: "manual",
      manualRecipients: [{ email: "customer@example.com", name: "Customer" }],
      whatsapp: { templateId: "old" },
    };
    const payload = buildCampaignPayload(data);
    expect(payload.email).toEqual(email);
    expect(payload).not.toHaveProperty("whatsapp");
    expect(payload.manualRecipients).toEqual([
      { email: "customer@example.com", name: "Customer" },
    ]);
    expect(validateStepMessage(data)).toEqual({});
  });
  it("requires email content and recognizes purchase links in email designs", () => {
    expect(
      validateStepMessage({ ...initialWizardData, channel: "email" }),
    ).toHaveProperty("email.document");
    const data = {
      ...initialWizardData,
      channel: "email",
      enablePurchasePage: true,
      email: { subject: "{{campaign.orderUrl}}" },
      products: [{ variantId: "variant" }],
    };
    expect(validateStepOffer(data)).toEqual({});
    expect(
      validateStepOffer({ ...data, email: { subject: "No link" } }),
    ).toHaveProperty("enablePurchasePage");
  });
  it("blocks a suspended sender locally and omits its UI status from payloads", () => {
    const data = {
      ...initialWizardData,
      channel: "email",
      email: {
        accountId: "sender",
        accountStatus: "suspended",
        subject: "Hello",
        businessIdentity: "Store",
        document: emptyDocument(),
      },
    };
    expect(validateStepMessage(data)).toEqual({
      "email.accountId": "validation.emailAccountSuspended",
    });
    expect(buildCampaignPayload(data).email).not.toHaveProperty(
      "accountStatus",
    );
  });
});

it("uses the strict content API contract without sender fields", () => {
  expect(
    emailContentPayload({
      accountId: "sender",
      ownerId: "owner",
      subject: "Subject",
      document: emptyDocument(),
      businessIdentity: "Store",
    }),
  ).not.toHaveProperty("accountId");
  expect(emailContentPayload({ ownerId: "owner" })).not.toHaveProperty(
    "ownerId",
  );
});

it("builds the same preview payload for builder and review from the same form state", () => {
  const email = {
    subject: "Welcome",
    preheader: "A quick update",
    businessIdentity: "Northwind",
    document: emptyDocument(),
  };
  const variables = {
    "customer.name": "Ahmed",
    "customer.email": "customer@example.com",
  };

  expect(buildEmailPreviewPayload({ email, variables })).toEqual({
    subject: "Welcome",
    preheader: "A quick update",
    businessIdentity: "Northwind",
    document: email.document,
    variables,
  });
  expect(emailContentPayload(email, variables)).toEqual(
    buildEmailPreviewPayload({ email, variables }),
  );
  expect(emailContentPayload(email, variables)).toEqual(
    emailContentPayload(email, variables),
  );
});

it("applies font style changes to all text only when no selection is active", () => {
  const blurredEditor = {
    state: { selection: { from: 0, to: 0 } },
    isFocused: false,
  };

  expect(shouldApplyTextStyleToAll({ editor: blurredEditor, kind: "fontFamily" })).toBe(true);
  expect(shouldApplyTextStyleToAll({ editor: blurredEditor, kind: "fontSize" })).toBe(true);
  expect(shouldSkipFormattingAction({ editor: blurredEditor, kind: "bold" })).toBe(true);
  expect(shouldSkipFormattingAction({ editor: blurredEditor, kind: "underline" })).toBe(true);

  const focusedEditor = {
    state: { selection: { from: 3, to: 8 } },
    isFocused: true,
  };

  expect(shouldApplyTextStyleToAll({ editor: focusedEditor, kind: "fontFamily" })).toBe(false);
  expect(shouldSkipFormattingAction({ editor: focusedEditor, kind: "bold" })).toBe(false);
});

it("starts new email documents with Cairo and explicit zero padding", () => {
  expect(emptyDocument().defaults).toMatchObject({
    fontFamily: "Cairo",
    fontSize: 16,
    padding: 0,
  });
});

it("uses the same shared email design contract across the app", () => {
  expect(EMAIL_DEFAULT_STYLE).toMatchObject({
    fontFamily: "Cairo",
    fontSize: 16,
    color: "#222222",
    padding: 0,
  });
  expect(EMAIL_ALLOWED_FONTS).toContain("Cairo");
  expect(EMAIL_FONT_FAMILY_PATTERN.test("Tajawal")).toBe(true);
  expect(EMAIL_FONT_FAMILY_PATTERN.test("Comic Sans")).toBe(false);
});
