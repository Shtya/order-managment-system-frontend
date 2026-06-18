'use client'

import isHotkey from 'is-hotkey'
import React, { useCallback, useMemo, forwardRef, useState, useEffect, useRef } from 'react'
import { Editor, Element as SlateElement, Transforms, createEditor, Node, Text } from 'slate'
import { withHistory } from 'slate-history'
import { Editable, Slate, useSlate, withReact } from 'slate-react'
import { ErrorBoundary } from 'react-error-boundary';
import {
  Bold,
  Italic,
  Underline,
  Code,
  Quote,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RotateCcw,
  RotateCw,
  Highlighter,
  TypeIcon,
  Code2,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import Button_ from './Button'
import { useLocale, useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDebounce } from '@/hook/useDebounce'
import { useClipboard } from '@/hook/useClipboard'
import { motion } from 'framer-motion'
import { htmlToSlate, slateToHtml, htmlToSlateConfig, slateToHtmlConfig, Element } from '@slate-serializers/html'

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
  'mod+z': 'undo',
  'mod+shift+z': 'redo',
}
const LIST_TYPES = ['numbered-list', 'bulleted-list']
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify']

// Helper function to parse style string into an object
const parseStyle = (styleString) => {
  if (!styleString) return {}
  return styleString
    .split(';')
    .reduce((acc, rule) => {
      const [key, value] = rule.split(':').map(s => s.trim())
      if (key && value) {
        acc[key] = value
      }
      return acc
    }, {})
}

// Add this right below your parseStyle function
const extractColorMarks = (el) => {
  const style = parseStyle(el.attribs['style'] || '')
  const marks = {}
  if (style['color']) {
    marks.color = style['color']
  }
  if (style['background-color']) {
    marks.bgColor = style['background-color']
  }
  return marks
}

