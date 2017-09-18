import logger from './logger'
import fs from 'fs';
import getGMClient from './googleMapsClient'

export default async function parseData(article) {
  let {
    description,
  } = article;

  try {
    description = description.toLowerCase();
    const streetNames = await getStreetNames();
    const snSet = new Set(streetNames);

    const potentialStreets = [];
    const tokens = getTokens(description);

    for (const word of tokens) {
      if (snSet.has(word)) {
        potentialStreets.push(word);
      }
    }

    // logger.debug('potentialstreets', potentialStreets);
    let location = null;
    if (potentialStreets.length === 2) {
      location = await getLocation(potentialStreets[0], potentialStreets[1]);
      // logger.debug('OMG STREET GOTTEN', location);
      location = cleanLocationData(location);
    }

    return {
      ...article,
      location,
    }
  } catch (e) {
    logger.error(e);
  }
}

function cleanLocationData(location) {
  const result = location.results[0];
  return {
    address: result.formatted_address,
    geoData: result.geometry.location,
  };
}

async function getLocation(street1, street2) {
  const SUFFIX = ', San Francisco, CA';
  const intersection = street1 + ' and ' + street2;
  return new Promise((resolve, reject) => {
    getGMClient().geocode({
      address: intersection + SUFFIX
    }, (err, resp) => {
      if (err) reject(err);
      resolve(resp.json);
    })
  })
}

function getTokens(text) {
  const tokens1 = text.split(' ');
  const tokens2 = multiToken(tokens1, 2);
  const tokens3 = multiToken(tokens1, 3);
  const tokens4 = multiToken(tokens1, 4);
  return [...tokens1, ...tokens2, ...tokens3, ...tokens4];
}

function multiToken(tokens, tupleSize) {
  return tokens.map((token, index, array) => {
    if (index + tupleSize - 1 < array.length) {
      let newToken = token;
      for (let i = 1; i < tupleSize; i++) {
        newToken += ' ' + array[index + i]
      }
      return newToken;
    }
    return 'DUMMMYTOKENUSELESS';
  });
}

const getLocalData = async () => {
  return new Promise((resolve, reject) => {
    fs.readFile('./allStreets.txt', 'utf8', (err, data) => {
      if (err) reject(err);
      // logger.debug('fetching from local streetnames');
      data = data.split(',');
      resolve(data);
    });
  })
}

async function getStreetNames() {
  const data = await getLocalData();
  if (!data) {
    return new Promise((resolve, reject) => {
      fs.readFile('./Street_Names.csv', 'utf8', (err, data) => {
        if (err) reject(err);
        const items = data.split(/\r?\n/);
        items.shift();
        // logger.debug('creating streetnames');
        resolve(
          items.map(row => row.split(',')[1])
          .map(row => row ? row.toLowerCase() : 'DUMYSTREETFAKE')
          .map(row => row[0] === '0' ? row.slice(1) : row)
        );
      });
    });
  }
  return data
}
