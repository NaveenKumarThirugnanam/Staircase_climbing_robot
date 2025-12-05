// Simple and Reliable Fullscreen Implementation
(function() {
    'use strict';
    
    console.log('🎬 Fullscreen fix script loaded');
    
    function setupFullscreen() {
        const btn = document.getElementById('fullscreenBtn') ||
                    document.getElementById('fullscreenVideoBtn') ||
                    document.querySelector('.camera-controls .control-btn:nth-child(2)');
        
        if (!btn) {
            console.log('⏳ Fullscreen button not found, retrying in 500ms...');
            setTimeout(setupFullscreen, 500);
            return;
        }
        
        console.log('✅ Fullscreen button found:', btn);
        
        // Get target element for fullscreen
        const getFullscreenTarget = () => {
            return document.querySelector('.camera-feed') || 
                   document.querySelector('.video-container') || 
                   document.querySelector('.camera-section');
        };
        
        // Handle fullscreen toggle
        btn.addEventListener('click', function(e) {
            console.log('🖱️ Fullscreen button CLICKED!');
            
            const target = getFullscreenTarget();
            console.log('  - Target element:', target);
            
            if (!target) {
                alert('Video container not found');
                console.error('❌ No target element found');
                return;
            }
            
            // Check current state
            const isFullscreen = !!(document.fullscreenElement || 
                                   document.webkitFullscreenElement || 
                                   document.mozFullScreenElement || 
                                   document.msFullscreenElement);
            
            console.log('  - Currently fullscreen:', isFullscreen);
            
            if (isFullscreen) {
                // Exit
                console.log('  - Exiting fullscreen...');
                (document.exitFullscreen || 
                 document.webkitExitFullscreen || 
                 document.mozCancelFullScreen || 
                 document.msExitFullscreen)();
            } else {
                // Enter fullscreen - Call directly without any delays
                console.log('  - Requesting fullscreen...');
                
                const req = target.requestFullscreen || 
                           target.webkitRequestFullscreen || 
                           target.mozRequestFullScreen || 
                           target.msRequestFullscreen;
                
                if (req) {
                    const promise = req.call(target);
                    if (promise && promise.catch) {
                        promise.catch(err => {
                            console.error('❌ Fullscreen error:', err);
                            alert('Fullscreen failed: ' + err.message);
                        });
                    }
                } else {
                    alert('Fullscreen not supported');
                    console.warn('⚠️ Fullscreen API not available');
                }
            }
        }, { once: false });
        
        // Update icon when fullscreen changes
        function updateIcon() {
            const isFullscreen = !!(document.fullscreenElement || 
                                   document.webkitFullscreenElement || 
                                   document.mozFullScreenElement || 
                                   document.msFullscreenElement);
            
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = isFullscreen ? 'fas fa-compress' : 'fas fa-expand';
            }
        }
        
        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(event => {
            document.addEventListener(event, updateIcon);
        });
        
        console.log('✅ Fullscreen setup complete');
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupFullscreen);
    } else {
        setTimeout(setupFullscreen, 100);
    }
    
    // Add fullscreen styles
    if (!document.getElementById('fullscreen-styles')) {
        const style = document.createElement('style');
        style.id = 'fullscreen-styles';
        style.textContent = `
            .camera-feed:fullscreen,
            .camera-feed:-webkit-full-screen,
            .video-container:fullscreen,
            .video-container:-webkit-full-screen {
                background: #000 !important;
                width: 100vw !important;
                height: 100vh !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            
            .camera-feed:fullscreen .video-container,
            .camera-feed:-webkit-full-screen .video-container,
            .video-container:fullscreen {
                width: 100% !important;
                height: 100% !important;
            }
            
            .camera-feed:fullscreen #videoCanvas,
            .camera-feed:fullscreen #videoFrame,
            .video-container:fullscreen #videoCanvas,
            .video-container:fullscreen #videoFrame {
                max-width: 100vw !important;
                max-height: 100vh !important;
                object-fit: contain !important;
            }
        `;
        document.head.appendChild(style);
    }
})();