// Custom htmlToSlate configuration
const customHtmlToSlateConfig = {
  ...htmlToSlateConfig,
  elementTags: {
    ...htmlToSlateConfig.elementTags,
    img: (el) => ({
      type: 'image',
      url: (el.attribs['src'] || '').replace(/^[`"'\s]+|[`"'\s]+$/g, '').trim(),
      alt: el.attribs['alt']?.trim() || '',
    }),
    blockquote: () => ({ type: 'block-quote' }),
    ol: () => ({ type: 'numbered-list' }),
    ul: () => ({ type: 'bulleted-list' }),
    li: (el) => {
      const style = parseStyle(el.attribs['style'] || '')
      const element = { type: 'list-item' }
      if (style['text-align']) {
        element.align = style['text-align']
      }
      return element
    },
    p: (el) => {
      const style = parseStyle(el.attribs['style'] || '')
      const element = { type: 'paragraph' }
      if (style['text-align']) {
        element.align = style['text-align']
      }
      return element
    },
    h1: (el) => {
      const style = parseStyle(el.attribs['style'] || '')
      const element = { type: 'heading-one' }
      if (style['text-align']) {
        element.align = style['text-align']
      }
      return element
    },
    h2: (el) => {
      const style = parseStyle(el.attribs['style'] || '')
      const element = { type: 'heading-two' }
      if (style['text-align']) {
        element.align = style['text-align']
      }
      return element
    },
    h3: (el) => {
      const style = parseStyle(el.attribs['style'] || '')
      const element = { type: 'heading-three' }
      if (style['text-align']) {
        element.align = style['text-align']
      }
      return element
    },
    h4: (el) => {
      const style = parseStyle(el.attribs['style'] || '')
      const element = { type: 'heading-four' }
      if (style['text-align']) {
        element.align = style['text-align']
      }
      return element
    },
    h5: (el) => {
      const style = parseStyle(el.attribs['style'] || '')
      const element = { type: 'heading-five' }
      if (style['text-align']) {
        element.align = style['text-align']
      }
      return element
    },
    h6: (el) => {
      const style = parseStyle(el.attribs['style'] || '')
      const element = { type: 'heading-six' }
      if (style['text-align']) {
        element.align = style['text-align']
      }
      return element
    },
  },
  textTags: {
    ...htmlToSlateConfig.textTags,
    span: (el) => extractColorMarks(el),
    strong: (el) => ({ bold: true, ...extractColorMarks(el) }),
    b: (el) => ({ bold: true, ...extractColorMarks(el) }),
    em: (el) => ({ italic: true, ...extractColorMarks(el) }),
    i: (el) => ({ italic: true, ...extractColorMarks(el) }),
    u: (el) => ({ underline: true, ...extractColorMarks(el) }),
    code: (el) => ({ code: true, ...extractColorMarks(el) }),
  },
}
// Custom slateToHtml configuration
const customSlateToHtmlConfig = {
  ...slateToHtmlConfig,
  elementMap: {
    ...slateToHtmlConfig.elementMap,
    'block-quote': 'blockquote',
    'numbered-list': 'ol',
    'bulleted-list': 'ul',
    'list-item': 'li',
    'heading-one': 'h1',
    'heading-two': 'h2',
    'heading-three': 'h3',
    'heading-four': 'h4',
    'heading-five': 'h5',
    'heading-six': 'h6',
    'paragraph': 'p',
    'image': 'img',
  },
  elementTransforms: {
    ...slateToHtmlConfig.elementTransforms,
    'block-quote': ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('blockquote', { style }, children)
    },
    'numbered-list': ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('ol', { style }, children)
    },
    'bulleted-list': ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('ul', { style }, children)
    },
    'list-item': ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('li', { style }, children)
    },
    'heading-one': ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('h1', { style }, children)
    },
    'heading-two': ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('h2', { style }, children)
    },
    'heading-three': ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('h3', { style }, children)
    },
    'heading-four': ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('h4', { style }, children)
    },
    'heading-five': ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('h5', { style }, children)
    },
    'heading-six': ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('h6', { style }, children)
    },
    paragraph: ({ node, children }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('p', { style }, children)
    },
    image: ({ node }) => {
      const style = node?.align ? `text-align: ${node?.align};` : ''
      return new Element('img', {
        src: node?.url,
        alt: node?.alt || '',
        style,
      })
    },
  },
  markMap: {
    ...slateToHtmlConfig.markMap,
    color: ['span'],
    bgColor: ['span'],
  },
  markTransforms: {
    ...slateToHtmlConfig.markTransforms,
    color: ({ node, text }) => {

      return new Element('span', { style: `color: ${node?.color};` }, text)
    },
    bgColor: ({ node, text }) => {
      return new Element('span', { style: `background-color: ${node?.bgColor};` }, text)
    },
  },
}

const withHtml = (editor) => {
  // 1. Destructure normalizeNode alongside the others
  const { insertData, isVoid, isInline, normalizeNode } = editor

  editor.isVoid = (element) => {
    return element.type === 'image' ? true : isVoid(element)
  }

  editor.isInline = (element) => {
    return element.type === 'image' ? true : isInline(element)
  }

  // 2. Add Custom Normalization to prevent block destruction
  editor.normalizeNode = (entry) => {
    const [node, path] = entry

    // 1. Only act on list-items or block-quotes
    if (SlateElement.isElement(node) && ['list-item', 'block-quote'].includes(node.type)) {

      // Check if the current child is already a block (e.g., a paragraph)
      // If it is, we don't need to wrap it again.
      const hasBlockChild = node.children.some(c => Editor.isBlock(editor, c))

      if (hasBlockChild) {
        // If it already has a block child, just let default normalization handle it.
        // Do NOT wrap again, or you will create infinite nested nodes.
        return normalizeNode(entry)
      }

      // Only if there is NO block child, do we wrap the loose text/inlines
      const hasInlineOrTextChild = node.children.some(
        c => Editor.isInline(editor, c) || Text.isText(c)
      )

      if (hasInlineOrTextChild) {
        Transforms.wrapNodes(
          editor,
          { type: 'paragraph', children: [] },
          { at: path, match: n => n !== node } // Wrap children, not the container itself
        )
        return // Important: return to let the next loop handle the fresh structure
      }
    }

    // 3. Fall back to the default Slate normalizer
    normalizeNode(entry)
  }

  editor.insertData = data => {
    const html = data.getData('text/html')

    if (html) {
      const fragment = htmlToSlate(html, customHtmlToSlateConfig)
      Transforms.insertFragment(editor, fragment)
      return
    }

    insertData(data)
  }

  return editor
}

