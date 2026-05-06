import { useState, useEffect, useRef, useCallback } from 'react'
import { useThemeStore, useAppStore, useEditorStore, useFileStore } from '../../stores'
import type { ThemeInfo } from '../../stores'
import './layout.css'

interface MenuItemDef {
  label: string
  shortcut?: string
  separator?: boolean
  checked?: boolean
  disabled?: boolean
  action?: () => void
}

interface MenuDef {
  id: string
  label: string
  items: MenuItemDef[]
}

function buildMenus(
  themes: ThemeInfo[],
  currentTheme: string,
  actions: {
    newFile: () => void
    openFile: () => void
    saveFile: () => void
    saveAs: () => void
    closeTab: () => void
    toggleSourceMode: () => void
    showSidePanel: (tab: 'files' | 'outline' | 'search') => void
    showExportModal: () => void
    showSettingsModal: () => void
    showAboutModal: () => void
    toggleFindReplace: () => void
  }
): MenuDef[] {
  return [
    {
      id: 'file',
      label: '文件(F)',
      items: [
        { label: '新建', shortcut: 'Ctrl+N', action: actions.newFile },
        { label: '打开', shortcut: 'Ctrl+O', action: actions.openFile },
        { label: '保存', shortcut: 'Ctrl+S', action: actions.saveFile },
        { label: '另存为', shortcut: 'Ctrl+Shift+S', action: actions.saveAs },
        { separator: true, label: '' },
        { label: '导出', action: actions.showExportModal },
        { separator: true, label: '' },
        { label: '关闭', shortcut: 'Ctrl+W', action: actions.closeTab },
      ],
    },
    {
      id: 'edit',
      label: '编辑(E)',
      items: [
        { label: '撤销', shortcut: 'Ctrl+Z' },
        { label: '重做', shortcut: 'Ctrl+Y' },
        { separator: true, label: '' },
        { label: '剪切', shortcut: 'Ctrl+X' },
        { label: '复制', shortcut: 'Ctrl+C' },
        { label: '粘贴', shortcut: 'Ctrl+V' },
        { separator: true, label: '' },
        { label: '查找', shortcut: 'Ctrl+F', action: actions.toggleFindReplace },
        { label: '替换', shortcut: 'Ctrl+H', action: actions.toggleFindReplace },
        { separator: true, label: '' },
        { label: '全选', shortcut: 'Ctrl+A' },
      ],
    },
    {
      id: 'paragraph',
      label: '段落(P)',
      items: [
        { label: '标题 1' },
        { label: '标题 2' },
        { label: '标题 3' },
        { label: '标题 4' },
        { label: '标题 5' },
        { label: '标题 6' },
        { separator: true, label: '' },
        { label: '增大标题级别' },
        { label: '减小标题级别' },
        { separator: true, label: '' },
        { label: '表格' },
        { label: '代码块' },
        { label: '数学块' },
        { label: '引用' },
      ],
    },
    {
      id: 'format',
      label: '格式(O)',
      items: [
        { label: '加粗', shortcut: 'Ctrl+B' },
        { label: '斜体', shortcut: 'Ctrl+I' },
        { label: '删除线' },
        { label: '高亮' },
        { separator: true, label: '' },
        { label: '上标' },
        { label: '下标' },
        { separator: true, label: '' },
        { label: '链接', shortcut: 'Ctrl+K' },
        { label: '图片' },
      ],
    },
    {
      id: 'view',
      label: '视图(V)',
      items: [
        { label: '文件树', action: () => actions.showSidePanel('files') },
        { label: '大纲', action: () => actions.showSidePanel('outline') },
        { separator: true, label: '' },
        { label: '源码模式', shortcut: 'Ctrl+/', action: actions.toggleSourceMode },
        { separator: true, label: '' },
        { label: '专注模式' },
        { label: '打字机模式' },
      ],
    },
    {
      id: 'theme',
      label: '主题(T)',
      items: themes.map((t) => ({
        label: t.name,
        checked: t.id === currentTheme,
        action: () => {
          useThemeStore.getState().setTheme(t.id)
        },
      })),
    },
    {
      id: 'preferences',
      label: '偏好设置(S)',
      items: [{ label: '偏好设置', shortcut: 'Ctrl+,', action: actions.showSettingsModal }],
    },
    {
      id: 'help',
      label: '帮助(H)',
      items: [
        { label: '关于', action: actions.showAboutModal },
        { separator: true, label: '' },
        { label: '快捷键参考' },
      ],
    },
  ]
}

