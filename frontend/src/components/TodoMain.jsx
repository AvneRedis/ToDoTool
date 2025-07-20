import { useState, useEffect } from 'react'
import { Search, Plus, Clock, Users, Zap, AlertTriangle, X, Archive } from 'lucide-react'

const TodoMain = () => {
  const [todos, setTodos] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompleted, setShowCompleted] = useState(false)
  const [newTodoText, setNewTodoText] = useState('')
  const [newTodoSection, setNewTodoSection] = useState('general')
  const [showNewTodoForm, setShowNewTodoForm] = useState(false)
  const [completedTodos, setCompletedTodos] = useState(new Set())
  const [hiddenTodos, setHiddenTodos] = useState(new Set())
  const [fadingTodos, setFadingTodos] = useState(new Set())
  const [quickAddText, setQuickAddText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedTodo, setSelectedTodo] = useState(null)
  const [todoDetails, setTodoDetails] = useState('')
  const [todoStakeholders, setTodoStakeholders] = useState('')
  const [todoTargetDate, setTodoTargetDate] = useState('')

  // Load todos and completed state from localStorage on component mount
  useEffect(() => {
    const loadTodos = () => {
      const savedTodos = localStorage.getItem('todoTool_todos')
      if (savedTodos) {
        const todosData = JSON.parse(savedTodos)
        setTodos(todosData)
      } else {
        // Initialize with mock data if no saved todos exist
        const mockTodos = [
          { id: 1, text: 'Review quarterly reports', section: 'high-priority', completed: false, createdAt: new Date() },
          { id: 2, text: 'Schedule team meeting', section: 'delegate', completed: false, createdAt: new Date() },
          { id: 3, text: 'Update project documentation', section: 'general', completed: false, createdAt: new Date() },
          { id: 4, text: 'Send follow-up emails', section: 'quick-wins', completed: false, createdAt: new Date() },
          { id: 5, text: 'Prepare presentation slides', section: 'high-priority', completed: false, createdAt: new Date() },
          { id: 6, text: 'Order office supplies', section: 'quick-wins', completed: false, createdAt: new Date() },
        ]
        setTodos(mockTodos)
        localStorage.setItem('todoTool_todos', JSON.stringify(mockTodos))
      }
    }

    const loadCompletedTodos = () => {
      const savedCompleted = localStorage.getItem('todoTool_completedTodos')
      if (savedCompleted) {
        const completedIds = JSON.parse(savedCompleted)
        setCompletedTodos(new Set(completedIds))

        // Hide completed todos immediately on page load (they should be hidden after 5 seconds)
        // We assume that if they're in localStorage as completed, they should be hidden
        setHiddenTodos(new Set(completedIds))
      }
    }

    loadTodos()
    loadCompletedTodos()

    // Listen for storage changes (when todos are added from other components)
    const handleStorageChange = (e) => {
      if (e.key === 'todoTool_todos') {
        loadTodos()
      }
      if (e.key === 'todoTool_completedTodos') {
        loadCompletedTodos()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom events (for same-tab updates)
    const handleTodosUpdate = () => {
      loadTodos()
    }

    window.addEventListener('todosUpdated', handleTodosUpdate)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('todosUpdated', handleTodosUpdate)
    }
  }, [])

  const sections = {
    'quick-wins': { title: 'Quick Wins', icon: Zap, color: 'var(--green-500)' },
    'delegate': { title: 'Delegate', icon: Users, color: 'var(--blue-500)' },
    'general': { title: 'General', icon: Clock, color: 'var(--gray-500)' },
    'high-priority': { title: 'High Priority', icon: AlertTriangle, color: 'var(--red-500)' }
  }

  const filteredTodos = todos.filter(todo => {
    const matchesSearch = todo.text.toLowerCase().includes(searchQuery.toLowerCase())
    // Show all todos if showCompleted is true, otherwise hide the hidden ones
    const isVisible = showCompleted || !hiddenTodos.has(todo.id)
    return matchesSearch && isVisible
  })

  const getTodosBySection = (section) => {
    return filteredTodos.filter(todo => todo.section === section)
  }

  const handleToggleComplete = (todoId) => {
    const newCompletedTodos = new Set(completedTodos)

    if (completedTodos.has(todoId)) {
      // Unchecking - remove from completed, hidden, and fading
      newCompletedTodos.delete(todoId)
      setHiddenTodos(prev => {
        const updated = new Set(prev)
        updated.delete(todoId)
        return updated
      })
      setFadingTodos(prev => {
        const updated = new Set(prev)
        updated.delete(todoId)
        return updated
      })
    } else {
      // Checking - add to completed and schedule hiding
      newCompletedTodos.add(todoId)

      // Start fading animation after 3 seconds
      setTimeout(() => {
        setFadingTodos(prev => {
          const updated = new Set(prev)
          updated.add(todoId)
          return updated
        })
      }, 3000)

      // Auto-hide completed todos after 5 seconds
      setTimeout(() => {
        setHiddenTodos(prev => {
          const updated = new Set(prev)
          updated.add(todoId)
          return updated
        })
        setFadingTodos(prev => {
          const updated = new Set(prev)
          updated.delete(todoId)
          return updated
        })
      }, 5000)
    }

    setCompletedTodos(newCompletedTodos)
    // Save completed todos to localStorage
    localStorage.setItem('todoTool_completedTodos', JSON.stringify([...newCompletedTodos]))
  }

  const handleAddTodo = (e) => {
    e.preventDefault()
    if (!newTodoText.trim()) return

    const newTodo = {
      id: Date.now(),
      text: newTodoText.trim(),
      section: newTodoSection,
      completed: false,
      createdAt: new Date()
    }

    const updatedTodos = [...todos, newTodo]
    setTodos(updatedTodos)
    localStorage.setItem('todoTool_todos', JSON.stringify(updatedTodos))
    setNewTodoText('')
    setShowNewTodoForm(false)
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

    const updatedTodos = [...todos, newTodo]
    setTodos(updatedTodos)
    localStorage.setItem('todoTool_todos', JSON.stringify(updatedTodos))
    setQuickAddText('')
    setSelectedCategory(null)
  }

  const handleArchiveTodo = (todoId) => {
    // Permanently remove the todo from all states
    const updatedTodos = todos.filter(todo => todo.id !== todoId)
    setTodos(updatedTodos)
    localStorage.setItem('todoTool_todos', JSON.stringify(updatedTodos))
    setCompletedTodos(prev => {
      const updated = new Set(prev)
      updated.delete(todoId)
      // Save updated completed todos to localStorage
      localStorage.setItem('todoTool_completedTodos', JSON.stringify([...updated]))
      return updated
    })
    setHiddenTodos(prev => {
      const updated = new Set(prev)
      updated.delete(todoId)
      return updated
    })
    setFadingTodos(prev => {
      const updated = new Set(prev)
      updated.delete(todoId)
      return updated
    })
    // Close detail view if this todo was selected
    if (selectedTodo && selectedTodo.id === todoId) {
      setSelectedTodo(null)
      setTodoDetails('')
      setTodoStakeholders('')
      setTodoTargetDate('')
    }
  }

  const handleSelectTodo = (todo) => {
    // If clicking the same todo, unselect it
    if (selectedTodo && selectedTodo.id === todo.id) {
      setSelectedTodo(null)
      setTodoDetails('')
      setTodoStakeholders('')
      setTodoTargetDate('')
      return
    }

    setSelectedTodo(todo)
    // Load existing details if any (for now using mock data structure)
    setTodoDetails(todo.details || '')
    setTodoStakeholders(todo.stakeholders || '')
    setTodoTargetDate(todo.targetDate || '')
  }

  const handleSaveTodoDetails = () => {
    if (!selectedTodo) return

    // Update the todo with new details
    const updatedTodos = todos.map(todo =>
      todo.id === selectedTodo.id
        ? {
            ...todo,
            details: todoDetails,
            stakeholders: todoStakeholders,
            targetDate: todoTargetDate
          }
        : todo
    )
    setTodos(updatedTodos)
    localStorage.setItem('todoTool_todos', JSON.stringify(updatedTodos))

    // Update selected todo state
    setSelectedTodo(prev => ({
      ...prev,
      details: todoDetails,
      stakeholders: todoStakeholders,
      targetDate: todoTargetDate
    }))
  }

  const handleCloseTodoDetails = () => {
    setSelectedTodo(null)
    setTodoDetails('')
    setTodoStakeholders('')
    setTodoTargetDate('')
  }

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        if (showNewTodoForm) {
          setShowNewTodoForm(false)
        }
      }
    }

    // Add event listener when modal is open
    if (showNewTodoForm) {
      document.addEventListener('keydown', handleEscKey)
    }

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showNewTodoForm])

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
    <div className="todo-main">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--gray-900)', margin: 0 }}>
            Todo Dashboard
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={showCompleted ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ fontSize: '0.875rem' }}
            >
              {showCompleted ? 'Hide Completed' : 'Show Completed'}
            </button>
            <button
              onClick={() => setShowNewTodoForm(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Add Todo
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', maxWidth: '400px' }}>
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
            placeholder="Search todos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{ paddingLeft: '2.5rem' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
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

      {/* Todo Sections Grid */}
      <div className="todo-sections-grid">
        {Object.entries(sections).map(([sectionKey, section]) => {
          const sectionTodos = getTodosBySection(sectionKey)
          const Icon = section.icon

          return (
            <div key={sectionKey} className="todo-section" style={{
              backgroundColor: '#ffffff52',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--gray-200)',
              overflow: 'hidden'
            }}>
              {/* Section Header */}
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid var(--gray-200)',
                backgroundColor: 'var(--gray-50)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon style={{ width: '1.25rem', height: '1.25rem', color: section.color }} />
                  <h3 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    color: 'var(--gray-900)', 
                    margin: 0 
                  }}>
                    {section.title}
                  </h3>
                  <span style={{
                    backgroundColor: section.color,
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    minWidth: '1.5rem',
                    textAlign: 'center'
                  }}>
                    {sectionTodos.length}
                  </span>
                </div>
              </div>

              {/* Todo Items */}
              <div style={{ padding: '1rem' }}>
                {sectionTodos.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--gray-400)',
                    fontSize: '0.875rem',
                    fontStyle: 'italic',
                    padding: '2rem 1rem'
                  }}>
                    {searchQuery ? `No todos match "${searchQuery}"` : 'No todos yet'}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {sectionTodos.map((todo) => (
                      <div
                        key={todo.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          border: selectedTodo && selectedTodo.id === todo.id
                            ? '2px solid var(--primary-500)'
                            : '1px solid var(--gray-200)',
                          backgroundColor: completedTodos.has(todo.id) ? 'var(--gray-50)' : 'white',
                          opacity: fadingTodos.has(todo.id) ? 0.3 : (completedTodos.has(todo.id) ? 0.7 : 1),
                          transition: 'all 0.5s ease',
                          transform: fadingTodos.has(todo.id) ? 'scale(0.95)' : 'scale(1)',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSelectTodo(todo)}
                      >
                        <input
                          type="checkbox"
                          checked={completedTodos.has(todo.id)}
                          onChange={(e) => {
                            e.stopPropagation() // Prevent triggering todo selection
                            handleToggleComplete(todo.id)
                          }}
                          onClick={(e) => e.stopPropagation()} // Also prevent click propagation
                          style={{
                            width: '1rem',
                            height: '1rem',
                            marginTop: '0.125rem',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{
                          flex: 1,
                          fontSize: '0.875rem',
                          color: completedTodos.has(todo.id) ? 'var(--gray-500)' : 'var(--gray-900)',
                          textDecoration: completedTodos.has(todo.id) ? 'line-through' : 'none',
                          lineHeight: '1.4'
                        }}>
                          {searchQuery ? highlightSearchTerm(todo.text, searchQuery) : todo.text}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation() // Prevent triggering todo selection
                            handleArchiveTodo(todo.id)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.6,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.opacity = '1'
                            e.target.style.backgroundColor = 'var(--red-50)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.opacity = '0.6'
                            e.target.style.backgroundColor = 'transparent'
                          }}
                          title="Archive todo"
                        >
                          <Archive style={{
                            width: '0.875rem',
                            height: '0.875rem',
                            color: 'var(--red-500)'
                          }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Todo Detail View */}
      {selectedTodo && (
        <div style={{ marginTop: '2rem' }}>
          <div className="todo-detail-section" style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--primary-200)',
            overflow: 'hidden'
          }}>
            {/* Detail Header */}
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid var(--gray-200)',
              backgroundColor: 'var(--primary-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--gray-900)',
                  margin: 0
                }}>
                  {selectedTodo.text}
                </h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {/* Show which sections this todo belongs to */}
                  {todos.filter(t => t.text === selectedTodo.text).map(todo => {
                    const section = sections[todo.section]
                    const Icon = section.icon
                    return (
                      <div
                        key={`${todo.id}-${todo.section}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: section.color,
                          color: 'white',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        <Icon style={{ width: '0.875rem', height: '0.875rem' }} />
                        {section.title}
                      </div>
                    )
                  })}
                </div>
              </div>
              <button
                onClick={handleCloseTodoDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--gray-500)'
                }}
              >
                <X style={{ width: '1.25rem', height: '1.25rem' }} />
              </button>
            </div>

            {/* Detail Content */}
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                {/* Left Column */}
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      color: 'var(--gray-700)'
                    }}>
                      Details
                    </label>
                    <textarea
                      value={todoDetails}
                      onChange={(e) => setTodoDetails(e.target.value)}
                      onBlur={handleSaveTodoDetails}
                      placeholder="Add detailed description, notes, or requirements..."
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        resize: 'vertical',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      color: 'var(--gray-700)'
                    }}>
                      Stakeholders
                    </label>
                    <input
                      type="text"
                      value={todoStakeholders}
                      onChange={(e) => setTodoStakeholders(e.target.value)}
                      onBlur={handleSaveTodoDetails}
                      placeholder="Add people involved (e.g., John, Sarah, Marketing Team)"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      color: 'var(--gray-700)'
                    }}>
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={todoTargetDate}
                      onChange={(e) => setTodoTargetDate(e.target.value)}
                      onBlur={handleSaveTodoDetails}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Todo Modal */}
      {showNewTodoForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            margin: '1rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              Add New Todo
            </h3>
            <form onSubmit={handleAddTodo}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Todo Text
                </label>
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Enter todo description..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem'
                  }}
                  autoFocus
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                  Section
                </label>
                <select
                  value={newTodoSection}
                  onChange={(e) => setNewTodoSection(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--gray-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem'
                  }}
                >
                  {Object.entries(sections).map(([key, section]) => (
                    <option key={key} value={key}>{section.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowNewTodoForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Add Todo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
        <input
          type="text"
          placeholder="Add a new task"
          value={quickAddText}
          onChange={(e) => setQuickAddText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            border: '1px solid var(--gray-300)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            outline: 'none'
          }}
        />

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
    </div>
  )
}

export default TodoMain
