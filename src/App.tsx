
import './App.css'
import Home from './components/Home.tsx';
import Login from './components/Login.tsx';

import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TaskProvider } from './context/Context.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

const App: React.FC = () => {

  return (
    <Router>
      <DndProvider backend={HTML5Backend}>
        <TaskProvider>

          <Routes>
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/" element={<Login />} />

          </Routes>

        </TaskProvider>
      </DndProvider>
    </Router>
  )
}

export default App
