const express = require('express');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;

const MONITOR_URL = 'https://www.lcdes.org/monitor.html';

app.get('/api/incidents', async (req, res) => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: puppeteer.executablePath(), // force use of bundled Chromium
    });

    const page = await browser.newPage();
    await page.goto(MONITOR_URL, { waitUntil: 'networkidle0' });

    const content = await page.content();
    await browser.close();

    const $ = cheerio.load(content);
    const incidents = [];

    $('tr.dispatchRow').each((i, row) => {
      const tds = $(row).find('td');
      const incident = {
        time: $(tds[0]).text().trim(),
        type: $(tds[1]).text().trim(),
        address: $(tds[2]).text().trim(),
        city: $(tds[3]).text().trim(),
        unit: $(tds[4]).text().trim(),
      };
      incidents.push(incident);
    });

    res.json(incidents);
  } catch (error) {
    console.error('Scraping failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch incident data.' });
  }
});

app.get('/', (req, res) => {
  res.send('Lebanon Dispatch Monitor API is running.');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
