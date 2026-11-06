'use client';

import Link from 'next/link';
import { createElement, Fragment, useEffect, useReducer, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import OriginalModel from '@/lib/original-model';
import original from '@/lib/original-document.json';

type Node = string | {
  tag: string;
  attrs: Record<string, string | null>;
  children: Node[];
  pages?: string[];
  content?: boolean;
  slot?: boolean;
};
type Document = {
  slug: string;
  template: boolean;
  nodes: Node[];
  links: Record<string, string>;
  extracts: Record<string, string>;
};
type Model = {
  notify: () => void;
  renderVals: () => Record<string, unknown>;
  closeNavigation: () => void;
};
type Scope = Record<string, unknown>;
const source = original as unknown as Document;
const WHOLE = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/;
const HOLES = /\{\{\s*([^}]+?)\s*\}\}/g;
const styles = new Map<string, CSSProperties>();
const names: Record<string, string> = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', autocomplete: 'autoComplete',
  viewbox: 'viewBox', 'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule', 'clip-rule': 'clipRule',
  'stroke-dasharray': 'strokeDasharray', 'stroke-dashoffset': 'strokeDashoffset',
  'fill-opacity': 'fillOpacity', 'stroke-opacity': 'strokeOpacity',
  'text-anchor': 'textAnchor', 'dominant-baseline': 'dominantBaseline',
  colspan: 'colSpan', rowspan: 'rowSpan', readonly: 'readOnly', maxlength: 'maxLength',
  minlength: 'minLength', autofocus: 'autoFocus', playsinline: 'playsInline',
};
const events: Record<string, string> = { onclick: 'onClick', onsubmit: 'onSubmit', onchange: 'onChange', oninput: 'onInput' };
const booleans = new Set(['required', 'disabled', 'checked', 'selected', 'multiple', 'readOnly', 'autoFocus', 'muted', 'autoPlay', 'controls', 'loop', 'playsInline', 'hidden']);

