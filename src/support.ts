import { articles } from './support-data';
import { createSupportSearch } from './support-search';

const search = document.querySelector<HTMLInputElement>('#search')!;
const list = document.querySelector<HTMLDivElement>('#article-list')!;
const topics = document.querySelector<HTMLElement>('#topics')!;
const platformButtons = [...document.querySelectorAll<HTMLButtonElement>('[data-platform]')];
const dialog = document.querySelector<HTMLDialogElement>('#contact-dialog')!;
let platform = 'all';
let category = 'All questions';
const categories = ['All questions', ...new Set(articles.map(article => article.category))];
const plainText = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content.textContent || '';
};
const searchArticles = createSupportSearch(articles.map(article => ({ ...article, text: `${plainText(article.answer)} ${article.platforms.join(' ')}` })));

function render(collapseAnswers = false) {
  const openIds = new Set([...list.querySelectorAll<HTMLDetailsElement>('details[open]')].map(el => el.id));
  const scores = searchArticles(search.value);
  const eligible = articles.filter(article => (platform === 'all' || article.platforms.includes(platform)) && scores.get(article.id)! > 0)
    .sort((a, b) => scores.get(b.id)! - scores.get(a.id)!);
  topics.replaceChildren();
  categories.forEach(name => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-pressed', String(category === name));
    button.append(document.createTextNode(name));
    const count = document.createElement('span');
    count.textContent = String(eligible.filter(article => name === 'All questions' || article.category === name).length);
    button.append(count);
    button.addEventListener('click', () => { category = name; render();
      (topics.querySelector('[aria-pressed="true"]') as HTMLButtonElement).focus();
    });
    topics.append(button);
  });
  const visible = eligible.filter(article => category === 'All questions' || article.category === category);
  list.replaceChildren();
  visible.forEach(article => {
    const details = document.createElement('details');
    details.id = article.id;
    details.open = !collapseAnswers && (openIds.has(article.id) || Boolean(search.value.trim()));
    const summary = document.createElement('summary');
    const heading = document.createElement('div');
    const question = document.createElement('div');
    question.className = 'question';
    question.textContent = article.question;
    const tags = document.createElement('div');
    tags.className = 'tags';
    article.platforms.forEach(tag => { const label = document.createElement('span'); label.textContent = `#${tag}`; tags.append(label); });
    heading.append(question, tags);
    const icon = document.createElement('span');
    icon.className = 'chevron';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = details.open ? '−' : '+';
    details.addEventListener('toggle', () => { icon.textContent = details.open ? '−' : '+'; });
    summary.append(heading, icon);
    const answer = document.createElement('div');
    answer.className = 'answer';
    // Only checked-in editorial HTML is rendered; search input is never used as HTML.
    answer.innerHTML = article.answer;
    const actions = document.createElement('div');
    actions.className = 'article-actions';
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'permalink';
    link.textContent = 'Copy link to this answer';
    const status = document.createElement('span');
    status.className = 'copy-link-status';
    status.setAttribute('role', 'status');
    link.addEventListener('click', async () => {
      const url = new URL(location.href);
      url.search = '';
      url.hash = article.id;
      try {
        await navigator.clipboard.writeText(url.href);
        status.textContent = 'Link copied!';
      } catch {
        status.textContent = `Copy this link: ${url.href}`;
      }
    });
    actions.append(link, status);
    if ((search.value.trim() || category !== article.category) && articles.some(other =>
      other.id !== article.id && other.category === article.category && (platform === 'all' || other.platforms.includes(platform)))) {
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'related-topic';
      more.textContent = `More in ${article.category}`;
      more.addEventListener('click', () => {
        search.value = '';
        category = article.category;
        render(true);
        viewResults();
      });
      actions.append(more);
    }
    if (article.videoUrl) {
      try {
        const url = new URL(article.videoUrl);
        if (url.protocol === 'https:' && ['youtube.com', 'www.youtube.com', 'youtu.be'].includes(url.hostname)) {
          const video = document.createElement('a');
          video.href = url.href; video.target = '_blank'; video.rel = 'noopener noreferrer';
          video.textContent = '▷ Watch the tutorial on YouTube'; actions.prepend(video);
        }
      } catch { /* Ignore unfinished tutorial URLs. */ }
    }
    answer.append(actions); details.append(summary, answer); list.append(details);
  });
  document.querySelector('#results-title')!.textContent = search.value.trim() ? 'Search results' : category;
  document.querySelector('#result-count')!.textContent = `${visible.length} ${visible.length === 1 ? 'answer' : 'answers'}`;
  const query = search.value.trim();
  document.querySelector('#search-status')!.textContent = query
    ? `${visible.length ? `Search updated - ${visible.length} ${visible.length === 1 ? 'answer' : 'answers'} found` : 'Search updated - no matching answers'}${platform !== 'all' || category !== 'All questions' ? ' with your filters' : ''}.`
    : category !== 'All questions' ? `Showing all ${visible.length} ${visible.length === 1 ? 'answer' : 'answers'} in ${category}${platform !== 'all' ? ` for ${platform}` : ''}.` : 'Results update as you type.';
  (document.querySelector('#view-results') as HTMLButtonElement).hidden = !query || !visible.length;
  (document.querySelector('#empty') as HTMLElement).hidden = visible.length !== 0;
  platformButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.platform === platform)));
}
search.addEventListener('input', () => render());
function viewResults() {
  search.blur();
  const answers = document.querySelector<HTMLElement>('#answers')!;
  answers.scrollIntoView({ block: 'start' });
  answers.focus({ preventScroll: true });
}
search.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); viewResults(); } });
document.querySelector('#view-results')!.addEventListener('click', viewResults);
platformButtons.forEach(button => button.addEventListener('click', () => { platform = button.dataset.platform!; render(); }));
document.querySelector('#reset')!.addEventListener('click', () => { search.value = ''; platform = 'all'; category = 'All questions'; render(); search.focus(); });
document.addEventListener('keydown', event => {
  if (event.key === '/' && !dialog.open && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement) && !(event.target as HTMLElement)?.isContentEditable) {
    event.preventDefault(); search.focus();
  }
});
function openHash() {
  const id = location.hash.slice(1);
  if (!articles.some(article => article.id === id)) return;
  search.value = ''; category = 'All questions'; platform = 'all'; render();
  const article = document.getElementById(id) as HTMLDetailsElement;
  article.open = true;
  article.scrollIntoView({ block: 'center' });
  article.querySelector('summary')!.focus({ preventScroll: true });
}
window.addEventListener('hashchange', openHash);
render();
if (location.hash) openHash();
let opener: HTMLElement | null = null;
document.querySelectorAll<HTMLButtonElement>('.contact-trigger').forEach(button => button.addEventListener('click', () => {
  opener = button;
  (document.querySelector('#email-details') as HTMLElement).hidden = true;
  (document.querySelector('#reveal-email') as HTMLElement).hidden = false;
  document.querySelector('#copy-status')!.textContent = '';
  dialog.showModal();
}));
dialog.querySelector('.close')!.addEventListener('click', () => dialog.close());
document.querySelector('#search-faq')!.addEventListener('click', () => {
  opener = search;
  dialog.close();
  search.scrollIntoView({ block: 'center' });
  search.focus({ preventScroll: true });
});
dialog.addEventListener('close', () => opener?.focus());
dialog.addEventListener('click', event => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
const email = 'support@voiceprompter.app';
document.querySelector('#reveal-email')!.addEventListener('click', () => {
  document.querySelector('#email-address')!.textContent = email;
  const body = 'Hi Konstantin,\n\nName:\nDevice model:\nOS / app version:\n\nIssue and steps to reproduce:\n\nMicrophone / connection (if relevant):\n\nI will attach a screenshot or short recording for an issue, or my store receipt for a purchase question.\n';
  const link = document.querySelector<HTMLAnchorElement>('#mail-link')!;
  link.href = `mailto:${email}?subject=${encodeURIComponent('VoicePrompter support')}&body=${encodeURIComponent(body)}`;
  (document.querySelector('#email-details') as HTMLElement).hidden = false;
  (document.querySelector('#reveal-email') as HTMLElement).hidden = true;
  link.focus();
});
document.querySelector('#copy-email')!.addEventListener('click', async () => {
  const status = document.querySelector('#copy-status')!;
  try { await navigator.clipboard.writeText(email); status.textContent = 'Email address copied. Please include the details above :)'; }
  catch { status.textContent = 'Could not copy automatically. Select and copy the address above.'; }
});
