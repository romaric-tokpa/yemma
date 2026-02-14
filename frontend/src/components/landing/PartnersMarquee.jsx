/**
 * Section preuve sociale : titre + logos entreprises en défilement continu.
 * Style sobre, logos en nuances de gris (noir et blanc).
 */
const PARTNER_LOGO_ITEMS = [
  { name: 'TechCorp', initials: 'TC' },
  { name: 'InnovateLab', initials: 'IL' },
  { name: 'DataFlow', initials: 'DF' },
  { name: 'CloudSync', initials: 'CS' },
  { name: 'FinancePlus', initials: 'FP' },
  { name: 'DigitalPro', initials: 'DP' },
  { name: 'StartupHub', initials: 'SH' },
  { name: 'ConsultGroup', initials: 'CG' },
  { name: 'HealthTech', initials: 'HT' },
  { name: 'RetailMax', initials: 'RM' },
  { name: 'AgileSoft', initials: 'AS' },
  { name: 'NextGen', initials: 'NG' },
]

function LogoItem({ name, initials }) {
  return (
    <div className="flex-shrink-0 flex items-center gap-3 px-8 md:px-10 py-4 h-14 md:h-16">
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
        <span className="text-xs md:text-sm font-bold text-[#374151]">
          {initials}
        </span>
      </div>
      <span className="text-sm md:text-base font-semibold text-[#374151] tracking-tight whitespace-nowrap">
        {name}
      </span>
    </div>
  )
}

export default function PartnersMarquee() {
  return (
    <section className="py-10 md:py-12 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 mb-8">
        <p className="text-center text-base md:text-lg text-[#2C2C2C] font-medium leading-relaxed">
          <span className="font-semibold underline decoration-[#226D68] decoration-2 underline-offset-2">
            + 500 entreprises
          </span>
          {' '}ont déjà recruté sur notre{' '}
          <span className="font-semibold underline decoration-[#226D68] decoration-2 underline-offset-2">
            CVthèque de profils préqualifiés
          </span>
        </p>
      </div>

      <div className="relative w-full overflow-hidden">
        <div className="absolute left-0 top-0 w-16 md:w-24 h-full z-20 pointer-events-none bg-gradient-to-r from-white to-transparent" />
        <div className="absolute right-0 top-0 w-16 md:w-24 h-full z-20 pointer-events-none bg-gradient-to-l from-white to-transparent" />

        <div className="flex animate-scroll-partners">
          {[...PARTNER_LOGO_ITEMS, ...PARTNER_LOGO_ITEMS].map((item, idx) => (
            <LogoItem key={`${item.name}-${idx}`} name={item.name} initials={item.initials} />
          ))}
        </div>
      </div>
    </section>
  )
}
