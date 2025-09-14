document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const videoItems = document.querySelectorAll('.video-item');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const noResultsMessage = document.querySelector('.no-results-message');
    let activeVideo = null;
    
    // Create video modal if it doesn't exist
    if (!document.getElementById('videoModal')) {
        const modalHTML = `
            <div id="videoModal" class="video-modal">
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <video id="modalVideo" controls>
                        Your browser does not support the video tag.
                    </video>
                    <div class="video-info-modal">
                        <h3 id="modalVideoTitle"></h3>
                        <p id="modalVideoDescription"></p>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    
    // Get modal elements
    const videoModal = document.getElementById('videoModal');
    const modalVideo = document.getElementById('modalVideo');
    const closeModal = document.querySelector('.close-modal');
    const modalVideoTitle = document.getElementById('modalVideoTitle');
    const modalVideoDescription = document.getElementById('modalVideoDescription');
    
    // Check if there are videos to initialize
    if (videoItems.length === 0) return;
    
    // Initialize each video item
    videoItems.forEach(item => {
        const video = item.querySelector('video');
        const playButton = item.querySelector('.play-button');
        const loadingIndicator = item.querySelector('.video-loading');
        
        if (video && playButton) {
            // Set up click event for play button
            playButton.addEventListener('click', function(e) {
                e.stopPropagation();
                openVideoModal(video, item);
            });
            
            // Click on video thumbnail to play in modal
            const thumbnail = item.querySelector('.video-thumbnail');
            if (thumbnail) {
                thumbnail.addEventListener('click', function(e) {
                    if (e.target !== playButton) {
                        openVideoModal(video, item);
                    }
                });
            }
            
            // Keyboard support for video playback
            thumbnail.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openVideoModal(video, item);
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
    
    // Open video in modal
    async function openVideoModal(video, item) {
        // Get video info
        const title = item.querySelector('h3').textContent;
        const description = item.querySelector('p').textContent;
        
        // Set modal content
        modalVideo.innerHTML = '';
        const source = document.createElement('source');
        source.src = video.querySelector('source').src;
        source.type = video.querySelector('source').type;
        modalVideo.appendChild(source);
        
        modalVideoTitle.textContent = title;
        modalVideoDescription.textContent = description;
        
        // Show modal
        videoModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
        
        try {
            // Load video first
            modalVideo.load();
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                modalVideo.addEventListener('canplay', resolve, { once: true });
                // Add a timeout in case the video takes too long to load
                setTimeout(resolve, 5000);
            });
            
            // Only try to play if the modal is still active
            if (videoModal.classList.contains('active')) {
                await modalVideo.play();
            }
        } catch (error) {
            console.warn('Video playback warning:', error);
            // Continue showing the video even if autoplay fails
            // User can click play manually
        }
        
        // Set as active video
        activeVideo = modalVideo;
    }
    
    // Close modal
    function closeVideoModal() {
        if (modalVideo && !modalVideo.paused) {
            modalVideo.pause();
        }
        videoModal.classList.remove('active');
        if (modalVideo) {
            modalVideo.currentTime = 0;
        }
        document.body.style.overflow = ''; // Re-enable scrolling
        activeVideo = null;
    }
    
    // Close modal events
    if (closeModal) {
        closeModal.addEventListener('click', closeVideoModal);
    }
    
    // Close modal when clicking outside
    videoModal.addEventListener('click', function(e) {
        if (e.target === videoModal) {
            closeVideoModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });
    
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
});