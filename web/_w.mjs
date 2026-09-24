import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/usr/bin/chromium-browser' });
for (const url of ['https://hackathon-aim-2026.vercel.app/']) {
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  p.on('response', r => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
  await p.goto(url); await p.waitForTimeout(2500);
  console.log('root children:', await p.evaluate(() => document.getElementById('root')?.children.length));
  console.log(errs.join('\n') || 'no errors');
  for (const name of ['Opportunités & parcours', 'Suivi des parcours']) { try { await p.locator('.sidebar nav').getByText(name, { exact: true }).click({ timeout: 3000 }); await p.waitForTimeout(500); console.log(name, 'root:', await p.evaluate(() => document.getElementById('root')?.children.length)); } catch (e) { console.log(name, 'FAIL', e.message.split('\n')[0]); } }
  try { await p.getByText('Vue résidente (démo)').click({ timeout: 3000 }); await p.waitForTimeout(800); console.log('resident root:', await p.evaluate(() => document.getElementById('root')?.children.length)); } catch (e) { console.log('resident FAIL', e.message.split('\n')[0]); }
  console.log(errs.join('\n') || 'no errors after nav');
}
await b.close();