export function MenuBar() {
  const availableThemes = useThemeStore((s) => s.availableThemes)
  const currentTheme = useThemeStore((s) => s.currentTheme)

  const newFile = useCallback(() => {
    const id = `untitled-${Date.now()}`
    useFileStore.getState().openFile({
      id,
      filePath: `/${id}.md`,
      fileName: '未命名.md',
      isModified: false,
      isPinned: false,
    })
    useFileStore.getState().updateContent('')
  }, [])

  const openFile = useCallback(async () => {
    try {
      const { FileService } = await import('../../services/file-service')
      const result = await FileService.openFile()
      if (result) {
        useFileStore.getState().openFile({
          id: result.path,
          filePath: result.path,
          fileName: result.name,
          isModified: false,
          isPinned: false,
        })
        useFileStore.getState().updateContent(result.content)
        useFileStore.getState().addRecentFile(result.path, result.name)
      }
    } catch {}
  }, [])

  const saveFile = useCallback(() => {
    const { activeTabId, content } = useFileStore.getState()
    if (activeTabId) {
      useFileStore.getState().markModified(activeTabId, false)
    }
  }, [])

  const saveAs = useCallback(() => {}, [])

  const closeTab = useCallback(() => {
    const { activeTabId } = useFileStore.getState()
    if (activeTabId) {
      useFileStore.getState().closeTab(activeTabId)
    }
  }, [])

  const toggleSourceMode = useCallback(() => {
    const { mode } = useEditorStore.getState()
    if (mode === 'wysiwyg') {
      useEditorStore.getState().setMode('source')
    } else {
      useEditorStore.getState().setMode('wysiwyg')
    }
  }, [])

  const showSidePanel = useCallback((tab: 'files' | 'outline' | 'search') => {
    const { sidePanelVisible } = useAppStore.getState()
    useAppStore.getState().setSidePanelTab(tab)
    if (!sidePanelVisible) {
      useAppStore.getState().toggleSidePanel()
    }
  }, [])

  const showExportModal = useCallback(() => {
    useAppStore.getState().showModal('export')
  }, [])

  const showSettingsModal = useCallback(() => {
    useAppStore.getState().showModal('settings')
  }, [])

  const showAboutModal = useCallback(() => {
    useAppStore.getState().showModal('about')
  }, [])

  const toggleFindReplace = useCallback(() => {
    const { findReplace } = useEditorStore.getState()
    useEditorStore.getState().toggleFindReplace()
    if (!findReplace.visible) {
      showSidePanel('search')
    }
  }, [showSidePanel])

  const menus = buildMenus(availableThemes, currentTheme, {
    newFile,
    openFile,
    saveFile,
    saveAs,
    closeTab,
    toggleSourceMode,
    showSidePanel,
    showExportModal,
    showSettingsModal,
    showAboutModal,
    toggleFindReplace,
  })

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const menuBarRef = useRef<HTMLDivElement>(null)

  const openMenu = useCallback((menuId: string) => {
    setOpenMenuId(menuId)
    setFocusedIndex(0)
  }, [])

  const closeMenu = useCallback(() => {
    setOpenMenuId(null)
    setFocusedIndex(0)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        closeMenu()
      }
    }
    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openMenuId, closeMenu])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (openMenuId === null) return

      const currentMenu = menus.find((m) => m.id === openMenuId)
      if (!currentMenu) return

      const visibleItems = currentMenu.items.filter((i) => !i.separator)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((prev) =>
          prev < visibleItems.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : visibleItems.length - 1
        )
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const menuIndex = menus.findIndex((m) => m.id === openMenuId)
        if (menuIndex > 0) {
          openMenu(menus[menuIndex - 1].id)
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        const menuIndex = menus.findIndex((m) => m.id === openMenuId)
        if (menuIndex < menus.length - 1) {
          openMenu(menus[menuIndex + 1].id)
        }
      } else if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const focusedItem = visibleItems[focusedIndex]
        if (focusedItem && !focusedItem.disabled && focusedItem.action) {
          focusedItem.action()
          closeMenu()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openMenuId, focusedIndex, menus, openMenu, closeMenu])

  function handleMenuClick(menuId: string) {
    if (openMenuId === menuId) {
      closeMenu()
    } else {
      openMenu(menuId)
    }
  }

  function handleMenuHover(menuId: string) {
    if (openMenuId !== null) {
      openMenu(menuId)
    }
  }

  let visibleItemCounter = 0

  return (
    <div className="menu-bar" ref={menuBarRef}>
      {menus.map((menu) => (
        <div
          key={menu.id}
          className={`menu-item${openMenuId === menu.id ? ' menu-item-active' : ''}`}
          onClick={() => handleMenuClick(menu.id)}
          onMouseEnter={() => handleMenuHover(menu.id)}
        >
          {menu.label}
          {openMenuId === menu.id && (
            <div className="menu-dropdown">
              {(() => {
                visibleItemCounter = -1
                return menu.items.map((item, idx) => {
                  if (item.separator) {
                    return <div key={idx} className="menu-separator" />
                  }
                  visibleItemCounter++
                  const visibleIdx = visibleItemCounter
                  return (
                    <div
                      key={idx}
                      className={`menu-dropdown-item${
                        item.disabled ? ' menu-dropdown-item-disabled' : ''
                      }${visibleIdx === focusedIndex ? ' menu-dropdown-item-focused' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (!item.disabled && item.action) {
                          item.action()
                          closeMenu()
                        }
                      }}
                      onMouseEnter={() => setFocusedIndex(visibleIdx)}
                    >
                      <span className="menu-dropdown-item-label">
                        {item.checked !== undefined && (
                          <span className="menu-dropdown-item-check">
                            {item.checked ? '✓' : ''}
                          </span>
                        )}
                        {item.label}
                      </span>
                      {item.shortcut && (
                        <span className="menu-dropdown-item-shortcut">
                          {item.shortcut}
                        </span>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
