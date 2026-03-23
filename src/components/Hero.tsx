export default function Hero() {
  const handleDiscord = () => {
    window.open('https://discord.gg/fQxkYq8Tc7')
  }
  return (
    <div className="flex flex-col justify-items-center">
      <div className="rise-in">
        <span className="flex flex-1 justify-center font-normal text-3xl sm:text-5xl md:text-6xl text-center">
          Welcome to S<span className="text-yellow-400">ä</span>SC
        </span>
      </div>
      <div
        className="rise-in mt-4 flex flex-1 justify-center max-w-2xl"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex flex-col justify-center px-4 sm:px-0">
          <span className="mt-4 flex flex-1 justify-center text-base sm:text-lg text-center">
            The Actuarial Science Club at San José State University is a
            student-led organization dedicated to preparing the next generation
            of actuarial professionals.
          </span>

          <div className="w-40 flex flex-col justify-center self-center">
            <button
              className="mt-10 sm:mt-18 px-0.5 py-4 bg-neutral-50/20 cursor-pointer rounded-2xl hover:bg-neutral-50/10 transition-all duration-600"
              onClick={handleDiscord}
            >
              Join the Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
