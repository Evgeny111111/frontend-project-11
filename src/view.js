const createContainer = (i18nInstance, item, watchedState) => {
  const itemsContainer = document.querySelector(`div.${item}`);

  const cardContainer = document.createElement('div');
  cardContainer.classList.add('card', 'border-0');
  itemsContainer.append(cardContainer);

  const titleCardContainer = document.createElement('div');
  titleCardContainer.classList.add('card-body');
  cardContainer.append(titleCardContainer);

  const titleContainer = document.createElement('h2');
  titleContainer.classList.add('card-title', 'h4');
  titleContainer.textContent = i18nInstance.t(`items.${item}`);
  titleCardContainer.append(titleContainer);

  const itemList = document.createElement('ul');
  itemList.classList.add('list-group', 'border-0', 'rounded-0');
  cardContainer.append(itemList);

  if (item === 'feeds') {
    watchedState.feeds.forEach((feed) => {
      const feedElement = document.createElement('li');
      feedElement.classList.add('list-group-item', 'border-0', 'border-end-0');

      const feedTitle = document.createElement('h3');
      feedTitle.classList.add('h6', 'm-0');
      feedTitle.textContent = feed.title;

      const feedDescription = document.createElement('p');
      feedDescription.classList.add('m-0', 'small', 'text-black-50');
      feedDescription.textContent = feed.description;

      feedElement.prepend(feedTitle, feedDescription);
      itemList.append(feedElement);
    });
  }

  if (item === 'posts') {
    watchedState.posts.forEach((post) => {
      const { link, id, title } = post;
      const postElement = document.createElement('li');
      postElement.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      const postLinkedTitle = document.createElement('a');
      postLinkedTitle.classList.add('fw-bold');
      postLinkedTitle.setAttribute('href', link);
      postLinkedTitle.dataset.id = id;
      postLinkedTitle.setAttribute('target', '_blank');
      postLinkedTitle.setAttribute('rel', 'noopener noreferrer');
      postLinkedTitle.textContent = title;

      const viewBtn = document.createElement('button');
      viewBtn.setAttribute('type', 'button');
      viewBtn.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      viewBtn.dataset.id = post.id;
      viewBtn.dataset.bsToggle = 'modal';
      viewBtn.dataset.bsTarget = '#modal';
      viewBtn.textContent = i18nInstance.t('view');
      postElement.append(postLinkedTitle, viewBtn);
      itemList.append(postElement);
    });
  }
};

const handleError = (elements, watchedState) => {
  const { error } = watchedState;
  const { input, submit, feedback } = elements;
  input.classList.add('is-invalid');
  input.removeAttribute('readonly');
  submit.removeAttribute('disabled');
  feedback.classList.replace('text-success', 'text-danger');
  feedback.textContent = error;
};

const handleSuccess = (elements, watchedState) => {
  const {
    form, input, submit, feedback,
  } = elements;
  input.classList.remove('is-invalid');
  input.removeAttribute('readonly');
  submit.removeAttribute('disabled');
  feedback.textContent = '';
  feedback.classList.remove('text-danger');
  feedback.classList.add('text-success');
  feedback.textContent = watchedState.feedback.success;
  form.reset();
  form.focus();
};

const normalizeModal = (state) => {
  const { viewedPosts, activePost } = state;
  viewedPosts.forEach((viewedPost) => {
    const { id } = viewedPost;
    const viewedPostElement = document.querySelector(`[data-id="${id}"]`);
    viewedPostElement.classList.remove('fw-bold');
    viewedPostElement.classList.add('fw-normal', 'link-secondary');
  });
  if (activePost) {
    const { title, description, link } = activePost;
    const modalTitle = document.querySelector('.modal-title');
    modalTitle.textContent = title;
    const modalDescr = document.querySelector('.modal-body');
    modalDescr.textContent = description;
    const modalLink = document.querySelector('.full-article');
    modalLink.setAttribute('href', link);
  }
};

const render = (watchedState, elements, i18nInstance) => {
  const {
    input, submit, feedback,
  } = elements;

  switch (watchedState.form.formState) {
    case 'idle': {
      feedback.textContent = '';
      feedback.classList.remove('text-success');
      feedback.classList.add('text-danger');
      input.classList.remove('is-invalid');
      submit.removeAttribute('submit');
      break;
    }
    case 'sending': {
      submit.disabled = watchedState.ui.submitDisabled;
      break;
    }
    case 'sent': {
      const postContainer = document.querySelector('.posts');
      postContainer.textContent = '';
      const feedContainer = document.querySelector('.feeds');
      feedContainer.textContent = '';
      handleSuccess(elements, watchedState);
      createContainer(i18nInstance, 'feeds', watchedState);
      createContainer(i18nInstance, 'posts', watchedState);
      break;
    }
    case 'failed': {
      handleError(elements, watchedState);
      break;
    }
    default:
      break;
  }
  normalizeModal(watchedState);
};

export default render;