function lookup(expression: string, scope: Scope): unknown {
  const path = expression.trim();
  if (path === 'true') return true;
  if (path === 'false') return false;
  if (path === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
  if (/^(['"]).*\1$/.test(path)) return path.slice(1, -1);
  return path.split('.').reduce<unknown>((value, key) => value == null ? undefined : (value as Scope)[key], scope);
}

function interpolate(text: string, scope: Scope) {
  return text.replace(HOLES, (_, expression: string) => String(lookup(expression, scope) ?? ''));
}

function attribute(value: string | null, scope: Scope): unknown {
  if (value === null) return true;
  const whole = value.match(WHOLE);
  return whole ? lookup(whole[1], scope) : interpolate(value, scope);
}

function cssStyle(css: string): CSSProperties {
  const cached = styles.get(css);
  if (cached) return cached;
  const declarations: string[] = [];
  let start = 0, depth = 0, quote = '';
  for (let i = 0; i < css.length; i++) {
    const char = css[i];
    if (quote) { if (char === quote && css[i - 1] !== '\\') quote = ''; }
    else if (char === '"' || char === "'") quote = char;
    else if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === ';' && depth === 0) { declarations.push(css.slice(start, i)); start = i + 1; }
  }
  declarations.push(css.slice(start));
  const result: Record<string, string> = {};
  for (const declaration of declarations) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const property = declaration.slice(0, colon).trim();
    if (!property) continue;
    const key = property.startsWith('--') ? property : property.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
    result[key] = declaration.slice(colon + 1).trim();
  }
  styles.set(css, result);
  return result;
}

// Match the original template's mixed Arabic/Latin text handling exactly.
function originalText(value: string, key: string, wrapLatin: boolean): ReactNode {
  if (!wrapLatin) return value;
  const pattern = /[A-Za-z][A-Za-z0-9.+\-]*(?: [A-Za-z0-9][A-Za-z0-9.+\-]*)+/g;
  const children: ReactNode[] = [];
  let last = 0, match: RegExpExecArray | null;
  while ((match = pattern.exec(value))) {
    if (match.index > last) children.push(value.slice(last, match.index));
    children.push(createElement('span', { key: `${key}-${match.index}`, dir: 'ltr', style: { whiteSpace: 'nowrap' } }, match[0]));
    last = match.index + match[0].length;
  }
  if (!last) return value;
  if (last < value.length) children.push(value.slice(last));
  return createElement('span', { key }, ...children);
}

function findById(nodes: Node[], id: string): Node | undefined {
  for (const node of nodes) {
    if (typeof node === 'string') continue;
    if (node.attrs.id === id) return node;
    const found = findById(node.children, id);
    if (found) return found;
  }
}

function destination(href: string, scope: Scope) {
  if (href === '#' && scope.m && String((scope.m as Scope).t).includes('منصة الأسواق')) return '/platform';
  if (!href.startsWith('#')) return href;
  if (source.links[href]) return source.links[href];
  return href === '#' ? '/' : `/${href}`;
}

function download(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${source.slug}-demo-request.txt`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function OriginalSite({ view = 'home' }: { view?: string }) {
  const [, refresh] = useReducer((value: number) => value + 1, 0);
  const [model] = useState(() => new OriginalModel({}) as unknown as Model);
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState('admin');
  const [notice, setNotice] = useState('');
  model.notify = refresh;
  const scope = model.renderVals();

  useEffect(() => {
    function escape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') { setMenu(false); model.closeNavigation(); }
    }
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [model]);

  async function prepareRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Array.from(form.elements).filter((element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement => ['INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName));
    const lines = fields.filter(field => field.type !== 'checkbox' || (field as HTMLInputElement).checked).map(field => {
      const label = field.labels?.[0]?.textContent?.trim() || field.getAttribute('name') || field.id || field.getAttribute('placeholder') || 'تفاصيل';
      return `${label}: ${field.type === 'checkbox' ? 'نعم' : field.value}`;
    });
    const text = [`طلب عرض توضيحي — ${source.slug}`, '', ...lines].join('\n');
    if (source.slug === 'dx-logistics') {
      try { await navigator.clipboard.writeText(text); setNotice('تم تجهيز بيانات الطلب ونسخها. يمكنك مشاركتها مع فريق Transformix عبر قناة التواصل المعتمدة.'); }
      catch { download(text); setNotice('تم تجهيز بيانات الطلب وتنزيل مسودتها على جهازك لمشاركتها مع فريق Transformix.'); }
    } else {
      download(text);
      setNotice('تم إنشاء مسودة الطلب على جهازك. لم تُرسل البيانات إلى الخادم؛ يلزم ربط النموذج بنظام CRM قبل النشر.');
    }
  }

  function keyboardTabs(event: KeyboardEvent<HTMLButtonElement>) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button[aria-selected]') || []);
    if (!buttons.length) return;
    const current = buttons.indexOf(event.currentTarget);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowLeft' ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault(); buttons[next].click(); buttons[next].focus();
  }

  function render(node: Node, values: Scope, key: string, inSvg = false, inHeader = false, parent = '', extracted = false): ReactNode {
    if (typeof node === 'string') return originalText(interpolate(node, values), key, source.template && !inSvg && !['option', 'textarea', 'title'].includes(parent));
    if (node.content && view !== 'home' && !extracted) {
      const extractId = source.extracts[view];
      if (extractId) {
        if (!node.slot) return null;
        const target = findById(source.nodes, extractId);
        return target ? render(target, values, key, inSvg, inHeader, parent, true) : null;
      }
      if (!node.pages?.includes(view)) return null;
    }
    const { tag, attrs } = node;
    if (tag === 'script' || tag === 'template') return null;
    if (tag === 'sc-for') {
      const list = attribute(attrs.list, values);
      return Array.isArray(list) ? list.map((item, index) => createElement(Fragment, { key: `${key}-${index}` }, ...node.children.map((child, i) => render(child, { ...values, [attrs.as || 'item']: item, $index: index }, `${key}-${index}-${i}`, inSvg, inHeader, parent, extracted)))) : null;
    }
    if (tag === 'sc-if') return attribute(attrs.value, values) ? createElement(Fragment, { key }, ...node.children.map((child, i) => render(child, values, `${key}-${i}`, inSvg, inHeader, parent, extracted))) : null;
    const header = inHeader || tag === 'header';
    const svg = inSvg || tag === 'svg';
    const props: Record<string, unknown> = { key };
    for (const [name, value] of Object.entries(attrs)) {
      if (name.startsWith('hint-') || name === 'data-dc-drop') continue;
      const resolved = attribute(value, values);
      if (events[name]) { if (typeof resolved === 'function') props[events[name]] = resolved; continue; }
      const property = names[name] || name;
      if (resolved == null || resolved === false) { if (property.startsWith('aria-')) props[property] = 'false'; continue; }
      if (property === 'style') props.style = cssStyle(String(resolved));
      else if (property.startsWith('aria-')) props[property] = typeof resolved === 'boolean' ? String(resolved) : resolved;
      else if (booleans.has(property)) props[property] = resolved !== 'false';
      else if (property === 'href') props.href = destination(String(resolved), values);
      else if (property === 'ref') { if (typeof resolved === 'function') props.ref = resolved; }
      else props[property] = resolved === true ? '' : resolved;
    }
    if (tag === 'header' && menu) props.className = `${props.className || ''} source-menu-open`;
    if (tag === 'a') props.onClick = () => setMenu(false);
    if (tag === 'input' && 'checked' in props) { props.defaultChecked = props.checked; delete props.checked; }
    if (['input', 'select', 'textarea'].includes(tag)) {
      if ('value' in props) { props.defaultValue = props.value; delete props.value; }
      if (!props.name) props.name = props.id || `field-${key}`;
    }
    if (tag === 'label' && source.slug === 'dx-logistics' && props.htmlFor && props.htmlFor !== 'lead-form') props.htmlFor = `section-demo-${props.htmlFor}`;
    if (source.slug === 'tx-cooperative' && attrs['data-target']) {
      props.onClick = () => setPanel(attrs['data-target'] || 'admin');
      props['aria-selected'] = panel === attrs['data-target'];
      props.className = panel === attrs['data-target'] ? 'active' : '';
      props.role = 'tab'; props['aria-controls'] = attrs['data-target'];
    }
    if (source.slug === 'tx-cooperative' && String(attrs.class || '').split(' ').includes('tab-panel')) {
      props.className = `tab-panel${panel === attrs.id ? ' active' : ''}`;
      props.role = 'tabpanel';
    }
    if (tag === 'button' && props['aria-selected'] !== undefined) {
      props.onKeyDown = keyboardTabs;
      props.tabIndex = props['aria-selected'] === true || props['aria-selected'] === 'true' ? 0 : -1;
      props.type = 'button';
    }
    if (header && tag === 'button' && String(attrs.class).split(' ').includes('menu')) {
      props.onClick = () => setMenu(!menu); props['aria-expanded'] = menu; props['aria-label'] = menu ? 'إغلاق القائمة' : 'فتح القائمة'; props['aria-controls'] = 'site-navigation';
    }
    const primaryNav = header && tag === 'nav';
    if (primaryNav) {
      props.id = 'site-navigation';
      props['aria-label'] = attrs['aria-label'] || 'التنقل الرئيسي';
      props.className = `${props.className || ''} source-primary-nav${menu ? ' open' : ''}`;
    }
    const current = Object.entries(source.links).find(([, href]) => href.split('#')[0] === `/${view}`)?.[1];
    if (header && tag === 'a') {
      const active = props.href === (view === 'home' ? '/' : current || `/${view}`);
      if (active) props['aria-current'] = 'page';
      if (source.slug === 'dx-logistics' && parent === 'nav') props.className = active ? 'active' : '';
    }
    let children = node.children.map((child, i) => render(child, values, `${key}-${i}`, svg && tag !== 'foreignObject', header, tag, extracted));
    if (['form-message', 'section-demo-form-note'].includes(String(attrs.id))) {
      if (notice) props.className = `${props.className || ''} show`;
      children = notice ? [notice] : [];
    }
    if (tag === 'form') {
      props.onSubmit = prepareRequest;
      if (source.template && notice) children.push(createElement('p', { key: 'request-status', role: 'status', style: { background: '#E6F5ED', color: '#116944', padding: '16px', borderRadius: '12px', fontSize: '14px' } }, notice));
    }
    const brand = header && tag === 'div' && String(attrs.class || '').split(' ').includes('brand');
    const internal = tag === 'a' && typeof props.href === 'string' && props.href.startsWith('/') && !props.href.startsWith('//');
    const element = brand ? createElement(Link, { ...props, href: '/' }, ...children) : internal ? createElement(Link, props as unknown as Parameters<typeof Link>[0], ...children) : createElement(tag, props, ...children);
    if (primaryNav && source.slug !== 'dx-logistics') return createElement(Fragment, { key }, createElement('button', { type: 'button', className: 'source-menu-toggle', 'aria-label': menu ? 'إغلاق القائمة' : 'فتح القائمة', 'aria-expanded': menu, 'aria-controls': 'site-navigation', onClick: () => setMenu(!menu) }, '☰'), element);
    return element;
  }
  return <>{source.nodes.map((node, index) => render(node, scope, String(index)))}</>;
}
