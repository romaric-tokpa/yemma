/**
 * CompanyJobFormTab — Redesign Yemma Solutions
 * Aesthetic: Luxury editorial SaaS — consistent with dashboard suite
 *
 * Features:
 * - Multi-step form with progress indicator
 * - Integrated rich text editor (no external dependency)
 * - Integrated searchable select
 * - Live preview panel
 * - Auto-save draft to localStorage
 * - Logo upload with preview
 * - Application mode selector (internal / URL / email)
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Briefcase, MapPin, Building2, Calendar, DollarSign, FileText,
  Upload, X, Check, ChevronRight, ChevronLeft, Eye,
  Globe, Mail, Users, Sparkles, Clock, AlertCircle, Image as ImageIcon,
  Bold, Italic, Underline, Strikethrough, List, ListOrdered, Link2, Type,
  Heading1, Heading2, Heading3, Quote, Minus, Undo2, Redo2, Eraser,
  ChevronDown, Search, Loader2, Trash2, ExternalLink, Share2, BadgeCheck, Layers
} from 'lucide-react'
import { candidateApi, documentApi } from '@/services/api'
import { SECTORS_FR } from '@/data/sectors'

/* ═══════════════════════════════════════════════════════════════════
STYLES
═══════════════════════════════════════════════════════════════════ */

