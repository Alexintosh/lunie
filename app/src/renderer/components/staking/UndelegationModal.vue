<template>
  <action-modal
    id="undelegation-modal"
    ref="actionModal"
    :submit-fn="submitForm"
    :simulate-fn="simulateForm"
    :validate="validateForm"
    :amount="amount"
    title="Undelegate"
    class="undelegation-modal"
    submission-error-prefix="Undelegating failed"
    @close="clear"
  >
    <tm-form-group
      class="action-modal-form-group"
      field-id="from"
      field-label="From"
    >
      <tm-field
        id="from"
        v-model="validator.operator_address"
        readonly
      />
    </tm-form-group>
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
        placeholder="Amount"
      />
      <p v-if="maximum > 0">
        {{ num.viewDenom(denom) }}s delegated: {{ maximum }}
      </p>
      <tm-form-msg
        v-if="maximum === 0"
        :msg="`don't have any ${
          num.viewDenom(denom)
        }s delegated to this validator`"
        name="You"
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
import ActionModal from "common/ActionModal"
import TmField from "common/TmField"
import TmFormGroup from "common/TmFormGroup"
import TmFormMsg from "common/TmFormMsg"

export default {
  name: `undelegation-modal`,
  components: {
    ActionModal,
    TmField,
    TmFormGroup,
    TmFormMsg
  },
  props: {
    maximum: {
      type: Number,
      required: true
    },
    fromOptions: {
      type: Array,
      required: true
    },
    to: {
      type: String,
      required: true
    },
    validator: {
      type: Object,
      required: true
    },
    denom: {
      type: String,
      required: true
    }
  },
  data: () => ({
    amount: null,
    atoms,
    num
  }),
  computed: {
    ...mapGetters([`bondDenom`, `liquidAtoms`])
  },
  validations() {
    return {
      amount: {
        required: x => !!x && x !== `0`,
        decimal,
        between: between(SMALLEST, this.maximum)
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

      this.amount = null
    },
    async simulateForm() {
      return await this.$store.dispatch(`simulateUnbondingDelegation`, {
        amount: -uatoms(this.amount),
        validator: this.validator
      })
    },
    async submitForm(gasEstimate, gasPrice, password, submitType) {
      await this.$store.dispatch(`submitUnbondingDelegation`, {
        amount: -uatoms(this.amount),
        validator: this.validator,
        gas: String(gasEstimate),
        gas_prices: [
          {
            amount: String(uatoms(gasPrice)),
            denom: this.denom
          }
        ],
        submitType,
        password
      })

      this.$store.commit(`notify`, {
        title: `Successful undelegation!`,
        body: `You have successfully undelegated ${this.amount} ${num.viewDenom(
          this.denom
        )}s.`
      })
    }
  }
}
</script>
