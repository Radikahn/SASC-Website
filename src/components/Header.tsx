import { useNavigate } from '@tanstack/react-router'

export default function Header() {
  const nav = useNavigate()

  const goToHome = () => {
    nav({ to: '/' })
  }

  const goToWalter = () => {
    nav({ to: '/walter' })
  }

  const goToActex = () => {
    nav({ to: '/actex' })
  }
  return (
    <header className="flex flex-1 justify-items-center sticky top-0 z-50 h-16 sm:h-20 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <div className="flex flex-1 justify-between items-center">
        <div id="logo" className="cursor-pointer min-w-0">
          <span onClick={goToHome}>
            <span className="flex flex-1 justify-items-center font-normal text-2xl sm:text-4xl">
              S<span className="text-yellow-400">ä</span>
              SC
            </span>
            <span className="hidden sm:inline">
              Spartan Actuarial Science Club
            </span>
          </span>
        </div>
        <div
          id="nav-items"
          className="flex flex-row gap-4 sm:gap-6 shrink-0 mr-8"
        >
          <span className="space-x-4 font-normal text-sm sm:text-lg">
            <span
              className="cursor-pointer hover:text-amber-300 transition-all duration-600"
              onClick={goToHome}
            >
              Home
            </span>
          </span>

          <span className="font-normal text-sm sm:text-lg">
            <span
              className="cursor-pointer hover:text-amber-300 transition-all duration-600"
              onClick={goToActex}
            >
              Actex
            </span>
          </span>
          <span className="font-normal text-sm sm:text-lg">
            <span
              className="cursor-pointer hover:text-amber-300 transition-all duration-600"
              onClick={goToWalter}
            >
              Practice Problems
            </span>
          </span>
        </div>
      </div>
    </header>
  )
}
