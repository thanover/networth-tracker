import { useState, useEffect, useCallback } from 'react';
import { accountsApi } from '@/api/accounts';

export function useAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await accountsApi.list();
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const create = useCallback(async (data) => {
    const account = await accountsApi.create(data);
    setAccounts(prev => [...prev, account]);
    return account;
  }, []);

  const update = useCallback(async (id, data) => {
    const account = await accountsApi.update(id, data);
    setAccounts(prev => prev.map(a => a._id === id ? account : a));
    return account;
  }, []);

  const remove = useCallback(async (id) => {
    await accountsApi.remove(id);
    setAccounts(prev => prev.filter(a => a._id !== id));
  }, []);

  const assets = accounts.filter(a => a.category === 'asset');
  const debts  = accounts.filter(a => a.category === 'debt');
  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalDebts  = debts.reduce((sum, a) => sum + a.balance, 0);
  const netWorth    = totalAssets - totalDebts;

  return { accounts, assets, debts, totalAssets, totalDebts, netWorth, loading, error, create, update, remove, reload: fetch };
}
