'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  Shield,
  Database,
  UserCog,
  BarChart3,
  FileText,
  Plus,
  Edit2,
  Users,
  Building2,
  Truck,
  FlaskConical,
  Globe,
  Package,
  Sparkles,
  MapPin,
  CheckCircle,
  Upload,
  Settings
} from 'lucide-react'

export default function UputstvoAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN'
    if (!isAdmin) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-dark-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-dark-500">Učitavanje...</p>
        </div>
      </div>
    )
  }

  const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN'
  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-red-50/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-dark-900">Admin uputstvo</h1>
              <p className="text-dark-600 mt-1">Vodič za administratore - upravljanje sistemom</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Overview */}
          <Section
            title="Admin pregled"
            icon={Shield}
            description="Administrativne funkcije i upravljanje sistemom"
          >
            <div className="prose prose-sm max-w-none">
              <p className="text-dark-700 leading-relaxed">
                Admin panel omogućava kompletan uvid i kontrolu nad sistemom.
                Dostupan je samo korisnicima sa ADMIN ili SUPER_ADMIN ulogom.
                Ovo uputstvo pokriva sve administrativne funkcije sistema.
              </p>
            </div>
          </Section>

          {/* Master Data */}
          <Section
            title="Master podaci (Šifarnici)"
            icon={Database}
            description="Upravljanje osnovnim podacima sistema"
          >
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-dark-900 mb-3">Dostupni šifarnici:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <MasterDataCard
                    icon={Package}
                    title="Proizvodi"
                    description="Vrste goriva (ED 5 - Dizel, BMB 95, LPG, itd.)"
                  />
                  <MasterDataCard
                    icon={Globe}
                    title="Zemlje"
                    description="Zemlje porijekla goriva (Hrvatska, Grčka, Italija...)"
                  />
                  <MasterDataCard
                    icon={MapPin}
                    title="Lokacije"
                    description="Lokacije preuzimanja goriva (Rafinerija Brod, Luka Ploče...)"
                  />
                  <MasterDataCard
                    icon={Sparkles}
                    title="Aditivi"
                    description="Karakteristike i aditivi (Aditivirano, Detergent...)"
                  />
                  <MasterDataCard
                    icon={Building2}
                    title="Dobavljači"
                    description="Firme dobavljači (OPTIMA GRUPA, OIL-AC...)"
                  />
                  <MasterDataCard
                    icon={Truck}
                    title="Prevoznici"
                    description="Transportne firme (SJAJ DOO, ZLATA TRANS...)"
                  />
                  <MasterDataCard
                    icon={FlaskConical}
                    title="Laboratorije"
                    description="Akreditirane laboratorije (ZIK, INA...)"
                  />
                  <MasterDataCard
                    icon={Users}
                    title="Klijenti"
                    description="Klijenti - firme kojima se isporučuje gorivo"
                  />
                </div>
              </div>

              <Step number={1} title="Dodavanje nove stavke">
                <ol className="list-decimal list-inside text-dark-700 space-y-2">
                  <li>Idite na stranicu <strong>Master Podaci</strong></li>
                  <li>Odaberite odgovarajući tab (npr. Proizvodi, Dobavljači...)</li>
                  <li>Kliknite na <strong className="text-primary-600">"+ Dodaj"</strong></li>
                  <li>Popunite obavezna polja (označena sa *)</li>
                  <li>Popunite opciona polja ako su dostupna</li>
                  <li>Kliknite <strong>"Sačuvaj"</strong></li>
                </ol>
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mt-3">
                  <p className="text-sm text-dark-700">
                    💡 <strong>Tip:</strong> Nova stavka će automatski biti aktivna i dostupna za odabir u formama.
                  </p>
                </div>
              </Step>

              <Step number={2} title="Izmjena postojeće stavke">
                <ol className="list-decimal list-inside text-dark-700 space-y-2">
                  <li>Pronađite stavku koju želite izmjeniti (koristite pretragu za brže pronalaženje)</li>
                  <li>Kliknite na ikonu <Edit2 className="inline w-4 h-4 mx-1" /> kod te stavke</li>
                  <li>Izmjenite potrebna polja</li>
                  <li>Kliknite <strong>"Sačuvaj"</strong></li>
                </ol>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                  <p className="text-sm text-dark-700">
                    ⚠️ <strong>Važno:</strong> Izmjena postojećih stavki može uticati na sve prijave
                    koje koriste tu stavku.
                  </p>
                </div>
              </Step>

              <Step number={3} title="Deaktiviranje stavke">
                <p className="text-dark-700 mb-3">
                  Umjesto brisanja (koje nije moguće ako stavka ima reference), preporučuje se deaktiviranje:
                </p>
                <ol className="list-decimal list-inside text-dark-700 space-y-2">
                  <li>Pronađite stavku</li>
                  <li>Kliknite na status dugme (zeleno "Aktivno" / crveno "Neaktivno")</li>
                  <li>Potvrdite promjenu u dijaloškom prozoru</li>
                </ol>
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mt-3">
                  <p className="text-sm text-dark-700">
                    💡 <strong>Prednosti deaktiviranja:</strong>
                  </p>
                  <ul className="list-disc list-inside text-sm text-dark-700 mt-2 space-y-1">
                    <li>Stavka nije dostupna za odabir u novim prijavama</li>
                    <li>Postojeće prijave ostaju netaknute</li>
                    <li>Historijski podaci su sačuvani</li>
                    <li>Možete ponovo aktivirati stavku ako zatreba</li>
                  </ul>
                </div>
              </Step>

              <Step number={4} title="Bulk import podataka">
                <p className="text-dark-700 mb-3">
                  Za masovni import podataka iz Excel fajlova:
                </p>
                <ol className="list-decimal list-inside text-dark-700 space-y-2">
                  <li>Pripremite Excel fajl sa podacima (pogledajte primjer strukture)</li>
                  <li>SSH na server ili lokalno okruženje</li>
                  <li>Postavite Excel fajlove u odgovarajući folder</li>
                  <li>Pokrenite skriptu: <code className="bg-dark-100 px-2 py-1 rounded text-sm">npm run import:convert</code></li>
                  <li>Provjerite generirane JSON fajlove</li>
                  <li>Pokrenite import: <code className="bg-dark-100 px-2 py-1 rounded text-sm">npm run import:data</code></li>
                  <li>Provjerite importovane podatke u Master podacima</li>
                </ol>
                <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 mt-3">
                  <p className="text-sm text-dark-700 mb-2">
                    💡 <strong>Podržani tipovi za import:</strong>
                  </p>
                  <ul className="list-disc list-inside text-sm text-dark-700 space-y-1">
                    <li>Dobavljači (suppliers.json)</li>
                    <li>Prevoznici (transporters.json)</li>
                    <li>Laboratorije (laboratories.json)</li>
                    <li>Proizvodi (products.json)</li>
                    <li>Zemlje (countries.json)</li>
                  </ul>
                </div>
              </Step>

              <Step number={5} title="Pretraga i filtriranje">
                <p className="text-dark-700 mb-3">
                  Svaki tab u Master podacima ima funkciju pretrage:
                </p>
                <ul className="list-disc list-inside text-dark-700 space-y-1">
                  <li>Unesite naziv, šifru ili dio teksta u search polje</li>
                  <li>Rezultati se filtriraju u realnom vremenu</li>
                  <li>Prikazuju se i aktivne i neaktivne stavke</li>
                  <li>Neaktivne stavke su vizuelno označene (sivo, providno)</li>
                </ul>
              </Step>
            </div>
          </Section>

          {/* User Management */}
          <Section
            title="Upravljanje korisnicima"
            icon={UserCog}
            description="Kreiranje i upravljanje korisničkim nalozima"
          >
            <div className="space-y-6">
              <Step number={1} title="Dodavanje novog korisnika">
                <ol className="list-decimal list-inside text-dark-700 space-y-2">
                  <li>Idite na stranicu <strong>Korisnici</strong></li>
                  <li>Kliknite <strong className="text-primary-600">"+ Novi korisnik"</strong></li>
                  <li>Popunite podatke:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>Ime i prezime</li>
                      <li>Email adresa (mora biti jedinstvena)</li>
                      <li>Uloga (SUPER_ADMIN, ADMIN, OPERATOR, VIEWER)</li>
                    </ul>
                  </li>
                  <li>Kliknite <strong>"Kreiraj"</strong></li>
                  <li>Korisnik će dobiti email sa linkom za aktivaciju naloga</li>
                  <li>Korisnik postavlja svoju lozinku prilikom aktivacije</li>
                </ol>
              </Step>

              <Step number={2} title="Uloge korisnika i prava pristupa">
                <div className="space-y-3">
                  <RoleCard
                    role="SUPER_ADMIN"
                    description="Pun pristup svim funkcijama sistema"
                    permissions={[
                      'Sve funkcije ADMIN uloge',
                      'Upravljanje korisnicima (kreiranje, editovanje, brisanje)',
                      'Pristup audit log-u',
                      'Pristup naprednim statistikama',
                      'Upravljanje skladištima'
                    ]}
                    color="red"
                  />
                  <RoleCard
                    role="ADMIN"
                    description="Pristup operativnim funkcijama i master podacima"
                    permissions={[
                      'Sve funkcije OPERATOR uloge',
                      'Upravljanje master podacima (šifarnici)',
                      'Pristup statistikama',
                      'Pregled svih prijava u sistemu'
                    ]}
                    color="amber"
                  />
                  <RoleCard
                    role="OPERATOR"
                    description="Operativni korisnik za svakodnevni rad"
                    permissions={[
                      'Kreiranje novih prijava ulaza',
                      'Editovanje prijava',
                      'Generisanje izjava',
                      'Pregled prijava',
                      'Upload certifikata'
                    ]}
                    color="blue"
                  />
                  <RoleCard
                    role="VIEWER"
                    description="Samo čitanje podataka"
                    permissions={[
                      'Pregled prijava ulaza',
                      'Generisanje izjava',
                      'Preuzimanje certifikata',
                      'BEZ mogućnosti kreiranja/izmjene'
                    ]}
                    color="gray"
                  />
                </div>
              </Step>

              <Step number={3} title="Resetovanje lozinke korisnika">
                <p className="text-dark-700 mb-3">
                  Za resetovanje korisničke lozinke:
                </p>
                <ol className="list-decimal list-inside text-dark-700 space-y-2">
                  <li>Pronađite korisnika u listi</li>
                  <li>Kliknite na dugme <strong className="text-amber-600">"Resetuj lozinku"</strong></li>
                  <li>Potvrdite akciju</li>
                  <li>Korisnik će dobiti email sa linkom za postavljanje nove lozinke</li>
                  <li>Link je validan 24 sata</li>
                </ol>
              </Step>

              <Step number={4} title="Deaktiviranje korisnika">
                <p className="text-dark-700 mb-3">
                  Za privremeno ili trajno onemogućavanje pristupa:
                </p>
                <ol className="list-decimal list-inside text-dark-700 space-y-2">
                  <li>Pronađite korisnika</li>
                  <li>Kliknite na status (zeleno "Aktivan" / crveno "Neaktivan")</li>
                  <li>Potvrdite promjenu</li>
                </ol>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                  <p className="text-sm text-dark-700">
                    ⚠️ <strong>Efekti deaktiviranja:</strong>
                  </p>
                  <ul className="list-disc list-inside text-sm text-dark-700 mt-2 space-y-1">
                    <li>Korisnik ne može pristupiti sistemu</li>
                    <li>Postojeće sesije se automatski odjavljuju</li>
                    <li>Historija aktivnosti korisnika ostaje sačuvana</li>
                    <li>Možete ponovo aktivirati korisnika</li>
                  </ul>
                </div>
              </Step>

              <Step number={5} title="Izmjena podataka korisnika">
                <ol className="list-decimal list-inside text-dark-700 space-y-2">
                  <li>Kliknite na ikonu <Edit2 className="inline w-4 h-4 mx-1" /> kod korisnika</li>
                  <li>Možete izmjeniti:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>Ime i prezime</li>
                      <li>Ulogu</li>
                    </ul>
                  </li>
                  <li>Email adresa se NE MOŽE mijenjati (korisnik mora kreirati novi nalog)</li>
                  <li>Kliknite <strong>"Sačuvaj"</strong></li>
                </ol>
              </Step>
            </div>
          </Section>

          {/* Warehouses */}
          <Section
            title="Upravljanje skladištima"
            icon={Building2}
            description="Kreiranje i upravljanje skladištima"
          >
            <div className="space-y-6">
              <Step number={1} title="Dodavanje novog skladišta">
                <ol className="list-decimal list-inside text-dark-700 space-y-2">
                  <li>Idite na stranicu <strong>Skladišta</strong></li>
                  <li>Kliknite <strong className="text-primary-600">"+ Novo skladište"</strong></li>
                  <li>Popunite podatke:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li>Naziv skladišta (npr. Skladište Sarajevo)</li>
                      <li>Šifra (npr. SKL-SA-01)</li>
                      <li>Adresa (opciono)</li>
                    </ul>
                  </li>
                  <li>Kliknite <strong>"Kreiraj"</strong></li>
                </ol>
              </Step>

              <Step number={2} title="Upravljanje skladištima">
                <p className="text-dark-700 mb-3">
                  Za svako skladište možete:
                </p>
                <ul className="list-disc list-inside text-dark-700 space-y-1">
                  <li>Pregledati detalje i broj prijava</li>
                  <li>Editovati naziv, šifru ili adresu</li>
                  <li>Deaktivirati (ako ne želite više koristiti)</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3">
                  <p className="text-sm text-dark-700">
                    ⚠️ <strong>Napomena:</strong> Ne možete obrisati skladište koje ima postojeće prijave.
                    Umjesto toga, deaktivirajte ga.
                  </p>
                </div>
              </Step>
            </div>
          </Section>

          {/* Statistics */}
          <Section
            title="Statistike i izvještaji"
            icon={BarChart3}
            description="Praćenje rada i analiza podataka"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-dark-900 mb-2">Dashboard statistike</h4>
                <p className="text-dark-700 mb-3">
                  Glavni dashboard prikazuje brze metrike:
                </p>
                <ul className="list-disc list-inside text-dark-700 space-y-1">
                  <li>Ukupan broj prijava u sistemu</li>
                  <li>Broj prijava u tekućem mjesecu</li>
                  <li>Broj aktivnih korisnika</li>
                  <li>Broj skladišta</li>
                  <li>Brzi pristup najnovijim prijavama</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-dark-900 mb-2">Napredne statistike</h4>
                <p className="text-dark-700 mb-3">
                  Stranica <strong>Statistika</strong> omogućava:
                </p>
                <ul className="list-disc list-inside text-dark-700 space-y-1">
                  <li>Filtriranje po vremenskom periodu</li>
                  <li>Grupiranje po proizvodima</li>
                  <li>Analizu po skladištima</li>
                  <li>Grafički prikaz trendova</li>
                  <li>Export podataka u Excel format</li>
                </ul>
              </div>

              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <p className="text-sm text-dark-700">
                  💡 <strong>Tip:</strong> Koristite statistike za mjesečne i godišnje izvještaje.
                  Export opcija omogućava dalju analizu u Excel-u.
                </p>
              </div>
            </div>
          </Section>

          {/* Audit Log */}
          <Section
            title="Audit log (Samo SUPER_ADMIN)"
            icon={FileText}
            description="Praćenje aktivnosti korisnika u sistemu"
          >
            <div className="space-y-4">
              <p className="text-dark-700">
                Audit log evidentira sve važne aktivnosti u sistemu i dostupan je samo SUPER_ADMIN korisnicima:
              </p>

              <div>
                <h4 className="font-semibold text-dark-900 mb-2">Evidentirane aktivnosti:</h4>
                <ul className="list-disc list-inside text-dark-700 space-y-1">
                  <li>Kreiranje, izmjena i brisanje prijava ulaza</li>
                  <li>Promjene master podataka (šifarnici)</li>
                  <li>Kreiranje, izmjena i brisanje korisnika</li>
                  <li>Promjene uloga korisnika</li>
                  <li>Login aktivnosti (uspješni i neuspješni pokušaji)</li>
                  <li>Resetovanje lozinki</li>
                  <li>Kreiranje i izmjena skladišta</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-dark-900 mb-2">Informacije u log-u:</h4>
                <ul className="list-disc list-inside text-dark-700 space-y-1">
                  <li>Datum i vrijeme aktivnosti</li>
                  <li>Korisnik koji je izvršio akciju</li>
                  <li>Tip akcije (CREATE, UPDATE, DELETE, LOGIN...)</li>
                  <li>Entitet na kojem je izvršena akcija</li>
                  <li>Stare i nove vrijednosti (kod izmjena)</li>
                  <li>IP adresa korisnika</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm text-dark-700">
                  ⚠️ <strong>Važno:</strong> Audit log se ne može mijenjati ili brisati.
                  Sve akcije su trajno evidentirane zbog sigurnosti i compliance razloga.
                </p>
              </div>
            </div>
          </Section>

          {/* Best Practices */}
          <Section
            title="Najbolje prakse za administratore"
            icon={CheckCircle}
            description="Preporuke za efikasno upravljanje sistemom"
          >
            <div className="space-y-4">
              <AdminTipCard
                icon={Database}
                title="Redovno održavajte master podatke"
                color="blue"
              >
                Provjeravajte i ažurirajte šifarnike jednom mjesečno. Deaktivirajte nekorištene stavke
                umjesto brisanja.
              </AdminTipCard>

              <AdminTipCard
                icon={Users}
                title="Pratite aktivnost korisnika"
                color="amber"
              >
                Redovno pregledajte listu korisnika. Deaktivirajte naloge koji nisu aktivni
                duže vrijeme iz sigurnosnih razloga.
              </AdminTipCard>

              <AdminTipCard
                icon={Shield}
                title="Kontrolišite pristupna prava"
                color="red"
              >
                Dodjeljivajte minimalna potrebna prava. Ne pravite više SUPER_ADMIN naloga
                nego što je neophodno.
              </AdminTipCard>

              <AdminTipCard
                icon={FileText}
                title="Provjeravajte audit log"
                color="purple"
              >
                SUPER_ADMIN korisnici bi trebali redovno pregledati audit log
                radi sigurnosti i compliance-a.
              </AdminTipCard>

              <AdminTipCard
                icon={Upload}
                title="Backup podataka"
                color="green"
              >
                Koristite bulk export funkcije za redovne backup-e važnih podataka.
                Spremajte backup-e van sistema.
              </AdminTipCard>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

