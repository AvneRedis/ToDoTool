import { useState, useEffect } from 'react'
import { Plus, Check, X, Edit, Trash2, Calendar, AlertCircle, CheckSquare } from 'lucide-react'
import { todosApi } from '../services/api'

const TodosTab = () => {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, active, completed
  const [showNewTodoForm, setShowNewTodoForm] = useState(false)
  const [editingTodo, setEditingTodo] = useState(null)
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: ''
  })

  useEffect(() => {
    loadTodos()
  }, [])

  const loadTodos = async () => {
    try {
      const response = await todosApi.getAll()
      setTodos(response.data)
    } catch (error) {
      console.error('Error loading todos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTodo = async (e) => {
    e.preventDefault()
    if (!newTodo.title.trim()) return

    try {
      const todoData = {
        ...newTodo,
        due_date: newTodo.due_date || null
      }
      await todosApi.create(todoData)
      setNewTodo({ title: '', description: '', priority: 'medium', due_date: '' })
      setShowNewTodoForm(false)
      loadTodos()
    } catch (error) {
      console.error('Error creating todo:', error)
    }
  }

  const handleToggleTodo = async (todoId) => {
    try {
      await todosApi.toggle(todoId)
      loadTodos()
    } catch (error) {
      console.error('Error toggling todo:', error)
    }
  }

  const handleDeleteTodo = async (todoId) => {
    if (!confirm('Are you sure you want to delete this todo?')) return

    try {
      await todosApi.delete(todoId)
      loadTodos()
    } catch (error) {
      console.error('Error deleting todo:', error)
    }
  }

  const handleUpdateTodo = async (todoId, updatedData) => {
    try {
      await todosApi.update(todoId, updatedData)
      setEditingTodo(null)
      loadTodos()
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const isOverdue = (dueDate) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Tasks & Goals 🎯
            </h1>
            <p className="text-gray-600">{getCurrentDate()}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
            <button
              onClick={() => setShowNewTodoForm(true)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/60 backdrop-blur-sm p-1 rounded-xl w-fit border border-gray-200/50">
          {[
            { key: 'all', label: 'All' },
            { key: 'active', label: 'Active' },
            { key: 'completed', label: 'Completed' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* New Todo Form */}
        {showNewTodoForm && (
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-6 mb-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Create New Task</h3>
            <form onSubmit={handleCreateTodo} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={newTodo.title}
                  onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                  placeholder="Task title"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60"
                  autoFocus
                />
              </div>
              <div>
                <textarea
                  value={newTodo.description}
                  onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                  placeholder="Description (optional)"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none h-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60"
                />
              </div>
              <div className="flex space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  <input
                    type="datetime-local"
                    value={newTodo.due_date}
                    onChange={(e) => setNewTodo({ ...newTodo, due_date: e.target.value })}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/60"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewTodoForm(false)
                    setNewTodo({ title: '', description: '', priority: 'medium', due_date: '' })
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Todos List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No tasks found</p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                isEditing={editingTodo === todo.id}
                onToggle={() => handleToggleTodo(todo.id)}
                onDelete={() => handleDeleteTodo(todo.id)}
                onEdit={() => setEditingTodo(todo.id)}
                onUpdate={(data) => handleUpdateTodo(todo.id, data)}
                onCancelEdit={() => setEditingTodo(null)}
                getPriorityColor={getPriorityColor}
                isOverdue={isOverdue}
              />
            ))
          )}
        </div>
      </div>

      {/* Bottom Input Area */}
      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 px-8 py-4">
        <form onSubmit={handleCreateTodo} className="flex items-center space-x-3">
          <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
          <input
            type="text"
            value={newTodo.title}
            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
            placeholder="+ Add a task"
            className="flex-1 bg-transparent text-gray-700 placeholder-gray-400 focus:outline-none text-sm"
          />
        </form>
      </div>
    </>
  )
}

// TodoItem Component
const TodoItem = ({ 
  todo, 
  isEditing, 
  onToggle, 
  onDelete, 
  onEdit, 
  onUpdate, 
  onCancelEdit, 
  getPriorityColor, 
  isOverdue 
}) => {
  const [editData, setEditData] = useState({
    title: todo.title,
    description: todo.description || '',
    priority: todo.priority,
    due_date: todo.due_date ? new Date(todo.due_date).toISOString().slice(0, 16) : ''
  })

  const handleUpdate = (e) => {
    e.preventDefault()
    onUpdate({
      ...editData,
      due_date: editData.due_date || null
    })
  }

  if (isEditing) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 shadow-sm">
        <form onSubmit={handleUpdate} className="space-y-3">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white/60"
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg resize-none h-20 bg-white/60"
            placeholder="Description"
          />
          <div className="flex space-x-4">
            <select
              value={editData.priority}
              onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white/60"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <input
              type="datetime-local"
              value={editData.due_date}
              onChange={(e) => setEditData({ ...editData, due_date: e.target.value })}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white/60"
            />
          </div>
          <div className="flex space-x-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 font-medium"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className={`group bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-xl p-4 hover:shadow-md hover:bg-white/80 transition-all duration-200 ${
      todo.completed ? 'opacity-75' : ''
    }`}>
      <div className="flex items-start space-x-4">
        <button
          onClick={onToggle}
          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            todo.completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-blue-400'
          }`}
        >
          {todo.completed && <Check className="w-3 h-3" />}
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`font-medium ${
              todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
            }`}>
              {todo.title}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(todo.priority)}`}>
                {todo.priority}
              </span>
              <button
                onClick={onEdit}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-yellow-500 transition-all">
                <Star className="w-4 h-4" />
              </button>
            </div>
          </div>

          {todo.description && (
            <p className={`text-sm mt-1 ${
              todo.completed ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {todo.description}
            </p>
          )}

          <div className="flex items-center mt-2 space-x-2">
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              Tasks
            </span>
            <span className="text-xs text-gray-400">
              {new Date(todo.created_at).toLocaleDateString()}
            </span>
            {todo.due_date && (
              <span className={`flex items-center text-xs ${
                isOverdue(todo.due_date) && !todo.completed ? 'text-red-600' : 'text-gray-400'
              }`}>
                {isOverdue(todo.due_date) && !todo.completed && (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                <Calendar className="w-3 h-3 mr-1" />
                Due: {new Date(todo.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TodosTab
