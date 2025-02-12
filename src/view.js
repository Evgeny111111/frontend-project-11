import onChange from 'on-change';
import { find } from 'lodash';

export default (elements, state, i18n) => {
  const handleForm = (currentState) => {
    const { input, feedback } = elements;
    const { isValid, error } = currentState.form;

    input.classList.toggle('is-invalid', !isValid);
    feedback.classList.toggle('text-success', isValid);
    feedback.classList.toggle('text-danger', !isValid);
    feedback.textContent = isValid ? '' : i18n.t([`errors.${error}`, 'errors.unknown']);
  };

  const handleLoadingProcess = (currentState) => {
    const { submit, input, feedback } = elements;
    feedback.classList.remove('text-success', 'text-danger');

    switch (currentState.loadingProcess.status) {
      case 'failed':
        submit.disabled = false;
        input.removeAttribute('readonly');
        feedback.classList.add('text-danger');
        feedback.textContent = i18n.t([`errors.${currentState.loadingProcess.error}`, 'errors.unknown']);
        break;
      case 'success':
        submit.disabled = false;
        input.removeAttribute('readonly');
        input.value = '';
        feedback.classList.add('text-success');
        feedback.textContent = i18n.t('loading.success');
        input.focus();
        break;
      case 'loading':
        submit.disabled = true;
        input.setAttribute('readonly', true);
        feedback.textContent = i18n.t('loading.loading');
        break;
      default:
        throw new Error(`Unknown loadingProcess status: '${currentState.loadingProcess.status}'`);
    }
  };

  const createCard = (title, items) => {
    const card = document.createElement('div');
    card.classList.add('card', 'border-0');
    card.innerHTML = '<div class="card-body"></div>';

    const cardTitle = document.createElement('h2');
    cardTitle.classList.add('card-title', 'h4');
    cardTitle.textContent = title;
    card.querySelector('.card-body').appendChild(cardTitle);

    const list = document.createElement('ul');
    list.classList.add('list-group', 'border-0', 'rounded-0');
    list.append(...items);
    card.appendChild(list);

    return card;
  };

  const handleFeeds = (currentState) => {
    const { feedsCards } = elements;
    const feedsItems = currentState.feeds.map((feed) => {
      const element = elements.feedTemplate.content.cloneNode(true);
      element.querySelector('h3').textContent = feed.title;
      element.querySelector('p').textContent = feed.description;
      return element;
    });

    feedsCards.innerHTML = '';
    feedsCards.appendChild(createCard(i18n.t('feeds'), feedsItems));
  };

  const handlePosts = (currentState) => {
    const { postsCards } = elements;
    const { posts, watchedPosts } = currentState;

    const postsItems = posts.map((post) => {
      const element = elements.postTemplate.content.cloneNode(true);
      const link = element.querySelector('a');
      link.classList.toggle('fw-bold', !watchedPosts.has(post.id));
      link.classList.toggle('fw-normal', watchedPosts.has(post.id));
      link.classList.toggle('link-secondary', watchedPosts.has(post.id));
      link.setAttribute('href', post.link);
      link.dataset.id = post.id;
      link.textContent = post.title;

      const button = element.querySelector('button');
      button.dataset.id = post.id;
      button.dataset.bsToggle = 'modal';
      button.dataset.bsTarget = '#modal';
      button.textContent = i18n.t('preview');
      return element;
    });

    postsCards.innerHTML = '';
    postsCards.appendChild(createCard(i18n.t('posts'), postsItems));
  };

  const handleModal = (currentState) => {
    const { modalTemplate } = elements;
    const { posts, modal } = currentState;

    const post = find(posts, { id: modal.postId });
    if (!post) return; // Защита от ошибок

    modalTemplate.querySelector('.modal-title').textContent = post.title;
    modalTemplate.querySelector('.modal-body').textContent = post.description;

    const readButton = modalTemplate.querySelector('[data-action="readFull"]');
    readButton.textContent = i18n.t('readFull');
    readButton.href = post.link;

    const closeButton = modalTemplate.querySelector('[data-action="close"]');
    closeButton.textContent = i18n.t('close');
  };

  const handlers = {
    form: handleForm,
    loadingProcess: handleLoadingProcess,
    feeds: handleFeeds,
    posts: handlePosts,
    'modal.postId': handleModal,
    'ui.watchedPosts': handlePosts,
  };

  const watchedState = onChange(state, (path) => {
    handlers[path]?.(state);
  });

  return watchedState;
};
