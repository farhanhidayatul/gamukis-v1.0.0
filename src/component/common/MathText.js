import React, { useMemo } from 'react';
import katex from 'katex';
import DOMPurify from 'dompurify';
import './MathText.css';

/**
 * Strict DOMPurify configuration for KaTeX rendered HTML.
 * Allows MathML and SVG elements required by KaTeX for mathematical notation,
 * while forbidding executable scripts, iframes, and dangerous event handlers.
 */
const DOMPURIFY_KATEX_CONFIG = Object.freeze({
  USE_PROFILES: { mathMl: true, svg: true, html: true },
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'applet', 'meta', 'link', 'base', 'form'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'action', 'formaction'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:]|$))/i
});

/**
 * Sanitizes KaTeX rendered HTML output using DOMPurify before rendering into the DOM.
 * Strips script tags, onerror/onclick event handlers, iframe/object/embed, and javascript: links.
 * Falls back safely to regex stripping if DOMPurify is unavailable.
 */
function sanitizeKaTeX(html) {
  if (!html || typeof html !== 'string') return '';

  const purifier = (typeof DOMPurify !== 'undefined' && DOMPurify && typeof DOMPurify.sanitize === 'function')
    ? DOMPurify
    : (typeof window !== 'undefined' && window.DOMPurify && typeof window.DOMPurify.sanitize === 'function' ? window.DOMPurify : null);

  if (purifier) {
    try {
      return purifier.sanitize(html, DOMPURIFY_KATEX_CONFIG);
    } catch (err) {
      console.warn('[MathText] DOMPurify sanitize warning, using fallback filter:', err.message);
    }
  }

  // Fallback regex sanitizer if DOMPurify instance is unavailable
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:[^"'\s>]+/gi, '')
    .replace(/<\/?(?:iframe|object|embed|applet|meta|link|base)\b[^>]*>/gi, '');
}

/**
 * MathText Component
 * Tokenizes plain text containing LaTeX blocks ($...$ or $$...$$) and renders them using KaTeX.
 * Handles mixed content seamlessly and falls back to raw text on syntax error.
 */
function MathText({ text = '', className = '' }) {
  const renderedElements = useMemo(() => {
    if (!text || typeof text !== 'string') {
      return null;
    }

    // Fast path: no math delimiters present
    if (!text.includes('$')) {
      return text;
    }

    // Regex to capture $$...$$ (block) and $...$ (inline)
    const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$)/g;
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (!part) return null;

      const isBlock = part.startsWith('$$') && part.endsWith('$$');
      const isInline = !isBlock && part.startsWith('$') && part.endsWith('$');

      if (isBlock || isInline) {
        const mathContent = isBlock ? part.slice(2, -2).trim() : part.slice(1, -1).trim();

        if (!mathContent) {
          return null;
        }

        try {
          const html = katex.renderToString(mathContent, {
            displayMode: isBlock,
            throwOnError: false,
            strict: false,
            trust: false
          });

          const cleanHtml = sanitizeKaTeX(html);

          return (
            <span
              key={`math-${index}`}
              className={isBlock ? 'math-block' : 'math-inline'}
              dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />
          );
        } catch {
          return (
            <span key={`fallback-${index}`} className="math-fallback">
              {part}
            </span>
          );
        }
      }

      return <React.Fragment key={`text-${index}`}>{part}</React.Fragment>;
    });
  }, [text]);

  if (!renderedElements) {
    return null;
  }

  return <span className={`math-text-container ${className}`.trim()}>{renderedElements}</span>;
}

export default MathText;
