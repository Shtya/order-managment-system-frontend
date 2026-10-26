# Frontend Agent Instructions

## Do

- Localize all user-facing frontend text. Do not hard-code labels, headings, buttons, validation messages, empty states, notifications, or other text shown to users.
- Store and maintain translations in `D:\projects\order-managment-system\order-managment-system-frontend\messages`.
- Use `next-intl` and select the translation namespace that belongs to the feature or domain.

```tsx
import { useTranslations } from "next-intl";

const t = useTranslations("customers");
```

- When a component needs keys from more than one namespace, create a separate translator for each namespace and give each one a descriptive name.

```tsx
import { useTranslations } from "next-intl";

const tChats = useTranslations("chats");
const t = useTranslations("customers");
```

- Add every new translation key to all locale files in the `messages` directory and keep the same namespace and key structure across locales.

## Authentication and current-user data

- Use `useAuth` from `@/context/AuthContext` whenever a client component needs information or behavior related to the current user. This includes the user object, authentication state, access token, admin or super-admin checks, role, permissions, plan, subscription, test-user status, login, logout, and user refreshes.
- Prefer the values and helpers already exposed by `useAuth`, such as `user`, `isAuthenticated`, `isAdmin`, `isSuperAdmin`, `hasPermission`, `roleName`, `activeSubscription`, and `hasActiveSubscription`. Do not duplicate role logic, read cached user data directly, or make a separate `/users/me` request from the component.

```jsx
import { useAuth } from "@/context/AuthContext";

const {
  user,
  isAuthenticated,
  isAdmin,
  isSuperAdmin,
  hasPermission,
} = useAuth();
```

## Socket events

- Use `useSocket` from `@/context/SocketContext` in client components that need real-time data. Consume application events through `subscribe`; do not attach component-level listeners directly to the raw Socket.IO instance.
- When introducing a new backend socket event, add its `socket.on(...)` listener to `SocketContext.jsx`, publish a stable application event name, and add the matching `socket.off(...)` call to the context's cleanup block.
- Register `subscribe(...)` calls inside `useEffect` and always return cleanup that invokes every unsubscribe function. Keep subscription callbacks safe against missing or malformed payloads.

```jsx
import { useEffect } from "react";
import { useSocket } from "@/context/SocketContext";

const { subscribe, isConnected } = useSocket();

useEffect(() => {
  const unsubConversation = subscribe("WHATSAPP_CONVERSATION_NEW", (payload) => {
    if (!payload?.conversation) return;
    if (accountFilterRef.current !== "all") return;

    const newConv = payload.conversation;

    if (!lastUnreadRef.current.has(newConv.id)) {
      lastUnreadRef.current.set(newConv.id, 0);
    }
    if (!lastHandoffRef.current.has(newConv.id)) {
      lastHandoffRef.current.set(newConv.id, false);
    }

    rememberUnread(newConv.id, newConv.unreadCount || 0);
    rememberHandoff(newConv.id, !!newConv.humanHandoff);

    setConversations((prev) => {
      // Avoid duplicate conversations.
      if (prev.find((conversation) => conversation.id === newConv.id)) {
        return prev;
      }
      return [newConv, ...prev];
    });
  });

  return () => {
    unsubConversation?.();
  };
}, [subscribe]);
```

- Use `isConnected` only when the UI or behavior genuinely depends on the current connection state.

## Reusable select and filter components

- Before creating a new select, searchable picker, or entity filter, check the existing shared components and reuse the matching one. These components already implement the project's fetching behavior, option formatting, loading states, pagination or search, localization, and styling; extend them with reusable props when a requirement is broadly useful instead of duplicating them in a feature.
- Use the existing components according to their purpose:
  - `@/components/molecules/AgentSelect` for selecting an active agent, including default and none options.
  - `@/components/molecules/ProductSkuSearchPopover` for searching and selecting product SKUs or bundles with stock-aware results.
  - `@/components/molecules/SafeSelect` for selecting an active safe/account in a React Hook Form.
  - `@/components/molecules/SupplierInvoiceSelect` for selecting an eligible unpaid supplier invoice in a React Hook Form.
  - `@/components/molecules/SupplierSelect` for selecting or creating a supplier in a React Hook Form.
  - `@/components/atoms/ProductFilter` for single- or multi-product filtering with search.
  - `@/components/atoms/StoreFilter` for filtering by store, including all, none, and single-store auto-selection behavior.
  - `@/components/atoms/UserSelect` for selecting users with pagination and optional all or none choices.
- Create a new shared select only when none of these components represents the entity or interaction needed. If a feature-specific variation is small, add an optional prop to the appropriate shared component while preserving its existing callers.

## Reusable UI primitives

