import { useState } from 'react'
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react'

const FolderTree = ({ folders, selectedFolder, onFolderSelect }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set())

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFolder = (folder, level = 0) => {
    const hasChildren = folder.children && folder.children.length > 0
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolder?.id === folder.id

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center px-2 py-1 cursor-pointer hover:bg-gray-100 rounded ${
            isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onFolderSelect(folder)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFolder(folder.id)
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4 mr-1" />}
          
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
          ) : (
            <Folder className="w-4 h-4 mr-2 text-gray-500" />
          )}
          
          <span className="text-sm truncate">{folder.name}</span>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {folder.children.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <button
          onClick={() => onFolderSelect(null)}
          className={`flex items-center w-full px-2 py-1 text-left cursor-pointer hover:bg-gray-100 rounded ${
            !selectedFolder ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
        >
          <Folder className="w-4 h-4 mr-2 text-gray-500" />
          <span className="text-sm">All Notes</span>
        </button>
      </div>
      
      <div className="space-y-1">
        {folders.map((folder) => renderFolder(folder))}
      </div>
    </div>
  )
}

export default FolderTree
