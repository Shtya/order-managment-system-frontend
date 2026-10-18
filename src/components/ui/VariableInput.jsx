"use client"

import * as React from "react"
import { Plus, ChevronRight, ChevronDown } from "lucide-react"
import { useLocale } from "next-intl"
import { cn } from "@/utils/cn"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { renderToStaticMarkup } from "react-dom/server"
import { CompactDateConfig, DEFAULT_DATE_FORMATS, formatDateWithFormat, getNaturalDayName, useDateLang } from "@/components/ui/dateConfig"
import { VariableChip } from "@/components/ui/VariableChip"
export { getNaturalDayName }
// ---------------------------------------------------------------------------
// Shared field tokens — copied from your Input component so this stays
// visually identical to the rest of the form system.
// ---------------------------------------------------------------------------
const shellBase = [
    "w-full min-w-0 !rounded-md",
    "border border-border",
    "!bg-background/60",
    "transition-all duration-200",
    "hover:border-[var(--primary)]/50 hover:bg-background",
    "focus-within:border-[var(--primary)] focus-within:bg-background",
    "focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary),transparent_88%)]",
    "has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-50",
]

const shellError = [
    "border-destructive",
    "focus-within:border-destructive",
    "focus-within:shadow-[0_0_0_3px_oklch(var(--destructive)/0.15)]",
]

const sizeClasses = {
    sm: "min-h-8 text-xs px-3 py-1.5",
    default: "min-h-10 text-sm px-3.5 py-2",
    lg: "min-h-11 text-sm px-4 py-2.5",
}

// A chip token looks like {{variable.path}} inside the serialized value.
// The character class allows word chars, dots, array indexes (items[-1]),
// and dynamic tokens such as global.date.0.DD-MM-YYYY. Named date formats
// (e.g. "global.date.0.Weekday D Month YYYY") contain spaces, so the token
// is allowed to be made of several space-separated word groups.
export const VARIABLE_TOKEN_RE = /\{\{\s*([\w.\[\]\-\/]+(?:\s+[\w.\[\]\-\/]+)*)\s*\}\}/g

/** Split a string into plain text and {{token}} parts for hydrate / read-only previews. */
export function splitVariableTokens(text) {
    const value = String(text ?? "")
    if (!value) return []
    const out = []
    let lastIndex = 0
    const re = new RegExp(VARIABLE_TOKEN_RE.source, "g")
    let match
    while ((match = re.exec(value))) {
        if (match.index > lastIndex) {
            out.push({ type: "text", value: value.slice(lastIndex, match.index) })
        }
        out.push({ type: "token", id: match[1], raw: match[0] })
        lastIndex = match.index + match[0].length
    }
    if (lastIndex < value.length) {
        out.push({ type: "text", value: value.slice(lastIndex) })
    }
    return out
}

function buildChip(variable) {
    const chip = document.createElement("span")
    chip.contentEditable = "false"
    chip.dataset.variable = variable.id
    chip.className =
        "inline-flex items-center gap-1.5 align-middle whitespace-nowrap select-none " +
        "rounded-sm border border-border bg-foreground/5 pl-1 pr-2 py-0.5 mx-0.5 text-xs"
    
    // Create icon container
    const iconContainer = document.createElement("span")
    iconContainer.className =
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-[var(--primary)] text-[10px] font-bold text-white"

    if (variable.icon) {
        try {
            // Check if variable.icon is a React Component function (e.g., LucideIcon)
            // or an already-rendered JSX element (e.g., <Mail />)
            const iconElement = React.isValidElement(variable.icon)
                ? variable.icon
                : React.createElement(variable.icon, { className: "h-2.5 w-2.5 text-current" })

            // Convert the React Element directly into an SVG HTML string
            iconContainer.innerHTML = renderToStaticMarkup(iconElement)
        } catch (error) {
            // Fallback if rendering fails
            iconContainer.textContent = variable.label?.[0]?.toUpperCase() ?? "•"
        }
    } else {
        // No icon, use first letter
        iconContainer.textContent = variable.label?.[0]?.toUpperCase() ?? "•"
    }

    // Create label
    const labelSpan = document.createElement("span")
    labelSpan.className = "font-medium text-foreground"
    labelSpan.textContent = variable.label

    // Optional preview
    let previewSpan
    if (variable.preview || variable.example) {
        previewSpan = document.createElement("span")
        previewSpan.className = "text-muted-foreground/80"
        previewSpan.textContent = variable.preview || variable.example
    }

    chip.appendChild(iconContainer)
    chip.appendChild(labelSpan)
    if (previewSpan) chip.appendChild(previewSpan)

    return chip
}

