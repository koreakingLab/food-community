// client/src/hooks/useHaccp.js
import { useState, useEffect, useCallback } from 'react';

export function useHaccp() {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/haccp?pageNo=${page}&numOfRows=${pageSize}&search=${encodeURIComponent(search)}`
      );
      const data = await res.json();
      setItems(data.items);
      setTotalCount(data.totalCount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { items, totalCount, page, setPage, search, setSearch, loading, pageSize };
}