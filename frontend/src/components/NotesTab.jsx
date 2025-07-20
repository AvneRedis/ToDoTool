import { useState, useEffect } from 'react'
import { Plus, Star, Calendar, Filter, MoreHorizontal, Clock, User, Zap, AlertTriangle, Users } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { foldersApi, notesApi } from '../services/api'
import { useSearch } from '../contexts/SearchContext'
import NoteEditor from './NoteEditor'

const NotesTab = ({ sharedNotes = [], onNotesChange }) => {
  const location = useLocation()
  const [folders, setFolders] = useState([])
  const [notes, setNotes] = useState(sharedNotes)
  const [selectedNote, setSelectedNote] = useState(null)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newNoteTitle, setNewNoteTitle] = useState('')

  const [quickAddText, setQuickAddText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [dialogNoteTitle, setDialogNoteTitle] = useState('')
  const [showTaskSuccess, setShowTaskSuccess] = useState(false)

  useEffect(() => {
    loadFolders()
    loadNotes()
  }, [])

  // Sync with shared notes from parent
  useEffect(() => {
    setNotes(sharedNotes)
  }, [sharedNotes])

  // Handle note selection from sidebar navigation
  useEffect(() => {
    if (location.state?.selectedNote) {
      setSelectedNote(location.state.selectedNote)
      // Clear the navigation state to prevent re-selection on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const loadFolders = async () => {
    try {
      const response = await foldersApi.getAll()
      setFolders(response.data)
    } catch (error) {
      console.error('Error loading folders:', error)
    }
  }

  const loadNotes = async (folderId = null) => {
    try {
      const response = await notesApi.getAll(folderId)
      setNotes(response.data)
      // Notify parent about all notes for sidebar sync (only when loading all notes)
      if (onNotesChange && !folderId) {
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
        const allNotes = JSON.parse(savedNotes)
        // Filter by folder if specified
        let filteredNotes
        if (folderId === null || folderId === undefined) {
          // Show all notes when no specific folder is selected (exclude archived)
          filteredNotes = allNotes.filter(note => !note.archived)
        } else if (folderId === 'unorganized') {
          // Show unorganized notes (null folder_id, but not archived)
          filteredNotes = allNotes.filter(note => !note.folder_id && !note.archived)
        } else if (folderId === 'archived') {
          // Show archived notes
          filteredNotes = allNotes.filter(note => note.archived)
        } else {
          // Show notes for specific folder
          filteredNotes = allNotes.filter(note => note.folder_id === folderId)
        }
        setNotes(filteredNotes)
        // Notify parent about all notes for sidebar sync (only when loading all notes)
        if (onNotesChange && !folderId) {
          onNotesChange(allNotes)
        }
      } else {
        setNotes([])
        // Notify parent about empty notes
        if (onNotesChange && !folderId) {
          onNotesChange([])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFolderSelect = (folder) => {
    setSelectedFolder(folder)
    setSelectedNote(null)
    loadNotes(folder?.id)
  }

  const handleNoteSelect = (note) => {
    setSelectedNote(note)
  }

  const handleCreateNote = async (e) => {
    e.preventDefault()
    if (!dialogNoteTitle.trim()) return

    try {
      // Create note with null folder_id (unorganized)
      const newNote = await notesApi.create({
        title: dialogNoteTitle.trim(),
        folder_id: null,
        general_notes: '',
        discussion_points: '',
        todo_items: ''
      })

      // Close dialog and clear form
      setShowCreateDialog(false)
      setDialogNoteTitle('')

      // Refresh all notes to include the new note
      await loadNotes()
      setSelectedNote(newNote.data)
    } catch (error) {
      // Only log non-network errors to avoid console spam
      if (error.message !== 'API_UNAVAILABLE') {
        console.error('Error creating note:', error)
      }

      // Create note locally if API fails
      const newNote = {
        id: Date.now(),
        title: dialogNoteTitle.trim(),
        folder_id: null,
        general_notes: '',
        discussion_points: '',
        todo_items: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const savedNotes = localStorage.getItem('todoTool_notes')
      const existingNotes = savedNotes ? JSON.parse(savedNotes) : []
      const updatedNotes = [newNote, ...existingNotes]

      // Save to localStorage
      localStorage.setItem('todoTool_notes', JSON.stringify(updatedNotes))

      // Update local state and notify parent immediately
      setNotes(updatedNotes)
      if (onNotesChange) {
        onNotesChange(updatedNotes)
      }

      // Close dialog and clear form
      setShowCreateDialog(false)
      setDialogNoteTitle('')
      setSelectedNote(newNote)

      console.log('Note created locally:', newNote)
    }
  }

  const handleNoteUpdate = async (noteId, updatedData) => {
    try {
      const response = await notesApi.update(noteId, updatedData)
      setSelectedNote(response.data)
      loadNotes(selectedFolder?.id)
    } catch (error) {
      // Only log non-network errors to avoid console spam
      if (error.message !== 'API_UNAVAILABLE') {
        console.error('Error updating note:', error)
      }
      // Update locally if API fails
      const savedNotes = localStorage.getItem('todoTool_notes')
      if (savedNotes) {
        const allNotes = JSON.parse(savedNotes)
        const updatedNotes = allNotes.map(note =>
          note.id === noteId
            ? { ...note, ...updatedData, updated_at: new Date().toISOString() }
            : note
        )
        localStorage.setItem('todoTool_notes', JSON.stringify(updatedNotes))

        // Update the selected note and notes list
        const updatedNote = updatedNotes.find(note => note.id === noteId)
        setSelectedNote(updatedNote)
        loadNotes(selectedFolder?.id)

        console.log('Note updated locally:', updatedNote)
      }
    }
  }

  const handleNoteArchive = async (noteId) => {
    try {
      // Use archived boolean field instead of folder_id
      const response = await notesApi.update(noteId, { archived: true })

      // Refresh all notes to sync sidebar and main view
      console.log('About to reload notes after archive...')
      await loadNotes()
      console.log('Notes reloaded after archive')

      // Close the note editor since the note is no longer in the current view
      setSelectedNote(null)

      console.log('Note archived successfully:', response.data)
      console.log('Notes after archive:', notes.length, 'total notes')
      console.log('Non-archived notes:', getNonArchivedNotes().length)
      console.log('Sample notes folder_ids:', notes.slice(0, 3).map(n => ({ id: n.id, folder_id: n.folder_id })))

      // Check if the archived note is still in the notes array
      const archivedNote = notes.find(n => n.id === noteId)
      console.log('Archived note in notes array:', archivedNote ? { id: archivedNote.id, folder_id: archivedNote.folder_id } : 'not found')
    } catch (error) {
      // Only log non-network errors to avoid console spam
      if (error.message !== 'API_UNAVAILABLE') {
        console.error('Error archiving note:', error)
      }
      // Archive locally if API fails
      const savedNotes = localStorage.getItem('todoTool_notes')
      if (savedNotes) {
        const allNotes = JSON.parse(savedNotes)
        const updatedNotes = allNotes.map(note =>
          note.id === noteId
            ? { ...note, archived: true, updated_at: new Date().toISOString() }
            : note
        )
        localStorage.setItem('todoTool_notes', JSON.stringify(updatedNotes))

        // Refresh all notes to sync sidebar and main view
        await loadNotes()

        // Close the note editor since the note is no longer in the current view
        setSelectedNote(null)

        console.log('Note archived locally')
      }
    }
  }

  const handleNoteRestore = async (noteId) => {
    try {
      // Update note to remove archived status
      const response = await notesApi.update(noteId, { archived: false })

      // Refresh all notes to update the UI properly
      await loadNotes()

      // If we're currently viewing archived notes, switch to unorganized to show the restored note
      if (selectedFolder?.name === 'Archived Notes') {
        setSelectedFolder({ id: 'unorganized', name: 'Unorganized' })
        await loadNotes('unorganized')
      }

      console.log('Note restored successfully:', response.data)
    } catch (error) {
      // Only log non-network errors to avoid console spam
      if (error.message !== 'API_UNAVAILABLE') {
        console.error('Error restoring note:', error)
      }
      // Restore locally if API fails
      const savedNotes = localStorage.getItem('todoTool_notes')
      if (savedNotes) {
        const allNotes = JSON.parse(savedNotes)
        const updatedNotes = allNotes.map(note =>
          note.id === noteId
            ? { ...note, archived: false, updated_at: new Date().toISOString() }
            : note
        )
        localStorage.setItem('todoTool_notes', JSON.stringify(updatedNotes))

        // Refresh the notes list and switch view if needed
        await loadNotes()
        if (selectedFolder?.name === 'Archived Notes') {
          setSelectedFolder({ id: 'unorganized', name: 'Unorganized' })
          await loadNotes('unorganized')
        }

        console.log('Note restored locally')
      }
    }
  }

  const getCurrentDate = () => {
    const today = new Date()
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
    return today.toLocaleDateString('en-US', options)
  }

  const getNonArchivedNotes = () => {
    return notes.filter(note =>
      note.archived !== true && note.folder_id !== 'archived'
    )
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  // Todo sections definition (same as TodoMain)
  const sections = {
    quickWins: {
      title: 'Quick Wins',
      icon: Zap,
      color: 'var(--green-500)'
    },
    delegate: {
      title: 'Delegate',
      icon: Users,
      color: 'var(--blue-500)'
    },
    general: {
      title: 'General',
      icon: Clock,
      color: 'var(--gray-500)'
    },
    highPriority: {
      title: 'High Priority',
      icon: AlertTriangle,
      color: 'var(--red-500)'
    }
  }

  const selectCategory = (categoryKey) => {
    // Toggle selection: if same category is clicked, deselect it
    if (selectedCategory === categoryKey) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(categoryKey)
    }
  }

  const handleQuickAdd = () => {
    if (!quickAddText.trim() || !selectedCategory) return

    // Create a single todo for the selected category
    const newTodo = {
      id: Date.now() + Math.random(),
      text: quickAddText.trim(),
      section: selectedCategory,
      completed: false,
      createdAt: new Date()
    }

    // Save to the same localStorage key that TodoMain uses
    const existingTodos = localStorage.getItem('todoTool_todos')
    const currentTodos = existingTodos ? JSON.parse(existingTodos) : []
    const updatedTodos = [...currentTodos, newTodo]
    localStorage.setItem('todoTool_todos', JSON.stringify(updatedTodos))

    // Dispatch custom event to notify TodoMain of the update
    window.dispatchEvent(new CustomEvent('todosUpdated'))

    console.log('New todo saved to localStorage:', newTodo)

    // Clear the form and show success message
    setQuickAddText('')
    setSelectedCategory(null)
    setShowTaskSuccess(true)

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowTaskSuccess(false)
    }, 3000)
  }



  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div>Loading your notes...</div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '2rem', padding: '2rem 2rem 0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
              Notes Dashboard
            </h1>
            <button
              onClick={() => {
                console.log('Opening create note dialog')
                setShowCreateDialog(true)
              }}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-500)',
                border: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--primary-600)'
                e.target.style.transform = 'scale(1.05)'
                e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'var(--primary-500)'
                e.target.style.transform = 'scale(1)'
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
              }}
            >
              <Plus style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selectedNote ? (
          <div style={{ padding: '2rem', paddingBottom: '6rem' }}>
            <NoteEditor
              note={selectedNote}
              onUpdate={handleNoteUpdate}
              onArchive={handleNoteArchive}
              onRestore={handleNoteRestore}
              onClose={() => setSelectedNote(null)}
              allNotes={notes}
              folders={folders}
            />
          </div>
        ) : (
          <div style={{ padding: '2rem', paddingBottom: '6rem' }}>


            {/* Notes Section */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--gray-900)', margin: 0 }}>
                  Recent Notes
                </h2>

              </div>

              {getNonArchivedNotes().length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Calendar style={{ width: '2rem', height: '2rem', color: 'var(--gray-400)' }} />
                  </div>
                  <h3 className="empty-state-title">No notes yet</h3>
                  <p className="empty-state-description">Create your first note to get started</p>
                  <button
                    onClick={() => {
                      console.log('Opening create note dialog from empty state')
                      setShowCreateDialog(true)
                    }}
                    className="btn btn-primary"
                  >
                    Create Note
                  </button>
                </div>
              ) : (
                <div className="content-grid">
                  {getNonArchivedNotes().map((note) => (
                    <div
                      key={note.id}
                      onClick={() => handleNoteSelect(note)}
                      className="card card-clickable"
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h3 className="card-title line-clamp-2">
                          {note.title}
                        </h3>
                        <button style={{
                          opacity: 0,
                          padding: '0.25rem',
                          color: 'var(--gray-400)',
                          background: 'none',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}>
                          <Star style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>

                      <p className="card-content line-clamp-3" style={{ marginBottom: '1rem' }}>
                        {note.general_notes && note.general_notes.substring(0, 120)}
                        {note.general_notes && note.general_notes.length > 120 && '...'}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          background: 'var(--primary-50)',
                          color: 'var(--primary-700)',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '9999px',
                          fontWeight: '500'
                        }}>
                          Note
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                          <Clock style={{ width: '0.75rem', height: '0.75rem', marginRight: '0.25rem' }} />
                          {new Date(note.updated_at || note.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TODO: Add note creation form here */}

      {/* Quick Add Bottom Bar */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '280px', // Start after the sidebar width
        right: 0,
        backgroundColor: '#ffffff90',
        borderTop: '1px solid rgba(229, 231, 235, 0.8)',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        zIndex: 1000,
        backdropFilter: 'blur(10px)'
      }}>
        {/* Text Input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            placeholder="Add a new task"
            value={quickAddText}
            onChange={(e) => setQuickAddText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              paddingRight: showTaskSuccess ? '10rem' : '1rem',
              border: '1px solid var(--gray-300)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              outline: 'none',
              transition: 'padding-right 0.2s ease'
            }}
          />
          {showTaskSuccess && (
            <div style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#10b981',
              fontSize: '0.875rem',
              fontWeight: '400',
              pointerEvents: 'none'
            }}>
              New task added
            </div>
          )}
        </div>

        {/* Category Icons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {Object.entries(sections).map(([sectionKey, section]) => {
            const Icon = section.icon
            const isSelected = selectedCategory === sectionKey

            return (
              <button
                key={sectionKey}
                onClick={() => selectCategory(sectionKey)}
                style={{
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? `${section.color}20` : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={section.title}
              >
                <Icon
                  style={{
                    width: '1.25rem',
                    height: '1.25rem',
                    color: isSelected ? section.color : 'var(--gray-400)'
                  }}
                />
              </button>
            )
          })}
        </div>

        {/* Add Button */}
        <button
          onClick={handleQuickAdd}
          disabled={!quickAddText.trim() || !selectedCategory}
          className="btn btn-primary"
          style={{
            padding: '0.75rem 1.5rem',
            opacity: (!quickAddText.trim() || !selectedCategory) ? 0.5 : 1,
            cursor: (!quickAddText.trim() || !selectedCategory) ? 'not-allowed' : 'pointer'
          }}
        >
          Add
        </button>
      </div>

      {/* Create Note Dialog */}
      {showCreateDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            width: '90%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '1rem'
              }}>
                <Plus style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--gray-900)',
                  margin: '0 0 0.25rem 0'
                }}>
                  Create New Note
                </h2>
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--gray-600)',
                  margin: 0
                }}>
                  Add a new note to your collection
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateNote}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--gray-700)',
                  marginBottom: '0.75rem'
                }}>
                  Note Title
                </label>
                <input
                  type="text"
                  value={dialogNoteTitle}
                  onChange={(e) => setDialogNoteTitle(e.target.value)}
                  placeholder="What's on your mind?"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '1rem 1.25rem',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-500)'
                    e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'
                    e.target.style.backgroundColor = 'white'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--gray-200)'
                    e.target.style.boxShadow = 'none'
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                paddingTop: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setDialogNoteTitle('')
                  }}
                  style={{
                    padding: '0.875rem 1.75rem',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(10px)',
                    color: 'var(--gray-700)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '500',
                    fontSize: '0.875rem'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--gray-50)'
                    e.target.style.borderColor = 'var(--gray-300)'
                    e.target.style.transform = 'translateY(-1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                    e.target.style.borderColor = 'var(--gray-200)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!dialogNoteTitle.trim()}
                  style={{
                    padding: '0.875rem 1.75rem',
                    border: 'none',
                    borderRadius: '12px',
                    backgroundColor: dialogNoteTitle.trim() ? 'var(--primary-500)' : 'var(--gray-300)',
                    color: 'white',
                    cursor: dialogNoteTitle.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s ease',
                    fontWeight: '600',
                    fontSize: '0.875rem',
                    boxShadow: dialogNoteTitle.trim() ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (dialogNoteTitle.trim()) {
                      e.target.style.backgroundColor = 'var(--primary-600)'
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (dialogNoteTitle.trim()) {
                      e.target.style.backgroundColor = 'var(--primary-500)'
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }
                  }}
                >
                  Create Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default NotesTab