function VariableTextPreview({
    text,
    variables = [],
    locale,
    empty,
    showExample = true,
    size = "small",
    className,
}) {
    const localeFromHook = useLocale()
    const lang = locale ?? localeFromHook
    const flattened = React.useMemo(() => flattenVariables(variables || []), [variables])
    const parts = React.useMemo(() => splitVariableTokens(text), [text])

    if (!String(text || "").trim()) {
        return empty ? <p className="text-sm text-muted-foreground">{empty}</p> : null
    }

    return (
        <p className={cn("whitespace-pre-wrap break-words text-sm leading-relaxed", className)}>
            {parts.map((part, index) => {
                if (part.type === "text") {
                    return <span key={index}>{part.value}</span>
                }
                const variable = findVariableForToken(flattened, part.id, lang)
                if (!variable) {
                    return (
                        <span key={index} className="font-mono text-[11px] text-muted-foreground">
                            {part.raw}
                        </span>
                    )
                }
                return (
                    <VariableChip
                        key={index}
                        size={size}
                        variable={variable}
                        example={variable.preview}
                        showExample={showExample}
                    />
                )
            })}
        </p>
    )
}
VariableTextPreview.displayName = "VariableTextPreview"

// Appends text to a container, turning any \n into a real <br> element so
// that pressing Enter (which we also normalize to <br>, see handleKeyDown)
// round-trips correctly through hydrate () -> serialize().
function appendTextWithBreaks(container, text) {
    const lines = text.split("\n")
    lines.forEach((line, i) => {
        if (line) container.appendChild(document.createTextNode(line))
        if (i < lines.length - 1) container.appendChild(document.createElement("br"))
    })
}

// Walk the contentEditable DOM and turn it back into a plain string,
// replacing chips with their {{variable.path}} token and <br> with \n.
function serialize(container) {
    if (container.childNodes.length === 1 && container.firstChild.tagName === "BR") {
        return ""
    }
    let out = ""
    container.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
            out += node.textContent
        } else if (node.tagName === "BR") {
            out += "\n"
        } else if (node.dataset?.variable) {
            out += `{{${node.dataset.variable}}}`
        } else {
            out += node.textContent
        }
    })
    return out
}

// Set the field's content to a literal string with no {{token}} parsing —
// used when disableHydrate is true. Newlines still become <br> so multiline
// still round-trips correctly.
function setPlainContent(container, value) {
    container.innerHTML = ""
    if (!value) return
    appendTextWithBreaks(container, value)
}

// Flatten nested variables into a single list for hydrate map
function flattenVariables(variables) {
    const result = []
    const walk = (items) => {
        for (const item of items) {
            result.push(item)
            if (item.children?.length > 0) {
                walk(item.children)
            }
        }
    }
    walk(variables)
    return result
}

