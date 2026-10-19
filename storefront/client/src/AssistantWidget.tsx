import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ReactNode } from 'react';
import type { AssistantGiftDraft, AssistantGiftFormAction } from './assistantTypes';
import { trackAnalyticsEvent } from './analytics';

type Language = 'en' | 'pt';
type Message = {
  role: 'user' | 'assistant';
  content: string;
  formAction?: AssistantGiftFormAction;
  formDraft?: AssistantGiftDraft | null;
};
type AssistantWidgetProps = {
  language: Language;
  onNavigate: (url: string) => void;
  onOpen: () => void;
  onApplyGiftDraft: (draft: AssistantGiftDraft) => void;
};

function isGiftDraft(value: unknown): value is AssistantGiftDraft {
  if (typeof value !== 'object' || value === null) return false;
  const draft = value as Record<string, unknown>;
  return typeof draft.occasion === 'string' &&
    typeof draft.recipient === 'string' &&
    typeof draft.budget === 'string' &&
    typeof draft.preferences === 'string' &&
    Array.isArray(draft.productIds) &&
    draft.productIds.length <= 5 &&
    draft.productIds.every((id) => typeof id === 'string');
}

const labels = {
  en: {
    open: 'Chat with Fox, your gift guide',
    title: 'Fox',
    subtitle: 'Your curious gift guide',
    intro: 'Hi, I’m Fox! Ask me about our gifts and products, or tell me what kind of occasion you’re shopping for.',
    placeholder: 'Ask about gifts or products…',
    send: 'Send message',
    sending: 'Thinking…',
    notice: 'AI responses can be inaccurate. Please don’t share sensitive personal information.',
    unavailable: 'The assistant is temporarily unavailable. Please try again later.',
    confirmTitle: 'End this conversation?',
    confirmDescription: 'Ending the conversation will close the chat and clear its messages.',
    keepChat: 'Keep chatting',
    endChat: 'End conversation',
    closeChat: 'Close chat',
    minimizeChat: 'Minimize chat',
    restoreChat: 'Restore chat',
    fillGiftBrief: 'Yes, fill my gift brief',
    notNow: 'Not now',
    declinedOffer: 'Not now. Please keep helping me here.',
    acceptedOffer: 'Yes, please fill in my gift brief.',
    draftApplied: 'I’ve filled in the gift brief and opened the Gift builder. Please review it, add your name and email, check the privacy consent box, then submit it when you’re ready. I’ll stay here if you need help.',
  },
  pt: {
    open: 'Conversar com Fox, o teu guia de presentes',
    title: 'Fox',
    subtitle: 'O teu guia curioso de presentes',
    intro: 'Olá, sou o Fox! Pergunta-me sobre os nossos presentes e produtos, ou conta-me para que ocasião procuras um presente.',
    placeholder: 'Pergunte sobre presentes ou produtos…',
    send: 'Enviar mensagem',
    sending: 'A pensar…',
    notice: 'As respostas da IA podem conter erros. Não partilhe informações pessoais sensíveis.',
    unavailable: 'O assistente está temporariamente indisponível. Tente novamente mais tarde.',
    confirmTitle: 'Terminar esta conversa?',
    confirmDescription: 'Ao terminar a conversa, o chat será fechado e as mensagens serão apagadas.',
    keepChat: 'Continuar a conversa',
    endChat: 'Terminar conversa',
    closeChat: 'Fechar conversa',
    minimizeChat: 'Minimizar conversa',
    restoreChat: 'Restaurar conversa',
    fillGiftBrief: 'Sim, preencher a descrição do presente',
    notNow: 'Agora não',
    declinedOffer: 'Agora não. Continua a ajudar-me por aqui, por favor.',
    acceptedOffer: 'Sim, preenche a descrição do meu presente, por favor.',
    draftApplied: 'Preenchi a descrição do presente e abri o Criador de presentes. Reveja os dados, introduza o seu nome e email, marque a caixa de consentimento de privacidade e envie o pedido quando estiver pronto. Continuo por aqui se precisar de ajuda.',
  },
} as const;

