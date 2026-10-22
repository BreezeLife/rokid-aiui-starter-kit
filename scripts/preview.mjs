import { join } from 'node:path';
import { root, selectedDemo, aix, save } from './tooling.mjs';

const demo = selectedDemo(process.argv[2]);
const help = aix(['--help'], { quiet: true }).stdout;
if (!/--html-out/.test(help)) throw new Error('Installed AIX does not advertise preview HTML export.');
save('output/previews/README.txt', 'AIX HTML exports. Open in a browser and inspect actual rendering. Export success is not runtime or device success.\n');
aix(['preview', join(root, 'demos', demo, 'app'), '--html-out', join(root, 'output/previews', `${demo}.html`)], { log: `output/verification/${demo}/preview-export` });
console.log(`Exported output/previews/${demo}.html. Serve output/previews over local HTTP to inspect. The browser runtime may still fail to start.`);
