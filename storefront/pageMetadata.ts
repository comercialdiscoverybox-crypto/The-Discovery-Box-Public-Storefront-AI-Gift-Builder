export type MetadataLanguage = 'en' | 'pt';

export type PageMetadataProduct = {
  id: string;
  name: string;
  description: string;
  image?: string;
};

export type PageMetadata = {
  title: string;
  description: string;
  image: string;
  type: 'website' | 'product';
  robots: 'index,follow' | 'noindex,follow';
};

const pageCopy = {
  en: {
    home: {
      title: 'The Discovery Box | Personalized Gifts in Mozambique',
      description: 'Discover thoughtful gifts, playful objects, and original 3D creations. Explore The Discovery Box and make every moment personal.',
    },
    shop: {
      title: 'Shop Thoughtful Gifts | The Discovery Box',
      description: 'Explore personalized gifts, playful objects, and creative 3D products from The Discovery Box in Mozambique.',
    },
    corporate: {
      title: 'Corporate & Branded Gifts | The Discovery Box',
      description: 'Explore personalized corporate gifts, branded objects, team keepsakes, and awards from The Discovery Box.',
    },
    builder: {
      title: 'Create a Personalized Gift | The Discovery Box',
      description: 'Tell us about the occasion, recipient, and budget. Build a thoughtful gift idea with The Discovery Box.',
    },
    productEnquiry: {
      title: 'Product Enquiry | The Discovery Box',
      description: 'Ask The Discovery Box about selected products, quantities, availability, pricing, and timing.',
    },
    about: {
      title: 'About The Discovery Box | Thoughtful Gifts from Mozambique',
      description: 'Learn how The Discovery Box brings creativity, design, 3D printing, and personalization together in Mozambique.',
    },
    contact: {
      title: 'Contact The Discovery Box',
      description: 'Get in touch with The Discovery Box about a gift idea, product, or celebration.',
    },
    faq: {
      title: 'Customer FAQ | The Discovery Box',
      description: 'Find answers about damaged orders, cancellations, returns, bulk pricing, lead times, samples, and loyalty rewards.',
    },
    reviews: {
      title: 'Reviews & Problem Reports | The Discovery Box',
      description: 'Leave a private review or report a problem directly to The Discovery Box team.',
    },
    privacy: {
      title: 'Privacy Notice | The Discovery Box',
      description: 'Read how The Discovery Box uses information submitted through the website, gift assistant, and enquiry form.',
    },
    terms: {
      title: 'Terms & Customer Policies | The Discovery Box',
      description: 'Read information about enquiries, personalized orders, payment, delivery, returns, refunds, and loyalty rewards.',
    },
    notFound: {
      title: 'Page Not Found | The Discovery Box',
      description: 'We could not find that page. Explore thoughtful gifts and creative products from The Discovery Box.',
    },
    productTitle: (name: string) => `${name} | The Discovery Box`,
    searchTitle: (query: string) => `Search gifts for ${query} | The Discovery Box`,
    familyTitle: (family: string) => `${family} Gifts | The Discovery Box`,
    productFallback: 'Explore this product from The Discovery Box. Ask our team to confirm current details, availability, and price.',
    searchDescription: (query: string) => `Browse The Discovery Box gifts matching ${query}. Product details, availability, and final prices are confirmed by our team.`,
  },
  pt: {
    home: {
      title: 'The Discovery Box | Presentes personalizados em Moçambique',
      description: 'Descubra presentes especiais, objetos divertidos e criações 3D originais. Explore a The Discovery Box e torne cada momento pessoal.',
    },
    shop: {
      title: 'Presentes especiais | The Discovery Box',
      description: 'Explore presentes personalizados, objetos divertidos e produtos criativos em 3D da The Discovery Box, em Moçambique.',
    },
    corporate: {
      title: 'Presentes empresariais e personalizados | The Discovery Box',
      description: 'Descubra presentes empresariais personalizados, objetos com logótipo, lembranças para equipas e prémios.',
    },
    builder: {
      title: 'Crie um presente personalizado | The Discovery Box',
      description: 'Conte-nos sobre a ocasião, o destinatário e o orçamento. Crie uma ideia de presente especial com a The Discovery Box.',
    },
    productEnquiry: {
      title: 'Pedido de informação sobre produtos | The Discovery Box',
      description: 'Pergunte à The Discovery Box sobre produtos, quantidades, disponibilidade, preços e prazos.',
    },
    about: {
      title: 'Sobre a The Discovery Box | Presentes especiais de Moçambique',
      description: 'Saiba como a The Discovery Box combina criatividade, design, impressão 3D e personalização em Moçambique.',
    },
    contact: {
      title: 'Contacte a The Discovery Box',
      description: 'Contacte a The Discovery Box sobre uma ideia de presente, um produto ou uma celebração.',
    },
    faq: {
      title: 'Perguntas frequentes | The Discovery Box',
      description: 'Encontre respostas sobre artigos danificados, cancelamentos, devoluções, pedidos em quantidade, prazos, amostras e fidelidade.',
    },
    reviews: {
      title: 'Avaliações e relatos de problemas | The Discovery Box',
      description: 'Deixe uma avaliação privada ou comunique um problema directamente à equipa da The Discovery Box.',
    },
    privacy: {
      title: 'Aviso de privacidade | The Discovery Box',
      description: 'Saiba como a The Discovery Box utiliza as informações enviadas pelo website, assistente de presentes e formulário.',
    },
    terms: {
      title: 'Termos e políticas para clientes | The Discovery Box',
      description: 'Consulte informações sobre pedidos, personalização, pagamento, entrega, devoluções, reembolsos e fidelidade.',
    },
    notFound: {
      title: 'Página não encontrada | The Discovery Box',
      description: 'Não encontrámos esta página. Explore presentes especiais e produtos criativos da The Discovery Box.',
    },
    productTitle: (name: string) => `${name} | The Discovery Box`,
    searchTitle: (query: string) => `Pesquisar presentes: ${query} | The Discovery Box`,
    familyTitle: (family: string) => `Presentes ${family} | The Discovery Box`,
    productFallback: 'Explore este produto da The Discovery Box. Peça à nossa equipa para confirmar os detalhes, disponibilidade e preço.',
    searchDescription: (query: string) => `Explore os presentes da The Discovery Box relacionados com ${query}. A equipa confirma os detalhes, disponibilidade e preço final.`,
  },
} as const;

