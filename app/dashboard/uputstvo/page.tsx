'use client'

import { useState } from 'react'
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Edit2,
  Download,
  ChevronDown,
  Building2,
  Droplets,
  Calendar,
  Truck,
  FlaskConical,
  Globe,
  MapPin,
  User,
  FileCheck,
  CheckCircle,
  Upload,
  Users,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  Video,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info
} from 'lucide-react'

export default function UputstvoOperativnoPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-dark-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-[var(--shadow-soft-xl)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Operativno uputstvo</h1>
                <p className="text-dark-200 mt-2">Detaljan vodič sa primjerima za svakodnevni rad u sistemu</p>
              </div>
            </div>
          </div>
        </div>

        {/* Video Tutorial */}
        <div className="bg-white rounded-3xl p-8 shadow-[var(--shadow-soft)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-primary-100/50 opacity-70"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-50"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3.5 rounded-2xl bg-primary-50">
                <Video className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-dark-900">Video tutorial</h3>
                <p className="text-dark-600 text-sm">Pogledajte kompletan vodič kroz sistem</p>
              </div>
            </div>
            <div className="bg-black rounded-2xl overflow-hidden shadow-lg">
              <video
                controls
                className="w-full"
                poster="/Screenshot_8.png"
              >
                <source src="/uputstvo-za-koristenje.mov" type="video/quicktime" />
                <source src="/uputstvo-za-koristenje.mp4" type="video/mp4" />
                Vaš browser ne podržava video playback.
              </video>
            </div>
            <div className="mt-4 flex items-center gap-2 text-dark-600 text-sm">
              <Info className="w-4 h-4 text-primary-600" />
              <p>Video prikazuje sve korake za kreiranje prijave, filtriranje i generisanje izjava</p>
            </div>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="bg-white rounded-3xl p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-bold text-dark-900 mb-4 uppercase tracking-wide">Brza navigacija</p>
          <div className="flex flex-wrap gap-3">
            <QuickLink href="#pregled">Pregled</QuickLink>
            <QuickLink href="#kreiranje">Kreiranje prijave</QuickLink>
            <QuickLink href="#filtriranje">Filtriranje</QuickLink>
            <QuickLink href="#generisanje">Generisanje izjata</QuickLink>
            <QuickLink href="#pregled-izmjena">Pregled i izmjena</QuickLink>
            <QuickLink href="#scenariji">Česti scenariji</QuickLink>
            <QuickLink href="#faq">Pitanja i odgovori</QuickLink>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Overview */}
          <Section
            id="pregled"
            title="Pregled sistema"
            icon={BookOpen}
            description="Osnovne informacije o sistemu za evidenciju prijava ulaza goriva"
          >
            <div className="space-y-4">
              <p className="text-dark-700 leading-relaxed">
                FIMS (Fuel Intake Management System) je sistem za upravljanje prijavama ulaza goriva u skladišta.
                Sistem omogućava kompletan unos podataka o gorivima, generisanje izjava o usklađenosti,
                praćenje istorije i izvještavanje.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FeatureCard
                  icon={Plus}
                  title="Unos prijava"
                  description="Brzo i jednostavno kreiranje novih prijava sa svim potrebnim podacima"
                />
                <FeatureCard
                  icon={FileText}
                  title="Generisanje izjava"
                  description="Automatsko generisanje PDF izjava o usklađenosti pojedinačno ili grupno"
                />
                <FeatureCard
                  icon={Search}
                  title="Pretraga i filteri"
                  description="Napredna pretraga i filtriranje za brzo pronalaženje prijava"
                />
                <FeatureCard
                  icon={CheckCircle}
                  title="Praćenje kvalitete"
                  description="Evidencija aditiva, laboratorijskih testova i certifikata"
                />
              </div>

              <VideoPlaceholder
                title="Video tutorial: Pregled sistema"
                duration="3:45"
                description="Kratki uvod u interfejs i osnovne funkcije"
              />
            </div>
          </Section>

          {/* Creating Fuel Entry */}
          <Section
            id="kreiranje"
            title="Kreiranje nove prijave ulaza"
            icon={Plus}
            description="Detaljan korak po korak vodič sa primjerima"
          >
            <div className="space-y-6">
              <Step number={1} title="Otvaranje forme za novu prijavu">
                <p className="text-dark-700 mb-4">
                  Na stranici <strong>Izjave o usklađenosti</strong>, kliknite na dugme{' '}
                  <strong className="text-primary-600">"+ Nova prijava"</strong> u gornjem desnom uglu.
                </p>

                <img
                  src="/uputstvo/1.png"
                  alt="Dugme 'Nova prijava'"
                  className="w-full rounded-xl border-2 border-dark-200 shadow-lg my-4"
                />

                <InfoBox icon={Lightbulb} type="tip">
                  <strong>Savjet:</strong> Forma je podijeljena u jasne sekcije (Osnovne informacije,
                  Isporuka, Kvalitet, Laboratorija, Dobavljač). Sve obavezne stavke su označene crvenom zvjezdicom <span className="text-red-500">*</span>
                </InfoBox>
              </Step>

              <Step number={2} title="Osnovne informacije - Obavezna polja">
                <div className="space-y-4">
                  <FieldExample
                    name="Datum ulaza"
                    required
                    icon={Calendar}
                    example="01.06.2026"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Datum kada je gorivo fizički ušlo u skladište. Automatski je postavljen današnji datum.
                    </p>
                    <ExampleData
                      good="01.06.2026 (današnji datum)"
                      bad="15.07.2026 (budući datum - nije dozvoljen)"
                    />
                  </FieldExample>

                  <FieldExample
                    name="Skladište"
                    required
                    icon={Building2}
                    example="SKL-SA-01 - Skladište Sarajevo"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Odaberite skladište u koje je gorivo ušlo. Koristite searchable dropdown - kucajte naziv ili šifru.
                    </p>
                    <img
                      src="/uputstvo/3.png"
                      alt="Searchable dropdown za skladište"
                      className="w-full rounded-xl border-2 border-dark-200 shadow-lg my-4"
                    />
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-semibold text-dark-900">Kako koristiti:</p>
                      <ol className="list-decimal list-inside text-sm text-dark-700 space-y-1">
                        <li>Kliknite na polje - otvara se plavi dropdown</li>
                        <li>Počnite kucati naziv (npr. "Sarajevo") ili šifru (npr. "SKL")</li>
                        <li>Lista se automatski filtrira</li>
                        <li>Kliknite na željenu stavku</li>
                      </ol>
                    </div>
                    <ExampleData
                      good="SKL-SA-01 - Skladište Sarajevo"
                      goodNote="Jasno označeno sa šifrom i nazivom"
                    />
                  </FieldExample>

                  <FieldExample
                    name="Naziv proizvoda"
                    required
                    icon={Droplets}
                    example="ED 5 - Dizel BAS EN 590 (10 ppm)"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Odaberite vrstu goriva. Searchable dropdown omogućava brzo pronalaženje.
                    </p>
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-dark-900 mb-2">Česti proizvodi:</p>
                      <div className="grid grid-cols-2 gap-2">
                        <ProductExample name="ED 5 - Dizel BAS EN 590 (10 ppm)" type="Dizel" />
                        <ProductExample name="BMB 95 - Bezolovni benzin BAS EN 228" type="Benzin" />
                        <ProductExample name="LPG (auto-plin) BAS EN 589" type="Plin" />
                        <ProductExample name="LUEL - Lož ulje ekstra lako" type="Lož ulje" />
                      </div>
                    </div>
                  </FieldExample>

                  <FieldExample
                    name="Količina (litara)"
                    required
                    icon={Droplets}
                    example="42500"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Unesite količinu u litrama. Maksimalno 50,000 litara po prijavi.
                    </p>
                    <ExampleData
                      good="42500"
                      goodNote="Validna količina"
                      bad="55000"
                      badNote="Previše - maksimalno je 50,000 L"
                    />
                    <InfoBox icon={AlertTriangle} type="warning">
                      Sistem automatski validira unos i prikazuje grešku ako unesete količinu veću od 50,000 litara.
                    </InfoBox>
                  </FieldExample>
                </div>
              </Step>

              <Step number={3} title="Informacije o isporuci">
                <div className="space-y-4">
                  <p className="text-dark-700">
                    Ova sekcija sadrži podatke o transportu i porijeklu goriva:
                  </p>

                  <FieldExample
                    name="Broj otpremnice"
                    icon={FileText}
                    example="OTP-2026-1234"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Broj dokumenta o isporuci goriva koji ste dobili od dobavljača.
                    </p>
                    <ExampleData
                      good="OTP-2026-1234, DN-445/2026, 2026/001"
                      goodNote="Bilo koji format broja dokumenta"
                    />
                  </FieldExample>

                  <FieldExample
                    name="Zemlja porijekla"
                    icon={Globe}
                    example="Hrvatska"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Zemlja iz koje gorivo dolazi. Važno za uvezeno gorivo.
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <CountryExample name="Hrvatska" flag="🇭🇷" />
                      <CountryExample name="Grčka" flag="🇬🇷" />
                      <CountryExample name="Italija" flag="🇮🇹" />
                    </div>
                  </FieldExample>

                  <FieldExample
                    name="Lokacija preuzimanja"
                    icon={MapPin}
                    example="Rafinerija Brod"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Mjesto gdje je gorivo preuzeto (rafinerija, terminal, luka).
                    </p>
                    <ExampleData
                      good="Rafinerija Brod, Luka Ploče, Terminal Rijeka"
                      goodNote="Poznate lokacije u regiji"
                    />
                  </FieldExample>
                </div>
              </Step>

              <Step number={4} title="Informacije o kvaliteti - Aditivirano gorivo">
                <div className="space-y-4">
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-amber-900 mb-1">Kada označiti "Gorivo više kvalitete"?</p>
                        <p className="text-sm text-amber-800">
                          Označite ovaj checkbox SAMO ako je gorivo aditivirano (dodati su hemijski aditivi
                          koji poboljšavaju performanse). Obično dizel ili benzin.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="font-semibold text-dark-900">Korak po korak za aditivirano gorivo:</p>

                    <div className="bg-white border border-dark-200 rounded-xl p-4">
                      <p className="font-medium text-dark-900 mb-2">1. Označite checkbox "Gorivo više kvalitete"</p>
                      <img
                        src="/uputstvo/4.png"
                        alt="Checkbox za gorivo više kvalitete"
                        className="w-full rounded-xl border-2 border-dark-200 shadow-lg my-4"
                      />
                    </div>

                    <div className="bg-white border border-dark-200 rounded-xl p-4">
                      <p className="font-medium text-dark-900 mb-2">2. Odaberite poboljšane karakteristike</p>
                      <p className="text-sm text-dark-700 mb-3">
                        Nakon što označite checkbox, pojavljuju se opcije za karakteristike:
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <CharacteristicExample name="Aditivirano" selected />
                        <CharacteristicExample name="Detergent" />
                        <CharacteristicExample name="Antioksidant" />
                        <CharacteristicExample name="Cetanski broj povećan" />
                      </div>
                    </div>

                    <div className="bg-white border border-dark-200 rounded-xl p-4">
                      <p className="font-medium text-dark-900 mb-2">3. Unesite detalje o aditivu</p>
                      <p className="text-sm text-dark-700 mb-3">
                        Za svaku odabranu karakteristiku možete unijeti:
                      </p>
                      <div className="space-y-3">
                        <div className="bg-dark-50 rounded-lg p-3">
                          <p className="text-sm font-semibold text-dark-900 mb-1">Datum i vrijeme aditiviranja</p>
                          <p className="text-xs text-dark-600">Primjer: 01.06.2026 14:30</p>
                        </div>
                        <div className="bg-dark-50 rounded-lg p-3">
                          <p className="text-sm font-semibold text-dark-900 mb-1">Količina aditiva (mg/kg)</p>
                          <p className="text-xs text-dark-600">Primjer: 250.50</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <RealWorldScenario
                    title="Praktičan primjer: Eurodizel sa aditivom"
                    icon={Lightbulb}
                  >
                    <div className="space-y-2 text-sm text-dark-700">
                      <p><strong>Scenario:</strong> Primili ste 40,000 L Eurodizela koji je aditiviran detergentom.</p>
                      <p><strong>Šta treba unijeti:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Označite "Gorivo više kvalitete" ✓</li>
                        <li>Odaberite "Aditivirano" ✓</li>
                        <li>Datum aditiviranja: 01.06.2026 10:00</li>
                        <li>Količina: 200.00 mg/kg</li>
                      </ol>
                    </div>
                  </RealWorldScenario>
                </div>
              </Step>

              <Step number={5} title="Laboratorijske informacije">
                <div className="space-y-4">
                  <FieldExample
                    name="Laboratorija"
                    icon={FlaskConical}
                    example="Zavod za ispitivanje kvalitete Zagreb"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Odaberite akreditiranu laboratoriju. Searchable dropdown automatski prikazuje broj akreditacije.
                    </p>
                    <img
                      src="/uputstvo/5.png"
                      alt="Odabir laboratorije sa akreditacijom"
                      className="w-full rounded-xl border-2 border-dark-200 shadow-lg my-4"
                    />
                    <div className="mt-3 space-y-2">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-sm font-semibold text-emerald-900">Nakon odabira laboratorije:</p>
                        <ul className="text-xs text-emerald-800 mt-1 space-y-1">
                          <li>• Automatski se prikazuje naziv laboratorije</li>
                          <li>• Automatski se prikazuje broj akreditacije</li>
                          <li>• Ne morate ručno unositi ove podatke</li>
                        </ul>
                      </div>
                    </div>
                  </FieldExample>

                  <FieldExample
                    name="Broj izvještaja"
                    icon={FileText}
                    example="LAB-2026-445"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Broj laboratorijskog izvještaja o kvaliteti goriva koji ste primili.
                    </p>
                    <ExampleData
                      good="LAB-2026-445, ZIK/2026/1234, 2026-QC-0089"
                      goodNote="Bilo koji format broja izvještaja"
                    />
                  </FieldExample>
                </div>
              </Step>

              <Step number={6} title="Dobavljač i prevoznik">
                <div className="space-y-4">
                  <FieldExample
                    name="Dobavljač"
                    icon={Building2}
                    example="SUP-001 - OPTIMA GRUPA d.o.o. Banja Luka"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Firma koja je isporučila gorivo. Searchable dropdown sa šifrom i nazivom.
                    </p>
                    <div className="mt-3 bg-primary-50 border border-primary-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-primary-900 mb-2">Kako brzo pronaći:</p>
                      <ul className="text-xs text-primary-800 space-y-1">
                        <li>• Kucajte šifru: "SUP-001" ili "001"</li>
                        <li>• Kucajte naziv: "OPTIMA" ili "Grupa"</li>
                        <li>• Lista se filtrira automatski</li>
                      </ul>
                    </div>
                  </FieldExample>

                  <FieldExample
                    name="Prevoznik"
                    icon={Truck}
                    example="TRN-001 - SJAJ D.O.O. Maglaj"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Firma koja je vršila transport. Isti princip pretrage kao za dobavljača.
                    </p>
                  </FieldExample>

                  <FieldExample
                    name="Registarska oznaka vozila"
                    icon={Truck}
                    example="M12-A-345"
                  >
                    <p className="text-sm text-dark-700 mb-2">
                      Registarska tablica vozila koja je vršilo transport.
                    </p>
                    <ExampleData
                      good="M12-A-345, AA-123-BB, E01-B-789"
                      goodNote="Standardni formati registarskih tablica"
                    />
                  </FieldExample>
                </div>
              </Step>

              <Step number={7} title="Upload certifikata">
                <div className="space-y-4">
                  <p className="text-dark-700">
                    Možete upload-ovati certifikat, izvještaj o kvaliteti ili drugi dokument.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <p className="font-semibold text-emerald-900">Podržani formati</p>
                      </div>
                      <ul className="text-sm text-emerald-800 space-y-1">
                        <li>• PDF (.pdf)</li>
                        <li>• JPG/JPEG (.jpg, .jpeg)</li>
                        <li>• PNG (.png)</li>
                      </ul>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <p className="font-semibold text-amber-900">Ograničenja</p>
                      </div>
                      <ul className="text-sm text-amber-800 space-y-1">
                        <li>• Maksimalna veličina: 10 MB</li>
                        <li>• Jedan fajl po prijavi</li>
                        <li>• Može se zamijeniti kasnije</li>
                      </ul>
                    </div>
                  </div>

                  <img
                    src="/uputstvo/6.png"
                    alt="Upload dokumenta"
                    className="w-full rounded-xl border-2 border-dark-200 shadow-lg my-4"
                  />
                </div>
              </Step>

              <Step number={8} title="Klijent (firma)">
                <div className="space-y-4">
                  <FieldExample
                    name="Odaberite klijenta"
                    icon={Users}
                    example="KOM-001 - Kompanija d.o.o. (PIB: 123456789)"
                  >
                    <p className="text-sm text-dark-700 mb-3">
                      Odaberite firmu za koju je gorivo namijenjeno. Searchable dropdown prikazuje dodatne informacije.
                    </p>
                    <img
                      src="/uputstvo/7.png"
                      alt="Odabir klijenta sa PIB-om"
                      className="w-full rounded-xl border-2 border-dark-200 shadow-lg my-4"
                    />
                    <div className="mt-3 bg-primary-50 border border-primary-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-primary-900 mb-2">Automatski prikazani podaci:</p>
                      <ul className="text-xs text-primary-800 space-y-1">
                        <li>• Naziv firme</li>
                        <li>• Šifra klijenta</li>
                        <li>• PIB (ako je unesen)</li>
                        <li>• ID broj (ako je unesen)</li>
                      </ul>
                    </div>
                  </FieldExample>
                </div>
              </Step>

              <Step number={9} title="Provjera i kreiranje">
                <div className="space-y-4">
                  <p className="text-dark-700 mb-3">
                    Prije nego što kliknete "Kreiraj prijavu", provjerite:
                  </p>

                  <ChecklistItem done>Sva obavezna polja su popunjena (*)</ChecklistItem>
                  <ChecklistItem done>Količina je ispravno unesena</ChecklistItem>
                  <ChecklistItem done>Dobavljač i prevoznik su odabrani</ChecklistItem>
                  <ChecklistItem done>Certifikat je upload-ovan (ako ga imate)</ChecklistItem>

                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-2 border-emerald-300 rounded-xl p-4 mt-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-emerald-900 mb-2">Nakon uspješnog kreiranja:</p>
                        <ul className="text-sm text-emerald-800 space-y-1">
                          <li>✓ Sistem generise registarski broj (npr. 2026/0001)</li>
                          <li>✓ Prijava je automatski sačuvana</li>
                          <li>✓ Možete odmah generisati izjavu</li>
                          <li>✓ Prijava je vidljiva u listi</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>
              </Step>
            </div>
          </Section>

          {/* Filtering */}
          <Section
            id="filtriranje"
            title="Filtriranje i pretraga"
            icon={Filter}
            description="Kako brzo pronaći prijave"
          >
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary-600" />
                  Brza pretraga
                </h4>
                <p className="text-dark-700 mb-3">
                  Search polje u gornjem dijelu tabele omogućava trenutnu pretragu:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <SearchExample
                    query="2026/0001"
                    description="Pretraga po registarskom broju"
                  />
                  <SearchExample
                    query="Dizel"
                    description="Pretraga po nazivu proizvoda"
                  />
                  <SearchExample
                    query="Sarajevo"
                    description="Pretraga po nazivu skladišta"
                  />
                </div>

                <img
                  src="/uputstvo/8.png"
                  alt="Search polje u akciji"
                  className="w-full rounded-xl border-2 border-dark-200 shadow-lg my-4"
                />
              </div>

              <div>
                <h4 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-primary-600" />
                  Napredni filteri
                </h4>
                <p className="text-dark-700 mb-3">
                  Kliknite na dugme "Filteri" za detaljnije opcije:
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <FilterExample
                    name="Datum od/do"
                    icon={Calendar}
                    example="01.05.2026 - 31.05.2026"
                  />
                  <FilterExample
                    name="Skladište"
                    icon={Building2}
                    example="Skladište Sarajevo"
                  />
                  <FilterExample
                    name="Proizvod"
                    icon={Droplets}
                    example="ED 5 - Dizel"
                  />
                  <FilterExample
                    name="Dobavljač"
                    icon={Building2}
                    example="OPTIMA GRUPA"
                  />
                </div>

                <InfoBox icon={Lightbulb} type="tip">
                  <strong>Pro tip:</strong> Kombinirajte više filtera odjednom za preciznije rezultate.
                  Npr. "Dizel" + "Maj 2026" + "Skladište Sarajevo" za sve dizel prijave u maju u Sarajevu.
                </InfoBox>
              </div>
            </div>
          </Section>

          {/* Generating Declarations */}
          <Section
            id="generisanje"
            title="Generisanje izjava o usklađenosti"
            icon={FileText}
            description="Kako kreirati i preuzeti PDF izjave"
          >
            <div className="space-y-6">
              <Step number={1} title="Pojedinačna izjava">
                <div className="space-y-4">
                  <p className="text-dark-700 mb-3">
                    Za generisanje izjave za jednu prijavu:
                  </p>
                  <ol className="list-decimal list-inside text-dark-700 space-y-2">
                    <li>Pronađite prijavu u tabeli</li>
                    <li>Kliknite na registarski broj ili ikonu <Eye className="inline w-4 h-4 mx-1" /></li>
                    <li>U modalnom prozoru kliknite <strong className="text-primary-600">"Generiši izjavu"</strong></li>
                    <li>PDF se automatski preuzima</li>
                  </ol>

                  <img
                    src="/uputstvo/9.png"
                    alt="Modal za pregled prijave"
                    className="w-full rounded-xl border-2 border-dark-200 shadow-lg my-4"
                  />

                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-primary-900 mb-1">Naziv preuzetog fajla:</p>
                    <code className="text-xs text-primary-800">Izjava_2026_0001.pdf</code>
                  </div>
                </div>
              </Step>

              <Step number={2} title="Grupno generisanje (više izjava)">
                <div className="space-y-4">
                  <p className="text-dark-700 mb-3">
                    Za generisanje više izjava odjednom (npr. 10, 20 ili više):
                  </p>
                  <ol className="list-decimal list-inside text-dark-700 space-y-2">
                    <li>Označite checkbox-ove lijevo od prijava koje želite</li>
                    <li>Broj odabranih se prikazuje gore (npr. "5 odabrano")</li>
                    <li>Kliknite dugme <strong className="text-primary-600">"Generiši izjave"</strong></li>
                    <li>Pratite progress bar na ekranu</li>
                    <li>ZIP arhiva se automatski preuzima</li>
                  </ol>

                  <img
                    src="/uputstvo/10.png"
                    alt="Grupno generisanje sa progress bar-om"
                    className="w-full rounded-xl border-2 border-dark-200 shadow-lg my-4"
                  />

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-amber-900 mb-1">Vrijeme generisanja:</p>
                    <ul className="text-xs text-amber-800 space-y-1">
                      <li>• 1-5 izjava: ~5 sekundi</li>
                      <li>• 10-20 izjava: ~15 sekundi</li>
                      <li>• 50+ izjava: ~30-60 sekundi</li>
                    </ul>
                  </div>

                  <RealWorldScenario title="Praktičan primjer" icon={Lightbulb}>
                    <p className="text-sm text-dark-700">
                      <strong>Scenario:</strong> Treba vam izjave za sve prijave iz maja 2026.
                    </p>
                    <ol className="list-decimal list-inside text-sm text-dark-700 mt-2 space-y-1">
                      <li>Primijenite filter: Datum 01.05-31.05.2026</li>
                      <li>Označite "Odaberi sve" checkbox</li>
                      <li>Kliknite "Generiši izjave"</li>
                      <li>Preuzmite ZIP sa svim izjavama</li>
                    </ol>
                  </RealWorldScenario>
                </div>
              </Step>
            </div>
          </Section>

          {/* Viewing and Editing */}
          <Section
            id="pregled-izmjena"
            title="Pregled i izmjena prijava"
            icon={Eye}
            description="Kako pregledati ili editovati postojeće prijave"
          >
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary-600" />
                  Pregled prijave
                </h4>
                <p className="text-dark-700 mb-3">
                  Kliknite na registarski broj ili ikonu oka da vidite sve detalje:
                </p>
                <ul className="list-disc list-inside text-dark-700 space-y-1">
                  <li>Osnovne informacije (datum, skladište, proizvod, količina)</li>
                  <li>Podaci o isporuci i transportu</li>
                  <li>Informacije o kvaliteti i aditivima</li>
                  <li>Laboratorijski podaci</li>
                  <li>Upload-ovani certifikat (ako postoji)</li>
                </ul>

                <img
                  src="/uputstvo/9.png"
                  alt="Kompletan view modal"
                  className="w-full rounded-xl border-2 border-dark-200 shadow-lg my-4"
                />
              </div>

              <div>
                <h4 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-600" />
                  Izmjena prijave
                </h4>
                <p className="text-dark-700 mb-3">
                  Za izmjenu postojeće prijave:
                </p>
                <ol className="list-decimal list-inside text-dark-700 space-y-2">
                  <li>Kliknite na ikonu <Edit2 className="inline w-4 h-4 mx-1" /></li>
                  <li>Forma se otvara sa postojećim podacima</li>
                  <li>Izmjenite potrebna polja</li>
                  <li>Kliknite <strong className="text-primary-600">"Sačuvaj izmjene"</strong></li>
                </ol>

                <InfoBox icon={AlertCircle} type="warning">
                  <strong>Važno:</strong> Sve izmjene se evidentiraju u audit log-u sistema.
                  Registarski broj se NE MOŽE mijenjati.
                </InfoBox>
              </div>
            </div>
          </Section>

          {/* Common Scenarios */}
          <Section
            id="scenariji"
            title="Česti scenariji"
            icon={Lightbulb}
            description="Praktični primjeri iz svakodnevnog rada"
          >
            <div className="space-y-4">
              <Scenario
                number={1}
                title="Standardna prijava dizela"
                difficulty="Jednostavno"
              >
                <p className="text-sm text-dark-700 mb-2">
                  <strong>Situacija:</strong> Primili ste 45,000 L Eurodizela od OPTIMA GRUPA, transportovao SJAJ DOO.
                </p>
                <p className="text-sm font-semibold text-dark-900 mb-2">Šta treba unijeti:</p>
                <ul className="text-sm text-dark-700 space-y-1">
                  <li>✓ Skladište: Odaberite svoje skladište</li>
                  <li>✓ Proizvod: ED 5 - Dizel BAS EN 590</li>
                  <li>✓ Količina: 45000</li>
                  <li>✓ Dobavljač: OPTIMA GRUPA</li>
                  <li>✓ Prevoznik: SJAJ DOO</li>
                  <li>✓ Gorivo više kvalitete: NE (ako nije aditivirano)</li>
                </ul>
              </Scenario>

              <Scenario
                number={2}
                title="Aditivirani dizel iz uvoza"
                difficulty="Srednje"
              >
                <p className="text-sm text-dark-700 mb-2">
                  <strong>Situacija:</strong> Uvezli ste 40,000 L aditiviranog dizela iz Hrvatske, preko Luke Ploče.
                </p>
                <p className="text-sm font-semibold text-dark-900 mb-2">Dodatno unesite:</p>
                <ul className="text-sm text-dark-700 space-y-1">
                  <li>✓ Zemlja porijekla: Hrvatska</li>
                  <li>✓ Lokacija preuzimanja: Luka Ploče</li>
                  <li>✓ Carinska deklaracija: Broj i datum</li>
                  <li>✓ Gorivo više kvalitete: DA</li>
                  <li>✓ Karakteristika: Aditivirano</li>
                  <li>✓ Detalji aditiva: Datum i količina</li>
                </ul>
              </Scenario>

              <Scenario
                number={3}
                title="Mjesečne izjave za kontrolu"
                difficulty="Jednostavno"
              >
                <p className="text-sm text-dark-700 mb-2">
                  <strong>Situacija:</strong> Kraj mjeseca, treba vam sve izjave za mjesečni izvještaj.
                </p>
                <p className="text-sm font-semibold text-dark-900 mb-2">Koraci:</p>
                <ol className="list-decimal list-inside text-sm text-dark-700 space-y-1">
                  <li>Otvorite Filteri</li>
                  <li>Postavite datum: 01.05.2026 - 31.05.2026</li>
                  <li>Kliknite "Primijeni"</li>
                  <li>Označite "Odaberi sve"</li>
                  <li>Generiši izjave → Preuzmite ZIP</li>
                </ol>
              </Scenario>
            </div>
          </Section>

          {/* FAQ */}
          <Section
            id="faq"
            title="Često postavljana pitanja"
            icon={HelpCircle}
            description="Odgovori na najčešća pitanja"
          >
            <div className="space-y-3">
              <FAQItem
                question="Šta ako pogrešno unesem količinu?"
                answer="Možete editovati prijavu klikom na ikonu olovke. Izmjene se evidentiraju u audit log-u, ali možete slobodno ispraviti grešku."
                expanded={expandedFaq === 1}
                onToggle={() => setExpandedFaq(expandedFaq === 1 ? null : 1)}
              />

              <FAQItem
                question="Mogu li obrisati prijavu?"
                answer="Ne možete obrisati prijavu nakon što je kreirana. Možete je editovati ili kontaktirati administratora ako je potrebno deaktiviranje."
                expanded={expandedFaq === 2}
                onToggle={() => setExpandedFaq(expandedFaq === 2 ? null : 2)}
              />

              <FAQItem
                question="Šta ako mi certifikat nije dostupan pri unosu?"
                answer="Certifikat nije obavezan. Možete kreirati prijavu bez njega i dodati ga kasnije editovanjem prijave."
                expanded={expandedFaq === 3}
                onToggle={() => setExpandedFaq(expandedFaq === 3 ? null : 3)}
              />

              <FAQItem
                question="Kako pronaći prijave od određenog dobavljača?"
                answer="Koristite filter 'Dobavljač' ili kucajte naziv dobavljača u search polje. Sistem će automatski filtrirati rezultate."
                expanded={expandedFaq === 4}
                onToggle={() => setExpandedFaq(expandedFaq === 4 ? null : 4)}
              />

              <FAQItem
                question="Koliko dugo traje generisanje 50 izjava?"
                answer="Generisanje 50 izjava obično traje 30-60 sekundi, zavisno od brzine interneta. Pratite progress bar na ekranu."
                expanded={expandedFaq === 5}
                onToggle={() => setExpandedFaq(expandedFaq === 5 ? null : 5)}
              />

              <FAQItem
                question="Mogu li generisati izjavu za staru prijavu?"
                answer="Da! Možete generisati izjavu za bilo koju prijavu, bez obzira kada je kreirana. Jednostavno je pronađite i kliknite 'Generiši izjavu'."
                expanded={expandedFaq === 6}
                onToggle={() => setExpandedFaq(expandedFaq === 6 ? null : 6)}
              />

              <FAQItem
                question="Šta znači 'Gorivo više kvalitete'?"
                answer="To znači da je gorivo aditivirano - dodati su hemijski aditivi koji poboljšavaju performanse. Označite samo ako imate potvrdu o aditivima."
                expanded={expandedFaq === 7}
                onToggle={() => setExpandedFaq(expandedFaq === 7 ? null : 7)}
              />
            </div>
          </Section>

          {/* Tips */}
          <Section
            title="Savjeti za efikasan rad"
            icon={CheckCircle}
            description="Kako maksimalno iskoristiti sistem"
          >
            <div className="space-y-4">
              <TipCard icon={Search} title="Koristite searchable dropdowns" color="blue">
                Umjesto scrollovanja kroz dugačke liste, kucajte prvih nekoliko slova. Npr. "OPT" za OPTIMA GRUPA.
              </TipCard>

              <TipCard icon={Upload} title="Upload-ujte certifikate odmah" color="green">
                Lakše je upload-ovati certifikat odmah prilikom kreiranja nego ga tražiti kasnije.
              </TipCard>

              <TipCard icon={Filter} title="Koristite filtere za mjesečne izvještaje" color="purple">
                Postavite datum filter na prošli mjesec, odaberite sve i generisite ZIP sa svim izjavama.
              </TipCard>

              <TipCard icon={CheckCircle} title="Provjerite podatke prije kreiranja" color="amber">
                Izmjene se evidentiraju u audit log-u, pa je bolje unijeti tačno iz prvog puta.
              </TipCard>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}

