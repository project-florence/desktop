import { useQuery } from '@tanstack/react-query'
import { fetchCurrentDigest, fetchDigestByDateSlot } from '@/lib/digestApi'
import type { DigestSlot } from '@/types/api'

export function useCurrentDigest() {
  return useQuery({
    queryKey: ['digest', 'current'],
    queryFn: fetchCurrentDigest,
    staleTime: 60_000,
    refetchInterval: 300_000,
  })
}

export function useDigestByDateSlot(date: string, slot: DigestSlot) {
  return useQuery({
    queryKey: ['digest', date, slot],
    queryFn: () => fetchDigestByDateSlot(date, slot),
    enabled: !!date,
    staleTime: 60_000,
  })
}