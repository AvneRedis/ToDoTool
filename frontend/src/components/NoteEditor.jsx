import { useState, useEffect } from 'react'
import { Save, X, Calendar, Edit3, ChevronDown, Trash2 } from 'lucide-react'

const NoteEditor = ({ note, onUpdate, onClose, onArchive, onRestore, allNotes = [], folders = [] }) => {
  const [title, setTitle] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [discussionPoints, setDiscussionPoints] = useState('')
  const [previousNotes, setPreviousNotes] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)

  useEffect(() => {
    if (note) {
      setTitle(note.title || '')
      setGeneralNotes(note.general_notes || '')
      setDiscussionPoints(note.discussion_points || '')
      // Backend uses 'todo_items' field for what we call 'previous_notes'
      setPreviousNotes(note.todo_items || note.previous_notes || '')
      setHasChanges(false)
      setIsEditingTitle(false)
    }
  }, [note])

  const handleSave = async () => {
    if (!hasChanges) return

    try {
      // Simply save the current state without modifying previous notes
      // Previous notes are now managed manually via the arrow buttons
      // Note: backend uses 'todo_items' field for what we call 'previous_notes'
      await onUpdate(note.id, {
        title,
        general_notes: generalNotes,
        discussion_points: discussionPoints,
        todo_items: previousNotes
      })

      setHasChanges(false)
      setIsEditingTitle(false)
    } catch (error) {
      console.error('Error saving note:', error)
    }
  }

  // Archive/Restore functions removed - functionality only available from sidebar

  const handleMoveToHistory = (content, sectionName) => {
    if (!content.trim()) return

    const timestamp = new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Parse existing previous notes to maintain structure
    const existingData = parsePreviousNotes(previousNotes || '')

    // Add new entry to the appropriate section
    const newEntry = `${content.trim()} — ${timestamp}`

    if (sectionName === 'General Notes') {
      existingData.generalNotes.unshift(newEntry)
    } else if (sectionName === 'Discussion Points') {
      existingData.discussionPoints.unshift(newEntry)
    }

    // Rebuild the previous notes string
    const updatedPreviousNotes = buildPreviousNotesString(existingData)

    setPreviousNotes(updatedPreviousNotes)
    setHasChanges(true)

    // Clear the original field
    if (sectionName === 'General Notes') {
      setGeneralNotes('')
    } else if (sectionName === 'Discussion Points') {
      setDiscussionPoints('')
    }
  }

  const handleDeleteHistoryEntry = (sectionName, entryIndex) => {
    const existingData = parsePreviousNotes(previousNotes || '')

    // Remove the entry from the appropriate section
    if (sectionName === 'General Notes') {
      existingData.generalNotes.splice(entryIndex, 1)
    } else if (sectionName === 'Discussion Points') {
      existingData.discussionPoints.splice(entryIndex, 1)
    }

    // Rebuild the previous notes string
    const updatedPreviousNotes = buildPreviousNotesString(existingData)

    setPreviousNotes(updatedPreviousNotes)
    setHasChanges(true)
  }

  const handleFieldChange = (setter) => (e) => {
    setter(e.target.value)
    setHasChanges(true)
  }

  if (!note) return null

  // Parse previous notes into structured format
  const parsePreviousNotes = (notesString) => {
    const result = {
      generalNotes: [],
      discussionPoints: []
    }

    if (!notesString) return result

    const sections = notesString.split('## Discussion Points')

    // Parse General Notes section
    if (sections[0]) {
      const generalSection = sections[0].replace('## General Notes', '').trim()
      if (generalSection) {
        result.generalNotes = generalSection.split('\n').filter(line => line.trim())
      }
    }

    // Parse Discussion Points section
    if (sections[1]) {
      const discussionSection = sections[1].trim()
      if (discussionSection) {
        result.discussionPoints = discussionSection.split('\n').filter(line => line.trim())
      }
    }

    return result
  }

  // Build previous notes string from structured data
  const buildPreviousNotesString = (data) => {
    let result = ''

    if (data.generalNotes.length > 0) {
      result += '## General Notes\n'
      result += data.generalNotes.join('\n') + '\n\n'
    }

    if (data.discussionPoints.length > 0) {
      result += '## Discussion Points\n'
      result += data.discussionPoints.join('\n') + '\n\n'
    }

    return result.trim()
  }

  // Get structured previous notes for display
  const getStructuredPreviousNotes = () => {
    return parsePreviousNotes(previousNotes || '')
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(236, 72, 153, 0.06) 100%)',
      backdropFilter: 'blur(20px)',
      borderRadius: '1.5rem',
      width: '100%',
      overflow: 'hidden',
      boxShadow: '0 25px 50px -12px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      transition: 'all 0.2s ease'
    }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.5rem',
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(15px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem 1.5rem 0 0'
        }}>
          <div style={{ flex: 1 }}>
            {isEditingTitle ? (
              <input
                type="text"
                value={title}
                onChange={handleFieldChange(setTitle)}
                placeholder="Note title"
                autoFocus
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsEditingTitle(false)
                  }
                }}
                style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'var(--gray-900)',
                  background: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  width: '100%',
                  height: '2.5rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)'
                }}
              />
            ) : (
              <h1 style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: 'var(--gray-900)',
                margin: 0
              }}>
                {title}
              </h1>
            )}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '0.25rem',
              padding: '0.25rem 0.5rem',
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              width: 'fit-content'
            }}>
              <div style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                marginRight: '0.375rem',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.3)'
              }}></div>
              <p style={{
                fontSize: '0.6875rem',
                color: 'var(--gray-600)',
                margin: 0,
                fontWeight: '400'
              }}>
                {new Date(note.updated_at || note.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {hasChanges && (
              <button
                onClick={handleSave}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  background: 'var(--primary-500)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                  height: '2.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--primary-600)'
                  e.target.style.transform = 'translateY(-1px)'
                  e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--primary-500)'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
              >
                <Save style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Save
              </button>
            )}
            <button
              onClick={() => setIsEditingTitle(true)}
              title="Edit Title"
              style={{
                padding: '0.5rem',
                background: 'rgba(99, 102, 241, 0.2)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--primary-600)',
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(10px)',
                height: '2.5rem',
                width: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(99, 102, 241, 0.3)'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(99, 102, 241, 0.2)'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              <Edit3 style={{ width: '1rem', height: '1rem' }} />
            </button>
            {/* Archive/Restore functionality removed - only available from sidebar */}
            <button
              onClick={onClose}
              style={{
                padding: '0.5rem',
                color: 'var(--gray-400)',
                background: 'rgba(156, 163, 175, 0.1)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                border: 'none',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                height: '2.5rem',
                width: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.target.style.color = 'var(--gray-600)'
                e.target.style.background = 'rgba(156, 163, 175, 0.2)'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.target.style.color = 'var(--gray-400)'
                e.target.style.background = 'rgba(156, 163, 175, 0.1)'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              <X style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>
          </div>
        </div>

        {/* Content Sections */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* General Notes Section */}
          <div>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '0.75rem',
              margin: '0 0 0.75rem 0'
            }}>
              General Notes
            </h2>
            <div style={{ position: 'relative' }}>
              <textarea
                value={generalNotes}
                onChange={handleFieldChange(setGeneralNotes)}
                placeholder="Add your general notes here..."
                style={{
                  width: '100%',
                  height: '6rem',
                  padding: '1rem',
                  paddingRight: '3rem',
                  background: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  resize: 'none',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
                  color: 'var(--gray-800)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-500)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1), 0 8px 20px rgba(99, 102, 241, 0.12)'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.08)'
                  e.target.style.transform = 'translateY(0)'
                }}
              />
              {generalNotes.trim() && (
                <button
                  onClick={() => handleMoveToHistory(generalNotes, 'General Notes')}
                  title="Move to Previous Notes"
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    padding: '0.25rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--primary-600)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(99, 102, 241, 0.2)'
                    e.target.style.transform = 'translateY(1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(99, 102, 241, 0.1)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <ChevronDown style={{ width: '0.875rem', height: '0.875rem' }} />
                </button>
              )}
            </div>
          </div>

          {/* Discussion Points Section */}
          <div>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '0.75rem',
              margin: '0 0 0.75rem 0'
            }}>
              Discussion Points
            </h2>
            <div style={{ position: 'relative' }}>
              <textarea
                value={discussionPoints}
                onChange={handleFieldChange(setDiscussionPoints)}
                placeholder="Add discussion points here..."
                style={{
                  width: '100%',
                  height: '6rem',
                  padding: '1rem',
                  paddingRight: '3rem',
                  background: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '12px',
                  resize: 'none',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)',
                  color: 'var(--gray-800)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-500)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1), 0 8px 20px rgba(99, 102, 241, 0.12)'
                  e.target.style.transform = 'translateY(-1px)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                  e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.08)'
                  e.target.style.transform = 'translateY(0)'
                }}
              />
              {discussionPoints.trim() && (
                <button
                  onClick={() => handleMoveToHistory(discussionPoints, 'Discussion Points')}
                  title="Move to Previous Notes"
                  style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    padding: '0.25rem',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: 'var(--primary-600)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(99, 102, 241, 0.2)'
                    e.target.style.transform = 'translateY(1px)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(99, 102, 241, 0.1)'
                    e.target.style.transform = 'translateY(0)'
                  }}
                >
                  <ChevronDown style={{ width: '0.875rem', height: '0.875rem' }} />
                </button>
              )}
            </div>
          </div>

          {/* Previous Notes Section */}
          <div>
            <h2 style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: 'var(--gray-900)',
              marginBottom: '0.75rem',
              margin: '0 0 0.75rem 0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Calendar style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Previous Notes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(() => {
                const structuredNotes = getStructuredPreviousNotes()
                const hasContent = structuredNotes.generalNotes.length > 0 || structuredNotes.discussionPoints.length > 0

                if (!hasContent) {
                  return (
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '12px',
                      textAlign: 'center',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.05)'
                    }}>
                      <p style={{
                        color: 'var(--gray-400)',
                        fontStyle: 'italic',
                        fontSize: '0.875rem',
                        margin: 0
                      }}>
                        No previous versions saved yet
                      </p>
                    </div>
                  )
                }

                return (
                  <>
                    {/* General Notes History */}
                    {structuredNotes.generalNotes.length > 0 && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)'
                      }}>
                        <div style={{
                          background: 'rgba(34, 197, 94, 0.08)',
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                          <h3 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'var(--gray-700)',
                            margin: 0
                          }}>
                            General Notes History
                          </h3>
                        </div>
                        <div style={{ padding: '1rem' }}>
                          {structuredNotes.generalNotes.map((entry, index) => (
                            <div key={index} style={{
                              borderLeft: '2px solid rgba(34, 197, 94, 0.3)',
                              paddingLeft: '0.75rem',
                              marginBottom: index < structuredNotes.generalNotes.length - 1 ? '0.75rem' : 0,
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '0.5rem'
                            }}>
                              <p style={{
                                color: 'var(--gray-700)',
                                fontSize: '0.875rem',
                                margin: 0,
                                lineHeight: '1.5',
                                flex: 1
                              }}>
                                {entry}
                              </p>
                              <button
                                onClick={() => handleDeleteHistoryEntry('General Notes', index)}
                                title="Delete entry"
                                style={{
                                  padding: '0.25rem',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#dc2626',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.1)'
                                }}
                              >
                                <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discussion Points History */}
                    {structuredNotes.discussionPoints.length > 0 && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.08)'
                      }}>
                        <div style={{
                          background: 'rgba(59, 130, 246, 0.08)',
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                          <h3 style={{
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: 'var(--gray-700)',
                            margin: 0
                          }}>
                            Discussion Points History
                          </h3>
                        </div>
                        <div style={{ padding: '1rem' }}>
                          {structuredNotes.discussionPoints.map((entry, index) => (
                            <div key={index} style={{
                              borderLeft: '2px solid rgba(59, 130, 246, 0.3)',
                              paddingLeft: '0.75rem',
                              marginBottom: index < structuredNotes.discussionPoints.length - 1 ? '0.75rem' : 0,
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: '0.5rem'
                            }}>
                              <p style={{
                                color: 'var(--gray-700)',
                                fontSize: '0.875rem',
                                margin: 0,
                                lineHeight: '1.5',
                                flex: 1
                              }}>
                                {entry}
                              </p>
                              <button
                                onClick={() => handleDeleteHistoryEntry('Discussion Points', index)}
                                title="Delete entry"
                                style={{
                                  padding: '0.25rem',
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  color: '#dc2626',
                                  transition: 'all 0.2s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                                onMouseEnter={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                                }}
                                onMouseLeave={(e) => {
                                  e.target.style.background = 'rgba(239, 68, 68, 0.1)'
                                }}
                              >
                                <Trash2 style={{ width: '0.75rem', height: '0.75rem' }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
    </div>
  )
}

export default NoteEditor
