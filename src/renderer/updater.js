import { remote } from 'electron';
const dialog = remote.dialog;
const { autoUpdater } = remote.require('electron-updater');

let showNotUpdate = false;
let updater;
autoUpdater.autoDownload = false;

if (process.env.NODE_ENV === 'production') {
  autoUpdater.checkForUpdates();
}

autoUpdater.on('error', error => {
  dialog.showErrorBox('Error: ', error == null ? 'unknown' : (error.stack || error).toString());
});

autoUpdater.on('update-available', () => {
  dialog.showMessageBox(
    {
      type: 'info',
      title: '发现新版本',
      message: '是否立即更新新版本，确认后程序会在后台下载更新。',
      buttons: ['更新', '取消'],
    },
    buttonIndex => {
      if (buttonIndex === 0) {
        autoUpdater.downloadUpdate();
      } else {
        if (updater) {
          updater.enabled = true;
          updater = null;
        }
      }
    }
  );
});

autoUpdater.on('update-not-available', () => {
  if (showNotUpdate) {
    dialog.showMessageBox({
      title: '没有更新',
      message: '你当前的版本是最新的！',
    });
    updater.enabled = true;
    updater = null;
    showNotUpdate = false;
  }
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(
    {
      title: '安装更新',
      message: '更新已下载完成，确认后会自动安装',
    },
    () => {
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  );
});

export const checkForUpdates = (menuItem, focusedWindow, event) => {
  updater = menuItem;
  updater.enabled = false;
  showNotUpdate = true;
  autoUpdater.checkForUpdates();
};
