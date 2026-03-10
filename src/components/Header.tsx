import { Link } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  return (
    <header className="flex flex-1 justify-items-center sticky top-0 z-50 h-20 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <div className="flex flex-1 justify-between items-center">
        <div className="cursor-default">
          <span className="flex flex-1 justify-items-center font-normal text-4xl">
            S<span className="text-yellow-400">ä</span>
            SC
          </span>
          <span>Spartan Actuarial Science Club</span>
        </div>
      </div>
    </header>
  )
}
