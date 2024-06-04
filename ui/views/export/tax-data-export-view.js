import React, {useCallback, useEffect, useState} from 'react'
import {StrKey} from '@stellar/stellar-base'
import {Dropdown, Button, setPageMetadata} from '@stellar-expert/ui-framework'
import TaxInfoExporter from '../../business-logic/tax-info-exporter'
import {previewUrlCreator} from '../../business-logic/api/metadata-api'
import {prepareMetadata} from '../../util/prepareMetadata'
import checkPageReadiness from '../../util/page-readiness'

const yearOptions = []
for (let i = new Date().getFullYear(); i >= 2016; i--) {
    yearOptions.push({value: i, title: i.toString()})
}

const taxDataExportList = [
    'BitcoinTax-compatible data export format.',
    'Separate export files for income, spending, and trades.',
    'Inflation payouts classified as "mining" profits.',
    'All dates are represented as UTC timestamps.',
    'Optional transaction fees export.',
    'Fully anonymous and free of charge.'
]

export default function TaxDataExportView() {
    const [pk, setPk] = useState('')
    const [year, setYear] = useState(new Date().getFullYear() - 1)
    const [exportFees, setExportFees] = useState(false)
    const [exportIncomingPayments, setExportIncomingPayments] = useState(true)
    const [exportOutgoingPayments, setExportOutgoingPayments] = useState(true)
    const [exportTrades, setExportTrades] = useState(true)
    const [ignoreSpam, setIgnoreSpam] = useState(true)
    const [inProgress, setInProgress] = useState(false)
    const [errors, setErrors] = useState(null)
    const [files, setFiles] = useState(null)
    const isValid = !!pk && StrKey.isValidEd25519PublicKey(pk)
    const [metadata, setMetadata] = useState({
        title: `Tax data export for Stellar network`,
        description: `Free payments and trades tax data export for Stellar network in BitcoinTax-compatible format.`
    })
    setPageMetadata(metadata)
    checkPageReadiness(metadata)

    useEffect(() => {
        const infoList = taxDataExportList.map(b => ({icon: '•', value: b}))
        previewUrlCreator(prepareMetadata({
            title: 'Tax data export',
            infoList
        }))
            .then(previewUrl => setMetadata(prev => ({...prev, facebookImage: previewUrl})))
    }, [])

    const setPublicKey = useCallback(e => setPk(e.target.value.trim()), [])
    const toggleExportIncomingPayments = useCallback(() => setExportIncomingPayments(!exportFees), [exportIncomingPayments])
    const toggleOutgoingPayments = useCallback(() => setExportOutgoingPayments(!exportOutgoingPayments), [exportOutgoingPayments])
    const toggleExportTrades = useCallback(() => setExportTrades(!exportTrades), [exportTrades])
    const toggleExportFees = useCallback(() => setExportFees(!exportFees), [exportFees])
    const toggleIgnoreSpam = useCallback(() => setIgnoreSpam(!ignoreSpam), [ignoreSpam])
    const exportData = useCallback(() => {
        setInProgress(true)
        const exporter = new TaxInfoExporter(pk, year)
        exporter.exportFees = exportFees
        exporter.export({exportIncomingPayments, exportOutgoingPayments, exportTrades, exportFees, ignoreSpam})
            .then(files => {
                //convert raw strings to blobs
                const parsedFiles = files.map(f => {
                    if (!f.contents)
                        return {name: f.name}
                    const blob = new Blob([f.contents], {type: 'text/csv'})
                    return {
                        name: f.name,
                        size: Math.ceil(blob.size / 1024),
                        contents: window.URL.createObjectURL(blob)
                    }
                })
                setFiles(parsedFiles)
            })
            .catch(err => {
                setErrors(err.stack)
                setFiles(null)
            })
            .finally(() => setInProgress(false))
    }, [isValid, year, exportIncomingPayments, exportOutgoingPayments, exportTrades, exportFees, ignoreSpam])


    return <div className="container narrow">
        <h2>Tax Data Export</h2>
        <div className="segment blank">
            <ul className="list checked space">
                {taxDataExportList.map((entry, i) => <li key={i}>{entry}</li>)}
            </ul>
            <div className="dimmed text-tiny">
                <i className="icon-info"/> The service is free and provided as-is, without warranties. The responsibility of checking the
                accuracy of tax reports lies on users.
            </div>
        </div>
        <div className="segment blank space">
            <h3>Export</h3>
            <hr className="flare"/>
            <div className="space">
                <div>
                    <div className="row">
                        <div className="column column-75">
                            <label>
                                Provide your account public key:<br/>
                                <input disabled={inProgress} type="text" onChange={setPublicKey} value={pk}
                                       style={{width: '33em', fontFamily: 'monospace'}} placeholder="for example, GADL...0H5M"/>
                            </label>
                        </div>
                        <div className="column column-25 text-right">
                            <div className="space">
                                Select tax year:&nbsp;
                                <Dropdown disabled={inProgress} value={year} options={yearOptions} onChange={setYear}/>
                            </div>
                        </div>
                    </div>
                    <label>
                        <input onChange={toggleExportIncomingPayments} type="checkbox" checked={exportIncomingPayments}/> Export incoming
                        payments
                    </label>
                    <label>
                        <input onChange={toggleOutgoingPayments} type="checkbox" checked={exportOutgoingPayments}/> Export outgoing payments
                    </label>
                    <label>
                        <input onChange={toggleExportTrades} type="checkbox" checked={exportTrades}/> Export DEX trades
                    </label>
                    <label>
                        <input onChange={toggleExportFees} type="checkbox" checked={exportFees}/> Export transaction fees
                    </label>
                    <label>
                        <input onChange={toggleIgnoreSpam} type="checkbox" checked={ignoreSpam}/> Ignore spam transactions
                    </label>
                </div>
                <div className="actions space row">
                    <div className="column column-75">
                        {inProgress && <div className="text-small">
                            <div className="loader inline micro"/>&nbsp;
                            Export in progress, please wait&hellip;
                        </div>}
                    </div>
                    <div className="column column-25">
                        <Button onClick={exportData} disabled={!isValid || inProgress} block>Export data</Button>
                    </div>
                </div>
            </div>
            <ExportedFiles files={files}/>
            <ExportErrors errors={errors}/>
        </div>
    </div>
}

function ExportedFiles({files}) {
    if (!files)
        return null
    return <div className="space">
        {files.map(f => <div key={f.name}>
            {f.contents ?
                <a href={f.contents} download={f.name} target="_blank"
                   style={{
                       padding: '0.5em 1em',
                       border: '1px solid',
                       margin: '0.2em 0',
                       display: 'inline-block'
                   }}>
                    Download {f.name} ({f.size}KB)
                </a> :
                <span className="dimmed" style={{
                    padding: '0.5em 0',
                    margin: '0.2em 0',
                    display: 'inline-block'
                }}>{f.name}</span>}
        </div>)}
        <div className="space text-tiny dimmed">
            <i className="icon-info"/> BitcoinTax or any other external software may incorrectly interpret transfers between your
            wallets or your Stellar account and exchange, which may result in a double counting. However, transfers
            between your own wallets is not a taxable event, so please double check the data once imported.
        </div>
    </div>
}

function ExportErrors({errors}) {
    if (!errors)
        return null
    return <div className="space segment">
        <pre style={{color: 'red'}}>{errors}</pre>
    </div>
}