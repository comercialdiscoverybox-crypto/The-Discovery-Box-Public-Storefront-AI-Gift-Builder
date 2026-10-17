import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { getCatalogImageCropStyle } from '../../../src/lib/catalogImageCrop';

type Language = 'en' | 'pt';
type CatalogItem = {
  id: string;
  family: 'PLAY' | 'HOME' | 'BUSINESS';
  collection: string;
  category: string | null;
  name_en: string;
  name_pt: string;
  description_en: string;
  description_pt: string;
  price_mzn: number | string | null;
  images: string[];
  image_crops?: Array<{ x: number; y: number; zoom: number }>;
  primary_image_index: number;
};
type Collection = {
  id: string;
  family: CatalogItem['family'];
  name_en: string;
  name_pt: string;
  tagline_en: string | null;
  tagline_pt: string | null;
  image_url: string;
  image_crop?: { x: number; y: number; zoom: number };
};
type CatalogResponse = {
  items: CatalogItem[];
  collections: Collection[];
};

const copy = {
  en: {
    navShop: 'Shop',
    navBuilder: 'Build a gift',
    navCorporate: 'Corporate gifts',
    navAbout: 'Our story',
    navContact: 'Contact',
    heroEyebrow: 'A little wonder, thoughtfully wrapped',
    heroTitle: 'Give them a moment they’ll remember.',
    heroBody: 'Discover meaningful gifts and make every celebration feel like theirs.',
    browse: 'Explore the collection',
    create: 'Create a gift',
    trusted: 'Thoughtful by nature. Personal by design.',
    introTitle: 'Find the feeling. We’ll find the gift.',
    introBody: 'From a small thank-you to a big celebration, explore ideas selected with care.',
    collectionTitle: 'Explore our worlds',
    collectionBody: 'A little something for play, home and the people you work with.',
    popularTitle: 'Made for moments that matter',
    productsBody: 'Browse the approved public collection. Every detail is confirmed with our team.',
    shop: 'The collection',
    all: 'All gifts',
    play: 'PLAY',
    home: 'HOME',
    business: 'BUSINESS',
    empty: 'Our collection is being prepared. Please check back soon.',
    catalogError: 'We could not load the catalogue right now. Please try again shortly.',
    loading: 'Finding thoughtful things…',
    requestQuote: 'Ask about this gift',
    buildWith: 'Build a gift around this',
    noPrice: 'Request a quote',
    backShop: 'Back to the collection',
    builderEyebrow: 'Your idea, made personal',
    builderTitle: 'Let’s make a gift that feels just right.',
    step: 'Step',
    of: 'of',
    next: 'Continue',
    previous: 'Go back',
    occasion: 'What are we celebrating?',
    recipient: 'Who is it for?',
    budget: 'Your comfortable budget (MZN)',
    interests: 'What do they love? What should we know?',
    interestsHint: 'Interests, favourite colours, style or anything to avoid',
    chooseProducts: 'Add products from our public collection (optional)',
    review: 'Your gift idea',
    cardMessage: 'Gift-card message (optional)',
    name: 'Your name',
    email: 'Email address',
    phone: 'Phone (optional)',
    submit: 'Send an enquiry',
    sending: 'Sending…',
    sent: 'Thanks! Your enquiry has been sent to our team.',
    submitError: 'We could not send your enquiry. Please try again later.',
    required: 'Please complete the required fields.',
    privacyConsent: 'I agree that my contact details and gift brief can be used to respond to this enquiry.',
    imageButton: 'Imagine this gift',
    imageLoading: 'Creating an illustrative idea…',
    imageError: 'The concept image is unavailable right now. Your gift idea is still saved in this form.',
    imageLabel: 'Illustrative AI concept',
    disclaimer: 'This image is an illustration, not a photo of the finished gift. Final contents, personalization, price and delivery are confirmed by The Discovery Box.',
    privacy: 'Privacy',
    terms: 'Terms',
    footer: 'Thoughtfully made in Mozambique.',
    corporateTitle: 'Thoughtful gifting for teams, clients and celebrations.',
    corporateBody: 'From a few meaningful thank-yous to a company-wide celebration, tell us what you have in mind and our team will help shape it.',
    aboutTitle: 'The joy is in the discovery.',
    aboutBody: 'The Discovery Box brings together thoughtful finds and personal touches to make the people in your life feel truly seen.',
    contactTitle: 'We’d love to hear what you’re celebrating.',
    contactBody: 'Tell us a little about the moment and our team will get back to you.',
    contactOptions: 'Contact options are being confirmed. You can still send an enquiry using the gift builder.',
    privacyTitle: 'Privacy notice',
    privacyBody: 'We use the contact details and gift brief you submit only to respond to your enquiry. Your contact details are sent to our enquiry email provider and are not sent to the image-generation provider. If you choose to request an illustrative image, only your gift preferences and selected public product names are sent to the AI provider. This site stores your language choice in your browser. Please do not include sensitive personal information in the gift brief.',
    termsTitle: 'Important information',
    termsBody: 'Product availability, contents, personalization, prices and delivery details are confirmed by The Discovery Box. Gift-builder selections and generated images are suggestions only and do not create an order or a binding offer. No online payment or order reservation is available on this website.',
    occasions: ['Birthday', 'Anniversary', 'Thank you', 'New baby', 'Celebration', 'Corporate event', 'Something else'],
    recipients: ['Friend', 'Partner', 'Child', 'Family member', 'Colleague', 'Client', 'Someone else'],
    notFound: 'We couldn’t find that page.',
  },
  pt: {
    navShop: 'Loja',
    navBuilder: 'Criar presente',
    navCorporate: 'Presentes empresariais',
    navAbout: 'A nossa história',
    navContact: 'Contacto',
    heroEyebrow: 'Um pouco de encanto, preparado com carinho',
    heroTitle: 'Ofereça um momento inesquecível.',
    heroBody: 'Descubra presentes especiais e torne cada celebração única.',
    browse: 'Explorar a coleção',
    create: 'Criar um presente',
    trusted: 'Pensado com carinho. Feito à sua medida.',
    introTitle: 'Encontre o sentimento. Nós encontramos o presente.',
    introBody: 'De um pequeno agradecimento a uma grande celebração, descubra ideias escolhidas com cuidado.',
    collectionTitle: 'Explore os nossos mundos',
    collectionBody: 'Ideias para brincar, para a casa e para as pessoas com quem trabalha.',
    popularTitle: 'Feito para momentos especiais',
    productsBody: 'Explore a coleção pública aprovada. Cada detalhe é confirmado pela nossa equipa.',
    shop: 'A coleção',
    all: 'Todos os presentes',
    play: 'BRINCAR',
    home: 'CASA',
    business: 'EMPRESAS',
    empty: 'Estamos a preparar a coleção. Volte em breve.',
    catalogError: 'Não foi possível carregar o catálogo. Tente novamente dentro de alguns instantes.',
    loading: 'A encontrar presentes especiais…',
    requestQuote: 'Perguntar sobre este presente',
    buildWith: 'Criar um presente a partir deste',
    noPrice: 'Solicitar orçamento',
    backShop: 'Voltar à coleção',
    builderEyebrow: 'A sua ideia, feita à medida',
    builderTitle: 'Vamos criar um presente especial.',
    step: 'Passo',
    of: 'de',
    next: 'Continuar',
    previous: 'Voltar',
    occasion: 'O que vamos celebrar?',
    recipient: 'Para quem é?',
    budget: 'Orçamento aproximado (MZN)',
    interests: 'Do que gosta? O que devemos saber?',
    interestsHint: 'Interesses, cores favoritas, estilo ou algo a evitar',
    chooseProducts: 'Adicione produtos da coleção pública (opcional)',
    review: 'A sua ideia de presente',
    cardMessage: 'Mensagem para o cartão (opcional)',
    name: 'O seu nome',
    email: 'Endereço de email',
    phone: 'Telefone (opcional)',
    submit: 'Enviar pedido',
    sending: 'A enviar…',
    sent: 'Obrigado! O seu pedido foi enviado à nossa equipa.',
    submitError: 'Não foi possível enviar o pedido. Tente novamente mais tarde.',
    required: 'Preencha os campos obrigatórios.',
    privacyConsent: 'Autorizo a utilização dos meus contactos e da descrição do presente para responder a este pedido.',
    imageButton: 'Imaginar este presente',
    imageLoading: 'A criar uma ideia ilustrativa…',
    imageError: 'A imagem não está disponível. A sua ideia continua neste formulário.',
    imageLabel: 'Conceito ilustrativo com IA',
    disclaimer: 'Esta imagem é uma ilustração, não uma fotografia do presente final. Os conteúdos, a personalização, o preço e a entrega são confirmados pela The Discovery Box.',
    privacy: 'Privacidade',
    terms: 'Termos',
    footer: 'Feito com carinho em Moçambique.',
    corporateTitle: 'Presentes especiais para equipas, clientes e celebrações.',
    corporateBody: 'De alguns agradecimentos a uma celebração para toda a empresa, conte-nos a sua ideia e a nossa equipa ajudará a desenvolvê-la.',
    aboutTitle: 'A alegria está na descoberta.',
    aboutBody: 'A Discovery Box reúne descobertas especiais e toques pessoais para que as pessoas importantes se sintam verdadeiramente valorizadas.',
    contactTitle: 'Conte-nos o que vamos celebrar.',
    contactBody: 'Diga-nos um pouco sobre a ocasião e a nossa equipa entrará em contacto.',
    contactOptions: 'Os contactos estão a ser confirmados. Ainda pode enviar um pedido através do criador de presentes.',
    privacyTitle: 'Aviso de privacidade',
    privacyBody: 'Utilizamos os contactos e a descrição enviados apenas para responder ao seu pedido. Os seus contactos são enviados ao nosso serviço de email e não são enviados ao serviço de criação de imagens. Se pedir uma imagem ilustrativa, apenas as preferências e os nomes dos produtos públicos selecionados são enviados ao fornecedor de IA. Este site guarda a sua preferência de idioma no navegador. Não inclua informações pessoais sensíveis na descrição.',
    termsTitle: 'Informações importantes',
    termsBody: 'A disponibilidade, os conteúdos, a personalização, os preços e a entrega são confirmados pela The Discovery Box. As seleções e imagens geradas são apenas sugestões e não constituem uma encomenda ou oferta vinculativa. Este website não permite pagamentos nem reserva de encomendas.',
    occasions: ['Aniversário', 'Aniversário de relacionamento', 'Agradecimento', 'Nascimento', 'Celebração', 'Evento empresarial', 'Outra ocasião'],
    recipients: ['Amigo/a', 'Companheiro/a', 'Criança', 'Familiar', 'Colega', 'Cliente', 'Outra pessoa'],
    notFound: 'Não encontrámos esta página.',
  },
} as const;