const STYLES = `
.jf { font-family: 'DM Sans', system-ui, sans-serif; }
.jf-serif { font-family: 'DM Serif Display', Georgia, serif; }

.jf-card {
  background: white; border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.02);
}

.jf-input {
  width: 100%; height: 44px; padding: 0 16px;
  border-radius: 12px; border: 1.5px solid #E2E8F0;
  background: #F8F9FB; font-size: 13px; font-weight: 500;
  color: #1A2B3C; outline: none;
  font-family: 'DM Sans', system-ui, sans-serif;
  transition: all 0.2s ease;
}
.jf-input:focus {
  background: white; border-color: #0E7C7B;
  box-shadow: 0 0 0 3px rgba(14,124,123,0.08);
}
.jf-input::placeholder { color: #9CA3AF; font-weight: 400; }
.jf-input:disabled { opacity: 0.5; cursor: not-allowed; }

.jf-textarea {
  width: 100%; min-height: 100px; padding: 12px 16px;
  border-radius: 12px; border: 1.5px solid #E2E8F0;
  background: #F8F9FB; font-size: 13px; font-weight: 500;
  color: #1A2B3C; outline: none; resize: vertical;
  font-family: 'DM Sans', system-ui, sans-serif;
  line-height: 1.6; transition: all 0.2s ease;
}
.jf-textarea:focus {
  background: white; border-color: #0E7C7B;
  box-shadow: 0 0 0 3px rgba(14,124,123,0.08);
}
.jf-textarea::placeholder { color: #9CA3AF; font-weight: 400; }

.jf-label {
  display: block; font-size: 12px; font-weight: 700;
  color: #374151; margin-bottom: 6px;
  letter-spacing: 0.01em;
}
.jf-hint { font-size: 11px; color: #9CA3AF; margin-top: 4px; font-weight: 400; }

/* Rich text editor */
.jf-rte-wrapper { position: relative; }

.jf-rte-toolbar {
  display: flex; align-items: center; gap: 2px;
  padding: 6px 10px; border-bottom: 1px solid #E2E8F0;
  background: #FAFBFC; border-radius: 12px 12px 0 0;
  flex-wrap: wrap;
}
.jf-rte-group {
  display: flex; align-items: center; gap: 1px;
  padding: 0 4px;
  border-right: 1px solid #E8EBF0;
}
.jf-rte-group:last-child { border-right: none; }

.jf-rte-btn {
  width: 30px; height: 30px; border-radius: 6px;
  border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: #6B7280; transition: all 0.15s ease;
  font-family: 'DM Sans', system-ui, sans-serif;
}
.jf-rte-btn:hover { background: #E8F4F3; color: #0E7C7B; }
.jf-rte-btn[data-active="true"] {
  background: #0E7C7B; color: white;
  box-shadow: 0 1px 2px rgba(14,124,123,0.2);
}

.jf-rte-content {
  min-height: 200px; padding: 16px 18px; outline: none;
  font-size: 13px; line-height: 1.8; color: #1A2B3C;
  font-family: 'DM Sans', system-ui, sans-serif;
  background: white;
}
.jf-rte-content:focus { box-shadow: inset 0 0 0 2px rgba(14,124,123,0.06); }
.jf-rte-content:empty::before {
  content: attr(data-placeholder); color: #9CA3AF; font-weight: 400;
}

.jf-rte-content h1 { font-size: 22px; font-weight: 700; line-height: 1.3; margin: 16px 0 8px; color: #111827; }
.jf-rte-content h2 { font-size: 18px; font-weight: 700; line-height: 1.3; margin: 14px 0 6px; color: #1F2937; }
.jf-rte-content h3 { font-size: 15px; font-weight: 700; line-height: 1.4; margin: 12px 0 4px; color: #374151; }
.jf-rte-content p { margin: 6px 0; }
.jf-rte-content ul { padding-left: 24px; margin: 8px 0; list-style-type: disc; }
.jf-rte-content ol { padding-left: 24px; margin: 8px 0; list-style-type: decimal; }
.jf-rte-content ul ul { list-style-type: circle; }
.jf-rte-content ul ul ul { list-style-type: square; }
.jf-rte-content li { margin-bottom: 4px; display: list-item; }
.jf-rte-content a { color: #0E7C7B; text-decoration: underline; cursor: pointer; }
.jf-rte-content a:hover { color: #0A5E5D; }
.jf-rte-content blockquote {
  border-left: 3px solid #0E7C7B; margin: 12px 0; padding: 8px 16px;
  background: rgba(14,124,123,0.03); color: #4B5563;
  font-style: italic; border-radius: 0 8px 8px 0;
}
.jf-rte-content hr {
  border: none; height: 1px; margin: 16px 0;
  background: linear-gradient(to right, transparent, #D1D5DB, transparent);
}
.jf-rte-content strong, .jf-rte-content b { font-weight: 700; }
.jf-rte-content em, .jf-rte-content i { font-style: italic; }
.jf-rte-content u { text-decoration: underline; }
.jf-rte-content s, .jf-rte-content strike { text-decoration: line-through; color: #9CA3AF; }

.jf-rte-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 14px; background: #FAFBFC;
  border-top: 1px solid #E2E8F0;
  border-radius: 0 0 12px 12px;
}
.jf-rte-footer-text {
  font-size: 10px; color: #9CA3AF; font-weight: 500;
  font-family: 'DM Sans', system-ui, sans-serif;
}

/* Link modal */
.jf-link-modal-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,0.25); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
}
.jf-link-modal {
  background: white; border-radius: 16px; padding: 24px;
  width: 100%; max-width: 400px; margin: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06);
}

/* Preview — rich HTML content rendering */
.jf-preview-prose {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 14px; line-height: 1.8; color: #374151;
}
.jf-preview-prose h1 {
  font-size: 20px; font-weight: 700; line-height: 1.3;
  margin: 20px 0 8px; color: #111827;
  font-family: 'DM Serif Display', Georgia, serif;
}
.jf-preview-prose h2 {
  font-size: 17px; font-weight: 700; line-height: 1.35;
  margin: 18px 0 6px; color: #1F2937;
  font-family: 'DM Serif Display', Georgia, serif;
}
.jf-preview-prose h3 {
  font-size: 15px; font-weight: 700; line-height: 1.4;
  margin: 14px 0 4px; color: #374151;
}
.jf-preview-prose p { margin: 6px 0; }
.jf-preview-prose strong, .jf-preview-prose b { font-weight: 700; color: #1F2937; }
.jf-preview-prose em, .jf-preview-prose i { font-style: italic; }
.jf-preview-prose u { text-decoration: underline; text-underline-offset: 2px; }
.jf-preview-prose s, .jf-preview-prose strike { text-decoration: line-through; color: #9CA3AF; }
.jf-preview-prose ul { padding-left: 22px; margin: 10px 0; list-style-type: disc; }
.jf-preview-prose ol { padding-left: 22px; margin: 10px 0; list-style-type: decimal; }
.jf-preview-prose ul ul { list-style-type: circle; }
.jf-preview-prose li { margin-bottom: 4px; display: list-item; line-height: 1.7; }
.jf-preview-prose a {
  color: #0E7C7B; text-decoration: underline;
  text-underline-offset: 2px; font-weight: 500;
}
.jf-preview-prose a:hover { color: #0A5E5D; }
.jf-preview-prose blockquote {
  border-left: 3px solid #0E7C7B; margin: 14px 0; padding: 10px 18px;
  background: rgba(14,124,123,0.03); color: #4B5563;
  font-style: italic; border-radius: 0 10px 10px 0;
}
.jf-preview-prose hr {
  border: none; height: 1px; margin: 20px 0;
  background: linear-gradient(to right, transparent, #D1D5DB, transparent);
}
.jf-preview-prose br { content: ''; display: block; margin-top: 4px; }

/* Preview card */
.jf-preview-card {
  border-radius: 20px; overflow: hidden;
  border: 1px solid rgba(0,0,0,0.04);
  box-shadow: 0 4px 24px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02);
  background: white;
}
.jf-preview-header {
  position: relative; overflow: hidden;
}
.jf-preview-header::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%);
  pointer-events: none;
}
.jf-preview-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; border-radius: 10px;
  background: white; border: 1px solid #F0F0F0;
  font-size: 12px; font-weight: 600; color: #374151;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  transition: all 0.15s ease;
}
.jf-preview-badge:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.jf-preview-section {
  padding: 24px 28px; border-bottom: 1px solid #F3F4F6;
}
.jf-preview-section:last-child { border-bottom: none; }
.jf-preview-section-title {
  font-size: 11px; font-weight: 800; color: #0E7C7B;
  text-transform: uppercase; letter-spacing: 0.08em;
  margin-bottom: 14px; display: flex; align-items: center; gap: 8px;
}
.jf-preview-section-title::before {
  content: ''; width: 3px; height: 14px; border-radius: 2px;
  background: linear-gradient(to bottom, #0E7C7B, #F28C28);
}

/* Searchable select dropdown */
.jf-select-dropdown {
  position: absolute; top: 100%; left: 0; right: 0;
  margin-top: 4px; z-index: 50;
  background: white; border-radius: 12px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
  max-height: 220px; overflow-y: auto;
}
.jf-select-item {
  padding: 10px 14px; font-size: 13px; color: #374151;
  cursor: pointer; transition: background 0.12s ease;
  font-family: 'DM Sans', system-ui, sans-serif;
}
.jf-select-item:hover { background: #E8F4F3; color: #0E7C7B; }
.jf-select-item[data-active="true"] { background: #0E7C7B; color: white; font-weight: 600; }

/* Step progress */
.jf-step-line {
  height: 3px; border-radius: 2px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Radio cards */
.jf-radio-card {
  padding: 16px; border-radius: 12px; border: 2px solid #E2E8F0;
  cursor: pointer; transition: all 0.2s ease; text-align: left;
  background: white;
}
.jf-radio-card:hover { border-color: rgba(14,124,123,0.3); }
.jf-radio-card[data-active="true"] {
  border-color: #0E7C7B; background: #E8F4F3;
  box-shadow: 0 0 0 3px rgba(14,124,123,0.08);
}

/* Animations */
.jf-reveal { animation: jfReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
@keyframes jfReveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

.jf-scroll::-webkit-scrollbar { width: 4px; }
.jf-scroll::-webkit-scrollbar-track { background: transparent; }
.jf-scroll::-webkit-scrollbar-thumb { background: rgba(14,124,123,0.1); border-radius: 10px; }

/* Logo upload */
.jf-logo-zone {
  border: 2px dashed #E2E8F0; border-radius: 14px;
  transition: all 0.2s ease; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.jf-logo-zone:hover { border-color: #0E7C7B; background: #E8F4F3; }
.jf-logo-zone[data-drag="true"] { border-color: #F28C28; background: #FFF8F0; }
`

