import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react';

type Language = 'en' | 'pt';
type Theme = 'light' | 'dark';
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
    themeLight: 'Switch to light mode',
    themeDark: 'Switch to dark mode',
    menu: 'Open navigation menu',
    possibleWorlds: 'A world of possibilities',
    chosenWithCare: 'Chosen with care',
    madeForYou: <>made<br />for you</>,
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
    collectionBrowse: 'Explore collections',
    categoryLabel: 'Browse by category',
    collectionLabel: 'Collections',
    categoryPlay: 'Toys & Creative Figures',
    categoryHome: 'Creative & Functional Objects',
    categoryBusiness: 'Corporate & Personalized Gifts',
    itemsCount: (count: number) => `${count} ${count === 1 ? 'discovery' : 'discoveries'}`,
    momentEyebrow: 'A little ritual, a lasting memory',
    momentTitle: 'Your Discovery Moment',
    momentBody: 'The best part is seeing what someone discovers inside.',
    momentSteps: [
      ['UNBOX', 'Open your Discovery Box and let the surprise begin.'],
      ['SNAP', 'Capture the smile, the detail or the favourite find.'],
      ['SHARE', 'Share your moment with the people you love.'],
      ['TAG', 'Tag @the_discoverybox so we can celebrate with you.'],
      ['TELL US', 'We would love to hear what you discovered.'],
    ],
    valuesTitle: 'Made with curiosity. Shared with care.',
    values: [
      ['Creativity', 'We think beyond the ordinary.'],
      ['Discovery', 'We love making things that surprise.'],
      ['Personalisation', 'A little detail can make it truly yours.'],
      ['Thoughtfulness', 'A gift should carry meaning.'],
      ['Quality', 'Every custom piece deserves care.'],
    ],
    whatWeMake: 'Thoughtful gifts, playful objects and original 3D creations.',
    whyWeMake: 'We turn ideas into discoveries, and ordinary moments into something personal.',
    howWeMake: 'Creativity, design, 3D printing and personalisation come together in every discovery.',
    brandFeeling: '“I discovered something special.”',
    aboutValues: 'What we believe',
    collectionFor: (name: string) => `Explore ${name}`,
    categoryFilter: 'Categories',
    results: 'Showing',
    menuClose: 'Close navigation menu',
    languageLabel: 'Language',
    pageTitle: 'The Discovery Box — Gifts with a little more meaning',
    pageDescription: 'Thoughtful gifts, made personal. Explore The Discovery Box and create a gift that feels just right.',
    popularTitle: 'Made for moments that matter',
    productsBody: 'Browse our active catalogue. Availability and final details are confirmed with our team.',
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
    imageNumber: (current: number, total: number) => `Image ${current} of ${total}`,
    previousImage: 'Show previous product image',
    nextImage: 'Show next product image',
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
    instagramTitle: 'Follow the little discoveries.',
    instagramBody: 'Scan the code to find us on Instagram, share your Discovery Moment and tag @the_discoverybox.',
    instagramScan: 'Scan to follow',
    instagramQrAlt: 'Instagram QR code for @the_discoverybox',
    contactOptions: 'Contact options are being confirmed. You can still send an enquiry using the gift builder.',
    privacyTitle: 'Privacy notice',
    privacyBody: 'We use the contact details and gift brief you submit only to respond to your enquiry. Your contact details are sent to our enquiry email provider and are not sent to the image-generation provider. If you choose to request an illustrative image, only your gift preferences and selected public product names are sent to the AI provider. This site stores your language choice in your browser. Please do not include sensitive personal information in the gift brief.',
    termsTitle: 'Important information',
    termsBody: 'Product availability, contents, personalization, prices and delivery details are confirmed by The Discovery Box. Gift-builder selections and generated images are suggestions only and do not create an order or a binding offer. No online payment or order reservation is available on this website.',
    occasions: ['Birthday', 'Anniversary', 'Thank you', 'New baby', 'Celebration', 'Corporate event', 'Something else'],
    recipients: ['Friend', 'Partner', 'Child', 'Family member', 'Colleague', 'Client', 'Someone else'],
    notFound: 'We couldn’t find that page.',
    businessCollections: 'Ideas for your brand, team and next big moment.',
  },
  pt: {
    navShop: 'Loja',
    navBuilder: 'Criar presente',
    navCorporate: 'Presentes empresariais',
    navAbout: 'A nossa história',
    navContact: 'Contacto',
    themeLight: 'Mudar para o modo claro',
    themeDark: 'Mudar para o modo escuro',
    menu: 'Abrir menu de navegação',
    possibleWorlds: 'Um mundo de possibilidades',
    chosenWithCare: 'Escolhido com carinho',
    madeForYou: <>feito<br />para si</>,
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
    collectionBrowse: 'Explore as coleções',
    categoryLabel: 'Explore por categoria',
    collectionLabel: 'Coleções',
    categoryPlay: 'Brinquedos e Figuras Criativas',
    categoryHome: 'Objetos Criativos e Funcionais',
    categoryBusiness: 'Presentes Corporativos e Personalizados',
    itemsCount: (count: number) => `${count} ${count === 1 ? 'descoberta' : 'descobertas'}`,
    momentEyebrow: 'Um pequeno ritual, uma memória para guardar',
    momentTitle: 'O Seu Momento Discovery',
    momentBody: 'A melhor parte é ver o que alguém descobre lá dentro.',
    momentSteps: [
      ['ABRA', 'Abra a sua Discovery Box e deixe a surpresa começar.'],
      ['FOTOGRAFE', 'Guarde o sorriso, o detalhe ou a descoberta favorita.'],
      ['PARTILHE', 'Partilhe o momento com as pessoas de quem gosta.'],
      ['IDENTIFIQUE', 'Identifique @the_discoverybox para celebrarmos consigo.'],
      ['CONTE-NOS', 'Adoramos saber o que descobriu.'],
    ],
    valuesTitle: 'Criado com curiosidade. Partilhado com carinho.',
    values: [
      ['Criatividade', 'Pensamos para além do convencional.'],
      ['Descoberta', 'Gostamos de criar coisas que surpreendem.'],
      ['Personalização', 'Um pequeno detalhe pode torná-lo verdadeiramente seu.'],
      ['Dedicação', 'Um presente deve ter significado.'],
      ['Qualidade', 'Cada peça personalizada merece cuidado.'],
    ],
    whatWeMake: 'Presentes especiais, objetos divertidos e criações 3D originais.',
    whyWeMake: 'Transformamos ideias em descobertas e momentos comuns em algo pessoal.',
    howWeMake: 'Criatividade, design, impressão 3D e personalização em cada descoberta.',
    brandFeeling: '“Descobri algo especial.”',
    aboutValues: 'No que acreditamos',
    collectionFor: (name: string) => `Explore ${name}`,
    categoryFilter: 'Categorias',
    results: 'A mostrar',
    menuClose: 'Fechar menu de navegação',
    languageLabel: 'Idioma',
    pageTitle: 'The Discovery Box — Presentes com significado',
    pageDescription: 'Presentes especiais e criações personalizadas. Descubra a The Discovery Box e crie um presente único.',
    popularTitle: 'Feito para momentos especiais',
    productsBody: 'Explore o nosso catálogo ativo. A disponibilidade e os detalhes finais são confirmados pela nossa equipa.',
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
    imageNumber: (current: number, total: number) => `Imagem ${current} de ${total}`,
    previousImage: 'Mostrar imagem anterior do produto',
    nextImage: 'Mostrar imagem seguinte do produto',
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
    instagramTitle: 'Acompanhe pequenas descobertas.',
    instagramBody: 'Leia o código para nos encontrar no Instagram, partilhe o seu momento Discovery e identifique @the_discoverybox.',
    instagramScan: 'Leia para seguir',
    instagramQrAlt: 'Código QR do Instagram para @the_discoverybox',
    contactOptions: 'Os contactos estão a ser confirmados. Ainda pode enviar um pedido através do criador de presentes.',
    privacyTitle: 'Aviso de privacidade',
    privacyBody: 'Utilizamos os contactos e a descrição enviados apenas para responder ao seu pedido. Os seus contactos são enviados ao nosso serviço de email e não são enviados ao serviço de criação de imagens. Se pedir uma imagem ilustrativa, apenas as preferências e os nomes dos produtos públicos selecionados são enviados ao fornecedor de IA. Este site guarda a sua preferência de idioma no navegador. Não inclua informações pessoais sensíveis na descrição.',
    termsTitle: 'Informações importantes',
    termsBody: 'A disponibilidade, os conteúdos, a personalização, os preços e a entrega são confirmados pela The Discovery Box. As seleções e imagens geradas são apenas sugestões e não constituem uma encomenda ou oferta vinculativa. Este website não permite pagamentos nem reserva de encomendas.',
    occasions: ['Aniversário', 'Aniversário de relacionamento', 'Agradecimento', 'Nascimento', 'Celebração', 'Evento empresarial', 'Outra ocasião'],
    recipients: ['Amigo/a', 'Companheiro/a', 'Criança', 'Familiar', 'Colega', 'Cliente', 'Outra pessoa'],
    notFound: 'Não encontrámos esta página.',
    businessCollections: 'Ideias para a sua marca, equipa e próxima celebração.',
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

function readThemePreference(): Theme {
  try {
    return window.localStorage.getItem('discovery-theme') === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.warn('Could not read the saved theme preference', error);
    return 'light';
  }
}

function App() {
  const [language, setLanguage] = useState<Language>(readLanguagePreference);
  const [theme, setTheme] = useState<Theme>(readThemePreference);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(() => `${window.location.pathname}${window.location.search}${window.location.hash}`);
  const [catalog, setCatalog] = useState<CatalogResponse>({ items: [], collections: [] });
  const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [contact, setContact] = useState<{ email: string; whatsapp: string }>({ email: '', whatsapp: '' });
  const t = copy[language];
  const currentLocation = new URL(currentUrl, window.location.origin);
  const path = currentLocation.pathname.replace(/\/+$/, '') || '/';

  useEffect(() => {
    const syncLocation = () => {
      setCurrentUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`);
      setMobileMenuOpen(false);
    };
    window.addEventListener('popstate', syncLocation);
    return () => window.removeEventListener('popstate', syncLocation);
  }, []);

  const handleInternalNavigation = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest('a[href]');
    if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;

    const destination = new URL(anchor.href);
    if (destination.origin !== window.location.origin) return;

    event.preventDefault();
    const nextUrl = `${destination.pathname}${destination.search}${destination.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.pushState(null, '', nextUrl);
      setCurrentUrl(nextUrl);
    }
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem('discovery-language', language);
    } catch (error) {
      console.warn('Could not save the language preference', error);
    }
    document.documentElement.lang = language;
    document.title = t.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', t.pageDescription);
  }, [language, t.pageDescription, t.pageTitle]);

  useEffect(() => {
    try {
      window.localStorage.setItem('discovery-theme', theme);
    } catch (error) {
      console.warn('Could not save the theme preference', error);
    }
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'dark' ? '#101820' : '#fff9f4',
    );
  }, [theme]);

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
  const [selectedProductImages, setSelectedProductImages] = useState<Record<string, number>>({});
  const productImage = (item: CatalogItem) => item.images?.[item.primary_image_index] || item.images?.[0] || '';
  const imageStyle = (item: CatalogItem, index: number): CSSProperties => {
    const crop = item.image_crops?.[index];
    return { objectPosition: `${crop?.x ?? 50}% ${crop?.y ?? 50}%` };
  };
  const productImageStyle = (item: CatalogItem) => imageStyle(item, item.primary_image_index);
  const collectionForItem = (item: CatalogItem) => catalog.collections.find((collection) =>
    collection.family === item.family &&
    [collection.id, collection.name_en, collection.name_pt].includes(item.collection),
  );
  const collectionNameFor = (collection: Collection) => language === 'en' ? collection.name_en : collection.name_pt;
  const categoryNameFor = (category: string) => ({
    'Brinquedos e Figuras Criativas': t.categoryPlay,
    'Toys & Creative Figures': t.categoryPlay,
    'Objetos Criativos e Funcionais': t.categoryHome,
    'Creative & Functional Objects': t.categoryHome,
    'Presentes Corporativos e Personalizados': t.categoryBusiness,
    'Corporate & Personalized Gifts': t.categoryBusiness,
  }[category] || category);
  const worlds = (['PLAY', 'HOME', 'BUSINESS'] as const).map((family) => {
    const featuredItem = catalog.items.find((item) => item.family === family && productImage(item));
    return { family, featuredItem };
  });
  const selectProductImage = (item: CatalogItem, index: number) => setSelectedProductImages((current) => ({
    ...current,
    [item.id]: index,
  }));
  const nameFor = (item: CatalogItem) => language === 'en' ? item.name_en : item.name_pt;
  const descriptionFor = (item: CatalogItem) => language === 'en' ? item.description_en : item.description_pt;

  const renderCards = (items: CatalogItem[]) => (
    <div className="product-grid">
      {items.map((item) => (
        <article className="product-card" key={item.id}>
          <a className="product-image" href={`/product/${encodeURIComponent(item.id)}`} aria-label={nameFor(item)}>
            {productImage(item) ? <img src={productImage(item)} alt={nameFor(item)} style={productImageStyle(item)} loading="lazy" /> : <span className="image-placeholder">✦</span>}
            <span className="family-chip">{familyName(item.family, language)}</span>
            <span className="product-image-mark" aria-hidden="true">↗</span>
          </a>
          <div className="product-copy">
            <span className="product-code">{item.id}</span>
            <div className="product-taxonomy">
              {collectionForItem(item) && <a href={`/shop?collection=${encodeURIComponent(collectionForItem(item)!.id)}`}>{collectionNameFor(collectionForItem(item)!)}</a>}
              {item.category && <span>{categoryNameFor(item.category)}</span>}
            </div>
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
            <span className="hero-note">{t.madeForYou}</span>
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
          <div className="intro-pills"><span>{t.play}</span><span>{t.home}</span><span>{t.business}</span></div>
        </section>
        <section className="section section-tint">
          <div className="section-heading section-heading-row">
            <div><span className="eyebrow eyebrow-coral">{t.possibleWorlds}</span><h2>{t.collectionTitle}</h2><p>{t.collectionBody}</p></div>
            <a className="text-link" href="/shop">{t.browse} <span aria-hidden="true">↗</span></a>
          </div>
          {catalogNotice}
          {catalogState === 'ready' && (
            <div className="collection-grid">
              {worlds.map(({ family, featuredItem }, index) => {
                const giftCount = catalog.items.filter((item) => item.family === family).length;
                const countLabel = language === 'en'
                  ? giftCount === 1 ? 'active gift to explore' : 'active gifts to explore'
                  : giftCount === 1 ? 'presente ativo para explorar' : 'presentes ativos para explorar';
                return (
                  <a className={`collection-card collection-${index}`} href={`/shop?family=${family}`} key={family}>
                    {featuredItem && (
                      <>
                        <img className="collection-image-backdrop" src={productImage(featuredItem)} alt="" aria-hidden="true" style={productImageStyle(featuredItem)} loading="lazy" />
                        <img className="collection-image-main" src={productImage(featuredItem)} alt="" aria-hidden="true" style={productImageStyle(featuredItem)} loading="lazy" />
                      </>
                    )}
                    <span className="collection-overlay" />
                    <span className="collection-copy">
                      <small>{language === 'en' ? 'DISCOVER OUR WORLD' : 'DESCUBRA O NOSSO MUNDO'}</small>
                      <strong>{familyName(family, language)}</strong>
                      <span>{giftCount} {countLabel}</span>
                    </span>
                    <span className="collection-arrow" aria-hidden="true">↗</span>
                  </a>
                );
              })}
            </div>
          )}
        </section>
        <section className="section discovery-moment">
          <div className="section-heading">
            <span className="eyebrow eyebrow-coral">{t.momentEyebrow}</span>
            <h2>{t.momentTitle}</h2>
            <p>{t.momentBody}</p>
          </div>
          <div className="moment-grid">
            {t.momentSteps.map(([title, description], index) => (
              <article className="moment-step" key={title}>
                <span className="moment-number">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="builder-banner">
          <div className="builder-star" aria-hidden="true">✦</div>
          <div><span className="eyebrow">{t.builderEyebrow}</span><h2>{t.builderTitle}</h2></div>
          <a className="button button-dark" href="/gift-builder">{t.create}<span aria-hidden="true">↗</span></a>
        </section>
      </>
    );
  } else if (path === '/shop' || path.startsWith('/shop/')) {
    const familyParam = currentLocation.searchParams.get('family');
    const collectionParam = currentLocation.searchParams.get('collection');
    const categoryParam = currentLocation.searchParams.get('category');
    const selectedCollection = catalog.collections.find((item) => item.id === collectionParam);
    const family = familyParam === 'PLAY' || familyParam === 'HOME' || familyParam === 'BUSINESS'
      ? familyParam
      : selectedCollection?.family || 'ALL';
    const familyItems = family === 'ALL'
      ? catalog.items
      : catalog.items.filter((item) => item.family === family);
    const collectionItems = selectedCollection
      ? familyItems.filter((item) => collectionForItem(item)?.id === selectedCollection.id)
      : familyItems;
    const visible = categoryParam
      ? collectionItems.filter((item) => item.category === categoryParam)
      : collectionItems;
    const availableCategories = [...new Set(familyItems.map((item) => item.category).filter((category): category is string => Boolean(category)))];
    const availableCollections = catalog.collections.filter((collection) =>
      (family === 'ALL' || collection.family === family) &&
      familyItems.some((item) => collectionForItem(item)?.id === collection.id),
    );
    const pageTitle = selectedCollection
      ? collectionNameFor(selectedCollection)
      : categoryParam && family !== 'ALL'
        ? categoryNameFor(categoryParam)
        : family === 'ALL'
          ? t.shop
          : familyName(family, language);
    page = (
      <section className="section page-section shop-layout">
        <div className="shop-main">
          <div className="shop-intro">
            <div className="page-heading">
              <span className="eyebrow eyebrow-coral">{t.navShop}</span>
              <h1>{pageTitle}</h1>
              <p>{selectedCollection ? (language === 'en' ? selectedCollection.tagline_en : selectedCollection.tagline_pt) || t.productsBody : t.productsBody}</p>
              {catalogState === 'ready' && <span className="results-count">{t.results} {visible.length} {t.itemsCount(visible.length)}</span>}
            </div>
            {availableCategories.length > 0 && (
              <div className="taxonomy-filter-group shop-category-filter">
                <span className="taxonomy-filter-label">{t.categoryLabel}</span>
                <div className="filter-row taxonomy-filter-row">
                  {availableCategories.map((category) => {
                    const categoryName = categoryNameFor(category);
                    return (
                      <a
                        className={`filter-chip${categoryParam === category ? ' filter-active' : ''}`}
                        href={categoryParam === category
                          ? (family === 'ALL' ? '/shop' : `/shop?family=${family}${selectedCollection ? `&collection=${encodeURIComponent(selectedCollection.id)}` : ''}`)
                          : `/shop?${family === 'ALL' ? '' : `family=${family}&`}${selectedCollection ? `collection=${encodeURIComponent(selectedCollection.id)}&` : ''}category=${encodeURIComponent(category)}`}
                        key={category}
                      >
                        {categoryName}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <aside className="shop-sidebar">
            <nav className="shop-side-navigation" aria-label={t.navShop}>
              <a className={`shop-side-link${family === 'ALL' && !selectedCollection && !categoryParam ? ' shop-side-active' : ''}`} href="/shop">
                {t.all}
              </a>
              {(['PLAY', 'HOME', 'BUSINESS'] as const).map((world) => (
                <div className="shop-side-world" key={world}>
                  <a
                    className={`shop-side-link${family === world ? ' shop-side-active' : ''}`}
                    href={`/shop?family=${world}`}
                    aria-current={family === world ? 'page' : undefined}
                  >
                    {familyName(world, language)}
                    <span aria-hidden="true">›</span>
                  </a>
                  {family === world && availableCollections.length > 0 && (
                    <div className="shop-side-collections">
                      <span className="taxonomy-filter-label">{t.collectionLabel}</span>
                      {availableCollections.map((collection) => (
                        <a
                          className={`shop-side-collection${selectedCollection?.id === collection.id ? ' shop-side-collection-active' : ''}`}
                          href={`/shop?family=${world}&collection=${encodeURIComponent(collection.id)}`}
                          key={collection.id}
                          aria-current={selectedCollection?.id === collection.id ? 'page' : undefined}
                        >
                          {collectionNameFor(collection)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </aside>
          <div className="shop-results">
            {catalogNotice}
            {catalogState === 'ready' && (visible.length ? renderCards(visible) : <p className="notice">{t.empty}</p>)}
          </div>
        </div>
      </section>
    );
  } else if (path.startsWith('/product/')) {
    const productImages = selectedItem?.images?.filter(Boolean) || [];
    const primaryIndex = selectedItem
      ? Math.max(0, Math.min(selectedItem.primary_image_index || 0, productImages.length - 1))
      : 0;
    const activeImageIndex = productImages.length
      ? (selectedProductImages[selectedItemId] ?? primaryIndex)
      : 0;
    const activeImage = productImages[activeImageIndex];
    const activeImageStyle = selectedItem ? imageStyle(selectedItem, activeImageIndex) : undefined;
    page = selectedItem ? (
      <section className="section product-detail page-section">
        <a className="text-link back-link" href="/shop">← {t.backShop}</a>
        <div className="detail-grid">
          <div className="detail-gallery">
            <div className="detail-image">
              {activeImage
                ? <img src={activeImage} alt={`${nameFor(selectedItem)} — ${t.imageNumber(activeImageIndex + 1, productImages.length)}`} style={activeImageStyle} />
                : <span className="image-placeholder">✦</span>}
              {productImages.length > 1 && (
                <span className="gallery-count" aria-live="polite">{t.imageNumber(activeImageIndex + 1, productImages.length)}</span>
              )}
            </div>
            {productImages.length > 1 && (
              <div className="detail-thumbnails" role="group" aria-label={nameFor(selectedItem)}>
                {productImages.map((image, index) => (
                  <button
                    className={`detail-thumbnail${index === activeImageIndex ? ' thumbnail-active' : ''}`}
                    type="button"
                    key={`${selectedItem.id}-${image}`}
                    aria-label={t.imageNumber(index + 1, productImages.length)}
                    aria-pressed={index === activeImageIndex}
                    onClick={() => selectProductImage(selectedItem, index)}
                  >
                    <img src={image} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            {productImages.length > 1 && (
              <div className="gallery-controls">
                <button type="button" className="gallery-arrow" aria-label={t.previousImage} onClick={() => selectProductImage(selectedItem, (activeImageIndex - 1 + productImages.length) % productImages.length)}>←</button>
                <button type="button" className="gallery-arrow" aria-label={t.nextImage} onClick={() => selectProductImage(selectedItem, (activeImageIndex + 1) % productImages.length)}>→</button>
              </div>
            )}
          </div>
          <div className="detail-copy">
            <span className="eyebrow eyebrow-coral">{familyName(selectedItem.family, language)} · {selectedItem.id}</span>
            <div className="detail-taxonomy">
              {collectionForItem(selectedItem) && <a href={`/shop?collection=${encodeURIComponent(collectionForItem(selectedItem)!.id)}`}>{collectionNameFor(collectionForItem(selectedItem)!)}</a>}
              {selectedItem.category && <a href={`/shop?family=${selectedItem.family}&category=${encodeURIComponent(selectedItem.category)}`}>{categoryNameFor(selectedItem.category)}</a>}
            </div>
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
    page = <GiftBuilder catalog={catalog} catalogState={catalogState} language={language} t={t} nameFor={nameFor} descriptionFor={descriptionFor} productImage={productImage} productImageStyle={productImageStyle} initialProduct={currentLocation.searchParams.get('product') || ''} />;
  } else if (path === '/corporate') {
    const businessCollections = catalog.collections.filter((collection) => collection.family === 'BUSINESS');
    page = (
      <section className="section content-page editorial-page">
        <span className="eyebrow eyebrow-coral">{t.navCorporate}</span>
        <h1>{t.corporateTitle}</h1>
        <p>{t.corporateBody}</p>
        <p>{t.businessCollections}</p>
        {businessCollections.length > 0 && <div className="editorial-collections">{businessCollections.map((collection) => (
          <a className="editorial-collection" href={`/shop?collection=${encodeURIComponent(collection.id)}`} key={collection.id}>
            <span>{collectionNameFor(collection)}</span>
            <strong>{language === 'en' ? collection.tagline_en : collection.tagline_pt}</strong>
            <span aria-hidden="true">↗</span>
          </a>
        ))}</div>}
        <a className="button button-primary" href="/gift-builder">{t.create}<span aria-hidden="true">↗</span></a>
      </section>
    );
  } else if (path === '/about') {
    page = (
      <section className="section content-page about-page">
        <div className="about-lead">
          <span className="eyebrow eyebrow-coral">THE DISCOVERY BOX</span>
          <h1>{t.aboutTitle}</h1>
          <p>{t.aboutBody}</p>
          <strong className="brand-feeling">{t.brandFeeling}</strong>
          <a className="button button-primary" href="/shop">{t.browse}<span aria-hidden="true">↗</span></a>
        </div>
        <div className="about-story">
          <article><span>01 / {language === 'en' ? 'WHAT WE MAKE' : 'O QUE CRIAMOS'}</span><p>{t.whatWeMake}</p></article>
          <article><span>02 / {language === 'en' ? 'WHY WE MAKE IT' : 'PORQUE CRIAMOS'}</span><p>{t.whyWeMake}</p></article>
          <article><span>03 / {language === 'en' ? 'HOW WE DO IT' : 'COMO FAZEMOS'}</span><p>{t.howWeMake}</p></article>
        </div>
        <div className="values-section">
          <span className="eyebrow eyebrow-coral">{t.aboutValues}</span>
          <h2>{t.valuesTitle}</h2>
          <div className="values-grid">{t.values.map(([name, description], index) => (
            <article className="value-card" key={name}><span>0{index + 1}</span><h3>{name}</h3><p>{description}</p></article>
          ))}</div>
        </div>
      </section>
    );
  } else if (path === '/contact') {
    page = (
      <section className="section content-page contact-page">
        <div className="contact-intro">
          <span className="eyebrow eyebrow-coral">{t.navContact}</span>
          <h1>{t.contactTitle}</h1>
          <p>{t.contactBody}</p>
          <div className="contact-links">
            {contact.email && <a className="button button-outline" href={`mailto:${contact.email}`}>{contact.email}</a>}
            {contact.whatsapp && <a className="button button-primary" href={contact.whatsapp} target="_blank" rel="noreferrer">WhatsApp ↗</a>}
          </div>
          {!contact.email && !contact.whatsapp && <p className="notice">{t.contactOptions}</p>}
        </div>
        <aside className="instagram-card" aria-labelledby="instagram-title">
          <div className="instagram-copy">
            <span className="instagram-kicker"><span aria-hidden="true">◎</span> INSTAGRAM</span>
            <h2 id="instagram-title">{t.instagramTitle}</h2>
            <p>{t.instagramBody}</p>
            <a className="instagram-handle" href="https://www.instagram.com/the_discoverybox/" target="_blank" rel="noreferrer">
              @the_discoverybox <span aria-hidden="true">↗</span>
            </a>
          </div>
          <a className="instagram-qr" href="https://www.instagram.com/the_discoverybox/" target="_blank" rel="noreferrer" aria-label={`${t.instagramScan}: @the_discoverybox`}>
            <img src="/instagram-qr.png" alt={t.instagramQrAlt} />
            <span>{t.instagramScan}</span>
          </a>
          <span className="instagram-spark instagram-spark-one" aria-hidden="true">✦</span>
          <span className="instagram-spark instagram-spark-two" aria-hidden="true">✧</span>
        </aside>
      </section>
    );
  } else if (path === '/privacy') {
    page = <section className="section content-page"><span className="eyebrow eyebrow-coral">{t.privacy}</span><h1>{t.privacyTitle}</h1><p>{t.privacyBody}</p><p className="muted">{t.contactOptions}</p></section>;
  } else if (path === '/terms') {
    page = <section className="section content-page"><span className="eyebrow eyebrow-coral">{t.terms}</span><h1>{t.termsTitle}</h1><p>{t.termsBody}</p></section>;
  } else {
    page = <section className="section page-section"><p className="notice">{t.notFound}</p><a href="/">{t.browse}</a></section>;
  }

  return (
    <div className="site-shell" onClick={handleInternalNavigation}>
      <header className="site-header">
        <a className="brand" href="/" aria-label="The Discovery Box home"><img src="/official-logo.png" alt="The Discovery Box" /></a>
        <nav className={`main-nav${mobileMenuOpen ? ' nav-open' : ''}`} aria-label={language === 'en' ? 'Main navigation' : 'Navegação principal'}>
          <a href="/shop" onClick={() => setMobileMenuOpen(false)}>{t.navShop}</a><a href="/gift-builder" onClick={() => setMobileMenuOpen(false)}>{t.navBuilder}</a><a href="/corporate" onClick={() => setMobileMenuOpen(false)}>{t.navCorporate}</a><a href="/about" onClick={() => setMobileMenuOpen(false)}>{t.navAbout}</a><a href="/contact" onClick={() => setMobileMenuOpen(false)}>{t.navContact}</a>
        </nav>
        <div className="header-actions">
          <button
            className="menu-toggle"
            type="button"
            aria-label={mobileMenuOpen ? t.menuClose : t.menu}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>
          <div className="language-switch" aria-label={t.languageLabel}>
            <button type="button" onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>EN</button>
            <span>/</span>
            <button type="button" onClick={() => setLanguage('pt')} aria-pressed={language === 'pt'}>PT</button>
          </div>
          <button
            className="theme-toggle"
            type="button"
            aria-label={theme === 'dark' ? t.themeLight : t.themeDark}
            title={theme === 'dark' ? t.themeLight : t.themeDark}
            onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☼' : '☾'}</span>
          </button>
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
  catalog, catalogState, language, t, nameFor, descriptionFor, productImage, productImageStyle, initialProduct,
}: {
  catalog: CatalogResponse;
  catalogState: 'loading' | 'ready' | 'error';
  language: Language;
  t: typeof copy[Language];
  nameFor: (item: CatalogItem) => string;
  descriptionFor: (item: CatalogItem) => string;
  productImage: (item: CatalogItem) => string;
  productImageStyle: (item: CatalogItem) => CSSProperties;
  initialProduct: string;
}) {
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
