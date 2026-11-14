import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export default function useMapLocation(address, cep = '') {
  const [query, setQuery] = useState(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery({ address, cep }), 750);
    return () => window.clearTimeout(timer);
  }, [address, cep]);

  const active = address.length >= 3 && address === query?.address && cep === query.cep;
  const result = useQuery({
    queryKey: ['map-location', address, cep],
    queryFn: async ({ signal }) => {
      const response = await fetch('/api/mapa/localizar?' + new URLSearchParams({ q: address, ...(cep && { cep }) }), { signal });
      if (!response.ok) throw new Error('Consulta ao mapa indisponível.');
      return response.json();
    },
    enabled: active,
    staleTime: 60 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  return {
    retry: result.refetch,
    location: active ? result.data : null,
    error: active && result.isError,
    loading: address.length >= 3 && (!active || result.isPending || result.isFetching),
  };
}
