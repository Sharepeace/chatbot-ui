import { IconCheck, IconX, IconGitBranch } from '@tabler/icons-react';
import {
    FC, KeyboardEvent,
    useEffect,
    useRef,
    useState,
    Dispatch,
    SetStateAction,
} from 'react';

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
import { FileLite } from '@/types/file';
import { compact } from "lodash";
import axios from "axios";

interface Props {
    repoUrl: string;
    onRepoUrlChange: (repoUrl: string) => void;
    handleSetGitFiles: Dispatch<SetStateAction<FileLite[]>>;
}

export const GithubRepo: FC<Props> = ({ repoUrl, onRepoUrlChange, handleSetGitFiles }) => {
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


    // const handleSetFiles = props.handleSetFiles;

    const [files, setFiles] = useState<FileLite[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [progress, setProgress] = useState({ percentage: 0, message: '' });
    const fetchGitHubRepo = async (repoUrl: string) => {
        try {
            // Set initial progress to 0%
            let percentage = 0;
            setProgress({ percentage, message: 'Fetching...' });

            // Start interval to increment progress by 1% every 500ms
            const intervalId = setInterval(() => {
                if (percentage < 100) {
                    percentage++;
                    setProgress({ percentage, message: `Fetching...${percentage}%` });
                }
            }, 500);

            // Example API call
            const response = await fetch(
                `/api/process-github-repo?repoUrl=${encodeURIComponent(repoUrl)}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            // Stop the progress interval when response is received
            clearInterval(intervalId);

            if (response.ok) {
                const data = await response.json();
                console.log("git repo scraped: ", data);
                if (Array.isArray(data.files)) {
                    console.log("Received files from API:", data);
                    handleSetGitFiles((prevFiles) => [...prevFiles, ...data.files]);
                    console.log("git repo files processed: ", data);
                    setProgress({ percentage: 100, message: "Complete!" });
                } else {
                    console.error("Error processing files: 'files' property is not an array");
                    setProgress({ percentage: 0, message: "Errored" });
                }
            } else {
                console.error('Error fetching GitHub repo:', response.status);
                setProgress({ percentage: 0, message: 'Errored' });
            }

        } catch (error) {
            console.error('Error fetching GitHub repo:', error);
            setProgress({ percentage: 0, message: 'Errored' });
        }

    };

    const processScrapedData = async (scrapedData: Array<[string, string]>) => {
        setError("");

        // if (files.length + scrapedData.length > props.maxNumFiles) {
        //   setError(`You can only upload up to ${props.maxNumFiles} files.`);
        //   return;
        // }

        setLoading(true);

        const processedFiles = await Promise.all(
            scrapedData.map(async ([fileName, fileText]) => {
                // Check if the file name already exists in the files state
                if (files.find((f) => f.name === fileName)) {
                    return null; // Skip this file
                }

                try {
                    const processFileResponse = await axios.post("/api/process-text", {
                        text: fileText,
                    });

                    if (processFileResponse.status === 200) {
                        const meanEmbedding = processFileResponse.data.meanEmbedding;
                        const chunks = processFileResponse.data.chunks;

                        const fileObject: FileLite = {
                            name: fileName,
                            url: "",
                            type: "text/plain",
                            size: fileText.length,
                            expanded: false,
                            embedding: meanEmbedding,
                            chunks,
                            extractedText: fileText,
                        };

                        return fileObject;
                    } else {
                        console.log("Error creating file embedding");
                        return null;
                    }
                } catch (err: any) {
                    console.log(`Error creating file embedding: ${err}`);
                    return null;
                }
            })
        );

        // Filter out any null values from the processedFiles array
        const validFiles = compact(processedFiles);

        // Set the files state with the valid files and the existing files
        setFiles((prevFiles) => [...prevFiles, ...validFiles]);
        handleSetGitFiles((prevFiles) => [...prevFiles, ...validFiles]);

        setLoading(false);
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
