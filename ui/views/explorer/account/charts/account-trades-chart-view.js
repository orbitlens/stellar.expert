import React from 'react'
import Chart from '../../../components/chart/chart'
import {useAccountStatsHistory} from '../../../../business-logic/api/account-api'

export default Chart.withErrorBoundary(function AccountTradesChartView({address}) {
    const {data = [], loaded} = useAccountStatsHistory(address)
    if (!loaded)
        return <Chart.Loader/>
    const config = {
        plotOptions: {
            column: {
                marker: {
                    enabled: false
                },
                dataGrouping: {
                    approximation: 'sum'
                }
            }
        },
        yAxis: [{
            title: {
                text: 'Account trades'
            },
            opposite: false
        }, {
            title: {
                text: 'Balances'
            },
            opposite: true
        }],
        series: []
    }
    const trades = data.map(({ts, trades}) => [ts * 1000, trades])

    config.series.push({
        type: 'column',
        name: 'Trades',
        data: trades
    })
    return <Chart type="StockChart" options={config} grouped range noLegend/>
})