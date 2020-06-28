import { unlink } from 'fs';
import { promisify } from 'util';
import { resolve } from 'path';

import { closeBrowser } from '../src/getContent';
import { deleteAllData } from '../src/targets/data';
import { paths } from './setup';

const deleteFile = promisify(unlink);

export default (): Promise<never> =>
  Promise.all([
    closeBrowser(),
    deleteAllData(),
    deleteFile(paths.exportAbsolute),
    deleteFile(resolve(process.cwd(), paths.exportRelative)),
    deleteFile(paths.default),
  ]).then(() => process.exit());
