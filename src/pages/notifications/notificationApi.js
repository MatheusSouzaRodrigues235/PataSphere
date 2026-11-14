import { useQuery, useQueryClient } from '@tanstack/react-query';

export const notificationsPath = '/notificacoes';

export async function requestNotifications(path, options) {
  const response = await fetch('/api/notificacoes' + path, options);
  if (response.status === 204) return null;
  const result = await response.json().catch(() => null);
  if (!response.ok || !result) throw new Error(result?.message ?? 'Não foi possível acessar as notificações.');
  return result;
}

export function useNotifications(accountId, path, live = true) {
  return useQuery({
    queryKey: ['notifications', accountId, path],
    queryFn: ({ signal }) => requestNotifications(path, { signal }),
    enabled: Boolean(accountId),
    refetchInterval: live ? 15_000 : false,
  });
}

export function useRefreshNotifications() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['notifications'] });
}
