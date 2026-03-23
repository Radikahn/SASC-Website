import { motion } from 'framer-motion'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/actex')({
  component: RouteComponent,
})

const features = [
  {
    title: 'Exam Prep Materials',
    description:
      'Comprehensive study manuals, practice exams, and formula sheets for P, FM, and advanced SOA/CAS exams.',
  },
  {
    title: 'GOAL Platform',
    description:
      'Interactive online practice with adaptive testing, progress tracking, and detailed solution walkthroughs.',
  },
  {
    title: 'Video Courses',
    description:
      'On-demand video lessons from experienced actuarial educators — learn at your own pace, anywhere.',
  },
]

function RouteComponent() {
  function goToDiscord() {
    window.open('https://discord.gg/ydpAQZ9XR4')
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      {/* Hero */}
      <section className="mt-16 sm:mt-32 flex flex-col items-center">
        <div className="rise-in">
          <span className="flex flex-1 justify-center font-normal text-3xl sm:text-5xl md:text-6xl text-center">
            S<span className="text-yellow-400">ä</span>SC{' '}
            <span className="ml-2 mr-2 font-semibold">&times;</span> ACTEX
          </span>
        </div>

        <div
          className="rise-in mt-6 max-w-2xl px-4 sm:px-0"
          style={{ animationDelay: '120ms' }}
        >
          <span className="flex justify-center text-base sm:text-lg text-center">
            We've partnered with ACTEX Learning to bring SJSU actuarial students
            an exclusive discount on industry-leading exam prep resources.
          </span>
        </div>
      </section>

      <hr className="mt-20 sm:mt-40 text-neutral-300/20" />

      {/* About ACTEX */}
      <section className="mt-16 sm:mt-40 flex flex-col items-center">
        <motion.div
          className="flex flex-col items-center max-w-2xl px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="text-2xl sm:text-4xl font-bold">
            About ACTEX Learning
          </span>
          <span className="mt-6 sm:mt-8 text-center text-base sm:text-xl font-normal">
            ACTEX Learning is a professor-endorsed benefit corporation that has
            helped thousands of actuarial candidates pass their exams. Their
            customizable study materials cover the full SOA and CAS exam
            pathways — from Exam P all the way through FSA and FCAS
            designations.
          </span>
        </motion.div>
      </section>

      <hr className="mt-20 sm:mt-40 mx-8 sm:mx-48 text-neutral-50/20" />

      {/* Features */}
      <section className="mt-16 sm:mt-40 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-2xl sm:text-4xl font-bold">What You Get</span>
        </motion.div>

        <div className="mt-10 sm:mt-16 flex flex-col md:flex-row gap-6 md:gap-8 max-w-4xl w-full px-4 sm:px-0">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="feature-card flex-1 rounded-2xl border border-(--line) p-6 sm:p-8 cursor-default hover:border-yellow-500 transition-all duration-600"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
            >
              <span className="text-lg sm:text-xl font-semibold">
                {feature.title}
              </span>
              <p className="mt-3 text-sm sm:text-base font-normal opacity-80">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <hr className="mt-20 sm:mt-40 mx-8 sm:mx-48 text-neutral-50/20" />

      {/* Promo CTA */}
      <section className="mt-16 sm:mt-40 mb-16 sm:mb-32 flex flex-col items-center">
        <motion.div
          className="flex flex-col items-center max-w-2xl px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="text-2xl sm:text-4xl font-bold text-center">
            Get Your Exclusive Discount
          </span>
          <span className="mt-6 sm:mt-8 text-center text-base sm:text-xl font-normal">
            As a S<span className="text-yellow-400">ä</span>SC member, you have
            access to a special promo code for discounted ACTEX materials. Join
            our Discord to claim yours.
          </span>

          <div className="mt-10 sm:mt-14 w-52 flex flex-col justify-center">
            <button
              className="
                promo-btn
                cursor-pointer
                px-6 py-3.5
                rounded-full
                text-sm font-semibold text-gray-900
                bg-white/70 backdrop-blur-sm
                border border-gray-200/50
                hover:bg-white/90 active:scale-95
              "
              onClick={goToDiscord}
            >
              Get the Promo Code
            </button>
          </div>
        </motion.div>
      </section>
    </main>
  )
}
