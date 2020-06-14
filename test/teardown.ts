import { rmdir } from 'fs';
import { promisify } from 'util';
import { closeBrowser } from '../src/getContent';
import { dataDir } from '../src/options';

export default (): Promise<never> =>
  Promise.all([closeBrowser(), promisify(rmdir)(dataDir, { recursive: true })]).then(() => process.exit());
