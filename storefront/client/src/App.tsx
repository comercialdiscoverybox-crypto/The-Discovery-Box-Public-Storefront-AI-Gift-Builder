import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react';
import AssistantWidget from './AssistantWidget';
import type { AssistantGiftDraft } from './assistantTypes';

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
type GiftRecommendation = {
  productId: string;
  matchScore: number;
  reason: string;
};

const copy = {
  en: {
    navHome: 'Home',
    navShop: 'Shop',
    navCollections: 'Collections',
    navBuilder: 'Gift builder',
    navIdeas: 'AI ideas',
    navCorporate: 'Corporate gifts',
    navAbout: 'About',
    navContact: 'Contact',
    searchGifts: 'Explore gifts',
    giftBuilder: 'Open the gift builder',
    themeLight: 'Switch to light mode',
    themeDark: 'Switch to dark mode',
    menu: 'Open navigation menu',
    browseCategories: 'Browse categories',
    pagePrevious: 'Previous',
    pageNext: 'Next',
    paginationLabel: 'Product pages',
    pageStatus: (current: number, total: number) => `Page ${current} of ${total}`,
    possibleWorlds: 'A world of possibilities',
    chosenWithCare: 'Chosen with care',
    madeForYou: <>made<br />for you</>,
    heroEyebrow: 'Personalized gifts for every moment',
    heroTitle: <>More than gifts,<br />it’s a <span className="hero-title-highlight"><span>d</span><span>i</span><span>s</span><span>c</span><span>o</span><span>v</span><span>e</span><span>r</span><span>y</span></span><span className="hero-title-period">.</span></>,
    heroBody: 'Explore unique products, create personalized gift ideas and make every moment extra special.',
    heroCta: 'Start building',
    browse: 'Explore the collection',
    create: 'Create a gift',
    trusted: 'Thoughtful by nature. Personal by design.',
    introTitle: 'Find the feeling. We’ll find the gift.',
    introBody: 'From a small thank-you to a big celebration, explore ideas selected with care.',
    collectionTitle: 'Explore our worlds',
    collectionBody: 'A little something for play, home and the people you work with.',
    collectionBrowse: 'Explore collections',
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
    loadingHint: 'Getting everything ready for you',
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
    occasionDetailsLabel: 'Event name or occasion details (optional)',
    occasionDetailsPlaceholder: 'Add the event name or tell us a little more',
    recipientDetailsLabel: 'Tell us who the gift is for (optional)',
    recipientDetailsPlaceholder: 'Describe the recipient',
    recommendationTitle: 'Suggestions for your gift brief',
    recommendationIntro: 'A little inspiration, made personal',
    noBudgetMatches: 'The AI could not find a suitable match in the current collection. Browse all products or adjust your gift brief.',
    showAllProducts: 'Browse all products',
    showSuggestedProducts: 'Show suggested matches',
    recommendationFallback: 'AI suggestions are temporarily unavailable. Browse all products or try again.',
    recommendationLoading: 'Finding the best matches in our live collection…',
    matchScore: 'Match',
    moreDetails: 'More details',
    closeDetails: 'Close product details',
    whyThisMatches: 'Why it matches',
    addProduct: 'Add to gift',
    productSelected: 'Added to gift',
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
    submitErrorNotConfigured: 'Email delivery is not configured on the server. Please contact us directly.',
    submitErrorProvider: 'Our email service could not accept your enquiry. Please try again later.',
    required: 'Please complete the required fields.',
    privacyConsent: 'I agree that my contact details and gift brief can be used to respond to this enquiry.',
    imageButton: 'Imagine this gift',
    imageLoading: 'Creating an illustrative idea…',
    imageError: 'The concept image is unavailable right now. Your gift idea is still saved in this form.',
    imageLabel: 'Illustrative AI concept',
    disclaimer: 'This image is an illustration, not a photo of the finished gift. Final contents, personalization, price and delivery are confirmed by The Discovery Box.',
    privacy: 'Privacy',
    terms: 'Terms',
    footer: 'Thoughtful gifts, playful objects and original 3D creations made with care in Mozambique to turn everyday moments into personal discoveries.',
    corporateTitle: 'Thoughtful gifting for teams, clients and celebrations.',
    corporateBody: 'From a few meaningful thank-yous to a company-wide celebration, tell us what you have in mind and our team will help shape it.',
    corporateCta: 'Tell us what you have in mind',
    aboutTitle: 'The joy is in the discovery.',
    aboutBody: 'The Discovery Box brings together thoughtful finds and personal touches to make the people in your life feel truly seen.',
    contactTitle: 'We’d love to hear what you’re celebrating.',
    contactBody: 'Tell us a little about the moment and our team will get back to you.',
    instagramTitle: 'Follow the little discoveries.',
    instagramBody: 'Scan the code to find us on Instagram, share your Discovery Moment and tag @the_discoverybox.',
    instagramScan: 'Scan to follow',
    instagramQrAlt: 'Instagram QR code for @the_discoverybox',
    contactOptions: 'Contact options are being confirmed. You can still send an enquiry using the gift builder.',
    contactEmail: 'Email us',
    privacyTitle: 'Privacy notice',
    privacyBody: 'We use the contact details and gift brief you submit only to respond to your enquiry. Chat messages are sent to Ollama to generate replies. When you continue from the gift brief to product selection, your occasion, recipient, budget and preferences are also sent to Ollama to match against the catalogue. Do not include sensitive personal information in free-text fields. Your contact details are sent to our enquiry email provider and are not sent to the recommendation or image-generation providers. If you request an illustrative image, your occasion, recipient, budget, preferences and selected public product names are sent to Google Gemini to create it. This site stores your language choice in your browser.',
    termsTitle: 'Important information',
    termsBody: 'Product availability, contents, personalization, prices and delivery details are confirmed by The Discovery Box. Gift-builder selections and generated images are suggestions only and do not create an order or a binding offer. No online payment or order reservation is available on this website.',
    occasions: ['Birthday', 'Anniversary', 'Thank you', 'New baby', 'Celebration', 'Corporate event', 'Something else'],
    recipients: ['Friend', 'Partner', 'Child', 'Family member', 'Colleague', 'Client', 'Someone else'],
    corporateRecipients: ['Employees or team', 'Clients', 'Business partners', 'Event attendees', 'VIP guests', 'Suppliers', 'Something else'],
    notFound: 'We couldn’t find that page.',
  },
  pt: {
    navHome: 'Início',
    navShop: 'Loja',
    navCollections: 'Coleções',
    navBuilder: 'Criador de presentes',
    navIdeas: 'Ideias com IA',
    navCorporate: 'Presentes empresariais',
    navAbout: 'Sobre nós',
    navContact: 'Contacto',
    searchGifts: 'Explorar presentes',
    giftBuilder: 'Abrir criador de presentes',
    themeLight: 'Mudar para o modo claro',
    themeDark: 'Mudar para o modo escuro',
    menu: 'Abrir menu de navegação',
    browseCategories: 'Explorar categorias',
    pagePrevious: 'Anterior',
    pageNext: 'Seguinte',
    paginationLabel: 'Páginas de produtos',
    pageStatus: (current: number, total: number) => `Página ${current} de ${total}`,
    possibleWorlds: 'Um mundo de possibilidades',
    chosenWithCare: 'Escolhido com carinho',
    madeForYou: <>feito<br />para si</>,
    heroEyebrow: 'Presentes personalizados para cada momento',
    heroTitle: <>Mais do que presentes,<br />uma&nbsp;<span className="hero-title-highlight"><span>d</span><span>e</span><span>s</span><span>c</span><span>o</span><span>b</span><span>e</span><span>r</span><span>t</span><span>a</span></span><span className="hero-title-period">.</span></>,
    heroBody: 'Descubra produtos únicos, crie ideias de presentes personalizados e torne cada momento ainda mais especial.',
    heroCta: 'Começar a criar',
    browse: 'Explorar a coleção',
    create: 'Criar um presente',
    trusted: 'Pensado com carinho. Feito à sua medida.',
    introTitle: 'Encontre o sentimento. Nós encontramos o presente.',
    introBody: 'De um pequeno agradecimento a uma grande celebração, descubra ideias escolhidas com cuidado.',
    collectionTitle: 'Explore os nossos mundos',
    collectionBody: 'Ideias para brincar, para a casa e para as pessoas com quem trabalha.',
    collectionBrowse: 'Explore as coleções',
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
    loadingHint: 'A preparar tudo para si',
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
    occasionDetailsLabel: 'Nome do evento ou detalhes da ocasião (opcional)',
    occasionDetailsPlaceholder: 'Indique o nome do evento ou conte-nos um pouco mais',
    recipientDetailsLabel: 'Diga-nos para quem é o presente (opcional)',
    recipientDetailsPlaceholder: 'Descreva o destinatário',
    recommendationTitle: 'Sugestões para a sua ideia de presente',
    recommendationIntro: 'Uma inspiração feita à sua medida',
    noBudgetMatches: 'A IA não encontrou opções adequadas na coleção atual. Explore todos os produtos ou ajuste os detalhes do presente.',
    showAllProducts: 'Ver todos os produtos',
    showSuggestedProducts: 'Ver sugestões',
    recommendationFallback: 'As sugestões de IA estão temporariamente indisponíveis. Explore todos os produtos ou tente novamente.',
    recommendationLoading: 'A encontrar as melhores opções na coleção atual…',
    matchScore: 'Correspondência',
    moreDetails: 'Mais detalhes',
    closeDetails: 'Fechar detalhes do produto',
    whyThisMatches: 'Porque combina',
    addProduct: 'Adicionar ao presente',
    productSelected: 'Adicionado ao presente',
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
    submitErrorNotConfigured: 'O envio de emails não está configurado no servidor. Contacte-nos directamente.',
    submitErrorProvider: 'O serviço de email não conseguiu aceitar o seu pedido. Tente novamente mais tarde.',
    required: 'Preencha os campos obrigatórios.',
    privacyConsent: 'Autorizo a utilização dos meus contactos e da descrição do presente para responder a este pedido.',
    imageButton: 'Imaginar este presente',
    imageLoading: 'A criar uma ideia ilustrativa…',
    imageError: 'A imagem não está disponível. A sua ideia continua neste formulário.',
    imageLabel: 'Conceito ilustrativo com IA',
    disclaimer: 'Esta imagem é uma ilustração, não uma fotografia do presente final. Os conteúdos, a personalização, o preço e a entrega são confirmados pela The Discovery Box.',
    privacy: 'Privacidade',
    terms: 'Termos',
    footer: 'Presentes especiais, objetos divertidos e criações 3D originais, feitos com carinho em Moçambique para transformar momentos comuns em descobertas pessoais.',
    corporateTitle: 'Presentes especiais para equipas, clientes e celebrações.',
    corporateBody: 'De alguns agradecimentos a uma celebração para toda a empresa, conte-nos a sua ideia e a nossa equipa ajudará a desenvolvê-la.',
    corporateCta: 'Conte-nos a sua ideia',
    aboutTitle: 'A alegria está na descoberta.',
    aboutBody: 'A Discovery Box reúne descobertas especiais e toques pessoais para que as pessoas importantes se sintam verdadeiramente valorizadas.',
    contactTitle: 'Conte-nos o que vamos celebrar.',
    contactBody: 'Diga-nos um pouco sobre a ocasião e a nossa equipa entrará em contacto.',
    instagramTitle: 'Acompanhe pequenas descobertas.',
    instagramBody: 'Leia o código para nos encontrar no Instagram, partilhe o seu momento Discovery e identifique @the_discoverybox.',
    instagramScan: 'Leia para seguir',
    instagramQrAlt: 'Código QR do Instagram para @the_discoverybox',
    contactOptions: 'Os contactos estão a ser confirmados. Ainda pode enviar um pedido através do criador de presentes.',
    contactEmail: 'Envie-nos um email',
    privacyTitle: 'Aviso de privacidade',
    privacyBody: 'Utilizamos os contactos e a descrição enviados apenas para responder ao seu pedido. As mensagens de conversa são enviadas à Ollama para gerar respostas. Quando avança da descrição do presente para a seleção de produtos, a ocasião, o destinatário, o orçamento e as preferências também são enviados à Ollama para encontrar correspondências no catálogo. Não inclua informações pessoais sensíveis nos campos de texto livre. Os seus contactos são enviados ao nosso serviço de email e não são enviados aos serviços de recomendações ou de criação de imagens. Se pedir uma imagem ilustrativa, a ocasião, o destinatário, o orçamento, as preferências e os nomes dos produtos públicos selecionados são enviados à Google Gemini para a criar. Este site guarda a sua preferência de idioma no navegador.',
    termsTitle: 'Informações importantes',
    termsBody: 'A disponibilidade, os conteúdos, a personalização, os preços e a entrega são confirmados pela The Discovery Box. As seleções e imagens geradas são apenas sugestões e não constituem uma encomenda ou oferta vinculativa. Este website não permite pagamentos nem reserva de encomendas.',
    occasions: ['Aniversário', 'Aniversário de relacionamento', 'Agradecimento', 'Nascimento', 'Celebração', 'Evento empresarial', 'Outra ocasião'],
    recipients: ['Amigo/a', 'Companheiro/a', 'Criança', 'Familiar', 'Colega', 'Cliente', 'Outra pessoa'],
    corporateRecipients: ['Colaboradores ou equipa', 'Clientes', 'Parceiros de negócio', 'Participantes no evento', 'Convidados VIP', 'Fornecedores', 'Outra opção'],
    notFound: 'Não encontrámos esta página.',
  },
} as const;