- Before creating any new visual control or interaction primitive, inspect `src/components/ui` and reuse the closest existing component. Import these primitives through `@/components/ui/...` rather than rebuilding them inside a page or feature.
- The UI library already includes common primitives such as buttons, inputs, variable inputs, textareas, labels, selects, floating selects, sliders, switches, checkboxes, radio groups, dropdown menus, tooltips, field tooltips, popovers, dialogs, alert dialogs, sheets, modal shells, command menus, calendars, tabs, tables, cards, badges, avatars, breadcrumbs, alerts, accordions, progress indicators, separators, scroll areas, resizable panels, and horizontal scrolling.
- Inspect the existing component's API, variants, sizing, states, accessibility behavior, and established usages before using it. Prefer composition and existing props over copying its markup and styles.
- If a reusable primitive is missing a small generally useful capability, extend the component in `src/components/ui` with a backward-compatible optional prop. Create a new UI primitive only when no existing component can represent the interaction cleanly.
- Keep feature-specific data fetching, permissions, and business rules outside generic UI primitives. UI components should remain reusable, while feature-level wrappers may compose them with domain behavior.

## API requests

- Always use the configured Axios client exported from `@/utils/api` for frontend requests to the application backend. Do not create another Axios instance and do not use raw `fetch` for ordinary backend endpoints.
- The shared client already provides the base URL, request timeout, unique request IDs, bearer-token attachment, current frontend route, locale header, and global permission-denied handling. Reusing it is required for consistent authentication, localization, diagnostics, and errors.
- Import the default client as `api` and use `api.get`, `api.post`, `api.patch`, `api.put`, or `api.delete` as appropriate. Pass query-string values through the Axios `params` option.
- For data that is needed only while a dialog, popover, or similar surface is open, guard the effect with its open state. Set a dedicated loading flag before the request, normalize the response before storing it, clear stale data on failure when appropriate, and always release loading in `finally`.

```jsx
import api from "@/utils/api";

useEffect(() => {
  if (!open) return;

  const fetchCities = async () => {
    setCitiesLoading(true);
    try {
      const res = await api.get("/cities", { params: { limit: 500 } });
      setCities(normalizeRecords(res.data));
    } catch (error) {
      console.error("Cities lookup failed:", error);
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  };

  fetchCities();
}, [open]);
```

- Prevent stale state updates when an asynchronous request may finish after an effect is cleaned up or the relevant UI closes. Use a cancellation flag or Axios cancellation for requests where that race is possible.
- Use `handleApiError` from `@/utils/api` for user-facing request failures when appropriate so globally handled permission errors are not displayed twice. Keep console messages useful for diagnostics, but localize every error shown to the user.

## Module route and file structure

- Organize CRUD-style App Router modules using the campaigns module as the reference. The module root contains the list page, creation route, dynamic detail route, nested edit route, and module-local reusable building blocks.

```text
src/app/[locale]/<module>/
├── page.jsx              # list/table page
├── new/
│   └── page.jsx          # create page
├── [id]/
│   ├── page.jsx          # details page
│   └── edit/
│       └── page.jsx      # edit page
└── atoms/                # reusable components/helpers for this module
```

- Use `page.jsx` at the module root for the list/table experience.
- Put entity creation under `new/page.jsx`.
- Put entity details under `[id]/page.jsx`, and place editing under `[id]/edit/page.jsx` when the business workflow supports editing.
- Keep components, helpers, schemas, constants, and multi-step UI that are reused only within that module in its `atoms` folder. Promote them to `src/components` only when they are genuinely shared across modules.
- Reuse the same create/edit form implementation where practical so validation, defaults, fields, localization, and payload mapping do not drift between routes.
- New navigable module routes must also follow the sidebar registration requirements in this file.

## Printing and PDF generation

- Do not use `window.print()` or the browser's normal DOM-printing flow for application print actions. Browser printing produces inconsistent page sizes, margins, fonts, RTL output, and layout across devices.
- Build printable output as an explicit PDF document with `@react-pdf/renderer`, following `src/app/[locale]/products/SkuLabelsPDF.jsx`, the `SkuPrintModal` and its `handlePrint` in `src/app/[locale]/products/ProductsTab.jsx`, and `src/app/[locale]/reports/order-analysis/page.jsx`.
- Keep the printable document component separate from the interactive page or modal when the document is non-trivial. The screen UI gathers options and prepares data; the PDF component owns only document layout and rendering.

### Choose the correct PDF layout

- For physical labels, receipts, or other fixed media, define the exact page dimensions. Convert millimeters to PDF points with `72 / 25.4`, use the resulting `[width, height]` as the React-PDF `Page` size, and render one physical item per page when required. `SkuLabelsPDF.jsx` is the reference for 50 mm by 30 mm SKU labels.
- For full reports and ordinary documents, use an appropriate standard page such as `size="A4"`. Organize the PDF into explicit header, metadata/subheader, sections, statistics, charts, and table structures rather than attempting to capture the screen layout.
- Design for page boundaries. Use `wrap={false}` for content blocks that must stay together, constrain image sizes, and split large groups deliberately when needed.

### React-PDF document and styles

