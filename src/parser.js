const parse = (data) => {
  const parser = new DOMParser();
  const parsedDoc = parser.parseFromString(data, 'text/xml');
  const errorNode = parsedDoc.querySelector('parsererror');
  if (errorNode) {
    throw new Error('invalidRss');
  } else {
    const channel = parsedDoc.querySelector('channel');
    const feedTitle = channel.querySelector('title');
    const feedDescription = channel.querySelector('description');
    const feed = {
      feedTitle: feedTitle.textContent,
      feedDescription: feedDescription.textContent,
    };
    const items = channel.querySelectorAll('item');
    const posts = [...items].map((item) => {
      const title = item.querySelector('title').textContent;
      const description = item.querySelector('description').textContent;
      const link = item.querySelector('link').textContent;
      return { title, description, link };
    });
    const resolveData = { feed, posts };
    return Promise.resolve(resolveData);
  }
};

export default parse;