type TextKey = keyof typeof copy.en;

const familyName = (family: CatalogItem['family']) => family;

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
  const [assistantGiftDraft, setAssistantGiftDraft] = useState<AssistantGiftDraft | null>(null);
  const [catalog, setCatalog] = useState<CatalogResponse>({ items: [], collections: [] });
  const [catalogState, setCatalogState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [contact, setContact] = useState<{ email: string; whatsapp: string }>({ email: '', whatsapp: '' });
  const clearAssistantGiftDraft = useCallback(() => setAssistantGiftDraft(null), []);
  const t = copy[language];
  const currentLocation = new URL(currentUrl, window.location.origin);
  const path = currentLocation.pathname.replace(/\/+$/, '') || '/';

  const navigateInternal = (url: string) => {
    const destination = new URL(url, window.location.origin);
    if (destination.origin !== window.location.origin) return;
    const nextUrl = `${destination.pathname}${destination.search}${destination.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.pushState(null, '', nextUrl);
      setCurrentUrl(nextUrl);
    }
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const syncLocation = () => {
      setCurrentUrl(`${window.location.pathname}${window.location.search}${window.location.hash}`);
      setMobileMenuOpen(false);
    };
    window.addEventListener('popstate', syncLocation);
    return () => window.removeEventListener('popstate', syncLocation);
  }, []);

  useLayoutEffect(() => {
    document.getElementById('startup-loader')?.remove();
  }, []);

  const handleInternalNavigation = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest('a[href]');
    if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;

    event.preventDefault();
    navigateInternal(anchor.href);
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

  const refreshCatalog = useCallback(async () => {
    const response = await fetch('/api/catalog', { cache: 'no-store' });
    if (!response.ok) throw new Error('Catalogue refresh failed');
    const nextCatalog = await response.json() as CatalogResponse;
    setCatalog(nextCatalog);
    setCatalogState('ready');
    return nextCatalog;
  }, []);

  useEffect(() => {
    void refreshCatalog().catch(() => setCatalogState('error'));
    fetch('/api/public-config').then((response) => {
      if (!response.ok) throw new Error('Contact configuration request failed');
      return response.json() as Promise<{ email: string; whatsapp: string }>;
    }).then(setContact).catch(() => setContact({ email: '', whatsapp: '' }));
  }, [refreshCatalog]);

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
            <span className="family-chip">{familyName(item.family)}</span>
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
              <a className="button button-primary" href="/gift-builder">{t.heroCta}<span aria-hidden="true">→</span></a>
            </div>
          </div>
          <img className="hero-artwork" src="/discovery-box-adventure.png" alt="" aria-hidden="true" />
          <p className="hero-artwork-message">
            <span>Small</span>
            <span>surprises.</span>
            <span>Big smiles.</span>
            <span className="hero-artwork-heart" aria-hidden="true">♡</span>
          </p>
        </section>
        <div className="trust-strip"><span>✦</span>{t.trusted}<span>✦</span></div>
        <section className="section section-intro">
          <div className="section-heading">
            <span className="eyebrow eyebrow-coral">THE DISCOVERY BOX</span>
            <h2>{t.introTitle}</h2>
            <p>{t.introBody}</p>
          </div>
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
                  <a className={`discovery-card collection-${index}`} href={`/shop?family=${family}`} key={family}>
                    <span className="discovery-card__visual">
                      {featuredItem && (
                        <img className="discovery-card__image" src={productImage(featuredItem)} alt="" aria-hidden="true" style={productImageStyle(featuredItem)} loading="lazy" />
                      )}
                      <span className="collection-overlay" />
                    </span>
                    <span className="discovery-card__content">
                      <small>{language === 'en' ? 'DISCOVER OUR WORLD' : 'DESCUBRA O NOSSO MUNDO'}</small>
                      <strong>{familyName(family)}</strong>
                      <span>{giftCount} {countLabel}</span>
                      <span className="collection-arrow" aria-hidden="true">↗</span>
                    </span>
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
    const productsPerPage = 6;
    const pageCount = Math.max(1, Math.ceil(visible.length / productsPerPage));
    const requestedPage = Number(currentLocation.searchParams.get('page') || 1);
    const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pageCount)
      : 1;
    const pageItems = visible.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
    const shopPageUrl = (page: number) => {
      const params = new URLSearchParams(currentLocation.searchParams);
      if (page === 1) params.delete('page');
      else params.set('page', String(page));
      const query = params.toString();
      return `/shop${query ? `?${query}` : ''}`;
    };
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
          : familyName(family);
    page = (
      <section className="section page-section shop-layout">
        <div className="shop-main">
          <div className="shop-intro">
            <div className="page-heading">
              <span className="eyebrow eyebrow-coral">{t.navShop}</span>
              <h1>{pageTitle}</h1>
              <p>{selectedCollection ? (language === 'en' ? selectedCollection.tagline_en : selectedCollection.tagline_pt) || t.productsBody : t.productsBody}</p>
            </div>
            {availableCategories.length > 0 && (
              <div className="taxonomy-filter-group shop-category-filter">
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
            <details className="shop-sidebar-details">
              <summary>{t.browseCategories}</summary>
              <nav className="shop-side-navigation" aria-label={t.browseCategories}>
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
                      {familyName(world)}
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
            </details>
          </aside>
          <div className="shop-results">
            {catalogNotice}
            {catalogState === 'ready' && (visible.length ? (
              <>
                {renderCards(pageItems)}
                {pageCount > 1 && (
                  <nav className="shop-pagination" aria-label={t.paginationLabel}>
                    {currentPage > 1
                      ? <a href={shopPageUrl(currentPage - 1)}>{t.pagePrevious}</a>
                      : <span className="shop-pagination-disabled" aria-disabled="true">{t.pagePrevious}</span>}
                    <span aria-live="polite">{t.pageStatus(currentPage, pageCount)}</span>
                    {currentPage < pageCount
                      ? <a href={shopPageUrl(currentPage + 1)}>{t.pageNext}</a>
                      : <span className="shop-pagination-disabled" aria-disabled="true">{t.pageNext}</span>}
                  </nav>
                )}
              </>
            ) : <p className="notice">{t.empty}</p>)}
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
            <span className="eyebrow eyebrow-coral">{familyName(selectedItem.family)} · {selectedItem.id}</span>
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
    page = <GiftBuilder catalog={catalog} catalogState={catalogState} language={language} t={t} nameFor={nameFor} descriptionFor={descriptionFor} productImage={productImage} productImageStyle={productImageStyle} imageStyle={imageStyle} initialProduct={currentLocation.searchParams.get('product') || ''} assistantDraft={assistantGiftDraft} onAssistantDraftApplied={clearAssistantGiftDraft} refreshCatalog={refreshCatalog} />;
  } else if (path === '/corporate') {
    const businessCollections = catalog.collections.filter((collection) => collection.family === 'BUSINESS');
    page = (
      <>
        <section className="hero corporate-hero">
          <img
            className="hero-artwork"
            src="/corporate-team-showcase.png"
            alt={language === 'en' ? 'The Discovery Box team showcasing branded corporate gifts' : 'A equipa da The Discovery Box a apresentar presentes empresariais personalizados'}
          />
          <div className="hero-content">
            <span className="eyebrow">{t.navCorporate}</span>
            <h1>{t.corporateTitle}</h1>
            <p>{t.corporateBody}</p>
            <div className="button-row">
              <a className="button button-primary" href="/gift-builder">{t.corporateCta}<span aria-hidden="true">→</span></a>
            </div>
          </div>
        </section>
        <section className="corporate-collections-section">
          {businessCollections.length > 0 && <div className="editorial-collections">{businessCollections.map((collection) => (
            <a className="editorial-collection" href={`/shop?collection=${encodeURIComponent(collection.id)}`} key={collection.id}>
              <span>{collectionNameFor(collection)}</span>
              <strong>{language === 'en' ? collection.tagline_en : collection.tagline_pt}</strong>
              <span aria-hidden="true">↗</span>
            </a>
          ))}</div>}
        </section>
      </>
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
          {(contact.email || contact.whatsapp) && (
            <div className="contact-links">
              {contact.email && (
                <a className="button button-primary" href={`mailto:${contact.email}`}>
                  {t.contactEmail}: {contact.email}
                </a>
              )}
              {contact.whatsapp && (
                <a className="button button-primary" href={contact.whatsapp} target="_blank" rel="noreferrer">WhatsApp ↗</a>
              )}
            </div>
          )}
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
    <>
    <div className="site-shell" onClick={handleInternalNavigation}>
      <header className="site-header">
        <a className="brand" href="/" aria-label="The Discovery Box home">
          <img src="/official-logo.png" alt="" />
          <span className="brand-wordmark">The<br />Discovery<br />Box</span>
        </a>
        <nav className={`main-nav${mobileMenuOpen ? ' nav-open' : ''}`} aria-label={language === 'en' ? 'Main navigation' : 'Navegação principal'}>
          <a className={path === '/' ? 'nav-active' : undefined} href="/" aria-current={path === '/' ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)}>{t.navHome}</a>
          <a className={path === '/shop' ? 'nav-active' : undefined} href="/shop" aria-current={path === '/shop' ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)}>{t.navShop}</a>
          <a href="/shop" onClick={() => setMobileMenuOpen(false)}>{t.navCollections}</a>
          <a className={path === '/gift-builder' ? 'nav-active' : undefined} href="/gift-builder" aria-current={path === '/gift-builder' ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)}>{t.navBuilder}</a>
          <a href="/gift-builder" onClick={() => setMobileMenuOpen(false)}>{t.navIdeas}</a>
          <a className={path === '/corporate' ? 'nav-active' : undefined} href="/corporate" aria-current={path === '/corporate' ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)}>{t.navCorporate}</a>
          <a className={path === '/about' ? 'nav-active' : undefined} href="/about" aria-current={path === '/about' ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)}>{t.navAbout}</a>
          <a className={path === '/contact' ? 'nav-active' : undefined} href="/contact" aria-current={path === '/contact' ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)}>{t.navContact}</a>
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
          <a className="header-icon-link" href="/shop" aria-label={t.searchGifts} title={t.searchGifts}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.6" /><path d="m16 16 4.3 4.3" /></svg>
          </a>
          <a className="header-icon-link" href="/gift-builder" aria-label={t.giftBuilder} title={t.giftBuilder}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 8.5h15l-1 12h-13l-1-12Z" /><path d="M8.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5M12 12v5" /></svg>
          </a>
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
          <a className="header-cta" href="/gift-builder">{t.create}<span aria-hidden="true">→</span></a>
        </div>
      </header>
      <main>{page}</main>
      <footer className="site-footer">
        <div className="footer-top"><a className="brand brand-footer" href="/"><img src="/official-logo.png" alt="The Discovery Box" /></a><span className="footer-description">{t.footer}</span></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} The Discovery Box</span><div><a href="/privacy">{t.privacy}</a><a href="/terms">{t.terms}</a><a href="/contact">{t.navContact}</a></div></div>
      </footer>
    </div>
    <AssistantWidget
      language={language}
      onNavigate={navigateInternal}
      onApplyGiftDraft={(draft) => {
        setAssistantGiftDraft(draft);
        navigateInternal('/gift-builder');
      }}
    />
    </>
  );
}

function GiftBuilder({
  catalog, catalogState, language, t, nameFor, descriptionFor, productImage, productImageStyle, imageStyle, initialProduct, assistantDraft, onAssistantDraftApplied, refreshCatalog,
}: {
  catalog: CatalogResponse;
  catalogState: 'loading' | 'ready' | 'error';
  language: Language;
  t: typeof copy[Language];
  nameFor: (item: CatalogItem) => string;
  descriptionFor: (item: CatalogItem) => string;
  productImage: (item: CatalogItem) => string;
  productImageStyle: (item: CatalogItem) => CSSProperties;
  imageStyle: (item: CatalogItem, index: number) => CSSProperties;
  initialProduct: string;
  assistantDraft: AssistantGiftDraft | null;
  onAssistantDraftApplied: () => void;
  refreshCatalog: () => Promise<CatalogResponse>;
}) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<string[]>(initialProduct ? [initialProduct] : []);
  const [occasion, setOccasion] = useState('');
  const [occasionDetails, setOccasionDetails] = useState('');
  const [recipient, setRecipient] = useState('');
  const [recipientDetails, setRecipientDetails] = useState('');
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
  const [recommendations, setRecommendations] = useState<GiftRecommendation[] | null>(null);
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<{ item: CatalogItem; recommendation: GiftRecommendation | null } | null>(null);
  const [productDetailsImageIndex, setProductDetailsImageIndex] = useState(0);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const recommendationRequestRef = useRef(0);
  const appliedAssistantDraftRef = useRef<AssistantGiftDraft | null>(null);
  const productDetailsImages = productDetails?.item.images?.flatMap((src, index) => src ? [{ src, index }] : []) ?? [];
  const activeProductDetailsImagePosition = productDetailsImages.findIndex(({ index }) => index === productDetailsImageIndex);
  const activeProductDetailsImage = productDetailsImages[activeProductDetailsImagePosition];
  const openProductDetails = (item: CatalogItem, recommendation: GiftRecommendation | null) => {
    const images = item.images?.flatMap((src, index) => src ? [{ src, index }] : []) ?? [];
    const primaryImage = images.find(({ index }) => index === item.primary_image_index) ?? images[0];
    setProductDetailsImageIndex(primaryImage?.index ?? 0);
    setProductDetails({ item, recommendation });
  };
  useEffect(() => {
    if (!productDetails) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProductDetails(null);
        return;
      }
      if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && productDetailsImages.length > 1) {
        event.preventDefault();
        setProductDetailsImageIndex((currentIndex) => {
          const currentPosition = productDetailsImages.findIndex(({ index }) => index === currentIndex);
          const direction = event.key === 'ArrowRight' ? 1 : -1;
          const nextPosition = (currentPosition + direction + productDetailsImages.length) % productDetailsImages.length;
          return productDetailsImages[nextPosition].index;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productDetails]);
  const selectedProducts = catalog.items.filter((item) => selected.includes(item.id));
  const selectedNames = selectedProducts.map(nameFor);
  const corporateEventOption = language === 'en' ? 'Corporate event' : 'Evento empresarial';
  const otherOccasionOption = t.occasions[t.occasions.length - 1];
  const isCorporateEvent = occasion === corporateEventOption;
  const recipientOptions = isCorporateEvent ? t.corporateRecipients : t.recipients;
  const otherRecipientOption = recipientOptions[recipientOptions.length - 1];
  const selectedOccasion = occasion
    ? occasion === otherOccasionOption && occasionDetails.trim()
      ? `${occasion}: ${occasionDetails.trim()}`
      : occasion
    : otherOccasionOption;
  const selectedRecipient = recipient
    ? recipient === otherRecipientOption && recipientDetails.trim()
      ? `${recipient}: ${recipientDetails.trim()}`
      : recipient
    : t.recipients[t.recipients.length - 1];
  const productsForStep: Array<{ item: CatalogItem; recommendation: GiftRecommendation | null }> = showAllProducts
    ? catalog.items.map((item) => ({ item, recommendation: null }))
    : (recommendations || [])
      .map((recommendation) => ({
        item: catalog.items.find((candidate) => candidate.id === recommendation.productId),
        recommendation,
      }))
      .filter((entry): entry is { item: CatalogItem; recommendation: GiftRecommendation } => Boolean(entry.item));

  useEffect(() => {
    if (!assistantDraft || appliedAssistantDraftRef.current === assistantDraft) return;
    appliedAssistantDraftRef.current = assistantDraft;
    setOccasion(assistantDraft.occasion);
    setRecipient(assistantDraft.recipient);
    setBudget(assistantDraft.budget);
    setPreferences(assistantDraft.preferences);
    setSelected((current) => [...new Set([
      ...current,
      ...assistantDraft.productIds,
    ])].slice(0, 5));
    setStep(1);
    setError('');
    onAssistantDraftApplied();
  }, [assistantDraft, onAssistantDraftApplied]);

  const toggleProduct = (id: string) => setSelected((items) =>
    items.includes(id) ? items.filter((item) => item !== id) : items.length < 5 ? [...items, id] : items,
  );

  useEffect(() => {
    if (!productDetails) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProductDetails(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [productDetails]);

  const advanceStep = () => {
    setError('');
    if (step === 1 && (!occasion || !recipient)) {
      setError(t.required);
      return;
    }
    if (step === 1) {
      const requestId = ++recommendationRequestRef.current;
      setRecommendations(null);
      setRecommendationMessage('');
      setRecommendationsLoading(true);
      setShowAllProducts(false);
      setRecommendationError('');
      setStep(2);

      void (async () => {
        try {
          const recommendationCatalog = await refreshCatalog();
          if (requestId !== recommendationRequestRef.current) return;
          const response = await fetch('/api/gift-recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              language,
              occasion: selectedOccasion,
              recipient: selectedRecipient,
              budget,
              preferences,
            }),
          });
          if (!response.ok) throw new Error('Recommendation request failed');
          const result = await response.json() as { recommendations?: unknown; message?: unknown };
          if (typeof result.message !== 'string' || !Array.isArray(result.recommendations)) {
            throw new Error('Recommendation response was invalid');
          }
          if (requestId !== recommendationRequestRef.current) return;
          const catalogueItems = new Map(recommendationCatalog.items.map((item) => [item.id, item]));
          const validRecommendations = result.recommendations.filter((entry): entry is GiftRecommendation =>
            Boolean(entry) && typeof entry === 'object' &&
            typeof (entry as GiftRecommendation).productId === 'string' &&
            typeof (entry as GiftRecommendation).matchScore === 'number' &&
            Number.isInteger((entry as GiftRecommendation).matchScore) &&
            (entry as GiftRecommendation).matchScore >= 0 &&
            (entry as GiftRecommendation).matchScore <= 100 &&
            typeof (entry as GiftRecommendation).reason === 'string' &&
            catalogueItems.has((entry as GiftRecommendation).productId));
          setRecommendationMessage(result.message.trim());
          setRecommendations(validRecommendations.sort((left, right) => right.matchScore - left.matchScore));
        } catch {
          if (requestId === recommendationRequestRef.current) {
            setRecommendationError(t.recommendationFallback);
            setRecommendations([]);
          }
        } finally {
          if (requestId === recommendationRequestRef.current) {
            setRecommendationsLoading(false);
          }
        }
      })();
      return;
    }
    setStep(step + 1);
  };

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
      if (!response.ok) {
        setError(response.status === 503
          ? t.submitErrorNotConfigured
          : response.status === 502
            ? t.submitErrorProvider
            : t.submitError);
        return;
      }
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
            <label>{t.occasion}<select value={occasion} onChange={(event) => {
              const nextOccasion = event.target.value;
              setOccasion(nextOccasion);
              setRecipient('');
              setRecipientDetails('');
              if (nextOccasion !== otherOccasionOption) setOccasionDetails('');
            }}><option value="">—</option>{occasion && !(t.occasions as readonly string[]).includes(occasion) && <option>{occasion}</option>}{t.occasions.map((item) => <option key={item}>{item}</option>)}</select></label>
            {occasion === otherOccasionOption && <label>{t.occasionDetailsLabel}<input type="text" maxLength={120} value={occasionDetails} onChange={(event) => setOccasionDetails(event.target.value)} placeholder={t.occasionDetailsPlaceholder} /></label>}
            <label>{t.recipient}<select value={recipient} onChange={(event) => {
              const nextRecipient = event.target.value;
              setRecipient(nextRecipient);
              if (nextRecipient !== otherRecipientOption) setRecipientDetails('');
            }}><option value="">—</option>{recipient && !(recipientOptions as readonly string[]).includes(recipient) && <option>{recipient}</option>}{recipientOptions.map((item) => <option key={item}>{item}</option>)}</select></label>
            {recipient === otherRecipientOption && <label>{t.recipientDetailsLabel}<input type="text" maxLength={120} value={recipientDetails} onChange={(event) => setRecipientDetails(event.target.value)} placeholder={t.recipientDetailsPlaceholder} /></label>}
            <label>{t.budget}<input type="number" min="0" max="10000000" value={budget} onChange={(event) => setBudget(event.target.value)} /></label>
            <label>{t.interests}<textarea maxLength={1000} placeholder={t.interestsHint} value={preferences} onChange={(event) => setPreferences(event.target.value)} /></label>
          </div>}
          {step === 2 && <div className="builder-panel">
            <h2>{t.chooseProducts}</h2>
            {recommendationError && <p className="notice notice-error" role="status">{recommendationError}</p>}
            {recommendationMessage && <div className="recommendation-intro">
              <span className="eyebrow">{t.recommendationIntro}</span>
              <p>{recommendationMessage}</p>
            </div>}
            <div className="recommendation-controls">
              <span>{t.recommendationTitle}</span>
              <button type="button" className="text-link" onClick={() => setShowAllProducts((current) => !current)}>
                {showAllProducts ? t.showSuggestedProducts : t.showAllProducts}
              </button>
            </div>
            {recommendationsLoading && !showAllProducts && <p className="notice" role="status">{t.recommendationLoading}</p>}
            {catalogState === 'loading' && <p className="notice">{t.loading}</p>}
            {catalogState === 'error' && <p className="notice notice-error">{t.catalogError}</p>}
            {catalogState === 'ready' && !catalog.items.length && <p className="notice">{t.empty}</p>}
            {catalogState === 'ready' && catalog.items.length > 0 && !showAllProducts &&
              !recommendationsLoading && !recommendationError && recommendations?.length === 0 &&
              <p className="notice">{t.noBudgetMatches}</p>}
            <div className="choice-grid">
              {productsForStep.map(({ item, recommendation }) => (
                <article className={`choice-card ${selected.includes(item.id) ? 'choice-selected' : ''}`} key={item.id}>
                  <label className="choice-card-main" htmlFor={`gift-product-${item.id}`}>
                    <input id={`gift-product-${item.id}`} type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleProduct(item.id)} disabled={!selected.includes(item.id) && selected.length >= 5} />
                    {productImage(item) && <img src={productImage(item)} alt="" style={productImageStyle(item)} loading="lazy" />}
                    <span><strong>{nameFor(item)}</strong><small>{descriptionFor(item)}</small></span>
                  </label>
                  <div className="choice-card-actions">
                    {recommendation && <span className="match-score" aria-label={`${t.matchScore}: ${recommendation.matchScore}%`}>{recommendation.matchScore}% {t.matchScore}</span>}
                    <button className="text-link" type="button" onClick={() => openProductDetails(item, recommendation)}>{t.moreDetails}</button>
                  </div>
                </article>
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
            {step > 1 ? <button className="button button-outline" type="button" onClick={() => {
              recommendationRequestRef.current += 1;
              setStep(step - 1);
            }}>{t.previous}</button> : <span />}
            <button className="button button-primary" type="button" onClick={advanceStep} disabled={busy !== ''}>
              {t.next}<span aria-hidden="true">↗</span>
            </button>
          </div>}
          {step === 3 && <div className="builder-controls"><button className="button button-outline" type="button" onClick={() => setStep(2)}>{t.previous}</button></div>}
          {error && step !== 3 && <p className="notice notice-error" role="alert">{error}</p>}
        </>
      )}
      {productDetails && <div className="product-modal-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setProductDetails(null);
      }}>
        <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="gift-product-details-title">
          <button className="product-modal-close" type="button" aria-label={t.closeDetails} onClick={() => setProductDetails(null)}>×</button>
          {activeProductDetailsImage
            ? <div className="product-modal-gallery">
              <div className="product-modal-gallery-frame">
                <img
                  className="product-modal-image"
                  src={activeProductDetailsImage.src}
                  alt={`${nameFor(productDetails.item)} — ${t.imageNumber(activeProductDetailsImagePosition + 1, productDetailsImages.length)}`}
                  style={imageStyle(productDetails.item, activeProductDetailsImage.index)}
                />
                {productDetailsImages.length > 1 && <span className="gallery-count" aria-live="polite">{t.imageNumber(activeProductDetailsImagePosition + 1, productDetailsImages.length)}</span>}
              </div>
              {productDetailsImages.length > 1 && <>
                <div className="product-modal-thumbnails" role="group" aria-label={nameFor(productDetails.item)}>
                  {productDetailsImages.map(({ src, index }, position) => (
                    <button
                      className={`detail-thumbnail${index === productDetailsImageIndex ? ' thumbnail-active' : ''}`}
                      type="button"
                      key={`${productDetails.item.id}-${index}-${src}`}
                      aria-label={t.imageNumber(position + 1, productDetailsImages.length)}
                      aria-pressed={index === productDetailsImageIndex}
                      onClick={() => setProductDetailsImageIndex(index)}
                    >
                      <img src={src} alt="" loading="lazy" style={imageStyle(productDetails.item, index)} />
                    </button>
                  ))}
                </div>
                <div className="gallery-controls">
                  <button
                    type="button"
                    className="gallery-arrow"
                    aria-label={t.previousImage}
                    onClick={() => setProductDetailsImageIndex(productDetailsImages[(activeProductDetailsImagePosition - 1 + productDetailsImages.length) % productDetailsImages.length].index)}
                  >←</button>
                  <button
                    type="button"
                    className="gallery-arrow"
                    aria-label={t.nextImage}
                    onClick={() => setProductDetailsImageIndex(productDetailsImages[(activeProductDetailsImagePosition + 1) % productDetailsImages.length].index)}
                  >→</button>
                </div>
              </>}
            </div>
            : <div className="product-modal-gallery-frame product-modal-image-placeholder"><span className="image-placeholder">✦</span></div>}
          <span className="eyebrow">{productDetails.item.family}</span>
          <h2 id="gift-product-details-title">{nameFor(productDetails.item)}</h2>
          {productDetails.item.category && <p className="product-modal-category">{productDetails.item.category}</p>}
          <p className="product-modal-description">{descriptionFor(productDetails.item)}</p>
          <strong className="product-modal-price">{productDetails.item.price_mzn != null
            ? `${Number(productDetails.item.price_mzn).toLocaleString(language === 'pt' ? 'pt-MZ' : 'en-US')} MZN`
            : t.noPrice}</strong>
          {productDetails.recommendation && <div className="product-modal-match">
            <strong>{productDetails.recommendation.matchScore}% {t.matchScore}</strong>
            <span>{t.whyThisMatches}</span>
            <p>{productDetails.recommendation.reason}</p>
          </div>}
          <label className="product-modal-select">
            <input type="checkbox" checked={selected.includes(productDetails.item.id)} onChange={() => toggleProduct(productDetails.item.id)} disabled={!selected.includes(productDetails.item.id) && selected.length >= 5} />
            {selected.includes(productDetails.item.id) ? t.productSelected : t.addProduct}
          </label>
        </section>
      </div>}
    </section>
  );
}

export default App;
