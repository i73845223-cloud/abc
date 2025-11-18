import BookmakingDashboard from "../../page"

interface CategoryPageProps {
  params: { category: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function CategoryPage({ params, searchParams }: CategoryPageProps) {
  return <BookmakingDashboard params={params} searchParams={searchParams} />
}