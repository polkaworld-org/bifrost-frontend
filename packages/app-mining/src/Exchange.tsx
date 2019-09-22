/* eslint-disable @typescript-eslint/camelcase */
// Copyright 2017-2019 @polkadot/app-mining authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountId, RuntimeVersion } from '@polkadot/types/interfaces';
import { BareProps, I18nProps } from '@polkadot/react-components/types';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';

import BN from 'bn.js';
import React, { useState, useEffect } from 'react';
import { withCalls } from '@polkadot/react-api/with';
import { Bubble, IdentityIcon, InputBalance, TxButton, Dropdown, Input, Toggle, Button  } from '@polkadot/react-components';
import { formatBalance, formatNumber } from '@polkadot/util';
import { Api, JsonRpc, RpcError } from 'eosjs';
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig';
import { Keyring } from '@polkadot/keyring';
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
const aliceBifrost = '5FeSdQVmSJXcFzabGNPjnbDsGGMBfzGeA1DCiFSMnKBrQfEk';
const bobBifrost = '5Dygkp5erTDsAWganSo5zZxiypT8SLTgdsBbWWa41dsqSjVz';
const assetId = 0;

function Exchange (): React.ReactElement<Props> {
    const [eosAccount, setEosAccount] = useState(aliceEos);
    const [eosBalance, setEosBalance] = useState(Number(0).toFixed(4));
    const [veosBalance, setvEosBalance] = useState(Number(0).toFixed(4));
    const [bifrostAccount, setBifrostAccount] = useState(aliceBifrost);
    const [bifrostApi, setBifrostApi] = useState(false);
    const [isExchange, setIsExchange] = useState(true);
    const [exchangeEos, setExchangeEos] = useState(0);
    const [exchangevEos, setExchangevEos] = useState(0);
    const [ratio, setRatio] = useState(0);
    const [timerEosBalance, setTimerEosBalance] = useState(0);
    const [perBlockRatio, setPerBlockRatio] = useState(0);
    const [timer, setTimer] = useState(false);


    useEffect((): void => {
        if(!bifrostApi) {
            initApi();
        }

        getEosBalance(eosAccount);

        if(bifrostApi) {
            loopRatio();

            getBifrostBalance(bifrostAccount);
        }

        // loopRatio();
    }, [bifrostApi]);

    async function initApi () {
        const provider = new WsProvider('ws://47.101.139.226:9944/');
        const api = await ApiPromise.create({ provider });

        setBifrostApi(api);
    }

    function loopRatio()
    {
        if(!timer) {
            const t = setInterval(() => {
                getRatio()
            }, 1000);  

            setTimer(t);
        }
    }

    async function getRatio()
    {
        const [rpcRatio, rpcPerBlockRatio] = await Promise.all([
            bifrostApi.query.exchange.exchangeRate(),
            bifrostApi.query.exchange.ratePerBlock()
        ]);

        setRatio(formatRatio(rpcRatio))
        setPerBlockRatio(formatRatio(rpcPerBlockRatio))

        console.log('Bifrost Ratio', formatRatio(rpcRatio))
        console.log('Bifrost Ratio Decrease Per Block', formatRatio(rpcPerBlockRatio))
    }

    function formatAmount(amount)
    {
        return amount * 1000000000000
    }

    function formatBifrostAmount(amount)
    {
        return Number(amount / 1000000000000).toFixed(4)
    }

    function formatRatio(ratio)
    {
        return Number(ratio / 1000000000000)
    }

    async function issueAsset(account, amount)
    {
        const keyring = new Keyring({ type: 'sr25519' });
        const alice = keyring.addFromUri('//Alice');

        const veosAmount = formatAmount(amount);

        const [issue] = await Promise.all([
            bifrostApi.tx.assets.transfer(assetId, account, veosAmount).signAndSend(alice, ({ events = [], status }) => {
                if (status.isFinalized) {
                    alert('Bifrost Issue Success txid:' + status.asFinalized.toHex());
                    getBifrostBalance(account);
                    console.log('Successful issue of ' + veosAmount + ' vEOS with hash ' + status.asFinalized.toHex())
                } else {
                    console.log('Status of issue: ' + status.type)
                }

                events.forEach(({ phase, event: { data, method, section } }) => {
                    console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString())
                })
            })
        ]);
    }

    async function destroyAsset(account, amount)
    {
        const injector = await web3FromAddress(account);

        bifrostApi.setSigner(injector.signer)
        const [destroy] = await Promise.all([
            bifrostApi.tx.assets.destroy(assetId, formatAmount(amount)).signAndSend(account, ({ events = [], status }) => {
                if (status.isFinalized) {
                    alert('Bifrost Destroy Success txid:' + status.asFinalized.toHex());
                    getBifrostBalance(account);
                    redeemEos();
                    console.log('Successful destroy of ' + veosAmount + ' vEOS with hash ' + status.asFinalized.toHex())
                } else {
                    console.log('Status of destroy: ' + status.type)
                }

                events.forEach(({ phase, event: { data, method, section } }) => {
                    console.log(phase.toString() + ' : ' + section + '.' + method + ' ' + data.toString())
                })
            })
        ]);
    }

    function getEosBalance(account)
    {
        (async () => {
            const balance = await eosApi.rpc.get_currency_balance('eosio.token', account, 'EOS');
            setEosBalance(balance[0].split(' ')[0]);

            console.log('EOS Account', account, balance)
        })();
    }

    async function getBifrostBalance(account)
    {
        const [balance] = await Promise.all([
            bifrostApi.query.assets.balances([assetId, account])
        ]);

        setvEosBalance(formatBifrostAmount(balance))
        setTimerEosBalance(formatBifrostAmount(balance));

        console.log('Bifrost Account', formatBifrostAmount(balance))
    }

    function changeEosAccount(select)
    {
        let account = select.value;

        setEosAccount(account);
        getEosBalance(account);
    }

    function changeBifrostAccount(select)
    {
        let account = select.value;

        setBifrostAccount(account);
        getBifrostBalance(account);
    }

    function changeSwitch(switchStatus)
    {
        setIsExchange(switchStatus);
    }

    function toEos()
    {
        destroyAsset(bifrostAccount, exchangevEos)
    }

    function redeemEos()
    {
        (async () => {
            const result = await eosApi.transact({
                actions: [{
                    account: 'eosio.token',
                    name: 'transfer',
                    authorization: [{
                        actor: spvEos,
                        permission: 'active',
                    }],
                    data: {
                        from: spvEos,
                        to: eosAccount,
                        quantity: Number(exchangevEos / ratio).toFixed(4) + ' EOS',
                        memo: 'bifrost:' + bifrostAccount
                    },
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(result.processed)

            alert("Transfer Success txid: " + result.transaction_id)
            getEosBalance(eosAccount);
        })();
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
                        memo: 'bifrost:' + bifrostAccount
                    },
                }]
            }, {
                blocksBehind: 3,
                expireSeconds: 30
            });

            console.log(result.processed)
            
            issueAsset(bifrostAccount, exchangeEos * ratio)
            alert("Transfer Success txid: " + result.transaction_id)
            getEosBalance(eosAccount);
        })();
    }

    const eosOptions = [
        { value: aliceEos, label: aliceEos },
        { value: bobEos, label: bobEos }
    ];

    const bifrostOptions = [
        { value: aliceBifrost, label: aliceBifrost },
        { value: bobBifrost, label: bobBifrost }
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
                    <Select options={eosOptions} defaultValue={{ value: aliceEos, label: aliceEos }} onChange={changeEosAccount} />
                    <div style={{ display: 'inline-grid' }}>
                        <div>EOS Account: <span style={{ color: '#f19135' }}>{eosAccount}</span></div>
                        <div>Balance: <span style={{ color: '#f19135' }}>{eosBalance}</span> EOS</div>
                    </div>
                </div>
                <div style={selectStyle}>
                    <Select options={bifrostOptions} defaultValue={{ value: aliceBifrost, label: aliceBifrost }} onChange={changeBifrostAccount} />
                    <div style={{ display: 'inline-grid' }}>
                        <div>Bifrost Account: <span style={{ color: '#f19135' }}>{bifrostAccount == aliceBifrost ? 'alice' : 'bob'}</span></div>
                        <div>Balance: <span style={{ color: '#f19135' }}>{veosBalance}</span> vEOS</div>
                    </div>
                </div>
            </div>
            <div style={{ paddingTop: '50px', textAlign: 'center', lineHeight: '1.5' }}>
                <div style={{ padding: '20px 0px' }}>
                    <div>vEOS Convert Ratio <span style={{ color: 'red' }}>{ ratio > 0 ? Number(1 / ratio).toFixed(8) : 'Loading...' }</span></div>
                    <div>{ veosBalance } vEOS Can Convert <FlipRatio height={40} width={24} nonFontSize={'40px'} currentBalance={ratio > 0 ? Number(timerEosBalance / ratio).toFixed(4) : '0.0000'} /><span style={{ fontSize: '26px' }}>EOS</span></div>
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
                                  {<Input min={0} max={veosBalance} defaultValue={exchangevEos} onChange={setExchangevEos} label={'vEOS'} />}
                              </div>
                            </>
                        )
                    }
                </div>
                <div style={{ padding: '20px 0px', marginLeft: '-24px' }}>
                    <Toggle onChange={changeSwitch} defaultValue={isExchange} label={' '} />
                </div>
                <Button onClick={ isExchange ? tovEos : toEos }>{ isExchange ? 'Exchange' : 'Redeem' }</Button>
            </div>
        </section>
    );
}

