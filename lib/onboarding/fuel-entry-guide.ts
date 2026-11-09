export const FUEL_ENTRY_GUIDE_VERSION = 'fuel-entries-2026-11-v1'
export const GUIDE_PATH = '/dashboard/fuel-entries'
export const supportsFuelEntryGuide = (role?: string) => role === 'OPERATOR' || role === 'PUMPA'
export const guideKey = (role: string) => `${FUEL_ENTRY_GUIDE_VERSION}:${role}`

export interface GuideStep { target: string; title: string; description: string; note?: string }
export function fuelEntryGuideSteps(role: string): GuideStep[] {
  const pump = role === 'PUMPA'
  return [
    ...(pump ? [{ target: 'station', title: 'Vaša poslovnica je već odabrana', description: 'Prva dodijeljena poslovnica odabire se automatski. Ako radite na više poslovnica, prije unosa provjerite odabir i po potrebi izaberite drugu.', note: 'Ako nijedna poslovnica nije dostupna, obratite se administratoru.' }] : []),
    { target: 'import', title: pump ? 'Počnite od posljednje prijave' : 'Uvezite prijavu po tipu goriva', description: pump ? 'Dugme „Uvezi s prošle prijave” prenosi podatke iz vaše posljednje prijave. Potom provjerite i unesite podatke nove isporuke.' : 'Klik na „Uvezi s prošle prijave” uvozi posljednju prijavu. Strelica pored dugmeta otvara izbor tipa goriva za uvoz posljednje prijave tog tipa.', note: 'Uvijek provjerite datume, količinu, otpremnicu, aditive i certifikat. Uvoz ne sprema novu prijavu.' },
    ...(pump ? [
      { target: 'measurements', title: 'Popunite zapisnik o prijemu', description: 'Zapisnik je dio svake prijave pumpe i potrebno ga je popuniti. Odaberite rezervoar u koji primate gorivo i unesite početna i završna očitanja sonde ili letve.', note: 'Unesite stvarna mjerenja za ovu isporuku.' },
      { target: 'quantities', title: 'Otpremnica se računa automatski', description: 'Unesite najavljenu količinu i prodatu količinu tokom istakanja. Ako nije bilo prodaje, unesite 0. Polje „Otpremnica (L)” popunjava program.', note: 'Završno − početno stanje sonde + prodaja. Ako nema očitanja sonde, koriste se očitanja letve.' },
      { target: 'checklist', title: 'Potvrdite dokumentaciju i provjere', description: 'Označite dokumente koje ste zaprimili i provjere koje ste izvršili. Popunite dodatne podatke ako su primjenjivi na prijem.', note: 'Označavajte prema stvarnom stanju. Prije spremanja pregledajte zapisnik i izračunate količine.' },
    ] : []),
    { target: 'print', title: 'Printajte direktno iz pregleda', description: 'Na listi prijava otvorite „Pregled” (ikona oka). Uz dugme za preuzimanje dokumenta nalazi se ikona štampača. Kliknite je i potvrdite štampanje u prozoru preglednika.', note: 'Ako se prozor ne otvori, dozvolite skočne prozore za ovu aplikaciju. Dostupni dokumenti zavise od podataka prijave.' },
  ]
}
