import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext.jsx'
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Coffee,
  Moon,
  Target,
  Zap,
  Volume2,
  VolumeX,
  Settings,
  X,
  Plus,
  Trash2,
  BookOpen,
  Code,
  Music,
  Dumbbell,
  PenTool,
  Heart,
  Sun,
  Coffee as CoffeeIcon,
  Trophy,
  Activity,
  Bike,
  Footprints,
  Timer,
  Flame,
  Medal,
  Swords,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

const DEFAULT_MODES = {
  work: { label: '专注', minutes: 25, icon: Target, desc: '全神贯注工作', soulColor: '#c41e3a' },
  shortBreak: { label: '短休息', minutes: 5, icon: Coffee, desc: '放松身心', soulColor: '#4a90a4' },
  longBreak: { label: '长休息', minutes: 15, icon: Moon, desc: '深度恢复', soulColor: '#c9a86c' },
  workout: { label: '健身训练', minutes: 45, icon: Dumbbell, desc: '力量与耐力训练', soulColor: '#b87333' },
  running: { label: '跑步', minutes: 30, icon: Footprints, desc: '有氧跑步训练', soulColor: '#b87333' },
  cycling: { label: '骑行', minutes: 60, icon: Bike, desc: '户外或室内骑行', soulColor: '#5a7a5a' },
  hiit: { label: 'HIIT', minutes: 20, icon: Flame, desc: '高强度间歇训练', soulColor: '#a01830' },
  yoga: { label: '瑜伽', minutes: 40, icon: Activity, desc: '身心平衡练习', soulColor: '#5a7a5a' },
  sports: { label: '球类运动', minutes: 90, icon: Trophy, desc: '篮球/足球/网球等', soulColor: '#b87333' }
}

const CINNABAR = '#c41e3a'
const FLASH_DURATION = 320

const DARK_SOUL_COLORS = {
  '#c41e3a': '#e85050',
  '#4a90a4': '#6ab0c4',
  '#c9a86c': '#e0c88a',
  '#b87333': '#d4944f',
  '#5a7a5a': '#8bab8b',
  '#a01830': '#c82848'
}

const adjustForTheme = (color, isDark) => {
  if (!isDark) return color
  return DARK_SOUL_COLORS[color] || color
}

const AVAILABLE_ICONS = {
  Target, Coffee, Moon, BookOpen, Code, Music, Dumbbell, PenTool, Heart, Sun, Zap, CoffeeIcon,
  Trophy, Activity, Bike, Footprints, Timer, Flame, Medal, Swords
}

const CORE_MODES = ['work', 'shortBreak', 'longBreak']
const EXTRA_MODES = ['workout', 'running', 'cycling', 'hiit', 'yoga', 'sports']