// Function to insert image
const insertImage = (editor, url) => {
  const imageElement = { type: 'image', url, children: [{ text: '' }] }
  Transforms.insertNodes(editor, imageElement)
}

const deserializeHtml = (html) => {

  if (!html) return EMPTY_VALUE
  const fragment = htmlToSlate(html, customHtmlToSlateConfig)
  const nodes = Array.isArray(fragment) ? fragment : [fragment]

  return nodes
}

const serialize = (nodes) => {
  const html = slateToHtml(nodes, customSlateToHtmlConfig)

  return html
}

const EMPTY_VALUE = [
  {
    type: "paragraph",
    children: [{ text: "" }],
  },
]


const RichTextEditor = forwardRef(
  ({ value, onChange, placeholder, className, disabled = false }, ref) => {
    const t = useTranslations('common.richTextEditor')
    const locale = useLocale()
    const isAr = locale === "ar"
    const [isHtmlView, setIsHtmlView] = useState(false)
    // Compute slate value from HTML prop
    const externalSlateValue = useMemo(() => deserializeHtml(value), [value])
    // Track last external value to know when to sync
    const lastExternalValueRef = useRef(value)
    // Use internal editorValue, initialized from externalSlateValue
    const [editorValue, setEditorValue] = useState(externalSlateValue)
    const { copied, handleCopy: copyToClipboard } = useClipboard(1400)
    const [remountKey, setRemountKey] = useState(0);
    // Add remountKey to the dependency array
    const editor = useMemo(
      () => withHtml(withHistory(withReact(createEditor()))),
      [remountKey]
    )

    // Sync internal editorValue when external prop value changes from last known
    useEffect(() => {
      if (value !== lastExternalValueRef.current) {
        // External value changed, update everything
        setEditorValue(externalSlateValue)
        lastExternalValueRef.current = value
        // Also reset Slate editor's content
        Transforms.delete(editor, {
          at: {
            anchor: Editor.start(editor, []),
            focus: Editor.end(editor, []),
          },
        })
        Transforms.insertFragment(editor, externalSlateValue, { at: [0] })
      }
    }, [value, externalSlateValue, editor])

    const defaultPlaceholder = t('placeholder')
    const [html, setHtml] = useState("")

    useEffect(() => {
      if (isHtmlView) {
        setHtml(serialize(editorValue))
      }
    }, [isHtmlView, editorValue])

    const handleChange = (newValue) => {
      setEditorValue(newValue)
      const newHtml = serialize(newValue)
      // Update lastExternalValue to the new HTML so we don't think it's an external change
      lastExternalValueRef.current = newHtml
      onChange(newHtml)
    }

    const handleCopy = async () => {
      copyToClipboard(html)
    }

    const renderElement = useCallback(props => <MySlateElement {...props} />, [])
    const renderLeaf = useCallback(props => <Leaf {...props} />, [])


    // This fires when Fake Filler crashes the DOM
    const handleError = (error, info) => {
      console.warn("Slate intercepted an external DOM mutation crash. Auto-recovering...", error);
      // Incrementing the key forces React to throw away the broken DOM and remount
      setRemountKey(prev => prev + 1);
    };

    return (
      <div ref={ref} className={cn('w-full', className)}>
        <ErrorBoundary
          key={remountKey}
          fallback={null} // Renders nothing for a microsecond while it resets
          onError={handleError}
        >
          <Slate
            editor={editor}
            initialValue={editorValue}
            onChange={handleChange}
          >
            <Toolbar
              disabled={disabled || isHtmlView}
              isAr={isAr}
              t={t}
              isHtmlView={isHtmlView}
              onToggleHtmlView={() => setIsHtmlView(!isHtmlView)}
            />
            {isHtmlView ? (
              <div className="relative">
                <div className={cn(
                  'min-h-[300px] p-4 rich-text-editor',
                  'border border-border',
                  '!bg-background/60 !text-foreground text-sm',
                  '!rounded-md',
                  'overflow-y-auto',
                  'font-mono'
                )}>
                  <pre className="whitespace-pre-wrap">{html}</pre>
                </div>
                <Button_
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    handleCopy()
                  }}
                  label={copied ? (
                    <motion.span key="copied" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 size={14} /> {t("common.copied")}
                    </motion.span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy size={14} /> {t("common.copy")}
                    </span>
                  )}
                />

              </div>
            ) : (
              <Editable
                renderElement={renderElement}
                renderLeaf={renderLeaf}
                placeholder={placeholder || defaultPlaceholder}
                renderPlaceholder={({ attributes }) => (
                  <span
                    {...attributes}
                    className=" text-muted-foreground/80 absolute top-5! text-slate-400  opacity-70 pointer-events-none max-w-[200px]!"
                  >
                    {defaultPlaceholder}
                  </span>
                )}
                spellCheck
                readOnly={disabled}
                dir={isAr ? 'rtl' : 'ltr'}
                
                className={cn(
                  'ignore-fake-filler',
                  'min-h-[300px]! max-h-[500px]! p-4 rich-text-editor overflow-x-auto',
                  'border border-border',
                  '!bg-background/60 !text-foreground text-sm',
                  'placeholder:text-muted-foreground/80',
                  'transition-all duration-200',
                  'hover:border-[var(--primary)]/50 hover:bg-background',
                  '!outline-none',
                  'focus:border-[var(--primary)] focus:bg-background',
                  'focus:shadow-[0_0_0_3px_rgb(var(--primary-shadow))]',
                  disabled && 'pointer-events-none cursor-not-allowed opacity-50',
                  '!rounded-md',
                  'overflow-y-auto'
                )}
                onKeyDown={event => {
                  if (disabled) return
                  for (const hotkey in HOTKEYS) {
                    if (isHotkey(hotkey, event)) {
                      event.preventDefault()
                      const action = HOTKEYS[hotkey]
                      if (action === 'undo') {
                        editor.undo()
                      } else if (action === 'redo') {
                        editor.redo()
                      } else {
                        toggleMark(editor, action)
                      }
                    }
                  }
                }}
              />
            )}
          </Slate>
        </ErrorBoundary>
      </div>
    )
  }
)



