import React, { useState, useEffect, useRef } from 'react'
import './NavBar.css'

export default function NavBar({ user, onLogin, onLogout }) {
    const [showMenu, setShowMenu] = useState(false)
    const [showLoginModal, setShowLoginModal] = useState(false)
    const menuRef = useRef(null)
    const [loginForm, setLoginForm] = useState({
        username: '',
        password: '',
        role: 'student',
    })

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                console.log('[NavBar] Click outside detected, closing menu')
                setShowMenu(false)
            }
        }

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showMenu])

    const handleMenuClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('[NavBar] Menu clicked. User:', user, 'Current showMenu:', showMenu)
        if (user) {
            setShowMenu(!showMenu)
            console.log('[NavBar] Toggling menu to:', !showMenu)
        } else {
            setShowLoginModal(true)
        }
    }

    const handleRoleChange = (e) => {
        setLoginForm((prev) => ({
            ...prev,
            role: e.target.value,
        }))
    }

    const handleUsernameChange = (e) => {
        setLoginForm((prev) => ({
            ...prev,
            username: e.target.value,
        }))
    }

    const handlePasswordChange = (e) => {
        setLoginForm((prev) => ({
            ...prev,
            password: e.target.value,
        }))
    }

    const handleLogin = (e) => {
        e.preventDefault()
        if (!loginForm.username || !loginForm.password) {
            alert('Please enter username and password')
            return
        }
        onLogin({
            username: loginForm.username,
            password: loginForm.password,
            role: loginForm.role,
        })
        setLoginForm({ username: '', password: '', role: 'student' })
        setShowLoginModal(false)
        setShowMenu(false)
    }

    const handleLogout = (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('[NavBar] Logout clicked')
        onLogout()
        setShowMenu(false)
    }

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return '👑'
            case 'manager':
                return '👔'
            case 'student':
                return '🎓'
            default:
                return '👤'
        }
    }

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin':
                return 'badge-admin'
            case 'manager':
                return 'badge-manager'
            case 'student':
                return 'badge-student'
            default:
                return ''
        }
    }

    return (
        <>
            <nav className="navbar">
                <div className="navbar-brand">
                    <h2>📚 AcadResolve</h2>
                </div>
                <div className="navbar-menu" ref={menuRef}>
                    <button
                        type="button"
                        className={`menu-badge ${user ? getRoleBadgeClass(user.role) : ''}`}
                        onClick={handleMenuClick}
                    >
                        <span className="badge-icon">{user ? getRoleIcon(user.role) : '🔐'}</span>
                        <span className="badge-text">
                            {user ? `${user.username} (${user.role})` : 'Login'}
                        </span>
                        <span className="badge-dropdown">▼</span>
                    </button>

                    {showMenu && user && (
                        <div className="dropdown-menu">
                            <div className="menu-header">
                                <span className="user-info">
                                    {getRoleIcon(user.role)} {user.username}
                                </span>
                                <span className="role-badge">{user.role.toUpperCase()}</span>
                            </div>
                            <hr />
                            <button
                                type="button"
                                className="menu-item logout"
                                onClick={handleLogout}
                            >
                                🚪 Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="login-modal-overlay" onClick={() => setShowLoginModal(false)}>
                    <div className="login-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Login to AcadResolve</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowLoginModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="username">Username:</label>
                                <input
                                    type="text"
                                    id="username"
                                    value={loginForm.username}
                                    onChange={handleUsernameChange}
                                    placeholder="Enter your username"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password:</label>
                                <input
                                    type="password"
                                    id="password"
                                    value={loginForm.password}
                                    onChange={handlePasswordChange}
                                    placeholder="Enter your password"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="role">Login As:</label>
                                <select
                                    id="role"
                                    value={loginForm.role}
                                    onChange={handleRoleChange}
                                >
                                    <option value="student">🎓 Student</option>
                                    <option value="manager">👔 Manager</option>
                                    <option value="admin">👑 Admin</option>
                                </select>
                            </div>

                            <div className="role-description">
                                {loginForm.role === 'student' && (
                                    <p>View and report only your own incidents</p>
                                )}
                                {loginForm.role === 'manager' && (
                                    <p>Assess and approve incidents for your department</p>
                                )}
                                {loginForm.role === 'admin' && (
                                    <p>Full access to all incidents and system administration</p>
                                )}
                            </div>

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => setShowLoginModal(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-login">
                                    Login
                                </button>
                            </div>
                        </form>

                        <div className="demo-credentials">
                            <p><strong>Demo Credentials:</strong></p>
                            <p>Student: john_doe / pass123</p>
                            <p>Manager: jane_smith / pass123</p>
                            <p>Admin: admin_user / pass123</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
