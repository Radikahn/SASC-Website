import WalterHero from '#/components/walter/WalterHero'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/walter')({
  component: RouteComponent,
})

function RouteComponent() {
  function goToDiscord() {
    window.open('https://discord.gg/fQxkYq8Tc7')
  }
  return (
    <section className="flex flex-col justify-center">
      <div className="mt-8 flex flex-col justify-center">
        <WalterHero />
        <div
          id="discord-plug"
          className="flex flex-col items-center justify-center"
        >
          <span className="text-center font-semibold text-4xl">
            Available for all SASC members on our Discord now!
          </span>
          <div className="mt-6 w-48 flex flex-col justify-center">
            <button
              className="
                        cursor-pointer
                        px-6 py-2.5
                        rounded-full
                        text-sm font-semibold text-gray-900
                        bg-white/70 backdrop-blur-sm
                        border border-gray-200/50
                        hover:bg-white/90 active:scale-95
                        group
                        "
              style={{
                boxShadow: '0 25px 50px -12px transparent',
                transition:
                  'box-shadow 1000ms ease, background-color 200ms ease, transform 100ms ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow =
                  '0 25px 50px -12px rgba(252,211,77,0.2)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.boxShadow =
                  '0 25px 50px -12px transparent')
              }
              onClick={goToDiscord}
            >
              Join Now
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
