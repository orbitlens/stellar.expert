import React, {useState} from 'react'
import {Dropdown, useExplorerApi} from '@stellar-expert/ui-framework'
import Chart from '../../components/chart/chart'

export default function SorobanStatsHistoryView() {
    const history = useExplorerApi('contract-stats-history')
    return <div>
        <MetricStatsChart history={history}/>
        <SorobanInvocationsStatsChart history={history} title="Daily contract invocations"/>
    </div>
}

const metricOptions = [
    {value: 'avg_invoke_time', title: 'Average invocation time per call', suffix: 'µs'},
    {value: 'avg_read_entry', title: 'Average entries read'},
    {value: 'avg_write_entry', title: 'Average entries written'},
    {value: 'avg_ledger_read_byte', title: 'Average ledger bytes read'},
    {value: 'avg_ledger_write_byte', title: 'Average ledger bytes written'},
    {value: 'avg_read_code_byte', title: 'Average contract code bytes read'},
    {value: 'avg_emit_event', title: 'Average emitted events'},
    {value: 'contracts_created', title: 'Contracts created'},
    {value: 'total_uploads', title: 'Contracts WASM uploads'}
]

function MetricStatsChart({history}) {
    const [metric, setMetric] = useState('avg_invoke_time')
    const option = metricOptions.find(option => option.value === metric)
    return <>
        <div className="row">
            <div className="column column-50">
                <h3>Contract invocation metrics</h3>
            </div>
            <div className="column column-50 desktop-right micro-space">
                <Dropdown options={metricOptions} onChange={setMetric} value={metric}/>
            </div>
        </div>
        <SorobanStatsChart history={history} title={option.title} field={metric} suffix={option.suffix}/>
    </>
}

function SorobanStatsChart({history, title, field, suffix}) {
    const config = generateSingleFieldConfig(history, title, field, suffix)
    return <Chart type="StockChart" title={title} className="space" options={config} grouped range noLegend/>
}

function generateSingleFieldConfig({loaded, data}, title, field, suffix) {
    if (!loaded)
        return null
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
                text: title
            }
        }],
        series: []
    }
    const resData = []
    for (const record of data) {
        resData.push([record.ts * 1000, record[field]])
    }

    const columnConfig = {
        type: 'column',
        name: title,
        data: resData
    }
    if (suffix){
        columnConfig.tooltip = {
            valueSuffix: ' ' + suffix
        }
    }
    config.series.push(columnConfig)
    return config
}

function SorobanInvocationsStatsChart({history, title}) {
    if (!history.loaded)
        return null
    const config = {
        plotOptions: {
            column: {
                marker: {
                    enabled: false
                },
                dataGrouping: {
                    approximation: 'sum'
                },
                stacking: 'normal'
            }
        },
        yAxis: [{
            title: {
                text: title
            }
        }],
        series: []
    }
    const invocations = []
    const subinvocations = []
    for (const record of history.data) {
        const ts = record.ts * 1000
        invocations.push([ts, record.total_invocations])
        subinvocations.push([ts, record.total_subinvocations])
    }

    config.series.push({
        type: 'column',
        name: 'Invocations',
        data: invocations
    })

    config.series.push({
        type: 'column',
        name: 'Subinvocations',
        data: subinvocations
    })
    return <Chart type="StockChart" title={title} className="space" options={config} grouped range noLegend/>
}