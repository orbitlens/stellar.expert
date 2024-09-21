import {useState} from 'react'
import {AccountAddress, Dropdown, useExplorerApi} from '@stellar-expert/ui-framework'
import {formatWithGrouping} from '@stellar-expert/formatter'

export default function SorobanTopContractsView() {
    const [metric, setMetric] = useState('invocations')
    const top = useExplorerApi('top-contracts/' + metric)

    return <div>
        <div className="row">
            <div className="column column-50">
                <h2>Top contracts</h2></div>
            <div className="column column-50 desktop-right space">
                <Dropdown options={counterOptions} value={metric} onChange={setMetric}/></div>
        </div>
        <div className="segment blank">
            <TopContractsData top={top}/>
        </div>
    </div>

}

function TopContractsData({top}) {
    if (!top.loaded)
        return <div className="loader"/>
    return <table className="table space">
        <thead>
        <tr>
            <th>Contract</th>
            <th className="collapsing">Invocations</th>
        </tr>
        </thead>
        <tbody>
        {top.data.map(record => <tr key={record.contract}>
            <td><AccountAddress account={record.contract} chars="all"/></td>
            <td className="text-right">{formatWithGrouping(record.invocations)}</td>
        </tr>)}
        </tbody>
    </table>
}

const counterOptions = [
    {value: 'invocations', title: 'By direct invocations'},
    {value: 'subinvocations', title: 'By subinvocations from other contracts'}
]