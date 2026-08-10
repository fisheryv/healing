/**
 * 多语言系统 (i18n)
 * 支持语言: 中文 (zh) / 英文 (en)
 *
 * 用法:
 *   import { useI18n } from '../i18n.js'
 *   const { t, lang, setLang } = useI18n()
 *   <h1>{t('home.welcome')}</h1>
 */

export const LANGUAGES = {
  zh: { label: '中文', short: '中' },
  en: { label: 'English', short: 'EN' }
}

export const DEFAULT_LANG = 'en'

const translations = {
  // ====== 导航 ======
  nav: {
    home: { zh: '首页', en: 'Home' },
    library: { zh: '音乐库', en: 'Library' },
    mixer: { zh: '调音', en: 'Mixer' },
    gallery: { zh: '画廊', en: 'Gallery' },
    profile: { zh: '我的', en: 'Profile' }
  },

  // ====== 通用 ======
  common: {
    cancel: { zh: '取消', en: 'Cancel' },
    delete: { zh: '删除', en: 'Delete' },
    confirm: { zh: '确认', en: 'Confirm' },
    save: { zh: '保存', en: 'Save' },
    more: { zh: '更多', en: 'More' },
    send: { zh: '发送', en: 'Send' },
    start: { zh: '开始', en: 'Start' },
    back: { zh: '返回', en: 'Back' },
    friend: { zh: '朋友', en: 'Friend' },
    guest: { zh: '访客', en: 'guest' },
    minRead: { zh: '分钟阅读', en: 'min read' },
    articles: { zh: '篇文章', en: 'Articles' },
  },

  // ====== Onboarding ======
  onboarding: {
    title1: { zh: '音乐是时间的艺术。', en: 'Music is the art of time.' },
    sub1: { zh: '在这里，时间不是用来追赶的计数，而是在静默中生长的艺术。', en: 'Here, time is not a count to race against, but an art that grows in stillness.' },
    title2: { zh: '调和你的内心宁静。', en: 'Mix your inner peace.' },
    sub2: { zh: '滑动指尖——让音乐隔绝周围的喧嚣。', en: 'Slide your fingertips — let music block out the noise around you.' },
    appName: { zh: '希音', en: 'Healing' },
    sub3: { zh: '开启一段艺术与心灵的觉知之旅。', en: 'Start a mindful journey of art and spirit.' },
    startBtn: { zh: '开始', en: 'Start' },
  },

  // ====== Login ======
  login: {
    title: { zh: '登录', en: 'Login' },
    tabEmail: { zh: '邮箱', en: 'Email' },
    tabPhone: { zh: '手机号', en: 'Phone' },
    email: { zh: '邮箱', en: 'Email' },
    emailPlaceholder: { zh: 'you@example.com', en: 'you@example.com' },
    emailRequired: { zh: '请输入邮箱。', en: 'Email is required.' },
    emailInvalid: { zh: '请输入有效的邮箱地址。', en: 'Please enter a valid email.' },
    phone: { zh: '手机号', en: 'Phone Number' },
    phonePlaceholder: { zh: '请输入手机号', en: 'Enter phone number' },
    phoneRequired: { zh: '请输入手机号。', en: 'Phone number is required.' },
    phoneInvalid: { zh: '请输入有效的手机号。', en: 'Please enter a valid phone number.' },
    countryCode: { zh: '+86', en: '+86' },
    password: { zh: '密码', en: 'Password' },
    passwordRequired: { zh: '请输入密码。', en: 'Password is required.' },
    passwordShort: { zh: '密码至少8-20位，需包含字母和数字。', en: 'Password must be 8-20 chars with letters and digits.' },
    showPassword: { zh: '显示密码', en: 'Show password' },
    hidePassword: { zh: '隐藏密码', en: 'Hide password' },
    forgotPassword: { zh: '忘记密码？', en: 'Forgot Password?' },
    rememberMe: { zh: '记住我', en: 'Remember me' },
    signingIn: { zh: '登录中…', en: 'Signing in…' },
    loginBtn: { zh: '登录', en: 'Login' },
    noAccount: { zh: '还没有账号？', en: "Don't have an account?" },
    signUp: { zh: '注册', en: 'Sign Up' },
    thirdPartyDivider: { zh: '或使用第三方账号登录', en: 'or continue with' },
    google: { zh: 'Google', en: 'Google' },
    apple: { zh: 'Apple ID', en: 'Apple ID' },
    wechat: { zh: '微信', en: 'WeChat' },
    wechatUnavailable: { zh: '请先安装微信客户端', en: 'WeChat client not installed' },
    thirdPartySoon: { zh: '第三方登录暂未开放', en: 'Third-party login is not yet available' },
  },

  // ====== SignUp ======
  signup: {
    title: { zh: '注册', en: 'Sign Up' },
    tabEmail: { zh: '邮箱', en: 'Email' },
    tabPhone: { zh: '手机号', en: 'Phone' },
    email: { zh: '邮箱', en: 'Email' },
    emailRequired: { zh: '请输入邮箱。', en: 'Email is required.' },
    emailInvalid: { zh: '请输入有效的邮箱地址。', en: 'Please enter a valid email.' },
    emailExists: { zh: '该邮箱已被注册。', en: 'This email is already registered.' },
    phone: { zh: '手机号', en: 'Phone Number' },
    phonePlaceholder: { zh: '请输入手机号', en: 'Enter phone number' },
    phoneRequired: { zh: '请输入手机号。', en: 'Phone number is required.' },
    phoneInvalid: { zh: '请输入有效的手机号。', en: 'Please enter a valid phone number.' },
    phoneExists: { zh: '该手机号已被注册。', en: 'This phone number is already registered.' },
    phoneNotSupported: { zh: '暂不支持手机号注册，请使用邮箱。', en: 'Phone sign-up is not supported yet, please use email.' },
    countryCode: { zh: '+86', en: '+86' },
    nickname: { zh: '昵称', en: 'Nickname' },
    nicknamePlaceholder: { zh: '你的显示名称', en: 'Your display name' },
    nicknameRequired: { zh: '请输入昵称。', en: 'Nickname is required.' },
    nicknameLong: { zh: '昵称不能超过20个字符。', en: 'Nickname must be 20 characters or fewer.' },
    password: { zh: '密码', en: 'Password' },
    passwordPlaceholder: { zh: '8-20位，含字母和数字', en: '8-20 chars, letters & digits' },
    passwordRequired: { zh: '请输入密码。', en: 'Password is required.' },
    passwordShort: { zh: '密码需 8-20 位，且同时包含字母和数字。', en: 'Password must be 8-20 chars with letters and digits.' },
    showPassword: { zh: '显示密码', en: 'Show password' },
    hidePassword: { zh: '隐藏密码', en: 'Hide password' },
    recoveryQuestion: { zh: '安全问题', en: 'Recovery Question' },
    questionPlaceholder: { zh: '如：你的第一只宠物叫什么？', en: 'e.g. What was your first pet\'s name?' },
    questionRequired: { zh: '请输入安全问题。', en: 'Recovery question is required.' },
    recoveryAnswer: { zh: '答案', en: 'Answer' },
    answerPlaceholder: { zh: '输入问题的答案', en: 'Enter your answer' },
    answerRequired: { zh: '请输入安全问题的答案。', en: 'Recovery answer is required.' },
    recoveryHint: { zh: '用于账号恢复和忘记密码时验证身份。', en: 'Used for account recovery and password reset.' },
    creating: { zh: '创建中…', en: 'Creating…' },
    signUpBtn: { zh: '注册', en: 'Sign Up' },
    hasAccount: { zh: '已有账号？', en: 'Already have an account?' },
    login: { zh: '登录', en: 'Login' },
  },

  // ====== Forgot Password ======
  forgot: {
    title: { zh: '重置密码', en: 'Reset' },
    email: { zh: '邮箱', en: 'Email' },
    emailRequired: { zh: '请输入邮箱。', en: 'Email is required.' },
    emailInvalid: { zh: '请输入有效的邮箱地址。', en: 'Please enter a valid email.' },
    emailNotFound: { zh: '未找到该邮箱对应的账号。', en: 'No account found with this email.' },
    noQuestion: { zh: '该账号未设置安全问题，无法重置密码。', en: 'This account has no recovery question set, unable to reset password.' },
    next: { zh: '下一步', en: 'Next' },
    loadingQuestion: { zh: '加载中…', en: 'Loading…' },
    recoveryQuestion: { zh: '安全问题', en: 'Recovery Question' },
    recoveryAnswer: { zh: '答案', en: 'Answer' },
    answerPlaceholder: { zh: '输入问题的答案', en: 'Enter your answer' },
    answerRequired: { zh: '请输入安全问题的答案。', en: 'Recovery answer is required.' },
    answerIncorrect: { zh: '答案不正确。', en: 'Incorrect answer.' },
    newPassword: { zh: '新密码', en: 'New Password' },
    passwordPlaceholder: { zh: '8-20位，含字母和数字', en: '8-20 chars, letters & digits' },
    passwordRequired: { zh: '请输入新密码。', en: 'New password is required.' },
    passwordShort: { zh: '密码需 8-20 位，且同时包含字母和数字。', en: 'Password must be 8-20 chars with letters and digits.' },
    showPassword: { zh: '显示密码', en: 'Show password' },
    hidePassword: { zh: '隐藏密码', en: 'Hide password' },
    resetting: { zh: '重置中…', en: 'Resetting…' },
    resetBtn: { zh: '重置密码', en: 'Reset Password' },
    rememberPassword: { zh: '想起密码了？', en: 'Remember your password?' },
    login: { zh: '登录', en: 'Login' },
    successMsg: { zh: '密码已成功重置，正在为你自动登录…', en: 'Password reset successful, logging you in…' },
    backToLogin: { zh: '返回登录', en: 'Back to Login' },
  },

  // ====== Home ======
  home: {
    welcome: { zh: '欢迎回来', en: 'Welcome Back' },
    feelToday: { zh: '今天\n心情如何？', en: 'How are you feeling\ntoday?' },
    focusTitle: { zh: '开启你的专注之旅\n就在此刻', en: 'Begin your focus journey\nRight Now' },
    startBtn: { zh: '开始', en: 'Start' },
    recommended: { zh: '推荐', en: 'Recommended' },
    favorites: { zh: '收藏', en: 'Favorites' },
    mixTitle: { zh: '混合属于你的\n独特声音', en: 'Mix your own unique\nsound' },
    mixSpace: { zh: '调音空间', en: 'Mix Space' },
    blog: { zh: '博客', en: 'Blog' },
  },

  // ====== Library ======
  library: {
    title: { zh: '音乐库', en: 'Library' },
    tabOfficial: { zh: '官方', en: 'Official' },
    tabMine: { zh: '我的混音', en: 'My Mixes' },
    tabFav: { zh: '收藏', en: 'Favorites' },
    searchPlaceholder: { zh: '名称/标签/风格', en: 'name/ tag / genre / style' },
    noPresets: { zh: '还没有创建预设', en: 'No presets created' },
    createPreset: { zh: '创建新预设', en: 'Create a new preset' },
    noFavorites: { zh: '还没有收藏', en: 'No favorites yet' },
    discover: { zh: '去发现', en: 'Discover' },
    deleteMix: { zh: '删除混音', en: 'Delete Mix' },
    deleteMixConfirm: { zh: '确定要删除这个预设吗？此操作不可撤销。', en: 'Are you sure you want to delete this preset? This action cannot be undone.' },
    unfavorite: { zh: '取消收藏', en: 'Unfavorite' },
  },

  // ====== Gallery ======
  gallery: {
    title: { zh: '画廊', en: 'Gallery' },
    tabAll: { zh: '全部', en: 'All' },
    tabComplete: { zh: '已完成', en: 'Complete' },
    tabPartial: { zh: '未完成', en: 'Incomplete' },
    empty: { zh: '开始你的第一次专注\n生成你的第一幅作品', en: 'Begin your first focus\nGenerate your first artwork' },
    fragment: { zh: '残卷', en: 'Fragment' },
    distracted: { zh: '分心', en: 'Distracted' },
    abandoned: { zh: '放弃', en: 'Abandoned' },
    at: { zh: '于', en: 'at' },
    min: { zh: '分钟', en: 'min' },
    artwork: { zh: '作品', en: 'Artwork' },
    incompleteArtwork: { zh: '未完成作品', en: 'Incomplete Artwork' },
    viewDetail: { zh: '查看详情', en: 'View Detail' },
    deleteArtwork: { zh: '删除作品', en: 'Delete Artwork' },
    deleteConfirm: { zh: '确定要删除这幅作品吗？此操作不可撤销。', en: 'Are you sure you want to delete this artwork? This action cannot be undone.' },
  },

  // ====== Focus Config ======
  focusConfig: {
    duration: { zh: '时长 · 分钟', en: 'Duration · Minutes' },
    choosePreset: { zh: '选择一个音乐预设', en: 'Choose a music preset' },
    tapToChoose: { zh: '点击选择', en: 'Tap to choose' },
    bestWithHeadphones: { zh: '建议佩戴耳机', en: 'Best with Headphones' },
    beginFocus: { zh: '开始专注', en: 'Begin Focus' },
    cancel: { zh: '取消', en: 'Cancel' },
    selectMix: { zh: '选择混音', en: 'Select Mix' },
    noPresets: { zh: '暂无预设，请先在调音空间创建', en: 'No presets available, please create one in the mix space' },
    mixSpace: { zh: '调音空间', en: 'Mix Space' },
    wave: { zh: '波', en: 'Wave' },
  },

  // ====== Profile ======
  profile: {
    activity: { zh: '活动', en: 'Activity' },
    dayStreak: { zh: '天连续', en: 'day streak' },
    totalFocus: { zh: '总专注', en: 'Total Focus' },
    sessions: { zh: '次数', en: 'Sessions' },
    streak: { zh: '连续', en: 'Streak' },
    longestStreak: { zh: '最长连续', en: 'Longest Streak' },
    focusSettings: { zh: '专注设置', en: 'Focus' },
    screenDown: { zh: '强制屏幕朝下', en: 'Force Screen Downward' },
    doNotDisturb: { zh: '勿扰模式', en: 'Do Not Disturb' },
    completionNotice: { zh: '专注完成通知', en: 'Focus Completion Notice' },
    accountSecurity: { zh: '账号与安全', en: 'Account & Security' },
    changePassword: { zh: '修改密码', en: 'Change Password' },
    linkedAccounts: { zh: '绑定账号', en: 'Linked Accounts' },
    deactivate: { zh: '注销账号', en: 'Deactivate Account' },
    about: { zh: '关于', en: 'About' },
    version: { zh: '当前版本', en: 'Current Version' },
    terms: { zh: '服务条款', en: 'Terms of Service' },
    privacy: { zh: '隐私政策', en: 'Privacy Policy' },
    feedback: { zh: '意见反馈', en: 'Feedback' },
    logout: { zh: '退出登录', en: 'Logout' },
    language: { zh: '语言', en: 'Language' },
    logoutTitle: { zh: '退出登录', en: 'Logout' },
    logoutConfirm: { zh: '确定要退出登录吗？你的专注数据将保留在此设备上。', en: 'Are you sure you want to log out? Your focus data will be kept on this device.' },
    sessionsUnit: { zh: '次', en: 'session' },
    galleryArtworks: { zh: '作品数', en: 'Artworks' },
  },

  // ====== Settings Page ======
  settings: {
    changePassword: { zh: '修改密码', en: 'Change Password' },
    linkedAccounts: { zh: '绑定账号', en: 'Linked Accounts' },
    deactivate: { zh: '注销账号', en: 'Deactivate Account' },
    settingsTitle: { zh: '设置', en: 'Settings' },
    currentPassword: { zh: '当前密码', en: 'Current Password' },
    currentPasswordPlaceholder: { zh: '输入当前密码（可选）', en: 'Enter current password (optional)' },
    newPassword: { zh: '新密码', en: 'New Password' },
    newPasswordPlaceholder: { zh: '至少6个字符', en: 'At least 6 characters' },
    confirmPassword: { zh: '确认新密码', en: 'Confirm New Password' },
    confirmPlaceholder: { zh: '再次输入新密码', en: 'Re-enter new password' },
    fillAllFields: { zh: '请填写所有字段', en: 'Please fill in all fields' },
    passwordsNotMatch: { zh: '两次密码不一致', en: 'Passwords do not match' },
    passwordShort: { zh: '密码至少需要6个字符', en: 'Password must be at least 6 characters' },
    updating: { zh: '更新中…', en: 'Updating…' },
    updatePassword: { zh: '更新密码', en: 'Update Password' },
    passwordChanged: { zh: '密码已修改 ✓', en: 'Password changed ✓' },
    email: { zh: '邮箱', en: 'Email' },
    phone: { zh: '手机', en: 'Phone' },
    google: { zh: 'Google', en: 'Google' },
    appleId: { zh: 'Apple ID', en: 'Apple ID' },
    notBound: { zh: '未绑定', en: 'Not bound' },
    primary: { zh: '主账号', en: 'Primary' },
    link: { zh: '绑定', en: 'Link' },
    unlink: { zh: '解绑', en: 'Unlink' },
    linkedSuccess: { zh: '已绑定 ✓', en: 'linked ✓' },
    unlinked: { zh: '已解绑', en: 'unlinked' },
    enterValue: { zh: '请输入内容', en: 'Please enter a value' },
    invalidPhone: { zh: '请输入有效的手机号', en: 'Please enter a valid phone number' },
    phoneNumber: { zh: '手机号', en: 'Phone Number' },
    accountId: { zh: '账号ID', en: 'Account ID' },
    linkPhone: { zh: '绑定手机', en: 'Link Phone' },
    linkGoogle: { zh: '绑定Google', en: 'Link Google' },
    linkApple: { zh: '绑定Apple ID', en: 'Link Apple ID' },
    deactivateDesc: { zh: '注销账号将永久删除你所有的专注数据、作品和预设。此操作不可撤销。', en: 'Deactivating your account will permanently delete all your focus data, artworks, and presets. This action cannot be undone.' },
    deactivateConfirm: { zh: '如果你确定，请在下方确认。', en: "If you're sure, please confirm below." },
    deactivateBtn: { zh: '注销我的账号', en: 'Deactivate My Account' },
    confirmDeactivation: { zh: '确认注销', en: 'Confirm Deactivation' },
    confirmDeactivationDesc: { zh: '这将永久删除你的账号和所有数据。你确定吗？', en: 'This will permanently delete your account and all data. Are you absolutely sure?' },
    deleteForever: { zh: '永久删除', en: 'Delete Forever' },
    confirmDeactivateType: { zh: '请输入"确认注销"以继续', en: 'Type "CONFIRM" to continue' },
    confirmDeactivateMatch: { zh: '确认注销', en: 'CONFIRM' },
    confirmDeactivateMismatch: { zh: '输入内容不匹配，请重新输入。', en: 'Input does not match. Please try again.' },
    currentPasswordRequired: { zh: '请输入当前密码。', en: 'Current password is required.' },
    currentPasswordIncorrect: { zh: '当前密码不正确。', en: 'Current password is incorrect.' },
  },

  // ====== About Page ======
  about: {
    terms: { zh: '服务条款', en: 'Terms of Service' },
    privacy: { zh: '隐私政策', en: 'Privacy Policy' },
    feedback: { zh: '意见反馈', en: 'Feedback' },
    about: { zh: '关于', en: 'About' },
    yourFeedback: { zh: '你的反馈', en: 'Your Feedback' },
    feedbackPlaceholder: { zh: '告诉我们你的想法，或报告问题…', en: 'Tell us what you think, or report an issue...' },
    sendFeedback: { zh: '发送反馈', en: 'Send Feedback' },
    enterFeedback: { zh: '请输入反馈内容', en: 'Please enter your feedback' },
    feedbackSent: { zh: '反馈已发送 ✓', en: 'Feedback sent ✓' },
    version: { zh: '版本 0.1.0', en: 'Version 0.1.0' },
    desc: { zh: '一个将你的注意力转化为艺术的隐形专注工具。一笔一画，描绘你的宁静。', en: 'An invisible focus tool that turns your attention into art. Draw your stillness, one curve at a time.' },
  },

  // ====== Blog ======
  blog: {
    title: { zh: '博客', en: 'Blog' },
    article: { zh: '文章', en: 'Article' },
    articleNotFound: { zh: '文章未找到', en: 'Article not found' },
    allArticles: { zh: '全部文章', en: 'All Articles' },
    backHome: { zh: '返回首页', en: 'Back Home' },
  },

  // ====== Artwork Detail (partial - key texts) ======
  artwork: {
    fragment: { zh: '残卷', en: 'Fragment' },
    distracted: { zh: '分心中断', en: 'Distracted' },
    abandoned: { zh: '主动放弃', en: 'Abandoned' },
    complete: { zh: '已完成', en: 'Complete' },
    min: { zh: '分钟', en: 'min' },
    artworkNotFound: { zh: '作品未找到', en: 'Artwork not found' },
    date: { zh: '日期', en: 'Date' },
    duration: { zh: '时长', en: 'Duration' },
    curve: { zh: '曲线', en: 'Curve' },
    mix: { zh: '混音', en: 'Mix' },
    status: { zh: '状态', en: 'Status' },
    shared: { zh: '已分享 ✓', en: 'Shared ✓' },
    shareFailed: { zh: '分享失败', en: 'Share failed' },
    savedToDevice: { zh: '已保存到设备 ✓', en: 'Saved to device ✓' },
    saveFailed: { zh: '保存失败', en: 'Save failed' },
    shareArtwork: { zh: '分享作品', en: 'Share Artwork' },
    shareArtworkOnly: { zh: '仅分享作品', en: 'Share Artwork Only' },
    shareWithQuote: { zh: '分享并附摘录', en: 'Share with Quote' },
    myArtwork: { zh: '我的希音作品', en: 'My Healing Artwork' },
    at: { zh: '于', en: 'at' },
  },

  // ====== Mixer (key texts) ======
  mixer: {
    title: { zh: '调音空间', en: 'Mix Space' },
    clear: { zh: '清除', en: 'Clear' },
    cleared: { zh: '已清除', en: 'Cleared' },
    mainMusic: { zh: '主音乐', en: 'Main Music' },
    noiseAmbience: { zh: '噪音与氛围', en: 'Noise & Ambience' },
    binauralBeats: { zh: '双耳节拍', en: 'Binaural Beats' },
    mute: { zh: '静音', en: 'Mute' },
    selectMain: { zh: '选择主音乐', en: 'Select a main music.' },
    selectNoise: { zh: '选择噪音/氛围音', en: 'Select noise / ambient.' },
    selectBinaural: { zh: '选择双耳节拍', en: 'Select a binaural beat.' },
    noBgNoise: { zh: '无背景噪音', en: 'No background noise' },
    headphonesRec: { zh: '建议佩戴耳机', en: 'Headphones recommended' },
    wave: { zh: '波', en: 'Wave' },
    save: { zh: '保存', en: 'Save' },
    beginFocus: { zh: '开始专注', en: 'Begin Focus' },
    selectMainMusic: { zh: '选择主音乐', en: 'Select Main Music' },
    searchMusic: { zh: '搜索音乐…', en: 'Search music...' },
    noMusicFound: { zh: '未找到音乐', en: 'No music found' },
    backgroundNoise: { zh: '背景噪音', en: 'Background Noise' },
    atmosphere: { zh: '氛围音', en: 'Atmosphere' },
    selected: { zh: '已选', en: 'selected' },
    done: { zh: '完成', en: 'Done' },
    none: { zh: '无', en: 'None' },
    saveMixPreset: { zh: '保存混音预设', en: 'Save Mix Preset' },
    presetNamePrompt: { zh: '给你的预设起个名字', en: 'Give your preset a name.' },
    presetNamePlaceholder: { zh: '如：午后阅读', en: 'e.g. Afternoon Reading' },
    cancel: { zh: '取消', en: 'Cancel' },
    presetSaved: { zh: '预设已保存 ✓', en: 'Preset saved ✓' },
    selectMainFirst: { zh: '请先选择主音乐', en: 'Please select a main music.' },
    nameExists: { zh: '名称已存在', en: 'Name Already Exists' },
    nameExistsDesc: { zh: '名为 "{name}" 的预设已存在。要覆盖还是重命名？', en: 'A preset named "{name}" already exists. Do you want to overwrite it or rename?' },
    overwrite: { zh: '覆盖', en: 'Overwrite' },
    rename: { zh: '重命名', en: 'Rename' },
    unsavedChanges: { zh: '未保存的更改', en: 'Unsaved Changes' },
    unsavedDesc: { zh: '当前混音配置有未保存的更改，你想怎么做？', en: 'Your current mix configuration has unsaved changes. What would you like to do?' },
    saveAndStart: { zh: '保存并开始', en: 'Save & Start' },
    justStart: { zh: '直接开始', en: 'Just Start' },
    untitled: { zh: '未命名', en: 'Untitled' },
  },

  // ====== Focus Session (key texts) ======
  focusSession: {
    focusComplete: { zh: '专注完成', en: 'Focus Complete' },
    keepIt: { zh: '保留', en: 'Keep It' },
    abandon: { zh: '放弃', en: 'Abandon' },
    abandonBtn: { zh: '放弃', en: 'ABANDON' },
    elapsedTime: { zh: '已用时间', en: 'Elapsed' },
    remaining: { zh: '剩余', en: 'Remaining' },
    placeDown: { zh: '请将手机屏幕朝下放置', en: 'Place your phone face down' },
    flipOver: { zh: '翻过手机继续', en: 'Flip over to continue' },
    distractDetected: { zh: '检测到分心', en: 'Distraction Detected' },
    putDownPhone: { zh: '放下手机', en: 'Put phone down' },
    focusInterrupted: { zh: '专注已中断', en: 'Focus Interrupted' },
    min: { zh: '分', en: 'min' },
    sec: { zh: '秒', en: 'sec' },
    abandonTitle: { zh: '放弃专注', en: 'Abandon Focus Session' },
    abandonConfirm: { zh: '确定要放弃这次专注吗？', en: 'Are you sure you want to abandon this focus session?' },
    continueFocus: { zh: '继续专注', en: 'Continue Focus' },
    bestWithHeadphones: { zh: '建议佩戴耳机', en: 'Best with Headphones' },
    save: { zh: '保存', en: 'Save' },
    inkFlow: { zh: '墨韵', en: 'Ink Flow' },
    fragmentDistracted: { zh: '残卷 · 分心中断', en: 'Fragment · Distracted' },
    fragmentAbandoned: { zh: '残卷 · 主动放弃', en: 'Fragment · Abandoned' },
    atMin: { zh: '分钟', en: 'min' },
  },

  // ====== Player (key texts) ======
  player: {
    favorite: { zh: '收藏', en: 'Favorite' },
    unfavorite: { zh: '取消收藏', en: 'Unfavorite' },
    addToMix: { zh: '加入混音', en: 'Add to Mix' },
    music: { zh: '音乐', en: 'Music' },
    upNext: { zh: '播放队列', en: 'Up Next' },
    order: { zh: '顺序播放', en: 'Order' },
    repeatOne: { zh: '单曲循环', en: 'Repeat One' },
    shuffle: { zh: '随机播放', en: 'Shuffle' },
    tapToPlay: { zh: '点击播放', en: 'Tap to Play' },
    bestWithHeadphones: { zh: '建议佩戴耳机', en: 'Best with Headphones' },
  },

  // ====== Nickname Setup (首次登录昵称设置) ======
  nicknameSetup: {
    title: { zh: '设置你的昵称', en: 'Set Your Nickname' },
    desc: { zh: '欢迎加入希音，为自己起一个名字吧。', en: 'Welcome to Healing. Pick a name for yourself.' },
    nicknamePlaceholder: { zh: '你的显示名称', en: 'Your display name' },
    uploadAvatar: { zh: '点击上传头像', en: 'Tap to upload avatar' },
    complete: { zh: '完成', en: 'Done' },
    skip: { zh: '跳过', en: 'Skip' },
    nicknameRequired: { zh: '请输入昵称。', en: 'Nickname is required.' },
    nicknameLong: { zh: '昵称不能超过20个字符。', en: 'Nickname must be 20 characters or fewer.' },
  },
}

/**
 * 翻译函数
 * @param {string} lang - 'zh' | 'en'
 * @param {string} key - 点分路径，如 'nav.home'
 * @param {object} [params] - 可选的插值参数
 * @returns {string}
 */
export function translate(lang, key, params) {
  const parts = key.split('.')
  let val = translations
  for (const p of parts) {
    val = val?.[p]
    if (val === undefined) break
  }
  if (val === undefined || val === null) {
    console.warn(`[i18n] Missing translation: ${key} (${lang})`)
    return key
  }
  let text = val[lang] ?? val[DEFAULT_LANG] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return text
}
