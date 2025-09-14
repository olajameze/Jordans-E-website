// Video Gallery functionality
let activeVideo = null;
let videoModal = null;
let modalVideo = null;
let modalVideoTitle = null;
let modalVideoDescription = null;

function createVideoModal() {
    const modalHTML = `
        <div id="videoModal" class="video-modal">
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <video id="modalVideo" controls playsinline>
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

function closeVideoModal() {
    if (!videoModal) return;
    
    if (modalVideo && !modalVideo.paused) {
        modalVideo.pause();
    }
    videoModal.classList.remove('active');
    if (modalVideo) {
        modalVideo.currentTime = 0;
    }
    document.body.style.overflow = '';
    activeVideo = null;
}

async function openVideoModal(video, item) {
    if (!videoModal || !modalVideo) return;
    
    const sourceElement = video.querySelector('source');
    if (!sourceElement) {
        console.error('No video source found');
        return;
    }
    
    const title = item.querySelector('h3')?.textContent || 'Video';
    const description = item.querySelector('p')?.textContent || '';
    
    modalVideo.innerHTML = '';
    const source = document.createElement('source');
    source.src = sourceElement.src;
    source.type = sourceElement.type || 'video/mp4';
    modalVideo.appendChild(source);
    
    if (modalVideoTitle) modalVideoTitle.textContent = title;
    if (modalVideoDescription) modalVideoDescription.textContent = description;
    
    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    try {
        modalVideo.load();
        
        await new Promise((resolve) => {
            modalVideo.addEventListener('canplay', resolve, { once: true });
            setTimeout(resolve, 5000);
        });
        
        if (videoModal.classList.contains('active')) {
            await modalVideo.play();
        }
    } catch (error) {
        console.warn('Video playback warning:', error);
    }
    
    activeVideo = modalVideo;
}

function filterVideos(filterValue, videoItems, noResultsMessage) {
    let visibleCount = 0;
    
    videoItems.forEach(item => {
        const category = item.getAttribute('data-category');
        
        if (filterValue === 'all' || category === filterValue) {
            item.style.display = 'block';
            visibleCount++;
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 10);
        } else {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            setTimeout(() => {
                item.style.display = 'none';
            }, 300);
        }
    });
    
    if (noResultsMessage) {
        noResultsMessage.style.display = visibleCount === 0 ? 'block' : 'none';
    }
}

function initVideoGallery() {
    const videoItems = document.querySelectorAll('.video-item');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const noResultsMessage = document.querySelector('.no-results-message');
    
    if (!document.getElementById('videoModal')) {
        createVideoModal();
    }
    
    videoModal = document.getElementById('videoModal');
    modalVideo = document.getElementById('modalVideo');
    const closeModalBtn = document.querySelector('.close-modal');
    modalVideoTitle = document.getElementById('modalVideoTitle');
    modalVideoDescription = document.getElementById('modalVideoDescription');
    
    videoItems.forEach(item => {
        const video = item.querySelector('video');
        const playButton = item.querySelector('.play-button');
        
        if (video && playButton) {
            playButton.addEventListener('click', function(e) {
                e.stopPropagation();
                openVideoModal(video, item);
            });
            
            const thumbnail = item.querySelector('.video-thumbnail');
            if (thumbnail) {
                thumbnail.addEventListener('click', function(e) {
                    if (e.target !== playButton && !playButton.contains(e.target)) {
                        openVideoModal(video, item);
                    }
                });
                
                thumbnail.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openVideoModal(video, item);
                    }
                });
            }
        }
    });
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const filterValue = this.getAttribute('data-filter');
                filterVideos(filterValue, videoItems, noResultsMessage);
            });
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeVideoModal);
    }
    
    if (videoModal) {
        videoModal.addEventListener('click', function(e) {
            if (e.target === videoModal) {
                closeVideoModal();
            }
        });
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && videoModal?.classList.contains('active')) {
            closeVideoModal();
        }
    });
    
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && activeVideo) {
            activeVideo.pause();
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const videoItems = document.querySelectorAll('.video-item');
    if (videoItems.length === 0) return;
    
    initVideoGallery();
});
