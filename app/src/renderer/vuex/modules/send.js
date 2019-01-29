import {
  sign,
  createBroadcastBody,
  createSignedTx
} from "../../scripts/wallet.js"
import { getKey } from "../../scripts/keystore"
const config = require(`../../../config.json`)

export default ({ node }) => {
  let state = {
    nonce: `0`
  }

  const mutations = {
    setNonce(state, nonce) {
      // we may query an account state that still has a nonce older then the one we locally have
      // this is because the nonce only updates after txs where incorporated in a block
      if (state.nonce < nonce) state.nonce = nonce
    }
  }

  let actions = {
    resetSessionData({ state }) {
      state.nonce = `0`
    },
    async sendTx({ state, dispatch, commit, rootState }, args) {
      if (!rootState.connection.connected) {
        throw Error(
          `Currently not connected to a secure node. Please try again when Voyager has secured a connection.`
        )
      }

      const { type, to, password, ...txArguments } = args

      await dispatch(`queryWalletBalances`) // the nonce was getting out of sync, this is to force a sync

      const requestMetaData = {
        sequence: state.nonce,
        name: `anonymous`,
        from: rootState.wallet.address,
        account_number: rootState.wallet.accountNumber, // TODO move into LCD?
        chain_id: rootState.connection.lastHeader.chain_id,
        gas: String(config.default_gas),
        generate_only: true,
        memo: `Sent via Cosmos Voyager 🚀`
      }
      const txBody = Object.assign({ base_req: requestMetaData }, txArguments)

      // get the generated tx by querying it from the backend
      const req = to ? node[type](to, txBody) : node[type](txBody)
      const generationRes = await req.catch(handleSDKError)

      // get private key to sign
      const wallet = getKey(rootState.user.account, password)

      // sign
      const tx = generationRes.value
      const signature = sign(tx, wallet, requestMetaData)

      // broadcast
      const signedTx = createSignedTx(tx, signature)
      const body = createBroadcastBody(signedTx)
      const res = await node.postTx(body).catch(handleSDKError)

      // check response code
      assertOk(res)

      commit(`setNonce`, (parseInt(state.nonce) + 1).toString())
    }
  }

  return {
    state,
    mutations,
    actions
  }
}

function assertOk(res) {
  if (Array.isArray(res)) {
    if (res.length === 0) throw new Error(`Error sending transaction`)

    return res.forEach(assertOk)
  }

  if (res.check_tx.code || res.deliver_tx.code) {
    let message = res.check_tx.log || res.deliver_tx.log
    throw new Error(message)
  }
}

function handleSDKError(err) {
  let message
  // TODO: get rid of this logic once the appended message is actually included inside the object message
  if (!err.message) {
    let idxColon = err.indexOf(`:`)
    let indexOpenBracket = err.indexOf(`{`)
    if (idxColon < indexOpenBracket) {
      // e.g => Msg 0 failed: {"codespace":4,"code":102,"abci_code":262246,"message":"existing unbonding delegation found"}
      message = JSON.parse(err.substr(idxColon + 1)).message
    } else {
      message = err
    }
  } else {
    message = err.message
  }
  throw new Error(message)
}