type TextKey = keyof typeof copy.en;

const familyName = (family: CatalogItem['family'], language: Language) => ({
  PLAY: language === 'en' ? 'PLAY' : 'BRINCAR',
  HOME: language === 'en' ? 'HOME' : 'CASA',
  BUSINESS: language === 'en' ? 'BUSINESS' : 'EMPRESAS',
}[family]);

function readLanguagePreference(): Language {
  try {
    return window.localStorage.getItem('discovery-language') === 'pt' ? 'pt' : 'en';
  } catch (error) {
    console.warn('Could not read the saved language preference', error);
    return 'en';
  }
}

function App() {
  const [language, setLanguage] = useState<Language>(readLanguagePreference);
  const [catalog, setCatalog] = useState<CatalogResponse>({ items: [], collections: [] });
  const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [contact, setContact] = useState<{ email: string; whatsapp: string }>({ email: '', whatsapp: '' });
  const t = copy[language];
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  useEffect(() => {
    try {
      window.localStorage.setItem('discovery-language', language);
    } catch (error) {
      console.warn('Could not save the language preference', error);
    }
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    fetch('/api/catalog').then((response) => {
      if (!response.ok) throw new Error('Catalogue request failed');
      return response.json() as Promise<CatalogResponse>;
    }).then((nextCatalog) => {
      setCatalog(nextCatalog);
      setCatalogState('ready');
    }).catch(() => setCatalogState('error'));
    fetch('/api/public-config').then((response) => {
      if (!response.ok) throw new Error('Contact configuration request failed');
      return response.json() as Promise<{ email: string; whatsapp: string }>;
    }).then(setContact).catch(() => setContact({ email: '', whatsapp: '' }));
  }, []);

  const itemById = useMemo(() => new Map(catalog.items.map((item) => [item.id, item])), [catalog.items]);
  const selectedItemId = path.startsWith('/product/') ? decodeURIComponent(path.slice('/product/'.length)) : '';
  const selectedItem = itemById.get(selectedItemId);
  const productImage = (item: CatalogItem) => item.images?.[item.primary_image_index] || item.images?.[0] || '';
  const productImageStyle = (item: CatalogItem) =>
    getCatalogImageCropStyle(item.image_crops?.[item.primary_image_index] || item.image_crops?.[0]);
  const nameFor = (item: CatalogItem) => language === 'en' ? item.name_en : item.name_pt;
  const descriptionFor = (item: CatalogItem) => language === 'en' ? item.description_en : item.description_pt;

  const renderCards = (items: CatalogItem[]) => (
    <div className="product-grid">
      {items.map((item) => (
        <article className="product-card" key={item.id}>
          <a className="product-image" href={`/product/${encodeURIComponent(item.id)}`} aria-label={nameFor(item)}>
            {productImage(item) ? <img src={productImage(item)} alt={nameFor(item)} style={productImageStyle(item)} loading="lazy" /> : <span className="image-placeholder">✦</span>}
            <span className="family-chip">{familyName(item.family, language)}</span>
          </a>
          <div className="product-copy">
            <span className="product-code">{item.id}</span>
            <h3><a href={`/product/${encodeURIComponent(item.id)}`}>{nameFor(item)}</a></h3>
            <p>{descriptionFor(item)}</p>
            <div className="product-bottom">
              <strong>{item.price_mzn != null ? `${Number(item.price_mzn).toLocaleString(language === 'pt' ? 'pt-MZ' : 'en-US')} MZN` : t.noPrice}</strong>
              <a className="text-link" href={`/product/${encodeURIComponent(item.id)}`}>{t.requestQuote} <span aria-hidden="true">↗</span></a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  const catalogNotice = catalogState === 'loading'
    ? <p className="notice">{t.loading}</p>
    : catalogState === 'error'
      ? <p className="notice notice-error">{t.catalogError}</p>
      : null;

  let page;
  if (path === '/') {
    page = (
      <>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">{t.heroEyebrow}</span>
            <h1>{t.heroTitle}</h1>
            <p>{t.heroBody}</p>
            <div className="button-row">
              <a className="button button-primary" href="/shop">{t.browse}<span aria-hidden="true">↗</span></a>
              <a className="button button-light" href="/gift-builder">{t.create}</a>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="gift-box"><span className="gift-ribbon" /><span className="gift-bow">✦</span></div>
            <span className="spark spark-one">✦</span><span className="spark spark-two">✧</span><span className="spark spark-three">✳</span>
            <span className="hero-note">made<br />for you</span>
          </div>
          <div className="hero-swoosh" />
        </section>
        <div className="trust-strip"><span>✦</span>{t.trusted}<span>✦</span></div>
        <section className="section section-intro">
          <div className="section-heading">
            <span className="eyebrow eyebrow-coral">THE DISCOVERY BOX</span>
            <h2>{t.introTitle}</h2>
            <p>{t.introBody}</p>
          </div>
          <div className="intro-pills"><span>PLAY</span><span>HOME</span><span>BUSINESS</span></div>
        </section>
        <section className="section section-tint">
          <div className="section-heading section-heading-row">
            <div><span className="eyebrow eyebrow-coral">A WORLD OF POSSIBILITIES</span><h2>{t.collectionTitle}</h2><p>{t.collectionBody}</p></div>
            <a className="text-link" href="/shop">{t.browse} <span aria-hidden="true">↗</span></a>
          </div>
          {catalogNotice}
          {catalogState === 'ready' && (
            <div className="collection-grid">
              {catalog.collections.map((collection, index) => (
                <a className={`collection-card collection-${index % 3}`} href={`/shop?collection=${encodeURIComponent(collection.id)}`} key={collection.id}>
                  {collection.image_url && <img src={collection.image_url} alt="" style={getCatalogImageCropStyle(collection.image_crop)} loading="lazy" />}
                  <span className="collection-overlay" />
                  <span className="collection-copy">
                    <small>{familyName(collection.family, language)}</small>
                    <strong>{language === 'en' ? collection.name_en : collection.name_pt}</strong>
                    <span>{language === 'en' ? collection.tagline_en : collection.tagline_pt}</span>
                  </span>
                  <span className="collection-arrow" aria-hidden="true">↗</span>
                </a>
              ))}
              {!catalog.collections.length && <p className="notice">{t.empty}</p>}
            </div>
          )}
        </section>
        <section className="section">
          <div className="section-heading section-heading-row">
            <div><span className="eyebrow eyebrow-coral">CHOSEN WITH CARE</span><h2>{t.popularTitle}</h2><p>{t.productsBody}</p></div>
            <a className="text-link" href="/shop">{t.shop} <span aria-hidden="true">↗</span></a>
          </div>
          {catalogNotice}
          {catalogState === 'ready' && (catalog.items.length ? renderCards(catalog.items.slice(0, 3)) : <p className="notice">{t.empty}</p>)}
        </section>
        <section className="builder-banner">
          <div className="builder-star" aria-hidden="true">✦</div>
          <div><span className="eyebrow">{t.builderEyebrow}</span><h2>{t.builderTitle}</h2></div>
          <a className="button button-dark" href="/gift-builder">{t.create}<span aria-hidden="true">↗</span></a>
        </section>
      </>
    );
  } else if (path === '/shop' || path.startsWith('/shop/')) {
    const familyParam = new URLSearchParams(window.location.search).get('family');
    const collectionParam = new URLSearchParams(window.location.search).get('collection');
    const [family] = [familyParam && ['PLAY', 'HOME', 'BUSINESS'].includes(familyParam) ? familyParam : 'ALL'];
    const selectedCollection = catalog.collections.find((item) => item.id === collectionParam);
    const visible = selectedCollection
      ? catalog.items.filter((item) =>
        item.family === selectedCollection.family &&
        [selectedCollection.id, selectedCollection.name_en, selectedCollection.name_pt].includes(item.collection),
      )
      : family === 'ALL' ? catalog.items : catalog.items.filter((item) => item.family === family);
    page = (
      <section className="section page-section">
        <div className="page-heading"><span className="eyebrow eyebrow-coral">{t.navShop}</span><h1>{selectedCollection ? (language === 'en' ? selectedCollection.name_en : selectedCollection.name_pt) : t.shop}</h1><p>{selectedCollection ? (language === 'en' ? selectedCollection.tagline_en : selectedCollection.tagline_pt) || t.productsBody : t.productsBody}</p></div>
        <div className="filter-row">
          {[['ALL', t.all], ['PLAY', t.play], ['HOME', t.home], ['BUSINESS', t.business]].map(([value, label]) => (
            <a className={`filter-chip ${(family === value) ? 'filter-active' : ''}`} href={value === 'ALL' ? '/shop' : `/shop?family=${value}`} key={value}>{label}</a>
          ))}
        </div>
        {catalogNotice}
        {catalogState === 'ready' && (visible.length ? renderCards(visible) : <p className="notice">{t.empty}</p>)}
      </section>
    );
  } else if (path.startsWith('/product/')) {
    page = selectedItem ? (
      <section className="section product-detail page-section">
        <a className="text-link back-link" href="/shop">← {t.backShop}</a>
        <div className="detail-grid">
          <div className="detail-image">{productImage(selectedItem) ? <img src={productImage(selectedItem)} alt={nameFor(selectedItem)} style={productImageStyle(selectedItem)} /> : <span className="image-placeholder">✦</span>}</div>
          <div className="detail-copy">
            <span className="eyebrow eyebrow-coral">{familyName(selectedItem.family, language)} · {selectedItem.id}</span>
            <h1>{nameFor(selectedItem)}</h1>
            <p>{descriptionFor(selectedItem)}</p>
            <strong className="detail-price">{selectedItem.price_mzn != null ? `${Number(selectedItem.price_mzn).toLocaleString(language === 'pt' ? 'pt-MZ' : 'en-US')} MZN` : t.noPrice}</strong>
            <p className="muted">{t.termsBody}</p>
            <div className="button-row"><a className="button button-primary" href={`/gift-builder?product=${encodeURIComponent(selectedItem.id)}`}>{t.buildWith}</a><a className="button button-outline" href="/gift-builder">{t.requestQuote}</a></div>
          </div>
        </div>
      </section>
    ) : catalogState === 'loading' ? <section className="section page-section">{catalogNotice}</section>
      : <section className="section page-section"><p className="notice">{catalogState === 'error' ? t.catalogError : t.notFound}</p></section>;
  } else if (path === '/gift-builder') {
    page = <GiftBuilder catalog={catalog} catalogState={catalogState} language={language} t={t} nameFor={nameFor} descriptionFor={descriptionFor} productImage={productImage} productImageStyle={productImageStyle} />;
  } else if (path === '/corporate') {
    page = <section className="section content-page"><span className="eyebrow eyebrow-coral">{t.navCorporate}</span><h1>{t.corporateTitle}</h1><p>{t.corporateBody}</p><a className="button button-primary" href="/gift-builder">{t.create}<span aria-hidden="true">↗</span></a></section>;
  } else if (path === '/about') {
    page = <section className="section content-page"><span className="eyebrow eyebrow-coral">THE DISCOVERY BOX</span><h1>{t.aboutTitle}</h1><p>{t.aboutBody}</p><div className="about-colors"><i /><i /><i /><i /><i /></div><a className="button button-primary" href="/shop">{t.browse}</a></section>;
  } else if (path === '/contact') {
    page = <section className="section content-page"><span className="eyebrow eyebrow-coral">{t.navContact}</span><h1>{t.contactTitle}</h1><p>{t.contactBody}</p><div className="contact-links">{contact.email && <a className="button button-outline" href={`mailto:${contact.email}`}>{contact.email}</a>}{contact.whatsapp && <a className="button button-primary" href={contact.whatsapp} target="_blank" rel="noreferrer">WhatsApp ↗</a>}</div>{!contact.email && !contact.whatsapp && <p className="notice">{t.contactOptions}</p>}<a className="text-link" href="/gift-builder">{t.create} ↗</a></section>;
  } else if (path === '/privacy') {
    page = <section className="section content-page"><span className="eyebrow eyebrow-coral">{t.privacy}</span><h1>{t.privacyTitle}</h1><p>{t.privacyBody}</p><p className="muted">{t.contactOptions}</p></section>;
  } else if (path === '/terms') {
    page = <section className="section content-page"><span className="eyebrow eyebrow-coral">{t.terms}</span><h1>{t.termsTitle}</h1><p>{t.termsBody}</p></section>;
  } else {
    page = <section className="section page-section"><p className="notice">{t.notFound}</p><a href="/">{t.browse}</a></section>;
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="The Discovery Box home"><img src="/official-logo.png" alt="The Discovery Box" /></a>
        <nav className="main-nav" aria-label={language === 'en' ? 'Main navigation' : 'Navegação principal'}>
          <a href="/shop">{t.navShop}</a><a href="/gift-builder">{t.navBuilder}</a><a href="/corporate">{t.navCorporate}</a><a href="/about">{t.navAbout}</a><a href="/contact">{t.navContact}</a>
        </nav>
        <div className="header-actions">
          <div className="language-switch" aria-label="Language">
            <button type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>EN</button>
            <span>/</span>
            <button type="button" onClick={() => setLanguage('pt')} aria-pressed={language === 'pt'}>PT</button>
          </div>
          <a className="header-cta" href="/gift-builder">{t.create}<span aria-hidden="true">↗</span></a>
        </div>
      </header>
      <main>{page}</main>
      <footer className="site-footer">
        <div className="footer-top"><a className="brand brand-footer" href="/"><img src="/official-logo.png" alt="The Discovery Box" /></a><span>{t.footer}</span><a className="footer-cta" href="/gift-builder">{t.create} ↗</a></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} The Discovery Box</span><div><a href="/privacy">{t.privacy}</a><a href="/terms">{t.terms}</a><a href="/contact">{t.navContact}</a></div></div>
      </footer>
    </div>
  );
}

function GiftBuilder({
  catalog, catalogState, language, t, nameFor, descriptionFor, productImage, productImageStyle,
}: {
  catalog: CatalogResponse;
  catalogState: 'loading' | 'ready' | 'error';
  language: Language;
  t: typeof copy[Language];
  nameFor: (item: CatalogItem) => string;
  descriptionFor: (item: CatalogItem) => string;
  productImage: (item: CatalogItem) => string;
  productImageStyle: (item: CatalogItem) => CSSProperties;
}) {
  const initialProduct = new URLSearchParams(window.location.search).get('product') || '';
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(initialProduct ? [initialProduct] : []);
  const [occasion, setOccasion] = useState('');
  const [recipient, setRecipient] = useState('');
  const [budget, setBudget] = useState('');
  const [preferences, setPreferences] = useState('');
  const [cardMessage, setCardMessage] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<'submit' | 'image' | ''>('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [conceptImage, setConceptImage] = useState('');
  const selectedProducts = catalog.items.filter((item) => selected.includes(item.id));
  const selectedNames = selectedProducts.map(nameFor);
  const selectedOccasion = occasion || (language === 'en' ? 'Something else' : 'Outra ocasião');
  const selectedRecipient = recipient || (language === 'en' ? 'Someone else' : 'Outra pessoa');

  const toggleProduct = (id: string) => setSelected((items) =>
    items.includes(id) ? items.filter((item) => item !== id) : items.length < 5 ? [...items, id] : items,
  );

  const requestImage = async () => {
    setError('');
    setBusy('image');
    try {
      const response = await fetch('/api/gift-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, occasion: selectedOccasion, recipient: selectedRecipient, budget, preferences, products: selectedNames }),
      });
      if (!response.ok) throw new Error('Image request failed');
      const result = await response.json() as { image: string };
      setConceptImage(result.image);
    } catch {
      setError(t.imageError);
    } finally {
      setBusy('');
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !consent) {
      setError(t.required);
      return;
    }
    setBusy('submit');
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language, name, email, phone, occasion: selectedOccasion, recipient: selectedRecipient,
          budget, preferences, cardMessage, products: selectedNames,
          website: String(new FormData(event.currentTarget).get('website') || ''),
          consent,
        }),
      });
      if (!response.ok) throw new Error('Enquiry request failed');
      setSent(true);
    } catch {
      setError(t.submitError);
    } finally {
      setBusy('');
    }
  };

  return (
    <section className="section builder-page">
      <div className="builder-heading"><span className="eyebrow eyebrow-coral">{t.builderEyebrow}</span><h1>{t.builderTitle}</h1></div>
      <div className="step-track" aria-label={`${t.step} ${step} ${t.of} 3`}>
        {[1, 2, 3].map((item) => <span className={item <= step ? 'step-dot step-current' : 'step-dot'} key={item}>{item}</span>)}
      </div>
      {sent ? <div className="success-card"><span className="success-icon">✓</span><h2>{t.sent}</h2><a className="button button-primary" href="/shop">{t.browse}</a></div> : (
        <>
          {step === 1 && <div className="builder-panel">
            <label>{t.occasion}<select value={occasion} onChange={(event) => setOccasion(event.target.value)}><option value="">—</option>{t.occasions.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>{t.recipient}<select value={recipient} onChange={(event) => setRecipient(event.target.value)}><option value="">—</option>{t.recipients.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>{t.budget}<input type="number" min="0" max="10000000" value={budget} onChange={(event) => setBudget(event.target.value)} /></label>
            <label>{t.interests}<textarea maxLength={1000} placeholder={t.interestsHint} value={preferences} onChange={(event) => setPreferences(event.target.value)} /></label>
          </div>}
          {step === 2 && <div className="builder-panel">
            <h2>{t.chooseProducts}</h2>
            {catalogState === 'loading' && <p className="notice">{t.loading}</p>}
            {catalogState === 'error' && <p className="notice notice-error">{t.catalogError}</p>}
            {catalogState === 'ready' && !catalog.items.length && <p className="notice">{t.empty}</p>}
            <div className="choice-grid">
              {catalog.items.map((item) => (
                <label className={`choice-card ${selected.includes(item.id) ? 'choice-selected' : ''}`} key={item.id}>
                  <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleProduct(item.id)} disabled={!selected.includes(item.id) && selected.length >= 5} />
                  {productImage(item) && <img src={productImage(item)} alt="" style={productImageStyle(item)} loading="lazy" />}
                  <span><strong>{nameFor(item)}</strong><small>{descriptionFor(item)}</small></span>
                </label>
              ))}
            </div>
          </div>}
          {step === 3 && <form className="builder-panel review-panel" onSubmit={submit}>
            <h2>{t.review}</h2>
            <div className="review-summary">
              <p><strong>{t.occasion}:</strong> {selectedOccasion}</p><p><strong>{t.recipient}:</strong> {selectedRecipient}</p>
              {budget && <p><strong>{t.budget}:</strong> {Number(budget).toLocaleString(language === 'pt' ? 'pt-MZ' : 'en-US')} MZN</p>}
              {preferences && <p><strong>{t.interests}:</strong> {preferences}</p>}
              {selectedProducts.length > 0 && <ul>{selectedProducts.map((item) => <li key={item.id}>{nameFor(item)}{item.price_mzn != null ? ` — ${Number(item.price_mzn).toLocaleString(language === 'pt' ? 'pt-MZ' : 'en-US')} MZN` : ''}</li>)}</ul>}
            </div>
            <label>{t.cardMessage}<textarea maxLength={500} value={cardMessage} onChange={(event) => setCardMessage(event.target.value)} /></label>
            <div className="ai-panel">
              <div><span className="eyebrow eyebrow-coral">{t.imageLabel}</span><p>{t.disclaimer}</p></div>
              <button type="button" className="button button-outline" disabled={busy !== ''} onClick={requestImage}>{busy === 'image' ? t.imageLoading : t.imageButton}</button>
              {conceptImage && <img className="concept-image" src={conceptImage} alt={t.imageLabel} />}
            </div>
            <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <label>{t.name}<input autoComplete="name" maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>{t.email}<input type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>{t.phone}<input type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
            <label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{t.privacyConsent} <a href="/privacy">{t.privacy}</a></span></label>
            {error && <p className="notice notice-error" role="alert">{error}</p>}
            <button className="button button-primary submit-button" type="submit" disabled={busy !== ''}>{busy === 'submit' ? t.sending : t.submit}<span aria-hidden="true">↗</span></button>
          </form>}
          {step !== 3 && <div className="builder-controls">
            {step > 1 ? <button className="button button-outline" type="button" onClick={() => setStep(step - 1)}>{t.previous}</button> : <span />}
            <button className="button button-primary" type="button" onClick={() => {
              setError('');
              if (step === 1 && (!occasion || !recipient)) {
                setError(t.required);
                return;
              }
              setStep(step + 1);
            }}>{t.next}<span aria-hidden="true">↗</span></button>
          </div>}
          {step === 3 && <div className="builder-controls"><button className="button button-outline" type="button" onClick={() => setStep(2)}>{t.previous}</button></div>}
          {error && step !== 3 && <p className="notice notice-error" role="alert">{error}</p>}
        </>
      )}
    </section>
  );
}

export default App;
