import { EMAIL_DEFAULT_STYLE } from "./defaults";


export const copy = (value) => JSON.parse(JSON.stringify(value));
export const id = () => crypto.randomUUID();
export const richText = (text) => ({
  type: "doc",
  content: [
    { type: "paragraph", content: text ? [{ type: "text", text }] : [] },
  ],
});
export const node = (type, extra = {}) => ({
  id: id(),
  type,
  style: {},
  ...extra,
});
export const layoutColumn = (text = "") =>
  node("column", {
    style: {
      backgroundColor: "#ffffff",
      paddingTop: 14,
      paddingRight: 14,
      paddingBottom: 14,
      paddingLeft: 14,
      borderRadius: 8,
    },
    children: [
      node("text", {
        content: richText(text),
        style: { lineHeight: 1.6 },
      }),
    ],
  });
export const columnLayout = (count, text = "") =>
  node("section", {
    style: {
      backgroundColor: "#f4f7f5",
      paddingTop: 8,
      paddingRight: 8,
      paddingBottom: 8,
      paddingLeft: 8,
    },
    children: Array.from(
      { length: Math.max(1, Math.min(4, Number(count) || 1)) },
      () => layoutColumn(text),
    ),
  });
export const section = (children) =>
  node("section", { children: [node("column", { children })] });
export const emptyDocument = () => ({
  schemaVersion: 2,
  direction: "ltr",
  width: 600,
  defaults: { ...EMAIL_DEFAULT_STYLE },
  blocks: [
    section([
      node("text", {
        content: richText("Hello {{customer.name}},"),
        style: { padding: 10 },
      }),
    ]),
  ],
});
export function upgradeDocument(input) {
  if (!input) return emptyDocument();
  if (input.schemaVersion === 2) {
    const upgraded = copy(input);
    const migrateSpacing = (nodes) =>
      nodes.forEach((item) => {
        if (item.type === "button" && item.style?.spacing !== undefined) {
          item.containerStyle = {
            margin: item.style.spacing,
            ...(item.containerStyle || {}),
          };
          delete item.style.spacing;
        }
        if (item.type === "document" && !item.content) {
          item.content = richText(`▣ ${item.title || "Open document"}`);
        }
        if (item.children) migrateSpacing(item.children);
      });
    migrateSpacing(upgraded.blocks || []);
    return upgraded;
  }
  return {
    ...emptyDocument(),
    blocks: (input.blocks || []).map((block) => {
      const safe = copy(block);
      if (safe.type === "image") {
        delete safe.src;
        safe.assetId = "";
      }
      return section([node(block.type, safe)]);
    }),
  };
}
export function flatten(doc) {
  const rows = [];
  const walk = (nodes, depth = 0, parent = null) =>
    nodes.forEach((n) => {
      rows.push({ ...n, depth, parent });
      if (n.children) walk(n.children, depth + 1, n.id);
    });
  walk(doc.blocks);
  return rows;
}
export function updateNode(doc, target, patch) {
  const next = copy(doc);
  const visit = (nodes) =>
    nodes.forEach((n) => {
      if (n.id === target)
        Object.assign(n, typeof patch === "function" ? patch(n) : patch);
      if (n.children) visit(n.children);
    });
  visit(next.blocks);
  return next;
}
export function structural(doc, target, action) {
  const next = copy(doc);
  const fresh = (n) => ({
    ...n,
    id: id(),
    ...(n.children ? { children: n.children.map(fresh) } : {}),
  });
  const visit = (nodes) => {
    const i = nodes.findIndex((n) => n.id === target);
    if (i >= 0) {
      if (action === "delete") {
        if (nodes.length > 1) nodes.splice(i, 1);
        else
          nodes[i] =
            nodes[i].type === "column"
              ? node("column", {
                  children: [node("text", { content: richText("") })],
                })
              : nodes[i].type === "section" || nodes[i].type === "wrapper"
                ? section([node("text", { content: richText("") })])
                : node("text", { content: richText("") });
      }
      if (
        action === "duplicate" &&
        !(nodes[i].type === "column" && nodes.length >= 4)
      )
        nodes.splice(i + 1, 0, fresh(nodes[i]));
      if (action === "up" && i > 0)
        [nodes[i - 1], nodes[i]] = [nodes[i], nodes[i - 1]];
      if (action === "down" && i < nodes.length - 1)
        [nodes[i + 1], nodes[i]] = [nodes[i], nodes[i + 1]];
      return true;
    }
    return nodes.some((n) => n.children && visit(n.children));
  };
  visit(next.blocks);
  return next;
}
export const VARIABLES = [
  "customer.name",
  "customer.number",
  "customer.email",
  "campaign.orderUrl",
  "campaign.orderToken",
];
export const sampleVariables = {
  "customer.name": "Ahmed",
  "customer.number": "+201000000000",
  "customer.email": "customer@example.com",
  "campaign.orderUrl": "https://getmadar.net/o/sample-token",
  "campaign.orderToken": "sample-token",
};
export function starter(name) {
  const doc = emptyDocument();
  const titles = {
    blank: "Hello {{customer.name}},",
    announcement: "Our latest news",
    promotion: "A special offer for {{customer.name}}",
    product: "Your selected products",
  };
  doc.blocks = [
    section([
      node("text", {
        content: richText(titles[name]),
        style: { fontSize: 24, fontWeight: 700 },
      }),
      ...(name === "blank"
        ? []
        : [
            node("text", { content: richText("Add your message here.") }),
            node("button", {
              label: "Learn more",
              url: "https://example.com",
              style: {
                backgroundColor: "#176c51",
                color: "#ffffff",
                align: "center",
                padding: 16,
                borderRadius: 6,
              },
            }),
          ]),
    ]),
  ];
  return doc;
}
export class DocumentHistory {
  constructor(value) {
    this.value = copy(value);
    this.past = [];
    this.future = [];
    this.group = null;
    this.time = 0;
  }
  commit(value, group = null, now = Date.now()) {
    if (JSON.stringify(value) === JSON.stringify(this.value)) return this.value;
    if (!group || group !== this.group || now - this.time > 500) {
      this.past.push(copy(this.value));
      if (this.past.length > 100) this.past.shift();
    }
    this.value = copy(value);
    this.future = [];
    this.group = group;
    this.time = now;
    return this.value;
  }
  flush() {
    this.group = null;
  }
  undo() {
    this.flush();
    if (this.past.length) {
      this.future.push(this.value);
      this.value = this.past.pop();
    }
    return copy(this.value);
  }
  redo() {
    this.flush();
    if (this.future.length) {
      this.past.push(this.value);
      this.value = this.future.pop();
    }
    return copy(this.value);
  }
}

