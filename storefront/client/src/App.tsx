import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import AssistantWidget from './AssistantWidget';
import type { AssistantGiftDraft } from './assistantTypes';
import type { MapAddress } from './MapAddressPicker';
import { trackAnalyticsEvent } from './analytics';
import { getCanonicalSearchParams, getPageMetadata } from '../../pageMetadata';
import { trapModalFocus } from './focusTrap';

const MapAddressPicker = lazy(() => import('./MapAddressPicker'));

type Language = 'en' | 'pt';
type Theme = 'light' | 'dark';
type EnquiryAddress = Omit<MapAddress, 'latitude' | 'longitude'> & {
  latitude: number | null;
  longitude: number | null;
};
const emptyEnquiryAddress: EnquiryAddress = {
  placeName: '',
  road: '',
  houseNumber: '',
  neighbourhood: '',
  district: '',
  city: '',
  province: '',
  postalCode: '',
  country: '',
  formattedAddress: '',
  latitude: null,
  longitude: null,
  osmType: '',
  osmId: '',
  placeCategory: '',
  placeType: '',
  addressType: '',
};
function formatEnquiryAddress(address: EnquiryAddress): string {
  const street = [address.houseNumber, address.road].filter(Boolean).join(' ');
  const seen = new Set<string>();
  return [
    address.placeName,
    street,
    address.neighbourhood,
    address.district,
    address.city,
    address.province,
    address.postalCode,
    address.country,
  ].filter((part) => {
    const normalized = part.trim().toLocaleLowerCase();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  }).join(', ');
}
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
  total?: number;
  page?: number;
  pageSize?: number;
  familyCounts?: Partial<Record<CatalogItem['family'], number>>;
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
    navBuilder: 'Gift builder',
    navCorporate: 'Corporate gifts',
    navAbout: 'About',
    navContact: 'Contact',
    navHelp: 'FAQ',
    navReviews: 'Feedback',
    searchGifts: 'Explore gifts',
    themeLight: 'Switch to light mode',
    themeDark: 'Switch to dark mode',
    menu: 'Open navigation menu',
    browseCategories: 'Browse categories',
    shopSearchLabel: 'Search gifts',
    shopSearchPlaceholder: 'Search by name or keyword',
    shopSearchSubmit: 'Search',
    shopSortLabel: 'Sort by price',
    shopSortFeatured: 'Featured order',
    shopSortPriceLow: 'Price: low to high',
    shopSortPriceHigh: 'Price: high to low',
    shopNoResults: (query: string) => `No gifts match “${query}”. Try another search or clear it.`,
    clearShopSearch: 'Clear search',
    pagePrevious: 'Previous',
    pageNext: 'Next',
    paginationLabel: 'Product pages',
    pageStatus: (current: number, total: number) => `Page ${current} of ${total}`,
    possibleWorlds: 'A world of possibilities',
    chosenWithCare: 'Chosen with care',
    madeForYou: <>made<br />for you</>,
    heroEyebrow: 'Personalized gifts for every moment',
    heroArtworkMessage: ['Small', 'surprises.', 'Big smiles.'],
    heroTitle: <>More than gifts,<br />it’s a <span className="hero-title-highlight"><span>d</span><span>i</span><span>s</span><span>c</span><span>o</span><span>v</span><span>e</span><span>r</span><span>y</span></span><span className="hero-title-period">.</span></>,
    heroBody: 'Explore unique products, create personalized gift ideas and make every moment extra special.',
    heroCta: 'Start building',
    heroBrowse: 'Browse gifts',
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
    enquiryProcessTitle: 'What happens after you enquire',
    enquiryProcess: 'Sending an enquiry is not placing an order. Our team confirms feasibility, the final price, estimated preparation time, and delivery or collection details. If you accept the quote, the stated process is full payment in advance, arranged directly with the team. The order is confirmed only after payment is received and verified; timing estimates are not guarantees.',
    shop: 'The collection',
    all: 'All gifts',
    play: 'PLAY',
    home: 'HOME',
    business: 'BUSINESS',
    empty: 'Our collection is being prepared. Please check back soon.',
    catalogError: 'We could not load the catalogue right now. Please try again shortly.',
    catalogRetry: 'Try again',
    loading: 'Finding thoughtful things…',
    loadingHint: 'Getting everything ready for you',
    requestQuote: 'Ask about this gift',
    buildWith: 'Enquire about this product',
    productEnquiryTitle: 'Enquire about selected products',
    productEnquiryIntro: 'Tell us how to reach you, choose the products and quantities, and our team will confirm availability, pricing and timing. Sending an enquiry does not place an order.',
    productEnquiryBack: 'Back to product',
    productEnquiryProducts: 'Products in your enquiry',
    productEnquiryAddProduct: 'Add another product',
    productEnquiryAddButton: 'Add product',
    productEnquiryChooseProduct: 'Choose a product',
    productEnquiryQuantity: 'Quantity',
    productEnquiryRemoveProduct: 'Remove product',
    productEnquiryMessage: 'Question or customization note (optional)',
    productEnquiryConsent: 'I agree that my contact details and product enquiry can be used to respond to me.',
    productEnquirySubmit: 'Send product enquiry',
    productEnquirySent: 'Thanks! Your product enquiry has been sent to our team.',
    productEnquiryNoProducts: 'Choose at least one product to continue.',
    productEnquiryAddLimit: 'You can include up to 10 products in one enquiry.',
    productEnquiryUnavailableProduct: 'This product is no longer available. Remove it and choose another.',
    productEnquiryError: 'We could not send your enquiry. Please try again later.',
    productEnquiryUnavailable: 'Email delivery is not configured on the server. Please contact us directly.',
    imageNumber: (current: number, total: number) => `Image ${current} of ${total}`,
    previousImage: 'Show previous product image',
    nextImage: 'Show next product image',
    viewImageFullscreen: 'View image full screen',
    exitImageFullscreen: 'Exit full screen',
    fullscreenUnavailable: 'Full-screen view is unavailable in this browser.',
    noPrice: 'Request a quote',
    backShop: 'Back to the collection',
    builderEyebrow: 'Your idea, made personal',
    builderTitle: 'Let’s make a gift that feels just right.',
    builderOrientation: 'Tell us the occasion and who the gift is for. Then choose products and add your contact details.',
    reviewInstructions: 'Add your contact details, check your choices, and send your enquiry.',
    giftDetails: 'Gift details',
    editGiftDetails: 'Edit gift details',
    editProductChoices: 'Edit product choices',
    noProductsSelected: 'No products selected.',
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
    addBudget: 'Add a budget to tailor suggestions',
    addPreferences: 'Tell us their interests to personalize ideas',
    addCardMessage: 'Add a personal gift-card message',
    addPhone: 'Add a phone number so we can reach you directly',
    addDeliveryAddress: 'Add delivery address',
    addressDeliveryNote: 'Add an address so we can plan delivery and estimate the fee. We’ll confirm the final cost with you.',
    addressDetailsPrompt: 'Add the details you know so we can find the delivery location.',
    addressEntryMethod: 'Choose how to add your address',
    addressEnterManually: 'Enter address',
    addressUseMap: 'Use map',
    addressEditDetails: 'Edit details',
    addressDoneEditing: 'Done',
    addressCoordinates: 'Pin coordinates',
    addressNoDetails: 'No address details were returned. You can add them manually.',
    chooseAddressOnMap: 'Open map',
    editAddressOnMap: 'Change pin',
    addAddressPlaceName: 'Add a place or landmark',
    addAddressRoad: 'Add a street or road',
    addAddressHouseNumber: 'Add a house number',
    addAddressNeighbourhood: 'Add a neighbourhood or area',
    addAddressDistrict: 'Add a district',
    addAddressCity: 'Add a city or municipality',
    addAddressProvince: 'Add a province',
    addAddressPostalCode: 'Add a postal code',
    addAddressCountry: 'Add a country',
    hideOptionalField: (field: string) => `Hide ${field}`,
    showOptionalField: (field: string) => `Add ${field}`,
    mapLoading: 'Loading the map…',
    mapOptIn: 'OpenStreetMap receives map requests, your IP/network details, and the selected pin coordinates to look up the address.',
    chooseProducts: 'Add products from our public collection (optional)',
    review: 'Your gift idea',
    cardMessage: 'Your message',
    name: 'Your name',
    email: 'Email address',
    phone: 'Phone number',
    preferredContact: 'How would you prefer our team to contact you?',
    contactByEmail: 'Email',
    contactByPhone: 'Phone call',
    contactByWhatsApp: 'WhatsApp',
    deliveryAddress: 'Delivery address',
    addressPlaceName: 'Place / landmark name',
    addressRoad: 'Street / road',
    addressHouseNumber: 'House number',
    addressNeighbourhood: 'Neighbourhood / area',
    addressDistrict: 'District',
    addressCity: 'City / municipality',
    addressProvince: 'Province',
    addressPostalCode: 'Postal code',
    addressCountry: 'Country',
    addressPlacePlaceholder: 'Map place name, when available',
    addressRoadPlaceholder: 'Filled from map data when available',
    addressNeighbourhoodPlaceholder: 'e.g. Polana Cimento',
    addressDistrictPlaceholder: 'e.g. KaMpfumo',
    addressCityPlaceholder: 'e.g. Maputo',
    addressProvincePlaceholder: 'e.g. Maputo',
    submit: 'Send an enquiry',
    sending: 'Sending…',
    sent: 'Thanks! Your enquiry has been sent to our team.',
    submitError: 'We could not send your enquiry. Please try again later.',
    submitErrorNotConfigured: 'Email delivery is not configured on the server. Please contact us directly.',
    submitErrorProvider: 'Our email service could not accept your enquiry. Please try again later.',
    required: 'Please complete the required fields.',
    privacyConsent: 'I agree that the details I provide can be used to respond to this enquiry.',
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
    faqTitle: 'Helpful answers, before you ask.',
    faqBody: 'Find practical guidance about orders, timing, returns, samples and rewards. Details for each order are confirmed by our team.',
    reviewsTitle: 'Share feedback or report a problem.',
    reviewsBody: 'Choose whether to share feedback about your experience or report a problem. Submissions are stored privately and sent to our team by email; they are not published on the website.',
    feedbackType: 'What would you like to do?',
    leaveReview: 'Leave a review',
    reportProblem: 'Report a problem',
    problemEmail: 'Email address (for follow-up)',
    orderReference: 'Order or enquiry reference (optional)',
    problemText: 'Tell us what happened',
    problemTextHint: 'Describe the issue and any details that may help our team',
    reviewConsentProblem: 'I agree that this report, my email address and my optional name and order reference can be stored and emailed to The Discovery Box team so they can follow up.',
    problemSent: 'Thank you. Your report has been saved and sent privately to our team.',
    problemSavedEmailError: 'Your report has been saved, but our team could not be notified by email. Please contact us directly so we can follow up.',
    reviewRating: 'Your rating',
    reviewRatingOption: (rating: number) => `${rating} ${rating === 1 ? 'star' : 'stars'}`,
    reviewText: 'Your review',
    reviewTextHint: 'Tell us about your experience',
    reviewName: 'Name (optional)',
    reviewConsent: 'I agree that this review and my optional name can be stored and emailed to The Discovery Box team for feedback purposes.',
    reviewSubmit: 'Send review',
    reviewSending: 'Sending…',
    reviewSent: 'Thank you for sharing your feedback. Your review has been saved and sent privately to our team.',
    reviewSavedEmailError: 'Your review has been saved, but our team could not be notified by email. Please contact us directly if you need a response.',
    reviewError: 'We could not save your review. Please try again later.',
    faqQuestions: [
      {
        question: 'What should I do if my order arrives damaged, incorrect or incomplete?',
        answer: 'Contact our team privately with the relevant details. Keep the item and its original packaging while the team reviews the issue. The team will assess what happened and discuss an appropriate solution; the outcome depends on the case.',
      },
      {
        question: 'Can I cancel an order or change a personalized design?',
        answer: 'Contact the team as soon as possible. Whether a cancellation or change is possible depends on the order stage; materials, special purchases or work may already have incurred costs. Changes after design approval may not be possible and can affect the price or estimated timing.',
      },
      {
        question: 'Can I return an item or get a refund?',
        answer: 'Returns, exchanges and refunds are assessed case by case. Contact the team before returning anything. Change-of-mind returns may not be accepted for personalized, made-to-order or specially sourced items. If there is a confirmed problem, the team may consider a repair, replacement, refund or another agreed solution.',
      },
      {
        question: 'Do you offer bulk pricing and different personalization for each item?',
        answer: 'Bulk pricing is available for selected products. Quantity limits, individual names, multiple designs and character limits depend on the product and project. Send an enquiry with the product, quantity and personalization you have in mind so the team can confirm feasibility and pricing.',
      },
      {
        question: 'How much time should I allow?',
        answer: 'As general planning guidance, a one-unit order may take around 3–7 days; smaller requests should be sent at least 48 hours ahead, and large or bulk orders at least one month ahead. These are recommendations, not guaranteed completion or delivery dates. Include your required date in an enquiry so the team can confirm an estimate.',
      },
      {
        question: 'Can I request a sample?',
        answer: 'Miniature samples may be available for selected larger products. A full-size sample may have an additional materials and production cost. The team confirms availability, price and timing for each product.',
      },
      {
        question: 'How do the loyalty stamps and rewards work?',
        answer: 'The programme information describes one stamp for each eligible completed purchase, a free-delivery reward on the fifth eligible purchase for deliveries within Greater Maputo and Matola, and a Discovery Box gift on the eleventh purchase. Stamps follow a 12-month cycle. Eligibility, redemption and programme terms must be confirmed by the team.',
      },
    ],
    faqContact: 'Still have a question? Contact our team.',
    faqReportProblem: 'Need to share feedback or report a problem?',
    instagramTitle: 'Follow the little discoveries.',
    instagramBody: 'Scan the code to find us on Instagram, share your Discovery Moment and tag @the_discoverybox.',
    instagramScan: 'Scan to follow',
    instagramQrAlt: 'Instagram QR code for @the_discoverybox',
    contactOptions: 'Contact options are being confirmed. You can still send an enquiry using the gift builder.',
    contactEmail: 'Email us',
    privacyTitle: 'Privacy notice',
    privacyBody: 'This notice explains what information is used when you browse the website, use the assistant, request gift recommendations, or send an enquiry.',
    privacySections: [
      {
        title: 'Information you provide',
        paragraphs: [
          'If you send a gift enquiry, the form asks for your name, email address, an optional phone number, your preferred contact method, an optional delivery address, and details for the gift brief. The brief may include the occasion, recipient, budget, preferences, a gift-card message, and products you select. If you choose a map pin, its coordinates and map requests are sent to OpenStreetMap services to look up address details. The enquiry details are emailed to the team so they can respond. A separate product enquiry lets you choose products and quantities, provide your contact details, and add an optional note; these details and selected public product images are emailed to the team so they can respond. If you leave a review, your rating and written feedback, plus an optional name, are stored in our database and emailed to our team. If you report a problem, the report and required email address, plus any optional name or order reference, are stored and emailed so the team can follow up. Reviews and problem reports are private and are not published on the website.',
          'If you use the assistant, the messages you send are processed to generate replies. Please do not include sensitive personal information, passwords, payment details, identity numbers, health information, or private photographs in chat or other free-text fields.',
        ],
      },
      {
        title: 'How information is used and shared',
        paragraphs: [
          'Enquiry details, including any address and pin coordinates you choose to provide, are used to respond to your request and are sent to the configured email service so the team can receive it. If you opt to use the map, OpenStreetMap services receive requests to display map tiles and look up the coordinates you select; the map provider may also receive your IP address and ordinary request metadata. Map selection is optional, and you can enter the address manually instead. Review and problem report submissions are stored in the storefront database and sent to the team through the configured email service. The name, email, and phone fields are not included with gift-recommendation requests. However, anything you type into chat or free-text brief fields is sent as part of that text to the AI provider used for that feature, so do not enter personal or sensitive details there.',
          'When you ask for gift recommendations, the occasion, recipient, budget, and preferences are sent to Ollama to match your brief against the public catalogue. Chat messages are also sent to Ollama to generate assistant replies.',
        ],
      },
      {
        title: 'Information stored in your browser',
        paragraphs: [
          'The website stores your language and light/dark theme preferences in your browser’s local storage. These preferences help the site remember your choices and are not part of your gift enquiry.',
          'We also record privacy-conscious website analytics, such as page views and selected interactions (for example, searches by query length, filters, product views, and builder steps). Analytics include a random identifier kept in this browser tab for its session, the page path without query strings or fragments, the referring website origin, and limited event details. A session represents a browser tab, not a verified unique person, and does not connect activity across devices. Search text, chat messages, form contents, contact details, and visitor IP addresses are not stored in the analytics table. The data is used to understand visits and engagement; a retention period still needs to be decided and approved.',
        ],
      },
      {
        title: 'Questions about your information',
        paragraphs: [
          'For a question about information you submitted or an enquiry, contact the team privately at Info.discoverybox@gmail.com. Do not post personal or payment information publicly.',
        ],
      },
    ],
    termsTitle: 'Important information',
    termsBody: 'Product availability, contents, personalization, prices and delivery details are confirmed by The Discovery Box. Gift-builder selections are suggestions only and do not create an order or a binding offer. No online payment or order reservation is available on this website.',
    termsSections: [
      {
        title: 'Browsing, listings, and enquiries',
        paragraphs: [
          'The website lets you browse the public catalogue and send an enquiry. A product listing, gift-builder selection, or recommendation is informational only. It does not guarantee stock, production capacity, suitability, or availability.',
          'Prices shown are in Mozambican meticais (MZN) and may not be the final price for a customized or multi-item request. The team confirms the final specifications, price, any delivery charge, and estimated preparation time. Sending an enquiry does not place an order, reserve an item, or mean the team has accepted the request.',
        ],
      },
      {
        title: 'Quotes, payment, and order confirmation',
        paragraphs: [
          'After reviewing a request, the team will confirm whether it can produce the requested item and agree the model, size, quantity, personalization, price, and timing with you. The owner’s stated process is full payment in advance after the quotation is agreed. M-Pesa and e-Mola are listed as payment methods; the team will provide current payment instructions directly.',
          'This website does not take payment. Do not rely on payment details supplied in chat or an unverified message. An order is treated as confirmed only after the team has received and verified the agreed payment.',
        ],
      },
      {
        title: 'Personalized designs and changes',
        paragraphs: [
          'The team must confirm whether a requested design, material, size, color, quantity, logo, or other personalization is feasible. For a personalized item, review names, spelling, colors, sizes, quantities, and other specifications carefully before approving the final design.',
          'Production may begin after design approval. Changes requested later may not be possible and may involve additional costs or a revised estimate. The team will confirm available options before proceeding.',
        ],
      },
      {
        title: 'Preparation, deadlines, and delivery',
        paragraphs: [
          'Preparation and delivery estimates depend on the product, quantity, customization, materials, and production schedule. The owner’s general planning guidance is approximately 3–7 days for a one-unit order, at least one month ahead for large or bulk orders, and at least 48 hours’ notice for smaller requests. These are recommendations, not guaranteed completion or delivery dates. Urgent production may be possible, may incur an additional fee, and must be confirmed by the team.',
          'The team and customer agree collection or delivery details for each order, including location, timing, delivery method, cost, and recipient contact. Delivery areas, fees, and timing are not universal. If an order is delayed, the team should provide an updated estimate when reasonably possible; contact the team to discuss a fair solution if the delay becomes unreasonable.',
        ],
      },
      {
        title: 'Cancellations, returns, and refunds',
        paragraphs: [
          'Contact the team as soon as possible to request a cancellation. Whether it can be accepted depends on the order stage. Costs may have been incurred for personalized work, special purchases, materials, or work already completed.',
          'Returns and exchanges are assessed case by case. Contact the team before returning an item. A change-of-mind return may not be accepted for personalized, made-to-order, or specially sourced products; a standard item not yet dispatched may be reviewed. If an item arrives damaged, defective, incorrect, incomplete, or materially different from an approved design, contact the team privately with relevant details. Keep damaged items and their original packaging until the team has reviewed the issue.',
          'A refund may be considered when an order cannot be fulfilled as agreed, a confirmed problem cannot reasonably be resolved, or other circumstances justify one. A repair, replacement, or another agreed solution may be offered first. If approved, the team will confirm the refund amount, method, and expected timing. These case-by-case policies do not limit rights provided by applicable law.',
        ],
      },
      {
        title: 'Bulk orders and samples',
        paragraphs: [
          'Bulk pricing is available for selected products. Quantity limits, individual-name personalization, different designs, and character limits vary by product and project and must be confirmed by the team. Miniature samples may be available for selected larger products; a full-size sample may have an additional charge. The team confirms availability, cost, and timing.',
        ],
      },
      {
        title: 'Loyalty programme',
        paragraphs: [
          'The owner’s programme information describes one stamp for each eligible completed purchase, a free-delivery reward on the fifth purchase for eligible deliveries within Greater Maputo and Matola, and a Discovery Box gift on the eleventh purchase. Stamp progress follows a 12-month cycle. Eligibility, redemption, delivery-area qualification, and combining a reward with a promotion are subject to programme terms and team verification.',
          'The post-purchase link provides access to order tracking and the digital loyalty card. The assistant cannot access your order, payment, or loyalty records. Contact the team privately for help with a missing link, stamp, or reward.',
        ],
      },
    ],
    occasions: ['Birthday', 'Anniversary', 'Thank you', 'New baby', 'Celebration', 'Corporate event', 'Something else'],
    recipients: ['Friend', 'Partner', 'Child', 'Family member', 'Colleague', 'Client', 'Someone else'],
    corporateRecipients: ['Employees or team', 'Clients', 'Business partners', 'Event attendees', 'VIP guests', 'Suppliers', 'Something else'],
    notFound: 'We couldn’t find that page.',
  },
  pt: {
    navHome: 'Início',
    navShop: 'Loja',
    navBuilder: 'Criador de presentes',
    navCorporate: 'Presentes empresariais',
    navAbout: 'Sobre nós',
    navContact: 'Contacto',
    navHelp: 'Perguntas frequentes',
    navReviews: 'Opinião',
    searchGifts: 'Explorar presentes',
    themeLight: 'Mudar para o modo claro',
    themeDark: 'Mudar para o modo escuro',
    menu: 'Abrir menu de navegação',
    browseCategories: 'Explorar categorias',
    shopSearchLabel: 'Pesquisar presentes',
    shopSearchPlaceholder: 'Pesquisar por nome ou palavra-chave',
    shopSearchSubmit: 'Pesquisar',
    shopSortLabel: 'Ordenar por preço',
    shopSortFeatured: 'Ordem em destaque',
    shopSortPriceLow: 'Preço: mais baixo primeiro',
    shopSortPriceHigh: 'Preço: mais alto primeiro',
    shopNoResults: (query: string) => `Não encontrámos presentes para “${query}”. Experimente outra pesquisa ou limpe-a.`,
    clearShopSearch: 'Limpar pesquisa',
    pagePrevious: 'Anterior',
    pageNext: 'Seguinte',
    paginationLabel: 'Páginas de produtos',
    pageStatus: (current: number, total: number) => `Página ${current} de ${total}`,
    possibleWorlds: 'Um mundo de possibilidades',
    chosenWithCare: 'Escolhido com carinho',
    madeForYou: <>feito<br />para si</>,
    heroEyebrow: 'Presentes personalizados para cada momento',
    heroArtworkMessage: ['Pequenas', 'surpresas.', 'Grandes sorrisos.'],
    heroTitle: <>Mais do que presentes,<br />uma&nbsp;<span className="hero-title-highlight"><span>d</span><span>e</span><span>s</span><span>c</span><span>o</span><span>b</span><span>e</span><span>r</span><span>t</span><span>a</span></span><span className="hero-title-period">.</span></>,
    heroBody: 'Descubra produtos únicos, crie ideias de presentes personalizados e torne cada momento ainda mais especial.',
    heroCta: 'Começar a criar',
    heroBrowse: 'Explorar presentes',
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
    enquiryProcessTitle: 'O que acontece depois do seu pedido',
    enquiryProcess: 'Enviar um pedido de informação não significa fazer uma encomenda. A nossa equipa confirma a viabilidade, o preço final, o prazo estimado de preparação e os detalhes de entrega ou recolha. Se aceitar o orçamento, o processo indicado prevê o pagamento integral antecipado, combinado diretamente com a equipa. A encomenda só é confirmada depois de o pagamento ser recebido e verificado; os prazos são estimativas, não garantias.',
    shop: 'A coleção',
    all: 'Todos os presentes',
    play: 'BRINCAR',
    home: 'CASA',
    business: 'EMPRESAS',
    empty: 'Estamos a preparar a coleção. Volte em breve.',
    catalogError: 'Não foi possível carregar o catálogo. Tente novamente dentro de alguns instantes.',
    catalogRetry: 'Tentar novamente',
    loading: 'A encontrar presentes especiais…',
    loadingHint: 'A preparar tudo para si',
    requestQuote: 'Perguntar sobre este presente',
    buildWith: 'Pedir informações sobre este produto',
    productEnquiryTitle: 'Peça informações sobre os produtos',
    productEnquiryIntro: 'Indique como podemos contactá-lo, escolha os produtos e as quantidades. A nossa equipa confirmará a disponibilidade, o preço e o prazo. O envio do pedido não constitui uma encomenda.',
    productEnquiryBack: 'Voltar ao produto',
    productEnquiryProducts: 'Produtos do seu pedido',
    productEnquiryAddProduct: 'Adicionar outro produto',
    productEnquiryAddButton: 'Adicionar produto',
    productEnquiryChooseProduct: 'Escolha um produto',
    productEnquiryQuantity: 'Quantidade',
    productEnquiryRemoveProduct: 'Remover produto',
    productEnquiryMessage: 'Dúvida ou nota de personalização (opcional)',
    productEnquiryConsent: 'Autorizo a utilização dos meus contactos e do pedido de informação para me responderem.',
    productEnquirySubmit: 'Enviar pedido de informação',
    productEnquirySent: 'Obrigado! O seu pedido de informação foi enviado à nossa equipa.',
    productEnquiryNoProducts: 'Escolha pelo menos um produto para continuar.',
    productEnquiryAddLimit: 'Pode incluir até 10 produtos num pedido.',
    productEnquiryUnavailableProduct: 'Este produto já não está disponível. Remova-o e escolha outro.',
    productEnquiryError: 'Não foi possível enviar o seu pedido. Tente novamente mais tarde.',
    productEnquiryUnavailable: 'O envio de emails não está configurado no servidor. Contacte-nos diretamente.',
    imageNumber: (current: number, total: number) => `Imagem ${current} de ${total}`,
    previousImage: 'Mostrar imagem anterior do produto',
    nextImage: 'Mostrar imagem seguinte do produto',
    viewImageFullscreen: 'Ver imagem em ecrã inteiro',
    exitImageFullscreen: 'Sair do ecrã inteiro',
    fullscreenUnavailable: 'A visualização em ecrã inteiro não está disponível neste navegador.',
    noPrice: 'Solicitar orçamento',
    backShop: 'Voltar à coleção',
    builderEyebrow: 'A sua ideia, feita à medida',
    builderTitle: 'Vamos criar um presente especial.',
    builderOrientation: 'Indique a ocasião e para quem é o presente. Depois, escolha os produtos e os seus contactos.',
    reviewInstructions: 'Indique os seus contactos, reveja as escolhas e envie o pedido.',
    giftDetails: 'Detalhes do presente',
    editGiftDetails: 'Editar detalhes do presente',
    editProductChoices: 'Editar produtos escolhidos',
    noProductsSelected: 'Nenhum produto selecionado.',
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
    addBudget: 'Adicione um orçamento para personalizar as sugestões',
    addPreferences: 'Conte-nos os interesses para personalizar as ideias',
    addCardMessage: 'Adicione uma mensagem pessoal para o cartão',
    addPhone: 'Adicione um número para podermos contactar diretamente',
    addDeliveryAddress: 'Adicionar endereço de entrega',
    addressDeliveryNote: 'Indique o endereço para planearmos a entrega e estimarmos o custo. Confirmaremos o valor final consigo.',
    addressDetailsPrompt: 'Indique os detalhes que souber para encontrarmos o local de entrega.',
    addressEntryMethod: 'Como pretende indicar o endereço?',
    addressEnterManually: 'Escrever endereço',
    addressUseMap: 'Usar mapa',
    addressEditDetails: 'Editar detalhes',
    addressDoneEditing: 'Concluir',
    chooseAddressOnMap: 'Abrir mapa',
    editAddressOnMap: 'Alterar marcador',
    addAddressPlaceName: 'Adicionar local ou ponto de referência',
    addAddressRoad: 'Adicionar rua ou estrada',
    addAddressHouseNumber: 'Adicionar número da casa',
    addAddressNeighbourhood: 'Adicionar bairro ou zona',
    addAddressDistrict: 'Adicionar distrito',
    addAddressCity: 'Adicionar cidade ou município',
    addAddressProvince: 'Adicionar província',
    addAddressPostalCode: 'Adicionar código postal',
    addAddressCountry: 'Adicionar país',
    hideOptionalField: (field: string) => `Ocultar ${field}`,
    showOptionalField: (field: string) => `Adicionar ${field}`,
    mapLoading: 'A carregar o mapa…',
    mapOptIn: 'O OpenStreetMap recebe pedidos do mapa, os dados do seu IP/rede e as coordenadas do marcador para procurar o endereço.',
    chooseProducts: 'Adicione produtos da coleção pública (opcional)',
    review: 'A sua ideia de presente',
    cardMessage: 'A sua mensagem',
    name: 'O seu nome',
    email: 'Endereço de email',
    phone: 'Telefone',
    preferredContact: 'Como prefere que a nossa equipa entre em contacto?',
    contactByEmail: 'Email',
    contactByPhone: 'Chamada telefónica',
    contactByWhatsApp: 'WhatsApp',
    deliveryAddress: 'Endereço de entrega',
    addressCoordinates: 'Coordenadas do marcador',
    addressNoDetails: 'Não foram encontrados detalhes do endereço. Pode adicioná-los manualmente.',
    addressPlaceName: 'Local / ponto de referência',
    addressRoad: 'Rua / estrada',
    addressHouseNumber: 'Número da casa',
    addressNeighbourhood: 'Bairro / zona',
    addressDistrict: 'Distrito',
    addressCity: 'Cidade / município',
    addressProvince: 'Província',
    addressPostalCode: 'Código postal',
    addressCountry: 'País',
    addressPlacePlaceholder: 'Nome do local no mapa, se disponível',
    addressRoadPlaceholder: 'Preenchido com dados do mapa, se disponíveis',
    addressNeighbourhoodPlaceholder: 'ex.: Polana Cimento',
    addressDistrictPlaceholder: 'ex.: KaMpfumo',
    addressCityPlaceholder: 'ex.: Maputo',
    addressProvincePlaceholder: 'ex.: Maputo',
    submit: 'Enviar pedido',
    sending: 'A enviar…',
    sent: 'Obrigado! O seu pedido foi enviado à nossa equipa.',
    submitError: 'Não foi possível enviar o pedido. Tente novamente mais tarde.',
    submitErrorNotConfigured: 'O envio de emails não está configurado no servidor. Contacte-nos directamente.',
    submitErrorProvider: 'O serviço de email não conseguiu aceitar o seu pedido. Tente novamente mais tarde.',
    required: 'Preencha os campos obrigatórios.',
    privacyConsent: 'Autorizo a utilização dos dados que indicar para responder a este pedido.',
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
    faqTitle: 'Respostas úteis às suas dúvidas.',
    faqBody: 'Encontre orientações práticas sobre pedidos, prazos, devoluções, amostras e recompensas. A nossa equipa confirma os detalhes de cada pedido.',
    reviewsTitle: 'Partilhe a sua opinião ou comunique um problema.',
    reviewsBody: 'Escolha se pretende partilhar a sua opinião ou comunicar um problema. Os envios são guardados em privado e enviados por email à equipa; não são publicados no website.',
    feedbackType: 'O que pretende fazer?',
    leaveReview: 'Deixar uma avaliação',
    reportProblem: 'Comunicar um problema',
    problemEmail: 'Endereço de email (para contacto)',
    orderReference: 'Referência do pedido ou contacto (opcional)',
    problemText: 'Conte-nos o que aconteceu',
    problemTextHint: 'Descreva o problema e os detalhes que possam ajudar a equipa',
    reviewConsentProblem: 'Concordo que este relato, o meu endereço de email e o meu nome e referência de pedido opcionais sejam guardados e enviados por email à equipa da The Discovery Box para acompanhamento.',
    problemSent: 'Obrigado. O seu relato foi guardado e enviado em privado à nossa equipa.',
    problemSavedEmailError: 'O seu relato foi guardado, mas não foi possível avisar a equipa por email. Contacte-nos directamente para podermos dar seguimento.',
    reviewRating: 'A sua classificação',
    reviewRatingOption: (rating: number) => `${rating} ${rating === 1 ? 'estrela' : 'estrelas'}`,
    reviewText: 'A sua avaliação',
    reviewTextHint: 'Conte-nos sobre a sua experiência',
    reviewName: 'Nome (opcional)',
    reviewConsent: 'Concordo que esta avaliação e o meu nome opcional sejam guardados e enviados por email à equipa da The Discovery Box para fins de opinião.',
    reviewSubmit: 'Enviar avaliação',
    reviewSending: 'A enviar…',
    reviewSent: 'Obrigado por partilhar a sua opinião. A avaliação foi guardada e enviada em privado à nossa equipa.',
    reviewSavedEmailError: 'A sua avaliação foi guardada, mas não foi possível avisar a equipa por email. Contacte-nos directamente se precisar de uma resposta.',
    reviewError: 'Não foi possível guardar a sua avaliação. Tente novamente mais tarde.',
    faqQuestions: [
      {
        question: 'O que devo fazer se o pedido chegar danificado, incorreto ou incompleto?',
        answer: 'Contacte a equipa em privado com os detalhes relevantes. Guarde o artigo e a embalagem original enquanto a equipa analisa a situação. A equipa avaliará o ocorrido e discutirá uma solução adequada; o resultado depende de cada caso.',
      },
      {
        question: 'Posso cancelar um pedido ou alterar um design personalizado?',
        answer: 'Contacte a equipa assim que possível. A possibilidade de cancelamento ou alteração depende da fase do pedido; os materiais, compras especiais ou trabalho já realizado podem ter custos associados. Alterações após a aprovação do design poderão não ser possíveis e podem afetar o preço ou o prazo estimado.',
      },
      {
        question: 'Posso devolver um artigo ou receber um reembolso?',
        answer: 'Devoluções, trocas e reembolsos são avaliados caso a caso. Contacte a equipa antes de devolver qualquer artigo. Devoluções por mudança de ideia poderão não ser aceites para artigos personalizados, feitos por encomenda ou adquiridos especialmente. Se houver um problema confirmado, a equipa poderá considerar uma reparação, substituição, reembolso ou outra solução acordada.',
      },
      {
        question: 'Há preços para pedidos em quantidade e personalização diferente em cada artigo?',
        answer: 'Há preços especiais para quantidades em alguns produtos. Os limites de quantidade, nomes individuais, designs diferentes e limites de caracteres dependem do produto e do projeto. Envie um pedido com o produto, quantidade e personalização pretendida para a equipa confirmar a viabilidade e o preço.',
      },
      {
        question: 'Com quanta antecedência devo fazer o pedido?',
        answer: 'Como orientação geral, um pedido de uma unidade poderá demorar cerca de 3–7 dias; pedidos pequenos devem ser enviados com pelo menos 48 horas de antecedência e pedidos grandes ou em quantidade com pelo menos um mês. São recomendações, não prazos garantidos de conclusão ou entrega. Indique a data pretendida no pedido para a equipa confirmar uma estimativa.',
      },
      {
        question: 'Posso pedir uma amostra?',
        answer: 'Poderão estar disponíveis amostras em miniatura de alguns produtos maiores. Uma amostra em tamanho real poderá ter um custo adicional de materiais e produção. A equipa confirma a disponibilidade, o preço e o prazo de cada produto.',
      },
      {
        question: 'Como funcionam os carimbos e as recompensas de fidelidade?',
        answer: 'As informações do programa descrevem um carimbo por cada compra elegível concluída, uma recompensa de entrega gratuita na quinta compra elegível para entregas na Grande Maputo e Matola, e um presente The Discovery Box na décima primeira compra. Os carimbos seguem um ciclo de 12 meses. A elegibilidade, utilização das recompensas e os termos do programa devem ser confirmados pela equipa.',
      },
    ],
    faqContact: 'Ainda tem dúvidas? Contacte a nossa equipa.',
    faqReportProblem: 'Pretende partilhar a sua opinião ou comunicar um problema?',
    instagramTitle: 'Acompanhe pequenas descobertas.',
    instagramBody: 'Leia o código para nos encontrar no Instagram, partilhe o seu momento Discovery e identifique @the_discoverybox.',
    instagramScan: 'Leia para seguir',
    instagramQrAlt: 'Código QR do Instagram para @the_discoverybox',
    contactOptions: 'Os contactos estão a ser confirmados. Ainda pode enviar um pedido através do criador de presentes.',
    contactEmail: 'Envie-nos um email',
    privacyTitle: 'Aviso de privacidade',
    privacyBody: 'Este aviso explica que informações são utilizadas quando navega no website, utiliza o assistente, pede recomendações de presentes ou envia um pedido.',
    privacySections: [
      {
        title: 'Informações fornecidas por si',
        paragraphs: [
          'Se enviar um pedido de presente, o formulário solicita o seu nome, endereço de email, número de telefone opcional, método de contacto preferido, endereço de entrega opcional e detalhes sobre a ideia de presente. Estes podem incluir a ocasião, o destinatário, o orçamento, as preferências, uma mensagem para o cartão e os produtos selecionados. Se escolher um marcador no mapa, as coordenadas e os pedidos do mapa são enviados aos serviços OpenStreetMap para procurar os detalhes do endereço. Os detalhes do pedido são enviados por email à equipa para que possa responder. Num formulário separado, pode pedir informações sobre produtos, indicando as quantidades, os seus contactos e uma nota opcional; estes dados e as imagens públicas dos produtos escolhidos são enviados por email à equipa para que possa responder. Se deixar uma avaliação, a classificação e o texto, juntamente com o nome opcional, são guardados na nossa base de dados e enviados por email à equipa. Se comunicar um problema, o relato e o endereço de email obrigatório, juntamente com o nome ou a referência do pedido opcionais, são guardados e enviados para que a equipa possa responder. As avaliações e os relatos são privados e não são publicados no website.',
          'Se utilizar o assistente, as mensagens que enviar são processadas para gerar respostas. Não inclua no chat nem noutros campos de texto livre informações pessoais sensíveis, palavras-passe, dados de pagamento, números de identificação, informações de saúde ou fotografias privadas.',
        ],
      },
      {
        title: 'Como as informações são utilizadas e partilhadas',
        paragraphs: [
          'Os dados do pedido, incluindo qualquer endereço e coordenadas que escolha fornecer, são utilizados para responder e enviados ao serviço de email configurado para que a equipa os receba. Se optar por utilizar o mapa, os serviços OpenStreetMap recebem pedidos para apresentar os mapas e procurar as coordenadas selecionadas; o fornecedor também poderá receber o seu endereço IP e metadados normais dos pedidos. A utilização do mapa é opcional e pode introduzir o endereço manualmente. As avaliações e os relatos de problemas são guardados na base de dados da loja e enviados à equipa através do serviço de email configurado. Os campos de nome, email e telefone não são incluídos nos pedidos de recomendações. No entanto, tudo o que escrever no chat ou nos campos de texto livre é enviado, como parte desse texto, ao fornecedor de IA utilizado nessa funcionalidade. Por isso, não introduza aí dados pessoais ou sensíveis.',
          'Quando pede recomendações, a ocasião, o destinatário, o orçamento e as preferências são enviados à Ollama para comparar a sua ideia com o catálogo público. As mensagens do chat também são enviadas à Ollama para gerar respostas do assistente.',
        ],
      },
      {
        title: 'Informações guardadas no navegador',
        paragraphs: [
          'O website guarda no armazenamento local do navegador as suas preferências de idioma e de tema claro/escuro. Estas preferências ajudam o website a recordar as suas escolhas e não fazem parte do pedido de presente.',
          'Também registamos análises do website que respeitam a privacidade, como visualizações de páginas e algumas interações (por exemplo, pesquisas através do comprimento do texto, filtros, visualizações de produtos e etapas do criador). As análises incluem um identificador aleatório guardado neste separador do navegador durante a sessão, o caminho da página sem parâmetros nem fragmentos, a origem do website de referência e detalhes limitados do evento. Uma sessão representa um separador do navegador, não uma pessoa única verificada, e não associa atividade entre dispositivos. O texto pesquisado, mensagens do chat, conteúdo dos formulários, dados de contacto e endereços IP não são guardados na tabela de análises. Os dados ajudam a compreender as visitas e a interação; o período de conservação ainda precisa de ser decidido e aprovado.',
        ],
      },
      {
        title: 'Dúvidas sobre as suas informações',
        paragraphs: [
          'Para esclarecer dúvidas sobre informações enviadas ou sobre um pedido, contacte a equipa em privado através de Info.discoverybox@gmail.com. Não publique informações pessoais ou de pagamento.',
        ],
      },
    ],
    termsTitle: 'Informações importantes',
    termsBody: 'A disponibilidade, os conteúdos, a personalização, os preços e a entrega são confirmados pela The Discovery Box. As seleções do criador de presentes são apenas sugestões e não constituem uma encomenda ou oferta vinculativa. Este website não permite pagamentos nem reserva de encomendas.',
    termsSections: [
      {
        title: 'Navegação, catálogo e pedidos',
        paragraphs: [
          'O website permite explorar o catálogo público e enviar um pedido. Uma ficha de produto, seleção no criador de presentes ou recomendação é apenas informativa. Não garante stock, capacidade de produção, adequação ou disponibilidade.',
          'Os preços apresentados estão em meticais moçambicanos (MZN) e podem não corresponder ao preço final de um pedido personalizado ou de várias unidades. A equipa confirma as especificações finais, o preço, eventuais custos de entrega e o prazo estimado de preparação. O envio de um pedido não constitui uma encomenda, não reserva um artigo nem significa que a equipa o aceitou.',
        ],
      },
      {
        title: 'Orçamentos, pagamento e confirmação',
        paragraphs: [
          'Após analisar um pedido, a equipa confirma se pode produzir o artigo e acorda consigo o modelo, tamanho, quantidade, personalização, preço e prazo. O processo indicado pelo proprietário prevê o pagamento integral antecipado depois da aprovação do orçamento. M-Pesa e e-Mola são os métodos de pagamento indicados; a equipa fornecerá diretamente as instruções atualizadas.',
          'Este website não recebe pagamentos. Não utilize dados de pagamento fornecidos no chat ou numa mensagem não verificada. A encomenda só é considerada confirmada depois de a equipa receber e verificar o pagamento acordado.',
        ],
      },
      {
        title: 'Designs personalizados e alterações',
        paragraphs: [
          'A equipa deve confirmar se o design, material, tamanho, cor, quantidade, logótipo ou outra personalização pretendida é viável. Antes de aprovar o design final, verifique cuidadosamente nomes, ortografia, cores, tamanhos, quantidades e outras especificações.',
          'A produção pode começar após a aprovação do design. As alterações pedidas posteriormente podem não ser possíveis e podem implicar custos adicionais ou um novo prazo estimado. A equipa confirmará as opções disponíveis antes de avançar.',
        ],
      },
      {
        title: 'Preparação, prazos e entrega',
        paragraphs: [
          'Os prazos estimados de preparação e entrega dependem do produto, quantidade, personalização, materiais e calendário de produção. As recomendações gerais do proprietário são aproximadamente 3–7 dias para uma unidade, pelo menos um mês de antecedência para pedidos grandes ou em quantidade e pelo menos 48 horas para pedidos pequenos. São recomendações, não prazos garantidos de conclusão ou entrega. A produção urgente poderá ser possível, poderá ter um custo adicional e terá de ser confirmada pela equipa.',
          'A equipa e o cliente acordam os detalhes de recolha ou entrega para cada pedido, incluindo local, data, método, custo e contacto do destinatário. As zonas, taxas e prazos de entrega não são universais. Em caso de atraso, a equipa deverá comunicar uma estimativa atualizada assim que for razoavelmente possível; contacte a equipa para discutir uma solução justa se o atraso se tornar excessivo.',
        ],
      },
      {
        title: 'Cancelamentos, devoluções e reembolsos',
        paragraphs: [
          'Contacte a equipa assim que possível para pedir o cancelamento. A aceitação depende da fase do pedido. Podem já ter sido incorridos custos com personalização, compras especiais, materiais ou trabalho realizado.',
          'As devoluções e trocas são avaliadas caso a caso. Contacte a equipa antes de devolver qualquer artigo. Uma devolução por mudança de ideia poderá não ser aceite para produtos personalizados, feitos por encomenda ou adquiridos especialmente; um artigo normal ainda não expedido poderá ser analisado. Se receber um artigo danificado, defeituoso, incorreto, incompleto ou materialmente diferente do design aprovado, contacte a equipa em privado com os detalhes relevantes. Guarde o artigo danificado e a embalagem original até a equipa analisar a situação.',
          'Poderá ser considerado um reembolso quando uma encomenda não puder ser cumprida conforme acordado, quando um problema confirmado não puder ser razoavelmente resolvido ou quando outras circunstâncias o justifiquem. Poderá ser proposta primeiro uma reparação, substituição ou outra solução acordada. Se aprovado, a equipa confirmará o valor, método e prazo previsto do reembolso. Estas políticas, avaliadas caso a caso, não limitam os direitos previstos na legislação aplicável.',
        ],
      },
      {
        title: 'Pedidos em quantidade e amostras',
        paragraphs: [
          'Há preços especiais para quantidades em alguns produtos. Os limites de quantidade, a personalização de nomes individuais, os designs diferentes e os limites de caracteres variam conforme o produto e o projeto e devem ser confirmados pela equipa. Poderão estar disponíveis amostras em miniatura de alguns produtos maiores; uma amostra em tamanho real poderá ter um custo adicional. A equipa confirma disponibilidade, custo e prazo.',
        ],
      },
      {
        title: 'Programa de fidelidade',
        paragraphs: [
          'As informações do programa fornecidas pelo proprietário descrevem um carimbo por cada compra elegível concluída, uma recompensa de entrega gratuita na quinta compra para entregas elegíveis na Grande Maputo e Matola, e um presente The Discovery Box na décima primeira compra. A contagem de carimbos segue um ciclo de 12 meses. A elegibilidade, utilização das recompensas, área de entrega e acumulação com promoções dependem dos termos do programa e da confirmação da equipa.',
          'A ligação enviada após a compra dá acesso ao acompanhamento da encomenda e ao cartão digital de fidelidade. O assistente não consegue consultar os seus pedidos, pagamentos ou registos de fidelidade. Contacte a equipa em privado se precisar de ajuda com uma ligação, carimbo ou recompensa em falta.',
        ],
      },
    ],
    occasions: ['Aniversário', 'Aniversário de relacionamento', 'Agradecimento', 'Nascimento', 'Celebração', 'Evento empresarial', 'Outra ocasião'],
    recipients: ['Amigo/a', 'Companheiro/a', 'Criança', 'Familiar', 'Colega', 'Cliente', 'Outra pessoa'],
    corporateRecipients: ['Colaboradores ou equipa', 'Clientes', 'Parceiros de negócio', 'Participantes no evento', 'Convidados VIP', 'Fornecedores', 'Outra opção'],
    notFound: 'Não encontrámos esta página.',
  },
} as const;

