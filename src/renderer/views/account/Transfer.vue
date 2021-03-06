<template>
  <div class="modal is-active">
    <div class="cover-page">
      <div class="cover-page__content">
        <div class="cover-page__title">{{tokenSymbol}} 转账</div>
        <form class="cover-page__form" @submit.prevent="confirmInfo()">
          <div class="field">
            <label class="label">
              收款用户
            </label>
            <div class="control">
              <input v-model="toAccountName" class="input" type="text" placeholder="请输入收款用户名" required />
              <p class="help is-danger" v-show="toAccountName && !isValidToAccountName">
                用户名只能包含 .12345abcdefghijklmnopqrstuvwxyz，并且在 12 位以内
              </p>
            </div>
          </div>
          <div class="field">
            <label class="label">
              转账金额
            </label>
            <div class="control">
              <input v-model="amount" min="0" class="input" type="number" :step="`${0.1 ** precision}`" :placeholder="`单位 ${tokenSymbol}`" required />
              <p class="help is-danger" v-show="amount && !isValidAmount">
                金额必须为数字，且最多 {{precision}} 位小数
              </p>
            </div>
          </div>
          <div class="field">
            <label class="label">
              备注
            </label>
            <div class="control">
              <input v-model="memo" min="0" class="input" type="text" placeholder="备注" max-length="255"/>
            </div>
          </div>
          <div class="field">
            <p class="help tips">* 手续费 {{app.fee}}</p>
          </div>
          <div class="field is-grouped is-grouped-right">
            <div class="control">
              <a tabindex="-1" class="button cancel-button" @click="close">取消</a>
            </div>
            <div class="control">
              <button type="submit" class="button is-link">下一步</button>
            </div>
          </div>
        </form>
      </div>
      <a class="modal-close is-large cover-page-close" @click="close"></a>
    </div>
    <confirm-modal :show="showConfirm" :submitting="submitting" @confirm="submit()" @close="toggle('showConfirm', false)">
      <div>
        <div class="row">
          <div class="row__title">交易名称</div>
          <div class="row__content">转账</div>
        </div>
        <div class="row">
          <div class="row__title">转出用户</div>
          <div class="row__content">{{fromAccountName}}</div>
        </div>
        <div class="row">
          <div class="row__title">收款用户</div>
          <div class="row__content">{{toAccountName}}</div>
        </div>
        <div class="row">
          <div class="row__title">转账金额</div>
          <div class="row__content">{{amount | formatNumber({p: precision, showSymbol: true, symbol: tokenSymbol})}}</div>
        </div>
        <div class="row">
          <div class="row__title">手续费</div>
          <div class="row__content">{{app.fee}}</div>
        </div>
        <div class="row">
          <div class="row__title">输入密码</div>
          <div class="row__content">
            <input class="input" v-model="password" type="password" placeholder="请输入转出用户的钱包密码" required />
          </div>
        </div>
      </div>
    </confirm-modal>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';

import Message from '@/components/Message';
import ConfirmModal from '@/components/ConfirmModal';
import { Actions } from '@/constants/types.constants';
import { isValidAccountName, isValidAmount } from '@/utils/rules';
import { toNumber } from '@/utils/util';

export default {
  name: 'Transfer',
  data() {
    return {
      toAccountName: '',
      amount: '',
      submitting: false,
      memo: '',

      fee: 0.01,
      password: '',
      showConfirm: false,
    };
  },
  computed: {
    fromAccountName() {
      return this.$route.params.accountName;
    },
    tokenSymbol() {
      return this.$route.params.symbol || 'EOS';
    },
    precision() {
      return this.$route.params.precision !== undefined ? this.$route.params.precision : '4';
    },
    isValidToAccountName() {
      return this.toAccountName && isValidAccountName(this.toAccountName);
    },
    isValidAmount() {
      return this.amount && isValidAmount(this.amount, { precision: this.precision });
    },
    ...mapState(['app', 'account']),
  },
  methods: {
    confirmInfo() {
      if (this.isValidToAccountName && this.isValidAmount) {
        const isOver =
          this.tokenSymbol === 'EOS'
            ? toNumber(this.account.info.available) - toNumber(this.amount) - 0.1 - this.fee
            : toNumber(this.account.info.available) - 0.1 - this.fee;

        if (isOver < 0.00001) {
          return this.$confirm(
            '您的可用余额将降低到0.1以下，可能不够缴纳后续交易的手续费，请注意预留一部分的可用资金。',
            '提示',
            {
              confirmButtonText: '继续发送',
              cancelButtonText: '取消发送',
              type: 'warning',
            }
          )
            .then(() => {
              this.showConfirm = true;
            })
            .catch(() => {
              this.showConfirm = false;
            });
        }
        this.showConfirm = true;
      }
    },
    submit() {
      this.submitting = true;
      this.transfer({
        from: this.fromAccountName,
        to: this.toAccountName,
        memo: this.memo,
        amount: this.amount,
        password: this.password,
        tokenSymbol: this.tokenSymbol,
        precision: this.precision,
      })
        .then(result => {
          Message.success('转账成功');
        })
        .catch(err => {
          Message.error({
            title: `${err.code ? `code: ${err.code}` : '转账失败'}`,
            message: err.message,
          });
          this.submitting = false;
          return Promise.reject(err);
        })
        .then(() => {
          this.getAccountInfo();
          this.close();
        });
    },
    close() {
      this.$router.push({ name: 'accountDetail' });
    },
    toggle(key, val) {
      return (this[key] = val === undefined ? !this[key] : val);
    },
    ...mapActions({
      getAccountInfo: Actions.GET_ACCOUNT_INFO,
      transfer: Actions.TRANSFER,
    }),
  },
  components: {
    ConfirmModal,
  },
};
</script>