RichTextEditor.displayName = 'RichTextEditor'

const Toolbar = ({ disabled = false, isAr, t, isHtmlView, onToggleHtmlView }) => {
  const editor = useSlate()

  const getCurrentBlockType = () => {
    try {
      const { selection } = editor
      if (!selection) return 'paragraph'
      const [match] = Array.from(
        Editor.nodes(editor, {
          at: Editor.unhangRange(editor, selection),
          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type,
        })
      )
      return match ? match[0].type : 'paragraph'
    } catch (e) {
      return 'paragraph'
    }
  }

  // 1. Get the actual raw block type from Slate
  const rawBlockType = getCurrentBlockType()

  // 2. Define the exact values your Select dropdown actually supports
  const validSelectTypes = [
    'paragraph',
    'heading-one',
    'heading-two',
    'heading-three',
    'heading-four',
    'heading-five',
    'heading-six'
  ]

  // 3. Fallback: If it's a list or quote, tell the Select it is just a 'paragraph' (Normal text)
  const selectValue = validSelectTypes.includes(rawBlockType)
    ? rawBlockType
    : 'paragraph'

  const handleBlockTypeChange = (type) => {
    if (type === 'paragraph') {
      toggleBlock(editor, 'paragraph')
    } else {
      toggleBlock(editor, type)
    }
  }

  return (
    <div className={cn('flex items-center flex-wrap gap-2 p-2 mb-1')}>
      <MarkButton format="undo" icon={<RotateCcw size={16} />} disabled={disabled} />
      <MarkButton format="redo" icon={<RotateCw size={16} />} disabled={disabled} />

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

      {/* 4. Bind the sanitized `selectValue` instead of the raw type */}
      <Select value={selectValue} onValueChange={handleBlockTypeChange} disabled={disabled}>
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue placeholder={t('normal')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">{t('normal')}</SelectItem>
          <SelectItem value="heading-one">{t('heading1')}</SelectItem>
          <SelectItem value="heading-two">{t('heading2')}</SelectItem>
          <SelectItem value="heading-three">{t('heading3')}</SelectItem>
          <SelectItem value="heading-four">{t('heading4')}</SelectItem>
          <SelectItem value="heading-five">{t('heading5')}</SelectItem>
          <SelectItem value="heading-six">{t('heading6')}</SelectItem>
        </SelectContent>
      </Select>

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

      <MarkButton format="bold" icon={<Bold size={16} />} disabled={disabled} />
      <MarkButton format="italic" icon={<Italic size={16} />} disabled={disabled} />
      <MarkButton format="underline" icon={<Underline size={16} />} disabled={disabled} />
      <MarkButton format="code" icon={<Code size={16} />} disabled={disabled} />

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

      {/* ADD THE COLOR PICKERS HERE */}
      <ColorPickerButton
        format="color"
        icon={<TypeIcon size={16} />}
        defaultColor="#000000"
        disabled={disabled}
      />
      <ColorPickerButton
        format="bgColor"
        icon={<Highlighter size={16} />}
        defaultColor="#ffffff"
        disabled={disabled}
      />

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

      {/* Insert Image Button */}
      <Button_
        variant="outline"
        tone=""
        icon={<ImageIcon size={16} />}
        size="sm"
        onMouseDown={event => {
          event.preventDefault()
          if (disabled) return
          const url = prompt('Enter image URL:')
          if (url) {
            insertImage(editor, url)
          }
        }}
        disabled={disabled}
        className="w-8 h-8 p-0!"
      />

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />
      <BlockButton format="block-quote" icon={<Quote size={16} />} disabled={disabled} />

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

      <BlockButton format="numbered-list" icon={<ListOrdered size={16} />} disabled={disabled} />
      <BlockButton format="bulleted-list" icon={<List size={16} />} disabled={disabled} />

      <div className="w-px h-6 bg-slate-200 dark:border-slate-800 mx-2" />

      <BlockButton format="left" icon={<AlignLeft size={16} />} disabled={disabled} />
      <BlockButton format="center" icon={<AlignCenter size={16} />} disabled={disabled} />
      <BlockButton format="right" icon={<AlignRight size={16} />} disabled={disabled} />
      <BlockButton format="justify" icon={<AlignJustify size={16} />} disabled={disabled} />

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

      {/* HTML View Toggle Button */}
      <Button_
        variant={isHtmlView ? 'solid' : 'outline'}
        tone={isHtmlView ? 'primary' : ''}
        icon={<Code2 size={16} />}
        size="sm"
        onMouseDown={event => {
          event.preventDefault()
          onToggleHtmlView()
        }}
        className="w-8 h-8 p-0!"
      />
    </div>
  )
}

const ColorPickerButton = ({ format, icon, defaultColor, disabled = false }) => {
  const editor = useSlate()
  // Get the current color of the highlighted text, or fallback to default
  const currentColor = getActiveColor(editor, format) || defaultColor
  const [tempColor, setTempColor] = useState(currentColor)
  const inputRef = React.useRef(null)

  // Update tempColor when currentColor changes (e.g., selecting different text)
  useEffect(() => {
    setTempColor(currentColor)
  }, [currentColor])

  useDebounce({
    value: tempColor,
    delay: 200,
    onDebounce: (color) => {
      Editor.addMark(editor, format, color)
    },
  })

  const handleChange = (e) => {
    setTempColor(e.target.value)
  }

  return (
    <div className="relative">
      <Button_
        variant="outline"
        tone=""
        icon={
          <div className="relative">
            {icon}
            {/* Visual indicator bar showing the current color */}
            <div
              className="absolute bottom-[-2px] left-1/2 transform -translate-x-1/2 w-4 h-0.5 rounded-full"
              style={{ backgroundColor: currentColor }}
            />
          </div>
        }
        size="sm"
        onMouseDown={event => {
          event.preventDefault()
          if (!disabled) {
            inputRef.current?.click()
          }
        }}
        disabled={disabled}
        className="w-8 h-8 p-0!"
      />
      {/* Hidden native color input triggered programmatically */}
      <input
        ref={inputRef}
        type="color"
        value={tempColor}
        onChange={handleChange}
        disabled={disabled}
        className="absolute opacity-0 w-0 h-0"
        id={`color-picker-${format}`}
      />
    </div>
  )
}

const toggleBlock = (editor, format) => {
  try {
    const isAlign = isAlignType(format)
    const isList = isListType(format)
    const isQuote = format === 'block-quote'

    const isActive = isBlockActive(
      editor,
      format,
      isAlign ? 'align' : 'type'
    )

    // Batch operations to prevent normalizers from running mid-toggle and stacking elements
    Editor.withoutNormalizing(editor, () => {
      // 1. Strip away any existing list or quote wrappers
      Transforms.unwrapNodes(editor, {
        match: n =>
          !Editor.isEditor(n) &&
          SlateElement.isElement(n) &&
          (isListType(n.type) || n.type === 'block-quote') &&
          !isAlign,
        split: true,
      })

      // 2. Set the inner nodes to the correct type
      let newProperties
      if (isAlign) {
        newProperties = { align: isActive ? undefined : format }
      } else {
        newProperties = {
          type: isActive ? 'paragraph' : isList ? 'list-item' : isQuote ? 'paragraph' : format,
        }
      }
      Transforms.setNodes(editor, newProperties)

      // 3. Wrap the nodes in their new container if we are activating it
      if (!isActive && (isList || isQuote)) {
        const block = { type: format, children: [] }
        Transforms.wrapNodes(editor, block)
      }
    })
  } catch (e) {
    // Failsafe catch to prevent editor crashes
    console.error("Error toggling block:", e)
  }
}

const getActiveColor = (editor, format) => {
  try {
    const marks = Editor.marks(editor)
    return marks ? marks[format] : null
  } catch (e) {
    return null
  }
}

const toggleMark = (editor, format) => {
  try {
    if (format === 'undo') {
      editor.undo()
      return
    }
    if (format === 'redo') {
      editor.redo()
      return
    }

    const isActive = isMarkActive(editor, format)
    if (isActive) {
      Editor.removeMark(editor, format)
    } else {
      Editor.addMark(editor, format, true)
    }
  } catch (e) {
    // Do nothing if there's an error
  }
}

const isBlockActive = (editor, format, blockType = 'type') => {
  try {
    const { selection } = editor
    if (!selection) return false
    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n => {
          // FIX: Use SlateElement and exclude Editor
          if (!Editor.isEditor(n) && SlateElement.isElement(n)) {
            if (blockType === 'align' && isAlignElement(n)) {
              return n.align === format
            }
            return n.type === format
          }
          return false
        },
      })
    )
    return !!match
  } catch (e) {
    return false
  }
}

