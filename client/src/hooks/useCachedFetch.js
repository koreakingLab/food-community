import { useState, useEffect } from 'react';

export default function useCachedFetch(url) {
  const [data, setData] = useState(() => {
    const cached = sessionStorage.getItem(url);
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
        sessionStorage.setItem(url, JSON.stringify(json));
      })
      .catch(() => setLoading(false));
  }, [url]);

  return { data, loading };
}