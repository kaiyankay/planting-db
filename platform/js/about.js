// Planting Intelligence · About (V4). One module for the four About pages; the page is named by <body data-about>.
import * as PI from './platform.js';
const $ = s => document.querySelector(s);
const page = document.body.dataset.about || 'project';
(async function boot() {
  const d = await PI.loadSnapshot(); PI.mountTop($('#top'), { active: 'about', section: page, snapshot: d }); $('#foot').innerHTML = PI.footHtml(d);
  $('#app').innerHTML = '<p class="pi-loading">This page is being written.</p>';
})();
