// Dev-only browser check. Needs Playwright + Chrome: PLAYWRIGHT_MODULE=/path/to/node_modules/playwright CHROME_PATH=... node tests/ui.cjs
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const path=require('path');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport:{width:370,height:710},deviceScaleFactor:2});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.resolve('Resources/index.html'));
 await page.screenshot({path:'build/preview.png'});
 assert.equal(await page.locator('.card').count(),3);
 const first=await page.locator('.task-title').first().textContent();
 await page.locator('.check').first().click();assert.equal(await page.locator('.done').count(),1);
 await page.reload();assert.equal(await page.locator('.done').count(),1);assert.equal(await page.locator('.task-title').first().textContent(),first);
 const before=await page.locator('.task-title').nth(1).textContent();await page.locator('.swap').first().click();assert.notEqual(await page.locator('.task-title').nth(1).textContent(),before);
 await page.locator('.check').nth(1).click();await page.locator('.check').nth(2).click();
 assert.equal(await page.locator('.done').count(),3);assert(await page.locator('#celebrate').isVisible());
 await page.waitForTimeout(400);await page.screenshot({path:'build/celebration.png'});
 const canvasDrawn=await page.evaluate(()=>{const c=document.querySelector('canvas');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>0)});assert(canvasDrawn);
 await page.reload();assert.equal(await page.locator('.done').count(),3);assert.equal(await page.locator('#toast.show').count(),0);
 await page.locator('#about').click();assert(await page.locator('dialog').isVisible());await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollHeight>innerHeight),false,'completed UI fits window');
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#celebrate').click();assert(await page.locator('#toast').isVisible());
 assert.equal(await page.evaluate(()=>document.querySelector('canvas').width),300,'reduced motion does not animate');
 // Build a local icon from the exact vector mascot, without remote assets.
 const svg=await page.locator('.mascot').evaluate(el=>el.outerHTML);
 await page.setViewportSize({width:1024,height:1024});
 await page.setContent(`<style>body{margin:0;background:transparent}.icon{width:824px;height:824px;margin:100px;border-radius:186px;background:#faf2e5;box-shadow:0 15px 40px #56443322;display:flex;align-items:center;justify-content:center}.icon svg{width:740px;height:740px;}</style><div class="icon">${svg}</div>`);
 await page.screenshot({path:'build/icon-1024.png',omitBackground:true});
 assert.deepEqual(errors,[]);console.log('UI PASS: completion, swapping, reload persistence, celebration pixels, modal, window fit, reduced motion.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
