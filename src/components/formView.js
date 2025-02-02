import onChange from 'on-change';
import { state, validate } from './app.js';

const updateUI = () => {
  const { errors, processState } = state.form;
  const field = document.querySelector('#url-input');
  const submitButton = document.querySelector('[type="submit"]');
  const feedback = document.querySelector('.feedback');

  feedback.textContent = '';

  switch (processState) {
    case 'sent':
      feedback.textContent = 'RSS успешно добавлен';
      feedback.style.color = 'green';
      field.style.color = 'green';
      field.value = '';
      field.focus();
      submitButton.disabled = false;
      break;

    case 'error':
      feedback.textContent = errors.name ? errors.name : 'Произошла ошибка';
      feedback.style.color = 'red';
      field.style.color = 'red';
      submitButton.disabled = false;
      break;

    case 'sending':
      feedback.style.color = '';
      field.style.color = '';
      submitButton.disabled = true;
      break;

    case 'filling':
      feedback.textContent = '';
      feedback.style.color = '';
      field.style.color = '';
      submitButton.disabled = false;
      break;

    default:
      throw new Error(`Неизвестное состояние процесса: ${processState}`);
  }
};

const formView = () => {
  const formElement = document.querySelector('form');
  const inputElement = document.querySelector('#url-input');

  const watchedState = onChange(state, (path) => {
    if (path === 'form.values.name') {
      const existingValues = state.feeds.map((feed) => feed.name);
      validate(state.form, existingValues)
        .then((errors) => {
          state.form.errors = errors;
          updateUI();
        })
        .catch((e) => {
          console.error('Ошибка валидации:', e);
        });
    }
  });

  inputElement.addEventListener('input', () => {
    state.form.values.name = inputElement.value;
  });

  formElement.addEventListener('submit', (e) => {
    const { id, value } = e.target;
    watchedState.form[id] = value;
    e.preventDefault();
    if (Object.keys(state.form.errors).length === 0) {
      state.form.processState = 'sending';
      state.feeds.push({ name: state.form.values.name });
      state.form.processState = 'sent';
    } else {
      state.form.processState = 'filling';
    }
  });

  return {
    handleProcessState: (processState) => {
      state.form.processState = processState;
    },
  };
};

export default formView;
