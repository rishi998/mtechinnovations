import { Skeleton } from '../ui/Skeleton'
import { Card } from '../ui/Card'

export function ProductCardSkeleton() {
  return (
    <Card>
      <Skeleton className="aspect-square w-full mb-4" />
      <Skeleton variant="text" className="w-1/3 mb-2" />
      <Skeleton variant="text" className="w-full mb-2" />
      <Skeleton variant="text" className="w-4/5 mb-3" />
      <Skeleton variant="text" className="w-1/2 mb-3" />
      <Skeleton className="w-full h-10" />
    </Card>
  )
}
