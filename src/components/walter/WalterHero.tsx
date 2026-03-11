import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

function LazyVideo({
  src,
  className,
}: {
  src: string
  className: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="w-full max-w-[800px] px-4 sm:px-0"
    >
      {isInView && (
        <video
          className={className}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          style={{ width: '100%', height: 'auto' }}
        />
      )}
    </motion.div>
  )
}

export default function WalterHero() {
  return (
    <div className="flex flex-col justify-center">
      <section>
        <div
          id="walter-demo"
          className="flex flex-col items-center justify-center"
        >
          <LazyVideo
            className="rounded-2xl sm:rounded-4xl border border-neutral-100/20 hover:border-yellow-200/40 transition-all duration-500"
            src="assets/openWalter.mp4"
          />
        </div>

        <motion.div
          className="mt-8 sm:mt-12 flex flex-col justify-center px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col text-center cursor-default">
            <span className="text-2xl sm:text-4xl font-semibold">
              Welcome to Walter bot!
            </span>
            <span className="mt-3 sm:mt-4 text-base sm:text-xl font-normal">
              The ultimate Discord bot made to practice for actuary exams!
            </span>
          </div>
        </motion.div>
      </section>

      <hr className="mt-12 sm:mt-21 mx-8 sm:mx-48 text-neutral-50/20" />

      <section className="mt-12 sm:mt-21">
        <div
          id="walter-question"
          className="flex flex-col items-center justify-center"
        >
          <LazyVideo
            className="rounded-2xl sm:rounded-4xl border border-neutral-100/20 hover:border-yellow-200/40 transition-all duration-500"
            src="assets/questionSample.mp4"
          />
        </div>

        <motion.div
          className="mt-8 sm:mt-12 flex flex-col justify-center px-4 sm:px-0"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col text-center cursor-default">
            <span className="text-2xl sm:text-4xl font-semibold">Exam Questions!</span>
            <span className="mt-3 sm:mt-4 text-base sm:text-xl font-normal">
              Walter can provide you questions from all exams types:
            </span>
            <span>P/FM/FAM/SRM</span>
          </div>
        </motion.div>
      </section>
      <hr className="mt-12 sm:mt-21 mb-12 sm:mb-21 mx-8 sm:mx-48 text-neutral-50/20" />
    </div>
  )
}
