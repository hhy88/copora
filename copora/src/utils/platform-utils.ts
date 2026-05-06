export function getPlatform(): 'windows' | 'macos' | 'linux' {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'macos'
  if (ua.includes('win')) return 'windows'
  return 'linux'
}

export function isMac(): boolean {
  return getPlatform() === 'macos'
}

export function getLineEnding(): 'crlf' | 'lf' {
  return getPlatform() === 'windows' ? 'crlf' : 'lf'
}

export function getHomeDir(): string {
  return '/'
}

export function formatShortcut(shortcut: string): string {
  if (isMac()) {
    return shortcut
      .replace(/\bCtrl\b/g, '⌘')
      .replace(/\bAlt\b/g, '⌥')
      .replace(/\bShift\b/g, '⇧')
  }
  return shortcut
}