export default (Exchange)

const ExchangeIcon = () => {
    <svg t="1569115031961" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1935" width="200" height="200"><path d="M1021.7472 239.5136c0 1.536-0.7168 3.072-2.2528 4.608l0 2.2528L909.7216 356.1472C903.5776 359.2192 899.072 360.6528 896 360.6528c-3.072 0-7.5776-1.4336-13.7216-4.608-9.1136-9.1136-9.1136-18.3296 0-27.4432l79.9744-77.7216L219.4432 250.88c-50.2784 0-93.2864 17.92-129.1264 53.6576-35.84 35.84-53.76 78.848-53.76 129.1264l0 18.3296c0 12.288-6.144 18.3296-18.3296 18.3296S0 464.384 0 452.096L0 433.8688c0-60.928 21.2992-112.7424 64-155.4432 42.7008-42.5984 94.5152-64 155.4432-64l742.8096 0L882.2784 136.704c-9.1136-9.1136-9.1136-18.3296 0-27.4432 9.1136-9.1136 18.3296-9.1136 27.4432 0l109.6704 109.6704c1.536 3.072 2.2528 5.4272 2.2528 6.8608C1023.2832 230.4 1023.2832 235.008 1021.7472 239.5136zM987.4432 488.6528c0-12.1856 6.144-18.3296 18.3296-18.3296C1017.856 470.4256 1024 476.4672 1024 488.6528l0 18.3296c0 60.928-21.2992 112.8448-64 155.4432C917.2992 705.024 865.4848 726.4256 804.5568 726.4256L61.7472 726.4256l79.9744 77.7216c9.1136 9.1136 9.1136 18.3296 0 27.4432C135.5776 834.6624 131.072 836.096 128 836.096c-3.072 0-7.5776-1.4336-13.7216-4.608L4.608 721.8176C3.072 718.7456 2.2528 716.4928 2.2528 714.9568c-1.536-4.608-1.536-9.1136 0-13.7216 0-1.4336 0.8192-3.072 2.2528-4.608L4.5056 694.3744 114.2784 584.704c9.1136-9.1136 18.3296-9.1136 27.4432 0 9.1136 9.1136 9.1136 18.3296 0 27.4432L61.7472 689.8688l742.8096 0c50.2784 0 93.2864-17.92 129.1264-53.76 35.84-35.7376 53.76-78.848 53.76-129.1264L987.4432 488.6528z" p-id="1936"></path></svg>
}

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