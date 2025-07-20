import { createContext, useContext, useState } from 'react'

const SearchContext = createContext()

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredNotes, setFilteredNotes] = useState([])
  const [allNotes, setAllNotes] = useState([])

  const updateNotes = (notes) => {
    setAllNotes(notes)
    filterNotes(notes, searchQuery)
  }

  const updateSearchQuery = (query) => {
    setSearchQuery(query)
    filterNotes(allNotes, query)
  }

  const filterNotes = (notes, query) => {
    if (!query.trim()) {
      setFilteredNotes(notes)
      return
    }

    const filtered = notes.filter(note => 
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      (note.general_notes && note.general_notes.toLowerCase().includes(query.toLowerCase())) ||
      (note.discussion_points && note.discussion_points.toLowerCase().includes(query.toLowerCase())) ||
      (note.todo_items && note.todo_items.toLowerCase().includes(query.toLowerCase()))
    )
    setFilteredNotes(filtered)
  }

  const value = {
    searchQuery,
    filteredNotes,
    allNotes,
    updateNotes,
    updateSearchQuery,
    hasSearchQuery: searchQuery.trim().length > 0
  }

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  )
}
