import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"

function NotFoundRoute() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <h1 className="text-9xl font-bold text-gray-800">404</h1>
        <p className="mb-2 text-2xl font-bold text-gray-800">Page Not Found</p>
        <p className="mb-8 text-center text-gray-500">
          The page you are looking for does not exist.
        </p>

        <Button asChild size="lg">
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </div>
  )
}

export { NotFoundRoute }