function internalPath(href: string): string | null {
  if (!href.startsWith('/') || href.startsWith('//') || href.includes('\\')) return null;
  const destination = new URL(href, window.location.origin);
  if (destination.origin !== window.location.origin) return null;
  const allowedPath = new Set(['/shop', '/contact', '/gift-builder', '/product-enquiry', '/corporate', '/about', '/faq', '/reviews', '/privacy', '/terms']);
  if (!allowedPath.has(destination.pathname) && !/^\/product\/[A-Za-z0-9_-]+$/.test(destination.pathname)) return null;
  return `${destination.pathname}${destination.search}${destination.hash}`;
}

function renderInlineFormatting(text: string, keyPrefix: string, onNavigate: (url: string) => void): ReactNode[] {
  const formatting = /(\[[^\]\n]+\]\(\/(?:shop|contact|gift-builder|product-enquiry|corporate|about|faq|reviews|privacy|terms|product\/[A-Za-z0-9_-]+)(?:\?[^\s)]*)?\)|\*\*[^*\n]+?\*\*|__[^_\n]+?__|\*[^*\n]+?\*|_[^_\n]+?_|`[^`\n]+`)/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let partIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = formatting.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    const link = token.match(/^\[([^\]]+)\]\((\/[^)\s]*)\)$/);
    if (link) {
      const href = internalPath(link[2]);
      parts.push(href
        ? <a key={`${keyPrefix}-${partIndex}`} href={href} onClick={(event) => { event.preventDefault(); onNavigate(href); }}>{link[1]}</a>
        : link[1]);
    } else {
      const isBold = token.startsWith('**') || token.startsWith('__');
      const isCode = token.startsWith('`');
      const delimiterLength = isBold ? 2 : 1;
      const content = token.slice(delimiterLength, token.length - delimiterLength);
      parts.push(isBold
        ? <strong key={`${keyPrefix}-${partIndex}`}>{content}</strong>
        : isCode
          ? <code key={`${keyPrefix}-${partIndex}`}>{content}</code>
          : <em key={`${keyPrefix}-${partIndex}`}>{content}</em>);
    }
    lastIndex = formatting.lastIndex;
    partIndex += 1;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function AssistantReply({ content, onNavigate }: { content: string; onNavigate: (url: string) => void }) {
  const blocks: ReactNode[] = [];
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let blockIndex = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(
      <p key={`paragraph-${blockIndex++}`}>
        {renderInlineFormatting(paragraph.join(' '), `paragraph-${blockIndex}`, onNavigate)}
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!listType || !listItems.length) return;
    const List = listType;
    blocks.push(
      <List key={`list-${blockIndex++}`}>
        {listItems.map((item, index) => (
          <li key={index}>          {renderInlineFormatting(item, `list-${blockIndex}-${index}`, onNavigate)}</li>
        ))}
      </List>,
    );
    listItems = [];
    listType = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    const unordered = trimmed.match(/^(?:[-*+•])\s+(.+)$/);
    const ordered = trimmed.match(/^\d+[.)]\s+(.+)$/);

    if (heading) {
      flushParagraph();
      flushList();
      blocks.push(
        <h3 key={`heading-${blockIndex++}`}>
          {renderInlineFormatting(heading[2], `heading-${blockIndex}`, onNavigate)}
        </h3>,
      );
    } else if (unordered || ordered) {
      flushParagraph();
      const nextListType = unordered ? 'ul' : 'ol';
      if (listType && listType !== nextListType) flushList();
      listType = nextListType;
      listItems.push(unordered?.[1] ?? ordered?.[1]);
    } else if (!trimmed) {
      flushParagraph();
      flushList();
    } else {
      flushList();
      paragraph.push(trimmed);
    }
  });

  flushParagraph();
  flushList();
  return <div className="assistant-rich-content">{blocks}</div>;
}

function FoxIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M8 19 10 6l11 8a17 17 0 0 1 6 0l11-8 2 13a17 17 0 1 1-32 0Z" fill="#f18a48" />
      <path d="m12 11 6 5-5-1.4ZM36 11l-6 5 5-1.4Z" fill="#ffc1a1" />
      <path d="M11 25c0-6 5.8-10 13-10s13 4 13 10c0 8-5.5 14-13 14S11 33 11 25Z" fill="#fff5e9" />
      <path d="M17 25.5a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Zm14 0a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4Z" fill="#18345a" />
      <path d="m21 29 3-1.5 3 1.5-3 2.5-3-2.5Z" fill="#18345a" />
      <path d="M24 31.5c-.4 2-1.8 2.8-3.5 2.2m3.5-2.2c.4 2 1.8 2.8 3.5 2.2" fill="none" stroke="#18345a" strokeLinecap="round" strokeWidth="1.4" />
      <path d="m40 14 .8 2.2L43 17l-2.2.8L40 20l-.8-2.2L37 17l2.2-.8L40 14Z" fill="#ffcf58" />
    </svg>
  );
}

export default function AssistantWidget({ language, onNavigate, onOpen, onApplyGiftDraft }: AssistantWidgetProps) {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [confirmClose, setConfirmClose] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const keepChatRef = useRef<HTMLButtonElement>(null);
  const activeRequestRef = useRef<AbortController | null>(null);
  const copy = labels[language];

  useEffect(() => {
    if (!open || minimized) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setConfirmClose((visible) => !visible);
    };
    window.addEventListener('keydown', closeOnEscape);
    if (confirmClose) keepChatRef.current?.focus();
    else inputRef.current?.focus();
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [open, minimized, confirmClose]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, pending, error]);

  const sendContent = async (content: string) => {
    if (!content || pending) return;

    const nextMessages = [
      ...messages.map((message) => ({ ...message, formAction: 'none' as const })),
      { role: 'user' as const, content },
    ].slice(-20);
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setPending(true);
    const controller = new AbortController();
    activeRequestRef.current = controller;

    try {
      const history = nextMessages.slice(-8);
      while (history.length > 1 && history.reduce((total, message) => total + message.content.length, 0) > 1800) {
        history.shift();
      }
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, messages: history }),
        signal: controller.signal,
      });
      let result: {
        answer?: string;
        error?: string;
        formAction?: AssistantGiftFormAction;
        formDraft?: AssistantGiftDraft | null;
      };
      try {
        result = await response.json() as typeof result;
      } catch {
        throw new Error(copy.unavailable);
      }
      if (!response.ok || !result.answer) {
        throw new Error(result.error || copy.unavailable);
      }
      const formAction = result.formAction === 'offer' || result.formAction === 'apply'
        ? result.formAction
        : 'none';
      const formDraft = isGiftDraft(result.formDraft) ? result.formDraft : null;
      if (formAction !== 'none' && !formDraft) throw new Error(copy.unavailable);
      const assistantMessage: Message = { role: 'assistant', content: result.answer, formAction, formDraft };
      if (formAction === 'apply' && formDraft) onApplyGiftDraft(formDraft);
      setMessages((current) => [...current, assistantMessage].slice(-20));
    } catch (cause) {
      if (controller.signal.aborted) return;
      const message = cause instanceof Error ? cause.message : '';
      setError(message && message !== 'Failed to fetch' ? message : copy.unavailable);
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setPending(false);
        inputRef.current?.focus();
      }
    }
  };

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendContent(draft.trim());
  };

  const acceptGiftDraft = (index: number, giftDraft: AssistantGiftDraft) => {
    onApplyGiftDraft(giftDraft);
    setMessages((current) => [
      ...current.map((message, messageIndex) => messageIndex === index
        ? { ...message, formAction: 'none' as const }
        : message),
      { role: 'user' as const, content: copy.acceptedOffer },
      { role: 'assistant' as const, content: copy.draftApplied },
    ].slice(-20));
  };

  const endConversation = () => {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
    setMessages([]);
    setDraft('');
    setError('');
    setPending(false);
    setConfirmClose(false);
    setOpen(false);
  };

  return (
    <div className="assistant-widget">
      {open && !minimized && (
        <section className="assistant-panel" aria-labelledby="assistant-title">
          <header className="assistant-header">
            <div className="assistant-heading">
              <span className="assistant-avatar"><FoxIcon /></span>
              <div>
                <h2 id="assistant-title">{copy.title}</h2>
                <span><i aria-hidden="true" /> {copy.subtitle}</span>
              </div>
            </div>
            <div className="assistant-header-actions">
              <button className="assistant-minimize" type="button" aria-label={copy.minimizeChat} onClick={() => setMinimized(true)}>−</button>
              <button className="assistant-close" type="button" aria-label={copy.closeChat} onClick={() => setConfirmClose(true)}>×</button>
            </div>
          </header>
          <div className="assistant-transcript" ref={transcriptRef} aria-live="polite" aria-relevant="additions text">
            <p className="assistant-message assistant-message-bot">{copy.intro}</p>
            {messages.map((message, index) => (
              message.role === 'assistant'
                ? (
                  <div className="assistant-message assistant-message-bot" key={`${index}-${message.role}`}>
                    <AssistantReply content={message.content} onNavigate={onNavigate} />
                    {message.formAction === 'offer' && message.formDraft && (
                      <div className="assistant-form-offer">
                        <button type="button" onClick={() => acceptGiftDraft(index, message.formDraft!)}>{copy.fillGiftBrief}</button>
                        <button type="button" onClick={() => void sendContent(copy.declinedOffer)} disabled={pending}>{copy.notNow}</button>
                      </div>
                    )}
                  </div>
                )
                : <p className="assistant-message assistant-message-user" key={`${index}-${message.role}`}>{message.content}</p>
            ))}
            {pending && <p className="assistant-message assistant-message-bot assistant-thinking">{copy.sending}</p>}
            {error && <p className="assistant-error" role="alert">{error}</p>}
          </div>
          <p className="assistant-notice">{copy.notice}</p>
          <form className="assistant-form" onSubmit={sendMessage}>
            <label className="assistant-sr-only" htmlFor="assistant-question">{copy.placeholder}</label>
            <input
              id="assistant-question"
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={copy.placeholder}
              maxLength={1200}
              disabled={pending}
            />
            <button type="submit" aria-label={copy.send} disabled={pending || !draft.trim()}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-5 16-3-6-8-2Z" /><path d="m12 14 4-5" /></svg>
            </button>
          </form>
          {confirmClose && (
            <div className="assistant-confirmation-backdrop">
              <div className="assistant-confirmation" role="alertdialog" aria-modal="true" aria-labelledby="assistant-confirm-title" aria-describedby="assistant-confirm-description">
                <h3 id="assistant-confirm-title">{copy.confirmTitle}</h3>
                <p id="assistant-confirm-description">{copy.confirmDescription}</p>
                <div className="assistant-confirmation-actions">
                  <button ref={keepChatRef} className="assistant-confirmation-keep" type="button" onClick={() => setConfirmClose(false)}>{copy.keepChat}</button>
                  <button className="assistant-confirmation-end" type="button" onClick={endConversation}>{copy.endChat}</button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
      <button
        className={`assistant-launcher${open && !minimized ? ' assistant-launcher-open' : ''}`}
        type="button"
        aria-label={open ? (minimized ? copy.restoreChat : copy.closeChat) : copy.open}
        aria-expanded={open && !minimized}
        onClick={() => {
          if (open && minimized) setMinimized(false);
          else if (open) setConfirmClose(true);
          else {
            onOpen();
            setOpen(true);
          }
        }}
      >
        {open && !minimized
          ? <span aria-hidden="true">×</span>
          : <FoxIcon />}
      </button>
    </div>
  );
}