// Helper Components

interface SectionProps {
  id?: string
  title: string
  icon: any
  description: string
  children: React.ReactNode
}

function Section({ id, title, icon: Icon, description, children }: SectionProps) {
  return (
    <div id={id} className="bg-white rounded-3xl shadow-[var(--shadow-soft)] overflow-hidden scroll-mt-6 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-white/70 to-blue-50/30 opacity-70"></div>
      <div className="relative z-10 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-primary-50">
            <Icon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-dark-900">{title}</h2>
            <p className="text-dark-600 text-sm">{description}</p>
          </div>
        </div>
        <div>
          {children}
        </div>
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
    <div className="flex gap-5">
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-[var(--shadow-soft)]">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-bold text-dark-900 mb-4">{title}</h3>
        <div className="text-dark-700 space-y-4">
          {children}
        </div>
      </div>
    </div>
  )
}

function FieldExample({ name, required, icon: Icon, example, children }: {
  name: string
  required?: boolean
  icon: any
  example: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-dark-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-primary-50">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <h5 className="font-semibold text-dark-900">
          {name}
          {required && <span className="text-red-500 ml-1">*</span>}
        </h5>
      </div>
      <div className="mb-4">
        {children}
      </div>
      <div className="bg-dark-50 rounded-xl p-3 border border-dark-100">
        <p className="text-xs font-bold text-dark-600 mb-2 uppercase tracking-wide">Primjer:</p>
        <code className="text-sm text-primary-700 font-mono font-semibold">{example}</code>
      </div>
    </div>
  )
}

