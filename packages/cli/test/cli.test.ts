/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const cli = path.resolve(__dirname, '../lib/cli.js');

it('shows CLI help', () => {
  const output = execFileSync(process.execPath, [cli, '--help'], {
    encoding: 'utf8',
  });

  expect(output).toContain('eui <command>');
  expect(output).toContain('--help');
});
