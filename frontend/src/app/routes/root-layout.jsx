import { useEffect } from "react"
import { Outlet, useMatches } from "react-router-dom"

const DEFAULT_TITLE = "Hungry Library"

export default function RootLayout() {
  const matches = useMatches()

  useEffect(() => {
    const lastMatchWithTitle = [...matches]
      .reverse()
      .find((match) => match.handle?.title)

    document.title = lastMatchWithTitle?.handle?.title || DEFAULT_TITLE
  }, [matches])

  return <Outlet />
}
