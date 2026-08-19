import { useCurrentDigest } from '@/hooks/useDigest'
import DigestCard from '@/components/digest/DigestCard'

export default function DigestWidget() {
  const { data, isLoading, isError, refetch } = useCurrentDigest()

  return <DigestCard data={data} isLoading={isLoading} isError={isError} onRetry={() => refetch()} />
}