/* ═══════════════════════════════════════════════════════════════════
CONSTANTS
═══════════════════════════════════════════════════════════════════ */

const CONTRACT_TYPES = [
  { value: 'CDI', label: 'CDI — Contrat à Durée Indéterminée' },
  { value: 'CDD', label: 'CDD — Contrat à Durée Déterminée' },
  { value: 'STAGE', label: 'Stage' },
  { value: 'FREELANCE', label: 'Freelance / Mission' },
  { value: 'ALTERNANCE', label: 'Alternance' },
  { value: 'TEMPS_PARTIEL', label: 'Temps partiel' },
  { value: 'TEMPORAIRE', label: 'Intérim / Temporaire' },
]

const STEPS = [
  { id: 'info', label: 'Informations', icon: FileText },
  { id: 'details', label: 'Détails du poste', icon: Briefcase },
  { id: 'apply', label: 'Candidature', icon: Users },
  { id: 'preview', label: 'Aperçu', icon: Eye },
]

const APPLICATION_MODES = [
  { value: 'internal', label: 'Via Yemma Solutions', desc: 'Les candidats postulent directement sur la plateforme', icon: Sparkles },
  { value: 'external_url', label: 'URL externe', desc: 'Rediriger vers votre site carrière ou ATS', icon: Globe },
  { value: 'email', label: 'Par email', desc: 'Recevoir les candidatures par email', icon: Mail },
]

const DRAFT_KEY = 'yemma_job_draft'

/* ═══════════════════════════════════════════════════════════════════
SUB-COMPONENTS
═══════════════════════════════════════════════════════════════════ */

/* ─── Rich Text Editor ─────────────────────────────────────────── */