const SETTINGS_PANEL_STYLES = `
  .gz-settings-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .gz-settings-backdrop {
    position: absolute;
    inset: 0;
    background: var(--gz-backdrop, rgba(45, 58, 45, 0.08));
    backdrop-filter: blur(4px);
  }
  .gz-page.dark .gz-settings-backdrop {
    background: rgba(212, 220, 212, 0.06);
  }
  .gz-settings-panel {
    position: relative;
    width: 100%;
    max-width: 520px;
    max-height: 80vh;
    overflow-y: auto;
    background: var(--gz-bg);
    border: 1px solid var(--gz-secondary);
  }
  .gz-settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 32px;
    border-bottom: 1px solid var(--gz-secondary);
  }
  .gz-settings-title-group {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .gz-settings-title {
    font-family: "Noto Serif SC", "Source Han Serif SC", serif;
    font-size: 18px;
    font-weight: 600;
    color: var(--gz-text);
    letter-spacing: 0.02em;
  }
  .gz-settings-subtitle {
    font-family: "IBM Plex Mono", monospace;
    font-size: 11px;
    color: var(--gz-secondary);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .gz-settings-body {
    padding: 24px 32px 32px;
  }
  .gz-mode-item {
    padding: 20px 0;
    border-bottom: 1px solid var(--gz-line);
  }
  .gz-mode-item:last-child {
    border-bottom: none;
  }
  .gz-mode-row-top {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 12px;
  }
  .gz-mode-icon-box {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--gz-accent);
    flex-shrink: 0;
  }
  .gz-mode-info {
    flex: 1;
  }
  .gz-mode-label-input {
    width: 100%;
    font-family: "Noto Sans SC", sans-serif;
    font-size: 15px;
    font-weight: 500;
    color: var(--gz-text);
    background: transparent;
    border: none;
    outline: none;
    padding: 0;
  }
  .gz-mode-desc {
    font-family: "Noto Sans SC", sans-serif;
    font-size: 12px;
    color: var(--gz-secondary);
    margin-top: 2px;
  }
  .gz-mode-delete-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: border-color 0.2s;
    flex-shrink: 0;
  }
  .gz-mode-delete-btn:hover {
    border-color: var(--gz-cinnabar);
  }
  .gz-mode-duration-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-left: 48px;
  }
  .gz-duration-label {
    font-family: "IBM Plex Mono", monospace;
    font-size: 11px;
    color: var(--gz-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    width: 36px;
    flex-shrink: 0;
  }
  .gz-duration-slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 1px;
    background: var(--gz-secondary);
    outline: none;
    cursor: pointer;
  }
  .gz-duration-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border: 2px solid var(--gz-accent);
    background: var(--gz-bg);
    cursor: pointer;
  }
  .gz-duration-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border: 2px solid var(--gz-accent);
    background: var(--gz-bg);
    cursor: pointer;
    border-radius: 0;
  }
  .gz-duration-num-input {
    width: 52px;
    font-family: "IBM Plex Mono", monospace;
    font-size: 13px;
    font-weight: 500;
    color: var(--gz-text);
    background: transparent;
    border: 1px solid var(--gz-secondary);
    text-align: center;
    padding: 4px 0;
    outline: none;
  }
  .gz-duration-unit {
    font-family: "Noto Sans SC", sans-serif;
    font-size: 12px;
    color: var(--gz-secondary);
  }
  .gz-add-mode-btn {
    width: 100%;
    padding: 16px;
    border: 1px dashed var(--gz-secondary);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-family: "Noto Sans SC", sans-serif;
    font-size: 13px;
    color: var(--gz-secondary);
    transition: color 0.2s, border-color 0.2s;
    margin-top: 8px;
  }
  .gz-add-mode-btn:hover {
    color: var(--gz-accent);
    border-color: var(--gz-accent);
  }
  .gz-new-mode-form {
    padding: 20px;
    background: var(--gz-form-bg, rgba(90, 122, 90, 0.04));
    border: 1px solid var(--gz-line);
    margin-top: 8px;
  }
  .gz-page.dark .gz-new-mode-form {
    background: rgba(139, 171, 139, 0.06);
  }
  .gz-new-mode-form-title {
    font-family: "Noto Serif SC", serif;
    font-size: 14px;
    font-weight: 600;
    color: var(--gz-text);
    margin-bottom: 16px;
  }
  .gz-form-field {
    margin-bottom: 12px;
  }
  .gz-form-input {
    width: 100%;
    padding: 10px 12px;
    font-family: "Noto Sans SC", sans-serif;
    font-size: 14px;
    color: var(--gz-text);
    background: var(--gz-bg);
    border: 1px solid var(--gz-secondary);
    outline: none;
  }
  .gz-form-input:focus {
    border-color: var(--gz-accent);
  }
  .gz-icon-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .gz-icon-btn {
    width: 34px;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--gz-secondary);
    background: transparent;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .gz-icon-btn.active {
    background: var(--gz-accent);
    color: #fff;
    border-color: var(--gz-accent);
  }
  .gz-reset-btn {
    width: 100%;
    padding: 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: "Noto Sans SC", sans-serif;
    font-size: 13px;
    color: var(--gz-secondary);
    text-align: left;
    margin-top: 16px;
    transition: color 0.2s;
  }
  .gz-reset-btn:hover {
    color: var(--gz-text);
  }
  .gz-settings-footer {
    display: flex;
    gap: 12px;
    padding: 20px 32px;
    border-top: 1px solid var(--gz-secondary);
  }
  .gz-footer-btn {
    flex: 1;
    padding: 12px;
    font-family: "Noto Sans SC", sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid var(--gz-secondary);
    background: transparent;
    color: var(--gz-text);
    transition: background 0.15s, color 0.15s;
  }
  .gz-footer-btn.primary {
    background: var(--gz-text);
    color: var(--gz-bg);
    border-color: var(--gz-text);
  }
  .gz-footer-btn.primary:hover {
    background: var(--gz-text-deep);
  }
  .gz-footer-btn:hover:not(.primary) {
    background: var(--gz-hover-bg, rgba(90, 122, 90, 0.08));
  }
  .gz-page.dark .gz-footer-btn:hover:not(.primary) {
    background: rgba(139, 171, 139, 0.12);
  }

  /* ===== Theme Toggle ===== */
  .gz-theme-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--gz-line);
  }
  .gz-theme-toggle-label {
    font-family: "Noto Sans SC", sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--gz-text);
  }
  .gz-theme-switch {
    position: relative;
    width: 48px;
    height: 26px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .gz-theme-switch input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }
  .gz-theme-switch-track {
    position: absolute;
    inset: 0;
    background: var(--gz-secondary);
    border: 1px solid var(--gz-line);
    transition: background 0.3s ease-out, border-color 0.3s ease-out;
  }
  .gz-theme-switch input:checked + .gz-theme-switch-track {
    background: var(--gz-accent);
    border-color: var(--gz-accent);
  }
  .gz-theme-switch-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: var(--gz-bg);
    transition: transform 0.3s ease-out;
  }
  .gz-theme-switch input:checked ~ .gz-theme-switch-knob {
    transform: translateX(22px);
  }
`

