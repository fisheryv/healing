import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useApp, auth } from '../store.jsx'
import { useNavigate } from 'react-router-dom'

// 52 周 × 7 天
const WEEKS = 52
const DAYS = 7

// 热力图单元格固定尺寸（px）
const CELL_SIZE = 14
const CELL_GAP = 3
const WEEK_WIDTH = CELL_SIZE + CELL_GAP

// 绿色系配色（PRD）
const LEVELS = ['#ebedf0', '#033a16', '#196c2e', '#2ea043', '#56d364']

function getLevel(count) {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count === 3) return 3
  return 4
}

/**
 * 构建热力图数据：52周 × 7天，最右侧一列对齐到当天所在的那一周
 * 返回 { cells: [{date, count, level, weekIdx, dayIdx}], monthLabels: [{weekIdx, label}] }
 */
function buildHeatmap(records) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 只统计已完成的专注（排除残卷）
  const completed = records.filter((r) => r.status === 'complete')

  // 统计每个日期的专注次数
  const dateCount = {}
  completed.forEach((r) => {
    const d = new Date(r.createdAt)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    dateCount[key] = (dateCount[key] || 0) + 1
  })

  // 以“今天所在周的周日”作为最后一列（w=WEEKS-1, d=0）对应的日期，
  // 由此往前推算起始日，确保最右侧能看到当天。
  const lastWeekStart = new Date(today)
  lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay())
  const start = new Date(lastWeekStart)
  start.setDate(start.getDate() - (WEEKS - 1) * 7)

  const cells = []
  const monthLabels = []
  let lastMonth = -1

  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < DAYS; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      const key = date.toISOString().slice(0, 10)
      const count = dateCount[key] || 0
      cells.push({
        date: key,
        count,
        level: getLevel(count),
        weekIdx: w,
        dayIdx: d,
        displayDate: date
      })
    }
    // 月份标注：取每周第一天的月份
    const weekDate = new Date(start)
    weekDate.setDate(start.getDate() + w * 7)
    const month = weekDate.getMonth()
    if (month !== lastMonth) {
      monthLabels.push({ weekIdx: w, label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month] })
      lastMonth = month
    }
  }

  return { cells, monthLabels }
}

/**
 * 计算最长连续专注天数和当前连续天数（Streak）
 */
function calcStreaks(records) {
  // 只统计已完成的专注（排除残卷）
  const completed = records.filter((r) => r.status === 'complete')
  const dates = new Set()
  completed.forEach((r) => {
    const d = new Date(r.createdAt)
    d.setHours(0, 0, 0, 0)
    dates.add(d.toISOString().slice(0, 10))
  })

  const sortedDates = Array.from(dates).sort()

  // 没有任何专注记录时，longest 应为 0
  if (sortedDates.length === 0) return { longest: 0, streak: 0 }

  // 最长连续天数
  let longest = 1
  let current = 1
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1])
    const cur = new Date(sortedDates[i])
    const diff = (cur - prev) / (1000 * 60 * 60 * 24)
    if (diff === 1) {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 1
    }
  }

  // 当前连续天数（从今天往前数）
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  const cursor = new Date(today)
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  return { longest, streak }
}

