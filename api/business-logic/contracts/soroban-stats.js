const db = require('../../connectors/mongodb-connector')
const {validateNetwork} = require('../validators')
const {AccountAddressJSONResolver} = require('../account/account-resolver')

const day = 86400

function queryGeneralSorobanStats(network) {
    validateNetwork(network)
    const pipeline = [{
        $group: {
            _id: null,
            wasm: {$sum: {$cond: [{$ifNull: ['$wasm', false]}, 1, 0]}},
            sac: {$sum: {$cond: [{$ifNull: ['$wasm', false]}, 0, 1]}},
            payments: {$sum: '$payments'},
            invocations: {$sum: '$invocations'}
        }
    }]
    return db[network].collection('contracts').aggregate(pipeline)
        .toArray()
        .then(res => {
            const grouped = res[0]
            delete grouped._id
            return grouped
        })
}

async function querySorobanInteractionHistory(network) {
    validateNetwork(network)
    const results = await Promise.all([
        fetchContractCreationHistory(network),
        fetchContractMetricsHistory(network)
    ])
    const merged = new Map()
    for (const result of results) {
        for (const record of result) {
            if (!record.ts)
                continue
            const accumulator = merged.get(record.ts)
            if (!accumulator) {
                merged.set(record.ts, record)
            } else {
                Object.assign(accumulator, record)
            }
        }
    }
    const resArray = Array.from(merged.values())
    resArray.sort((a, b) => a.ts - b.ts)
    return resArray
}

async function fetchContractCreationHistory(network) {
    const pipeline = [
        {
            $group: {
                _id: {$floor: {$divide: ['$created', day]}},
                contracts_created: {$sum: 1}
            }
        },
        {
            $sort: {_id: 1}
        }
    ]
    const res = await db[network].collection('contracts').aggregate(pipeline).toArray()
    return res.map(entry => {
        entry.ts = entry._id * day
        delete entry._id
        return entry
    })
}

async function fetchContractMetricsHistory(network) {
    const pipeline = [
        {
            $group: {
                _id: {$floor: {$divide: ['$ts', day]}},
                avg_read_entry: {$avg: '$metrics.read_entry'},
                avg_write_entry: {$avg: '$metrics.write_entry'},
                avg_ledger_read_byte: {$avg: '$metrics.ledger_read_byte'},
                avg_ledger_write_byte: {$avg: '$metrics.ledger_write_byte'},
                avg_read_code_byte: {$avg: '$metrics.read_code_byte'},
                avg_emit_event: {$avg: '$metrics.emit_event'},
                avg_invoke_time: {$avg: {$divide: ['$metrics.invoke_time_nsecs', 1000]}},
                total_uploads: {$sum: {$cond: [{$eq: ['$metrics.write_code_byte', 0]}, 0, 1]}},
                total_invocations: {$sum: 1},
                total_subinvocations: {$sum: '$calls'}
            }
        },
        {
            $sort: {_id: 1}
        }
    ]
    return db[network].collection('invocations').aggregate(pipeline)
        .toArray()
        .then(res => res.map(entry => {
            entry.ts = entry._id * day
            delete entry._id
            entry.avg_read_entry = round(entry.avg_read_entry, 1)
            entry.avg_write_entry = round(entry.avg_write_entry, 1)
            entry.avg_ledger_read_byte = round(entry.avg_ledger_read_byte, 0)
            entry.avg_ledger_write_byte = round(entry.avg_ledger_write_byte, 0)
            entry.avg_read_code_byte = round(entry.avg_read_code_byte, 0)
            entry.avg_emit_event = round(entry.avg_emit_event, 2)
            entry.avg_invoke_time = round(entry.avg_invoke_time, 1)
            return entry
        }))
}

async function queryContractFeeStatHistory(network) {
    const pipeline = [
        {
            $group: {
                _id: {$floor: {$divide: ['$ts', day]}},
                avgnonrefundable: {$avg: {$toInt: '$metrics.fee.nonrefundable'}},
                avgrefundable: {$avg: {$toInt: '$metrics.fee.refundable'}},
                avgrent: {$avg: {$toInt: '$metrics.fee.rent'}},
                totalnonrefundable: {$sum: {$toInt: '$metrics.fee.nonrefundable'}},
                totalrefundable: {$sum: {$toInt: '$metrics.fee.refundable'}},
                totalrent: {$sum: {$toInt: '$metrics.fee.rent'}}
            }
        },
        {
            $project: {
                _id: 0,
                ts: {$multiply: ['$_id', day]},
                avgFees: {
                    nonrefundable: '$avgnonrefundable',
                    refundable: '$avgrefundable',
                    rent: '$avgrent'
                },
                totalFees: {
                    nonrefundable: '$totalnonrefundable',
                    refundable: '$totalrefundable',
                    rent: '$totalrent'
                }
            }
        },
        {
            $sort: {ts: 1}
        }
    ]
    return db[network].collection('invocations').aggregate(pipeline).toArray()
}

async function queryTopContractsByInvocations(network, limit = 100) {
    const pipeline = [
        {
            $group: {
                _id: '$contract',
                invocations: {$sum: 1}
            }
        },
        {
            $match: {_id: {$gt: 0}}
        },
        {
            $sort: {invocations: -1}
        },
        {
            $limit: limit
        }
    ]

    const data = await db[network].collection('invocations').aggregate(pipeline).toArray()
    const accountResolver = new AccountAddressJSONResolver(network)

    for (const record of data) {
        record.contract = accountResolver.resolve(record._id)
        delete record._id
    }
    await accountResolver.fetchAll()
    return data
}

async function queryTopContractsBySubInvocations(network) {
    const pipeline = [
        {
            $match: {nested: {$exists: true}}
        },
        {
            $project: {
                _id: 0,
                nested: 1
            }
        },
        {
            $unwind: {
                path: '$nested',
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $group: {
                _id: '$nested',
                invocations: {$sum: 1}
            }
        },
        {
            $match: {_id: {$gt: 0}}
        },
        {
            $sort: {invocations: -1}
        },
        {
            $limit: 100
        }
    ]

    const data = await db[network].collection('invocations').aggregate(pipeline).toArray()
    const accountResolver = new AccountAddressJSONResolver(network)

    for (const record of data) {
        record.contract = accountResolver.resolve(record._id)
        delete record._id
    }

    await accountResolver.fetchAll()
    return data
}

function round(value, decimals = 3) {
    const pow = 10 ** decimals
    return Math.round(value * pow) / pow
}


module.exports = {
    queryGeneralSorobanStats,
    querySorobanInteractionHistory,
    queryContractFeeStatHistory,
    queryTopContractsByInvocations,
    queryTopContractsBySubInvocations
}