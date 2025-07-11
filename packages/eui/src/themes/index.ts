/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import { colorVisLight } from './amsterdam/global_styling/variables/_colors_vis_light';
import { colorVisDark } from './amsterdam/global_styling/variables/_colors_vis_dark';

export { colorVisLight as colorVis, colorVisLight, colorVisDark };
export type { EUI_THEME } from './themes';

export { AMSTERDAM_NAME_KEY, EuiThemeAmsterdam } from './amsterdam/theme';

export * from './amsterdam';
