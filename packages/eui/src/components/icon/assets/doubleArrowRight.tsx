/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

// THIS IS A GENERATED FILE. DO NOT MODIFY MANUALLY. @see scripts/compile-icons.js

import * as React from 'react';
import type { SVGProps } from 'react';
interface SVGRProps {
  title?: string;
  titleId?: string;
}
const EuiIconDoubleArrowRight = ({
  title,
  titleId,
  ...props
}: SVGProps<SVGSVGElement> & SVGRProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    viewBox="0 0 16 16"
    aria-labelledby={titleId}
    {...props}
  >
    {title ? <title id={titleId}>{title}</title> : null}
    <path
      fillRule="evenodd"
      d="M13.293 8 7.646 2.354l.708-.708L14.707 8l-6.353 6.354-.708-.707L13.293 8Z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M8.293 8 2.646 2.354l.708-.708L9.707 8l-6.353 6.354-.708-.707L8.293 8Z"
      clipRule="evenodd"
    />
  </svg>
);
export const icon = EuiIconDoubleArrowRight;
