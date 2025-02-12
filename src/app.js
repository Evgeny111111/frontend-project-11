import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import { differenceBy } from 'lodash';
import watch from './view.js';
import ru from './locales/index.js';
import getParsingData from './parser.js';

const TIMEOUT_OF_FETCH = 2000;
const TIMEOUT_OF_REQUEST = 5000;

const getLoadingProcessError = (error) => {
  switch (true) {
    case error.isParsingError:
      return 'notRSS';
    case error.isAxiosError:
      return 'network';
    case error.isAxiosError && error.message.includes('timeout'):
      return 'timeout';
    default:
      return 'unknown';
  }
};

const addProxy = (newURL) => {
  const proxyUrl = new URL('/get', 'https://allorigins.hexlet.app');
  proxyUrl.searchParams.set('url', newURL);
  proxyUrl.searchParams.set('disableCache', 'true');
  return proxyUrl.toString();
};

const getUniqueId = () => `${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

const readRss = (watchedState, url) => {
  // eslint-disable-next-line no-param-reassign
  watchedState.loadingProcess = { status: 'loading', error: null };

  return axios
    .get(addProxy(url), { timeout: TIMEOUT_OF_REQUEST })
    .then((response) => {
      const { title, description, items } = getParsingData(response.data.contents);

      const feed = {
        id: getUniqueId(),
        url,
        title,
        description,
      };

      const posts = items.map((item) => ({
        ...item,
        channelId: feed.id,
        id: getUniqueId(),
      }));

      // eslint-disable-next-line no-param-reassign
      watchedState.loadingProcess = { status: 'success', error: null };
      watchedState.feeds.unshift(feed);
      watchedState.posts.unshift(...posts);
    })
    .catch((error) => {
      // eslint-disable-next-line no-param-reassign
      watchedState.loadingProcess = { status: 'failed', error: getLoadingProcessError(error) };
    });
};

const fetchNewPosts = (watchedState) => {
  const promises = watchedState.feeds.map((feed) => axios
    .get(addProxy(feed.url), { timeout: TIMEOUT_OF_REQUEST })
    .then((response) => {
      const { items: loadedPosts } = getParsingData(response.data.contents);
      const previousPosts = watchedState.posts.filter((post) => post.channelId === feed.id);
      const newPosts = differenceBy(loadedPosts, previousPosts, 'title')
        .map((post) => ({
          ...post,
          channelId: feed.id,
          id: getUniqueId(),
        }));
      watchedState.posts.unshift(...newPosts);
    })
    .catch((err) => {
      // eslint-disable-next-line no-param-reassign
      watchedState.loadingProcess = { status: 'failed', err: getLoadingProcessError(err) };
    }));

  Promise.all(promises).finally(() => {
    setTimeout(() => fetchNewPosts(watchedState), TIMEOUT_OF_FETCH);
  });
};

const validateUrl = (url, feeds) => {
  const feedUrls = feeds.map((feed) => feed.url);
  const schema = yup.string().url().required();

  return schema
    .notOneOf(feedUrls)
    .validate(url)
    .then(() => null)
    .catch((error) => error.message);
};

const app = () => {
  const initialState = {
    form: {
      isValid: false,
      error: null,
    },
    loadingProcess: {
      status: 'success',
      error: null,
    },
    feeds: [],
    posts: [],
    watchedPosts: new Set(),
    modal: {
      postId: '',
    },
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('.form-control'),
    submit: document.querySelector('.rss-form button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    feedsCards: document.querySelector('.feeds'),
    postsCards: document.querySelector('.posts'),
    postTemplate: document.querySelector('#postItem'),
    feedTemplate: document.querySelector('#feedItem'),
    modalTemplate: document.querySelector('#modal'),
  };

  const locale = {
    string: {
      url: () => ({ key: 'notURL' }),
    },
    mixed: {
      notOneOf: () => ({ key: 'exists' }),
    },
  };

  const i18n = i18next.createInstance();

  i18n
    .init({
      lng: 'ru',
      debug: false,
      resources: ru,
    })
    .then(() => {
      yup.setLocale(locale);
      const watchedState = watch(elements, initialState, i18n);

      elements?.form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const url = data.get('rss');

        validateUrl(url, watchedState.feeds)
          .then((error) => {
            if (!error) {
              watchedState.form = { isValid: true, error: null };
              readRss(watchedState, url);
            } else {
              watchedState.form = { isValid: false, error: error.key };
            }
          });
      });

      elements?.postsCards?.addEventListener('click', (e) => {
        if ('id' in e.target.dataset) {
          const { id } = e.target.dataset;
          watchedState.modal.postId = String(id);
          watchedState.watchedPosts.add(id);
        }
      });
      setTimeout(() => fetchNewPosts(watchedState), TIMEOUT_OF_FETCH);
    });
};

export default app;
