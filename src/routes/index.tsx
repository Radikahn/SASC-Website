import { CTA } from '#/components/CTA'
import Hero from '#/components/Hero'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section>
        <div className="mt-32 flex flex-1 justify-center">
          <Hero />
        </div>
      </section>

      <hr className="mt-80 text-neutral-300/20"></hr>

      <section className="mt-40">
        <div className="flex flex-1 justify-center">
          <CTA />
        </div>
      </section>
    </main>
  )
}
