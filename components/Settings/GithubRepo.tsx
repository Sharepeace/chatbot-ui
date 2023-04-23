import { IconCheck, IconX, IconGitBranch } from '@tabler/icons-react';
import { FC, KeyboardEvent, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'next-i18next';

import { SidebarButton } from '../Sidebar/SidebarButton';

// material 
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';


interface Props {
    repoUrl: string;
    onRepoUrlChange: (repoUrl: string) => void;
}

export const GithubRepo: FC<Props> = ({ repoUrl, onRepoUrlChange }) => {
    const { t } = useTranslation('sidebar');
    const [isChanging, setIsChanging] = useState(false);
    const [newRepoUrl, setNewRepoUrl] = useState(repoUrl);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleEnterDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUpdateRepoUrl(newRepoUrl);
        }
    };

    const handleUpdateRepoUrl = (newRepoUrl: string) => {
        onRepoUrlChange(newRepoUrl.trim());
        setIsChanging(false);
    };

    useEffect(() => {
        if (isChanging) {
            inputRef.current?.focus();
        }
    }, [isChanging]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const handleDialogOpen = () => {
        setIsDialogOpen(true);
    };

    const [progress, setProgress] = useState({ percentage: 0, message: '' });
    const fetchGitHubRepo = async (repoUrl: string) => {
        try {
            // Simulate API progress
            setProgress({ percentage: 0, message: 'Fetching...' });

            // Replace the following code block with your actual API call and progress handling
            setTimeout(() => setProgress({ percentage: 25, message: 'Fetching...' }), 1000);
            setTimeout(() => setProgress({ percentage: 50, message: 'Fetching...' }), 2000);
            setTimeout(() => setProgress({ percentage: 75, message: 'Fetching...' }), 3000);
            setTimeout(() => setProgress({ percentage: 100, message: 'Complete!' }), 4000);

            // Example API call
            const response = await fetch(`/api/githubScrape?repoUrl=${encodeURIComponent(repoUrl)}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
          

            if (response.ok) {
                const data = await response.json();
                console.log(data);
                setProgress({ percentage: 100, message: 'Complete!' });
            } else {
                console.error('Error fetching GitHub repo:', response.status);
                setProgress({ percentage: 0, message: '' });
            }
        } catch (error) {
            console.error('Error fetching GitHub repo:', error);
            setProgress({ percentage: 0, message: '' });
        }
    };



    return (
        <>
            {isChanging ? (
                <div className="duration:200 flex w-full cursor-pointer items-center rounded-md py-3 px-3 transition-colors hover:bg-gray-500/10">
                    <IconGitBranch size={18} />

                    <Dialog
                        open={isDialogOpen}
                        onClose={() => setIsDialogOpen(false)}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">
                            {t('Fetch GitHub Repo')}
                        </DialogTitle>
                        <DialogContent>
                            <DialogContentText id="alert-dialog-description">
                                {t('You want to fetch this repo? This may take a few minutes.')}
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setIsDialogOpen(false)} color="primary">
                                {t('No')}
                            </Button>
                            <Button
                                onClick={async () => {
                                    handleUpdateRepoUrl(newRepoUrl);
                                    // Call the nextjs api/githubScrape function here
                                    await fetchGitHubRepo(newRepoUrl);
                                    setIsDialogOpen(false);
                                }}
                                color="primary"
                                autoFocus
                            >
                                {t('Yes')}
                            </Button>
                        </DialogActions>
                    </Dialog>


                    <input
                        ref={inputRef}
                        className="ml-2 h-[20px] flex-1 overflow-hidden overflow-ellipsis border-b border-neutral-400 bg-transparent pr-1 text-[12.5px] leading-3 text-left text-white outline-none focus:border-neutral-100"
                        type="text"
                        value={newRepoUrl}
                        onChange={(e) => setNewRepoUrl(e.target.value)}
                        onKeyDown={handleEnterDown}
                        placeholder={t('GitHub Repo URL') || 'GitHub Repo URL'}
                    />

                    <div className="flex w-[40px]">
                        <IconCheck
                            className="ml-auto min-w-[20px] text-neutral-400 hover:text-neutral-100"
                            size={18}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDialogOpen();
                            }}
                        />

                        <IconX
                            className="ml-auto min-w-[20px] text-neutral-400 hover:text-neutral-100"
                            size={18}
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsChanging(false);
                                setNewRepoUrl(repoUrl);
                            }}
                        />
                    </div>
                </div>
            ) : (
                <SidebarButton
                    text={t('GitHub Repo URL')}
                    icon={<IconGitBranch size={18} />}
                    onClick={() => setIsChanging(true)}
                />
            )}
            <div className="w-full mt-2">
                <LinearProgress
                    variant="determinate"
                    value={progress.percentage}
                    className={progress.message ? 'opacity-100' : 'opacity-0'}
                />
                <span className="ml-2 text-xs text-neutral-400">{progress.message}</span>
            </div>
        </>
    );
}
