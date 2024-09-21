import React, {useState} from 'react'
import {xdr} from '@stellar/stellar-base'
import {useParams} from 'react-router'
import {UtcTimestamp, AccountAddress, ScVal, useExplorerPaginatedApi, Dropdown} from '@stellar-expert/ui-framework'
import {navigation} from '@stellar-expert/navigation'
import GridDataActionsView from '../../components/grid-data-actions'

export default function ContractDataEntriesView() {
    const {id} = useParams()
    const [durabilityFilter, setDurabilityFilter] = useState(navigation.query?.durability || 'all')
    const query = {}
    if (durabilityFilter !== 'all') {
        query.durability = durabilityFilter
    }
    const contractDataEntries = useExplorerPaginatedApi(
        {
            path: `contract-data/${id}`,
            query
        }, {
            autoReverseRecordsOrder: true,
            defaultSortOrder: 'asc',
            limit: 30,
            defaultQueryParams: {order: 'asc'}
            //dynamic price spread
            //dataProcessingCallback: records => records.map(stat => AssetViewModel.fromStats(stat))
        })

    return <div>
        <h2 className="word-break relative condensed">
            <span className="dimmed">Stored Data for&nbsp;</span>
            <AccountAddress account={id} className="plain" chars="all"/>
        </h2>
        <div className="segment blank">
            <div className="text-right">
                Durability: <Dropdown options={['all', 'instance', 'persistent', 'temporary']} value={durabilityFilter} onChange={setDurabilityFilter}/>
            </div>
            <div className="contract-data-view">
                <table className="table exportable space">
                    <thead>
                    <tr>
                        <th>Key</th>
                        <th>Value</th>
                        <th className="collapsing">Durability</th>
                        <th className="collapsing nowrap">TTL</th>
                        <th className="collapsing nowrap">Updated</th>
                    </tr>
                    </thead>
                    <tbody className="condensed">
                    {contractDataEntries.data.map(entry => {
                        return <tr key={entry.paging_token}>
                            <td data-header="Key: "><ScVal value={entry.key} indent/></td>
                            <td data-header="Value: ">{entry.durability === 'instance' ?
                                <InstanceData value={entry.value}/> :
                                <ScVal value={entry.value} indent/>}</td>
                            <td data-header="Durability: ">{entry.durability}</td>
                            <td data-header="TTL: ">
                                {entry.expired ? <strike title="Expired">{entry.ttl}</strike> : entry.ttl}
                            </td>
                            <td className="text-right" data-header="Updated: "><UtcTimestamp date={entry.updated}/></td>
                        </tr>
                    })}
                    </tbody>
                </table>
                {!contractDataEntries.loaded && <div className="loader"/>}
                <GridDataActionsView model={contractDataEntries}/>
            </div>
        </div>
    </div>
}

function InstanceData({value}) {
    const entry = xdr.ScVal.fromXDR(value, 'base64').instance()
    return <div>
        <div>Executable: <ScVal value={value}/></div>
        <div>Storage: {(entry.storage() || []).map(kv => <div>
            <ScVal value={kv.key()}/>: <ScVal value={kv.val()}/>
        </div>)}</div>
    </div>
}
