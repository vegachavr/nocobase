import { App } from 'antd';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ISchema } from '@formily/json-schema';
import { uid } from '@formily/shared';
import { useForm } from '@formily/react';

import { useAPIClient, useRequest } from '../../../api-client';
import { SchemaComponent } from '../../../schema-component';
import { IPluginData } from '../../types';

const schema: ISchema = {
  type: 'object',
  properties: {
    [uid()]: {
      'x-decorator': 'Form',
      'x-component': 'div',
      type: 'void',
      'x-decorator-props': {
        useValues: '{{ useValuesFromProps }}',
      },
      properties: {
        compressedFileUrl: {
          type: 'string',
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          required: true,
        },
        footer: {
          type: 'void',
          'x-component': 'ActionBar',
          'x-component-props': {
            layout: 'one-column',
          },
          properties: {
            submit: {
              title: '{{t("Submit")}}',
              'x-component': 'Action',
              'x-component-props': {
                type: 'primary',
                htmlType: 'submit',
                useAction: '{{ useSaveValues }}',
              },
            },
            cancel: {
              title: 'Cancel',
              'x-component': 'Action',
              'x-component-props': {
                useAction: '{{ useCancel }}',
              },
            },
          },
        },
      },
    },
  },
};

interface IPluginUrlFormProps {
  onClose: (refresh?: boolean) => void;
  isUpgrade?: boolean;
  pluginData?: IPluginData;
}

export const PluginUrlForm: FC<IPluginUrlFormProps> = ({ onClose, pluginData, isUpgrade }) => {
  const { message } = App.useApp();
  const useSaveValues = () => {
    const api = useAPIClient();
    const { t } = useTranslation();
    const form = useForm();

    return {
      async run() {
        const compressedFileUrl = form.values.compressedFileUrl;
        if (!compressedFileUrl) return;
        await form.submit();
        await api.request({
          url: `pm:${isUpgrade ? 'upgradeByCompressedFileUrl/' + name : 'addByCompressedFileUrl'}`,
          method: 'post',
          data: {
            compressedFileUrl,
            type: 'url',
          },
        });
        message.success(t('Saved successfully'), 2, () => {
          onClose(true);
        });
      },
    };
  };

  const useValuesFromProps = (options) => {
    return useRequest(
      () =>
        Promise.resolve({
          data: { compressedFileUrl: pluginData.compressedFileUrl },
        }),
      options,
    );
  };

  const useCancel = () => {
    return {
      run() {
        onClose();
      },
    };
  };

  return <SchemaComponent scope={{ useCancel, useValuesFromProps, useSaveValues }} schema={schema} />;
};
