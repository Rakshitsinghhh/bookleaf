'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authorUser, setAuthorUser] = useState(null);
  const [authorToken, setAuthorToken] = useState(null);

  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState(null);

  const [currentPortal, setCurrentPortal] = useState('author'); // 'author' | 'admin'
  const [loading, setLoading] = useState(true);
  const [testAccounts, setTestAccounts] = useState({ authors: [], admins: [] });

  const [selectedAuthorEmail, setSelectedAuthorEmail] = useState('');

  // Initialize stored sessions - strictly enforce password authentication
  useEffect(() => {
    async function initAuth() {
      try {
        const accountsData = await api.auth.getTestAccounts();
        setTestAccounts(accountsData);

        // Always require author password on visits and reloads
        setAuthorToken(null);
        setAuthorUser(null);
        sessionStorage.removeItem('bookleaf_author_token');
        sessionStorage.removeItem('bookleaf_author_user');
        localStorage.removeItem('bookleaf_author_token');
        localStorage.removeItem('bookleaf_author_user');
        localStorage.removeItem('bookleaf_token');
        localStorage.removeItem('bookleaf_user');

        // Always require admin password on visits and reloads
        setAdminToken(null);
        setAdminUser(null);
        sessionStorage.removeItem('bookleaf_admin_token');
        sessionStorage.removeItem('bookleaf_admin_user');
        localStorage.removeItem('bookleaf_admin_token');
        localStorage.removeItem('bookleaf_admin_user');
      } catch (err) {
        console.error('Failed to initialize auth:', err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const setAdminUserSession = (user, token) => {
    setAdminUser(user);
    setAdminToken(token);
    sessionStorage.setItem('bookleaf_admin_user', JSON.stringify(user));
    sessionStorage.setItem('bookleaf_admin_token', token);
    localStorage.setItem('bookleaf_admin_user', JSON.stringify(user));
    localStorage.setItem('bookleaf_admin_token', token);
    localStorage.setItem('bookleaf_token', token);
    localStorage.setItem('bookleaf_user', JSON.stringify(user));
  };

  const setAuthorUserSession = (user, token) => {
    setAuthorUser(user);
    setAuthorToken(token);
    sessionStorage.setItem('bookleaf_author_user', JSON.stringify(user));
    sessionStorage.setItem('bookleaf_author_token', token);
    localStorage.setItem('bookleaf_token', token);
    localStorage.setItem('bookleaf_user', JSON.stringify(user));
  };

  const switchAuthor = async (targetAuthor) => {
    setLoading(true);
    try {
      const password = targetAuthor.name || targetAuthor.defaultPassword || 'author123';
      const res = await api.auth.authorLogin(targetAuthor.email, password);
      setAuthorUserSession(res.user, res.token);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const logoutAdmin = () => {
    setAdminUser(null);
    setAdminToken(null);
    sessionStorage.removeItem('bookleaf_admin_user');
    sessionStorage.removeItem('bookleaf_admin_token');
    localStorage.removeItem('bookleaf_admin_user');
    localStorage.removeItem('bookleaf_admin_token');
  };

  const logoutAuthor = () => {
    setAuthorUser(null);
    setAuthorToken(null);
    sessionStorage.removeItem('bookleaf_author_user');
    sessionStorage.removeItem('bookleaf_author_token');
    localStorage.removeItem('bookleaf_author_user');
    localStorage.removeItem('bookleaf_author_token');
    localStorage.removeItem('bookleaf_token');
    localStorage.removeItem('bookleaf_user');
  };

  // Determine active context based on current portal view
  const activeUser = currentPortal === 'admin' ? adminUser : authorUser;
  const activeToken = currentPortal === 'admin' ? adminToken : authorToken;
  const activeRole = currentPortal === 'admin' ? 'admin' : 'author';

  // Keep localStorage 'bookleaf_token' in sync with active portal
  useEffect(() => {
    if (currentPortal === 'admin' && adminToken) {
      localStorage.setItem('bookleaf_token', adminToken);
      localStorage.setItem('bookleaf_user', JSON.stringify(adminUser));
    } else if (currentPortal === 'author' && authorToken) {
      localStorage.setItem('bookleaf_token', authorToken);
      localStorage.setItem('bookleaf_user', JSON.stringify(authorUser));
    }
  }, [currentPortal, adminToken, authorToken, adminUser, authorUser]);

  const selectAuthorForLogin = (targetAuthor) => {
    logoutAuthor();
    setSelectedAuthorEmail(targetAuthor.email);
  };

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        token: activeToken,
        role: activeRole,
        authorUser,
        authorToken,
        adminUser,
        adminToken,
        currentPortal,
        setCurrentPortal,
        loading,
        testAccounts,
        selectedAuthorEmail,
        setSelectedAuthorEmail,
        selectAuthorForLogin,
        setAdminUserSession,
        setAuthorUserSession,
        switchAuthor,
        logoutAdmin,
        logoutAuthor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
