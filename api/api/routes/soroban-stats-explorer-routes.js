const {registerRoute} = require('../router')
const sorobanStats = require('../../business-logic/contracts/soroban-stats')

module.exports = function (app) {
    registerRoute(app,
        'contract-stats',
        {cache: 'stats'},
        ({params}) => sorobanStats.queryGeneralSorobanStats(params.network))

    registerRoute(app,
        'contract-stats-history',
        {cache: 'stats'},
        ({params}) => sorobanStats.querySorobanInteractionHistory(params.network))

    registerRoute(app,
        'contract-fees-history',
        {cache: 'stats'},
        ({params}) => sorobanStats.queryContractFeeStatHistory(params.network))

    registerRoute(app,
        'top-contracts/invocations',
        {cache: 'stats'},
        ({params}) => sorobanStats.queryTopContractsByInvocations(params.network))

    registerRoute(app,
        'top-contracts/subinvocations',
        {cache: 'stats'},
        ({params}) => sorobanStats.queryTopContractsBySubInvocations(params.network))
}