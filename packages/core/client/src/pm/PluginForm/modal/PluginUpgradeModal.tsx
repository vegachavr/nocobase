import { Modal } from 'antd';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { PluginNpmForm } from '../form/PluginNpmForm';
import { PluginUploadForm } from '../form/PluginUploadForm';
import { PluginUrlForm } from '../form/PluginUrlForm';
import { IPluginData } from '../../types';
import { useStyles } from '../../style';

interface IPluginUpgradeModalProps {
  onClose: (refresh?: boolean) => void;
  isShow: boolean;
  pluginData: IPluginData;
}

export const PluginUpgradeModal: FC<IPluginUpgradeModalProps> = ({ onClose, isShow, pluginData }) => {
  const { t } = useTranslation();
  const { theme } = useStyles();
  return (
    <Modal
      onCancel={() => onClose()}
      footer={null}
      destroyOnClose
      title={t('Upgrade plugin')}
      width={580}
      open={isShow}
      bodyStyle={{ marginTop: theme.marginLG }}
    >
      {pluginData.type === 'npm' && <PluginNpmForm isUpgrade pluginData={pluginData} onClose={onClose} />}
      {pluginData.type === 'upload' && <PluginUploadForm isUpgrade pluginData={pluginData} onClose={onClose} />}
      {pluginData.type === 'url' && <PluginUrlForm isUpgrade pluginData={pluginData} onClose={onClose} />}
    </Modal>
  );
};
