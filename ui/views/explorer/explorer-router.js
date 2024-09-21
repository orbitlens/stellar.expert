import React from 'react'
import {Switch, Route} from 'react-router'
import Loadable from '../components/loadable'
import NotFoundView from '../pages/not-found-page-view'
import ExplorerHomePageView from './pages/explorer-home-page-view'
import AssetsDashboard from './asset/assets-dashboard-view'
import Asset from './asset/asset-view'
import Account from './account/account-view'
import Contract from './contract/contract-view'
import ContractValidationInfo from './contract/contract-validation-view'
import Ledger from './ledger/ledger-view'
import Tx from './tx/tx-view'
import MarketView from './market/market-view'
import MarketDashboard from './market/all-markets-view'
import OfferView from './offer/offer-view'
import OpRedirect from './operation/op-redirect-view'
import NetworkActivity from './pages/network-activity-page-view'
import SearchRedirect from './search/search-results-view'
import ActivityStream from './operation/activity-stream-view'
import DedicatedSearchBoxView from './search/dedicated-search-box-view'
import LiquidityPoolView from './liquidity-pool/liquidity-pool-view'
import AllLiquidityPoolsView from './liquidity-pool/all-liquidity-pools-view'
import AccountClaimableBalancesView from './claimable-balance/account-claimable-balances-view'
import ContractDataEntries from './contract/contract-data-entries-view'
import ContractVersions from './contract/contract-versions-view'
import StagedSorobanConfigChanges from './protocol/staged-soroban-config-changes-view'
import SorobanTopContractsView from './ledger/soroban-top-contracts-view'

function ExplorerRouter({match}) {
    const {path} = match
    return <div className="container">
        <Switch>
            <Route path={`${path}/asset/:asset`} component={Asset}/>
            <Route path={`${path}/asset`} component={AssetsDashboard}/>
            <Route path={`${path}/ledger/:sequence`} component={Ledger}/>
            <Route path={`${path}/account/:id/claimable-balances`} component={AccountClaimableBalancesView}/>
            <Route path={`${path}/account/:id/storage`} component={ContractDataEntries}/>
            <Route path={`${path}/account/:id`} component={Account}/>
            <Route path={`${path}/contract/validation`} component={ContractValidationInfo}/>
            <Route path={`${path}/contract/:id/storage`} component={ContractDataEntries}/>
            <Route path={`${path}/contract/:id/versions`} component={ContractVersions}/>
            <Route path={`${path}/contract/:id`} component={Contract}/>
            <Route path={`${path}/staged-soroban-config/:id`} component={StagedSorobanConfigChanges}/>
            <Route path={`${path}/tx/:id`} component={Tx}/>
            <Route path={`${path}/market/:selling/:buying`} component={MarketView}/>
            <Route path={`${path}/market/`} component={MarketDashboard}/>
            <Route path={`${path}/liquidity-pool/:id`} component={LiquidityPoolView}/>
            <Route path={`${path}/liquidity-pool/`} component={AllLiquidityPoolsView}/>
            <Route path={`${path}/offer/:id`} component={OfferView}/>
            <Route path={`${path}/op/:id`} component={OpRedirect}/>
            <Route path={`${path}/`} exact component={ExplorerHomePageView}/>
            <Route path={`${path}/network-activity`} component={NetworkActivity}/>
            <Route path={`${path}/top-contracts`} component={SorobanTopContractsView}/>
            <Route path={`${path}/payment-locator`}>
                <Loadable moduleKey="payment-locator"
                    load={() => import(/* webpackChunkName: "payment-locator" */ './pages/payment-locator-page-view')}/>
            </Route>
            <Route path={`${path}/protocol-history`}>
                <Loadable moduleKey="protocol-history"
                    load={() => import(/* webpackChunkName: "protocol-history" */ './protocol/protocol-history-view')}/>
            </Route>
            <Route path={`${path}/search/new`} component={DedicatedSearchBoxView}/>
            <Route path={`${path}/search`} component={SearchRedirect}/>
            <Route path={`${path}/operations-live-stream`} component={ActivityStream}/>
            <Route component={NotFoundView}/>
        </Switch>
    </div>
}

export default ExplorerRouter