export default (data) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(data, 'text/xml');
  const parseError = dom.querySelector('parsererror');

  if (parseError) {
    const error = new Error(parseError.textContent);
    error.isParsingError = true;
    error.data = data;
    throw error;
  }

  const channelTitle = dom.querySelector('channel > title').textContent;
  const channelDescription = dom.querySelector('channel > description').textContent;

  const itemsNodes = dom.querySelectorAll('item');
  const items = [...itemsNodes].map((item) => {
    const title = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    const description = item.querySelector('description').textContent;

    return { title, link, description };
  });

  return { title: channelTitle, description: channelDescription, items };
};
