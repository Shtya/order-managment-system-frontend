import React from 'react'

const SafeHtmlRenderer = ({ html, className = '' }) => {
  if (!html || html.trim() === '') return null

  return (
    <div className={`text-sm text-slate-700 dark:text-slate-200 ${className}`}>
      <div
        dir="auto" // Automatically switches layout to RTL if text starts with Arabic script
        className="text-slate-600 dark:text-slate-300 space-y-2 break-words 
          [&_ul]:list-disc [&_ol]:list-decimal 
          [&_ul]:ps-6 [&_ol]:ps-6 
          [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-800 [&_h1].dark:text-slate-100 [&_h1]:my-3
          [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-700 [&_h2].dark:text-slate-200 [&_h2]:my-2
          [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-700 [&_h3].dark:text-slate-200 [&_h3]:my-2
          [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-slate-700 [&_h4].dark:text-slate-200 [&_h4]:my-2
          [&_blockquote]:border-s-4 [&_blockquote]:border-primary/20 [&_blockquote]:ps-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 [&_blockquote].dark:text-slate-400 [&_blockquote]:my-2
          [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-sm [&_img]:inline-block"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}

export default SafeHtmlRenderer