- Compose PDFs only from React-PDF primitives such as `Document`, `Page`, `View`, `Text`, `Image`, `Svg`, and `Path`. Normal HTML elements, Tailwind classes, browser CSS, and Lucide DOM icons do not render inside a React-PDF document.
- Define PDF styles with `StyleSheet.create`, conventionally as `pdfStyles` for reports or `styles` for a focused document. Treat PDF styling as its own layout system and include explicit page padding, background, font family, font sizes, colors, spacing, borders, alignment, widths, and image constraints.
- Reuse the project's PDF font and color constants where available, such as `DEFAULT_FONT_FAMILY`, `TEXT_DARK`, and `TEXT_MUTED`. Ensure the chosen font supports every exported locale; the reports reference uses Cairo for Arabic-compatible output.
- Pass localized strings and already formatted display data into the PDF component. Do not hard-code report titles, labels, table headers, statuses, or metadata.
- Make direction and alignment locale-aware. For Arabic, apply RTL direction, right-aligned text, and reversed row layout where needed; for other locales, use LTR behavior. Verify individual table cells and mixed text/number rows rather than relying only on one top-level direction value.
- React-PDF does not render browser chart components directly. Convert charts, barcodes, QR codes, logos, and other generated visuals to supported image data URLs before passing them to `Image`. Use React-PDF `Svg`/`Path` for small vector indicators when that is simpler.
- For constrained label text, calculate font size and maximum lines from content length, apply `maxLines` and `textOverflow="ellipsis"`, and preserve space for required elements such as the barcode. Do not allow long names or SKUs to change the physical label size.

### Print/export preparation

- A print modal should collect only the user's output choices, such as selected SKUs and copy quantities. Reset those choices when the modal opens for a new record.
- Validate that printable items exist before starting. Set a dedicated loading state for the whole preparation and download process, disable the print button while it runs, and show the standard spinner.
- Normalize and fully prepare the data before rendering the PDF. For SKU labels, filter selected SKUs, expand each item according to its requested quantity, format attribute text, generate the barcode data URL once per SKU, and pass the flattened label array to `SkuLabelsPDF`.
- For reports, prepare locale-aware dates, current-user metadata, formatted values, QR data, and chart image URLs before constructing the PDF component. Clean up any temporary DOM nodes used only to render chart canvases.
- Keep PDF generation in `try/catch/finally`, log useful generation failures, show localized user feedback where appropriate, and always clear the loading state in `finally`. Close a print modal only after successful generation when that matches the workflow.

### Required download flow

- Render the document to a Blob with `pdf(<PdfDocument ... />).toBlob()`.
- Create a temporary object URL with `URL.createObjectURL(blob)`.
- Create a temporary anchor with a meaningful, safe, localized-or-domain-specific `.pdf` filename, append it to the document, click it, and remove it.
- Revoke the object URL with `URL.revokeObjectURL(url)` after triggering the download to avoid leaking browser memory.

```jsx
import { pdf } from "@react-pdf/renderer";

const handlePrint = async () => {
  setPrinting(true);
  try {
    const printableData = await preparePrintableData();
    if (!printableData.length) return;

    const blob = await pdf(
      <PdfDocument data={printableData} locale={locale} />,
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `document-${Date.now()}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
  } finally {
    setPrinting(false);
  }
};
```

- The user-facing action may be labeled Print when that matches the workflow, but its implementation must generate the controlled PDF file described above instead of invoking the browser print dialog.

## Standard list-page structure

- Use `src/app/[locale]/campaigns/page.jsx` as the reference structure for new data-list pages. Keep the page composed in this order: page state and data functions, derived stats/pagination, mutation and row-action handlers, column definitions, `PageHeader`, `Table`, then dialogs or other page-level overlays.
- Wrap the page in the standard page container (for example, `min-h-screen p-5`) and use the shared `PageHeader` from `@/components/atoms/Pageheader`; do not build an ad hoc page title/header.

### Register new pages in the sidebar

- Whenever a new navigable page is created, add its navigation entry to `src/config/sidebarMenu.jsx` in the correct top-level section or `children` group. A page is not complete until users can reach it through the appropriate sidebar navigation.
- Follow the existing sidebar item shape and provide the appropriate Lucide or React icon, localized `labelKey`, route `href`, and backend-aligned `permission`. Add `roles`, `notRoles`, conditional feature flags, or getting-started metadata only when the page's access and onboarding behavior require them.
- Reuse an existing parent menu when the page belongs to an established module. Create a new top-level group only when the new page represents a genuinely new navigation domain.
- Add the new `labelKey` translation to every locale file in `messages` and keep the key consistent across locales. Do not hard-code a sidebar label in `sidebarMenu.jsx`.
- Verify that the sidebar permission and role restrictions match the page's actual authorization requirements; navigation visibility must not promise access the route does not grant.

```jsx
{
  icon: FileText,
  labelKey: "items",
  href: "/items",
  permission: "items.read",
}
```

### Settings must be available contextually and centrally

- Use `src/app/[locale]/settings/page.jsx` as the central settings hub. When a module has settings, those settings must be discoverable from the main Settings page even if the module also exposes them on its own page.
- When settings are directly relevant to a module page, also add a localized Settings action to that page's `PageHeader`. The action should use the standard settings icon, correct permission, and an outline/secondary treatment so it is distinct from the page's primary create action.
- The page-header Settings action should open a shared `Dialog` popup containing the relevant settings UI. Follow the patterns in WhatsApp accounts, campaigns, and call center: controlled `settingsOpen` state, `Dialog`/`DialogContent`, a localized header/title and optional subtitle, a loading state, a scrollable body when needed, and an existing save button with saving state.
- Do not maintain separate business implementations for the page popup and the central Settings page. Extract or reuse the same settings section component and the same settings hook/state contract on both surfaces. For example, campaign settings reuse `CampaignOrderPageTab` and `useOrdersSettings`, while WhatsApp settings reuse `WhatsAppTab`.
- A contextual popup may hide fields that do not belong to that page by using explicit component props, but shared fields must retain the same defaults, validation, API behavior, permissions, and translations as the central settings version.
- Save through the shared settings logic, show loading/saving feedback, prevent duplicate saves, and close the contextual dialog only after a successful save. Ensure the central Settings view reflects the saved values when reopened.

```jsx
const [settingsOpen, setSettingsOpen] = useState(false);

