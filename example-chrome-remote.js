require('source-map-support').install();
const Rx = require('rxjs');
const chrome = require('chrome-remote-interface');
const {createSystem} = require('./dist/index');
const Launcher = require('./fixtures/launcher');
const Page = require('./fixtures/page');
const Navigate = require('./fixtures/navigate');

const system = createSystem();
const launcher = system.actorOf(Launcher, 'launcher');
const navigator = system.actorOf(Navigate, 'navigate');

const initLauncher = launcher.ask('init');
const navigate     = navigator.ask('https://www.chromestatus.com/');
const page         = Page.ask('manifest');

Rx.Observable.concat(initLauncher, navigate)
    .subscribe(x => {
        console.log('pipeline done');
    })

// function onPageLoad(Page) {
//     return Page.getAppManifest().then(response => {
//         if (!response.url) {
//             console.log('Site has no app manifest');
//             return;
//         }
//         console.log('Manifest: ' + response.url);
//         console.log(response.data);
//     });
// }

// launchChrome().then(launcher => {
//
//     chrome(protocol => {
//         // Extract the parts of the DevTools protocol we need for the task.
//         // See API docs: https://chromedevtools.github.io/debugger-protocol-viewer/
//         const {Page} = protocol;
//
//         // First, enable the Page domain we're going to use.
//         Page.enable().then(() => {
//             Page.navigate({url: 'https://www.chromestatus.com/'});
//
//             // Wait for window.onload before doing stuff.
//             Page.loadEventFired(() => {
//                 onPageLoad(Page)).then(() => {
//                 protocol.close();
//                 launcher.kill(); // Kill Chrome.
//             });
//         });
//     });
//
// }).on('error', err => {
//     throw Error('Cannot connect to Chrome:' + err);
// });
//
// });