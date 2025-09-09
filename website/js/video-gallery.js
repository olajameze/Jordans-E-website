document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const videoItems = document.querySelectorAll('.video-item');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const noResultsMessage = document.querySelector('.no-results-message');
    let activeVideo = null;
    
    // Check if there are videos to initialize
    if (videoItems.length === 0) return;
    
    // Initialize each video item
    videoItems.forEach(item => {
        const video = item.querySelector('video');
        const playButton = item.querySelector('.play-button');
        const loadingIndicator = item.querySelector('.video-loading');
        
        if (video && playButton) {
            // Set up video event listeners
            setupVideoEvents(video, playButton, loadingIndicator);
            
            // Set up click event for play button
            playButton.addEventListener('click', function(e) {
                e.stopPropagation();
                toggleVideoPlayback(video, playButton, loadingIndicator);
            });
            
            // Click on video thumbnail to play/pause
            const thumbnail = item.querySelector('.video-thumbnail');
            if (thumbnail) {
                thumbnail.addEventListener('click', function(e) {
                    if (e.target !== playButton) {
                        toggleVideoPlayback(video, playButton, loadingIndicator);
                    }
                });
            }
            
            // Keyboard support for video playback
            thumbnail.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleVideoPlayback(video, playButton, loadingIndicator);
                }
            });
        }
    });
    
    // Set up filter buttons
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Filter videos
                const filterValue = this.getAttribute('data-filter');
                filterVideos(filterValue);
            });
        });
    }
    
    // Set up video event listeners
    function setupVideoEvents(video, playButton, loadingIndicator) {
        // Show play button when video ends
        video.addEventListener('ended', function() {
            playButton.style.display = 'flex';
            video.currentTime = 0; // Reset to beginning
            activeVideo = null;
        });
        
        // Show play button when video is paused
        video.addEventListener('pause', function() {
            playButton.style.display = 'flex';
            if (video === activeVideo) activeVideo = null;
        });
        
        // Hide play button when video plays
        video.addEventListener('play', function() {
            playButton.style.display = 'none';
            activeVideo = video;
        });
        
        // Show loading indicator when video is waiting
        video.addEventListener('waiting', function() {
            if (loadingIndicator) loadingIndicator.style.display = 'flex';
        });
        
        // Hide loading indicator when video can play
        video.addEventListener('canplay', function() {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
        
        // Handle video errors
        video.addEventListener('error', function() {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            playButton.style.display = 'flex';
            console.error('Video failed to load:', video.src);
        });
    }
    
    // Toggle video playback
    function toggleVideoPlayback(video, playButton, loadingIndicator) {
        // Pause any currently playing video
        if (activeVideo && activeVideo !== video) {
            activeVideo.pause();
            const otherPlayButton = activeVideo.parentElement.querySelector('.play-button');
            if (otherPlayButton) otherPlayButton.style.display = 'flex';
        }
        
        if (video.paused) {
            // Show loading indicator
            if (loadingIndicator) loadingIndicator.style.display = 'flex';
            
            // Play the video
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (loadingIndicator) loadingIndicator.style.display = 'none';
                    playButton.style.display = 'flex';
                    console.error('Playback failed:', error);
                });
            }
        } else {
            video.pause();
        }
    }
    
    // Filter videos by category
    function filterVideos(filterValue) {
        let visibleCount = 0;
        
        videoItems.forEach(item => {
            const category = item.getAttribute('data-category');
            
            if (filterValue === 'all' || category === filterValue) {
                item.style.display = 'block';
                visibleCount++;
                
                // Add slight delay for smooth animation
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, 10);
            } else {
                // Pause video if it's playing
                const video = item.querySelector('video');
                if (video && !video.paused) {
                    video.pause();
                    const playButton = item.querySelector('.play-button');
                    if (playButton) playButton.style.display = 'flex';
                }
                
                // Hide with animation
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    item.style.display = 'none';
                }, 300);
            }
        });
        
        // Show/hide no results message
        if (noResultsMessage) {
            if (visibleCount === 0) {
                noResultsMessage.style.display = 'block';
            } else {
                noResultsMessage.style.display = 'none';
            }
        }
    }
    
    // Handle page visibility change - pause video when tab is hidden
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && activeVideo) {
            activeVideo.pause();
        }
    });
    
    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activeVideo) {
            activeVideo.pause();
        }
    });
});