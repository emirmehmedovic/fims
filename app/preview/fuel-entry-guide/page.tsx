import { notFound } from 'next/navigation'
import GuidePreview from './preview'

// An isolated local preview: never exposes a demo session in production.
export default function Page() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <GuidePreview />
}