type TextKey = keyof typeof copy.en;

const familyName = (family: CatalogItem['family']) => family;

function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
}

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

function CatalogErrorNotice({ message, retryLabel, onRetry }: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="catalog-error notice notice-error" role="alert">
      <p>{message}</p>
      <button className="button button-outline" type="button" onClick={onRetry}>{retryLabel}</button>
    </div>
  );
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
  const lastAnalyticsPathRef = useRef('');
  const lastAnalyticsProductRef = useRef('');
  const detailImageRef = useRef<HTMLDivElement>(null);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState('');
  const clearAssistantGiftDraft = useCallback(() => setAssistantGiftDraft(null), []);
  const t = copy[language];
  const currentLocation = new URL(currentUrl, window.location.origin);
  const path = currentLocation.pathname.replace(/\/+$/, '') || '/';
  const catalogRequestUrl = (() => {
    const params = new URLSearchParams();
    if (path === '/') {
      params.set('view', 'overview');
    } else if (path === '/corporate') {
      params.set('view', 'collections');
    } else if (path === '/shop' || path.startsWith('/shop/')) {
      params.set('view', 'shop');
      for (const key of ['family', 'collection', 'category', 'q', 'sort', 'page']) {
        const value = currentLocation.searchParams.get(key);
        if (value) params.set(key, value);
      }
    } else if (path.startsWith('/product/')) {
      params.set('view', 'product');
      params.set('id', decodeURIComponent(path.slice('/product/'.length)));
    } else if (path === '/gift-builder' || path === '/product-enquiry') {
      params.set('view', 'all');
    }
    return params.size ? `/api/catalog?${params.toString()}` : '';
  })();

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsImageFullscreen(document.fullscreenElement === detailImageRef.current);
    };
    document.addEventListener('fullscreenchange', syncFullscreenState);
    return () => document.removeEventListener('fullscreenchange', syncFullscreenState);
  }, []);

  const toggleImageFullscreen = async () => {
    const imageFrame = detailImageRef.current;
    setFullscreenError('');
    if (!imageFrame) return;
    try {
      if (document.fullscreenElement === imageFrame) {
        await document.exitFullscreen();
      } else if (imageFrame.requestFullscreen) {
        await imageFrame.requestFullscreen();
      } else {
        setFullscreenError(t.fullscreenUnavailable);
      }
    } catch (error) {
      console.error('Could not change product image fullscreen mode', error);
      setFullscreenError(t.fullscreenUnavailable);
    }
  };

  useEffect(() => {
    if (lastAnalyticsPathRef.current === path) return;
    lastAnalyticsPathRef.current = path;
    trackAnalyticsEvent('page_view', path, { language });
  }, [language, path]);

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
    if (event.defaultPrevented || event.button !== 0) return;
    if (!(event.target instanceof Element)) return;
    const anchor = event.target.closest('a[href]');
    if (!(anchor instanceof HTMLAnchorElement) || anchor.hasAttribute('download')) return;

    if (anchor.href.startsWith('mailto:')) {
      trackAnalyticsEvent('contact_click', path, { method: 'email' });
      return;
    }
    try {
      const linkedUrl = new URL(anchor.href);
      if (linkedUrl.hostname === 'wa.me' || linkedUrl.hostname === 'api.whatsapp.com') {
        trackAnalyticsEvent('contact_click', path, { method: 'whatsapp' });
        return;
      }
      if (linkedUrl.origin !== window.location.origin) return;
    } catch {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (anchor.target && anchor.target !== '_self')) return;

    event.preventDefault();
    const destination = new URL(anchor.href, window.location.origin);
    if (destination.pathname === '/shop') {
      const currentParams = currentLocation.searchParams;
      const nextParams = destination.searchParams;
      const changedFilter = (['family', 'collection', 'category', 'sort'] as const)
        .find((key) => currentParams.get(key) !== nextParams.get(key));
      if (changedFilter) trackAnalyticsEvent('shop_filter', '/shop', { filterType: changedFilter });
    }
    navigateInternal(anchor.href);
  };

  useEffect(() => {
    try {
      window.localStorage.setItem('discovery-language', language);
    } catch (error) {
      console.warn('Could not save the language preference', error);
    }
    document.documentElement.lang = language;
  }, [language]);

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

  const catalogRequestIdRef = useRef(0);
  const refreshCatalog = useCallback(async () => {
    const requestId = ++catalogRequestIdRef.current;
    if (!catalogRequestUrl) {
      const emptyCatalog: CatalogResponse = { items: [], collections: [], total: 0 };
      setCatalog(emptyCatalog);
      setCatalogState('ready');
      return emptyCatalog;
    }
    try {
      const response = await fetch(catalogRequestUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('Catalogue refresh failed');
      const nextCatalog = await response.json() as CatalogResponse;
      if (requestId === catalogRequestIdRef.current) {
        setCatalog(nextCatalog);
        setCatalogState('ready');
      }
      return nextCatalog;
    } catch (error) {
      if (requestId === catalogRequestIdRef.current) setCatalogState('error');
      throw error;
    }
  }, [catalogRequestUrl]);

  const retryCatalog = useCallback(() => {
    setCatalogState('loading');
    void refreshCatalog().catch((error) => {
      console.error('Could not retry catalogue load', error);
    });
  }, [refreshCatalog]);

  useEffect(() => {
    setCatalog({ items: [], collections: [], total: 0 });
    setCatalogState(catalogRequestUrl ? 'loading' : 'ready');
    void refreshCatalog().catch(() => {});
    fetch('/api/public-config').then((response) => {
      if (!response.ok) throw new Error('Contact configuration request failed');
      return response.json() as Promise<{ email: string; whatsapp: string }>;
    }).then(setContact).catch(() => setContact({ email: '', whatsapp: '' }));
  }, [catalogRequestUrl, refreshCatalog]);

  const itemById = useMemo(() => new Map(catalog.items.map((item) => [item.id, item])), [catalog.items]);
  const selectedItemId = path.startsWith('/product/') ? decodeURIComponent(path.slice('/product/'.length)) : '';
  const selectedItem = itemById.get(selectedItemId);
  const [selectedProductImages, setSelectedProductImages] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!selectedItem) {
      lastAnalyticsProductRef.current = '';
      return;
    }
    if (lastAnalyticsProductRef.current === selectedItem.id) return;
    lastAnalyticsProductRef.current = selectedItem.id;
    trackAnalyticsEvent('product_view', path, {
      productId: selectedItem.id,
      family: selectedItem.family,
    });
  }, [path, selectedItem]);
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

  useEffect(() => {
    const productMetadata = selectedItem
      ? {
        id: selectedItem.id,
        name: nameFor(selectedItem),
        description: descriptionFor(selectedItem),
        image: productImage(selectedItem),
      }
      : undefined;
    const metadata = getPageMetadata(path, language, currentLocation.searchParams, productMetadata);
    const canonicalParams = getCanonicalSearchParams(currentLocation.searchParams).toString();
    const canonicalUrl = `${window.location.origin}${path}${canonicalParams ? `?${canonicalParams}` : ''}`;
    const imageUrl = new URL(metadata.image, window.location.origin).toString();
    const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      element.content = content;
    };
    document.title = metadata.title;
    setMeta('name', 'description', metadata.description);
    setMeta('name', 'robots', metadata.robots);
    setMeta('property', 'og:title', metadata.title);
    setMeta('property', 'og:description', metadata.description);
    setMeta('property', 'og:type', metadata.type);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:image:alt', metadata.title);
    setMeta('property', 'og:site_name', 'The Discovery Box');
    setMeta('property', 'og:locale', language === 'pt' ? 'pt_MZ' : 'en_US');
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', metadata.title);
    setMeta('name', 'twitter:description', metadata.description);
    setMeta('name', 'twitter:image', imageUrl);
    setMeta('name', 'twitter:image:alt', metadata.title);
    let canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.append(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;
  }, [currentUrl, language, path, selectedItem]);

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
      ? <CatalogErrorNotice message={t.catalogError} retryLabel={t.catalogRetry} onRetry={retryCatalog} />
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
              <a className="button hero-browse-button" href="/shop">{t.heroBrowse}<span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <img className="hero-artwork" src="/discovery-box-adventure.png" alt="" aria-hidden="true" />
          <p className="hero-artwork-message">
            {t.heroArtworkMessage.map((line) => <span key={line}>{line}</span>)}
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
                const giftCount = catalog.familyCounts?.[family] ?? catalog.items.filter((item) => item.family === family).length;
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
    const searchQuery = currentLocation.searchParams.get('q')?.trim() || '';
    const sortParam = currentLocation.searchParams.get('sort');
    const sortOrder = sortParam === 'price-low' || sortParam === 'price-high' ? sortParam : 'featured';
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
    const categoryItems = categoryParam
      ? collectionItems.filter((item) => item.category === categoryParam)
      : collectionItems;
    const normalizedQuery = normalizeSearchText(searchQuery);
    const visible = normalizedQuery
      ? categoryItems.filter((item) => {
        const collection = collectionForItem(item);
        const searchableText = normalizeSearchText([
          item.id,
          item.family,
          item.name_en,
          item.name_pt,
          item.description_en,
          item.description_pt,
          item.category || '',
          collection?.name_en || '',
          collection?.name_pt || '',
        ].join(' '));
        return searchableText.includes(normalizedQuery);
      })
      : categoryItems;
    const sortedVisible = [...visible].sort((left, right) => {
      if (sortOrder === 'featured') return 0;
      const leftPrice = left.price_mzn == null || String(left.price_mzn).trim() === '' ? null : Number(left.price_mzn);
      const rightPrice = right.price_mzn == null || String(right.price_mzn).trim() === '' ? null : Number(right.price_mzn);
      const validLeftPrice = leftPrice !== null && Number.isFinite(leftPrice) ? leftPrice : null;
      const validRightPrice = rightPrice !== null && Number.isFinite(rightPrice) ? rightPrice : null;
      if (validLeftPrice === null) return validRightPrice === null ? 0 : 1;
      if (validRightPrice === null) return -1;
      return sortOrder === 'price-low' ? validLeftPrice - validRightPrice : validRightPrice - validLeftPrice;
    });
    const productsPerPage = 6;
    const pageCount = Math.max(1, Math.ceil((catalog.total ?? sortedVisible.length) / productsPerPage));
    const requestedPage = Number(currentLocation.searchParams.get('page') || 1);
    const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, pageCount)
      : 1;
    const pageItems = sortedVisible;
    const shopFilterUrl = (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(currentLocation.searchParams);
      params.delete('page');
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      const query = params.toString();
      return `/shop${query ? `?${query}` : ''}`;
    };
    const submitShopSearch = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const params = new URLSearchParams();
      const query = String(formData.get('q') || '').trim();
      const selectedSort = String(formData.get('sort') || 'featured');
      const formFamily = String(formData.get('family') || '');
      const formCollection = String(formData.get('collection') || '');
      const formCategory = String(formData.get('category') || '');
      const normalizedSubmittedQuery = normalizeSearchText(query);
      const searchResultCount = normalizedSubmittedQuery
        ? categoryItems.filter((item) => {
          const collection = collectionForItem(item);
          return normalizeSearchText([
            item.id,
            item.family,
            item.name_en,
            item.name_pt,
            item.description_en,
            item.description_pt,
            item.category || '',
            collection?.name_en || '',
            collection?.name_pt || '',
          ].join(' ')).includes(normalizedSubmittedQuery);
        }).length
        : categoryItems.length;
      trackAnalyticsEvent('shop_search', '/shop', {
        queryLength: query.length,
        resultCount: searchResultCount,
      });
      if (query) params.set('q', query);
      if (selectedSort !== 'featured') params.set('sort', selectedSort);
      if (formFamily) params.set('family', formFamily);
      if (formCollection) params.set('collection', formCollection);
      if (formCategory) params.set('category', formCategory);
      const queryString = params.toString();
      navigateInternal(`/shop${queryString ? `?${queryString}` : ''}`);
    };
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
    const activeTaxonomyLabel = selectedCollection
      ? collectionNameFor(selectedCollection)
      : categoryParam
        ? categoryNameFor(categoryParam)
        : family !== 'ALL'
          ? familyName(family)
          : t.all;
    const hasActiveTaxonomyFilter = Boolean(selectedCollection || categoryParam || family !== 'ALL');
    page = (
      <section className="section page-section shop-layout">
        <div className="shop-main">
          <div className="shop-intro">
            <div className="page-heading">
              <span className="eyebrow eyebrow-coral">{t.navShop}</span>
              <h1>{pageTitle}</h1>
              <p>{selectedCollection ? (language === 'en' ? selectedCollection.tagline_en : selectedCollection.tagline_pt) || t.productsBody : t.productsBody}</p>
            </div>
            <form className="shop-controls" onSubmit={submitShopSearch} role="search">
              <label className="shop-search-field">
                <span>{t.shopSearchLabel}</span>
                <input type="search" name="q" defaultValue={searchQuery} placeholder={t.shopSearchPlaceholder} />
              </label>
              <label className="shop-sort-field">
                <span>{t.shopSortLabel}</span>
                <select name="sort" defaultValue={sortOrder}>
                  <option value="featured">{t.shopSortFeatured}</option>
                  <option value="price-low">{t.shopSortPriceLow}</option>
                  <option value="price-high">{t.shopSortPriceHigh}</option>
                </select>
              </label>
              {familyParam && <input type="hidden" name="family" value={familyParam} />}
              {selectedCollection && <input type="hidden" name="collection" value={selectedCollection.id} />}
              {categoryParam && <input type="hidden" name="category" value={categoryParam} />}
              <button className="button button-primary shop-search-submit" type="submit">{t.shopSearchSubmit}</button>
            </form>
            {availableCategories.length > 0 && (
              <div className="taxonomy-filter-group shop-category-filter">
                <div className="filter-row taxonomy-filter-row">
                  {availableCategories.map((category) => {
                    const categoryName = categoryNameFor(category);
                    return (
                      <a
                        className={`filter-chip${categoryParam === category ? ' filter-active' : ''}`}
                        href={shopFilterUrl({ category: categoryParam === category ? null : category })}
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
            <details
              className="shop-sidebar-details"
              key={`${family}:${collectionParam || ''}:${categoryParam || ''}`}
              open={hasActiveTaxonomyFilter}
            >
              <summary>
                <span>{t.browseCategories}</span>
                <span className="shop-sidebar-current">{activeTaxonomyLabel}</span>
              </summary>
              <nav className="shop-side-navigation" aria-label={t.browseCategories}>
                <a className={`shop-side-link${family === 'ALL' && !selectedCollection && !categoryParam ? ' shop-side-active' : ''}`} href={shopFilterUrl({ family: null, collection: null, category: null })}>
                  {t.all}
                </a>
                {(['PLAY', 'HOME', 'BUSINESS'] as const).map((world) => (
                  <div className="shop-side-world" key={world}>
                    <a
                      className={`shop-side-link${family === world ? ' shop-side-active' : ''}`}
                      href={shopFilterUrl({ family: world, collection: null, category: null })}
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
                            href={shopFilterUrl({ family: world, collection: collection.id, category: null })}
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
            {catalogState === 'ready' && ((catalog.total ?? sortedVisible.length) ? (
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
            ) : <p className="notice">{searchQuery ? t.shopNoResults(searchQuery) : t.empty}{searchQuery && <> <a className="text-link" href={shopFilterUrl({ q: null })} onClick={() => trackAnalyticsEvent('shop_search', '/shop', { queryLength: 0, resultCount: categoryItems.length })}>{t.clearShopSearch}</a></>}</p>)}
          </div>
          <div className="shop-guidance"><EnquiryGuidance t={t} compact /></div>
        </div>
      </section>
    );
  } else if (path === '/product-enquiry') {
    page = <ProductEnquiry
      catalog={catalog}
      catalogState={catalogState}
      initialProduct={currentLocation.searchParams.get('product') || ''}
      language={language}
      t={t}
      nameFor={nameFor}
      productImage={productImage}
      imageStyle={imageStyle}
      retryCatalog={retryCatalog}
    />;
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
            <div className="detail-image" ref={detailImageRef}>
              {activeImage
                ? <img src={activeImage} alt={`${nameFor(selectedItem)} — ${t.imageNumber(activeImageIndex + 1, productImages.length)}`} style={activeImageStyle} />
                : <span className="image-placeholder">✦</span>}
              {activeImage && <button
                className="gallery-fullscreen-toggle"
                type="button"
                aria-label={isImageFullscreen ? t.exitImageFullscreen : t.viewImageFullscreen}
                title={isImageFullscreen ? t.exitImageFullscreen : t.viewImageFullscreen}
                onClick={() => void toggleImageFullscreen()}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={isImageFullscreen
                    ? 'M8 3v5H3M16 3v5h5M8 21v-5H3m13 5v-5h5'
                    : 'M3 8V3h5M16 3h5v5M3 16v5h5m8 0h5v-5'} />
                </svg>
                <span>{isImageFullscreen ? t.exitImageFullscreen : t.viewImageFullscreen}</span>
              </button>}
              {productImages.length > 1 && (
                <span className="gallery-count" aria-live="polite">{t.imageNumber(activeImageIndex + 1, productImages.length)}</span>
              )}
            </div>
            {fullscreenError && <p className="notice notice-error" role="alert">{fullscreenError}</p>}
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
            <EnquiryGuidance t={t} compact />
            <div className="button-row"><a className="button button-primary" href={`/product-enquiry?product=${encodeURIComponent(selectedItem.id)}`}>{t.buildWith}</a></div>
          </div>
        </div>
      </section>
    ) : catalogState === 'loading' ? <section className="section page-section">{catalogNotice}</section>
      : <section className="section page-section">{catalogState === 'error'
        ? <CatalogErrorNotice message={t.catalogError} retryLabel={t.catalogRetry} onRetry={retryCatalog} />
        : <p className="notice">{t.notFound}</p>}</section>;
  } else if (path === '/gift-builder') {
    page = <GiftBuilder catalog={catalog} catalogState={catalogState} language={language} t={t} nameFor={nameFor} descriptionFor={descriptionFor} productImage={productImage} productImageStyle={productImageStyle} imageStyle={imageStyle} initialProduct={currentLocation.searchParams.get('product') || ''} assistantDraft={assistantGiftDraft} onAssistantDraftApplied={clearAssistantGiftDraft} refreshCatalog={refreshCatalog} retryCatalog={retryCatalog} />;
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
  } else if (path === '/faq') {
    page = (
      <section className="section content-page policy-page faq-page">
        <span className="eyebrow eyebrow-coral">{t.navHelp}</span>
        <h1>{t.faqTitle}</h1>
        <p className="policy-intro">{t.faqBody}</p>
        <div className="faq-list">
          {t.faqQuestions.map(({ question, answer }) => (
            <details className="faq-item" key={question} onToggle={(event) => {
              if (event.currentTarget.open) {
                trackAnalyticsEvent('faq_expand', '/faq', { questionIndex: t.faqQuestions.findIndex((item) => item.question === question) });
              }
            }}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
        <p className="faq-contact">{t.faqContact} <a href="/contact">{t.navContact}</a>.</p>
        <p className="faq-terms-link">{t.faqReportProblem} <a href="/reviews">{t.navReviews}</a>.</p>
        <p className="faq-terms-link"><a href="/terms">{t.terms}</a></p>
      </section>
    );
  } else if (path === '/reviews') {
    page = <CustomerReviews language={language} t={t} />;
  } else if (path === '/privacy') {
    page = (
      <section className="section content-page policy-page">
        <span className="eyebrow eyebrow-coral">{t.privacy}</span>
        <h1>{t.privacyTitle}</h1>
        <p className="policy-intro">{t.privacyBody}</p>
        {t.privacySections.map((section) => (
          <article className="policy-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        ))}
      </section>
    );
  } else if (path === '/terms') {
    page = (
      <section className="section content-page policy-page">
        <span className="eyebrow eyebrow-coral">{t.terms}</span>
        <h1>{t.termsTitle}</h1>
        <p className="policy-intro">{t.termsBody}</p>
        {t.termsSections.map((section) => (
          <article className="policy-section" key={section.title}>
            <h2>{section.title}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </article>
        ))}
      </section>
    );
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
          <a className={path === '/gift-builder' ? 'nav-active' : undefined} href="/gift-builder" aria-current={path === '/gift-builder' ? 'page' : undefined} onClick={() => setMobileMenuOpen(false)}>{t.navBuilder}</a>
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
        </div>
      </header>
      <main>{page}</main>
      <footer className="site-footer">
        <div className="footer-top"><a className="brand brand-footer" href="/"><img src="/official-logo.png" alt="The Discovery Box" /></a><span className="footer-description">{t.footer}</span></div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} The Discovery Box</span><div><a href="/faq">{t.navHelp}</a><a href="/reviews">{t.navReviews}</a><a href="/privacy">{t.privacy}</a><a href="/terms">{t.terms}</a><a href="/contact">{t.navContact}</a></div></div>
      </footer>
    </div>
    <AssistantWidget
      language={language}
      onNavigate={navigateInternal}
      onOpen={() => trackAnalyticsEvent('assistant_open', path)}
      onApplyGiftDraft={(draft) => {
        setAssistantGiftDraft(draft);
        navigateInternal('/gift-builder');
      }}
    />
    </>
  );
}

function CustomerReviews({ language, t }: { language: Language; t: typeof copy[Language] }) {
  const [submissionType, setSubmissionType] = useState<'review' | 'problem'>('review');
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<boolean | null>(null);

  const submitReview = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          submissionType,
          rating: submissionType === 'review' ? rating : null,
          review,
          name,
          email: submissionType === 'problem' ? email : '',
          orderReference: submissionType === 'problem' ? orderReference : '',
          consent,
          website: String(new FormData(event.currentTarget).get('website') || ''),
        }),
      });
      if (!response.ok) {
        setError(t.reviewError);
        return;
      }
      const result = await response.json() as { emailNotified?: boolean };
      trackAnalyticsEvent('feedback_submitted', '/reviews', { submissionType });
      setSaved(result.emailNotified === true);
    } catch {
      setError(t.reviewError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section content-page reviews-page">
      <span className="eyebrow eyebrow-coral">{t.navReviews}</span>
      <h1>{t.reviewsTitle}</h1>
      <p className="policy-intro">{t.reviewsBody}</p>
      {saved !== null ? (
        <p className={`notice${saved ? '' : ' notice-error'}`} role="status">
          {saved
            ? submissionType === 'review' ? t.reviewSent : t.problemSent
            : submissionType === 'review' ? t.reviewSavedEmailError : t.problemSavedEmailError}
        </p>
      ) : (
        <form className="review-form" onSubmit={submitReview}>
          <fieldset className="feedback-type">
            <legend>{t.feedbackType}</legend>
            <label><input type="radio" name="submissionType" value="review" checked={submissionType === 'review'} onChange={() => setSubmissionType('review')} />{t.leaveReview}</label>
            <label><input type="radio" name="submissionType" value="problem" checked={submissionType === 'problem'} onChange={() => setSubmissionType('problem')} />{t.reportProblem}</label>
          </fieldset>
          {submissionType === 'review' && <fieldset className="review-rating">
            <legend>{t.reviewRating}</legend>
            <div className="review-rating-options">
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    required={submissionType === 'review'}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                    aria-label={t.reviewRatingOption(value)}
                  />
                  <span aria-hidden="true">{value <= rating ? '★' : '☆'}</span>
                </label>
              ))}
            </div>
            <span className="review-rating-value">{t.reviewRatingOption(rating)}</span>
          </fieldset>}
          <label>{submissionType === 'review' ? t.reviewText : t.problemText}<textarea required minLength={5} maxLength={2000} value={review} onChange={(event) => setReview(event.target.value)} placeholder={submissionType === 'review' ? t.reviewTextHint : t.problemTextHint} /></label>
          <label>{t.reviewName}<input type="text" maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>
          {submissionType === 'problem' && <>
            <label>{t.problemEmail}<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>{t.orderReference}<input type="text" maxLength={120} value={orderReference} onChange={(event) => setOrderReference(event.target.value)} /></label>
          </>}
          <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <label className="consent-check"><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{submissionType === 'review' ? t.reviewConsent : t.reviewConsentProblem} <a href="/privacy">{t.privacy}</a></span></label>
          {error && <p className="notice notice-error" role="alert">{error}</p>}
          <button className="button button-primary" type="submit" disabled={busy}>{busy ? t.reviewSending : submissionType === 'review' ? t.reviewSubmit : t.reportProblem}</button>
        </form>
      )}
    </section>
  );
}

function ProductEnquiry({
  catalog, catalogState, initialProduct, language, t, nameFor, productImage, imageStyle, retryCatalog,
}: {
  catalog: CatalogResponse;
  catalogState: 'loading' | 'ready' | 'error';
  initialProduct: string;
  language: Language;
  t: typeof copy[Language];
  nameFor: (item: CatalogItem) => string;
  productImage: (item: CatalogItem) => string;
  imageStyle: (item: CatalogItem, index: number) => CSSProperties;
  retryCatalog: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialProduct ? [initialProduct] : []);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [productToAdd, setProductToAdd] = useState('');
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const productPickerRef = useRef<HTMLDivElement>(null);
  const productPickerTriggerRef = useRef<HTMLButtonElement>(null);
  const selectedProducts = selectedIds
    .map((id) => catalog.items.find((item) => item.id === id))
    .filter((item): item is CatalogItem => Boolean(item));
  const availableProducts = catalog.items.filter((item) => !selectedIds.includes(item.id));
  const productToAddItem = availableProducts.find((item) => item.id === productToAdd);

  useEffect(() => {
    if (!productPickerOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !productPickerRef.current?.contains(event.target)) {
        setProductPickerOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProductPickerOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [productPickerOpen]);

  const addProduct = () => {
    if (!productToAdd || selectedIds.includes(productToAdd)) return;
    if (selectedIds.length >= 10) {
      setError(t.productEnquiryAddLimit);
      return;
    }
    setSelectedIds((ids) => [...ids, productToAdd]);
    setProductToAdd('');
    setError('');
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!selectedIds.length) {
      setError(t.productEnquiryNoProducts);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/product-enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          language,
          products: selectedIds.map((productId) => ({
            productId,
            quantity: quantities[productId] || 1,
          })),
          message,
          consent,
          website: String(new FormData(event.currentTarget).get('website') || ''),
        }),
      });
      if (!response.ok) {
        setError(response.status === 503 ? t.productEnquiryUnavailable : t.productEnquiryError);
        return;
      }
      setSent(true);
      trackAnalyticsEvent('enquiry_submitted', '/product-enquiry', {
        productCount: selectedIds.length,
        language,
      });
    } catch {
      setError(t.productEnquiryError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section content-page product-enquiry-page">
      <a
        className="button button-outline product-enquiry-back"
        href={initialProduct ? `/product/${encodeURIComponent(initialProduct)}` : '/shop'}
      >
        <span aria-hidden="true">←</span>
        {t.productEnquiryBack}
      </a>
      <span className="eyebrow eyebrow-coral">{t.productEnquiryProducts}</span>
      <h1>{t.productEnquiryTitle}</h1>
      <p className="policy-intro">{t.productEnquiryIntro}</p>
      {sent ? <p className="notice product-enquiry-success" role="status">{t.productEnquirySent}</p> : (
        <form className="product-enquiry-form" onSubmit={submit}>
          <fieldset className="product-enquiry-selection" aria-label={t.productEnquiryProducts}>
            {selectedProducts.map((item) => (
              <article className="product-enquiry-item" key={item.id}>
                {productImage(item) && <img src={productImage(item)} alt="" style={imageStyle(item, item.primary_image_index)} />}
                <div className="product-enquiry-item-copy">
                  <strong>{nameFor(item)}</strong>
                  <small>{item.id}{item.price_mzn != null
                    ? ` · ${Number(item.price_mzn).toLocaleString(language === 'pt' ? 'pt-MZ' : 'en-US')} MZN`
                    : ''}</small>
                </div>
                <label className="product-enquiry-quantity">
                  <span>{t.productEnquiryQuantity}</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={quantities[item.id] || 1}
                    onChange={(event) => setQuantities((current) => ({
                      ...current,
                      [item.id]: Math.max(1, Math.min(100, Number(event.target.value) || 1)),
                    }))}
                  />
                </label>
                <button
                  className="text-link product-enquiry-remove"
                  type="button"
                  onClick={() => setSelectedIds((ids) => ids.filter((id) => id !== item.id))}
                >
                  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
                    <path d="M3 4.5h10M6 4.5v-1h4v1m-5.5 0 .6 8h5.8l.6-8M6.5 6.5v4m3-4v4" />
                  </svg>
                  {t.productEnquiryRemoveProduct}
                </button>
              </article>
            ))}
            {selectedIds.filter((id) => !catalog.items.some((item) => item.id === id)).map((id) => (
              <article className="product-enquiry-item product-enquiry-unavailable" key={id}>
                <p className="notice notice-error" role="alert">{t.productEnquiryUnavailableProduct} ({id})</p>
                <button className="text-link product-enquiry-remove" type="button" onClick={() => setSelectedIds((ids) => ids.filter((selectedId) => selectedId !== id))}>
                  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
                    <path d="M3 4.5h10M6 4.5v-1h4v1m-5.5 0 .6 8h5.8l.6-8M6.5 6.5v4m3-4v4" />
                  </svg>
                  {t.productEnquiryRemoveProduct}
                </button>
              </article>
            ))}
            {catalogState === 'error' && <CatalogErrorNotice message={t.catalogError} retryLabel={t.catalogRetry} onRetry={retryCatalog} />}
            <div className="product-enquiry-add">
              <label>
                <span>{t.productEnquiryAddProduct}</span>
                    <div className="product-enquiry-picker" ref={productPickerRef}>
                      <button
                        className="product-enquiry-picker-trigger"
                        ref={productPickerTriggerRef}
                        type="button"
                        aria-expanded={productPickerOpen}
                        aria-controls="product-enquiry-picker-options"
                        disabled={catalogState !== 'ready' || selectedIds.length >= 10}
                        onClick={() => setProductPickerOpen((open) => !open)}
                      >
                        {productToAddItem ? (
                          <>
                            {productImage(productToAddItem) && <img src={productImage(productToAddItem)} alt="" style={imageStyle(productToAddItem, productToAddItem.primary_image_index)} />}
                            <span>{nameFor(productToAddItem)}</span>
                          </>
                        ) : <span>{t.productEnquiryChooseProduct}</span>}
                        <svg className="product-enquiry-picker-chevron" aria-hidden="true" viewBox="0 0 16 16">
                          <path d="m4 6 4 4 4-4" />
                        </svg>
                      </button>
                      {productPickerOpen && (
                        <div className="product-enquiry-picker-options" id="product-enquiry-picker-options" role="group" aria-label={t.productEnquiryChooseProduct}>
                          {availableProducts.map((item) => (
                            <button
                              className="product-enquiry-picker-option"
                              type="button"
                              key={item.id}
                              aria-pressed={productToAdd === item.id}
                              onClick={() => {
                                setProductToAdd(item.id);
                                setProductPickerOpen(false);
                                productPickerTriggerRef.current?.focus();
                              }}
                            >
                              {productImage(item) && <img src={productImage(item)} alt="" style={imageStyle(item, item.primary_image_index)} loading="lazy" />}
                              <span>{nameFor(item)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
              </label>
              <button className="button button-outline" type="button" onClick={addProduct} disabled={!productToAdd || selectedIds.length >= 10}>
                {t.productEnquiryAddButton}
              </button>
            </div>
          </fieldset>
          <label>{t.name}<input autoComplete="name" maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>{t.email}<input type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>{t.phone}<input type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <label>{t.productEnquiryMessage}<textarea maxLength={1200} value={message} onChange={(event) => setMessage(event.target.value)} /></label>
          <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
          <label className="consent-check"><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{t.productEnquiryConsent} <a href="/privacy">{t.privacy}</a></span></label>
          {error && <p className="notice notice-error" role="alert">{error}</p>}
          <button className="button button-primary" type="submit" disabled={busy || catalogState !== 'ready' || selectedProducts.length !== selectedIds.length}>
            {busy ? t.sending : t.productEnquirySubmit}
          </button>
        </form>
      )}
    </section>
  );
}

function GiftBuilder({
  catalog, catalogState, language, t, nameFor, descriptionFor, productImage, productImageStyle, imageStyle, initialProduct, assistantDraft, onAssistantDraftApplied, refreshCatalog, retryCatalog,
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
  retryCatalog: () => void;
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
  const [preferredContact, setPreferredContact] = useState<'email' | 'phone' | 'whatsapp'>('email');
  const [address, setAddress] = useState<EnquiryAddress>(() => ({ ...emptyEnquiryAddress }));
  const [visibleOptionalFields, setVisibleOptionalFields] = useState<Record<string, boolean>>({});
  const [deliveryAddressVisible, setDeliveryAddressVisible] = useState(false);
  const [addressEntryMode, setAddressEntryMode] = useState<'manual' | 'map' | null>(null);
  const [mapAddressEditing, setMapAddressEditing] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [recommendations, setRecommendations] = useState<GiftRecommendation[] | null>(null);
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [productDetails, setProductDetails] = useState<{ item: CatalogItem; recommendation: GiftRecommendation | null } | null>(null);
  const [productDetailsImageIndex, setProductDetailsImageIndex] = useState(0);
  const productDetailsDialogRef = useRef<HTMLElement>(null);
  const productDetailsCloseRef = useRef<HTMLButtonElement>(null);
  const productDetailsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const recommendationRequestRef = useRef(0);
  const appliedAssistantDraftRef = useRef<AssistantGiftDraft | null>(null);
  const lastTrackedStepRef = useRef<number | null>(null);
  useEffect(() => {
    if (lastTrackedStepRef.current === step) return;
    lastTrackedStepRef.current = step;
    trackAnalyticsEvent('gift_builder_step', '/gift-builder', { step });
  }, [step]);
  const productDetailsImages = productDetails?.item.images?.flatMap((src, index) => src ? [{ src, index }] : []) ?? [];
  const activeProductDetailsImagePosition = productDetailsImages.findIndex(({ index }) => index === productDetailsImageIndex);
  const activeProductDetailsImage = productDetailsImages[activeProductDetailsImagePosition];
  const openProductDetails = (item: CatalogItem, recommendation: GiftRecommendation | null, trigger: HTMLButtonElement) => {
    const images = item.images?.flatMap((src, index) => src ? [{ src, index }] : []) ?? [];
    const primaryImage = images.find(({ index }) => index === item.primary_image_index) ?? images[0];
    setProductDetailsImageIndex(primaryImage?.index ?? 0);
    productDetailsTriggerRef.current = trigger;
    setProductDetails({ item, recommendation });
  };
  useEffect(() => {
    if (!productDetails) {
      productDetailsTriggerRef.current?.focus();
      productDetailsTriggerRef.current = null;
      return;
    }
    productDetailsCloseRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProductDetails(null);
        return;
      }
      trapModalFocus(event, productDetailsDialogRef.current);
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
  }, [productDetails, productDetailsImages.length]);
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
  const setOptionalFieldVisible = (field: string, visible: boolean) => {
    setVisibleOptionalFields((current) => ({ ...current, [field]: visible }));
  };
  const optionalField = (id: string, label: string, field: ReactNode, addLabel = t.showOptionalField(label)) => (
    <div className="optional-field" key={id}>
      <button
        className="optional-field-action"
        type="button"
        aria-expanded={Boolean(visibleOptionalFields[id])}
        aria-controls={`gift-builder-${id}`}
        onClick={() => setOptionalFieldVisible(id, !visibleOptionalFields[id])}
      >
        {visibleOptionalFields[id] ? t.hideOptionalField(label) : addLabel}
      </button>
      {visibleOptionalFields[id] && <div id={`gift-builder-${id}`}>{field}</div>}
    </div>
  );
  const mapPickerTriggerRef = useRef<HTMLElement | null>(null);
  const closeMapPicker = useCallback(() => setMapPickerOpen(false), []);
  const openMapPicker = (trigger: HTMLElement) => {
    mapPickerTriggerRef.current = trigger;
    setMapPickerOpen(true);
  };
  useEffect(() => {
    if (mapPickerOpen || !mapPickerTriggerRef.current) return;
    mapPickerTriggerRef.current.focus();
    mapPickerTriggerRef.current = null;
  }, [mapPickerOpen]);
  const updateAddressField = (field: keyof EnquiryAddress, value: string) => {
    setAddress((current) => {
      const updated = { ...current, [field]: value };
      updated.formattedAddress = formatEnquiryAddress(updated);
      return updated;
    });
  };
  const addressFields = (
    <div className="address-fields-grid">
      <label>{t.addressPlaceName}<input maxLength={180} placeholder={t.addressPlacePlaceholder} value={address.placeName} onChange={(event) => updateAddressField('placeName', event.target.value)} /></label>
      <label>{t.addressRoad}<input maxLength={180} placeholder={t.addressRoadPlaceholder} value={address.road} onChange={(event) => updateAddressField('road', event.target.value)} /></label>
      <label>{t.addressHouseNumber}<input maxLength={40} value={address.houseNumber} onChange={(event) => updateAddressField('houseNumber', event.target.value)} /></label>
      <label>{t.addressNeighbourhood}<input maxLength={180} placeholder={t.addressNeighbourhoodPlaceholder} value={address.neighbourhood} onChange={(event) => updateAddressField('neighbourhood', event.target.value)} /></label>
      <label>{t.addressDistrict}<input maxLength={180} placeholder={t.addressDistrictPlaceholder} value={address.district} onChange={(event) => updateAddressField('district', event.target.value)} /></label>
      <label>{t.addressCity}<input maxLength={180} placeholder={t.addressCityPlaceholder} value={address.city} onChange={(event) => updateAddressField('city', event.target.value)} /></label>
      <label>{t.addressProvince}<input maxLength={180} placeholder={t.addressProvincePlaceholder} value={address.province} onChange={(event) => updateAddressField('province', event.target.value)} /></label>
      <label>{t.addressPostalCode}<input maxLength={30} value={address.postalCode} onChange={(event) => updateAddressField('postalCode', event.target.value)} /></label>
      <label>{t.addressCountry}<input maxLength={100} value={address.country} onChange={(event) => updateAddressField('country', event.target.value)} /></label>
    </div>
  );
  const addressDetails: Array<[string, string]> = [
    [t.addressPlaceName, address.placeName],
    [t.addressRoad, address.road],
    [t.addressHouseNumber, address.houseNumber],
    [t.addressNeighbourhood, address.neighbourhood],
    [t.addressDistrict, address.district],
    [t.addressCity, address.city],
    [t.addressProvince, address.province],
    [t.addressPostalCode, address.postalCode],
    [t.addressCountry, address.country],
  ];
  const addressSummaryFields = addressDetails.filter(([, value]) => Boolean(value.trim()));
  const hasSelectedMapAddress = address.latitude !== null && address.longitude !== null;

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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      (preferredContact !== 'email' && !phone.trim()) || !consent) {
      setError(t.required);
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language, name, email, phone, preferredContact, address,
          occasion: selectedOccasion, recipient: selectedRecipient,
          budget, preferences, cardMessage, products: selected,
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
      trackAnalyticsEvent('enquiry_submitted', '/gift-builder', {
        productCount: selectedNames.length,
        language,
      });
      setSent(true);
    } catch {
      setError(t.submitError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section builder-page">
      <div className="builder-heading"><span className="eyebrow eyebrow-coral">{t.builderEyebrow}</span><h1>{t.builderTitle}</h1></div>
      <p className="builder-orientation">{t.builderOrientation}</p>
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
            {optionalField('budget', t.budget, <label>{t.budget}<input type="number" min="0" max="10000000" value={budget} onChange={(event) => setBudget(event.target.value)} /></label>, t.addBudget)}
            {optionalField('preferences', t.interests, <label>{t.interests}<textarea maxLength={1000} placeholder={t.interestsHint} value={preferences} onChange={(event) => setPreferences(event.target.value)} /></label>, t.addPreferences)}
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
            {recommendationsLoading && !showAllProducts && (
              <div className="recommendation-loading notice" role="status" aria-live="polite">
                <span className="loading-spinner" aria-hidden="true" />
                <span>{t.recommendationLoading}</span>
              </div>
            )}
            {catalogState === 'loading' && <p className="notice">{t.loading}</p>}
            {catalogState === 'error' && <CatalogErrorNotice message={t.catalogError} retryLabel={t.catalogRetry} onRetry={retryCatalog} />}
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
                    <button className="text-link" type="button" onClick={(event) => openProductDetails(item, recommendation, event.currentTarget)}>{t.moreDetails}</button>
                  </div>
                </article>
              ))}
            </div>
          </div>}
          {step === 3 && <form className="builder-panel review-panel" onSubmit={submit}>
            <h2>{t.review}</h2>
            <p className="review-instructions">{t.reviewInstructions}</p>
            <div className="review-summary">
              <div className="review-summary-section">
                <div className="review-summary-heading">
                  <strong>{t.giftDetails}</strong>
                  <button className="text-link" type="button" onClick={() => setStep(1)}>{t.editGiftDetails}</button>
                </div>
                <p><strong>{t.occasion}:</strong> {selectedOccasion}</p><p><strong>{t.recipient}:</strong> {selectedRecipient}</p>
                {budget && <p><strong>{t.budget}:</strong> {Number(budget).toLocaleString(language === 'pt' ? 'pt-MZ' : 'en-US')} MZN</p>}
                {preferences && <p><strong>{t.interests}:</strong> {preferences}</p>}
              </div>
              <div className="review-summary-section">
                <div className="review-summary-heading">
                  <strong>{t.chooseProducts}</strong>
                  <button className="text-link" type="button" onClick={() => setStep(2)}>{t.editProductChoices}</button>
                </div>
                {selectedProducts.length > 0
                  ? <ul>{selectedProducts.map((item) => <li key={item.id}>{nameFor(item)}{item.price_mzn != null ? ` — ${Number(item.price_mzn).toLocaleString(language === 'pt' ? 'pt-MZ' : 'en-US')} MZN` : ''}</li>)}</ul>
                  : <p>{t.noProductsSelected}</p>}
              </div>
            </div>
            {optionalField('cardMessage', t.cardMessage, <label>{t.cardMessage}<textarea maxLength={500} value={cardMessage} onChange={(event) => setCardMessage(event.target.value)} /></label>, t.addCardMessage)}
            <label className="honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <label>{t.name}<input autoComplete="name" maxLength={120} required value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>{t.email}<input type="email" autoComplete="email" maxLength={254} required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            {preferredContact !== 'email'
              ? <label>{t.phone}<input type="tel" autoComplete="tel" maxLength={40} required value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
              : optionalField('phone', t.phone, <label>{t.phone}<input type="tel" autoComplete="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>, t.addPhone)}
            <fieldset className="preferred-contact">
              <legend>{t.preferredContact}</legend>
              <div className="preferred-contact-options">
                {([
                  ['email', t.contactByEmail],
                  ['phone', t.contactByPhone],
                  ['whatsapp', t.contactByWhatsApp],
                ] as const).map(([method, label]) => (
                  <label className={`preferred-contact-option${preferredContact === method ? ' preferred-contact-selected' : ''}`} key={method}>
                    <input type="radio" name="preferred-contact" value={method} checked={preferredContact === method} onChange={() => {
                      setPreferredContact(method);
                      if (method !== 'email') setOptionalFieldVisible('phone', true);
                    }} />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {!deliveryAddressVisible
              ? <div className="delivery-address-prompt">
                <p>{t.addressDeliveryNote}</p>
                <button className="delivery-address-action" type="button" onClick={() => setDeliveryAddressVisible(true)}>{t.addDeliveryAddress}</button>
              </div>
              : <fieldset className="delivery-address">
                <legend>{t.deliveryAddress}</legend>
                <p className="delivery-address-note">{t.addressDetailsPrompt}</p>
                <fieldset className="address-entry-method">
                  <legend>{t.addressEntryMethod}</legend>
                  <div className="address-entry-options">
                    <label className={`address-entry-option${addressEntryMode === 'manual' ? ' address-entry-selected' : ''}`}>
                      <input type="radio" name="address-entry-method" value="manual" checked={addressEntryMode === 'manual'} onChange={() => {
                        setAddressEntryMode('manual');
                        setMapAddressEditing(false);
                        setAddress((current) => ({
                          ...current,
                          formattedAddress: formatEnquiryAddress(current),
                          latitude: null,
                          longitude: null,
                          osmType: '',
                          osmId: '',
                          placeCategory: '',
                          placeType: '',
                          addressType: '',
                        }));
                      }} />
                      <span>{t.addressEnterManually}</span>
                    </label>
                    <label className={`address-entry-option${addressEntryMode === 'map' ? ' address-entry-selected' : ''}`}>
                      <input type="radio" name="address-entry-method" value="map" checked={addressEntryMode === 'map'} onChange={(event) => {
                        setAddressEntryMode('map');
                        setMapAddressEditing(false);
                        openMapPicker(event.currentTarget as HTMLElement);
                      }} />
                      <span>{t.addressUseMap}</span>
                    </label>
                  </div>
                </fieldset>
                {addressEntryMode === 'manual' && addressFields}
                {addressEntryMode === 'map' && (
                  <>
                    <p className="map-privacy-note">{t.mapOptIn}</p>
                    {!hasSelectedMapAddress
                      ? <button className="button button-outline map-open-button" type="button" onClick={(event) => openMapPicker(event.currentTarget)}>{t.chooseAddressOnMap}</button>
                      : <section className="selected-map-address" aria-label={t.deliveryAddress}>
                        <ul>
                          {addressSummaryFields.length > 0
                            ? addressSummaryFields.map(([label, value]) => <li key={label}><strong>{label}:</strong> {value}</li>)
                            : <li>{t.addressNoDetails}</li>}
                          <li><strong>{t.addressCoordinates}:</strong> {address.latitude?.toFixed(6)}, {address.longitude?.toFixed(6)}</li>
                        </ul>
                        <div className="address-summary-actions">
                          <button className="button button-outline" type="button" onClick={() => setMapAddressEditing((editing) => !editing)}>
                            {mapAddressEditing ? t.addressDoneEditing : t.addressEditDetails}
                          </button>
                          <button className="text-link" type="button" onClick={(event) => openMapPicker(event.currentTarget)}>{t.editAddressOnMap}</button>
                        </div>
                        {mapAddressEditing && addressFields}
                      </section>}
                  </>
                )}
              </fieldset>}
            {mapPickerOpen && (
              <Suspense fallback={<div className="address-map-backdrop"><p className="address-map-status" role="status">{t.mapLoading}</p></div>}>
                <MapAddressPicker
                  language={language}
                  onClose={closeMapPicker}
                  initialLocation={address.latitude !== null && address.longitude !== null
                    ? { latitude: address.latitude, longitude: address.longitude }
                    : null}
                  onUseAddress={(mapAddress) => {
                    setDeliveryAddressVisible(true);
                    setAddress({ ...mapAddress });
                    setAddressEntryMode('map');
                    setMapAddressEditing(false);
                  }}
                />
              </Suspense>
            )}
            <label className="consent-check"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{t.privacyConsent} <a href="/privacy">{t.privacy}</a></span></label>
            {error && <p className="notice notice-error" role="alert">{error}</p>}
            <button className="button button-primary submit-button" type="submit" disabled={busy}>{busy ? t.sending : t.submit}<span aria-hidden="true">↗</span></button>
          </form>}
          {step !== 3 && <div className="builder-controls">
            {step > 1 ? <button className="button button-outline" type="button" onClick={() => {
              recommendationRequestRef.current += 1;
              setStep(step - 1);
            }}>{t.previous}</button> : <span />}
            <button className="button button-primary" type="button" onClick={advanceStep} disabled={busy}>
              {t.next}<span aria-hidden="true">↗</span>
            </button>
          </div>}
          {step === 3 && <div className="builder-controls"><button className="button button-outline" type="button" onClick={() => setStep(2)}>{t.previous}</button></div>}
          {error && step !== 3 && <p className="notice notice-error" role="alert">{error}</p>}
        </>
      )}
      <EnquiryGuidance t={t} />
      {productDetails && <div className="product-modal-backdrop" onMouseDown={(event) => {
        if (event.target === event.currentTarget) setProductDetails(null);
      }}>
        <section ref={productDetailsDialogRef} className="product-modal" role="dialog" aria-modal="true" aria-labelledby="gift-product-details-title" tabIndex={-1}>
          <button ref={productDetailsCloseRef} className="product-modal-close" type="button" aria-label={t.closeDetails} onClick={() => setProductDetails(null)}>×</button>
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

function EnquiryGuidance({ t, compact = false }: { t: typeof copy[Language]; compact?: boolean }) {
  return (
    <aside className={`enquiry-guidance${compact ? ' enquiry-guidance-compact' : ''}`}>
      <strong>{t.enquiryProcessTitle}</strong>
      <p>
        {t.enquiryProcess}{' '}
        <a href="/faq">{t.navHelp}</a>
        {' · '}
        <a href="/terms">{t.terms}</a>
      </p>
    </aside>
  );
}

export default App;
