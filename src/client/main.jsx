import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app'
import './app.css'

// Initialize React app
const root = document.getElementById('root')
if (root && !root._react_root_initialized) {
    root._react_root_initialized = true
    const reactRoot = ReactDOM.createRoot(root)
    reactRoot.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    )
} else if (!root) {
    console.error('Failed to find root element')
}
