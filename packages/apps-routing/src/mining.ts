// Copyright 2017-2019 @polkadot/apps-routing authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { Routes } from './types';

import Mining from '@polkadot/app-mining';

export default ([
  {
    Component: Mining,
    display: {
      needsApi: [
        'tx.balances.transfer'
      ]
    },
    i18n: {
      defaultValue: 'Mining'
    },
    icon: 'bath',
    name: 'Mining'
  }
] as Routes);