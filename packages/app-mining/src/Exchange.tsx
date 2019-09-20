/* eslint-disable @typescript-eslint/camelcase */
// Copyright 2017-2019 @polkadot/app-mining authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountId, RuntimeVersion } from '@polkadot/types/interfaces';
import { BareProps, I18nProps } from '@polkadot/react-components/types';

import BN from 'bn.js';
import React, { useState, useEffect } from 'react';
import { withCalls } from '@polkadot/react-api/with';
import { Bubble, IdentityIcon, InputBalance, TxButton, Dropdown, Input, Toggle, Button  } from '@polkadot/react-components';
import { formatBalance, formatNumber } from '@polkadot/util';
import { Api, JsonRpc, RpcError } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import FlipRatio from './FlipRatio';
import Select from 'react-select';
import styled from "styled-components";
import translate from './translate';

// EOS Config
const aliceEos = 'bifrostalice';
const bobEos = 'bifrostbob11';
const spvEos = 'bifrostdemo1';
const demoPrivateKey = '5JcoS7ich5oDPeLd6XgeeoayhfX9PU98FGv6ChdUb1fkAHkv7EL';
const signatureProvider = new JsSignatureProvider([demoPrivateKey]);
const rpc = new JsonRpc('http://jungle2.cryptolions.io:80', { fetch });
const eosApi = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

// Bifrost Config
import { ApiPromise, WsProvider } from '@polkadot/api';
const aliceBifrost = 'JEaJtPxm3BH8X1ZNc64DiUWPJBuT4vMC9Qrds8Q877CRRa1';
const bobBifrost = 'JHKD9g23RWkq9MHtLMUXndXL8RrLxt5pNHWUvpPrgixAwuj';
const provider = new WsProvider('wss://kusama-rpc.polkadot.io');

