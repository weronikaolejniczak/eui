/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { Meta, StoryObj } from '@storybook/react';

import { illustrations } from '@elastic/eui-illustrations';

import { EuiIllustration, EuiIllustrationProps } from './illustration';

const illustrationIds = Object.keys(illustrations);

const meta: Meta<EuiIllustrationProps> = {
  title: 'Display/EuiIllustration',
  component: EuiIllustration,
  parameters: {
    // Illustration assets are owned by the independently versioned
    // `@elastic/eui-illustrations` package, so they shouldn't gate EUI VRT.
    vrt: { skip: true },
  },
  argTypes: {
    type: {
      options: illustrationIds,
      mapping: illustrations,
      control: { type: 'select' },
      description: 'The illustration asset from `@elastic/eui-illustrations`',
    },
  },
  args: {
    // @ts-expect-error - `type` is a string in the `argTypes` to allow for selection in Storybook
    type: illustrationIds[0],
  },
};

export default meta;
type Story = StoryObj<EuiIllustrationProps>;

export const Playground: Story = {};
