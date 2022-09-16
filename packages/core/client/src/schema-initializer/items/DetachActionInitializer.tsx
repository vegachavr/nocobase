import React from 'react';
import { ActionInitializer } from './ActionInitializer';

export const DetachActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Detach") }}',
    'x-action': 'detach',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-decorator': 'ACLActionProvider',
    'x-component-props': {
      disabled:true,
      icon: 'DisconnectOutlined',
      confirm: {
        title: "{{t('Detach record')}}",
        content: "{{t('Are you sure you want to detach it?')}}",
      },
      useProps: '{{ useBulkDetachActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};
