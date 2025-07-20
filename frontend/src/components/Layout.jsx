import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FileText, ChevronRight, ChevronDown, Folder, FolderOpen, Plus, Search, MoreHorizontal, Edit, Trash2, X, Archive } from 'lucide-react'
import { foldersApi, notesApi } from '../services/api'
import { useSearch } from '../contexts/SearchContext'
import MiniCalendar from './MiniCalendar'

const Layout = ({ children, onNotesChange, sharedNotes = [] }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { searchQuery, updateSearchQuery, filteredNotes, updateNotes, hasSearchQuery } = useSearch()
  const [folders, setFolders] = useState([])
  const [notes, setNotes] = useState([])
  const [expandedFolders, setExpandedFolders] = useState(new Set())
  const [draggedNote, setDraggedNote] = useState(null)
  const [dragOverFolder, setDragOverFolder] = useState(null)
  const [showNewFolderForm, setShowNewFolderForm] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [activeContextMenu, setActiveContextMenu] = useState(null)
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 })
  const [renamingFolder, setRenamingFolder] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [activeNoteMenu, setActiveNoteMenu] = useState(null)
  const [noteMenuPosition, setNoteMenuPosition] = useState({ top: 0, left: 0 })

  useEffect(() => {
    console.log('Layout.jsx initial load')
    loadFolders()
    loadNotes()
  }, [])

  // Sync with shared notes from parent
  useEffect(() => {
    console.log('Layout.jsx syncing with shared notes:', sharedNotes.length, 'notes')
    setNotes(sharedNotes)
    updateNotes(sharedNotes) // Update search context too
  }, [sharedNotes])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.context-menu') && !event.target.closest('button')) {
        setActiveContextMenu(null)
        setActiveNoteMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeContextMenu && !event.target.closest('.context-menu') && !event.target.closest('.folder-menu-btn')) {
        setActiveContextMenu(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeContextMenu])

  const loadFolders = async () => {
    try {
      const response = await foldersApi.getAll()
      setFolders(response.data)
    } catch (error) {
      // Only log non-network errors to avoid console spam
      if (error.message !== 'API_UNAVAILABLE') {
        console.error('Error loading folders:', error)
      }
      // Load from localStorage if API is not available
      const savedFolders = localStorage.getItem('todoTool_folders')
      if (savedFolders) {
        setFolders(JSON.parse(savedFolders))
      } else {
        setFolders([])
      }
    }
  }

  // Get all folders excluding static folders like "Archived Notes"
  const getAllFolders = () => {
    const filtered = folders.filter(folder => folder.name !== 'Archived Notes')
    console.log('getAllFolders:', 'total folders:', folders.length, 'filtered:', filtered.length)
    console.log('Folders:', folders.map(f => ({ id: f.id, name: f.name })))
    return filtered
  }

  const loadNotes = async () => {
    try {
      console.log('Layout.jsx loadNotes called')
      const response = await notesApi.getAll()
      console.log('Layout.jsx API response:', response.data.length, 'notes')
      setNotes(response.data)
      updateNotes(response.data) // Update search context
      // Notify parent component about notes change
      if (onNotesChange) {
        console.log('Layout.jsx notifying parent with', response.data.length, 'notes')
        onNotesChange(response.data)
      }
    } catch (error) {
      // Only log non-network errors to avoid console spam
      if (error.message !== 'API_UNAVAILABLE') {
        console.error('Error loading notes:', error)
      }
      // Load from localStorage if API fails
      const savedNotes = localStorage.getItem('todoTool_notes')
      if (savedNotes) {
        const notes = JSON.parse(savedNotes)
        setNotes(notes)
        updateNotes(notes)
        // Notify parent component about notes change
        if (onNotesChange) {
          onNotesChange(notes)
        }
      } else {
        setNotes([])
        updateNotes([])
        // Notify parent component about notes change
        if (onNotesChange) {
          onNotesChange([])
        }
      }
    }
  }

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    if (!newFolderName.trim()) return

    console.log('Creating folder:', newFolderName.trim())

    try {
      const response = await foldersApi.create({ name: newFolderName.trim() })
      console.log('Folder created successfully:', response)
      setNewFolderName('')
      setShowNewFolderForm(false)
      loadFolders()
    } catch (error) {
      console.error('Error creating folder:', error)
      // Create folder locally if API fails
      const newFolder = {
        id: Date.now(),
        name: newFolderName.trim(),
        created_at: new Date().toISOString(),
        notes: []
      }

      const updatedFolders = [...folders, newFolder]
      setFolders(updatedFolders)

      // Save to localStorage
      localStorage.setItem('todoTool_folders', JSON.stringify(updatedFolders))

      setNewFolderName('')
      setShowNewFolderForm(false)

      console.log('Folder created locally:', newFolder)
    }
  }

  const handleRenameFolder = async (folderId, newName) => {
    if (!newName.trim()) return

    try {
      await foldersApi.update(folderId, { name: newName.trim() })
      setRenamingFolder(null)
      setRenameValue('')
      setActiveContextMenu(null)
      loadFolders()
    } catch (error) {
      console.error('Error renaming folder:', error)
      // Rename locally if API fails
      const updatedFolders = folders.map(folder =>
        folder.id === folderId
          ? { ...folder, name: newName.trim() }
          : folder
      )
      setFolders(updatedFolders)
      localStorage.setItem('todoTool_folders', JSON.stringify(updatedFolders))
      setRenamingFolder(null)
      setRenameValue('')
      setActiveContextMenu(null)
      console.log('Folder renamed locally')
    }
  }

  const handleDeleteFolder = async (folderId) => {
    // Prevent deletion of static folders
    const folder = folders.find(f => f.id === folderId)
    if (folder && folder.name === 'Archived Notes') {
      alert('Cannot delete the Archived Notes folder. This is a system folder.')
      return
    }

    if (!confirm('Are you sure you want to delete this folder? Notes inside will become unorganized.')) {
      return
    }

    try {
      await foldersApi.delete(folderId)
      setActiveContextMenu(null)
      loadFolders()
      loadNotes() // Refresh notes to show them as unorganized
    } catch (error) {
      console.error('Error deleting folder:', error)
      // Delete locally if API fails
      const updatedFolders = folders.filter(folder => folder.id !== folderId)
      setFolders(updatedFolders)
      localStorage.setItem('todoTool_folders', JSON.stringify(updatedFolders))
      setActiveContextMenu(null)
      console.log('Folder deleted locally')
    }
  }

  const startRename = (folder) => {
    setRenamingFolder(folder.id)
    setRenameValue(folder.name)
    setActiveContextMenu(null)
  }

  const cancelRename = () => {
    setRenamingFolder(null)
    setRenameValue('')
  }

  const handleDragStart = (e, note) => {
    console.log('Drag started for note:', note.title)
    setDraggedNote(note)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', note.id)

    // Add visual feedback
    e.target.classList.add('dragging')
    document.body.classList.add('dragging-active')
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging')
    document.body.classList.remove('dragging-active')
    setDraggedNote(null)
    setDragOverFolder(null)
  }

  const handleDragOver = (e, folderId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverFolder(folderId)

    // Auto-expand folder when hovering over it for 800ms
    if (!expandedFolders.has(folderId)) {
      setTimeout(() => {
        if (dragOverFolder === folderId && draggedNote) {
          setExpandedFolders(prev => new Set([...prev, folderId]))
        }
      }, 800)
    }
  }

  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the folder area
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverFolder(null)
    }
  }

  const handleDrop = async (e, folderId) => {
    e.preventDefault()
    setDragOverFolder(null)
    document.body.classList.remove('dragging-active')

    if (!draggedNote) {
      console.log('No dragged note found')
      return
    }

    console.log('Dropping note:', draggedNote.title, 'into folder:', folderId)

    try {
      await notesApi.update(draggedNote.id, { folder_id: folderId })
      console.log('Note moved successfully via API')
      setDraggedNote(null)
      await loadNotes()
    } catch (error) {
      console.error('Error moving note via API:', error)
      // Fallback to localStorage update
      const updatedNotes = notes.map(note =>
        note.id === draggedNote.id
          ? { ...note, folder_id: folderId, updated_at: new Date().toISOString() }
          : note
      )
      setNotes(updatedNotes)
      localStorage.setItem('todoTool_notes', JSON.stringify(updatedNotes))
      // Notify parent component about notes change
      if (onNotesChange) {
        onNotesChange(updatedNotes)
      }
      setDraggedNote(null)
      console.log('Note moved via localStorage fallback')
    }
  }

  const getNotesByFolder = (folderId) => {
    const notesToUse = hasSearchQuery ? filteredNotes : notes
    const folderNotes = notesToUse.filter(note => {
      // Must belong to this folder AND not be archived
      return note.folder_id === folderId && note.archived !== true
    })
    if (folderNotes.length > 0) {
      console.log(`getNotesByFolder(${folderId}):`, folderNotes.length, 'notes found')
    }
    return folderNotes
  }

  const getUnorganizedNotes = () => {
    const notesToUse = hasSearchQuery ? filteredNotes : notes
    const unorganized = notesToUse.filter(note => {
      // Handle old archived system (folder_id: 'archived')
      if (note.folder_id === 'archived') return false

      // Handle new archived system (archived: true)
      if (note.archived === true) return false

      // Note is unorganized if it has no folder_id or folder doesn't exist
      if (!note.folder_id) return true

      // Check if the folder actually exists
      const folderExists = folders.some(f => f.id === note.folder_id)
      return !folderExists
    })
    console.log('getUnorganizedNotes:', 'total notes:', notesToUse.length, 'unorganized:', unorganized.length)
    console.log('Note folder_ids:', notesToUse.map(n => ({ id: n.id, title: n.title, folder_id: n.folder_id, archived: n.archived })))
    return unorganized
  }

  const getArchivedNotes = () => {
    const notesToUse = hasSearchQuery ? filteredNotes : notes
    return notesToUse.filter(note =>
      note.archived === true || note.folder_id === 'archived'
    )
  }

  const handleArchiveNote = async (noteId) => {
    try {
      // Use archived boolean field instead of folder_id
      await notesApi.update(noteId, { archived: true })
      await loadNotes()
      setActiveNoteMenu(null)
      console.log('Note archived successfully')
    } catch (error) {
      console.error('Error archiving note:', error)
      // Archive locally if API fails
      const updatedNotes = notes.map(note =>
        note.id === noteId
          ? { ...note, archived: true, updated_at: new Date().toISOString() }
          : note
      )
      setNotes(updatedNotes)
      localStorage.setItem('todoTool_notes', JSON.stringify(updatedNotes))
      // Notify parent component about notes change
      if (onNotesChange) {
        onNotesChange(updatedNotes)
      }
      setActiveNoteMenu(null)
      console.log('Note archived locally')
    }
  }

  const handleRestoreNote = async (noteId) => {
    const note = notes.find(n => n.id === noteId)
    console.log('Restoring note:', note?.title, 'current state:', { folder_id: note?.folder_id, archived: note?.archived })

    try {
      // Handle both old and new archived systems
      if (note?.folder_id === 'archived') {
        // Old system: note has folder_id='archived', restore to unorganized
        await notesApi.update(noteId, { archived: false, folder_id: null })
      } else {
        // New system: note has archived=true, restore to unorganized
        await notesApi.update(noteId, { archived: false, folder_id: null })
      }

      // Refresh all notes to update the sidebar properly
      await loadNotes()
      setActiveNoteMenu(null)
      console.log('Note restored successfully to Unorganized')
    } catch (error) {
      console.error('Error restoring note via API:', error)
      // Restore locally if API fails
      const allStoredNotes = localStorage.getItem('todoTool_notes')
      if (allStoredNotes) {
        const allNotes = JSON.parse(allStoredNotes)
        const updatedNotes = allNotes.map(n =>
          n.id === noteId
            ? {
                ...n,
                archived: false,
                folder_id: null, // Move to unorganized
                updated_at: new Date().toISOString()
              }
            : n
        )
        localStorage.setItem('todoTool_notes', JSON.stringify(updatedNotes))
        // Update the notes state to reflect the change immediately
        setNotes(updatedNotes)
        updateNotes(updatedNotes) // Update search context too
        // Notify parent component about notes change
        if (onNotesChange) {
          onNotesChange(updatedNotes)
        }
      }
      setActiveNoteMenu(null)
      console.log('Note restored locally to Unorganized')
    }
  }

  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} style={{
          backgroundColor: 'var(--primary-100)',
          color: 'var(--primary-800)',
          padding: '0.125rem 0.25rem',
          borderRadius: 'var(--radius-sm)',
          fontWeight: '600'
        }}>
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className="dashboard-layout">
      {/* Left Sidebar */}
      <div className="sidebar">
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <h1 className="sidebar-title">
            ToDoTool
          </h1>
        </div>

        {/* Mini Calendar */}
        <MiniCalendar />

        <div style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--gray-400)',
              width: '1rem',
              height: '1rem'
            }} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              className="search-input"
            />
            {hasSearchQuery && (
              <button
                onClick={() => updateSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: 'var(--radius-sm)'
                }}
                title="Clear search"
              >
                <X style={{ width: '1rem', height: '1rem' }} />
              </button>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="main-nav" style={{ marginBottom: '1.5rem' }}>
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              color: location.pathname === '/' ? 'var(--primary-600)' : 'var(--gray-600)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              margin: '0 0.5rem',
              backgroundColor: location.pathname === '/' ? 'var(--primary-50)' : 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <FileText style={{ width: '1.25rem', height: '1.25rem' }} />
            <span style={{ fontWeight: '500' }}>Main</span>
          </Link>
          <Link
            to="/notes"
            className={`nav-link ${location.pathname === '/notes' ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              color: location.pathname === '/notes' ? 'var(--primary-600)' : 'var(--gray-600)',
              textDecoration: 'none',
              borderRadius: 'var(--radius-md)',
              margin: '0 0.5rem',
              backgroundColor: location.pathname === '/notes' ? 'var(--primary-50)' : 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <FileText style={{ width: '1.25rem', height: '1.25rem' }} />
            <span style={{ fontWeight: '500' }}>Notes</span>
          </Link>
        </nav>

        {/* Folder Navigation - Only show on Notes page */}
        {location.pathname === '/notes' && (
          <nav className="sidebar-nav" style={{
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 200px)',
            paddingBottom: '1rem'
          }}>
            {/* Folders Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            marginBottom: '0.75rem'
          }}>
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: 'var(--gray-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0
            }}>
              Folders
            </h3>
            <button
              onClick={() => setShowNewFolderForm(true)}
              style={{
                padding: '0.25rem',
                color: 'var(--gray-400)',
                background: 'none',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer'
              }}
              title="Create new folder"
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>

          {/* New Folder Form */}
          {showNewFolderForm && (
            <div style={{ padding: '0 1rem', marginBottom: '1rem' }}>
              <form onSubmit={handleCreateFolder} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="New folder"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.5rem',
                    flex: 1,
                    minWidth: 0,
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-sm)',
                    outline: 'none',
                    fontWeight: '500'
                  }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: newFolderName.trim() ? 'pointer' : 'not-allowed',
                      padding: '0.25rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: newFolderName.trim() ? 'var(--gray-600)' : 'var(--gray-400)',
                      lineHeight: '1',
                      opacity: newFolderName.trim() ? 1 : 0.5
                    }}
                    title="Add folder"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewFolderForm(false)
                      setNewFolderName('')
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'var(--gray-600)',
                      lineHeight: '1'
                    }}
                    title="Cancel"
                  >
                    ×
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search Results or Folders List */}
          <div className="folder-tree">
            {hasSearchQuery ? (
              /* Search Results */
              <div className="search-results">
                <div style={{
                  padding: '0 1rem',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <h3 style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: 'var(--gray-500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: 0
                  }}>
                    Search Results ({filteredNotes.length})
                  </h3>
                  <button
                    onClick={() => updateSearchQuery('')}
                    style={{
                      padding: '0.25rem',
                      color: 'var(--gray-400)',
                      background: 'none',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                    title="Clear search"
                  >
                    <X style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>

                {filteredNotes.length === 0 ? (
                  <div className="empty-folder">
                    <span>No notes found for "{searchQuery}"</span>
                  </div>
                ) : (
                  <div className="search-results-list">
                    {filteredNotes.map((note) => (
                      <div
                        key={note.id}
                        className="note-item search-result-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, note)}
                        onDragEnd={handleDragEnd}
                        title={note.title}
                        onClick={() => {
                          // Navigate to notes page and select the note
                          navigate('/notes', { state: { selectedNote: note } })
                        }}
                      >
                        <FileText className="note-icon" />
                        <div className="search-result-content">
                          <span className="note-title">
                            {highlightSearchTerm(note.title, searchQuery)}
                          </span>
                          {note.general_notes && (
                            <span className="note-preview">
                              {highlightSearchTerm(
                                note.general_notes.substring(0, 50) +
                                (note.general_notes.length > 50 ? '...' : ''),
                                searchQuery
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Normal Folder Structure */
              getAllFolders().map((folder) => {
                const isExpanded = expandedFolders.has(folder.id)
                const folderNotes = getNotesByFolder(folder.id)
                const isDragOver = dragOverFolder === folder.id

              return (
                <div key={folder.id} className="folder-container">
                  {/* Folder Header */}
                  <div
                    className={`folder-header ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, folder.id)}
                  >
                    <div
                      className="folder-header-content"
                      onClick={() => !renamingFolder && toggleFolder(folder.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="folder-chevron" />
                      ) : (
                        <ChevronRight className="folder-chevron" />
                      )}
                      {isExpanded ? (
                        <FolderOpen className="folder-icon" />
                      ) : (
                        <Folder className="folder-icon" />
                      )}

                      {/* Folder Name or Rename Input */}
                      {renamingFolder === folder.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            handleRenameFolder(folder.id, renameValue)
                          }}
                          style={{ display: 'flex', alignItems: 'center', flex: 1 }}
                        >
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => handleRenameFolder(folder.id, renameValue)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                cancelRename()
                              }
                            }}
                            className="folder-rename-input"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </form>
                      ) : (
                        <span className="folder-name">{folder.name}</span>
                      )}
                    </div>

                    <div className="folder-actions">
                      <span className="folder-count">{folderNotes.length}</span>
                      <div style={{ position: 'relative' }}>
                        <button
                          className="folder-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (activeContextMenu === folder.id) {
                              setActiveContextMenu(null)
                            } else {
                              const rect = e.target.getBoundingClientRect()
                              setContextMenuPosition({
                                top: rect.bottom + 5,
                                left: rect.left - 100 // Offset to align properly
                              })
                              setActiveContextMenu(folder.id)
                            }
                          }}
                        >
                          <MoreHorizontal style={{ width: '1rem', height: '1rem' }} />
                        </button>

                        {/* Context Menu */}
                        {activeContextMenu === folder.id && (
                          <div
                            className="context-menu"
                            style={{
                              top: `${contextMenuPosition.top}px`,
                              left: `${contextMenuPosition.left}px`
                            }}
                          >
                            {!folder.isStatic && (
                              <button
                                className="context-menu-item"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startRename(folder)
                                }}
                              >
                                <Edit style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.5rem' }} />
                                Rename
                              </button>
                            )}
                            {!folder.isStatic && (
                              <button
                                className="context-menu-item delete"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteFolder(folder.id)
                                }}
                              >
                                <Trash2 style={{ width: '0.875rem', height: '0.875rem', marginRight: '0.5rem' }} />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Folder Notes */}
                  {isExpanded && (
                    <div className="folder-notes">
                      {folderNotes.map((note) => (
                        <div
                          key={note.id}
                          className="note-item"
                          draggable
                          onDragStart={(e) => handleDragStart(e, note)}
                          onDragEnd={handleDragEnd}
                          title={note.title}
                          style={{ cursor: 'pointer', position: 'relative' }}
                        >
                          <div
                            onClick={() => {
                              // Navigate to notes page and select the note
                              navigate('/notes', { state: { selectedNote: note } })
                            }}
                            style={{ display: 'flex', alignItems: 'center', flex: 1 }}
                          >
                            <FileText className="note-icon" />
                            <span className="note-title">{note.title}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (activeNoteMenu === note.id) {
                                setActiveNoteMenu(null)
                              } else {
                                const rect = e.target.getBoundingClientRect()
                                setNoteMenuPosition({
                                  top: rect.bottom + 5,
                                  left: rect.left - 100
                                })
                                setActiveNoteMenu(note.id)
                              }
                            }}
                            style={{
                              padding: '0.25rem',
                              background: 'none',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              opacity: 0.6,
                              transition: 'opacity 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.opacity = '1'}
                            onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                          >
                            <MoreHorizontal style={{ width: '0.875rem', height: '0.875rem' }} />
                          </button>
                        </div>
                      ))}
                      {folderNotes.length === 0 && (
                        <div className="empty-folder">
                          <span>No notes in this folder</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
              })
            )}

            {/* Unorganized Notes - Always Visible */}
            {!hasSearchQuery && (
              <div className="folder-container">
                <div className="folder-header unorganized">
                  <div className="folder-header-content">
                    <FileText className="folder-icon" />
                    <span className="folder-name">Unorganized</span>
                  </div>
                  <span className="folder-count">{getUnorganizedNotes().length}</span>
                </div>
                <div className="folder-notes">
                  {getUnorganizedNotes().length > 0 ? (
                    getUnorganizedNotes().map((note) => (
                      <div
                        key={note.id}
                        className="note-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, note)}
                        onDragEnd={handleDragEnd}
                        title={note.title}
                        onClick={() => {
                          // Navigate to notes page and select the note
                          navigate('/notes', { state: { selectedNote: note } })
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <FileText className="note-icon" />
                        <span className="note-title">{note.title}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: 'var(--gray-400)',
                      fontSize: '0.875rem',
                      fontStyle: 'italic'
                    }}>
                      No unorganized notes
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Archived Notes - Always Visible */}
            {!hasSearchQuery && (
              <div className="folder-container">
                <div className="folder-header archived" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
                  <div className="folder-header-content">
                    <Archive className="folder-icon" style={{ color: '#d97706' }} />
                    <span className="folder-name" style={{ color: '#d97706', fontWeight: '600' }}>Archived Notes</span>
                  </div>
                  <span className="folder-count" style={{ color: '#d97706' }}>{getArchivedNotes().length}</span>
                  {/* No 3-dot menu for static folder */}
                </div>
                <div className="folder-notes">
                  {getArchivedNotes().length > 0 ? (
                    getArchivedNotes().map((note) => (
                      <div
                        key={note.id}
                        className="note-item archived-note"
                        title={note.title}
                        style={{ cursor: 'pointer', opacity: 0.7, position: 'relative' }}
                      >
                        <div
                          onClick={() => {
                            // Navigate to notes page and select the note
                            navigate('/notes', { state: { selectedNote: note } })
                          }}
                          style={{ display: 'flex', alignItems: 'center', flex: 1 }}
                        >
                          <FileText className="note-icon" />
                          <span className="note-title">{note.title}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (activeNoteMenu === note.id) {
                              setActiveNoteMenu(null)
                            } else {
                              const rect = e.target.getBoundingClientRect()
                              setNoteMenuPosition({
                                top: rect.bottom + 5,
                                left: rect.left - 100
                              })
                              setActiveNoteMenu(note.id)
                            }
                          }}
                          style={{
                            padding: '0.25rem',
                            background: 'none',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            opacity: 0.6,
                            transition: 'opacity 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = '1'}
                          onMouseLeave={(e) => e.target.style.opacity = '0.6'}
                        >
                          <MoreHorizontal style={{ width: '0.875rem', height: '0.875rem' }} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: '1rem',
                      textAlign: 'center',
                      color: '#d97706',
                      fontSize: '0.875rem',
                      fontStyle: 'italic',
                      opacity: 0.7
                    }}>
                      No archived notes
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>
        )}
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {children}
      </div>

      {/* Folder Context Menu */}
      {activeContextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: contextMenuPosition.top,
            left: contextMenuPosition.left,
            zIndex: 1000,
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '0.5rem 0',
            minWidth: '120px'
          }}
        >
          <button
            onClick={() => startRename(folders.find(f => f.id === activeContextMenu))}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--gray-50)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <Edit style={{ width: '1rem', height: '1rem' }} />
            Rename
          </button>
          <button
            onClick={() => handleDeleteFolder(activeContextMenu)}
            style={{
              width: '100%',
              padding: '0.5rem 1rem',
              border: 'none',
              background: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--red-600)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => e.target.style.background = 'var(--red-50)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <Trash2 style={{ width: '1rem', height: '1rem' }} />
            Delete
          </button>
        </div>
      )}

      {/* Note Context Menu */}
      {activeNoteMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: noteMenuPosition.top,
            left: noteMenuPosition.left,
            zIndex: 1000,
            background: 'white',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '0.5rem 0',
            minWidth: '120px'
          }}
        >
          {(() => {
            const note = [...notes, ...getArchivedNotes()].find(n => n.id === activeNoteMenu)
            const isArchived = note?.archived

            return isArchived ? (
              <button
                onClick={() => handleRestoreNote(activeNoteMenu)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--green-600)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--green-50)'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                <FileText style={{ width: '1rem', height: '1rem' }} />
                Restore
              </button>
            ) : (
              <button
                onClick={() => handleArchiveNote(activeNoteMenu)}
                style={{
                  width: '100%',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: 'var(--orange-600)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => e.target.style.background = 'var(--orange-50)'}
                onMouseLeave={(e) => e.target.style.background = 'none'}
              >
                <Archive style={{ width: '1rem', height: '1rem' }} />
                Archive
              </button>
            )
          })()}
        </div>
      )}
    </div>
  )
}

export default Layout
