import os
import subprocess

# Configuration
VIDEO_DIR = "videos"
POSTER_DIR = os.path.join("images", "posters")

def process_videos():
    # Ensure the poster directory exists
    if not os.path.exists(POSTER_DIR):
        os.makedirs(POSTER_DIR)
        print(f"Created directory: {POSTER_DIR}")

    if not os.path.exists(VIDEO_DIR):
        print(f"Error: Could not find '{VIDEO_DIR}' folder.")
        return

    for filename in os.listdir(VIDEO_DIR):
        if filename.lower().endswith(".mp4"):
            base_name = os.path.splitext(filename)[0]
            input_path = os.path.join(VIDEO_DIR, filename)
            
            # 1. Generate WebM (Web-optimized, no audio for thumbnails)
            webm_path = os.path.join(VIDEO_DIR, f"{base_name}.webm")
            if not os.path.exists(webm_path):
                print(f"--- Generating WebM: {base_name}.webm ---")
                subprocess.run([
                    'ffmpeg', '-i', input_path,
                    '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-an',
                    webm_path
                ], check=True)
            
            # 2. Generate Poster Image (captured at 1 second mark)
            poster_path = os.path.join(POSTER_DIR, f"{base_name}-poster.jpg")
            if not os.path.exists(poster_path):
                print(f"--- Generating Poster: {base_name}-poster.jpg ---")
                subprocess.run([
                    'ffmpeg', '-i', input_path,
                    '-ss', '00:00:01', '-vframes', '1', '-q:v', '2',
                    poster_path
                ], check=True)

    print("\nProcessing complete! All WebM files and Posters have been generated.")

if __name__ == "__main__":
    process_videos()