const defaultImage = '/discovery-box-adventure.png';

export function getPageMetadata(
  pathname: string,
  language: MetadataLanguage,
  searchParams: URLSearchParams = new URLSearchParams(),
  product?: PageMetadataProduct,
): PageMetadata {
  const copy = pageCopy[language];
  let title: string;
  let description: string;
  let image = defaultImage;
  let type: PageMetadata['type'] = 'website';
  let robots: PageMetadata['robots'] = 'index,follow';

  if (pathname === '/') {
    ({ title, description } = copy.home);
  } else if (pathname === '/shop' || pathname.startsWith('/shop/')) {
    const query = (searchParams.get('q') || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    const familyParam = searchParams.get('family');
    const family = familyParam === 'PLAY'
      ? (language === 'en' ? 'Play' : 'brincar')
      : familyParam === 'HOME'
        ? (language === 'en' ? 'Home' : 'casa')
        : familyParam === 'BUSINESS'
          ? (language === 'en' ? 'Business' : 'empresariais')
          : '';
    const collection = (searchParams.get('collection') || '').replace(/[-_]+/g, ' ').trim();
    if (query) {
      title = copy.searchTitle(query);
      description = copy.searchDescription(query);
    } else if (collection) {
      const collectionNames: Record<string, { en: string; pt: string }> = {
        'tax collection discovery awards': { en: 'Discovery Awards', pt: 'Discovery Awards' },
        'tax collection discovery brand': { en: 'Discovery Brand', pt: 'Discovery Brand' },
        'tax collection discovery events': { en: 'Discovery Events', pt: 'Discovery Events' },
        'tax collection discovery teams': { en: 'Discovery Teams', pt: 'Discovery Teams' },
        'tax collection discovery gifts': { en: 'Discovery Gifts', pt: 'Discovery Gifts' },
      };
      const localizedCollection = collectionNames[collection.toLowerCase()];
      const collectionName = localizedCollection
        ? localizedCollection[language]
        : collection.replace(/\b\w/g, (character) => character.toUpperCase());
      title = `${collectionName} | The Discovery Box`;
      description = language === 'en'
        ? `Explore ${collectionName} gifts from The Discovery Box. Product details, availability, and prices are confirmed by our team.`
        : `Explore presentes ${collectionName} da The Discovery Box. A equipa confirma os detalhes, a disponibilidade e os preços.`;
    } else if (family) {
      title = copy.familyTitle(family);
      description = language === 'en'
        ? `Explore ${family.toLowerCase()} gifts and creative products from The Discovery Box.`
        : `Explore presentes ${family} e produtos criativos da The Discovery Box.`;
    } else {
      ({ title, description } = copy.shop);
    }
    if (query || searchParams.has('sort') || searchParams.has('page')) robots = 'noindex,follow';
  } else if (pathname.startsWith('/product/')) {
    type = 'product';
    if (product) {
      title = copy.productTitle(product.name);
      description = product.description.trim() || copy.productFallback;
      image = product.image || defaultImage;
    } else {
      const id = decodeURIComponent(pathname.slice('/product/'.length));
      title = copy.productTitle(id);
      description = copy.productFallback;
    }
  } else if (pathname === '/corporate') {
    ({ title, description } = copy.corporate);
  } else if (pathname === '/gift-builder') {
    ({ title, description } = copy.builder);
  } else if (pathname === '/product-enquiry') {
    ({ title, description } = copy.productEnquiry);
    robots = 'noindex,follow';
  } else if (pathname === '/about') {
    ({ title, description } = copy.about);
  } else if (pathname === '/contact') {
    ({ title, description } = copy.contact);
  } else if (pathname === '/faq') {
    ({ title, description } = copy.faq);
  } else if (pathname === '/reviews') {
    ({ title, description } = copy.reviews);
  } else if (pathname === '/privacy') {
    ({ title, description } = copy.privacy);
  } else if (pathname === '/terms') {
    ({ title, description } = copy.terms);
  } else {
    ({ title, description } = copy.notFound);
    robots = 'noindex,follow';
  }

  return { title, description, image, type, robots };
}

export function getCanonicalSearchParams(searchParams: URLSearchParams): URLSearchParams {
  const canonicalParams = new URLSearchParams();
  for (const key of ['family', 'collection', 'category']) {
    const value = searchParams.get(key);
    if (value) canonicalParams.set(key, value);
  }
  return canonicalParams;
}
