/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { CSSObject } from '@emotion/react';

import type { RecursivePartial, ValueOf } from '../../types';

import { _EuiThemeAnimation } from '../../global_styling/variables/animations';
import { _EuiThemeBreakpoints } from '../../global_styling/variables/breakpoint';
import { _EuiThemeBorder } from '../../global_styling/variables/borders';
import { _EuiThemeColors } from '../../global_styling/variables/colors';
import {
  _EuiThemeBase,
  _EuiThemeSizes,
} from '../../global_styling/variables/size';
import { _EuiThemeFont } from '../../global_styling/variables/typography';
import { _EuiThemeFocus } from '../../global_styling/variables/states';
import { _EuiThemeLevels } from '../../global_styling/variables/levels';
import { _EuiThemeComponents } from '../../global_styling/variables/components';
import { _EuiThemeFlags } from '../../global_styling/variables';

export const COLOR_MODES_STANDARD = {
  light: 'LIGHT',
  dark: 'DARK',
} as const;
export const COLOR_MODES_INVERSE = 'INVERSE' as const;

export type EuiThemeColorModeInverse = typeof COLOR_MODES_INVERSE;
export type EuiThemeColorModeStandard = ValueOf<typeof COLOR_MODES_STANDARD>;
export type EuiThemeColorMode =
  | 'light'
  | 'dark'
  | EuiThemeColorModeStandard
  | 'inverse'
  | EuiThemeColorModeInverse;

export type ColorModeSwitch<T = string> =
  | {
      [key in EuiThemeColorModeStandard]: T;
    }
  | T;

export type StrictColorModeSwitch<T = string> = {
  [key in EuiThemeColorModeStandard]: T;
};

// Consumers can pass a boolean to manually toggle the preferred high contrast mode,
// but our internal high contrast mode enum is slightly more granular to account for
// Windows's high contrast themes, which force colors/backgrounds/shadows
export type EuiThemeHighContrastModeProp = boolean;
export type EuiThemeHighContrastMode = 'forced' | 'preferred' | false;

export type EuiThemeShape = {
  colors: _EuiThemeColors;
  /** - Default value: 16 */
  base: _EuiThemeBase;
  /**
   * @see {@link https://eui.elastic.co/#/theming/sizing | Reference} for more information
   */
  size: _EuiThemeSizes;
  font: _EuiThemeFont;
  border: _EuiThemeBorder;
  focus: _EuiThemeFocus;
  animation: _EuiThemeAnimation;
  breakpoint: _EuiThemeBreakpoints;
  levels: _EuiThemeLevels;
  components: _EuiThemeComponents;
  flags: _EuiThemeFlags;
};

export type EuiThemeSystem<T = {}> = {
  root: EuiThemeShape & T;
  model: EuiThemeShape & T;
  key: string;
};

export type EuiThemeModifications<T = {}> = RecursivePartial<EuiThemeShape & T>;

export type ComputedThemeShape<
  T,
  P = string | number | bigint | boolean | null | undefined
> = T extends P | ColorModeSwitch<infer X>
  ? T extends ColorModeSwitch<X>
    ? X extends P
      ? X
      : {
          [K in keyof (X &
            Exclude<
              T,
              keyof X | keyof StrictColorModeSwitch
            >)]: ComputedThemeShape<
            (X & Exclude<T, keyof X | keyof StrictColorModeSwitch>)[K],
            P
          >;
        }
    : T
  : {
      [K in keyof T]: ComputedThemeShape<T[K], P>;
    };

export type EuiThemeComputed<T = {}> = ComputedThemeShape<EuiThemeShape & T> & {
  themeName: string;
};

export type EuiThemeNested = {
  isGlobalTheme: boolean;
  hasDifferentColorFromGlobalTheme: boolean;
  bodyColor: string;
  colorClassName: string;
  setGlobalCSSVariables: Function;
  globalCSSVariables?: CSSObject;
  setNearestThemeCSSVariables: Function;
  themeCSSVariables?: CSSObject;
};

export interface UseEuiTheme<T extends {} = {}> {
  euiTheme: EuiThemeComputed<T>;
  colorMode: EuiThemeColorModeStandard;
  highContrastMode: EuiThemeHighContrastMode;
  modifications: EuiThemeModifications<T>;
}