function RichEditor({ value, onChange, placeholder = 'Décrivez le poste…', maxLength }) {
  const editorRef = useRef(null)
  const isInternalChange = useRef(false)
  const [activeFormats, setActiveFormats] = useState({})
  const [charCount, setCharCount] = useState(0)
  const [linkModal, setLinkModal] = useState({ open: false, url: '', text: '' })

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || ''
      }
    }
    isInternalChange.current = false
  }, [value])

  const updateCharCount = useCallback(() => {
    const text = editorRef.current?.innerText || ''
    setCharCount(text.replace(/\n/g, '').length)
  }, [])

  const syncActiveFormats = useCallback(() => {
    const formats = {}
    try {
      formats.bold = document.queryCommandState('bold')
      formats.italic = document.queryCommandState('italic')
      formats.underline = document.queryCommandState('underline')
      formats.strikeThrough = document.queryCommandState('strikeThrough')
      formats.insertUnorderedList = document.queryCommandState('insertUnorderedList')
      formats.insertOrderedList = document.queryCommandState('insertOrderedList')

      const block = document.queryCommandValue('formatBlock')
      formats.h1 = block === 'h1'
      formats.h2 = block === 'h2'
      formats.h3 = block === 'h3'
      formats.blockquote = block === 'blockquote'
    } catch {}
    setActiveFormats(formats)
  }, [])

  const handleInput = useCallback(() => {
    isInternalChange.current = true
    onChange(editorRef.current?.innerHTML || '')
    updateCharCount()
    syncActiveFormats()
  }, [onChange, updateCharCount, syncActiveFormats])

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    handleInput()
  }, [handleInput])

  const formatBlock = useCallback((tag) => {
    const current = document.queryCommandValue('formatBlock')
    if (current === tag) {
      document.execCommand('formatBlock', false, 'p')
    } else {
      document.execCommand('formatBlock', false, tag)
    }
    editorRef.current?.focus()
    handleInput()
  }, [handleInput])

  const handleKeyDown = useCallback((e) => {
    const mod = e.ctrlKey || e.metaKey
    if (!mod) return

    const keyMap = {
      'b': 'bold',
      'i': 'italic',
      'u': 'underline',
      'z': e.shiftKey ? 'redo' : 'undo',
      'y': 'redo',
    }

    const cmd = keyMap[e.key.toLowerCase()]
    if (cmd) {
      e.preventDefault()
      exec(cmd)
    }
  }, [exec])

  const handleSelectionChange = useCallback(() => {
    if (!editorRef.current) return
    const sel = window.getSelection()
    if (sel && editorRef.current.contains(sel.anchorNode)) {
      syncActiveFormats()
    }
  }, [syncActiveFormats])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [handleSelectionChange])

  useEffect(() => { updateCharCount() }, [value, updateCharCount])

  const handlePaste = useCallback((e) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')

    if (html) {
      const temp = document.createElement('div')
      temp.innerHTML = html
      temp.querySelectorAll('script, style, meta, link, iframe').forEach(el => el.remove())
      temp.querySelectorAll('*').forEach(el => {
        el.removeAttribute('style')
        el.removeAttribute('class')
        el.removeAttribute('id')
      })
      document.execCommand('insertHTML', false, temp.innerHTML)
    } else {
      document.execCommand('insertText', false, text)
    }
    handleInput()
  }, [handleInput])

  const insertLink = useCallback(() => {
    const sel = window.getSelection()
    const selectedText = sel?.toString() || ''
    setLinkModal({ open: true, url: '', text: selectedText })
  }, [])

  const confirmLink = useCallback(() => {
    if (!linkModal.url.trim()) { setLinkModal({ open: false, url: '', text: '' }); return }
    editorRef.current?.focus()

    let url = linkModal.url.trim()
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url

    if (linkModal.text.trim()) {
      document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkModal.text}</a>`)
    } else {
      document.execCommand('createLink', false, url)
      const sel = window.getSelection()
      if (sel?.anchorNode?.parentElement?.tagName === 'A') {
        sel.anchorNode.parentElement.setAttribute('target', '_blank')
        sel.anchorNode.parentElement.setAttribute('rel', 'noopener noreferrer')
      }
    }
    setLinkModal({ open: false, url: '', text: '' })
    handleInput()
  }, [linkModal, handleInput])

  const toolbarGroups = [
    [
      { action: () => formatBlock('h1'), icon: Heading1, title: 'Titre 1 (H1)', activeKey: 'h1' },
      { action: () => formatBlock('h2'), icon: Heading2, title: 'Titre 2 (H2)', activeKey: 'h2' },
      { action: () => formatBlock('h3'), icon: Heading3, title: 'Titre 3 (H3)', activeKey: 'h3' },
    ],
    [
      { cmd: 'bold', icon: Bold, title: 'Gras (Ctrl+B)', activeKey: 'bold' },
      { cmd: 'italic', icon: Italic, title: 'Italique (Ctrl+I)', activeKey: 'italic' },
      { cmd: 'underline', icon: Underline, title: 'Souligné (Ctrl+U)', activeKey: 'underline' },
      { cmd: 'strikeThrough', icon: Strikethrough, title: 'Barré', activeKey: 'strikeThrough' },
    ],
    [
      { cmd: 'insertUnorderedList', icon: List, title: 'Liste à puces', activeKey: 'insertUnorderedList' },
      { cmd: 'insertOrderedList', icon: ListOrdered, title: 'Liste numérotée', activeKey: 'insertOrderedList' },
      { action: () => formatBlock('blockquote'), icon: Quote, title: 'Citation', activeKey: 'blockquote' },
      { cmd: 'insertHorizontalRule', icon: Minus, title: 'Séparateur' },
    ],
    [
      { action: insertLink, icon: Link2, title: 'Insérer un lien' },
    ],
    [
      { cmd: 'undo', icon: Undo2, title: 'Annuler (Ctrl+Z)' },
      { cmd: 'redo', icon: Redo2, title: 'Rétablir (Ctrl+Y)' },
      { cmd: 'removeFormat', icon: Eraser, title: 'Nettoyer la mise en forme' },
    ],
  ]

  return (
    <div className="jf-rte-wrapper rounded-xl border-[1.5px] border-[#E2E8F0] overflow-hidden focus-within:border-[#0E7C7B] focus-within:shadow-[0_0_0_3px_rgba(14,124,123,0.08)] transition-all">
      <div className="jf-rte-toolbar">
        {toolbarGroups.map((group, gi) => (
          <div key={gi} className="jf-rte-group">
            {group.map((btn, bi) => (
              <button
                key={bi}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  btn.action ? btn.action() : exec(btn.cmd)
                }}
                className="jf-rte-btn"
                data-active={btn.activeKey ? !!activeFormats[btn.activeKey] : false}
                title={btn.title}
              >
                <btn.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ))}
      </div>

      <div
        ref={editorRef}
        className="jf-rte-content jf-scroll"
        contentEditable
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        suppressContentEditableWarning
      />

      <div className="jf-rte-footer">
        <span className="jf-rte-footer-text">
          {charCount} caractère{charCount !== 1 ? 's' : ''}
          {maxLength ? ` / ${maxLength}` : ''}
        </span>
        <span className="jf-rte-footer-text">Ctrl+B Gras · Ctrl+I Italique · Ctrl+U Souligné</span>
      </div>

      {linkModal.open && (
        <div className="jf-link-modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setLinkModal({ open: false, url: '', text: '' }) }}>
          <div className="jf-link-modal jf-reveal">
            <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#0E7C7B]" />
              Insérer un lien
            </h4>
            <div className="space-y-3">
              <div>
                <label className="jf-label">Texte affiché</label>
                <input
                  className="jf-input"
                  value={linkModal.text}
                  onChange={(e) => setLinkModal(p => ({ ...p, text: e.target.value }))}
                  placeholder="Ex: Voir notre site"
                  autoFocus
                />
              </div>
              <div>
                <label className="jf-label">URL</label>
                <input
                  className="jf-input"
                  value={linkModal.url}
                  onChange={(e) => setLinkModal(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://example.com"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmLink() } }}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setLinkModal({ open: false, url: '', text: '' })}
                className="h-9 px-4 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition-all"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmLink}
                className="h-9 px-5 rounded-lg text-xs font-bold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #0E7C7B, #0A5E5D)' }}
              >
                Insérer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Searchable Select ────────────────────────────────────────── */

function SearchSelect({ options, value, onChange, placeholder = 'Sélectionner…' }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter(o => {
      const label = typeof o === 'string' ? o : o.label
      return label.toLowerCase().includes(q)
    })
  }, [options, search])

  const displayValue = useMemo(() => {
    if (!value) return ''
    const opt = options.find(o => (typeof o === 'string' ? o : o.value) === value)
    return opt ? (typeof opt === 'string' ? opt : opt.label) : value
  }, [options, value])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="jf-input flex items-center justify-between gap-2 text-left cursor-pointer"
        style={{ paddingRight: '12px' }}
      >
        <span className={value ? 'text-[#1A2B3C] font-medium' : 'text-[#9CA3AF] font-normal'}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="jf-select-dropdown jf-scroll">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-300" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full h-8 pl-8 pr-3 rounded-lg border border-gray-100 bg-[#F8F9FB] text-xs outline-none focus:border-[#0E7C7B]"
                autoFocus
              />
            </div>
          </div>
          <div className="py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400 text-center">Aucun résultat</p>
            ) : (
              filtered.map((opt) => {
                const val = typeof opt === 'string' ? opt : opt.value
                const label = typeof opt === 'string' ? opt : opt.label
                const active = val === value
                return (
                  <div
                    key={val}
                    className="jf-select-item"
                    data-active={active}
                    onClick={() => { onChange(val); setOpen(false); setSearch('') }}
                  >
                    {label}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Logo Upload ──────────────────────────────────────────────── */

function LogoUpload({ logoFile, logoPreview, onLogoChange, onLogoRemove }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    const valid = ['image/jpeg', 'image/png', 'image/webp']
    if (!valid.includes(file.type)) { alert('Format accepté : JPG, PNG ou WebP'); return }
    if (file.size > 2 * 1024 * 1024) { alert('Taille max : 2 Mo'); return }
    onLogoChange(file)
  }

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  if (logoPreview) {
    return (
      <div className="flex items-center gap-4">
        <div className="relative group">
          <img src={logoPreview} alt="Logo" className="w-20 h-20 rounded-xl object-cover ring-2 ring-gray-100 shadow-sm" />
          <button
            type="button"
            onClick={onLogoRemove}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-700">{logoFile?.name || 'Logo entreprise'}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{logoFile ? `${(logoFile.size / 1024).toFixed(0)} Ko` : ''}</p>
          <button type="button" onClick={() => inputRef.current?.click()} className="text-[11px] font-semibold text-[#0E7C7B] hover:underline mt-1">
            Changer
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>
    )
  }

  return (
    <div>
      <div
        className="jf-logo-zone h-28"
        data-drag={dragging}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <ImageIcon className="h-6 w-6 text-gray-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-500">Glissez un logo ou <span className="text-[#0E7C7B]">parcourez</span></p>
          <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WebP · Max 2 Mo</p>
        </div>
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
    </div>
  )
}

/* ─── Field Wrapper ────────────────────────────────────────────── */

function Field({ label, hint, error, required, children }) {
  return (
    <div>
      <label className="jf-label">
        {label} {required && <span className="text-[#F28C28]">*</span>}
      </label>
      {children}
      {hint && !error && <p className="jf-hint">{hint}</p>}
      {error && (
        <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1 font-medium">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  )
}

/* ─── Step Progress ────────────────────────────────────────────── */

function StepProgress({ steps, current, onStepClick, completedSteps }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => {
        const Icon = step.icon
        const isCurrent = i === current
        const isCompleted = completedSteps.includes(step.id)
        const isClickable = i <= current || isCompleted

        return (
          <div key={step.id} className="flex items-center gap-1 flex-1">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(i)}
              disabled={!isClickable}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isCurrent
                  ? 'bg-gradient-to-r from-[#0E7C7B] to-[#0A5E5D] text-white shadow-sm shadow-[#0E7C7B]/15'
                  : isCompleted
                    ? 'bg-[#E8F4F3] text-[#0E7C7B]'
                    : 'text-gray-400 hover:text-gray-600'
              } ${isClickable ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                isCurrent ? 'bg-white/15' : isCompleted ? 'bg-[#0E7C7B]/10' : 'bg-gray-100'
              }`}>
                {isCompleted && !isCurrent ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
              </span>
              <span className="hidden sm:inline">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 rounded-full mx-1 hidden sm:block">
                <div className={`jf-step-line h-full ${isCompleted || i < current ? 'bg-[#0E7C7B]' : 'bg-gray-200'}`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */

export function CompanyJobFormTab({ companyId, company, jobId, basePath = '/company/dashboard/jobs' }) {
  const navigate = useNavigate()
  const isEditing = !!jobId

  /* ─── Form State ─── */
  const [form, setForm] = useState({
    title: '',
    company_name: company?.name || '',
    description: '',
    requirements: '',
    location: '',
    contract_type: 'CDI',
    sector: '',
    salary_min: '',
    salary_max: '',
    expiration_date: '',
    application_mode: 'internal',
    external_url: '',
    application_email: '',
    company_logo_url: '',
  })

  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [draftSaved, setDraftSaved] = useState(false)
  const [loadingJob, setLoadingJob] = useState(false)
  const [jobStatus, setJobStatus] = useState(null)

  /* ─── Sync company name/logo on mount ─── */
  useEffect(() => {
    if (company && !isEditing) {
      setForm(prev => ({
        ...prev,
        company_name: company.name || '',
        company_logo_url: documentApi.normalizeLogoUrl?.(company.logo_url) || '',
      }))
      if (company.logo_url) {
        setLogoPreview(documentApi.normalizeLogoUrl?.(company.logo_url) || company.logo_url)
      }
    }
  }, [company, isEditing])

  /* ─── Load existing job for edit ─── */
  useEffect(() => {
    if (isEditing && companyId && jobId) {
      setLoadingJob(true)
      candidateApi.companyGetJob(companyId, parseInt(jobId, 10))
        .then((job) => {
          setJobStatus(job?.status)
          const appMode = job.external_application_url ? 'external_url' : job.application_email ? 'email' : 'internal'
          let salaryMin = ''
          let salaryMax = ''
          if (job.salary_range) {
            const parts = job.salary_range.match(/(\d+)\s*[-–]\s*(\d+)/)
            if (parts) {
              salaryMin = parts[1]
              salaryMax = parts[2]
            }
          }
          setForm({
            title: job.title || '',
            company_name: job.company_name || company?.name || '',
            description: job.description || '',
            requirements: job.requirements || '',
            location: job.location || '',
            contract_type: job.contract_type || 'CDI',
            sector: job.sector || '',
            salary_min: salaryMin,
            salary_max: salaryMax,
            expiration_date: job.expires_at ? job.expires_at.slice(0, 10) : '',
            application_mode: appMode,
            external_url: job.external_application_url || '',
            application_email: job.application_email || '',
            company_logo_url: documentApi.normalizeLogoUrl?.(job.company_logo_url || company?.logo_url) || '',
          })
          if (job.company_logo_url) {
            setLogoPreview(documentApi.normalizeLogoUrl?.(job.company_logo_url) || job.company_logo_url)
          }
        })
        .catch(() => {
          navigate(basePath)
        })
        .finally(() => setLoadingJob(false))
    }
  }, [isEditing, jobId, companyId, company, navigate, basePath])

  /* ─── Load draft ─── */
  useEffect(() => {
    if (!isEditing && companyId) {
      try {
        const draft = localStorage.getItem(DRAFT_KEY)
        if (draft) {
          const parsed = JSON.parse(draft)
          if (parsed.companyId === companyId && parsed.form) {
            setForm(prev => ({ ...prev, ...parsed.form }))
          }
        }
      } catch {}
    }
  }, [isEditing, companyId])

  /* ─── Auto-save draft ─── */
  useEffect(() => {
    if (isEditing) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ companyId, form }))
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 2000)
      } catch {}
    }, 2000)
    return () => clearTimeout(t)
  }, [form, companyId, isEditing])

  /* ─── Logo handling ─── */
  const handleLogoChange = (file) => {
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleLogoRemove = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setForm(prev => ({ ...prev, company_logo_url: '' }))
  }

  /* ─── Update form ─── */
  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  /* ─── Validation ─── */
  const validateStep = (stepIdx) => {
    const errs = {}
    if (stepIdx === 0) {
      if (!form.title.trim()) errs.title = 'Le titre est requis'
      if (!form.company_name.trim()) errs.company_name = "Le nom de l'entreprise est requis"
      if (!form.location.trim()) errs.location = 'La localisation est requise'
      if (!form.contract_type) errs.contract_type = 'Le type de contrat est requis'
    }
    if (stepIdx === 1) {
      if (!form.description.trim() || form.description === '<br>') errs.description = 'La description est requise'
    }
    if (stepIdx === 2) {
      if (form.application_mode === 'external_url' && !form.external_url.trim()) errs.external_url = "L'URL est requise"
      if (form.application_mode === 'email' && !form.application_email.trim()) errs.application_email = "L'email est requis"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const completedSteps = useMemo(() => {
    const completed = []
    if (form.title && form.company_name && form.location && form.contract_type) completed.push('info')
    if (form.description && form.description !== '<br>') completed.push('details')
    if (form.application_mode === 'internal' || (form.application_mode === 'external_url' && form.external_url) || (form.application_mode === 'email' && form.application_email)) completed.push('apply')
    return completed
  }, [form])

  /* ─── Navigation ─── */
  const nextStep = () => {
    if (validateStep(step)) setStep(Math.min(step + 1, STEPS.length - 1))
  }

  const prevStep = () => setStep(Math.max(step - 1, 0))

  /* ─── Build salary_range for API ─── */
  const buildSalaryRange = () => {
    const min = form.salary_min?.trim()
    const max = form.salary_max?.trim()
    if (!min && !max) return null
    if (min && max) return `${min} - ${max} FCFA/mois`
    if (min) return `À partir de ${min} FCFA/mois`
    return `Jusqu'à ${max} FCFA/mois`
  }

  /* ─── Submit ─── */
  const handleSubmit = async () => {
    for (let i = 0; i < 3; i++) {
      if (!validateStep(i)) { setStep(i); return }
    }

    setSubmitting(true)
    setErrors(prev => ({ ...prev, submit: undefined }))
    try {
      let companyLogoUrl = form.company_logo_url || null
      if (logoFile) {
        const res = await documentApi.uploadJobOfferLogo(logoFile)
        companyLogoUrl = res?.url || null
      } else if (logoPreview && !logoPreview.startsWith('data:')) {
        companyLogoUrl = logoPreview
      }

      const payload = {
        title: form.title.trim(),
        company_name: form.company_name.trim(),
        description: form.description,
        requirements: form.requirements?.trim() || null,
        location: form.location.trim(),
        contract_type: form.contract_type,
        sector: form.sector?.trim() || null,
        salary_range: buildSalaryRange(),
        expires_at: form.expiration_date ? `${form.expiration_date}T23:59:59` : null,
        company_logo_url: companyLogoUrl,
        external_application_url: form.application_mode === 'external_url' ? form.external_url.trim() || null : null,
        application_email: form.application_mode === 'email' ? form.application_email.trim() || null : null,
      }

      if (isEditing) {
        await candidateApi.companyUpdateJob(companyId, parseInt(jobId, 10), payload)
      } else {
        await candidateApi.companyCreateJob(companyId, payload)
        localStorage.removeItem(DRAFT_KEY)
      }

      navigate(basePath)
    } catch (e) {
      console.error('Submit error:', e)
      const detail = e.response?.data?.detail
      setErrors(prev => ({ ...prev, submit: (typeof detail === 'string' ? detail : 'Erreur lors de la création. Veuillez réessayer.') || 'Erreur' }))
    } finally {
      setSubmitting(false)
    }
  }

  /* ─── Clear draft ─── */
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY)
    setForm({
      title: '', company_name: company?.name || '', description: '', requirements: '',
      location: '', contract_type: '', sector: '', salary_min: '', salary_max: '',
      expiration_date: '', application_mode: 'internal', external_url: '', application_email: '',
      company_logo_url: documentApi.normalizeLogoUrl?.(company?.logo_url) || '',
    })
    setLogoFile(null)
    setLogoPreview(company?.logo_url ? documentApi.normalizeLogoUrl?.(company.logo_url) : null)
    setStep(0)
  }

  if (loadingJob) {
    return (
      <div className="jf flex items-center justify-center py-24">
        <style>{STYLES}</style>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0E7C7B] mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Chargement de l'offre…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="jf">
      <style>{STYLES}</style>

      {/* ═══ HEADER ═══ */}
      <div className="jf-reveal mb-6">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate(basePath)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#0E7C7B] hover:bg-[#E8F4F3] transition-all shrink-0"
            >
        <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <h1 className="jf-serif text-xl sm:text-2xl text-gray-800 leading-tight truncate">
                {isEditing ? "Modifier l'offre" : "Nouvelle offre d'emploi"}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {isEditing ? "Mettez à jour les informations de cette offre" : "Publiez une offre et recevez des candidatures qualifiées"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {draftSaved && (
              <span className="text-[10px] font-semibold text-[#10B981] flex items-center gap-1">
                <Check className="h-3 w-3" /> Brouillon sauvé
              </span>
            )}
            {!isEditing && (
              <button type="button" onClick={clearDraft} className="text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1">
                <Trash2 className="h-3 w-3" /> Vider
              </button>
            )}
          </div>
        </div>

      {(jobStatus === 'ARCHIVED' || jobStatus === 'CLOSED') && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-800">
            Cette offre est {jobStatus === 'ARCHIVED' ? 'archivée (expirée)' : 'fermée'}. Pour la republier, utilisez le bouton <strong>Reconduire</strong> dans la liste des offres.
          </p>
        </div>
      )}

        <StepProgress steps={STEPS} current={step} onStepClick={setStep} completedSteps={completedSteps} />
        </div>

      {/* ═══ FORM BODY ═══ */}
      <div className="jf-card p-6 sm:p-8 jf-reveal" style={{ animationDelay: '0.05s' }}>
        {/* ─── STEP 0: Informations ─── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Informations générales</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Titre du poste" required error={errors.title} hint="Ex: Développeur Full-Stack Senior">
                <input className="jf-input" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Titre du poste" />
              </Field>

              <Field label="Nom de l'entreprise" required error={errors.company_name}>
                <input className="jf-input" value={form.company_name} onChange={(e) => updateField('company_name', e.target.value)} placeholder="Nom affiché sur l'offre" />
              </Field>

              <Field label="Localisation" required error={errors.location} hint="Ville ou région">
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input className="jf-input" style={{ paddingLeft: '42px' }} value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder="Ex: Abidjan, Côte d'Ivoire" />
            </div>
              </Field>

              <Field label="Type de contrat" required error={errors.contract_type}>
                <SearchSelect options={CONTRACT_TYPES} value={form.contract_type} onChange={(v) => updateField('contract_type', v)} placeholder="Sélectionner le type…" />
              </Field>

              <Field label="Secteur d'activité" hint="Facultatif — aide au classement">
                <SearchSelect options={SECTORS_FR} value={form.sector} onChange={(v) => updateField('sector', v)} placeholder="Choisir un secteur…" />
              </Field>

              <Field label="Date d'expiration" hint="Facultatif — l'offre sera retirée automatiquement">
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input type="date" className="jf-input" style={{ paddingLeft: '42px' }} value={form.expiration_date} onChange={(e) => updateField('expiration_date', e.target.value)} />
              </div>
              </Field>
            </div>

            <div>
              <label className="jf-label">Fourchette salariale <span className="text-gray-400 font-normal">(FCFA / mois)</span></label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input type="number" className="jf-input" style={{ paddingLeft: '42px' }} value={form.salary_min} onChange={(e) => updateField('salary_min', e.target.value)} placeholder="Min" />
            </div>
                <span className="text-gray-300 text-sm font-medium">—</span>
                <div className="relative flex-1">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input type="number" className="jf-input" style={{ paddingLeft: '42px' }} value={form.salary_max} onChange={(e) => updateField('salary_max', e.target.value)} placeholder="Max" />
                </div>
              </div>
              <p className="jf-hint">Facultatif — une fourchette transparente attire plus de candidats</p>
          </div>

            <Field label="Logo de l'entreprise" hint="Facultatif — améliore la visibilité de l'offre">
              <LogoUpload logoFile={logoFile} logoPreview={logoPreview} onLogoChange={handleLogoChange} onLogoRemove={handleLogoRemove} />
            </Field>
              </div>
        )}

        {/* ─── STEP 1: Détails du poste ─── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Description du poste</h2>
              </div>

            <Field label="Description complète" required error={errors.description} hint="Décrivez les missions, responsabilités et le contexte du poste">
              <RichEditor value={form.description} onChange={(v) => updateField('description', v)} placeholder="Décrivez le poste, les missions principales, le contexte de l'équipe…" />
            </Field>

            <Field label="Prérequis et qualifications" hint="Compétences, diplômes, expérience minimale attendue">
              <RichEditor value={form.requirements} onChange={(v) => updateField('requirements', v)} placeholder="Listez les compétences requises, l'expérience attendue, les diplômes…" />
            </Field>
                </div>
        )}

        {/* ─── STEP 2: Mode de candidature ─── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Mode de candidature</h2>
              </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Choisissez comment les candidats pourront postuler à cette offre. Vous pouvez gérer les candidatures directement sur Yemma, rediriger vers votre ATS, ou recevoir les CV par email.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {APPLICATION_MODES.map((mode) => {
                const Icon = mode.icon
                const active = form.application_mode === mode.value
                return (
                  <button
                    key={mode.value}
                    type="button"
                    className="jf-radio-card"
                    data-active={active}
                    onClick={() => updateField('application_mode', mode.value)}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-all ${
                      active ? 'bg-gradient-to-br from-[#0E7C7B] to-[#0A5E5D] shadow-sm shadow-[#0E7C7B]/15' : 'bg-[#F8F9FB]'
                    }`}>
                      <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-400'}`} />
              </div>
                    <p className={`text-sm font-bold ${active ? 'text-[#0E7C7B]' : 'text-gray-700'}`}>{mode.label}</p>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{mode.desc}</p>
                    {active && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[#0E7C7B]">
                        <Check className="h-3 w-3" /> Sélectionné
              </div>
                    )}
                  </button>
                )
              })}
            </div>

            {form.application_mode === 'external_url' && (
              <Field label="URL de candidature" required error={errors.external_url} hint="Lien vers votre site carrière ou ATS">
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input className="jf-input" style={{ paddingLeft: '42px' }} value={form.external_url} onChange={(e) => updateField('external_url', e.target.value)} placeholder="https://careers.votre-entreprise.com/offre" />
          </div>
              </Field>
            )}

            {form.application_mode === 'email' && (
              <Field label="Email de réception" required error={errors.application_email} hint="Les CV seront envoyés à cette adresse">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <input type="email" className="jf-input" style={{ paddingLeft: '42px' }} value={form.application_email} onChange={(e) => updateField('application_email', e.target.value)} placeholder="recrutement@votre-entreprise.com" />
                </div>
              </Field>
            )}
          </div>
        )}

        {/* ─── STEP 3: Preview ─── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#0E7C7B] to-[#F28C28]" />
                <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Aperçu de l'offre</h2>
                    </div>
              <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full flex items-center gap-1">
                <Eye className="h-3 w-3" /> Prévisualisation
              </span>
                  </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Voici à quoi ressemblera votre offre telle que publiée sur la plateforme. Vérifiez que le contenu et le formatage sont corrects.
            </p>

            <div className="jf-preview-card">
              {/* ── Header ── */}
              <div className="jf-preview-header" style={{ background: 'linear-gradient(135deg, #0A4F4E 0%, #0E7C7B 40%, #12908F 100%)' }}>
                <div className="px-7 pt-8 pb-7">
                  <div className="flex items-start gap-5">
                    {logoPreview ? (
                      <img src={logoPreview} alt="" className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white/20 shadow-xl shrink-0" />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 ring-1 ring-white/10">
                        <Building2 className="h-7 w-7 text-white/50" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="jf-serif text-2xl text-white font-bold leading-tight">
                        {form.title || 'Titre du poste'}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-white/80 text-sm font-medium">{form.company_name || 'Entreprise'}</span>
                        <BadgeCheck className="h-4 w-4 text-emerald-300/80" />
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        {form.location && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white/90 text-[11px] font-semibold">
                            <MapPin className="h-3 w-3" /> {form.location}
                          </span>
                        )}
                        {form.contract_type && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white/90 text-[11px] font-semibold">
                            <Briefcase className="h-3 w-3" /> {CONTRACT_TYPES.find(c => c.value === form.contract_type)?.label?.split(' — ')[0] || form.contract_type}
                          </span>
                        )}
                        {form.sector && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm text-white/90 text-[11px] font-semibold">
                            <Layers className="h-3 w-3" /> {form.sector}
                          </span>
                        )}
                      </div>
                    </div>
              </div>
            </div>
          </div>

              {/* ── Info badges ── */}
              <div className="px-7 py-5 bg-[#FAFBFC] border-b border-gray-100">
                <div className="flex flex-wrap gap-2.5">
                  {(form.salary_min || form.salary_max) && (
                    <div className="jf-preview-badge">
                      <DollarSign className="h-3.5 w-3.5 text-[#F28C28]" />
                      <span>
                        {form.salary_min && form.salary_max
                          ? `${Number(form.salary_min).toLocaleString('fr-FR')} — ${Number(form.salary_max).toLocaleString('fr-FR')} FCFA/mois`
                          : form.salary_min
                            ? `À partir de ${Number(form.salary_min).toLocaleString('fr-FR')} FCFA/mois`
                            : `Jusqu'à ${Number(form.salary_max).toLocaleString('fr-FR')} FCFA/mois`}
                      </span>
            </div>
                  )}
                  {form.expiration_date && (
                    <div className="jf-preview-badge">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>Expire le {new Date(form.expiration_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
                  {(() => {
                    const mode = APPLICATION_MODES.find(m => m.value === form.application_mode)
                    const ModeIcon = mode?.icon
                    return (
                      <div className="jf-preview-badge">
                        {ModeIcon && <ModeIcon className="h-3.5 w-3.5 text-[#0E7C7B]" />}
                        <span>{mode?.label}</span>
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* ── Description ── */}
              {form.description && form.description !== '<br>' && (
                <div className="jf-preview-section">
                  <div className="jf-preview-section-title">Description du poste</div>
                  <div className="jf-preview-prose" dangerouslySetInnerHTML={{ __html: form.description }} />
              </div>
            )}

              {/* ── Prérequis ── */}
              {form.requirements && form.requirements !== '<br>' && (
                <div className="jf-preview-section">
                  <div className="jf-preview-section-title">Prérequis & qualifications</div>
                  <div className="jf-preview-prose" dangerouslySetInnerHTML={{ __html: form.requirements }} />
          </div>
              )}

              {/* ── Mode de candidature ── */}
              <div className="jf-preview-section bg-[#FAFBFC]">
                <div className="jf-preview-section-title">Candidature</div>
                {form.application_mode === 'internal' && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white border border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Postuler via Yemma Solutions</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">Les candidats postulent directement depuis la plateforme</p>
                    </div>
                  </div>
                )}
                {form.application_mode === 'external_url' && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white border border-gray-100">
                    <ExternalLink className="h-4 w-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700">Candidature externe</p>
                      <p className="text-[11px] text-[#0E7C7B] mt-0.5 truncate font-medium">{form.external_url || '—'}</p>
                    </div>
                  </div>
                )}
                {form.application_mode === 'email' && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-white border border-gray-100">
                    <Mail className="h-4 w-4 text-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-700">Candidature par email</p>
                      <p className="text-[11px] text-[#0E7C7B] mt-0.5 truncate font-medium">{form.application_email || '—'}</p>
                    </div>
                  </div>
                )}
      </div>

              {/* ── Footer ── */}
              <div className="px-7 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="font-semibold">Offre active</span>
                  <span>·</span>
                  <span>Publiée le {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-[#0E7C7B] hover:bg-[#E8F4F3] transition-all" title="Partager">
                    <Share2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Empty state warning */}
            {(!form.description || form.description === '<br>') && (!form.requirements || form.requirements === '<br>') && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/60 border border-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-700">Contenu manquant</p>
                  <p className="text-[11px] text-amber-600 mt-0.5 leading-relaxed">La description et les prérequis sont vides. Retournez à l'étape 2 pour compléter le contenu de l'offre.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {errors.submit && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-600 font-medium">{errors.submit}</p>
          </div>
        )}

        {/* ═══ FOOTER ACTIONS ═══ */}
        <div className="flex items-center justify-between gap-3 mt-8 pt-6 border-t border-gray-100">
          <div>
            {step > 0 ? (
              <button type="button" onClick={prevStep} className="h-10 px-5 rounded-xl text-xs font-semibold text-gray-500 hover:text-[#0E7C7B] hover:bg-[#E8F4F3] flex items-center gap-2 transition-all">
                <ChevronLeft className="h-4 w-4" /> Précédent
              </button>
            ) : (
              <button type="button" onClick={() => navigate(basePath)} className="h-10 px-5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 flex items-center gap-2 transition-all">
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={nextStep} className="h-10 px-6 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-sm shadow-[#0E7C7B]/15 hover:shadow-[#0E7C7B]/25 hover:translate-y-[-1px] transition-all" style={{ background: 'linear-gradient(135deg, #0E7C7B, #0A5E5D)' }}>
                Suivant <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="h-11 px-7 rounded-xl text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-[#F28C28]/20 hover:shadow-[#F28C28]/30 hover:translate-y-[-1px] transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                style={{ background: 'linear-gradient(135deg, #F28C28, #E07B1F)' }}
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Publication…</>
                ) : (
                  <>{isEditing ? 'Mettre à jour' : "Publier l'offre"}</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
