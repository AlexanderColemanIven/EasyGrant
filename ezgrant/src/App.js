import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route }
    from 'react-router-dom';
import HomePage from './pages/home';
import AdminPage from './pages/admin';
import GrantPostUserPage from './pages/postGrantUser';

function App() {
    return (
        <Router>
            <Routes>
                <Route exact path='/' element={<HomePage />} />
                <Route path='/admin' element={<AdminPage />} />
                <Route path='/postGrantsUser/' element={<GrantPostUserPage />} />
            </Routes>
        </Router>
    );
}
    
export default App;