const SettingsPanel = ({ isOpen, onClose, modes, onUpdateModes, theme, onToggleTheme }) => {
  const [localModes, setLocalModes] = useState(modes)
  const [isAddingMode, setIsAddingMode] = useState(false)
  const [newMode, setNewMode] = useState({
    label: '', minutes: 25, desc: '', icon: 'Target'
  })

  useEffect(() => { setLocalModes(modes) }, [modes, isOpen])

  const handleSave = () => { onUpdateModes(localModes); onClose() }

  const updateModeMinutes = (modeKey, minutes) => {
    setLocalModes(prev => ({ ...prev, [modeKey]: { ...prev[modeKey], minutes: parseInt(minutes) || 1 } }))
  }

  const updateModeLabel = (modeKey, label) => {
    setLocalModes(prev => ({ ...prev, [modeKey]: { ...prev[modeKey], label } }))
  }

  const deleteMode = (modeKey) => {
    const { [modeKey]: _, ...rest } = localModes
    setLocalModes(rest)
  }

  const addMode = () => {
    if (!newMode.label.trim()) return
    const key = `custom_${Date.now()}`
    setLocalModes(prev => ({ ...prev, [key]: { ...newMode, icon: AVAILABLE_ICONS[newMode.icon] || Target } }))
    setIsAddingMode(false)
    setNewMode({ label: '', minutes: 25, desc: '', icon: 'Target' })
  }

  if (!isOpen) return null

  return (
    <>
      <style>{SETTINGS_PANEL_STYLES}</style>
      <div className="gz-settings-overlay">
        <motion.div className="gz-settings-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="gz-settings-panel" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3 }}>
          <div className="gz-settings-header">
            <div className="gz-settings-title-group">
              <Settings strokeWidth={1.2} size={18} className="text-[var(--gz-accent)]" />
              <div>
                <div className="gz-settings-title">专注设置</div>
                <div className="gz-settings-subtitle">Customize Timer Modes</div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--gz-secondary)' }}>
              <X size={18} strokeWidth={1.2} />
            </button>
          </div>

          <div className="gz-settings-body">
            <div className="gz-theme-toggle-row">
              <div>
                <div className="gz-theme-toggle-label">{theme === 'dark' ? '墨池模式' : '苔纸模式'}</div>
                <div className="gz-theme-toggle-label-sub">{theme === 'dark' ? 'Ink Pool' : 'Forest Ink'}</div>
              </div>
              <label className="gz-theme-switch">
                <input type="checkbox" checked={theme === 'dark'} onChange={onToggleTheme} />
                <span className="gz-theme-switch-track" />
                <span className="gz-theme-switch-knob" />
              </label>
            </div>
            {Object.entries(localModes).map(([key, mode]) => {
              const Icon = mode.icon
              const isDefault = CORE_MODES.includes(key)
              return (
                <div key={key} className="gz-mode-item">
                  <div className="gz-mode-row-top">
                    <div className="gz-mode-icon-box"><Icon size={15} strokeWidth={1.2} /></div>
                    <div className="gz-mode-info">
                      <input type="text" value={mode.label} onChange={(e) => updateModeLabel(key, e.target.value)} className="gz-mode-label-input" />
                      <div className="gz-mode-desc">{mode.desc}</div>
                    </div>
                    {!isDefault && (
                      <button onClick={() => deleteMode(key)} className="gz-mode-delete-btn">
                        <Trash2 size={14} strokeWidth={1.2} className="text-[var(--gz-cinnabar)]" />
                      </button>
                    )}
                  </div>
                  <div className="gz-mode-duration-row">
                    <span className="gz-duration-label">时长</span>
                    <input type="range" min="1" max="120" value={mode.minutes} onChange={(e) => updateModeMinutes(key, e.target.value)} className="gz-duration-slider" />
                    <input type="number" min="1" max="120" value={mode.minutes} onChange={(e) => updateModeMinutes(key, e.target.value)} className="gz-duration-num-input" />
                    <span className="gz-duration-unit">分钟</span>
                  </div>
                </div>
              )
            })}

            {!isAddingMode ? (
              <button onClick={() => setIsAddingMode(true)} className="gz-add-mode-btn">
                <Plus size={16} strokeWidth={1.2} /> 添加新模式
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="gz-new-mode-form">
                <div className="gz-new-mode-form-title">新建模式</div>
                <div className="gz-form-field">
                  <input type="text" placeholder="模式名称" value={newMode.label} onChange={(e) => setNewMode({ ...newMode, label: e.target.value })} className="gz-form-input" />
                </div>
                <div className="gz-form-field">
                  <input type="text" placeholder="描述" value={newMode.desc} onChange={(e) => setNewMode({ ...newMode, desc: e.target.value })} className="gz-form-input" />
                </div>
                <div className="gz-form-field" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: 'var(--gz-secondary)' }}>时长:</span>
                  <input type="number" min="1" max="120" value={newMode.minutes} onChange={(e) => setNewMode({ ...newMode, minutes: parseInt(e.target.value) || 1 })} style={{ width: 56, padding: '6px 8px', fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, color: 'var(--gz-text)', background: 'var(--gz-bg)', border: '1px solid var(--gz-secondary)', outline: 'none' }} />
                  <span style={{ fontFamily: '"Noto Sans SC", sans-serif', fontSize: 12, color: 'var(--gz-secondary)' }}>分钟</span>
                </div>
                <div className="gz-form-field">
                  <div style={{ fontFamily: '"Noto Sans SC", sans-serif', fontSize: 12, color: 'var(--gz-secondary)', marginBottom: 6 }}>图标:</div>
                  <div className="gz-icon-grid">
                    {Object.keys(AVAILABLE_ICONS).map(iconName => {
                      const Ic = AVAILABLE_ICONS[iconName]
                      return (
                        <button key={iconName} onClick={() => setNewMode({ ...newMode, icon: iconName })}
                          className={`gz-icon-btn ${newMode.icon === iconName ? 'active' : ''}`}>
                          <Ic size={14} strokeWidth={1.2} />
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button onClick={() => setIsAddingMode(false)} style={{ flex: 1, padding: 10, fontFamily: '"Noto Sans SC", sans-serif', fontSize: 13, color: 'var(--gz-secondary)', background: 'transparent', border: '1px solid var(--gz-secondary)', cursor: 'pointer' }}>取消</button>
                  <button onClick={addMode} disabled={!newMode.label.trim()}
                    style={{ flex: 1, padding: 10, fontFamily: '"Noto Sans SC", sans-serif', fontSize: 13, fontWeight: 500, color: newMode.label.trim() ? 'var(--gz-bg)' : 'var(--gz-secondary)', background: newMode.label.trim() ? 'var(--gz-text)' : 'transparent', border: `1px solid ${newMode.label.trim() ? 'var(--gz-text)' : 'var(--gz-secondary)'}`, cursor: newMode.label.trim() ? 'pointer' : 'not-allowed' }}>添加</button>
                </div>
              </motion.div>
            )}

            <button onClick={() => setLocalModes(DEFAULT_MODES)} className="gz-reset-btn">恢复默认设置</button>
          </div>

          <div className="gz-settings-footer">
            <button onClick={onClose} className="gz-footer-btn">取消</button>
            <button onClick={handleSave} className="gz-footer-btn primary">保存设置</button>
          </div>
        </motion.div>
      </div>
    </>
  )
}

const PAGE_STYLES = `
  /* ===== Forest Ink Palette ===== */
  :root {
    --gz-bg: #f5f3f0;
    --gz-text: #2d3a2d;
    --gz-accent: #5a7a5a;
    --gz-secondary: #8b9a8b;
    --gz-line: #d4dcd4;
    --gz-cinnabar: #c41e3a;
    --gz-text-deep: #1e261e;
    --gz-cinnabar-deep: #a01830;
  }

  /* ===== 墨池 Dark Theme (Ink Pool) ===== */
  /* 深色模式变量通过 .gz-page.dark 作用，由组件动态添加 */

  .gz-page.dark {
    --gz-bg: #1a1f1a;
    --gz-text: #d4dcd4;
    --gz-accent: #8bab8b;
    --gz-secondary: #6a7a6a;
    --gz-line: #2d3a2d;
    --gz-cinnabar: #e85050;
    --gz-text-deep: #b4c4b4;
    --gz-cinnabar-deep: #d04048;
  }

  /* ===== Theme Transition ===== */
  .gz-page,
  .gz-settings-panel,
  .gz-flash-overlay,
  .gz-timer-min,
  .gz-ctrl-primary,
  .gz-zhi-xing {
    transition: background-color 0.35s ease-out, color 0.35s ease-out, border-color 0.35s ease-out;
  }

  /* ===== Base ===== */
  .gz-page {
    min-height: 100vh;
    background: var(--gz-bg);
    color: var(--gz-text);
    padding: 80px 48px 64px;
    font-family: "Noto Sans SC", "Source Han Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  @media (max-width: 640px) {
    .gz-page { padding: 96px 24px 48px; }
  }

  /* ===== Unified Content Container ===== */
  .gz-container {
    width: 100%;
    max-width: 960px;
    margin-left: auto;
    margin-right: auto;
  }
  @media (max-width: 1199px) {
    .gz-container { max-width: 100%; }
  }

  /* ===== L1: Full Bleed Title ===== */
  .gz-hero {
    margin-bottom: 80px;
  }
  .gz-title {
    font-family: "Noto Serif SC", "Source Han Serif SC", "STSong", "SimSun", serif;
    font-size: clamp(48px, 8vw, 72px);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: 0.04em;
    color: var(--gz-text);
    margin-left: 4%;
  }
  .gz-title-meta {
    display: inline-flex;
    align-items: center;
    gap: 16px;
    margin-top: 24px;
    margin-left: 4%;
  }
  .gz-title-line {
    width: 48px;
    height: 1px;
    background: var(--gz-accent);
  }
  .gz-title-time-badge {
    font-family: "IBM Plex Mono", SF Mono, Consolas, monospace;
    font-size: 12px;
    font-weight: 500;
    color: var(--gz-secondary);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* ===== L2: Asymmetric Split — Mode Selector ===== */
  .gz-modes-section {
    display: flex;
    align-items: flex-start;
    gap: 48px;
    margin-bottom: 96px;
  }
  @media (max-width: 640px) {
    .gz-modes-section { flex-direction: column; gap: 24px; margin-bottom: 64px; }
  }
  .gz-modes-list {
    flex: 1;
    min-width: 0;
  }
  .gz-modes-negative {
    flex-shrink: 0;
    padding-top: 8px;
  }
  @media (max-width: 640px) {
    .gz-modes-negative { display: none; }
  }

  /* ===== "知行合一" Staggered Ink Reveal ===== */
  .gz-zhi-xing {
    writing-mode: vertical-rl;
    text-orientation: upright;
    font-family: "Noto Serif SC", "Source Han Serif SC", STSong, SimSun, serif;
    font-size: 28px;
    font-weight: 600;
    letter-spacing: 0.4em;
    color: var(--gz-text);
    display: flex;
    gap: 0;
    z-index: 1;
  }
  .gz-zhi-xing-char {
    display: inline-block;
    will-change: opacity, transform;
  }

  @keyframes gz-breathe {
    0%, 100% { opacity: 0.16; }
    50%      { opacity: 0.42; }
  }

  @media (prefers-reduced-motion: reduce) {
    .gz-zhi-xing-char {
      animation: none !important;
      transition: none !important;
      opacity: 0.26 !important;
      transform: none !important;
    }
  }

  .gz-mode-item {
    display: flex;
    align-items: baseline;
    gap: 16px;
    padding: 14px 0;
    cursor: pointer;
    border-bottom: 1px solid var(--gz-line);
    transition: color 0.2s;
    position: relative;
    background: none;
    border-left: none;
    border-right: none;
    border-top: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
  }
  .gz-mode-item:hover { color: var(--gz-accent); }
  .gz-mode-item:last-child { border-bottom: none; }

  .gz-mode-num {
    font-family: "IBM Plex Mono", monospace;
    font-size: 13px;
    font-weight: 500;
    color: var(--gz-secondary);
    min-width: 22px;
    flex-shrink: 0;
  }
  .gz-mode-name {
    font-family: "Noto Sans SC", sans-serif;
    font-size: 15px;
    font-weight: 500;
    flex-shrink: 0;
  }
  .gz-mode-active-indicator {
    position: absolute;
    left: -24px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 1px;
    background: var(--gz-accent);
  }
  .gz-mode-detail {
    font-family: "Noto Sans SC", sans-serif;
    font-size: 12px;
    color: var(--gz-secondary);
    margin-left: auto;
    flex-shrink: 0;
  }

  .gz-more-modes-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 14px 0;
    cursor: pointer;
    font-family: "IBM Plex Mono", monospace;
    font-size: 12px;
    color: var(--gz-secondary);
    background: none;
    border: none;
    border-bottom: 1px solid var(--gz-line);
    width: 100%;
    text-align: left;
    transition: color 0.2s;
  }
  .gz-more-modes-toggle:hover { color: var(--gz-accent); }

  .gz-extra-modes {
    padding-left: 38px;
  }
  .gz-extra-mode-item {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 10px 0;
    cursor: pointer;
    border-bottom: 1px solid var(--gz-line);
    font-size: 13px;
    color: var(--gz-secondary);
    transition: color 0.2s;
    background: none;
    border-left: none;
    border-right: none;
    border-top: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
  }
  .gz-extra-mode-item:hover { color: var(--gz-text); }
  .gz-extra-mode-item:last-child { border-bottom: none; }

  .gz-settings-entry {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 14px 0;
    cursor: pointer;
    font-family: "IBM Plex Mono", monospace;
    font-size: 12px;
    color: var(--gz-secondary);
    background: none;
    border: none;
    border-bottom: 1px solid var(--gz-line);
    width: 100%;
    text-align: left;
    transition: color 0.2s;
  }
  .gz-settings-entry:hover { color: var(--gz-accent); }

  /* ===== L5: Typographic Poster — Timer ===== */
  .gz-timer-section {
    margin-bottom: 96px;
  }
  @media (max-width: 640px) {
    .gz-timer-section { margin-bottom: 64px; }
  }
  .gz-timer-display {
    font-family: "IBM Plex Mono", SF Mono, Consolas, monospace;
    font-size: clamp(64px, 14vw, 112px);
    font-weight: 400;
    letter-spacing: -0.02em;
    line-height: 1;
    margin-bottom: 24px;
    display: flex;
    align-items: baseline;
  }
  .gz-timer-min {
    color: var(--gz-cinnabar);
  }
  .gz-timer-sep {
    color: var(--gz-secondary);
    margin: 0 2px;
    font-weight: 300;
  }
  .gz-timer-sec {
    color: var(--gz-text);
  }
  .gz-progress-track {
    width: 100%;
    height: 1px;
    background: var(--gz-line);
    margin-bottom: 20px;
  }
  .gz-progress-fill {
    height: 100%;
    background: var(--gz-accent);
    transition: width 0.5s ease-out;
  }
  .gz-timer-status {
    font-family: "Noto Sans SC", sans-serif;
    font-size: 14px;
    color: var(--gz-secondary);
    font-style: italic;
  }

  /* ===== Controls (inline text links) ===== */
  .gz-controls {
    display: flex;
    align-items: center;
    gap: 28px;
    margin-bottom: 88px;
    flex-wrap: wrap;
  }
  @media (max-width: 640px) {
    .gz-controls { gap: 20px; margin-bottom: 64px; }
  }
  .gz-ctrl-link {
    font-family: "Noto Sans SC", sans-serif;
    font-size: 14px;
    font-weight: 500;
    color: var(--gz-secondary);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    position: relative;
    transition: color 0.2s;
  }
  .gz-ctrl-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background: var(--gz-accent);
    transition: width 0.2s ease-out;
  }
  .gz-ctrl-link:hover { color: var(--gz-accent); }
  .gz-ctrl-link:hover::after { width: 100%; }

  .gz-ctrl-primary {
    font-family: "Noto Sans SC", sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--gz-bg);
    background: var(--gz-text);
    border: none;
    cursor: pointer;
    padding: 12px 32px;
    transition: background 0.2s;
    letter-spacing: 0.02em;
  }
  .gz-ctrl-primary:hover { background: var(--gz-text-deep); }
  .gz-ctrl-primary.gz-ctrl-running {
    background: var(--gz-cinnabar);
    transition: background 0.2s;
  }
  .gz-ctrl-primary.gz-ctrl-running:hover { background: var(--gz-cinnabar-deep); }

  .gz-sound-toggle {
    font-family: "Noto Sans SC", sans-serif;
    font-size: 13px;
    color: var(--gz-secondary);
    background: none;
    border: 1px solid var(--gz-line);
    cursor: pointer;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: border-color 0.2s, color 0.2s;
  }
  .gz-sound-toggle:hover { border-color: var(--gz-accent); color: var(--gz-accent); }

  /* ===== L8: Text + Marginalia — Stats ===== */
  .gz-stats-section {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 48px;
    margin-bottom: 96px;
    align-items: start;
  }
  @media (max-width: 640px) {
    .gz-stats-section { grid-template-columns: 1fr; gap: 24px; margin-bottom: 64px; }
  }
  .gz-stats-narrative {
    font-family: "Noto Sans SC", sans-serif;
    font-size: 17px;
    line-height: 1.8;
    color: var(--gz-text);
  }
  .gz-stats-narrative strong {
    font-weight: 600;
  }
  .gz-stats-marginalia {
    border-left: 1px solid var(--gz-line);
    padding-left: 24px;
    min-width: 120px;
  }
  @media (max-width: 640px) {
    .gz-stats-marginalia { border-left: none; border-top: 1px solid var(--gz-line); padding-left: 0; padding-top: 16px; }
  }
  .gz-stat-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 6px 0;
    gap: 24px;
  }
  .gz-stat-label {
    font-family: "IBM Plex Mono", monospace;
    font-size: 11px;
    color: var(--gz-secondary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }
  .gz-stat-value {
    font-family: "IBM Plex Mono", monospace;
    font-size: 16px;
    font-weight: 500;
    color: var(--gz-text);
  }

  /* ===== Footer Quote ===== */
  .gz-footer {
    padding-top: 32px;
    border-top: 1px solid var(--gz-line);
  }
  .gz-quote {
    font-family: "Noto Serif SC", "Source Han Serif SC", STSong, SimSun, serif;
    font-size: 15px;
    font-style: italic;
    line-height: 1.8;
    color: var(--gz-secondary);
  }

  /* ===== Loading ===== */
  .gz-loading {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gz-bg);
  }
  .gz-loading-dot {
    width: 4px;
    height: 4px;
    background: var(--gz-accent);
    animation: gz-pulse 1.2s ease-in-out infinite;
  }
  @keyframes gz-pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  /* ===== Plan C: Mode Switch Flash Overlay ===== */
  .gz-flash-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    pointer-events: none;
  }
`

const Focus = () => {
  const { theme, toggleTheme } = useTheme()
  const [mode, setMode] = useState('work')
  const [modes, setModes] = useState(DEFAULT_MODES)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [todayMinutes, setTodayMinutes] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showExtraModes, setShowExtraModes] = useState(false)
  const [flashMode, setFlashMode] = useState(null)
  const timerRef = useRef(null)

  const isDark = theme === 'dark'

  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem('myku_focus_sessions')
      const savedMinutes = localStorage.getItem('myku_focus_today')
      const savedModes = localStorage.getItem('myku_focus_modes')
      if (savedSessions) setSessions(parseInt(savedSessions))
      if (savedMinutes) setTodayMinutes(parseInt(savedMinutes))
      if (savedModes) {
        const parsedModes = JSON.parse(savedModes)
        const restoredModes = {}
        Object.entries(parsedModes).forEach(([key, mode]) => {
          restoredModes[key] = { ...mode, icon: AVAILABLE_ICONS[mode.icon] || AVAILABLE_ICONS[mode.iconName] || Target }
        })
        setModes(restoredModes)
      }
    } catch (e) { console.error('Failed to load focus data:', e) }
    setIsLoaded(true)
  }, [])

  const handleUpdateModes = (newModes) => {
    setModes(newModes)
    try {
      const modesToSave = {}
      Object.entries(newModes).forEach(([key, mode]) => {
        const iconName = Object.keys(AVAILABLE_ICONS).find(k => AVAILABLE_ICONS[k] === mode.icon) || 'Target'
        modesToSave[key] = { ...mode, icon: iconName, iconName: iconName }
      })
      localStorage.setItem('myku_focus_modes', JSON.stringify(modesToSave))
    } catch (e) {}
    if (!isActive) setTimeLeft(newModes[mode].minutes * 60)
  }

  const currentMode = modes[mode]
  const totalTime = currentMode.minutes * 60
  const progress = ((totalTime - timeLeft) / totalTime) * 100
  const isCompleted = timeLeft === 0 && mode === 'work'

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return {
      mins: mins.toString().padStart(2, '0'),
      secs: secs.toString().padStart(2, '0')
    }
  }

  const switchMode = (newMode) => {
    if (newMode !== mode) {
      setFlashMode(newMode)
      setTimeout(() => setFlashMode(null), FLASH_DURATION)
    }
    setMode(newMode)
    setTimeLeft(modes[newMode].minutes * 60)
    setIsActive(false)
  }

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      if (mode === 'work') {
        const newSessions = sessions + 1
        setSessions(newSessions)
        try { localStorage.setItem('myku_focus_sessions', newSessions.toString()) } catch (e) {}
        const newMinutes = todayMinutes + currentMode.minutes
        setTodayMinutes(newMinutes)
        try { localStorage.setItem('myku_focus_today', newMinutes.toString()) } catch (e) {}
      }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isActive, timeLeft, mode, sessions, todayMinutes, currentMode.minutes])

  const resetTimer = () => { setIsActive(false); setTimeLeft(currentMode.minutes * 60) }

  const coreModeEntries = CORE_MODES.map(k => [k, modes[k]]).filter(([, m]) => m)
  const extraModeEntries = EXTRA_MODES.filter(k => modes[k]).map(k => [k, modes[k]])
  let modeIndex = 0

  if (!isLoaded) {
    return (
      <div className="gz-loading">
        <div className="gz-loading-dot" />
      </div>
    )
  }

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <div className={`gz-page ${isDark ? 'dark' : ''}`}>

        {/* ===== L1: Full Bleed Title ===== */}
        <motion.section className="gz-hero"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="gz-title">专注</h1>
          <div className="gz-title-meta">
            <span className="gz-title-line" />
            <span className="gz-title-time-badge">{currentMode.minutes} 分钟周期</span>
          </div>
        </motion.section>

        {/* ===== L2: Asymmetric Split — Mode Selector ===== */}
        <div className="gz-container">
        <motion.section className="gz-modes-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
        >
          <div className="gz-modes-list">
            {coreModeEntries.map(([key, m]) => {
              modeIndex++
              const isActive = mode === key
              return (
                <button key={key} className="gz-mode-item" onClick={() => switchMode(key)}>
                  {isActive && <span className="gz-mode-active-indicator" />}
                  <span className="gz-mode-num">{String(modeIndex).padStart(2, '0')}</span>
                  <span className="gz-mode-name">{m.label}</span>
                  <span className="gz-mode-detail">{m.desc} · {m.minutes}min</span>
                </button>
              )
            })}

            {extraModeEntries.length > 0 && (
              <button className="gz-more-modes-toggle" onClick={() => setShowExtraModes(!showExtraModes)}>
                {showExtraModes ? <ChevronDown size={14} strokeWidth={1.2} /> : <ChevronRight size={14} strokeWidth={1.2} />}
                更多模式
              </button>
            )}

            <AnimatePresence>
              {showExtraModes && extraModeEntries.length > 0 && (
                <motion.div className="gz-extra-modes"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {extraModeEntries.map(([key, m]) => (
                    <button key={key} className="gz-extra-mode-item" onClick={() => switchMode(key)}>
                      {m.label}
                      <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{m.minutes}min</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <button className="gz-settings-entry" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={13} strokeWidth={1.2} />
              设置
            </button>
          </div>

          <div className="gz-modes-negative">
            <div className="gz-zhi-xing" aria-hidden="true">
              {['知', '行', '合', '一'].map((char, i) => (
                <motion.span
                  key={char}
                  className="gz-zhi-xing-char"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{
                    opacity: isActive
                      ? (isDark ? [0.22, 0.55, 0.22] : [0.16, 0.42, 0.16])
                      : isCompleted
                        ? (isDark ? [0.70, 0.30] : [0.60, 0.26])
                        : (isDark ? 0.30 : 0.26),
                    y: 0
                  }}
                  transition={{
                    opacity: {
                      duration: isActive ? 3.5 : (isCompleted ? 0.8 : 0.6),
                      repeat: isActive ? Infinity : 0,
                      ease: isActive ? 'easeInOut' : 'easeOut',
                      delay: 1.8 + i * 0.2
                    },
                    y: {
                      duration: 0.6,
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: 1.8 + i * 0.2
                    }
                  }}
                >{char}</motion.span>
              ))}
            </div>
          </div>
        </motion.section>
        </div>

        {/* ===== L5: Typographic Poster — Timer ===== */}
        <div className="gz-container">
        <motion.section className="gz-timer-section"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.16 }}
        >
          <div className="gz-timer-display">
            <span className="gz-timer-min">{formatTime(timeLeft).mins}</span>
            <span className="gz-timer-sep">:</span>
            <span className="gz-timer-sec">{formatTime(timeLeft).secs}</span>
          </div>
          <div className="gz-progress-track">
            <motion.div className="gz-progress-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          <div className="gz-timer-status">
            {isActive ? '进行中……' : '准备开始'}
          </div>
        </motion.section>
        </div>

        {/* ===== Controls (inline text links) ===== */}
        <div className="gz-container">
        <motion.section className="gz-controls"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
        >
          <button className="gz-sound-toggle" onClick={() => setSoundEnabled(!soundEnabled)}>
            {soundEnabled ? <Volume2 size={14} strokeWidth={1.2} /> : <VolumeX size={14} strokeWidth={1.2} />}
            {soundEnabled ? '声音开' : '声音关'}
          </button>

          <button className={`gz-ctrl-primary${isActive ? ' gz-ctrl-running' : ''}`} onClick={() => setIsActive(!isActive)}>
            {isActive ? <>暂停</> : <>开始专注</>}
          </button>

          <button className="gz-ctrl-link" onClick={resetTimer}>重置</button>
        </motion.section>
        </div>

        {/* ===== L8: Text + Marginalia — Stats ===== */}
        <div className="gz-container">
        <motion.section className="gz-stats-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32 }}
        >
          <div className="gz-stats-narrative">
            今日已专注 <strong>{todayMinutes} 分钟</strong>，
            完成了 <strong>{sessions}</strong> 个番茄周期。
            当前模式设定为每段 <strong>{currentMode.minutes} 分钟</strong>。
          </div>
          <aside className="gz-stats-marginalia">
            <div className="gz-stat-row">
              <span className="gz-stat-label">今日</span>
              <span className="gz-stat-value">{todayMinutes}<small style={{ fontSize: 11, color: 'var(--gz-secondary)', marginLeft: 2 }}>min</small></span>
            </div>
            <div className="gz-stat-row">
              <span className="gz-stat-label">完成</span>
              <span className="gz-stat-value">{sessions}<small style={{ fontSize: 11, color: 'var(--gz-secondary)', marginLeft: 2 }}>次</small></span>
            </div>
            <div className="gz-stat-row">
              <span className="gz-stat-label">单次</span>
              <span className="gz-stat-value">{currentMode.minutes}<small style={{ fontSize: 11, color: 'var(--gz-secondary)', marginLeft: 2 }}>min</small></span>
            </div>
          </aside>
        </motion.section>
        </div>

        {/* ===== Footer Quote ===== */}
        <div className="gz-container">
        <motion.footer className="gz-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.44 }}
        >
          <p className="gz-quote">
            「时间是流动的沙，专注是握住它的手。」
          </p>
        </motion.footer>
        </div>

      </div>

      {/* ===== Plan C: Mode Switch Flash Overlay ===== */}
      <AnimatePresence>
        {flashMode && (
          <motion.div
            className="gz-flash-overlay"
            initial={{ opacity: 1 }}
            animate={{ opacity: [1, 0.6, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: FLASH_DURATION / 1000, ease: 'easeOut' }}
            style={{ background: adjustForTheme(modes[flashMode]?.soulColor || CINNABAR, isDark) }}
          />
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            modes={modes}
            onUpdateModes={handleUpdateModes}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
        )}
      </AnimatePresence>
    </>
  )
}

export default Focus