// Helper Components

function Section({ title, icon: Icon, description, children }: {
  title: string
  icon: any
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-dark-100 overflow-hidden">
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6 text-white" />
          <div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
            <p className="text-red-100 text-sm mt-1">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}

function Step({ number, title, children }: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-bold shadow-lg">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-dark-900 mb-3">{title}</h3>
        <div className="text-dark-700">
          {children}
        </div>
      </div>
    </div>
  )
}

function MasterDataCard({ icon: Icon, title, description }: {
  icon: any
  title: string
  description: string
}) {
  return (
    <div className="bg-dark-50 rounded-xl p-4 border border-dark-200 hover:border-red-300 hover:bg-red-50/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border border-dark-200 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h5 className="font-semibold text-dark-900 text-sm">{title}</h5>
          <p className="text-xs text-dark-600 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  )
}

function RoleCard({ role, description, permissions, color }: {
  role: string
  description: string
  permissions: string[]
  color: 'red' | 'amber' | 'blue' | 'gray'
}) {
  const colors = {
    red: 'bg-red-50 border-red-200',
    amber: 'bg-amber-50 border-amber-200',
    blue: 'bg-blue-50 border-blue-200',
    gray: 'bg-gray-50 border-gray-200'
  }

  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <h5 className="font-bold text-dark-900 mb-1">{role}</h5>
      <p className="text-sm text-dark-700 mb-3">{description}</p>
      <div className="text-xs text-dark-600">
        <p className="font-semibold mb-1">Prava pristupa:</p>
        <ul className="list-disc list-inside space-y-0.5">
          {permissions.map((perm, idx) => (
            <li key={idx}>{perm}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function AdminTipCard({ icon: Icon, title, color, children }: {
  icon: any
  title: string
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red'
  children: React.ReactNode
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
    purple: 'bg-purple-50 border-purple-200',
    red: 'bg-red-50 border-red-200'
  }

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600',
    red: 'text-red-600'
  }

  return (
    <div className={`rounded-xl p-4 border ${colors[color]}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${iconColors[color]} flex-shrink-0 mt-0.5`} />
        <div>
          <h5 className="font-semibold text-dark-900 text-sm mb-1">{title}</h5>
          <p className="text-sm text-dark-700">{children}</p>
        </div>
      </div>
    </div>
  )
}
