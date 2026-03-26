import { readFileSync, writeFileSync } from 'node:fs';
import { parseRisSegmentHtml } from './src/ris/segment-parser.ts';
const html=readFileSync('../..//fixtures/ris/nor40214078-live.html','utf8');
const parsed=parseRisSegmentHtml(html);
writeFileSync('tmp-nor402-content.txt', parsed.content, 'utf8');
console.log(parsed.content.length);
