/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';

const cli = path.resolve(__dirname, '../lib/cli.js');

it('lists components as newline-delimited text', () => {
  const components = execFileSync(
    process.execPath,
    [cli, 'list', 'components'],
    { encoding: 'utf8' }
  )
    .trim()
    .split('\n');

  expect(components).toContain('EuiButton');
  expect(components).toContain('EuiGlobalStyles');
  expect(components).toContain('EuiSplitPanel');
  expect(components).toContain('EuiThemeProvider');
  expect(components).toContain('EuiWindowEvent');
  expect(components).not.toContain('EuiComponentDefaultsContext');
  expect(components).not.toContain('EuiMarkdownContext');
  expect(components).toEqual(
    [...components].sort((left, right) => left.localeCompare(right))
  );
});

it('generates command usage', () => {
  const output = execFileSync(process.execPath, [cli, '--help'], {
    encoding: 'utf8',
  });

  expect(output).toContain('eui <command>');
  expect(output).toContain('list <resource>');
});

it('returns a failure for unknown resources', () => {
  const result = spawnSync(process.execPath, [cli, 'list', 'unknown'], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 1);
  expect(result.stderr).toContain('Invalid values:');
  expect(result.stderr).toContain('Argument: resource, Given: "unknown"');
});
