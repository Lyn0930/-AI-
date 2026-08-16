import { useState, useCallback } from 'react';

export type UserRole = 'manager' | 'agent';

const STORAGE_KEY = 'swan_home_role';

export function useRole() {
  const [role, setRoleState] = useState<UserRole | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'manager' || stored === 'agent') return stored;
    return null;
  });

  const setRole = useCallback((r: UserRole) => {
    localStorage.setItem(STORAGE_KEY, r);
    setRoleState(r);
  }, []);

  const clearRole = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRoleState(null);
  }, []);

  return { role, setRole, clearRole };
}
