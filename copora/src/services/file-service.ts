import type { FileNode } from '../types'
import { generateId } from '../utils/string-utils'

interface StoredFileHandle {
  handle: FileSystemFileHandle
  path: string
  name: string
}

const handleMap = new Map<string, StoredFileHandle>()

function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

async function readFileContent(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile()
  return file.text()
}

export async function openFile(): Promise<{ path: string; content: string; name: string } | null> {
  if (!isFileSystemAccessSupported()) {
    return openFileFallback()
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md', '.markdown', '.txt'] },
        },
      ],
      multiple: false,
    })
    const content = await readFileContent(handle)
    const path = handle.name
    const name = handle.name
    handleMap.set(path, { handle, path, name })
    return { path, content, name }
  } catch {
    return null
  }
}

function openFileFallback(): Promise<{ path: string; content: string; name: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.txt'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) {
        resolve(null)
        return
      }
      const content = await file.text()
      resolve({ path: file.name, content, name: file.name })
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

export async function openFolder(): Promise<{ path: string; name: string } | null> {
  if (!isFileSystemAccessSupported()) {
    return null
  }
  try {
    const handle = await window.showDirectoryPicker()
    return { path: handle.name, name: handle.name }
  } catch {
    return null
  }
}

export async function saveFile(path: string, content: string): Promise<void> {
  const stored = handleMap.get(path)
  if (stored) {
    const writable = await stored.handle.createWritable()
    await writable.write(content)
    await writable.close()
    return
  }
  await saveFileAs(content, path)
}

export async function saveFileAs(
  content: string,
  suggestedName: string
): Promise<{ path: string; name: string } | null> {
  if (!isFileSystemAccessSupported()) {
    return saveFileAsFallback(content, suggestedName)
  }
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName,
      types: [
        {
          description: 'Markdown files',
          accept: { 'text/markdown': ['.md'] },
        },
      ],
    })
    const writable = await handle.createWritable()
    await writable.write(content)
    await writable.close()
    const path = handle.name
    const name = handle.name
    handleMap.set(path, { handle, path, name })
    return { path, name }
  } catch {
    return null
  }
}

function saveFileAsFallback(
  content: string,
  suggestedName: string
): Promise<{ path: string; name: string } | null> {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = suggestedName
  a.click()
  URL.revokeObjectURL(url)
  return Promise.resolve({ path: suggestedName, name: suggestedName })
}

export async function readFileTree(
  dirHandle: FileSystemDirectoryHandle,
  depth: number = 10
): Promise<FileNode[]> {
  const nodes: FileNode[] = []
  if (!isFileSystemAccessSupported()) return nodes

  for await (const entry of dirHandle.values()) {
    const node: FileNode = {
      id: generateId(),
      name: entry.name,
      path: `${dirHandle.name}/${entry.name}`,
      isDir: entry.kind === 'directory',
    }
    if (entry.kind === 'directory' && depth > 0) {
      node.children = await readFileTree(entry as FileSystemDirectoryHandle, depth - 1)
    }
    nodes.push(node)
  }

  nodes.sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  return nodes
}

export const FileService = {
  openFile,
  openFolder,
  saveFile,
  saveFileAs,
  readFileTree,
}
