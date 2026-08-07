#!/usr/bin/env node

/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

export const cli = (args: string[] = hideBin(process.argv)) =>
  yargs(args)
    .scriptName('eui')
    .demandCommand(1)
    .strict()
    .recommendCommands()
    .help()
    .parseAsync();

if (require.main === module) {
  void cli();
}
