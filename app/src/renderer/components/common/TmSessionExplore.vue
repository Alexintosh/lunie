<template>
  <div class="tm-session">
    <tm-form-struct :submit="onSubmit" class="tm-session-container">
      <div class="tm-session-header">
        <a @click="goToWelcome()">
          <i class="material-icons">arrow_back</i>
        </a>
        <div class="tm-session-title">
          Explore
        </div>
        <a @click="$store.commit(`toggleSessionModal`, false)">
          <i class="material-icons">close</i>
        </a>
      </div>
      <div class="tm-session-main">
        <tm-form-group field-id="sign-in-name" field-label="Address">
          <tm-field
            v-model="address"
            type="text"
            placeholder="Your Cosmos Address"
            vue-focus="vue-focus"
          />
          <tm-form-msg
            v-if="$v.address.$error && !$v.address.required"
            name="Name"
            type="required"
          />
          <tm-form-msg
            v-else-if="$v.address.$error && !$v.address.bech32Validate"
            name="Address"
            type="bech32"
          />
        </tm-form-group>
      </div>
      <div class="tm-session-footer">
        <tm-btn value="Next" size="lg" />
      </div>
    </tm-form-struct>
  </div>
</template>

<script>
import { required } from "vuelidate/lib/validators"
import TmBtn from "common/TmBtn"
import TmFormGroup from "common/TmFormGroup"
import TmFormStruct from "common/TmFormStruct"
import TmField from "common/TmField"
import TmFormMsg from "common/TmFormMsg"
import bech32 from "bech32"
export default {
  name: `tm-session-explore`,
  components: {
    TmBtn,
    TmField,
    TmFormGroup,
    TmFormMsg,
    TmFormStruct
  },
  data: () => ({
    address: ``,
    error: ``
  }),
  mounted() {
    this.address = localStorage.getItem(`prevAddress`)
  },
  methods: {
    goToWelcome() {
      this.$store.commit(`setSessionModalView`, `welcome`)
    },
    async onSubmit() {
      this.$v.$touch()
      if (this.$v.$error) return

      this.$store.dispatch(`signIn`, {
        sessionType: `explore`,
        address: this.address
      })
      localStorage.setItem(`prevAddress`, this.address)
      this.$router.push(`/`)
      this.$store.commit(`toggleSessionModal`, false)
    },
    bech32Validate(param) {
      try {
        bech32.decode(param)
        return true
      } catch (error) {
        return false
      }
    }
  },
  validations() {
    return {
      address: { required, bech32Validate: this.bech32Validate }
    }
  }
}
</script>
<style>
.tm-form-group a {
  cursor: pointer;
}
</style>
