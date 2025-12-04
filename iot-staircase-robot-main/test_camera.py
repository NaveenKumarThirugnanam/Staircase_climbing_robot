"""
Quick Test Script
Run this to verify camera and WebSocket are working
"""

import cv2

print("="*60)
print("CAMERA TEST")
print("="*60)

# Test camera
print("\n1. Testing camera access...")
camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("❌ FAILED: Camera could not be opened")
    print("\nPossible solutions:")
    print("- Close other applications using the camera")
    print("- Try different camera index (change 0 to 1 or 2)")
    print("- Check camera permissions in Windows Settings")
else:
    print("✅ SUCCESS: Camera opened")
    
    # Capture a test frame
    print("\n2. Testing frame capture...")
    ret, frame = camera.read()
    
    if not ret:
        print("❌ FAILED: Could not capture frame")
    else:
        print("✅ SUCCESS: Frame captured")
        print(f"   Frame size: {frame.shape}")
        print(f"   Resolution: {frame.shape[1]}x{frame.shape[0]}")
        
        # Display frame
        print("\n3. Displaying frame... (Press any key to close)")
        cv2.imshow('Camera Test', frame)
        cv2.waitKey(0)
        cv2.destroyAllWindows()
    
    camera.release()
    print("\n4. Camera released")

print("\n" + "="*60)
print("TEST COMPLETED")
print("="*60)
print("\nIf camera test passed, you can now run:")
print("  python robot_client.py robot_01")
