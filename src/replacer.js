import Parser from 'rss-parser';
import fetch from 'node-fetch-retry';
import * as cheerio from 'cheerio';
import RSS from 'rss';
import { URL } from 'url';
import redis from './cache.js';

const parser = new Parser();

const opts = {
  retry: 5,
  pause: 100,
  silent: true,
};

function replace(body, selectors, baseUrl) {
  const page = cheerio.load(body, null, false);

  // make the urls absolute
  page('img').each((_, e) => page(e).attr('src', new URL(page(e).attr('src'), baseUrl)));
  page('a').each((_, e) => page(e).attr('href', new URL(page(e).attr('href'), baseUrl)));

  const description = selectors.map((s) => page.html(page(s))).join('</br>');

  return description;
}

export async function get(url, selectors) {
  const feed = await parser.parseURL(url);

  const newFeed = new RSS({
    title: feed.title,
    feed_url: feed.feedUrl,
    site_url: feed.link,
  });

  await Promise.all(feed.items.map(async (item) => {
    const cached = await redis.get(`${feed.link}:${item.link}`);
    let body;
    if (cached) {
      body = cached;
    } else {
      const res = await fetch(item.link, opts);
      body = await res.text();
      await redis.setEx(`${feed.link}:${item.link}`, 60 * 60 * 24 * 7, body);
    }

    const description = replace(body, selectors, item.link);

    newFeed.item({
      title: item.title,
      url: item.link,
      guid: item.guid,
      date: item.pubDate,
      description,
    });
  }));

  return newFeed;
}

export default { get };