const isMarkActive = (editor, format) => {
  if (format === 'undo' || format === 'redo') return false
  try {
    const marks = Editor.marks(editor)
    return marks ? marks[format] === true : false
  } catch (e) {
    return false
  }
}

const MySlateElement = ({ attributes, children, element }) => {
  const style = {}
  if (isAlignElement(element)) {
    style.textAlign = element.align
  }
  switch (element.type) {
    case 'image':
      return (
        <span
          {...attributes}
          style={{ display: 'inline-block', ...style }}
          className="my-1 mx-1 vertical-middle select-none"
        >
          <img
            src={element.url}
            alt={element.alt || ''}
            contentEditable={false} // Prevents browser from treating image as typeable area
            className="max-w-full h-auto rounded-lg shadow-sm inline"
          />
          {children}
        </span>
      )
    case 'block-quote':
      return (
        <blockquote
          style={style}
          {...attributes}
          className="border-l-4 border-primary/20 pl-4 italic text-slate-600 dark:text-slate-400 my-2"
        >
          {children}
        </blockquote>
      )
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes} className="list-disc ps-6 my-2"> {/* Note 'ps-6' instead of 'pl-6' */}
          {children}
        </ul>
      )
    case 'numbered-list':
      return (
        <ol style={style} {...attributes} className="list-decimal ps-6 my-2"> {/* Note 'ps-6' instead of 'pl-6' */}
          {children}
        </ol>
      )
    case 'heading-one':
      return (
        <h1 style={style} {...attributes} className="text-3xl font-bold text-slate-800 dark:text-slate-100 my-3">
          {children}
        </h1>
      )
    case 'heading-two':
      return (
        <h2 style={style} {...attributes} className="text-2xl font-semibold text-slate-700 dark:text-slate-200 my-2">
          {children}
        </h2>
      )
    case 'heading-three':
      return (
        <h3 style={style} {...attributes} className="text-xl font-semibold text-slate-700 dark:text-slate-200 my-2">
          {children}
        </h3>
      )
    case 'heading-four':
      return (
        <h4 style={style} {...attributes} className="text-lg font-semibold text-slate-700 dark:text-slate-200 my-2">
          {children}
        </h4>
      )
    case 'heading-five':
      return (
        <h5 style={style} {...attributes} className="text-base font-semibold text-slate-700 dark:text-slate-200 my-2">
          {children}
        </h5>
      )
    case 'heading-six':
      return (
        <h6 style={style} {...attributes} className="text-sm font-semibold text-slate-700 dark:text-slate-200 my-2">
          {children}
        </h6>
      )
    case 'list-item':
      return (
        <li style={style} {...attributes} className="my-1">
          {children}
        </li>
      )
    default:
      return (
        <p style={style} {...attributes} className="my-1 text-slate-700 dark:text-slate-300">
          {children}
        </p>
      )
  }
}

