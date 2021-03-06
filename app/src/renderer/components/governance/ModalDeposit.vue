<template>
  <action-modal
    id="modal-deposit"
    ref="actionModal"
    :submit-fn="submitForm"
    :simulate-fn="simulateForm"
    :validate="validateForm"
    :amount="amount"
    title="Deposit"
    class="modal-deposit"
    submission-error-prefix="Depositing failed"
    @close="clear"
  >
    <tm-form-group
      :error="$v.amount.$error && $v.amount.$invalid"
      class="action-modal-form-group"
      field-id="amount"
      field-label="Amount"
    >
      <span class="input-suffix">{{ num.viewDenom(denom) }}</span>
      <tm-field
        id="amount"
        v-model="amount"
        type="number"
      />
      <tm-form-msg
        v-if="balance === 0"
        :msg="`doesn't have any ${num.viewDenom(denom)}s`"
        name="Wallet"
        type="custom"
      />
      <tm-form-msg
        v-else-if="$v.amount.$error && (!$v.amount.required || amount === 0)"
        name="Amount"
        type="required"
      />
      <tm-form-msg
        v-else-if="$v.amount.$error && !$v.amount.decimal"
        name="Amount"
        type="numeric"
      />
      <tm-form-msg
        v-else-if="$v.amount.$error && !$v.amount.between"
        :max="$v.amount.$params.between.max"
        :min="$v.amount.$params.between.min"
        name="Amount"
        type="between"
      />
    </tm-form-group>
  </action-modal>
</template>

<script>
import { mapGetters } from "vuex"
import num, { uatoms, atoms, SMALLEST } from "../../scripts/num.js"
import { between, decimal } from "vuelidate/lib/validators"
import TmField from "common/TmField"
import TmFormGroup from "common/TmFormGroup"
import TmFormMsg from "common/TmFormMsg"
import ActionModal from "common/ActionModal"

export default {
  name: `modal-deposit`,
  components: {
    ActionModal,
    TmField,
    TmFormGroup,
    TmFormMsg
  },
  props: {
    proposalId: {
      type: [Number, String],
      required: true
    },
    proposalTitle: {
      type: String,
      required: true
    },
    denom: {
      type: String,
      required: true
    }
  },
  data: () => ({
    num,
    amount: 0
  }),
  computed: {
    ...mapGetters([`wallet`, `bondDenom`]),
    balance() {
      // TODO: refactor to get the selected coin when multicoin deposit is enabled
      if (!this.wallet.loading && !!this.wallet.balances.length) {
        const balance = this.wallet.balances.find(
          coin => coin.denom === this.denom
        )
        if (balance) return parseFloat(balance.amount)
      }
      return 0
    }
  },
  validations() {
    return {
      amount: {
        required: x => !!x && x !== `0`,
        decimal,
        between: between(SMALLEST, atoms(this.balance))
      }
    }
  },
  methods: {
    open() {
      this.$refs.actionModal.open()
    },
    validateForm() {
      this.$v.$touch()

      return !this.$v.$invalid
    },
    clear() {
      this.$v.$reset()

      this.amount = 0
    },
    async simulateForm() {
      return await this.$store.dispatch(`simulateDeposit`, {
        proposal_id: this.proposalId,
        amount: [
          {
            amount: String(uatoms(this.amount)),
            denom: this.denom
          }
        ]
      })
    },
    async submitForm(gasEstimate, gasPrice, password, submitType) {
      // TODO: support multiple coins
      await this.$store.dispatch(`submitDeposit`, {
        submitType,
        password,
        proposal_id: this.proposalId,
        amount: [
          {
            amount: String(uatoms(this.amount)),
            denom: this.denom
          }
        ],
        gas: String(gasEstimate),
        gas_prices: [
          {
            amount: String(uatoms(gasPrice)),
            denom: this.bondDenom
          }
        ]
      })

      this.$store.commit(`notify`, {
        title: `Successful deposit!`,
        body: `You have successfully deposited your ${num.viewDenom(
          this.denom
        )}s on proposal #${this.proposalId}`
      })
    }
  }
}
</script>
