import onChange from 'on-change';
import i18n from 'i18next';
import * as yup from 'yup';
import _ from 'lodash';
import axios from 'axios';
import parse from './parser.js';
import render from './view.js';
import ru from './locales/index.js';

const validateURL = (url, addedLinks, i18nInstance) => {
  yup.setLocale({
    mixed: {
      notOneOf: i18nInstance.t('feedback.duplicate'),
    },
    string: {
      url: i18nInstance.t('feedback.invalidUrl'),
    },
  });

  const schema = yup.string()
    .trim()
    .required(i18nInstance.t('feedback.required'))
    .url(i18nInstance.t('feedback.invalidUrl'))
    .notOneOf(addedLinks, i18nInstance.t('feedback.duplicate'))
    .validate(url);
  return schema;
};

const getRssData = (link) => {
  const allOrigins = `https://allorigins.hexlet.app/get?url=${encodeURIComponent(link)}`;
  return axios.get(allOrigins);
};

const normalizeFeed = (feed) => {
  const { feedTitle, feedDescription, link } = feed;
  const fullFeedData = {
    id: Number(_.uniqueId()),
    title: feedTitle,
    description: feedDescription,
    link,
  };
  return fullFeedData;
};

const normalizePosts = (parcedPosts) => {
  const posts = parcedPosts.map((post) => {
    const id = Number(_.uniqueId());
    const { title, description, link } = post;
    return {
      id,
      title,
      description,
      link,
    };
  });
  return posts;
};

const defaultTimeout = 5000;

const updatePosts = (state) => {
  const stateCopy = _.cloneDeep(state);
  const currentPosts = stateCopy.posts;
  const currentPostsLinks = currentPosts.map((cPost) => cPost.link);
  const { feeds } = stateCopy;

  const parsedFeedsPromise = feeds.map(({ link }) => getRssData(link)
    .then((response) => parse(response.data.contents))
    .then((parsedData) => normalizePosts(parsedData.posts))
    .catch((error) => {
      stateCopy.error = error;
    }));

  Promise.all(parsedFeedsPromise)
    .then((normalizedPosts) => {
      const flatNormalizedPosts = normalizedPosts.flat();
      flatNormalizedPosts.forEach((normPost) => {
        if (!currentPostsLinks.includes(normPost.link)) {
          stateCopy.posts.unshift(normPost);
        }
      });
      // eslint-disable-next-line no-param-reassign
      state.posts = stateCopy.posts;
    })
    .catch((error) => {
      stateCopy.error = error;
    })
    .finally(() => {
      setTimeout(() => {
        updatePosts(state);
      }, defaultTimeout);
    });
};

const app = () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('#url-input'),
    submit: document.querySelector('button[type=submit]'),
    feedback: document.querySelector('.feedback'),
  };
  const { form } = elements;

  const i18nInstance = i18n.createInstance();
  i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources: { ru },
  });

  const state = {
    form: {
      isValid: false,
      formState: 'idle',
    },
    addedLinks: [],
    feeds: [],
    posts: [],
    viewedPosts: [],
    activePost: null,
    error: null,
    ui: {
      submitDisabled: false,
    },
    feedback: {
      success: i18nInstance.t('feedback.success'),
      invalidRss: i18nInstance.t('feedback.invalidRss'),
      invalidUrl: i18nInstance.t('feedback.invalidUrl'),
      duplicate: i18nInstance.t('feedback.duplicate'),
      networkError: i18nInstance.t('feedback.networkError'),
    },
  };

  const watchedState = onChange(state, () => {
    render(state, elements, i18nInstance);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    watchedState.error = null;
    watchedState.form.formState = 'sending';
    watchedState.ui.submitDisabled = true;
    const formData = new FormData(e.target);
    const url = formData.get('url');
    validateURL(url, watchedState.addedLinks, i18nInstance)
      .then((validUrl) => getRssData(validUrl))
      .then((response) => parse(response.data.contents))
      .then((parsedData) => {
        const { feed } = parsedData;
        feed.link = url;
        const normalizedParsedFeed = normalizeFeed(feed);
        watchedState.feeds.unshift(normalizedParsedFeed);
        const posts = normalizePosts(parsedData.posts);
        const allPosts = posts.concat(watchedState.posts);
        watchedState.posts = allPosts;
      })
      .then(() => {
        watchedState.form.isValid = true;
        watchedState.error = null;
        watchedState.addedLinks.push(url);
        watchedState.ui.submitDisabled = false;
        watchedState.form.formState = 'sent';
        updatePosts(watchedState);
      })
      .catch((error) => {
        const { message } = error;
        watchedState.form.formState = 'failed';
        watchedState.ui.submitDisabled = false;
        switch (message) {
          case 'Network Error':
            watchedState.error = i18nInstance.t('feedback.networkError');
            break;
          case 'invalidRss':
            watchedState.error = i18nInstance.t('feedback.invalidRss');
            break;
          default:
            watchedState.error = error.message;
            break;
        }
        watchedState.form.isValid = false;
        watchedState.ui.submitDisabled = false;
      });
    watchedState.form.formState = 'idle';
  });

  const posts = document.querySelector('.posts');
  posts.addEventListener('click', (e) => {
    e.stopPropagation();
    const targetId = Number(e.target.dataset.id);
    const viewedPost = watchedState.posts.find(({ id }) => id === targetId);
    if (viewedPost) {
      watchedState.activePost = viewedPost;
      watchedState.viewedPosts.push(viewedPost);
    }
  });
};

export default app;