export default function Profile() {
  const { user, setUser, artworks, settings, setSettings, lang, setLang, t } = useApp()
  const nav = useNavigate()
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const avatarInputRef = useRef(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [hoveredCell, setHoveredCell] = useState(null)

  const totalSec = artworks.filter((a) => a.status === 'complete').reduce((s, a) => s + a.duration * 60, 0)
  const totalComplete = artworks.filter((a) => a.status === 'complete').length
  const { cells, monthLabels } = useMemo(() => buildHeatmap(artworks), [artworks])
  const { longest, streak } = useMemo(() => calcStreaks(artworks), [artworks])

  // ── 热力图横向滚动：拖动平移 + 自定义滚动条 ──
  const scrollRef = useRef(null)          // 滚动容器
  const thumbRef = useRef(null)           // 滚动条滑块
  const dragState = useRef({ dragging: false, armed: false, justDragged: false, startX: 0, startScroll: 0, fromThumb: false })

  // 初始化：滚动到最右端，确保当天（最后一列）在首屏可见
  const initScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollLeft = el.scrollWidth - el.clientWidth
    // 同步滚动条滑块
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) {
      setThumbWidth(el.clientWidth)
      setThumbLeft(0)
      return
    }
    const tWidth = Math.max(30, (el.clientWidth / el.scrollWidth) * el.clientWidth)
    setThumbWidth(tWidth)
    setThumbLeft(el.clientWidth - tWidth)
  }, [])

  useEffect(() => {
    // 等待布局完成
    const id = requestAnimationFrame(initScroll)
    return () => cancelAnimationFrame(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 拖动平移热力图网格（鼠标 + 触摸）
  const DRAG_THRESHOLD = 4
  const applyDrag = (clientX) => {
    const st = dragState.current
    if (!st.armed) return
    const el = scrollRef.current
    if (!el) return
    const dx = clientX - st.startX
    // 超过阈值才真正开始拖动（避免误触吞掉 click）
    if (!st.dragging && Math.abs(dx) < DRAG_THRESHOLD) return
    if (!st.dragging) st.dragging = true
    if (st.fromThumb) {
      // 拖动滚动条：按比例换算到内容滚动量
      const thumbW = thumbRef.current?.offsetWidth || 30
      const track = el.clientWidth - thumbW
      if (track > 0) {
        const maxScroll = el.scrollWidth - el.clientWidth
        const next = st.startScroll + (dx / track) * maxScroll
        el.scrollLeft = Math.max(0, Math.min(maxScroll, next))
      }
    } else {
      // 拖动网格：反向平移
      el.scrollLeft = st.startScroll - dx
    }
  }

  const endDrag = () => {
    if (dragState.current.dragging) {
      dragState.current.justDragged = true
      // 下一轮事件循环清除标记，允许后续 click
      setTimeout(() => { dragState.current.justDragged = false }, 0)
    }
    dragState.current.armed = false
    dragState.current.dragging = false
  }

  const onPointerDown = (e, fromThumb = false) => {
    const el = scrollRef.current
    if (!el) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    dragState.current = {
      dragging: false,
      armed: true,
      justDragged: false,
      startX: clientX,
      startScroll: el.scrollLeft,
      fromThumb,
    }
  }

  // 全局事件：拖动期间监听 window，确保鼠标移出容器仍可继续拖动
  useEffect(() => {
    const onMouseMove = (e) => applyDrag(e.clientX)
    const onTouchMove = (e) => {
      if (!dragState.current.armed) return
      if (e.touches.length > 0) applyDrag(e.touches[0].clientX)
      if (e.cancelable && dragState.current.dragging) e.preventDefault()
    }
    const onMouseUp = () => endDrag()
    const onTouchEnd = () => endDrag()
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [])

  // 滚动时同步滚动条位置（由 wheel/programmatic 触发）
  const [thumbLeft, setThumbLeft] = useState(0)
  const [thumbWidth, setThumbWidth] = useState(0)
  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    if (maxScroll <= 0) {
      setThumbWidth(el.clientWidth)
      setThumbLeft(0)
      return
    }
    const ratio = el.scrollLeft / maxScroll
    const trackWidth = el.clientWidth
    const tWidth = Math.max(30, (el.clientWidth / el.scrollWidth) * trackWidth)
    setThumbWidth(tWidth)
    setThumbLeft(ratio * (trackWidth - tWidth))
  }

  const toggle = (key) => {
    const newVal = !settings[key]
    setSettings({ ...settings, [key]: newVal })
    // 勿扰设置：请求/释放通知权限
    if (key === 'dnd' && 'Notification' in window) {
      if (newVal) {
        // 勿扰模式开启时不做特别操作（Web 无法屏蔽系统通知）
      }
    }
    // 完成通知：申请权限
    if (key === 'completeNotice' && newVal && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const logout = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = () => {
    auth.logout()
    setShowLogoutConfirm(false)
    nav('/login', { replace: true })
  }

  const startEditName = () => {
    setNameDraft(user?.nickname || '')
    setEditingName(true)
  }

  const saveName = async () => {
    const name = nameDraft.trim()
    setEditingName(false)
    if (!name) return
    const res = await auth.updateProfile({ nickname: name })
    if (res.ok) setUser(res.user)
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    auth.updateProfile({ avatar: file }).then((res) => {
      if (res.ok) setUser(res.user)
    })
  }

  const avatarSrc = user?.avatar || 'assets/avatar.png'

  return (
    <div>
      <div className="profile-head">
        <div className="avatar avatar-img" onClick={() => avatarInputRef.current?.click()}>
          <img src={avatarSrc} alt="" />
          <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
        </div>
        <div className="info">
          {editingName ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                className="name-edit-input"
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={20}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && saveName()}
              />
              <button className="btn" style={{ height: 28, padding: '0 12px', fontSize: 11 }} onClick={saveName}>✓</button>
            </div>
          ) : (
            <div className="name editable" onClick={startEditName}>{user?.nickname || t('common.friend')}</div>
          )}
          <div className="id">{user?.account || t('common.guest')}</div>
        </div>
      </div>

      <div className="heatmap">
        <div className="section-title" style={{ margin: 0 }}>
          <h3>{t('profile.activity')}</h3>
          <span className="more">{streak} {t('profile.dayStreak')}</span>
        </div>
        <div
          className="heatmap-scroll"
          ref={scrollRef}
          onScroll={onScroll}
          onMouseDown={(e) => onPointerDown(e, false)}
          onTouchStart={(e) => onPointerDown(e, false)}
        >
          <div
            className="heatmap-inner"
            style={{ width: 24 + 4 + WEEKS * CELL_SIZE + (WEEKS - 1) * CELL_GAP }}
          >
            {/* 月份标注 */}
            <div className="heatmap-months">
              {monthLabels.map((m, i) => (
                <div
                  key={i}
                  className="heatmap-month-label"
                  style={{ position: 'absolute', left: m.weekIdx * WEEK_WIDTH }}
                >
                  {m.label}
                </div>
              ))}
            </div>
            <div className="heatmap-body">
              {/* 星期缩写 */}
              <div className="heatmap-weekdays">
                <div className="heatmap-weekday"></div>
                <div className="heatmap-weekday">{lang === 'zh' ? '一' : 'Mon'}</div>
                <div className="heatmap-weekday"></div>
                <div className="heatmap-weekday">{lang === 'zh' ? '三' : 'Wed'}</div>
                <div className="heatmap-weekday"></div>
                <div className="heatmap-weekday">{lang === 'zh' ? '五' : 'Fri'}</div>
                <div className="heatmap-weekday"></div>
              </div>
              {/* 热力图网格 */}
              <div className="heatmap-grid">
                {cells.map((c, i) => (
                  <div
                    key={i}
                    className="heatmap-cell interactive"
                    style={{ background: LEVELS[c.level] }}
                    onClick={() => {
                      if (dragState.current.justDragged) return
                      setHoveredCell(c)
                    }}
                    title={`${c.date}: ${c.count} session${c.count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* 可拖动滚动条 */}
        <div className="heatmap-scrollbar">
          <div
            ref={thumbRef}
            className="heatmap-scrollbar-thumb"
            style={{ width: thumbWidth || undefined, transform: `translateX(${thumbLeft}px)` }}
            onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onPointerDown(e, true) }}
            onTouchStart={(e) => { e.stopPropagation(); onPointerDown(e, true) }}
          />
        </div>
        {/* 点击气泡 */}
        {hoveredCell && (
          <div className="heatmap-bubble" onClick={() => setHoveredCell(null)}>
            <div className="bubble-content">
              <div className="bubble-date">{hoveredCell.displayDate.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              <div className="bubble-count">{hoveredCell.count} {t('profile.sessionsUnit')}{hoveredCell.count !== 1 ? '' : ''}</div>
            </div>
          </div>
        )}
      </div>

      <div className="stats">
        <Stat num={formatDuration(totalSec)} label={t('profile.totalFocus')} />
        <Stat num={totalComplete} label={t('profile.sessions')} />
        <Stat num={streak} label={t('profile.streak')} />
        <Stat num={longest} label={t('profile.longestStreak')} />
      </div>

      <div className="settings-group">{t('profile.focusSettings')}</div>
      <div className="settings-list">
        <div className="settings-row">
          <span>{t('profile.screenDown')}</span>
          <div className={'switch' + (settings.screenDown ? ' on' : '')} onClick={() => toggle('screenDown')} />
        </div>
        <div className="settings-row">
          <span>{t('profile.doNotDisturb')}</span>
          <div className={'switch' + (settings.dnd ? ' on' : '')} onClick={() => toggle('dnd')} />
        </div>
        <div className="settings-row">
          <span>{t('profile.completionNotice')}</span>
          <div className={'switch' + (settings.completeNotice ? ' on' : '')} onClick={() => toggle('completeNotice')} />
        </div>
      </div>

      <div className="settings-group">{t('profile.accountSecurity')}</div>
      <div className="settings-list">
        <div className="settings-row" onClick={() => nav('/settings/password')} style={{ cursor: 'pointer' }}>
          <span>{t('profile.changePassword')}</span><span className="arrow">›</span>
        </div>
        <div className="settings-row" onClick={() => nav('/settings/binding')} style={{ cursor: 'pointer' }}>
          <span>{t('profile.linkedAccounts')}</span><span className="arrow">›</span>
        </div>
        <div className="settings-row" onClick={() => nav('/settings/deactivate')} style={{ cursor: 'pointer' }}>
          <span style={{ color: '#9a4a4a' }}>{t('profile.deactivate')}</span><span className="arrow">›</span>
        </div>
      </div>

      <div className="settings-group">{t('profile.about')}</div>
      <div className="settings-list">
        <div className="settings-row">
          <span>{t('profile.language')}</span>
          <div className="lang-selector">
            <button
              className={'lang-btn' + (lang === 'en' ? ' active' : '')}
              onClick={() => setLang('en')}
            >English</button>
            <button
              className={'lang-btn' + (lang === 'zh' ? ' active' : '')}
              onClick={() => setLang('zh')}
            >中文</button>
          </div>
        </div>
        <div className="settings-row"><span>{t('profile.version')}</span><span className="arrow">v0.1.0</span></div>
        <div className="settings-row" onClick={() => nav('/about/terms')} style={{ cursor: 'pointer' }}>
          <span>{t('profile.terms')}</span><span className="arrow">›</span>
        </div>
        <div className="settings-row" onClick={() => nav('/about/privacy')} style={{ cursor: 'pointer' }}>
          <span>{t('profile.privacy')}</span><span className="arrow">›</span>
        </div>
        <div className="settings-row" onClick={() => nav('/about/feedback')} style={{ cursor: 'pointer' }}>
          <span>{t('profile.feedback')}</span><span className="arrow">›</span>
        </div>
        <div className="settings-row" onClick={logout} style={{ color: '#9a4a4a', justifyContent: 'center', cursor: 'pointer' }}>
          <span>{t('profile.logout')}</span>
        </div>
      </div>

      {/* 退出登录确认弹框 */}
      {showLogoutConfirm && (
        <div className="modal-mask" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h4>{t('profile.logoutTitle')}</h4>
            <p>{t('profile.logoutConfirm')}</p>
            <div className="modal-actions">
              <button className="btn ghost" onClick={() => setShowLogoutConfirm(false)}>{t('common.cancel')}</button>
              <button className="btn" style={{ background: '#9a4a4a', borderColor: '#9a4a4a' }} onClick={confirmLogout}>{t('profile.logout')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ num, label }) {
  return (
    <div className="stat-card">
      <div className="num">{num}</div>
      <div className="lbl">{label}</div>
    </div>
  )
}

function formatDuration(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}
