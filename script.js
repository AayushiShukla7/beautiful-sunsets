// import { collection } from "./collection.js";
import collection from "./collection.js";
import { gsap } from "./node_modules/gsap/index.js";
import { SplitText } from "./node_modules/gsap/SplitText.js";

let music = document.getElementById("music");
music.volume = 0.04;

document.addEventListener("DOMContentLoaded", () => {

    // Register the Plugin
    gsap.registerPlugin(SplitText);   

    const gallery = document.querySelector(".gallery");
    const galleryContainer = document.querySelector(".gallery-container");
    const titleContainer = document.querySelector(".title-container");
    const btnMuteAudio = document.querySelector("#btnMuteAudio");

    const cards = [];
    const transformState = [];

    let currentTitle = null;
    let isPreviewActive = false;
    let isTransitioning = false;

    // All our constants in one place i.e., config
    const config = {
        imageCount: 25, // How many images to show?
        radius: 275,    // How far the cards are from the center?
        sensitivity: 800,   // How sensitive the hover effect is?
        effectFallOff: 200, //  How much time it takes to reset?
        cardMoveAmount: 60, // How much each card moves or scale/hover?
        lerpFactor: 0.15,   // To control smooth animations
        isMobile: window.innerWidth < 1000,
    };

    const parallaxState = {
        targetX: 0,
        targetY: 0,
        targetZ: 0,
        currentX: 0,
        currentY: 0,
        currentZ: 0
    };

    // Start populating cards
    for (let i = 0; i < config.imageCount; i++) {
        // Calculate unique angle for each image
        const angle = (i / config.imageCount) * Math.PI * 2;

        // X and Y coordinates for each image
        const x = config.radius * Math.cos(angle);
        const y = config.radius * Math.sin(angle);
        const cardIndex = i % 25;

        // Create card element
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.index = i;
        card.dataset.title = collection[cardIndex].title;

        // Create image element
        const img = document.createElement("img");
        img.src = collection[cardIndex].img;
        card.appendChild(img);

        // Set the card position
        gsap.set(card, {
            x,
            y,
            rotation: (angle * 180) / Math.PI + 90,     // So that each card faces the center
            transformPerspective: 800,
            transformOrigin: "center center"
        });

        // Add cards to the gallery container
        galleryContainer.appendChild(card);

        // Add the card to the Cards collection (to access later)
        cards.push(card);        

        // Add animation-related details for this card
        transformState.push({
            currentRotation: 0,
            targetRotation: 0,
            currentX: 0,
            targetX: 0,
            currentY: 0,
            targetY: 0,
            currentScale: 1,
            targetScale: 1,
            angle
        });

        card.addEventListener("click", (e) => {
            // Not already clicked or transforming (middle of animation)
            if(!isPreviewActive && !isTransitioning) {
                // Activate the preview mode for this specific card
                togglePreview(parseInt(card.dataset.index));
                e.stopPropagation();
            }
        });

        // Mute button click event - Toggles Mute/Unmute
        btnMuteAudio.addEventListener("click", () => {
            music.paused ? music.play() : music.pause();
        })
    }

    //console.log(cards);

    // Click event for card(s)
    function togglePreview(index) {
        // Toggle the preview 
        isPreviewActive = true; // Mark as active
        isTransitioning = true; // To make sure user doesn't interrupt the animation while it is in progress

        const angle = transformState[index].angle;  // Grab the angle for this image
        const targetPosition = (Math.PI * 3) / 2;   // Set target position for clicked card to end up -> 3 quarters of a circle
        let rotationRadians = targetPosition - angle;   // How much the gallery needs to rotate for the clicked card to end up in the targetPosition

        // Gallery must take the shortest possible rotation path (for smoothness)
        if(rotationRadians > Math.PI)
            rotationRadians -= Math.PI * 2;     // Rotation more than a half circle -> Adjust by subtracting full circle (2πr)
        else if(rotationRadians < -Math.PI)
            rotationRadians += Math.PI * 2;     // Rotation less than a half circle -> Adjust by adding full circle  (2πr)

        // Reset state for card - for a clear starting pallette
        transformState.forEach((state) => {
            state.currentRotation = state.targetPosition = 0;
            state.currentScale = state.targetScale = 1;
            state.currentX = state.targetX = state.currentY = state.targetY = 0;
        });

        // GSAP animation - gallery        
        gsap.to(galleryContainer, {
            onStart: () => {
                cards.forEach((card, i) => {
                    gsap.to(card, {
                        x: config.radius * Math.cos(transformState[i].angle),
                        y: config.radius * Math.sin(transformState[i].angle),
                        rotationY: 0,
                        scale: 1,
                        duration: 1.25,
                        ease: "power4.out"
                    });
                });
            },
            scale: 6,
            y: 1550,
            rotation: (rotationRadians * 180) / Math.PI + 360,
            duration: 2,
            ease: "power4.inOut",
            onComplete: () => {
                isTransitioning = false
            }
        });

        // Reset the parallax motion
        gsap.to(parallaxState, {
            currentX: 0,
            currentY: 0,
            currentZ: 0,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => {
                gsap.set(galleryContainer, {
                    rotateX: parallaxState.currentX,
                    rotateY: parallaxState.currentY,
                    rotateZ: parallaxState.currentZ,
                    transformOrigin: "center center"
                });
            }
        });

        // Create title text for each card
        const titleText = cards[index].dataset.title;
        const p = document.createElement("p");
        p.textContent = titleText;
        titleContainer.appendChild(p);
        currentTitle = p;

        // Split elements into words and characters
        const splitText = new SplitText(p, {
            type: "words, chars",
            wordsClass: "word"
        });
        const words = splitText.words;

        gsap.set(words, { y: "150%" }); // Initial position (out of frame)

        gsap.to(words, {
            y: "20%",
            duration: 1,
            delay: 1.25,
            stagger: 0.25,
            ease: "back"
        });
    }

    // Reset everything when user clicks out of preview
    function resetGallery() {
        //debugger;
        if(isTransitioning) return;

        isTransitioning = true;

        if(currentTitle) {
            const words = currentTitle.querySelectorAll(".word");

            gsap.to(words, {
                y: "-125%",
                duration: 0.75,
                delay: 0.5,
                stagger: 0.1,
                ease: "power4.out",
                onComplete: () => {
                    currentTitle.remove();
                    currentTitle = null;
                }
            });
        }

        // Scale the gallery back down
        const viewportWidth = window.innerWidth;
        let galleryScale = 1;

        if(viewportWidth < 768) {
            galleryScale = 0.6;
        }
        else if(viewportWidth < 1200) {
            galleryScale = 0.8;
        }

        // Animate gallery back to its original state (zoom-out effect)
        gsap.to(galleryContainer, {
            scale: galleryScale,
            y: 0,
            x: 0,
            rotation: 0,
            duration: 2.5,
            ease: "power4.inOut",
            onComplete: () => {
                // Reset the flags
                isPreviewActive = isTransitioning = false;

                // Reset all parallax-related values
                Object.assign(parallaxState, {
                    targetX: 0,
                    targetY: 0,
                    targetZ: 0,
                    currentX: 0,
                    currentY: 0,
                    currentZ: 0
                });
            }
        });
    }

    function handleResize() {
        const viewportWidth = window.innerWidth;
        config.isMobile = viewportWidth < 1000;

        let galleryScale = 1;

        if(viewportWidth < 768) {
            galleryScale = 0.6;
        }
        else if(viewportWidth < 1200) {
            galleryScale = 0.8;
        }

        gsap.set(gallery, {
            scale: galleryScale
        });

        // User hasn't clicked on any card
        if(!isPreviewActive) {
            parallaxState.targetX = 0;
            parallaxState.targetY = 0;
            parallaxState.targetZ = 0;
            parallaxState.currentX = 0;
            parallaxState.currentY = 0;
            parallaxState.currentZ = 0;

            transformState.forEach((state) => {
                state.targetRotation = 0;
                state.currentRotation = 0;
                state.targetScale = 0;
                state.currentScale = 0;
                state.targetX = 0;
                state.currentX = 0;
                state.targetY = 0;
                state.currentY = 0;
            });
        }
    }

    window.addEventListener("resize", handleResize);
    handleResize();

    // User in preview click anywhere else
    document.addEventListener("click", () => {        
        if(isPreviewActive && !isTransitioning)
            resetGallery();
    });

    // Parallax event
    document.addEventListener("mousemove", (e) => {
        if(isPreviewActive || isTransitioning || config.isMobile) return;

        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Convert to percent -> Range from -1 to +1
        const percentX = (e.clientX - centerX) / centerX;
        const percentY = (e.clientY - centerY) / centerY;

        parallaxState.targetY = percentX * 15;
        parallaxState.targetX = percentY * 15;
        parallaxState.targetZ = (percentX + percentY) * 5;

        cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const dx = e.clientX - (rect.left + rect.width / 2);
            const dy = e.clientY - (rect.top + rect.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If mouse is within range
            if(distance < config.sensitivity && !config.isMobile) {
                const flipFactor = Math.max(0, 1 - distance / config.effectFallOff);
                const angle = transformState[index].angle;
                const moveAmount = config.cardMoveAmount * flipFactor;

                transformState[index].targetRotation = 180 * flipFactor;
                transformState[index].targetScale = 1 + 0.3 * flipFactor;
                transformState[index].targetX = moveAmount * Math.cos(angle);
                transformState[index].targetY = moveAmount * Math.sin(angle);
            }
            else {
                // If mouse moves too far
                transformState[index].targetRotation = 0;
                transformState[index].targetScale = 1;
                transformState[index].targetX = 0;
                transformState[index].targetY = 0;
            }
        });
    });

    function animate() {
        //debugger;
        if(!isPreviewActive && !isTransitioning) {
            parallaxState.currentX += (parallaxState.targetX - parallaxState.currentX) * config.lerpFactor;
            parallaxState.currentY += (parallaxState.targetY - parallaxState.currentY) * config.lerpFactor;
            parallaxState.currentZ += (parallaxState.targetZ - parallaxState.currentZ) * config.lerpFactor;

            gsap.set(galleryContainer, {
                rotateX : parallaxState.currentX,
                rotateY : parallaxState.currentY,
                rotation : parallaxState.currentZ,
            });

            cards.forEach((card, index) => {
                const state = transformState[index];

                state.currentRotation += (state.targetRotation - state.currentRotation) * config.lerpFactor;
                state.currentScale += (state.targetScale - state.currentScale) * config.lerpFactor;
                state.currentX += (state.targetX - state.currentX) * config.lerpFactor;
                state.currentY += (state.targetY - state.currentY) * config.lerpFactor;

                const angle = state.angle;
                const x = config.radius * Math.cos(angle);
                const y = config.radius * Math.sin(angle);

                gsap.set(card, {
                    x: x + state.currentX,
                    y: y + state.currentY,
                    rotationY: state.currentRotation,
                    scale: state.currentScale,
                    rotation: (angle * 180) / Math.PI + 90,
                    transformPerspective: 1000
                });
            });
        }

        requestAnimationFrame(animate);
    }

    animate();
});