<PageHeader
  breadcrumbs={breadcrumbs}
  buttons={
    <Button_
      size="sm"
      label={t("actions.settings")}
      variant="outline"
      icon={<Settings size={18} />}
      permission="items.updateSettings"
      onClick={() => setSettingsOpen(true)}
    />
  }
/>

<Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
  <DialogContent className="max-w-2xl! p-6 rounded-2xl">
    <DialogHeader>
      <DialogTitle>{t("settings.title")}</DialogTitle>
    </DialogHeader>
    <SharedItemSettings onSaved={() => setSettingsOpen(false)} />
  </DialogContent>
</Dialog>
```

- Register the same setting in `src/app/[locale]/settings/page.jsx`:
  - For a primary settings area, add a localized item to the main `TABS` array and add the matching keyed element to the `content` map.
  - For an order/configuration setting, add it to `SETTINGS_TABS` and add the matching `activeTab` render branch inside `SettingsTab`.
  - Choose the existing category that matches the setting; do not create another top-level tab merely because a contextual dialog exists.
  - Add every new settings tab label, title, description, field, validation message, and action to all locale files.
  - Apply the same authorization rules to the contextual button and the central settings entry/content.

### Page header

- Every full page must have a `PageHeader`.
- Pass a localized `breadcrumbs` array containing meaningful navigation links for the page hierarchy.
- When the page has summary/status counts, pass a stable stats array to `stats`. Each item should have `key`, localized `name`, `value`, `icon`, and `sortOrder`. Fetch these counts separately when appropriate and pass the dedicated loading boolean through `statsLoading` so the header renders its loading state.
- Put page-level calls to action in the `buttons` slot. Use the shared `Button_` component, localized labels, appropriate icons and variants, permission checks, loading/disabled state, and focused actions such as creating an entity or opening a settings dialog.

```jsx
<PageHeader
  breadcrumbs={[
    { name: t("breadcrumb.home"), href: "/dashboard" },
    { name: t("breadcrumb.items"), href: "/items" },
  ]}
  stats={statsCards}
  statsLoading={statsLoading}
  buttons={
    <div className="flex items-center gap-2">
      <Button_
        size="sm"
        label={t("actions.settings")}
        variant="outline"
        icon={<Settings size={18} />}
        permission="items.updateSettings"
        onClick={() => setSettingsOpen(true)}
      />
      <Button_
        size="sm"
        label={t("actions.new")}
        variant="solid"
        icon={<Plus size={18} />}
        permission="items.create"
        onClick={() => router.push("/items/new")}
      />
    </div>
  }
/>
```

### Table state, fetching, and pagination

- Use the shared `Table` from `@/components/atoms/Table`; do not recreate list-page search, filtering, actions, loading, empty states, or pagination around a raw table.
- Give every table a stable, page-specific, unique `tableKey`. Do not reuse a key from another table.
- Keep records, loading, search text, debounced search, draft filters, applied filters, current page, page size, and total record count as explicit state. Keep stats loading separate from table loading.
- Debounce text search (the campaigns reference uses 350 ms), reset to page 1 when search changes, and also provide `onSearch` for an explicit search submission. Clear timers in effect cleanup.
- Centralize query construction in a helper such as `buildParams(page, limit, appliedFilters, debouncedSearch)`. Trim search text and omit default filter values such as `"all"` from API parameters.
- Centralize record loading in a function such as `fetchItems`. Set loading in `try/finally`, normalize missing records to an empty array, and update `totalRecords`, `page`, and `limit` from the server response.
- Derive the table's pagination object in the backend shape `{ total_records, current_page, per_page }` and handle `onPageChange` with `{ page, per_page }`. Update local pagination state and fetch that exact page and page size.
- After successful mutations, refresh the affected list and any header stats. Track a mutating row ID when row-level actions need individual loading or disabled states.

### Filters must apply explicitly

- Maintain separate `filters` and `appliedFilters` objects initialized from the same `DEFAULT_FILTERS` constant.
- Filter controls update only `filters`; changing a control must not fetch data or alter the applied query immediately.
- `onApplyFilters` is the commit point: reset to page 1, copy `filters` into `appliedFilters`, and fetch with that exact filter snapshot.
- Derive `hasActiveFilters` from `appliedFilters`, not from draft `filters`, so the UI reports only filters currently affecting the data.
- Build normal pagination, refresh, and export requests from `appliedFilters` and the debounced search value. Export should represent the currently applied view, not uncommitted filter controls.

```jsx
const DEFAULT_FILTERS = { status: "all", channel: "all" };