const Leaf = ({ attributes, children, leaf }) => {
  const style = {}
  if (leaf.color) style.color = leaf.color
  if (leaf.bgColor) style.backgroundColor = leaf.bgColor

  if (leaf.bold) {
    children = <strong>{children}</strong>
  }
  if (leaf.code) {
    children = (
      <code className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    )
  }
  if (leaf.italic) {
    children = <em>{children}</em>
  }
  if (leaf.underline) {
    children = <u>{children}</u>
  }
  return <span {...attributes} style={style}>{children}</span>
}

const BlockButton = ({ format, icon, disabled = false }) => {
  const editor = useSlate()
  const isActive = isBlockActive(
    editor,
    format,
    isAlignType(format) ? 'align' : 'type'
  )

  return (
    <Button_
      variant={isActive ? 'solid' : 'outline'}
      tone={isActive ? 'primary' : ''}
      icon={icon}
      size="sm"
      // FIX: Use onMouseDown instead of onClick + onPointerDown
      onMouseDown={event => {
        event.preventDefault()
        if (!disabled) toggleBlock(editor, format)
      }}
      disabled={disabled}
      className="w-8 h-8 p-0!"
    />
  )
}

const MarkButton = ({ format, icon, disabled = false }) => {
  const editor = useSlate()
  const isActive = isMarkActive(editor, format)

  return (
    <Button_
      variant={isActive ? 'solid' : 'outline'}
      tone={isActive ? 'primary' : ''}
      icon={icon}
      size="sm"
      // FIX: Use onMouseDown instead of onClick + onPointerDown
      onMouseDown={event => {
        event.preventDefault()
        if (!disabled) toggleMark(editor, format)
      }}
      disabled={disabled}
      className="w-8 h-8 p-0!"
    />
  )
}

const isAlignType = format => {
  return TEXT_ALIGN_TYPES.includes(format)
}

const isListType = format => {
  return LIST_TYPES.includes(format)
}

const isAlignElement = element => {
  return 'align' in element
}

export default RichTextEditor

export const initialValue = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
]
