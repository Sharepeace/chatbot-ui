import { IconFileExport, IconSettings } from '@tabler/icons-react';
import { useContext, useState } from 'react';

import { useTranslation } from 'next-i18next';

import HomeContext from '@/pages/api/home/home.context';

import { SettingDialog } from '@/components/Settings/SettingDialog';

import { Import } from '../../Settings/Import';
import { Key } from '../../Settings/Key';
import { GithubRepo } from '../../Settings/GithubRepo';
import { SidebarButton } from '../../Sidebar/SidebarButton';
import ChatbarContext from '../Chatbar.context';
import { ClearConversations } from './ClearConversations';
import { PluginKeys } from './PluginKeys';
import { FileLite } from '@/types/file'

export const ChatbarSettings = () => {
  const { t } = useTranslation('sidebar');
  const [isSettingDialogOpen, setIsSettingDialog] = useState<boolean>(false);
  // const [repoUrl, setRepoUrl] = useState<string>('');

  // const handleRepoUrlChange = (newRepoUrl: string) => {
  //   setRepoUrl(newRepoUrl);
  // };

  const {
    state: {
      apiKey,
      lightMode,
      serverSideApiKeyIsSet,
      serverSidePluginKeysSet,
      conversations,
      repoUrl,
      repoFile,
    },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const {
    handleClearConversations,
    handleImportConversations,
    handleExportData,
    handleApiKeyChange,
    handleGithubRepoChange,
    handleGitRepoLoad
  } = useContext(ChatbarContext);

  // const handleSetGitFiles = (files: FileLite[]) => {
  //   homeDispatch({ field: 'gitRepoFiles', value: file });
  //   repoFile = files;
  // }

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-white/20 pt-1 text-sm">
      {conversations.length > 0 ? (
        <ClearConversations onClearConversations={handleClearConversations} />
      ) : null}

      <Import onImport={handleImportConversations} />

      <SidebarButton
        text={t('Export data')}
        icon={<IconFileExport size={18} />}
        onClick={() => handleExportData()}
      />

      <SidebarButton
        text={t('Settings')}
        icon={<IconSettings size={18} />}
        onClick={() => setIsSettingDialog(true)}
      />

      <GithubRepo repoUrl={repoUrl} onRepoUrlChange={handleGithubRepoChange} handleSetGitFiles={handleGitRepoLoad} />

      {!serverSideApiKeyIsSet ? (
        <Key apiKey={apiKey} onApiKeyChange={handleApiKeyChange} />
      ) : null}

      {!serverSidePluginKeysSet ? <PluginKeys /> : null}

      <SettingDialog
        open={isSettingDialogOpen}
        onClose={() => {
          setIsSettingDialog(false);
        }}
      />
    </div>
  );
};