const [filters, setFilters] = useState({ ...DEFAULT_FILTERS });
const [appliedFilters, setAppliedFilters] = useState({ ...DEFAULT_FILTERS });

const applyFilters = () => {
  setPage(1);
  setAppliedFilters(filters);
  fetchItems({ page: 1, limit, filterState: filters });
};

const hasActiveFilters = useMemo(
  () =>
    appliedFilters.status !== "all" ||
    appliedFilters.channel !== "all",
  [appliedFilters],
);
```

- Compose the filter panel from localized `FilterField` controls. Reuse the shared select/filter components documented above whenever one matches the entity being filtered.

### Table configuration

- Pass the standard table contract where applicable: `tableKey`, `searchValue`, `onSearchChange`, `onSearch`, top-level `actions`, `filters`, `hasActiveFilters`, `onApplyFilters`, localized `labels`, `columns`, `data`, `isLoading`, `rowKey`, `pagination`, and `onPageChange`. Use `compact` and `striped` for the standard dense striped list presentation.
- Supply localized labels for `searchPlaceholder`, `filter`, `apply`, `emptyTitle`, and `emptySubtitle`.
- Put toolbar operations such as export in the table's `actions` array. Each action should have a stable `key`, localized `label`, icon, color, permission, disabled/loading behavior, and `onClick`. Exports must use the active query parameters and show a loading icon/state while running.

```jsx
<Table
  tableKey="items"
  searchValue={search}
  onSearchChange={setSearch}
  onSearch={() => {
    setPage(1);
    setDebouncedSearch(search);
  }}
  actions={tableActions}
  filters={filterFields}
  hasActiveFilters={hasActiveFilters}
  onApplyFilters={applyFilters}
  labels={{
    searchPlaceholder: t("table.searchPlaceholder"),
    filter: tc("filter"),
    apply: tc("apply"),
    emptyTitle: t("table.emptyTitle"),
    emptySubtitle: t("table.emptySubtitle"),
  }}
  columns={columns}
  data={records}
  isLoading={loading}
  rowKey={(row) => row.id}
  pagination={pagination}
  onPageChange={handlePageChange}
  compact
  striped
/>
```

### Columns and row actions

- Define columns as an array of objects with a stable `key`, localized `header`, an optional layout `className`, and a `cell(row)` renderer. Keep formatting and navigation behavior inside the relevant cell renderer, use localized status text, shared `Badge` styles, locale-aware date/number formatting, and a visible fallback such as `"—"` for missing values.
- Build row actions in a function of the row so actions can depend on status, permissions, and row-specific loading state. Each action should define an icon, localized tooltip, visual variant, permission, disabled state when applicable, and `onClick`.
- Render the actions column with the shared `ActionButtons` component: `cell: (row) => <ActionButtons row={row} actions={rowActions(row)} />`. Keep it as the final column and use the established sticky classes when the table needs sticky actions.
- Require confirmation dialogs for destructive or consequential actions. Store the target row and action type in state, localize the confirmation copy, show confirmation loading, and refresh data after success. Direct, reversible navigation actions such as view or edit do not need confirmation.

## Form dialogs and validation

- Use `RuleFormDialog` in `src/app/[locale]/call-center/page.jsx` as the structural reference for create/edit form dialogs. Follow its form and dialog conventions without copying feature-specific business rules.

### Form architecture

- Use `react-hook-form` for non-trivial forms. Use `register` for native inputs and `Controller` for controlled components such as `Select`, `Switch`, date pickers, multi-selects, and other shared selectors.
- Define a Yup validation schema and connect it with `yupResolver`. Build the schema from the relevant translation function when messages are localized, and memoize it when it is created inside the component.
- Localize every validation message, including required-field, type, minimum/maximum, cross-field, and conditional validation errors. Do not put hard-coded user-facing error strings in the schema.
- Conditional form fields must have matching conditional validation. Validate only the fields required by the selected mode/type and keep cross-field rules, such as an end value being after a start value, in the schema rather than in scattered submit checks.

```jsx
const formSchema = (t) =>
  yup.object({
    name: yup.string().required(t("validation.nameRequired")),
    priority: yup
      .number()
      .typeError(t("validation.invalidNumber"))
      .required(t("validation.priorityRequired")),
  });

