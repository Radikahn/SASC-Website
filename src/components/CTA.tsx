export function CTA() {
  return (
    <div className="flex flex-col justify-center px-4 sm:px-0">
      <div>
        <span className="text-2xl sm:text-4xl font-bold">About Us:</span>
      </div>
      <div className="mt-6 sm:mt-8 text-center">
        <span className="text-center font-normal text-base sm:text-xl">
          Our mission is to provide SJSU students with the technical toolkit and
          professional network required to navigate the rigorous path to ASA/FSA
          and ACAS/FCAS designations.
        </span>
      </div>
      <span className="mt-8 sm:mt-12 text-xl sm:text-2xl font-bold">What we do:</span>
      <div className="flex justify-center">
        <ul className="mt-6 sm:mt-10 flex flex-col md:flex-row gap-6 md:gap-0 list-disc pl-5 md:pl-0">
          <li className="md:ml-8 md:pr-8">
            <span className="hover:text-yellow-200 transition-color duration-400 cursor-pointer">
              Exam Preparation: Structured study groups and resource sharing
              for Exam P, FM.
            </span>
          </li>
          <li className="md:pr-8">
            <span className="hover:text-yellow-200 transition-color duration-400 cursor-pointer">
              Professional Development: Resume workshops and interview prep
              tailored.
            </span>
          </li>
          <li>
            <span className="hover:text-yellow-200 transition-color duration-400 cursor-pointer">
              Industry Connection: Hosting guest speakers to discuss Life,
              Health, P&C, and InsurTech trends.
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