export function tableDocument() {
  return {
    type: "doc",
    content: [
      {
        type: "table",
        content: Array.from({ length: 3 }, (_, r) => ({
          type: "tableRow",
          content: Array.from({ length: 2 }, () => ({
            type: r === 0 ? "tableHeader" : "tableCell",
            attrs: { colspan: 1, rowspan: 1, colwidth: null },
            content: [{ type: "paragraph" }],
          })),
        })),
      },
    ],
  };
}
export function mediaAssetIds(document, visibleOnly = false) {
  const ids = new Set();
  const rich = (n) => {
    if (n.type === "image" && n.attrs?.assetId) ids.add(n.attrs.assetId);
    for (const c of n.content || []) rich(c);
  };
  const walk = (nodes) => {
    for (const n of nodes) {
      if (visibleOnly && n.hidden) continue;
      if (["image", "video", "document"].includes(n.type) && n.sourceType !== "remote" && n.assetId) ids.add(n.assetId);
      if (n.type === "table") rich(n.content);
      if (n.children) walk(n.children);
    }
  };
  walk(document.blocks);
  return [...ids];
}
export const imageIds = mediaAssetIds;

export function isTypingTransaction(transaction) {
  return (
    transaction.steps.length > 0 &&
    transaction.steps.every((step) => {
      const value = step.toJSON();
      return (
        value.stepType === "replace" &&
        (!value.slice?.content ||
          value.slice.content.every((n) => n.type === "text"))
      );
    })
  );
}
export function recoverySnapshot(values, now = Date.now()) {
  const email = values.email || {};
  return {
    expires: now + 24 * 3600_000,
    name: values.name,
    description: values.description,
    category: values.category,
    email: {
      accountId: email.accountId,
      subject: email.subject,
      preheader: email.preheader,
      businessIdentity: email.businessIdentity,
      document: email.document,
    },
  };
}
export function buildEmailPreviewPayload({
  email,
  variables,
  overrideVariables,
} = {}) {
  const payloadEmail = email || {};
  const baseVariables = { ...(variables || {}) };
  if (overrideVariables) {
    Object.assign(baseVariables, overrideVariables);
  }

  return {
    subject: payloadEmail.subject,
    preheader: payloadEmail.preheader,
    businessIdentity: payloadEmail.businessIdentity,
    document: payloadEmail.document,
    ...(Object.keys(baseVariables).length ? { variables: baseVariables } : {}),
  };
}

export function emailContentPayload(email, variables) {
  return buildEmailPreviewPayload({ email, variables });
}
export function moveToColumn(document, targetId, columnId) {
  const doc = copy(document),
    rows = flatten(doc);
  const source = rows.find((n) => n.id === targetId),
    destination = rows.find((n) => n.id === columnId);
  if (
    !source ||
    source.children ||
    destination?.type !== "column" ||
    source.parent === columnId
  )
    return doc;
  let moved;
  const remove = (nodes) => {
    for (const n of nodes) {
      if (n.type === "column") {
        const i = n.children.findIndex((child) => child.id === targetId);
        if (i >= 0) {
          [moved] = n.children.splice(i, 1);
          if (!n.children.length)
            n.children.push(node("text", { content: richText("") }));
        }
      }
      if (n.children) remove(n.children);
    }
  };
  remove(doc.blocks);
  return moved
    ? updateNode(doc, columnId, (n) => ({ children: [...n.children, moved] }))
    : doc;
}
