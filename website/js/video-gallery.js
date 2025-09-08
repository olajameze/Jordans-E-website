document.addEventListener('DOMContentLoaded', function() {
    const videoItems = document.querySelectorAll('.video-item');
    
    videoItems.forEach(item => {
        const video = item.querySelector('video');
        const playButton = item.querySelector('.play-button');
        const thumbnail = item.querySelector('.video-thumbnail');
        
        if (video && playButton) {
            // Handle click on play button
            playButton.addEventListener('click', function() {
                if (video.paused) {
                    // Pause all other videos first
                    videoItems.forEach(otherItem => {
                        const otherVideo = otherItem.querySelector('video');
                        if (otherVideo && otherVideo !== video) {
                            otherVideo.pause();
                            otherItem.querySelector('.play-button').style.display = 'flex';
                        }
                    });
                    
                    // Play the clicked video
                    video.play();
                    playButton.style.display = 'none';
                } else {
                    video.pause();
                    playButton.style.display = 'flex';
                }
            });
            
            // Show play button when video ends
            video.addEventListener('ended', function() {
                playButton.style.display = 'flex';
            });
            
            // Show play button when video is paused
            video.addEventListener('pause', function() {
                playButton.style.display = 'flex';
            });
            
            // Handle filtering
            const filterButtons = document.querySelectorAll('.filter-btn');
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const filter = this.getAttribute('data-filter');
                    
                    // Update active button
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Filter videos
                    videoItems.forEach(item => {
                        if (filter === 'all' || item.getAttribute('data-category') === filter) {
                            item.style.display = 'block';
                        } else {
                            item.style.display = 'none';
                            // Pause video if it's hidden
                            const video = item.querySelector('video');
                            if (video) {
                                video.pause();
                                item.querySelector('.play-button').style.display = 'flex';
                            }
                        }
                    });
                });
            });
        }
    });
});
