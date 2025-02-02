import yup from 'yup';

export const state = {
  form: {
    errors: {},
    values: {
      name: '',
    },
    processState: 'filling',
    isValid: false,
  },
  feeds: [],
};
const schema = yup.object({
  name: yup.string().url('The link must be a valid URL').required('URL is required'),
});
export const checkDuplicates = (formState, feeds) => {
  const { name } = formState.values;
  if (feeds.some((feed) => feed.name === name)) {
    return Promise.reject(new Error('This URL already exists'));
  }
  return Promise.resolve({});
};
export const yupValidate = (formState) => schema.validate(formState.values, { abortEarly: false })
  .then(() => {})
  .catch((validationError) => {
    const errors = validationError.inner.reduce((acc, err) => {
      acc[err.path] = err.message;
      return acc;
    }, {});
    return Promise.reject(errors);
  });
export const validate = (formState, feeds) => Promise.all([
  yupValidate(formState),
  checkDuplicates(formState, feeds),
])
  .then(() => ({}))
  .catch((errors) => {
    console.error('Errors in validate function:', errors);
    return errors;
  });
