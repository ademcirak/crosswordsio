const request = require('request');
const fs = require('fs');

var converter = require('../server/converter');

const nyt_cookie = process.env.NYT_COOKIE;
if (!nyt_cookie) {
  console.log('no nyt cookie detected. did you forget to source .env?');
  process.exit(0);
}

function download(date) {
  return new Promise(function(resolve, reject) {
    date = date.toISOString().substr(0, 10);
    console.log(date);
    const path = 'downloads/' + date.substr(0, 4) + '' + date.substr(5, 2) + '' + date.substr(8, 2) + '.puz';
    const url = 'https://www.nytimes.com/svc/crosswords/v2/puzzle/daily-' + date + '.puz';
    console.log('ON', url);
    if (fs.existsSync(path)) {
      console.log('SKIPPING', date);
      resolve();
    } else {
      console.log('DOWNLOADING', date);
      request({
        url: url,
        headers: { cookie: nyt_cookie }
      }).pipe(fs.createWriteStream(path)).on('finish', () => {
        resolve();
      });
    }
  });
}

function addDays(date, days) {
  let res = new Date(date);
  res.setDate(date.getDate() + days);
  return res;
}

async function go() {
  const start_date = new Date("2000-01-01");
  const end_date = new Date("2012-12-31");
  for (var i = 0; i < 10000; i += 1) {
    const date = addDays(start_date, i);
    if (date <= end_date) {
      await download(date);
    } else break;
  }
}
go();
//download(start_date);
