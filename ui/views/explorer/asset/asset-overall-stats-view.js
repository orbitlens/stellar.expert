import React, {useEffect} from 'react'
import {Amount, InfoTooltip as Info} from '@stellar-expert/ui-framework'
import {formatWithPrecision} from '@stellar-expert/formatter'
import {useAssetOverallStats} from '../../../business-logic/api/asset-api'
import {use24hLedgerStats} from '../../../business-logic/api/ledger-stats-api'

export default function AssetsOverallStatsView({updateMeta}) {
    const {data: assetStats, loaded: assetStatsLoaded} = useAssetOverallStats()
    const {data: ledgerStats, loaded: ledgerStatsLoaded} = use24hLedgerStats()

    useEffect(() => {
        if (assetStats && ledgerStats && updateMeta) {
            const circulationXLM = parseFloat(ledgerStats.total_xlm) - parseFloat(ledgerStats.reserve) - parseFloat(ledgerStats.fee_pool)
            updateMeta([
                {name: 'Unique assets', value: formatWithPrecision(assetStats.total_assets)},
                {name: 'Overall payments', value: formatWithPrecision(assetStats.payments)},
                {name: 'Overall DEX trades', value: formatWithPrecision(assetStats.trades)},
                {name: 'Overall DEX volume', value: `${formatWithPrecision(assetStats.volume)} USD`},
                {name: 'XLM in circulation', value: `${formatWithPrecision(circulationXLM)} XLM`},
                {name: 'XLM reserved', value: `${formatWithPrecision(ledgerStats.reserve)} XLM`},
                {name: 'XLM fee pool', value: `${formatWithPrecision(ledgerStats.fee_pool)} XLM`}
            ])
        }
    }, [updateMeta, ledgerStats, assetStats])

    return <dl>
        {assetStatsLoaded ? <>
            <dt>Unique assets:</dt>
            <dd>
                {formatWithPrecision(assetStats.total_assets)}
                <Info>Total number of assets that exist on the ledger.</Info>
            </dd>
            <dt>Overall payments:</dt>
            <dd>
                {formatWithPrecision(assetStats.payments)}
                <Info>Total number of all asset payments.</Info>
            </dd>
            <dt>Overall DEX trades:</dt>
            <dd>
                {formatWithPrecision(assetStats.trades)}
                <Info>Total number of all on-chain trades.</Info>
            </dd>
            <dt>Overall DEX volume:</dt>
            <dd>
                <Amount amount={assetStats.volume} asset="USD" adjust round issuer={false}/>
                <Info>Total volume of all on-chain trades in XLM.</Info>
            </dd>
        </> : <div className="loader"/>
        }
        {ledgerStatsLoaded ? <>
            <dt>XLM in circulation:</dt>
            <dd>
                <Amount amount={parseFloat(ledgerStats.total_xlm) - parseFloat(ledgerStats.reserve) - parseFloat(ledgerStats.fee_pool)}
                        asset="XLM" round adjust issuer={false}/>
                <Info link="https://www.stellar.org/developers/guides/lumen-supply-metrics.html">Total number of
                    lumens in circulation.
                </Info>
            </dd>
            <dt>XLM reserved:</dt>
            <dd>
                <Amount amount={ledgerStats.reserve} asset="XLM" round adjust issuer={false}/>
                <Info link="https://www.stellar.org/developers/guides/lumen-supply-metrics.html">Total number of
                    inactive lumens (burned, locked in escrow, held on SDF operational accounts, etc.)</Info>
            </dd>
            <dt>XLM fee pool:</dt>
            <dd>
                <Amount amount={ledgerStats.fee_pool} asset="XLM" round adjust issuer={false}/>
                <Info link="https://www.stellar.org/developers/guides/concepts/fees.html#fee-pool">Number of lumens that
                    have been paid in fees. This number is added to the inflation pool and reset to 0 each time
                    inflation runs (currently disabled).</Info>
            </dd>
        </> : <div className="loader"/>}
    </dl>
}