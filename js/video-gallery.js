// Video Gallery functionality
let activeVideo = null;
let videoModal = null;
let modalVideoWrapper = null;
let modalVideo = null;
let modalVideoTitle = null;
let modalVideoDescription = null;

function createVideoModal() {
    const modalHTML = `
        <div id="videoModal" class="video-modal">
            <div class="modal-content">
                <button type="button" class="close-modal" aria-label="Close video">&times;</button>
                <div id="modalVideoWrapper" class="modal-video-wrapper">
                    <video id="modalVideo" controls>
                        Your browser does not support the video tag.
                    </video>
                    <div id="modalVideoLoading" class="modal-video-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                </div>
                <div class="video-info-modal">
                    <h3 id="modalVideoTitle"></h3>
                    <p id="modalVideoDescription"></p>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const insertedModalVideo = document.getElementById('modalVideo');
    if (insertedModalVideo) {
        insertedModalVideo.setAttribute('playsinline', '');
        insertedModalVideo.setAttribute('webkit-playsinline', '');
    }
}

function closeVideoModal() {
    if (!videoModal) return;

    if (modalVideo && !modalVideo.paused) {
        modalVideo.pause();
    }
    videoModal.classList.remove('active');
    if (modalVideo) {
        modalVideo.currentTime = 0;
        modalVideo.innerHTML = '';
    }
    document.body.style.overflow = '';
    activeVideo = null;
}

function waitForMediaCanPlay(media) {
    return new Promise((resolve, reject) => {
        if (media.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
            resolve();
            return;
        }

        const timeoutId = setTimeout(() => {
            media.removeEventListener('canplay', onCanPlay);
            media.removeEventListener('error', onError);
            reject(new Error('Video load timed out'));
        }, 45000);

        function onCanPlay() {
            clearTimeout(timeoutId);
            media.removeEventListener('error', onError);
            resolve();
        }

        function onError() {
            clearTimeout(timeoutId);
            media.removeEventListener('canplay', onCanPlay);
            const err = media.error;
            const code = err ? err.code : 'unknown';
            reject(new Error('Video failed to load (code ' + code + ')'));
        }

        media.addEventListener('canplay', onCanPlay, { once: true });
        media.addEventListener('error', onError, { once: true });
    });
}

async function openVideoModal(video, item) {
    if (!videoModal || !modalVideo) return;

    const sources = video.querySelectorAll('source');
    if (sources.length === 0) {
        console.error('No video source found');
        return;
    }

    const title = item.querySelector('h3')?.textContent || 'Video';
    const description = item.querySelector('p')?.textContent || '';

    if (modalVideoWrapper) modalVideoWrapper.classList.add('loading');

    modalVideo.innerHTML = '';
    sources.forEach((source) => {
        modalVideo.appendChild(source.cloneNode(true));
    });

    if (modalVideoTitle) modalVideoTitle.textContent = title;
    if (modalVideoDescription) modalVideoDescription.textContent = description;

    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    modalVideo.muted = false;

    try {
        modalVideo.load();
        await waitForMediaCanPlay(modalVideo);

        if (modalVideoWrapper) modalVideoWrapper.classList.remove('loading');

        if (videoModal.classList.contains('active')) {
            try {
                await modalVideo.play();
            } catch (playErr) {
                console.warn('Playback:', playErr);
            }
        }
    } catch (error) {
        console.error('Video playback error:', error);
        if (modalVideoWrapper) modalVideoWrapper.classList.remove('loading');
        if (modalVideoDescription) {
            modalVideoDescription.textContent =
                'Sorry — this video could not be loaded. If you are viewing files locally, try opening the site through a local web server, or confirm the video file is present in the videos folder.';
        }
    }

    activeVideo = modalVideo;
}

function filterVideos(filterValue, videoItems, noResultsMessage) {
    let visibleCount = 0;

    videoItems.forEach((item) => {
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
    modalVideoWrapper = document.getElementById('modalVideoWrapper');
    const closeModalBtn = document.querySelector('#videoModal .close-modal');
    modalVideoTitle = document.getElementById('modalVideoTitle');
    modalVideoDescription = document.getElementById('modalVideoDescription');

    videoItems.forEach((item) => {
        const video = item.querySelector('video');
        const playButton = item.querySelector('.play-button');

        if (video && playButton) {
            playButton.addEventListener('click', function (e) {
                e.stopPropagation();
                openVideoModal(video, item);
            });

            const thumbnail = item.querySelector('.video-thumbnail');
            if (thumbnail) {
                thumbnail.addEventListener('click', function (e) {
                    if (e.target !== playButton && !playButton.contains(e.target)) {
                        openVideoModal(video, item);
                    }
                });

                thumbnail.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openVideoModal(video, item);
                    }
                });
            }
        }
    });

    if (filterButtons.length > 0) {
        filterButtons.forEach((button) => {
            button.addEventListener('click', function () {
                filterButtons.forEach((btn) => btn.classList.remove('active'));
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
        videoModal.addEventListener('click', function (e) {
            if (e.target === videoModal) {
                closeVideoModal();
            }
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && videoModal?.classList.contains('active')) {
            closeVideoModal();
        }
    });

    document.addEventListener('visibilitychange', function () {
        if (document.hidden && activeVideo) {
            activeVideo.pause();
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const videoItems = document.querySelectorAll('.video-item');
    if (videoItems.length === 0) return;

    initVideoGallery();
});