function ExampleData({ good, goodNote, bad, badNote }: {
  good: string
  goodNote?: string
  bad?: string
  badNote?: string
}) {
  return (
    <div className="space-y-3">
      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3">
        <div className="flex items-start gap-3">
          <div className="p-1.5 rounded-lg bg-emerald-100 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <code className="text-sm text-emerald-800 font-semibold">{good}</code>
            {goodNote && <p className="text-xs text-emerald-700 mt-1.5">{goodNote}</p>}
          </div>
        </div>
      </div>
      {bad && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-red-100 flex-shrink-0">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <code className="text-sm text-red-800 font-semibold">{bad}</code>
              {badNote && <p className="text-xs text-red-700 mt-1.5">{badNote}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoBox({ icon: Icon, type, children }: {
  icon: any
  type: 'tip' | 'warning' | 'info'
  children: React.ReactNode
}) {
  const styles = {
    tip: 'bg-primary-50 border-primary-200 text-primary-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900'
  }

  const iconColors = {
    tip: 'text-primary-600',
    warning: 'text-amber-600',
    info: 'text-blue-600'
  }

  return (
    <div className={`rounded-2xl p-4 border-2 ${styles[type]} mt-4`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${type === 'tip' ? 'bg-primary-100' : type === 'warning' ? 'bg-amber-100' : 'bg-blue-100'} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColors[type]}`} />
        </div>
        <div className="text-sm flex-1 pt-1">
          {children}
        </div>
      </div>
    </div>
  )
}

function ScreenshotPlaceholder({ title, description }: {
  title: string
  description: string
}) {
  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 border-2 border-dashed border-gray-300 my-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-gray-300 flex items-center justify-center flex-shrink-0">
          <ImageIcon className="w-6 h-6 text-gray-500" />
        </div>
        <div>
          <p className="font-semibold text-gray-700 mb-1">📸 {title}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  )
}

function VideoPlaceholder({ title, duration, description }: {
  title: string
  duration: string
  description: string
}) {
  return (
    <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl p-6 border-2 border-dashed border-purple-300 my-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-purple-300 flex items-center justify-center flex-shrink-0">
          <Video className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <p className="font-semibold text-purple-900 mb-1">🎥 {title}</p>
          <p className="text-sm text-purple-700 mb-1">{description}</p>
          <span className="text-xs bg-purple-300 text-purple-900 px-2 py-1 rounded">Trajanje: {duration}</span>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: {
  icon: any
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-dark-100 hover:border-primary-200 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className="p-3 rounded-2xl bg-primary-50 flex-shrink-0">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h5 className="font-bold text-dark-900 text-sm mb-2">{title}</h5>
          <p className="text-xs text-dark-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}

function ProductExample({ name, type }: { name: string; type: string }) {
  return (
    <div className="bg-white rounded-lg p-2 border border-dark-200 text-xs">
      <p className="font-medium text-dark-900">{name}</p>
      <span className="text-primary-600 text-xs">{type}</span>
    </div>
  )
}

function CountryExample({ name, flag }: { name: string; flag: string }) {
  return (
    <div className="bg-white rounded-lg p-2 border border-dark-200 text-center">
      <p className="text-2xl mb-1">{flag}</p>
      <p className="text-xs font-medium text-dark-900">{name}</p>
    </div>
  )
}

function CharacteristicExample({ name, selected }: { name: string; selected?: boolean }) {
  return (
    <div className={`rounded-lg p-2 border text-xs ${
      selected
        ? 'bg-primary-50 border-primary-300 text-primary-900'
        : 'bg-white border-dark-200 text-dark-700'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-4 h-4 rounded border-2 ${
          selected ? 'bg-primary-600 border-primary-600' : 'border-dark-300'
        }`}>
          {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
        </div>
        <span className="font-medium">{name}</span>
      </div>
    </div>
  )
}

function ChecklistItem({ children, done }: { children: React.ReactNode; done?: boolean }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-dark-200">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
        done ? 'bg-emerald-100' : 'bg-gray-100'
      }`}>
        {done ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : (
          <div className="w-3 h-3 border-2 border-gray-400 rounded-full" />
        )}
      </div>
      <span className="text-sm text-dark-700">{children}</span>
    </div>
  )
}

function SearchExample({ query, description }: { query: string; description: string }) {
  return (
    <div className="bg-white rounded-lg p-3 border border-dark-200">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-4 h-4 text-primary-600" />
        <code className="text-sm font-mono text-primary-700">{query}</code>
      </div>
      <p className="text-xs text-dark-600">{description}</p>
    </div>
  )
}

function FilterExample({ name, icon: Icon, example }: {
  name: string
  icon: any
  example: string
}) {
  return (
    <div className="bg-white rounded-lg p-3 border border-dark-200">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary-600" />
        <h5 className="font-medium text-dark-900 text-sm">{name}</h5>
      </div>
      <p className="text-xs text-dark-600">{example}</p>
    </div>
  )
}

function RealWorldScenario({ title, icon: Icon, children }: {
  title: string
  icon: any
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-blue-200 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100 rounded-full blur-2xl opacity-50 -mr-8 -mt-8"></div>
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-blue-50">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <h5 className="font-bold text-blue-900">{title}</h5>
        </div>
        {children}
      </div>
    </div>
  )
}

function Scenario({ number, title, difficulty, children }: {
  number: number
  title: string
  difficulty: string
  children: React.ReactNode
}) {
  const difficultyColors = {
    'Jednostavno': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Srednje': 'bg-amber-100 text-amber-700 border-amber-200',
    'Složeno': 'bg-red-100 text-red-700 border-red-200'
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-dark-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-700 font-bold">
            {number}
          </div>
          <h5 className="font-bold text-dark-900">{title}</h5>
        </div>
        <span className={`text-xs px-3 py-1.5 rounded-xl font-semibold border ${difficultyColors[difficulty as keyof typeof difficultyColors]}`}>
          {difficulty}
        </span>
      </div>
      {children}
    </div>
  )
}

function FAQItem({ question, answer, expanded, onToggle }: {
  question: string
  answer: string
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={`bg-white rounded-2xl border-2 overflow-hidden transition-all ${expanded ? 'border-primary-300 shadow-md' : 'border-dark-100 hover:border-dark-200'}`}>
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-dark-50 transition-colors"
      >
        <span className="font-bold text-dark-900 text-sm pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-all ${expanded ? 'rotate-180 text-primary-600' : 'text-dark-400'}`} />
      </button>
      {expanded && (
        <div className="px-5 py-4 bg-primary-50/30 border-t-2 border-primary-100">
          <p className="text-sm text-dark-700 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

function TipCard({ icon: Icon, title, color, children }: {
  icon: any
  title: string
  color: 'blue' | 'green' | 'amber' | 'purple'
  children: React.ReactNode
}) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-emerald-50 border-emerald-200',
    amber: 'bg-amber-50 border-amber-200',
    purple: 'bg-purple-50 border-purple-200'
  }

  const iconBg = {
    blue: 'bg-blue-100',
    green: 'bg-emerald-100',
    amber: 'bg-amber-100',
    purple: 'bg-purple-100'
  }

  const iconColors = {
    blue: 'text-blue-600',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600'
  }

  return (
    <div className={`rounded-2xl p-5 border-2 ${colors[color]}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-xl ${iconBg[color]} flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColors[color]}`} />
        </div>
        <div className="flex-1">
          <h5 className="font-bold text-dark-900 text-sm mb-2">{title}</h5>
          <p className="text-sm text-dark-700 leading-relaxed">{children}</p>
        </div>
      </div>
    </div>
  )
}

function QuickLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-4 py-2 rounded-xl text-sm font-medium bg-dark-50 text-dark-600 hover:bg-primary-50 hover:text-primary-700 transition-all border border-dark-100 hover:border-primary-200"
    >
      {children}
    </a>
  )
}
