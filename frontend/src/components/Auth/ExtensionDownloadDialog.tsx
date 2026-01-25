import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, Chrome, Loader2 } from 'lucide-react';
import ColoredLogoHorizontal from '@/assets/ColoredLogoHorizontal.svg';

interface ExtensionDownloadDialogProps {
  open: boolean;
  onClose: () => void;
}

// Replace with your actual Chrome Web Store extension URL
const CHROME_STORE_URL = 'https://chrome.google.com/webstore/detail/YOUR_EXTENSION_ID';

// Replace with your actual extension ID for detection
const EXTENSION_ID = 'YOUR_EXTENSION_ID';

export function ExtensionDownloadDialog({ open, onClose }: ExtensionDownloadDialogProps) {
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    if (open) {
      checkExtension();
    } else {
      // Reset state when dialog closes
      setIsInstalled(false);
      setChecking(true);
    }
  }, [open]);

  const checkExtension = async () => {
    setChecking(true);
    
    try {
      // Check if Chrome extension APIs are available
      if (typeof window !== 'undefined' && (window as any).chrome && (window as any).chrome.runtime) {
        const chrome = (window as any).chrome;
        
        // Set a timeout to prevent hanging if extension doesn't respond
        const timeout = setTimeout(() => {
          setIsInstalled(false);
          setChecking(false);
        }, 2000); // 2 second timeout
        
        // Try to send a message to the extension
        // If the extension exists and is installed, it will respond
        chrome.runtime.sendMessage(
          EXTENSION_ID,
          { action: 'ping' },
          (response: any) => {
            clearTimeout(timeout);
            
            if (chrome.runtime.lastError) {
              // Extension not installed or not responding
              setIsInstalled(false);
            } else if (response && response.success) {
              // Extension is installed and responding
              setIsInstalled(true);
            } else {
              setIsInstalled(false);
            }
            setChecking(false);
          }
        );
      } else {
        // Not in Chrome browser or extension APIs not available
        setIsInstalled(false);
        setChecking(false);
      }
    } catch (error) {
      // Extension not installed or error occurred
      console.log('Extension check error:', error);
      setIsInstalled(false);
      setChecking(false);
    }
  };

  const handleDownload = () => {
    // Open Chrome Web Store in a new tab
    window.open(CHROME_STORE_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <img 
              src={ColoredLogoHorizontal} 
              alt="JobStalker AI" 
              className="h-10"
            />
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-slate-900">
            {checking ? (
              'Checking Extension...'
            ) : isInstalled ? (
              'Extension Installed!'
            ) : (
              'Download Chrome Extension'
            )}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-600 mt-2">
            {checking ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                <span>Checking if extension is installed...</span>
              </div>
            ) : isInstalled ? (
              <div className="space-y-3 py-2">
                <p className="text-base">
                  Great! Your Chrome extension is installed and ready to use.
                </p>
                <p className="text-sm text-slate-500">
                  You can now save jobs directly from any job board to your JobStalker dashboard with a single click.
                </p>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                <p className="text-base">
                  Save jobs instantly from any job board with our powerful Chrome extension!
                </p>
                <p className="text-sm text-slate-500">
                  One-click job saving from LinkedIn, Indeed, Glassdoor, and more. Track all your opportunities in one place and never lose a promising position again.
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {checking ? (
            <div className="flex items-center gap-2 text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
              <span className="text-sm">Checking extension status...</span>
            </div>
          ) : isInstalled ? (
            <Button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl rounded-xl transition-all duration-200"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Currently Installed
            </Button>
          ) : (
            <Button
              onClick={handleDownload}
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold shadow-lg hover:shadow-xl rounded-xl transition-all duration-200"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Extension
            </Button>
          )}

          {!checking && !isInstalled && (
            <p className="text-xs text-slate-500 text-center">
              Click the button above to open the Chrome Web Store in a new tab
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