// Resolve a token id back to a variable for chip rendering. Configured
// dynamic tokens (e.g. global.date.2.DD-MM-YYYY) don't exist verbatim in
// the variable list, so we fall back to the base "date" variable. Date
// tokens resolve to an actual formatted date (today + offset days) exactly
// like the backend's resolveGlobalVariablePath / formatDateWithFormat.
function findVariableForToken(flattened, id, lang = "en") {
    const direct = flattened.find((v) => v.id === id)
    if (direct) return direct

    const dateMatch = id.match(/^global\.date\.(-?\d+)\.(.+)$/)
    if (dateMatch) {
        const base = flattened.find((v) => v.type === "date")
        if (base) {
            const offset = Number.parseInt(dateMatch[1], 10)
            const format = dateMatch[2] || "DD-MM-YYYY"
            const date = new Date()
            date.setDate(date.getDate() + (Number.isFinite(offset) ? offset : 0))
            return { ...base, id, preview: formatDateWithFormat(date, format, lang) }
        }
    }

    return null
}

/**
 * Shared variable browser. The host editor owns caret/selection behavior and
 * receives the selected variable through onSelect.
 */
function VariablePicker({
    variables = [],
    onSelect,
    popupTitle = "Variables",
    disabled = false,
    open: controlledOpen,
    onOpenChange,
    children,
    align = "end",
    contentClassName,
}) {
    const locale = useLocale()
    const lang = useDateLang(locale)
    const [internalOpen, setInternalOpen] = React.useState(false)
    const [expanded, setExpanded] = React.useState({})
    const [configNode, setConfigNode] = React.useState(null)
    const [dateOffset, setDateOffset] = React.useState(0)
    const [dateFormat, setDateFormat] = React.useState("DD-MM-YYYY")
    const open = controlledOpen ?? internalOpen
    const setOpen = React.useCallback((next) => {
        if (next) setConfigNode(null)
        if (controlledOpen === undefined) setInternalOpen(next)
        onOpenChange?.(next)
    }, [controlledOpen, onOpenChange])

    const choose = React.useCallback((variable) => {
        onSelect?.(variable)
        setOpen(false)
    }, [onSelect, setOpen])

    const openConfig = React.useCallback((variable) => {
        setDateOffset(variable.defaultOffset ?? 0)
        setDateFormat(variable.defaultFormat ?? DEFAULT_DATE_FORMATS[0])
        setConfigNode(variable)
    }, [])

    const confirmConfig = React.useCallback(() => {
        if (!configNode) return
        const token = `global.date.${dateOffset}.${dateFormat}`
        const target = new Date()
        target.setDate(target.getDate() + (Number.isFinite(dateOffset) ? dateOffset : 0))
        choose({
            ...configNode,
            id: token,
            preview: formatDateWithFormat(target, dateFormat, lang),
        })
        setConfigNode(null)
    }, [choose, configNode, dateFormat, dateOffset, lang])

    const renderNode = React.useCallback((variable, level = 0) => {
        const hasChildren = variable.children?.length > 0
        const isExpanded = expanded[variable.id]
        const Icon = variable.icon
        return (
            <div key={variable.id} className="select-none">
                <button
                    type="button"
                    className={cn(
                        "group flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-start transition-all",
                        level > 0 && "ms-6 w-[calc(100%-1.5rem)]",
                        hasChildren
                            ? "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            : "hover:bg-primary/5 hover:text-primary",
                    )}
                    onClick={() => {
                        if (hasChildren) {
                            setExpanded((previous) => ({
                                ...previous,
                                [variable.id]: !previous[variable.id],
                            }))
                        } else if (variable.requiresConfig) {
                            openConfig(variable)
                        } else {
                            choose(variable)
                        }
                    }}
                >
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                        {hasChildren ? (
                            isExpanded
                                ? <ChevronDown size={16} className="shrink-0 text-slate-400" />
                                : <ChevronRight size={16} className="shrink-0 text-slate-400" />
                        ) : <span className="h-4 w-4 shrink-0" />}
                        {Icon ? (
                            <Icon size={18} className={cn("shrink-0", hasChildren ? "text-slate-400" : "text-primary")} />
                        ) : (
                            <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-[var(--primary)] text-[10px] font-bold text-white">
                                {variable.label?.[0]?.toUpperCase() ?? "•"}
                            </span>
                        )}
                        <span className="truncate text-sm font-bold">{variable.label}</span>
                        {!hasChildren && (variable.preview || variable.example) && (
                            <span className="truncate text-[10px] font-medium text-slate-400">
                                ({variable.preview || variable.example})
                            </span>
                        )}
                    </span>
                    {!hasChildren && <Plus size={16} className="shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />}
                </button>
                {hasChildren && isExpanded && (
                    <div className="mt-1">
                        {variable.children.map((child) => renderNode(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }, [choose, expanded, openConfig])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={disabled}>{children}</PopoverTrigger>
            <PopoverContent
                align={align}
                className={cn("min-w-[22rem]! w-auto! p-3", contentClassName)}
                sideOffset={6}
            >
                {configNode ? (
                    <CompactDateConfig
                        configNode={configNode}
                        dateOffset={dateOffset}
                        dateFormat={dateFormat}
                        locale={locale}
                        formats={configNode.formats || DEFAULT_DATE_FORMATS}
                        onBack={() => setConfigNode(null)}
                        onOffsetChange={(next) => setDateOffset(Number.isFinite(next) ? next : 0)}
                        onFormatChange={setDateFormat}
                        onConfirm={confirmConfig}
                    />
                ) : (
                    <>
                        <div className="px-2 pb-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/80">
                            {popupTitle}
                        </div>
                        <div
                            className="max-h-[500px] space-y-1 overflow-y-auto"
                            onWheel={(event) => event.stopPropagation()}
                            onTouchMove={(event) => event.stopPropagation()}
                        >
                            {variables.map((variable) => renderNode(variable))}
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    )
}

// Turn a {{variable.path}} string into DOM content (text + chip + <br> nodes).
function hydrate(container, value, flattened, lang = "en") {
    container.innerHTML = ""
    if (!value) return

    let lastIndex = 0
    let match
    VARIABLE_TOKEN_RE.lastIndex = 0
    while ((match = VARIABLE_TOKEN_RE.exec(value))) {
        const [full, id] = match
        if (match.index > lastIndex) {
            appendTextWithBreaks(container, value.slice(lastIndex, match.index))
        }
        
        const variable = findVariableForToken(flattened, id, lang)
        
        container.appendChild(variable ? buildChip(variable) : document.createTextNode(full))
        lastIndex = match.index + full.length
    }
    if (lastIndex < value.length) {
        appendTextWithBreaks(container, value.slice(lastIndex))
    }
}

const VariableInput = React.forwardRef(function VariableInput(
    {
        className,
        size = "default",
        error,
        disabled,
        multiline = false,
        rows,
        disableHydrate = false,
        placeholder = "Type a value or add a variable...",
        variables = [],
        value,
        defaultValue = "",
        onChange,
        popupTitle = "Variables",
        maxLength,
        ...props
    },
    ref
) {
    const editableRef = React.useRef(null)
    const savedRangeRef = React.useRef(null)
    const [pickerOpen, setPickerOpen] = React.useState(false)
    const locale = useLocale()
    const lang = useDateLang(locale)
    const wrapRef = React.useRef(null)

    // Memoize flattened variables for hydrate
    const flattenedVariables = React.useMemo(() => flattenVariables(variables), [variables])

    // The last value *this component* produced (either by emitting onChange,
    // or by syncing external `value` into the DOM). Comparing against this
    // lets us tell "the parent just echoed back what we told it" apart from
    // "the parent (or a form lib's setValue) changed the value on us".
    const lastEmittedRef = React.useRef(undefined)

    // Kept in refs (not props read directly in syncContent) so syncContent
    // itself stays referentially stable and doesn't force a resync every
    // render just because `variables` is a new array reference.
    const flattenedVariablesRef = React.useRef(flattenedVariables)
    React.useEffect(() => {
        flattenedVariablesRef.current = flattenedVariables
    }, [flattenedVariables])

    const disableHydrateRef = React.useRef(disableHydrate)
    React.useEffect(() => {
        disableHydrateRef.current = disableHydrate
    }, [disableHydrate])

    const langRef = React.useRef(lang)
    React.useEffect(() => {
        langRef.current = lang
    }, [lang])

    const syncContent = React.useCallback((val) => {
        const el = editableRef.current
        if (!el) return
        if (disableHydrateRef.current) {
            setPlainContent(el, val ?? "")
        } else {
            hydrate(el, val ?? "", flattenedVariablesRef.current, langRef.current)
        }
    }, [])

    // Seed the field once on mount.
    React.useEffect(() => {
        const initial = value ?? defaultValue
        syncContent(initial)
        lastEmittedRef.current = initial
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Re-sync whenever `value` changes from *outside* — e.g. a form lib
    // calling setValue("bodyText", normalized). We skip when the incoming
    // value matches what we ourselves last emitted, so normal typing never
    // gets interrupted or loops. Note: this does reset the caret to the end
    // of the field, since we can't know where an externally-set value's
    // cursor "should" be.
    React.useEffect(() => {
        if (value === undefined) return // uncontrolled — nothing to reconcile
        if (value === lastEmittedRef.current) return
        syncContent(value)
        lastEmittedRef.current = value
    }, [value, syncContent])

    const emitChange = React.useCallback(() => {
        const el = editableRef.current
        if (!el) return
        const next = serialize(el)
        if (next === "" && el.childNodes.length > 0) {
            el.innerHTML = ""
        }
        lastEmittedRef.current = next
        onChange?.(next)
    }, [onChange])

    // Safety net for content that lands in the field without ever firing a
    // normal input event — e.g. some browser extensions (autofill,
    // translators, grammar tools) inject text straight into the DOM. The
    // field visibly changes but React/our state never hears about it. We
    // watch the DOM directly and reconcile if what's rendered no longer
    // matches the last value we know about.
    React.useEffect(() => {
        const el = editableRef.current
        if (!el) return
        const observer = new MutationObserver(() => {
            const current = serialize(el)
            if (current === lastEmittedRef.current) return
            lastEmittedRef.current = current
            onChange?.(current)
        })
        observer.observe(el, { childList: true, characterData: true, subtree: true })
        return () => observer.disconnect()
    }, [onChange])

    const saveSelection = () => {
        const sel = window.getSelection()
        if (sel && sel.rangeCount > 0 && editableRef.current?.contains(sel.anchorNode)) {
            savedRangeRef.current = sel.getRangeAt(0).cloneRange()
        }
    }

    // Resolve a range to act on: whatever the user last had selected inside
    // the field, falling back to "end of content" if nothing was captured
    // (e.g. a toolbar button was clicked and focus never left the field).
    const resolveRange = () => {
        const el = editableRef.current
        const sel = window.getSelection()
        sel.removeAllRanges()
        if (savedRangeRef.current && el.contains(savedRangeRef.current.startContainer)) {
            sel.addRange(savedRangeRef.current)
        } else {
            const r = document.createRange()
            r.selectNodeContents(el)
            r.collapse(false)
            sel.addRange(r)
        }
        return sel.getRangeAt(0)
    }

    const insertVariable = React.useCallback(
        (variable) => {
            const el = editableRef.current
            if (!el || disabled) return
            el.focus()

            const range = resolveRange()
            range.deleteContents()

            const chip = buildChip(variable)
            range.insertNode(chip)

            range.setStartAfter(chip)
            range.setEndAfter(chip)
            const sel = window.getSelection()
            sel.removeAllRanges()
            sel.addRange(range)
            savedRangeRef.current = range.cloneRange()

            emitChange()
        },
        [disabled, emitChange]
    )

    // Wrap the current selection in markdown-style markers, e.g. *bold*.
    // If nothing is selected, drops the cursor between the two markers
    // instead (mirrors typical toolbar behavior on empty selection).
    const wrapSelection = React.useCallback(
        (markStart, markEnd = markStart) => {
            const el = editableRef.current
            if (!el || disabled) return
            el.focus()

            const range = resolveRange()
            const selectedText = range.toString()
            const wrapped = `${markStart}${selectedText}${markEnd}`
            range.deleteContents()

            const textNode = document.createTextNode(wrapped)
            range.insertNode(textNode)

            const sel = window.getSelection()
            sel.removeAllRanges()
            if (selectedText) {
                // put the caret right after the closing marker
                range.setStartAfter(textNode)
                range.setEndAfter(textNode)
            } else {
                // put the caret between the two markers so the user can type
                const caretPos = markStart.length
                range.setStart(textNode, caretPos)
                range.setEnd(textNode, caretPos)
            }
            sel.addRange(range)
            savedRangeRef.current = range.cloneRange()

            emitChange()
        },
        [disabled, emitChange]
    )

    // Insert raw plain text at the cursor (used for non-variable tokens).
    const insertRaw = React.useCallback(
        (text) => {
            const el = editableRef.current
            if (!el || disabled) return
            el.focus()

            const range = resolveRange()
            range.deleteContents()
            const textNode = document.createTextNode(text)
            range.insertNode(textNode)

            range.setStartAfter(textNode)
            range.setEndAfter(textNode)
            const sel = window.getSelection()
            sel.removeAllRanges()
            sel.addRange(range)
            savedRangeRef.current = range.cloneRange()

            emitChange()
        },
        [disabled, emitChange]
    )

    // Expose a small textarea-like API on the ref. A contentEditable div has
    // no .value/.selectionStart/.setSelectionRange, so callers that used to
    // treat this like a <textarea> should switch to these methods instead.
    React.useImperativeHandle(
        ref,
        () => ({
            get value() {
                return editableRef.current ? serialize(editableRef.current) : ""
            },
            focus: () => editableRef.current?.focus(),
            wrapSelection,
            insertVariable,
            insertRaw,
            openVariablePicker: () => setPickerOpen(true),
        }),
        [wrapSelection, insertVariable, insertRaw]
    )

    const handleKeyDown = (e) => {

        if ((e.ctrlKey || e.metaKey) && ["b", "i", "u", "ه", "ع", "unidentified"].includes(e.key.toLowerCase())) {
            e.preventDefault()
            return
        }

        // Enforce maxLength — block further printable-character insertion once
        // the serialized value has reached the limit. Non-character keys
        // (Backspace, Delete, arrows, Enter, shortcuts, etc.) are left alone.
        if (
            maxLength != null &&
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
        ) {
            const el = editableRef.current
            const currentLength = el ? serialize(el).length : 0
            const sel = window.getSelection()
            const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed && el?.contains(sel.anchorNode)
            if (currentLength >= maxLength && !hasSelection) {
                e.preventDefault()
                return
            }
        }

        if (e.key === "Enter") {
            if (!multiline) {
                // Acts like a normal <input> — Enter never inserts a line break.
                e.preventDefault()
                return
            }
            // Normalize Enter to a plain <br> instead of the nested <div>/<p>
            // most browsers insert by default, so serialize() (which only
            // walks direct children) stays flat and round-trips cleanly.
            e.preventDefault()
            document.execCommand("insertLineBreak")
            emitChange()
            return
        }

        if (e.key !== "Backspace") return
        const sel = window.getSelection()
        if (!sel.rangeCount || !sel.isCollapsed) return
        const range = sel.getRangeAt(0)
        const { startContainer, startOffset } = range

        let nodeBefore = null
        if (startContainer.nodeType === Node.TEXT_NODE && startOffset === 0) {
            nodeBefore = startContainer.previousSibling
        } else if (startContainer.nodeType === Node.ELEMENT_NODE) {
            nodeBefore = startContainer.childNodes[startOffset - 1]
        }

        if (nodeBefore?.dataset?.variable !== undefined) {
            e.preventDefault()
            nodeBefore.remove()
            emitChange()
        }
    }



    const hasVariables = variables.length > 0
    const lineHeightPx = 24 // matches leading-6 below
    const minHeightStyle = multiline && rows ? { minHeight: `${rows * lineHeightPx}px` } : undefined

    // Intercept paste so we control what lands in the field: plain text only
    // (no rich formatting from the clipboard), newlines stripped when not
    // multiline, and truncated to whatever room is left under maxLength.
    const handlePaste = (e) => {
        const el = editableRef.current
        if (!el || disabled) return
        e.preventDefault()

        let text = e.clipboardData.getData("text/plain")
        if (!text) return
        if (!multiline) {
            text = text.replace(/\r\n|\r|\n/g, " ")
        }

        const sel = window.getSelection()
        const hasSelection = sel && sel.rangeCount > 0 && !sel.isCollapsed && el.contains(sel.anchorNode)
        const selectedLength = hasSelection ? sel.getRangeAt(0).toString().length : 0

        if (maxLength != null) {
            const currentLength = serialize(el).length
            const available = maxLength - (currentLength - selectedLength)
            if (available <= 0) return
            if (text.length > available) {
                text = text.slice(0, available)
            }
        }

        const range = resolveRange()
        range.deleteContents()

        const fragment = document.createDocumentFragment()
        let lastNode = null
        const lines = text.split("\n")
        lines.forEach((line, i) => {
            if (line) {
                lastNode = document.createTextNode(line)
                fragment.appendChild(lastNode)
            }
            if (i < lines.length - 1) {
                lastNode = document.createElement("br")
                fragment.appendChild(lastNode)
            }
        })
        range.insertNode(fragment)

        if (lastNode) {
            range.setStartAfter(lastNode)
            range.setEndAfter(lastNode)
            const sel2 = window.getSelection()
            sel2.removeAllRanges()
            sel2.addRange(range)
            savedRangeRef.current = range.cloneRange()
        }

        emitChange()
    }
    return (
        <div ref={wrapRef} className="group relative w-full">
            <div
                    className={cn(
                        shellBase,
                        "flex",
                        multiline ? "items-start py-2" : "items-center overflow-hidden",
                        sizeClasses[size],
                        hasVariables && "ltr:pr-11 rtl:pl-11",
                        error && shellError,
                        className
                    )}
                    data-disabled={disabled || undefined}
                >
                    <div
                        ref={editableRef}
                        contentEditable={!disabled}
                        suppressContentEditableWarning
                        data-slot="variable-input"
                        data-placeholder={placeholder}
                        style={minHeightStyle}
                        onInput={emitChange}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        onKeyUp={saveSelection}
                        onMouseUp={saveSelection}
                        onBlur={saveSelection}
                        className={cn(
                            "min-w-0 flex-1 leading-6 text-foreground outline-none",
                            multiline
                                ? "whitespace-pre-wrap break-words"
                                : [
                                    "whitespace-pre overflow-x-auto overflow-y-hidden",
                                    "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
                                ],
                            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/80"
                        )}
                        {...props}
                    />

                    {hasVariables && !disableHydrate && (
                        <VariablePicker
                            variables={variables}
                            onSelect={insertVariable}
                            popupTitle={popupTitle}
                            disabled={disabled}
                            open={pickerOpen}
                            onOpenChange={setPickerOpen}
                        >
                            <button
                                type="button"
                                disabled={disabled}
                                onPointerDown={saveSelection}
                                onClick={(event) => event.stopPropagation()}
                                aria-label="Insert variable"
                                className={cn(
                                    "absolute end-2",
                                    multiline ? "top-2" : "top-1/2 -translate-y-1/2",
                                    "flex h-7 w-7 items-center justify-center rounded-md",
                                    "border border-border bg-background text-muted-foreground",
                                    "hover:bg-foreground/5 hover:text-foreground transition-colors duration-200",
                                    "disabled:pointer-events-none disabled:opacity-50"
                                )}
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </button>
                        </VariablePicker>
                    )}
                </div>
        </div>
    )
})

VariableInput.displayName = "VariableInput"

export { VariableInput, VariableChip, VariablePicker, VariableTextPreview, flattenVariables, findVariableForToken }
export default VariableInput
