const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER:', msg.text()));

  await page.goto('http://localhost:4200/question-and-answer/ask-assistant');

  await page.evaluate(() => {
    // Inject a global custom fetch interceptor to spy on the stream
    const rawFetch = window.fetch;
    window.fetch = async (...args) => {
      console.log('Intercepted fetch:', args[0]);
      if(typeof args[0] === 'string' && args[0].includes('/api/chat')) {
        const response = await rawFetch(...args);
        console.log('Stream matched, response status:', response.status);
        const reader = response.clone().body.getReader();
        const decoder = new TextDecoder();
        (async () => {
          let c = 0;
          while(true) {
            const {done, value} = await reader.read();
            if(done) { console.log('Raw fetch done'); break; }
            c++;
            console.log('RAW CHUNK ' + c + ':', decoder.decode(value, {stream: true}).trim());
          }
        })();
        return response;
      }
      return rawFetch(...args);
    };
  });

  await page.locator('textarea[name="ask"]').fill('Hello playwright test');
  await page.locator('.ask-assistant-page__submit-button').click();
  
  await page.waitForTimeout(10000);
  await browser.close();
})();
