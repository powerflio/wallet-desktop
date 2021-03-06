import uuidV4 from 'uuid/v4';

import { privateToPublic, encrypt } from '@/utils/util';
import { EOSFORCE_WALLET_KEY } from '@/constants/config.constants';
import { isValidPassword, isValidPrivate } from '@/utils/rules';
import Store from '@/store';

export default class Storage {
  constructor(storagePath) {
    this.storagePath = storagePath;
  }

  static setPath(storagePath) {
    if (!storagePath) throw new Error('storagePath 不能为空');
    return new Storage(storagePath);
  }

  store(data) {
    try {
      localStorage.setItem(this.storagePath, JSON.stringify(data));
      return Promise.resolve(data);
    } catch (err) {
      return Promise.reject(err);
    }
  }

  fetch() {
    const _data = localStorage.getItem(this.storagePath);
    try {
      return Promise.resolve(JSON.parse(_data));
    } catch (err) {
      return Promise.resolve(err);
    }
  }

  remove() {
    return Promise.resolve(localStorage.removeItem(this.storagePath));
  }
}

export const getWalletIdFromKey = (key = '') => {
  const reg = new RegExp(`^${EOSFORCE_WALLET_KEY}/(.*)#${Store.state.app.chainNet}`);
  const matchResult = key.match(reg);
  return matchResult && matchResult[1] ? matchResult[1] : null;
};

export const getWalletIdList = () => {
  return Object.keys(localStorage)
    .map(key => getWalletIdFromKey(key))
    .filter(value => value);
};

export const getWalletKeyFromId = id => {
  return `${EOSFORCE_WALLET_KEY}/${id}#${Store.state.app.chainNet}`;
};

export const createWalletData = ({ privateKey, password }) => {
  if (isValidPrivate(privateKey) && isValidPassword(password)) {
    const publicKey = privateToPublic(privateKey);
    const crypto = encrypt(password, { privateKey });
    const id = uuidV4();
    const data = {
      version: '1',
      id,
      publicKey,
      crypto,
    };
    return Storage.setPath(getWalletKeyFromId(publicKey)).store(data);
  } else {
    return Promise.reject(new Error('数据格式错误'));
  }
};

export const deleteWalletData = ({ publicKey }) => {
  return Storage.setPath(getWalletKeyFromId(publicKey)).remove();
};
