// ...inside createTombstone...

  let tombstonePhoto = null;

  // Button to load Python-captured image
  const loadPyBtn = document.createElement('button');
  loadPyBtn.textContent = "🖼️ Load Python Image";
  loadPyBtn.title = "Load image captured by Python";
  loadPyBtn.style.cssText = "position:absolute;bottom:-44px;left:50%;transform:translateX(-50%);font-size:12px;padding:2px 8px;border-radius:6px;border:none;background:#fff;color:#333;cursor:pointer;z-index:2;";
  t.appendChild(loadPyBtn);

  loadPyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      // Fetch image_data.json from server (must be in project root and served by Live Server)
      const resp = await fetch('image_data.json');
      const data = await resp.json();
      tombstonePhoto = "data:image/jpeg;base64," + data.image_base64;
      loadPyBtn.textContent = "✅ Loaded";
      loadPyBtn.style.background = "#1976d2";
    } catch (err) {
      alert("Could not load Python image. Make sure image_data.json exists and Live Server is running.");
    }
  });

  // Importing OpenCV.js
  const script = document.createElement('script');
  script.src = 'https://docs.opencv.org/4.x/opencv.js';
  document.head.appendChild(script);

  script.onload = () => {
    // Accessing the camera and capturing photo
    let video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('playsinline', '');
    t.appendChild(video);

    // Get access to the camera
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        video.srcObject = stream;
      })
      .catch((err) => {
        console.error("Error accessing the camera: ", err);
      });

    // Capture photo and save as JPEG
    const capturePhoto = () => {
      let canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      let ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        // Handle the captured photo blob (e.g., upload or display)
        const url = URL.createObjectURL(blob);
        const img = document.createElement('img');
        img.src = url;
        img.width = 200;
        img.height = 200;
        t.appendChild(img);
      }, 'image/jpeg');
    };

    // Button to capture photo
    const captureBtn = document.createElement('button');
    captureBtn.textContent = "📸 Capture Photo";
    captureBtn.title = "Capture photo using webcam";
    captureBtn.style.cssText = "position:absolute;bottom:-44px;right:50%;transform:translateX(50%);font-size:12px;padding:2px 8px;border-radius:6px;border:none;background:#fff;color:#333;cursor:pointer;z-index:2;";
    t.appendChild(captureBtn);

    captureBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      capturePhoto();
    });
  };

  // ...existing camera/photo code...