const schema = useMemo(() => formSchema(t), [t]);

const {
  register,
  control,
  handleSubmit,
  reset,
  formState: { errors, isSubmitting },
} = useForm({
  resolver: yupResolver(schema),
  defaultValues: FORM_DEFAULT_VALUES,
});
```

- Define complete default values for every form field, including arrays, booleans, nullable values, and conditionally displayed fields. Prefer a stable `FORM_DEFAULT_VALUES` constant when the same defaults are also needed by `reset`.
- Reset the form whenever the dialog opens or the edited record changes. In create mode, reset to fresh defaults so values from a previous opening cannot leak. In edit mode, map the record into the form shape, normalize missing values, convert API representations where necessary, and derive UI-only fields such as enable switches.
- When the business API and workflow support editing, the form dialog must support both create and edit modes. Determine edit mode from the supplied record, populate its values, localize the create/edit title, and submit to the appropriate create or update endpoint. Do not invent edit behavior when the underlying business logic does not support it.
- Build the API payload deliberately from validated form data. Include only fields relevant to the selected type/mode and perform required API conversions in one submit handler. Disable repeated submission with `isSubmitting`, show success/error feedback, call `onSuccess`, and close only after a successful request.
- Render each validation error immediately below its field using the localized schema message.

### Dialog structure

- Use the shared `Dialog`, `DialogContent`, `DialogHeader`, and `DialogTitle` components for form popups. Do not build a custom modal shell.
- Give `DialogContent` a deliberate responsive maximum width and height. For long forms, use a flex column with `p-0 overflow-hidden`, keep the header and footer from shrinking, and make only the form body scrollable.
- Place the localized title in `DialogHeader`/`DialogTitle`. When useful, pair it with a contextual icon and switch both icon and title between create and edit mode.
- Put the actual `<form onSubmit={handleSubmit(onSubmit)}>` inside the dialog content. Use responsive grids and consistent field spacing; keep related conditional fields grouped under clear visual separators.

```jsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-4xl! w-full h-[90vh] md:h-auto md:max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950">
    <DialogHeader className="px-4 md:px-6 py-4 border-b border-border bg-card shrink-0">
      <DialogTitle className="flex items-center gap-3">
        {isEditMode ? <Edit2 size={20} /> : <Plus size={20} />}
        {isEditMode ? t("actions.edit") : t("actions.create")}
      </DialogTitle>
    </DialogHeader>

    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-card"
    >
      {/* Localized fields and footer actions */}
    </form>
  </DialogContent>
</Dialog>
```

### Fields, descriptions, and selectors

- Every field must use a localized `Label`, localized placeholder where applicable, and a visible localized validation error.
- Use the `description` prop on `Label` when a field needs clarification, guidance, or business context. This provides the standard question-mark/hover explanation; do not create a separate custom tooltip for ordinary field help.

```jsx
<Label
  className="text-sm font-semibold"
  description={t("form.priorityDescription")}
>
  {t("form.priority")}
</Label>
```

- Reuse the existing shared select/filter components listed in this file when they match the field. Otherwise use the shared UI `Select` components with `Controller`; all option labels and option descriptions must be localized.
- Use `description` on `SelectItem` when an option needs additional explanation, following the same localized help pattern.

### Dialog footer actions

- End form dialogs with a visually separated, right-aligned action row. Use the project's existing button components instead of custom clickable elements.
- The cancel button must be `type="button"`, use the outline variant, close through `onOpenChange(false)`, and be disabled while submitting.
- The submit button must be `type="submit"`, use the standard primary/default appearance, be disabled while submitting, and show the shared loading spinner or supported loading state. Localize both button labels and change the submit text when create and edit require different wording.

```jsx
<div className="flex items-center justify-end gap-3 pt-4 border-t mt-4">
  <Button
    type="button"
    variant="outline"
    onClick={() => onOpenChange(false)}
    disabled={isSubmitting}
  >
    {t("form.cancel")}
  </Button>
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? (
      <Loader2 className="w-4 h-4 animate-spin me-2" />
    ) : (
      t("form.save")
    )}
  </Button>
