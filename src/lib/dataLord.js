import axios from 'axios';
import fs from 'fs';

import logger from './logger';
import parseData from './dataParser';

const LAST_KNOWN_PAGE = 10;

const ARTICLES_FILE_PATH = './articles.txt';

const WRAP_API_URL = 'https://wrapapi.com/use/qt31415926/mission/trouble/latest';
const WRAP_API_KEY = process.env.WRAP_API_KEY;

let Singleton = null;

export default class DataLord {
  constructor() {
    if (!Singleton) {
      Singleton = this;
      this.data = {};
      this.cachedParsedData = null;
    }
    return Singleton;
  }

  async initializeData() {
    this.data = await fetchData();
  }

  async getCachedData() {
    return this.cachedParsedData;
  }

  async setCachedData(data) {
    this.cachedParsedData = data;
  }

  async getParsedData() {
    let parsedData = [];
    const cachedData = await this.getCachedData();
    if (cachedData) {
      parsedData = cachedData;
    } else {
      for (const article of this.data) {
        parsedData.push(await parseData(article));
      }
      await this.setCachedData(parsedData);
    }
    return parsedData;
  }
}

async function fetchData() {
  let data;
  try {
    data = await getLocalData();
  } catch (e) {
    logger.error(e);
  }

  if (!data) {
    try {
      data = await getInitialData();
    } catch (e) {
      logger.error('Could not retrieve initial data', e);
    }
  }

  // logger.debug('retrieved data', data);
  return data;
}

const getLocalData = async () => {
  return new Promise((resolve, reject) => {
    fs.readFile(ARTICLES_FILE_PATH, 'utf8', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      data = JSON.parse(data);
      resolve(data);
    });
  })
}

const getPageData = async pageId => {
  try {
    const response = await axios({
      url: WRAP_API_URL,
      method: 'post',
      data: {
        'wrapAPIKey': WRAP_API_KEY,
        pageId,
      }
    });

    const wrapApiResponse = response.data;

    if (wrapApiResponse.success) {
      const articles = wrapApiResponse.data.articles;
      // logger.debug('adding ', articles);
      return Object.values(articles);
    } else {
      logger.error('failed to get data from wrapapi');
    }
    return [];
  } catch (e) {
    logger.error('Failed to fetch from wrap api endpoint', e);
    return [];
  }
}

const getInitialData = async () => {
  let allArticles = []
  for (let i = 1; i <= LAST_KNOWN_PAGE; i++) {
    const articleList = await getPageData(i);
    allArticles = allArticles.concat(articleList);
  }

  // logger.debug('writing all articles to file');
  await writeToFile('articles.txt', allArticles);
}

const writeToFile = (fn, articles) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(fn, JSON.stringify(articles), (err) => {
      if (err) {
        return logger.error(err);
      } else {
        resolve()
      }
    });
  });
}