function Exchange (): React.ReactElement<Props> {
    const [eosAccount, setEosAccount] = useState(aliceEos);
    const [eosBalance, setEosBalance] = useState(0);
    const [isExchange, setIsExchange] = useState(true);
    const [exchangeEos, setExchangeEos] = useState(0);
    const [exchangevEos, setExchangevEos] = useState(0);

    useEffect((): void => {
        getEosBalance(eosAccount);
        getBifrostBalance('aaa');
    });

    function getBifrostBalance(account)
    {
        (async () => {
            const bifrostApi = await ApiPromise.create({ provider });
            const balance = await bifrostApi.query.balances.freeBalance(aliceBifrost)

            console.log('Bifrost Account', balance);
        })();
    }

    function getRatio()
    {

    }

    function issueAsset()
    {

    }

    function destroyAsset()
    {

    }

    function getEosBalance (account)
    {
        (async () => {
            const balance = await eosApi.rpc.get_currency_balance('eosio.token', account, 'EOS');
            setEosBalance(balance[0].split(' ')[0]);

            console.log('EOS Account', account, balance)
        })();
    }

    function changeEosAccount(select)
    {
        let account = select.value;

        setEosAccount(account);
        getEosBalance(account);
    }

    function changeSwitch(switchStatus)
    {
        setIsExchange(switchStatus);
    }

    function toEos()
    {
        
    }

    function tovEos()
    {
        (async () => {
            const result = await eosApi.transact({
                actions: [{
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [{
                        actor: eosAccount,
                        permission: 'active',
                    }],
                    data: {
                        from: eosAccount,
                        to: spvEos,
                        quantity: Number(exchangeEos).toFixed(4) + ' EOS',
                        memo: 'bifrost:' + 'J7Pby13SAvbkEx7FYMwLpPWeeNRr8Z9dEKm3DCgRgbznSWU',
                    },
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(result.processed)
            alert("Success txid: " + result.transaction_id)
        })();
    }

    const options = [
        { value: aliceEos, label: aliceEos },
        { value: bobEos, label: bobEos }
    ];

    const sectionStyle = {
        width: '50vw',
        margin: '20vh auto',
    };

    const selectStyle = {
        flex: 1,
        paddingLeft: '50px',
        paddingRight: '50px'
    };

    const iconStyle = {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px'
    };

    const eosStyle = {
        flex: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px'
    };

    return (
        <section style={sectionStyle}>
            <div style={{ display: 'flex' }}>
                <div style={selectStyle}>
                    <Select options={options} defaultValue={{ value: aliceEos, label: aliceEos }} onChange={changeEosAccount} />
                    <div style={{ display: 'inline-grid' }}>
                        <span>EOS 账号：{eosAccount}</span>
                        <span>余额：{eosBalance} EOS</span>
                    </div>
                </div>
                <div style={selectStyle}>
                    <Select options={options} defaultValue={{ value: aliceEos, label: aliceEos }} onChange={changeEosAccount} />
                    <div>
                        <span>当前 Bifrost 账号：{eosAccount}</span>
                        <span>余额：{eosBalance}</span>
                    </div>
                </div>
            </div>
            <div style={{ paddingTop: '50px', textAlign: 'center' }}>
                <div>
                    <span>当前 vEOS : EOS 比例为 0.02</span>
                    <span>可兑换 EOS 数量: <FlipRatio ratio={'0.2'} veosBalance={'10'} /></span>
                </div>
                <div>
                    <Toggle onChange={changeSwitch} defaultValue={isExchange} />
                </div>
                <div style={{
                    width: '30vw',
                    padding: '5px',
                    display: 'flex',
                    margin: '0 auto',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {
                        isExchange ? (
                            <>
                                <div style={{
                                    flex: 3,
                                    padding: '5px'
                                }}>
                                    <Input min={0} max={eosBalance} defaultValue={exchangeEos} onChange={setExchangeEos} label={'EOS'} />
                                </div>
                                <div style={iconStyle}>
                                    <Arrows />
                                </div>
                                <div style={eosStyle}>
                                    <VEOS />
                                </div>
                            </>
                        ) : (
                            <>
                              <div style={eosStyle}>
                                  <EOS />
                              </div>
                              <div style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '5px',
                                  transform: 'rotate(180deg)'
                              }}>
                                <Arrows />
                              </div>
                              <div style={{
                                  flex: 3,
                                  padding: '5px'
                              }}>
                                  {/*<Input min={0} max={veosBalance} defaultValue={exchangeEos} onChange={inputExchangeEos} label={'EOS'} />*/}
                              </div>
                            </>
                        )
                    }
                </div>
                <Button onClick={ isExchange ? tovEos : toEos }>{ isExchange ? '兑换' : '赎回' }</Button>
            </div>
        </section>
    );
}

export default (Exchange)

const EOS = () => (
    <svg t="1568951632605" className="icon" viewBox="0 0 1024 1024" version="1.1"
         xmlns="http://www.w3.org/2000/svg" p-id="3439" width="48" height="48">
        <path
            d="M942.427421 234.839536a17.254917 17.254917 0 1 0-28.988261 18.715833 475.626037 475.626037 0 0 1 76.013661 258.559181c0 263.229511-214.145024 477.386038-477.386038 477.386038s-477.386038-214.156527-477.386038-477.386038 214.145024-477.386038 477.386038-477.386039a475.683553 475.683553 0 0 1 166.659492 29.908523 17.254917 17.254917 0 0 0 12.055436-32.335714 511.964892 511.964892 0 1 0 251.64571 202.538216z"
            fill="#2c2c2c" p-id="3440"></path>
        <path
            d="M796.059711 128.365195a482.807533 482.807533 0 0 1 34.969965 28.562639 17.254917 17.254917 0 1 0 23.064073-25.663813c-11.963409-10.755565-24.571002-21.050999-37.47768-30.621726a17.256067 17.256067 0 1 0-20.556358 27.7229zM385.496215 534.22385L261.088263 751.647308l242.144003 144.12457-117.736051-361.548028zM257.614273 707.187138l117.402456-205.172466-42.32056-129.964036-75.081896 335.136502zM621.370931 503.65964l-108.671467-191.736638-110.385456 192.898469 110.523495 339.381212 108.533428-340.543043zM689.332298 373.074428l-40.721605 127.755406 116.447684 205.460049-75.726079-333.215455zM638.223233 533.407117L522.868361 895.35776l239.072628-143.664439L638.223233 533.407117zM673.423264 340.336099L525.514115 130.263235v153.361703l106.232773 187.457419 41.676376-130.746258zM500.413963 282.865722V129.29696L348.708732 340.175053l43.125789 132.448743 108.579442-189.758074z"
            fill="#2c2c2c" p-id="3441"></path>
    </svg>
);

const VEOS = () => (
    <svg t="1568951632605" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
         p-id="3439" width="48" height="48">
        <path
            d="M942.427421 234.839536a17.254917 17.254917 0 1 0-28.988261 18.715833 475.626037 475.626037 0 0 1 76.013661 258.559181c0 263.229511-214.145024 477.386038-477.386038 477.386038s-477.386038-214.156527-477.386038-477.386038 214.145024-477.386038 477.386038-477.386039a475.683553 475.683553 0 0 1 166.659492 29.908523 17.254917 17.254917 0 0 0 12.055436-32.335714 511.964892 511.964892 0 1 0 251.64571 202.538216z"
            fill="#d81e06" p-id="3440"></path>
        <path
            d="M796.059711 128.365195a482.807533 482.807533 0 0 1 34.969965 28.562639 17.254917 17.254917 0 1 0 23.064073-25.663813c-11.963409-10.755565-24.571002-21.050999-37.47768-30.621726a17.256067 17.256067 0 1 0-20.556358 27.7229zM385.496215 534.22385L261.088263 751.647308l242.144003 144.12457-117.736051-361.548028zM257.614273 707.187138l117.402456-205.172466-42.32056-129.964036-75.081896 335.136502zM621.370931 503.65964l-108.671467-191.736638-110.385456 192.898469 110.523495 339.381212 108.533428-340.543043zM689.332298 373.074428l-40.721605 127.755406 116.447684 205.460049-75.726079-333.215455zM638.223233 533.407117L522.868361 895.35776l239.072628-143.664439L638.223233 533.407117zM673.423264 340.336099L525.514115 130.263235v153.361703l106.232773 187.457419 41.676376-130.746258zM500.413963 282.865722V129.29696L348.708732 340.175053l43.125789 132.448743 108.579442-189.758074z"
            fill="#d81e06" p-id="3441"></path>
    </svg>
);

const Arrows = () => (
    <svg width="48" viewBox="0 0 88 54" fill="#4e4e4e"><path opacity="0.25" d="M4.5 31.5C6.98528 31.5 9 29.4853 9 27C9 24.5147 6.98528 22.5 4.5 22.5C2.01472 22.5 0 24.5147 0 27C0 29.4853 2.01472 31.5 4.5 31.5Z"></path><path opacity="0.5" d="M26.5 31.5C28.9853 31.5 31 29.4853 31 27C31 24.5147 28.9853 22.5 26.5 22.5C24.0147 22.5 22 24.5147 22 27C22 29.4853 24.0147 31.5 26.5 31.5Z"></path><path d="M48.5 31.5C50.9853 31.5 53 29.4853 53 27C53 24.5147 50.9853 22.5 48.5 22.5C46.0147 22.5 44 24.5147 44 27C44 29.4853 46.0147 31.5 48.5 31.5Z"></path><path fillRule="evenodd" clipRule="evenodd" d="M61.2328 3.03806C62.3284 1.94239 64.1049 1.94239 65.2006 3.03806L87.1782 25.0157C88.2739 26.1114 88.2739 27.8878 87.1782 28.9835L65.2006 50.9612C64.1049 52.0568 62.3284 52.0568 61.2328 50.9612C60.1371 49.8655 60.1371 48.089 61.2328 46.9934L81.2265 26.9996L61.2328 7.00586C60.1371 5.91018 60.1371 4.13374 61.2328 3.03806Z"></path></svg>
);