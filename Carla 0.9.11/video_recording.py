import os
import cv2
from config import OUTPUT_DIR, FRAME_RATE

def get_unique_filename(base_name="recording", extension=".mp4"):
    """Generate a unique filename by appending an incremental number."""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    
    index = 1
    while True:
        filename = f"{base_name}_{index}{extension}"
        filepath = os.path.join(OUTPUT_DIR, filename)
        if not os.path.exists(filepath):
            return filepath
        index += 1

def setup_video_recording():
    """Set up video recording directory."""
    print("Setting up video recording...", end='', flush=True)
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    print("Done")
    return FRAME_RATE

def save_video(video_frames, video_writer):
    """Save recorded video frames to a file."""
    if video_frames and video_writer is not None:
        print("Saving video...", end='', flush=True)
        for frame in video_frames:
            if frame is not None:
                video_writer.write(frame)
        video_writer.release()
        print("Done")
    else:
        print("No video frames recorded or video writer not initialized.")
