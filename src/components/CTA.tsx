export function CTA() {
  return (
    <div className="flex flex-col justify-center">
      <div>
        <span className="text-4xl font-bold">About Us:</span>
      </div>
      <div className="mt-8 text-center">
        <span className="text-center font-normal text-xl">
          Our mission is to provide SJSU students with the technical toolkit and
          professional network required to navigate the rigorous path to ASA/FSA
          and ACAS/FCAS designations.
        </span>
      </div>
      <span className="mt-12 text-2xl font-bold">What we do:</span>
      <div className="flex flex-row justify-center">
        <div className="flex flex-row justify-center">
          <div className="mt-10 flex flex-row">
            <li className="ml-8 pr-8 ">
              <span className="hover:text-yellow-200 transition-color duration-400 cursor-pointer">
                Exam Preparation: Structured study groups and resource sharing
                for Exam P, FM.
              </span>
            </li>
            <li className="pr-8">
              Professional Development: Resume workshops and interview prep
              tailored.
            </li>
            <li>
              Industry Connection: Hosting guest speakers to discuss Life,
              Health, P&C, and InsurTech trends.
            </li>
          </div>
        </div>
      </div>
    </div>
  )
}
