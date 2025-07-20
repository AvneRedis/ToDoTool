import { useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import NotesTab from './components/NotesTab'
import TodoMain from './components/TodoMain'
import BackgroundSlideshow from './components/BackgroundSlideshow'
import { SearchProvider } from './contexts/SearchContext'
import './App.css'

function App() {
  const [sharedNotes, setSharedNotes] = useState([])

  const handleNotesChange = useCallback((notes) => {
    console.log('App.jsx handleNotesChange called with', notes.length, 'notes')
    setSharedNotes(notes)
  }, [])

  return (
    <Router>
      <SearchProvider>
        <div className="App">
          <BackgroundSlideshow />
          <Layout onNotesChange={handleNotesChange} sharedNotes={sharedNotes}>
            <Routes>
              <Route path="/" element={<TodoMain />} />
              <Route path="/notes" element={<NotesTab sharedNotes={sharedNotes} onNotesChange={handleNotesChange} />} />
            </Routes>
          </Layout>
        </div>
      </SearchProvider>
    </Router>
  )
}

export default App
