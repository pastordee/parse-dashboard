/*
 * Copyright (c) 2016-present, Parse, LLC
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */
import CodeSnippet from 'components/CodeSnippet/CodeSnippet.react';
import { marked } from 'marked';
import PropTypes from 'lib/PropTypes';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

// marked 17 (2026-10-27): renderers get ONE token object, not (code, lang).
// The old (code, lang) signature handed CodeSnippet the whole token, React
// threw "Objects are not valid as a React child" and the page went blank (the
// AI agent, on any reply with a code block). marked also dropped `sanitize`,
// so raw HTML in the text is escaped here instead, and links/images may only
// point at http(s), mailto or relative addresses.
const escapeHtml = text =>
  String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
const safeUrl = href => /^(https?:|mailto:|\/|#|\.)/i.test(String(href || '').trim());

const renderer = new marked.Renderer();
renderer.code = ({ text, lang }) => {
  const snippet = <CodeSnippet source={String(text ?? '')} language={lang || undefined} fullPage={false} />;

  return ReactDOMServer.renderToString(snippet);
};
renderer.html = ({ text }) => escapeHtml(text);
renderer.link = function ({ href, title, tokens }) {
  const inner = this.parser.parseInline(tokens);
  if (!safeUrl(href)) {
    return inner;
  }
  return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''} target="_blank" rel="noopener noreferrer">${inner}</a>`;
};
renderer.image = ({ href, title, text }) => {
  if (!safeUrl(href)) {
    return escapeHtml(text || '');
  }
  return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text || '')}"${title ? ` title="${escapeHtml(title)}"` : ''}>`;
};

const Markdown = ({ content }) => {
  let rawHtml;
  try {
    rawHtml = marked(String(content ?? ''), { renderer: renderer });
  } catch {
    // Never take the page down over one message: show it as plain text.
    return <div style={{ whiteSpace: 'pre-wrap' }}>{String(content ?? '')}</div>;
  }

  // Raw HTML, links and images are made safe by the renderer above.
  return <div dangerouslySetInnerHTML={{ __html: rawHtml }} />;
};

export default Markdown;

Markdown.propTypes = {
  content: PropTypes.string.isRequired.describe('The content that will be rendered as markdown.'),
};
