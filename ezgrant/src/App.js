import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route }
    from 'react-router-dom';
import HomePage from './pages/home';
import AdminPage from './pages/admin';


function App() {
    return (
        <Router>
            <Routes>
                <Route exact path='/' element={<HomePage />} />
                <Route path='/admin' element={<AdminPage />} />
            </Routes>
        </Router>
    );
}
    
export default App;