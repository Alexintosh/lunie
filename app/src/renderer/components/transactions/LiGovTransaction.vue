<template>
  <li-transaction
    :color="`#15CFCC`"
    :time="time"
    :block="block"
  >
    <template v-if="txType === `cosmos-sdk/MsgSubmitProposal`">
      <div slot="caption">
        Submit {{ tx.proposal_type.toLowerCase() }} proposal
        <b>{{ initialDeposit.amount }}</b>
        <span>{{ initialDeposit.denom }}s</span>
      </div>
      <div slot="details">
        Title:&nbsp;<i>{{ tx.title }}</i>
      </div>
      <div slot="fees">
        Network Fee:&nbsp;
        <b>{{ convertedFees ? convertedFees.amount : full(0) }}</b>
        <span>{{ convertedFees ? convertedFees.denom : bondingDenom }}s</span>
      </div>
    </template>
    <template v-else-if="txType === `cosmos-sdk/MsgDeposit`">
      <div slot="caption">
        Deposit
        <template>
          <b>{{ deposit.amount }}</b>
          <span>{{ deposit.denom }}s</span>
        </template>
      </div>
      <div slot="details">
        On&nbsp;
        <router-link :to="`${url}/${tx.proposal_id}`">
          Proposal &#35;{{ tx.proposal_id }}
        </router-link>
      </div>
      <div slot="fees">
        Network Fee:&nbsp;
        <b>{{ convertedFees ? convertedFees.amount : full(0) }}</b>
        <span>{{ fees ? convertedFees.denom : bondingDenom }}s</span>
      </div>
    </template>
    <template v-else-if="txType === `cosmos-sdk/MsgVote`">
      <div slot="caption">
        Vote&nbsp;{{ tx.option }}
      </div>
      <div slot="details">
        On&nbsp;
        <router-link :to="`${url}/${tx.proposal_id}`">
          Proposal &#35;{{ tx.proposal_id }}
        </router-link>
      </div>
      <div slot="fees">
        Network Fee:&nbsp;
        <b>{{ convertedFees ? convertedFees.amount : full(0) }}</b>
        <span>{{ convertedFees ? convertedFees.denom : bondingDenom }}s</span>
      </div>
    </template>
  </li-transaction>
</template>

<script>
import LiTransaction from "./LiTransaction"
import num, { full, atoms } from "../../scripts/num.js"

export default {
  name: `li-gov-transaction`,
  components: { LiTransaction },
  props: {
    tx: {
      type: Object,
      required: true
    },
    fees: {
      type: Object,
      default: null
    },
    url: {
      type: String,
      required: true
    },
    bondingDenom: {
      type: String,
      required: true
    },
    txType: {
      type: String,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    block: {
      type: Number,
      required: true
    }
  },
  data: () => ({
    full,
    atoms
  }),
  computed: {
    initialDeposit() {
      return num.viewCoin(this.tx.initial_deposit[0])
    },
    deposit() {
      return num.viewCoin(this.tx.amount[0])
    },
    convertedFees() {
      return this.fees ? num.viewCoin(this.fees) : undefined
    }
  }
}
</script>
