import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  LinearProgress 
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { SESSION_TIMEOUT } from '../utils/sessionManager';

interface SessionTimeoutDialogProps {
  // Amount of time before logout to show the dialog (in milliseconds)
  warningTime?: number;
}

const SessionTimeoutDialog: React.FC<SessionTimeoutDialogProps> = ({ 
  warningTime = 60000 // Default to 60 seconds warning
}) => {
  const { sessionManager, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(warningTime);
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // Setup listeners for session timeout warning
  useEffect(() => {
    if (!isAuthenticated || !sessionManager) return;

    const handleSessionWarning = (timeoutIn: number) => {
      // Show dialog when timeout is approaching
      setTimeLeft(timeoutIn);
      setOpen(true);
      
      // Start countdown timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1000;
          if (newTime <= 0) {
            clearInterval(timer);
            // Force logout when timer reaches zero
            logout();
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      setTimerId(timer);
    };

    // Check session status every 15 seconds
    const checkInterval = setInterval(() => {
      const lastActivity = localStorage.getItem('lastActivityUpdate');
      if (!lastActivity) return;
      
      const inactiveTime = Date.now() - parseInt(lastActivity);
      const timeUntilTimeout = SESSION_TIMEOUT - inactiveTime;
      
      // If we're within the warning period, show the dialog
      if (timeUntilTimeout > 0 && timeUntilTimeout <= warningTime) {
        // Only show the dialog if it's not already open
        if (!open) {
          handleSessionWarning(timeUntilTimeout);
        }
      } else if (timeUntilTimeout <= 0) {
        // If time has already expired, logout immediately
        logout();
      }
    }, 15000);

    return () => {
      clearInterval(checkInterval);
      if (timerId) clearInterval(timerId);
    };
  }, [isAuthenticated, sessionManager, warningTime, logout, open]);

  // Handle keep session active button
  const handleKeepActive = () => {
    if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
    
    // Trigger activity to reset the timeout
    if (sessionManager) {
      // Access the private method via type assertion
      const manager = sessionManager as any;
      if (typeof manager.forceUpdateServerActivity === 'function') {
        manager.forceUpdateServerActivity();
      }
      
      // Also manually dispatch events to trigger activity detection
      window.dispatchEvent(new MouseEvent('mousemove'));
      window.dispatchEvent(new MouseEvent('click'));
      
      // Update the lastActivity timestamp in localStorage
      localStorage.setItem('lastActivityUpdate', Date.now().toString());
    }
    
    setOpen(false);
  };

  // Format the time for display
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Calculate progress percentage
  const progressValue = (timeLeft / warningTime) * 100;

  return (
    <Dialog
      open={open}
      aria-labelledby="session-timeout-dialog-title"
      disableEscapeKeyDown
      onClose={(event, reason) => {
        // Prevent closing by clicking outside
        if (reason !== 'backdropClick') {
          setOpen(false);
        }
      }}
    >
      <DialogTitle id="session-timeout-dialog-title">
        Phiên làm việc sắp hết hạn
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Bạn sẽ tự động đăng xuất trong {formatTime(timeLeft)} do không có hoạt động.
        </Typography>
        <LinearProgress 
          variant="determinate" 
          value={progressValue} 
          color="error"
          style={{ marginTop: '16px', height: '8px' }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleKeepActive} color="primary" variant="contained">
          Tiếp tục làm việc
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionTimeoutDialog; 