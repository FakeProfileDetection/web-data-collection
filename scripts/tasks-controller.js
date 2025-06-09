// Tasks Page Controller
// Place this file at: scripts/tasks-controller.js

// Task definitions using CONFIG from common.js
const TasksController = {
  // State
  currentTaskIndex: 0,
  userId: null,
  
  // Task definitions
  tasks: [
    // First cycle
    {
      platform: "Facebook",
      platformClass: "facebook",
      task: "Watch Coach Carter Movie Clip",
      video: "videos/Coach Carter (6_9) Movie CLIP - Our Deepest Fear (2005) HD.mp4",
      link: CONFIG.PLATFORMS.FACEBOOK.url,
      platformId: CONFIG.PLATFORMS.FACEBOOK.id,
      videoNumber: 1,
      round: 1
    },
    {
      platform: "Instagram",
      platformClass: "instagram",
      task: "Watch Coach Carter Movie Clip",
      video: "videos/Coach Carter (6_9) Movie CLIP - Our Deepest Fear (2005) HD.mp4",
      link: CONFIG.PLATFORMS.INSTAGRAM.url,
      platformId: CONFIG.PLATFORMS.INSTAGRAM.id,
      videoNumber: 1,
      round: 1
    },
    {
      platform: "Twitter",
      platformClass: "twitter",
      task: "Watch Coach Carter Movie Clip",
      video: "videos/Coach Carter (6_9) Movie CLIP - Our Deepest Fear (2005) HD.mp4",
      link: CONFIG.PLATFORMS.TWITTER.url,
      platformId: CONFIG.PLATFORMS.TWITTER.id,
      videoNumber: 1,
      round: 1
    },
    {
      platform: "Facebook",
      platformClass: "facebook",
      task: "Watch The Oscar Slap Clip",
      video: "videos/Watch the uncensored moment Will Smith smacks Chris Rock on stage at the Oscars, drops F-bomb.mp4",
      link: CONFIG.PLATFORMS.FACEBOOK.url,
      platformId: CONFIG.PLATFORMS.FACEBOOK.id,
      videoNumber: 2,
      round: 1
    },
    {
      platform: "Instagram",
      platformClass: "instagram",
      task: "Watch The Oscar Slap Clip",
      video: "videos/Watch the uncensored moment Will Smith smacks Chris Rock on stage at the Oscars, drops F-bomb.mp4",
      link: CONFIG.PLATFORMS.INSTAGRAM.url,
      platformId: CONFIG.PLATFORMS.INSTAGRAM.id,
      videoNumber: 2,
      round: 1
    },
    {
      platform: "Twitter",
      platformClass: "twitter",
      task: "Watch The Oscar Slap Clip",
      video: "videos/Watch the uncensored moment Will Smith smacks Chris Rock on stage at the Oscars, drops F-bomb.mp4",
      link: CONFIG.PLATFORMS.TWITTER.url,
      platformId: CONFIG.PLATFORMS.TWITTER.id,
      videoNumber: 2,
      round: 1
    },
    {
      platform: "Facebook",
      platformClass: "facebook",
      task: "Watch Trump/Vance & Zelenskyy Oval Office Meeting",
      video: "videos/TrumpandVancecallZelenskyydisrespectfulinOvalOfficemeeting.mp4",
      link: CONFIG.PLATFORMS.FACEBOOK.url,
      platformId: CONFIG.PLATFORMS.FACEBOOK.id,
      videoNumber: 3,
      round: 1
    },
    {
      platform: "Instagram",
      platformClass: "instagram",
      task: "Watch Trump/Vance & Zelenskyy Oval Office Meeting",
      video: "videos/TrumpandVancecallZelenskyydisrespectfulinOvalOfficemeeting.mp4",
      link: CONFIG.PLATFORMS.INSTAGRAM.url,
      platformId: CONFIG.PLATFORMS.INSTAGRAM.id,
      videoNumber: 3,
      round: 1
    },
    {
      platform: "Twitter",
      platformClass: "twitter",
      task: "Watch Trump/Vance & Zelenskyy Oval Office Meeting",
      video: "videos/TrumpandVancecallZelenskyydisrespectfulinOvalOfficemeeting.mp4",
      link: CONFIG.PLATFORMS.TWITTER.url,
      platformId: CONFIG.PLATFORMS.TWITTER.id,
      videoNumber: 3,
      round: 1
    },
    // Second cycle - same videos, round 2
    {
      platform: "Facebook",
      platformClass: "facebook",
      task: "Watch Coach Carter Movie Clip",
      video: "videos/Coach Carter (6_9) Movie CLIP - Our Deepest Fear (2005) HD.mp4",
      link: CONFIG.PLATFORMS.FACEBOOK.url,
      platformId: CONFIG.PLATFORMS.FACEBOOK.id,
      videoNumber: 1,
      round: 2
    },
    {
      platform: "Instagram",
      platformClass: "instagram",
      task: "Watch Coach Carter Movie Clip",
      video: "videos/Coach Carter (6_9) Movie CLIP - Our Deepest Fear (2005) HD.mp4",
      link: CONFIG.PLATFORMS.INSTAGRAM.url,
      platformId: CONFIG.PLATFORMS.INSTAGRAM.id,
      videoNumber: 1,
      round: 2
    },
    {
      platform: "Twitter",
      platformClass: "twitter",
      task: "Watch Coach Carter Movie Clip",
      video: "videos/Coach Carter (6_9) Movie CLIP - Our Deepest Fear (2005) HD.mp4",
      link: CONFIG.PLATFORMS.TWITTER.url,
      platformId: CONFIG.PLATFORMS.TWITTER.id,
      videoNumber: 1,
      round: 2
    },
    {
      platform: "Facebook",
      platformClass: "facebook",
      task: "Watch The Oscar Slap Clip",
      video: "videos/Watch the uncensored moment Will Smith smacks Chris Rock on stage at the Oscars, drops F-bomb.mp4",
      link: CONFIG.PLATFORMS.FACEBOOK.url,
      platformId: CONFIG.PLATFORMS.FACEBOOK.id,
      videoNumber: 2,
      round: 2
    },
    {
      platform: "Instagram",
      platformClass: "instagram",
      task: "Watch The Oscar Slap Clip",
      video: "videos/Watch the uncensored moment Will Smith smacks Chris Rock on stage at the Oscars, drops F-bomb.mp4",
      link: CONFIG.PLATFORMS.INSTAGRAM.url,
      platformId: CONFIG.PLATFORMS.INSTAGRAM.id,
      videoNumber: 2,
      round: 2
    },
    {
      platform: "Twitter",
      platformClass: "twitter",
      task: "Watch The Oscar Slap Clip",
      video: "videos/Watch the uncensored moment Will Smith smacks Chris Rock on stage at the Oscars, drops F-bomb.mp4",
      link: CONFIG.PLATFORMS.TWITTER.url,
      platformId: CONFIG.PLATFORMS.TWITTER.id,
      videoNumber: 2,
      round: 2
    },
    {
      platform: "Facebook",
      platformClass: "facebook",
      task: "Watch Trump/Vance & Zelenskyy Oval Office Meeting",
      video: "videos/TrumpandVancecallZelenskyydisrespectfulinOvalOfficemeeting.mp4",
      link: CONFIG.PLATFORMS.FACEBOOK.url,
      platformId: CONFIG.PLATFORMS.FACEBOOK.id,
      videoNumber: 3,
      round: 2
    },
    {
      platform: "Instagram",
      platformClass: "instagram",
      task: "Watch Trump/Vance & Zelenskyy Oval Office Meeting",
      video: "videos/TrumpandVancecallZelenskyydisrespectfulinOvalOfficemeeting.mp4",
      link: CONFIG.PLATFORMS.INSTAGRAM.url,
      platformId: CONFIG.PLATFORMS.INSTAGRAM.id,
      videoNumber: 3,
      round: 2
    },
    {
      platform: "Twitter",
      platformClass: "twitter",
      task: "Watch Trump/Vance & Zelenskyy Oval Office Meeting",
      video: "videos/TrumpandVancecallZelenskyydisrespectfulinOvalOfficemeeting.mp4",
      link: CONFIG.PLATFORMS.TWITTER.url,
      platformId: CONFIG.PLATFORMS.TWITTER.id,
      videoNumber: 3,
      round: 2
    }
  ],

  // Initialize the controller
  init() {
    console.log('Tasks controller initializing...');
    
    // Get user ID
    this.userId = NavigationManager.getQueryParam('user_id') || 
                  SecureCookieManager.getCookie('user_id');
    
    if (!this.userId) {
      this.showMessage('Session not found. Redirecting...', 'error');
      setTimeout(() => {
        window.location.href = 'consent.html';
      }, 2000);
      return;
    }

    console.log('Tasks initialized for user:', this.userId);
    
    // Store in cookie for consistency
    SecureCookieManager.setCookie('user_id', this.userId);
    
    // Check if returning from a completed task
    const completedTask = NavigationManager.getQueryParam('completed_task');
    if (completedTask !== null) {
      // User is returning from completing a task
      const taskIndex = parseInt(completedTask);
      console.log('Completed task parameter:', taskIndex, 'Current index:', this.currentTaskIndex);
      
      // Get saved task index from cookie/storage
      const savedTaskIndex = parseInt(SecureCookieManager.getCookie('current_task_index') || '0');
      
      if (!isNaN(taskIndex) && taskIndex >= savedTaskIndex) {
        // Move to next task
        this.currentTaskIndex = taskIndex + 1;
        console.log('Task completed, advancing from', taskIndex, 'to', this.currentTaskIndex);
        
        // Save the new current task index
        SecureCookieManager.setCookie('current_task_index', this.currentTaskIndex.toString());
        
        // Clean URL to remove completed_task parameter
        const cleanUrl = `${window.location.pathname}?user_id=${encodeURIComponent(this.userId)}`;
        window.history.replaceState({}, document.title, cleanUrl);
      } else {
        // Restore from saved index if URL param is invalid
        this.currentTaskIndex = savedTaskIndex;
      }
    } else {
      // No completed_task param, check for saved progress
      const savedTaskIndex = parseInt(SecureCookieManager.getCookie('current_task_index') || '0');
      this.currentTaskIndex = savedTaskIndex;
      console.log('Loaded saved task index:', this.currentTaskIndex);
    }
    
    // Initialize progress visualization
    this.initializeProgressDots();
    
    // Load the current task
    this.loadTask(this.currentTaskIndex);
    
    // Set up video event listeners
    this.setupVideoListeners();
  },

  // Initialize progress dots
  initializeProgressDots() {
    const progressContainer = document.getElementById('task-progress');
    progressContainer.innerHTML = '';
    
    for (let i = 0; i < this.tasks.length; i++) {
      const dot = document.createElement('div');
      dot.className = 'task-dot';
      dot.setAttribute('data-task-index', i);
      progressContainer.appendChild(dot);
    }
  },

  // Update progress visualization
  updateProgress() {
    const dots = document.querySelectorAll('.task-dot');
    dots.forEach((dot, index) => {
      dot.classList.remove('current', 'completed');
      if (index < this.currentTaskIndex) {
        dot.classList.add('completed');
      } else if (index === this.currentTaskIndex) {
        dot.classList.add('current');
      }
    });

    // Update progress bar
    const percent = ((this.currentTaskIndex + 1) / this.tasks.length) * 100;
    document.getElementById('progress-bar').style.width = percent + '%';
    document.getElementById('progress-text').textContent = 
      `Task ${this.currentTaskIndex + 1} of ${this.tasks.length}`;
    document.getElementById('progress-percent').textContent = 
      Math.round(percent) + '%';
  },

  // Load a specific task
  loadTask(index) {
    try {
      // Check if study is complete
      if (index >= this.tasks.length) {
        console.log('All tasks completed, redirecting to completion page');
        window.location.href = `complete.html?user_id=${encodeURIComponent(this.userId)}`;
        return;
      }
      
      if (index < 0 || index >= this.tasks.length) {
        console.error('Invalid task index:', index);
        return;
      }

      const task = this.tasks[index];
      
      // Save current task index
      SecureCookieManager.setCookie('current_task_index', index.toString());
      
      // Update UI elements
      document.getElementById('current-task-number').textContent = index + 1;
      document.getElementById('platform-badge').textContent = task.platform;
      document.getElementById('platform-badge').className = `platform-badge ${task.platformClass}`;
      document.getElementById('task-title').textContent = task.task;
      document.getElementById('video-number').textContent = `${task.videoNumber} of 3`;
      document.getElementById('round-number').textContent = `${task.round} of 2`;
      
      // Update video
      const videoPlayer = document.getElementById('video-player');
      videoPlayer.src = task.video;
      
      // Update button states
      const nextButton = document.getElementById('next-button');
      
      if (index >= this.tasks.length - 1) {
        nextButton.textContent = 'Complete Study';
        nextButton.className = 'btn-task-complete btn-block';
      } else {
        nextButton.textContent = 'Open Platform';
        nextButton.className = 'btn-primary btn-block';
      }
      
      // Update reminder text
      this.updateReminder(false);
      
      // Update progress
      this.updateProgress();
      
      console.log(`Loaded task ${index + 1}: ${task.platform} - ${task.task}`);
      
    } catch (error) {
      console.error('Failed to load task:', error);
      this.showMessage('Failed to load task. Please refresh the page.', 'error');
    }
  },

  // Setup video event listeners
  setupVideoListeners() {
    const videoPlayer = document.getElementById('video-player');
    
    videoPlayer.addEventListener('play', () => {
      console.log('Video started playing');
      this.updateReminder(false);
    });
    
    videoPlayer.addEventListener('ended', () => {
      console.log('Video ended');
      this.updateReminder(true);
    });
  },

  // Update reminder text based on state
  updateReminder(videoWatched) {
    const reminder = document.getElementById('task-reminder');
    const reminderText = reminder.querySelector('.task-reminder-text');
    
    if (videoWatched) {
      reminderText.innerHTML = '<strong>Video complete!</strong> Click "Open Platform" to share your thoughts';
      reminder.style.background = '#fff3cd';
    } else {
      reminderText.innerHTML = '<strong>Next:</strong> Watch the video below, then click "Open Platform" to share your thoughts';
      reminder.style.background = '#e3f2fd';
    }
  },

  // Navigate to next task
  async nextTask() {
    const nextButton = document.getElementById('next-button');
    
    try {
      // Check if we're at the end
      if (this.currentTaskIndex >= this.tasks.length) {
        // Navigate to completion page
        nextButton.disabled = true;
        nextButton.innerHTML = '<span class="spinner"></span> Completing study...';
        
        setTimeout(() => {
          NavigationManager.navigateWithUserId('complete.html', this.userId);
        }, 500);
        return;
      }

      const task = this.tasks[this.currentTaskIndex];
      
      if (!this.userId) {
        this.showMessage('User session lost. Please start from the beginning.', 'error');
        return;
      }

      // Open platform
      nextButton.disabled = true;
      nextButton.innerHTML = '<span class="spinner"></span> Opening platform...';

      console.log(`Opening platform for task ${this.currentTaskIndex + 1}:`, task.platform);

      // Build the return URL with the current task index
      const baseUrl = window.location.origin + window.location.pathname;
      const returnUrl = `${baseUrl}?user_id=${encodeURIComponent(this.userId)}&completed_task=${this.currentTaskIndex}`;
      
      console.log('Navigating to platform with return URL:', returnUrl);
      
      // Use relative paths for local development
      let platformUrl;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
        // Local development - use relative paths
        const relativePaths = {
          0: '../fake_pages/Facebook-Clone/index.html',  // Facebook
          1: '../fake_pages/instagram-clone/index.html', // Instagram
          2: '../fake_pages/twitter-clone/index.html'     // Twitter
        };
        const relativePath = relativePaths[task.platformId];
        platformUrl = `${relativePath}?user_id=${encodeURIComponent(this.userId)}&platform_id=${task.platformId}&task_id=${this.currentTaskIndex}&return_url=${encodeURIComponent(returnUrl)}`;
      } else {
        // Production - use the CONFIG URLs
        platformUrl = `${task.link}?user_id=${encodeURIComponent(this.userId)}&platform_id=${task.platformId}&task_id=${this.currentTaskIndex}&return_url=${encodeURIComponent(returnUrl)}`;
      }
      
      console.log('Full platform URL:', platformUrl);
      
      // Navigate in the same tab
      window.location.href = platformUrl;

    } catch (error) {
      console.error('Failed to advance task:', error);
      this.showMessage('Failed to proceed. Please try again.', 'error');
      
      // Reset button state
      nextButton.disabled = false;
      nextButton.innerHTML = 'Open Platform';
    }
  },

  // Remove the previousTask method as back navigation is no longer allowed
  // previousTask() method removed

  // Show message to user
  showMessage(message, type) {
    const container = document.getElementById('message-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message mt-2`;
    messageDiv.textContent = message;
    container.appendChild(messageDiv);
    
    // Auto-remove after 5 seconds
    setTimeout(() => messageDiv.remove(), 5000);
  }
};

// Global functions for onclick handlers
function nextTask() {
  TasksController.nextTask();
}

// Initialize when page loads
window.addEventListener('load', function() {
  console.log('Tasks page loaded');
  TasksController.init();
});

// Error handling
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  TasksController.showMessage('An unexpected error occurred. Please try again.', 'error');
});

window.addEventListener('error', function(event) {
  console.error('JavaScript error:', event.error);
  TasksController.showMessage('An unexpected error occurred. Please try again.', 'error');
});