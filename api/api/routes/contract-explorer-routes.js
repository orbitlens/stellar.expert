const {registerRoute} = require('../router')
const {queryAllContracts} = require('../../business-logic/contracts/contract-list')
const {queryContractStats} = require('../../business-logic/contracts/contract-stats')
const {queryContractBalanceHistory} = require('../../business-logic/contracts/contract-balance-history')
const {estimateContractValue} = require('../../business-logic/contracts/contract-value-estimator')
const {queryContractBalances} = require('../../business-logic/contracts/contract-balances')
const {queryContractCode} = require('../../business-logic/contracts/contract-code')
const {queryContractVersions} = require('../../business-logic/contracts/contract-versions')
const {queryContractTopUsers, queryContractInvocationStats} = require('../../business-logic/contracts/contract-invocations')

module.exports = function (app) {
    registerRoute(app,
        'contract',
        {cache: 'stats'},
        ({params, query, path}) => queryAllContracts(params.network, path, query))

    registerRoute(app,
        'contract/:contract',
        {cache: 'stats'},
        ({params, query}) => queryContractStats(params.network, params.contract, query))

    registerRoute(app, //TODO: remove legacy route
        'contract/:contract/versions',
        {cache: 'stats'},
        ({params, path, query}) => queryContractVersions(params.network, path, params.contract, query))
    registerRoute(app,
        'contract/:contract/version',
        {cache: 'stats'},
        ({params, path, query}) => queryContractVersions(params.network, path, params.contract, query))

    registerRoute(app,
        'contract/:contract/balance',
        {cache: 'stats'},
        ({params, query}) => queryContractBalances(params.network, params.contract, query))

    registerRoute(app,
        'contract/:contract/balance/:asset/history',
        {cache: 'balance'},
        ({params}) => queryContractBalanceHistory(params.network, params.contract, params.asset))

    registerRoute(app,
        'contract/:contract/value',
        {cache: 'stats'},
        ({params, query}) => estimateContractValue(params.network, params.contract, query.currency))

    registerRoute(app,
        'contract/:contract/users',
        {cache: 'stats'},
        ({params, query}) => queryContractTopUsers(params.network, params.contract, query.func, query.since))

    registerRoute(app,
        'contract/:contract/invocation-stats',
        {cache: 'stats'},
        ({params, query}) => queryContractInvocationStats(params.network, params.contract, query.func, query.since))

    registerRoute(app,
        'wasm/:hash',
        {cache: 'stats'},
        async ({params}, res) => {
            const code = await queryContractCode(params.network, params.hash)
            res.type('application/octet-stream')
            res.set('Content-Disposition', `attachment;filename=${params.hash}.wasm`)
            res.send(code)
            res.end()
        })
    registerRoute(app, //TODO: remove legacy route
        'contract/wasm/:hash',
        {cache: 'stats'},
        async ({params}, res) => {
            const code = await queryContractCode(params.network, params.hash)
            res.type('application/octet-stream')
            res.set('Content-Disposition', `attachment;filename=${params.hash}.wasm`)
            res.send(code)
            res.end()
        })
}