</div>
```

## Testing and verification

- Verify every change in proportion to its risk. Do not report a task as complete without running the most relevant available checks.
- Run focused Vitest tests for changed hooks, utilities, state logic, and reusable components. Add or update a regression test when fixing a bug that can reasonably be automated.
- Run the relevant Playwright test or add coverage for important user flows such as authentication, create/edit forms, permissions, filtering, pagination, settings, and destructive actions.
- Run `npm run build` after routing changes, broad refactors, dependency-sensitive changes, or work that can affect server/client component boundaries. Use the project's configured test commands and targeted configurations when a full suite is unnecessary.
- Test both the successful path and meaningful failure or empty paths. For asynchronous UI, verify loading, disabled, empty, error, and retry behavior where applicable.
- Do not weaken, skip, or delete an existing test merely to make a change pass. If an unrelated pre-existing failure prevents verification, identify it clearly in the handoff.

## Permissions and authorization UI

- Use `useAuth` permission helpers and the existing `permission` props on shared buttons and action components. Do not duplicate permission parsing or compare raw permission arrays throughout feature code.
- Apply the same permission consistently to every entry point for an action: sidebar item, page-header button, table toolbar action, row action, dialog submit button, and central Settings entry where applicable.
- Hide actions that should not be discoverable to unauthorized users. Disable an action only when showing it communicates useful state; do not expose a functional unauthorized control.
- Keep role checks (`isAdmin`, `isSuperAdmin`, `roles`, and `notRoles`) separate from capability checks and use each only when the business rule calls for it.
- Frontend authorization is presentation and usability, not security. Never assume hiding a control replaces backend authorization.
- When the backend rejects an action with `PERMISSION_DENIED`, rely on the shared API client's global handling and avoid displaying the same error a second time.

## Loading, empty, error, and success states

- Every asynchronous screen or control must account for loading, empty, error, and populated states. Mutations must also communicate success or failure.
- Reuse existing skeletons, loaders, table loading states, button loading props, and empty-state components before creating new ones. Keep layout dimensions stable enough to avoid disruptive content jumps.
- Use separate loading states for independent requests such as table data, header stats, lookup options, exports, and row mutations. Do not block an entire page for a small background action.
- Clear identity-dependent or query-dependent stale data when a request fails or its owner/filter changes and retaining it would mislead the user.
- Use `handleApiError` for appropriate user-facing API failures, respect globally handled errors, and localize fallback messages. Console errors should contain diagnostic context but must not be the only user feedback for a failed user action.
- Show localized success feedback after completed mutations. Refresh all affected views—records, counts, contexts, settings, or cached values—without requiring a full browser reload unless no supported refresh path exists.

## Responsive design, RTL, and accessibility

- Verify new and changed UI at mobile, tablet, and desktop widths. Dialogs, tables, grids, headers, and action groups must remain usable without clipped controls or inaccessible content.
- Test both Arabic RTL and English LTR. Prefer logical direction utilities and properties such as `text-start`, `text-end`, `ms-*`, and `me-*` when direction should follow the locale; use left/right only for genuinely physical positioning.
- Reuse localized navigation and formatting tools so changing locale does not break routes, alignment, icons, or content order.
- Every form control must have an associated visible label or accessible name. Icon-only buttons must have a localized tooltip and accessible label. Images that convey content need meaningful alternative text.
- Preserve keyboard navigation and visible focus states. Use semantic buttons for actions, links for navigation, and the shared accessible dialog, select, dropdown, tooltip, and popover primitives.
- Dialogs must have an accessible title. Focus must not become trapped behind overlays, and closing must restore a sensible interaction point through the shared primitive behavior.
- Do not communicate status using color alone. Pair colors with text, icons, labels, or other non-color indicators, and maintain readable contrast in light and dark themes.

## Mutations and destructive actions

- Use the shared `ConfirmDialog` before destructive or consequential mutations such as delete, cancel, disable, disconnect, revoke, or irreversible status changes.
- Store the intended action and target record explicitly so confirmation copy can be localized and specific. Clear that state when the dialog closes.
- Disable the initiating and confirmation controls while a mutation is running, show the standard loading state, and prevent duplicate submissions.
- Track row-level mutation identity when only one table row is affected; do not disable unrelated rows unnecessarily.
- Close dialogs only after successful mutations unless the workflow explicitly requires otherwise. On failure, retain enough state for the user to understand and retry the action.
- After success, update or refetch every affected source of truth, including the current list page, header stats, details, authentication/settings context, and relevant lookup data. Prefer focused refresh functions over `window.location.reload()`.
- Show localized success and failure messages, and use the shared API error behavior to avoid duplicate permission-error toasts.

## Dates, numbers, money, and timezones

- Use `next-intl` formatters (`useFormatter`) for user-facing dates and numbers. Use the platform settings formatter, such as `formatCurrency`, for money so currency, precision, and presentation remain consistent.
- Do not hard-code locales such as `toLocaleString("en-US")` or manually concatenate currency symbols in localized UI.
- Treat API timestamps according to the backend contract—normally as UTC instants—and format them in the intended user or business timezone. Pass an explicit timezone when the feature requires one.
- Treat date-only business values separately from timestamps. Avoid converting date-only strings through a timezone transformation that can move them to the previous or next day.
- Send API values in the expected canonical representation: ISO strings for instants, stable date strings for date-only values, and unformatted numeric values for money or percentages.
- Use locale-aware formatting in tables, details, dialogs, exports, and generated PDFs. Use a visible fallback such as `"—"` for absent values rather than displaying `Invalid Date`, `NaN`, `null`, or `undefined`.

## Routing and navigation

- Use locale-aware `Link`, `useRouter`, and related helpers from `@/i18n/navigation` for application navigation. Do not use `next/navigation` directly when the localized wrapper provides the needed behavior.
- Reuse existing route builders and normalization helpers when available. Add a shared route helper when a route has repeated channel, mode, redirect, or query-string rules.
- Set a localized browser document title with `setDocumentTitle` on full pages and update it when its translated title changes.
- Preserve relevant filters, tabs, return paths, and query parameters when navigating between list, details, create, and edit screens. Validate redirect parameters with the existing safe-route utilities before using them.
- Use router navigation or locale-aware links for in-app routes. Reserve `window.location` for flows that genuinely require a full document navigation, such as certain authentication handoffs.
- Ensure breadcrumbs, sidebar entries, row links, and post-save redirects all point to the same canonical route structure.

## Shared constants, mappings, and normalization

- Centralize repeated defaults, filter shapes, status lists, badge-class mappings, option definitions, pagination defaults, and form defaults. Do not scatter equivalent literals across list, details, edit, settings, and export code.
- Put module-specific constants and helpers in the module's `atoms` area. Promote them to a shared `src` location only when multiple modules genuinely use them.
- Centralize API query construction and response normalization. Handle supported response shapes once, for example by normalizing records from either an array or a `{ records }` wrapper.
- Normalize IDs at component boundaries and compare them consistently. When UI components expect string values, convert API numeric IDs to strings before passing them to selects and filters rather than mixing types throughout the component.
- Keep status-to-label, status-to-color, and status-to-action behavior in a single mapping or helper whenever possible. All user-facing labels from those mappings must remain localized.
- Reuse the same form defaults, API-to-form mapper, form-to-API payload builder, and shared form component across create and edit flows where practical so the two modes cannot drift.
- Avoid premature global abstraction. A helper used only by one module belongs with that module, but duplicated business rules must be consolidated before they diverge.

## Client and server component boundaries

- Add `"use client"` only when a component needs React client hooks, browser APIs, contexts, interactive event handlers, or a client-only dependency. Do not mark a component as client-side merely because one nested control is interactive.
- Keep pages, layouts, and data-independent presentation components server-compatible when practical. Move the smallest interactive portion into a focused client component instead of expanding the client boundary across an entire route.
- Never access `window`, `document`, `localStorage`, `sessionStorage`, `navigator`, or other browser-only globals during server rendering. Access them inside client components and effects, or guard them with `typeof window !== "undefined"` when a shared helper genuinely needs a browser branch.
- Props crossing from a server component into a client component must be serializable. Do not pass functions, class instances, browser objects, or other non-serializable state through that boundary.
- Do not import client-only contexts or hooks into server components. If a server-rendered page needs authenticated or interactive client state, compose it with a client child that consumes the relevant context.
- Keep secrets and server-only credentials out of client components and public environment variables. Only variables intentionally prefixed for browser exposure may be used by client code.
- When adding a dependency, verify whether it supports server rendering before importing it into a server-compatible module. Load browser-only libraries within an appropriate client boundary.

## React effects and performance

- Use effects only for synchronization with external systems such as API requests, subscriptions, timers, browser APIs, and imperative libraries. Do not use an effect to calculate data that can be derived during rendering.
- Derive filtered lists, mappings, counts, pagination objects, and other computed values from their source state. Use `useMemo` only when the calculation is expensive, referential stability matters to a child or dependency, or the value would otherwise be recreated unnecessarily in a meaningful hot path.
- Use functional state updates such as `setRecords((previous) => ...)` whenever the next value depends on the previous value. This prevents stale closures in asynchronous callbacks and socket subscriptions.
- Clean up every timer, event listener, subscription, observer, and cancellable request created by an effect. Socket subscriptions must invoke their unsubscribe functions, and browser listeners must be removed with the matching handler.
- Prevent stale asynchronous work from updating state after dependencies change, a dialog closes, or a component unmounts. Use a cancellation flag, abort signal, or supported request cancellation when the race is possible.
- Keep effect dependency arrays accurate. Stabilize reusable callbacks with `useCallback` when they are effect dependencies or are passed to memoized children; do not suppress dependency lint warnings unless the intentional behavior is documented and safe.
- Avoid request loops caused by effects depending on state that the same request updates. Separate stable query inputs from response state and pass explicit snapshots to fetch functions when necessary.
- Memoize large table column arrays and expensive row-action builders when their recreation affects rendering, but do not apply `useMemo` or `useCallback` mechanically to trivial values and local handlers.
- Do not duplicate the same source of truth in multiple state variables. Prefer one authoritative state plus derived values, except where the UI intentionally needs separate draft and committed state, such as `filters` and `appliedFilters`.
- Use refs for mutable values that must persist without causing renders, such as timer IDs, latest subscription bookkeeping, and previous identity markers. Do not use refs to hide state that the UI needs to render.
