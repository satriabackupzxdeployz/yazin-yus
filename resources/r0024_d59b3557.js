(function () {
  'use strict';

  const dropzone     = document.getElementById('dropzone');
  const fileInput    = document.getElementById('file-input');
  const dzDefault    = document.getElementById('dz-default');
  const dzPreview    = document.getElementById('dz-preview');
  const previewImg   = document.getElementById('preview-img');
  const previewName  = document.getElementById('preview-name');
  const previewSize  = document.getElementById('preview-size');
  const previewClear = document.getElementById('preview-clear');
  const uploadBtn    = document.getElementById('upload-btn');
  const btnLabel     = document.getElementById('btn-label');
  const btnLoading   = document.getElementById('btn-loading');
  const progressWrap = document.getElementById('progress-wrap');
  const progressBar  = document.getElementById('progress-bar');
  const progressPct  = document.getElementById('progress-pct');
  const resultCard   = document.getElementById('result-card');
  const resultUrl    = document.getElementById('result-url');
  const openLink     = document.getElementById('open-link');
  const toast        = document.getElementById('toast');

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navMenu = document.getElementById('navMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const contactLink = document.getElementById('contactLink');
  const donationLink = document.getElementById('donationLink');
  const contactModal = document.getElementById('contactModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  const ALLOWED_TYPES = [
    'image/jpeg','image/jpg','image/png','image/gif',
    'image/webp','image/svg+xml','image/bmp',
    'image/x-icon','image/tiff'
  ];

  const MAX_SIZE = 30 * 1024 * 1024;

  let selectedFile = null;
  let toastTimer = null;

  function showToast(msg, duration = 2800) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function validateFile(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Only image files are allowed (JPG, PNG, GIF, WEBP, SVG, BMP, ICO, TIFF)');
      return false;
    }
    if (file.size > MAX_SIZE) {
      showToast('File is too large. Maximum size is 30 MB.');
      return false;
    }
    return true;
  }

  function compressImageForPreview(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_PREVIEW_SIZE = 1200;
        if (width > height) {
          if (width > MAX_PREVIEW_SIZE) {
            height *= MAX_PREVIEW_SIZE / width;
            width = MAX_PREVIEW_SIZE;
          }
        } else {
          if (height > MAX_PREVIEW_SIZE) {
            width *= MAX_PREVIEW_SIZE / height;
            height = MAX_PREVIEW_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const previewDataUrl = canvas.toDataURL('image/jpeg', 0.6);
        callback(previewDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function showPreview(file) {
    compressImageForPreview(file, function(compressedDataUrl) {
      previewImg.src = compressedDataUrl;
    });
    previewName.textContent = file.name;
    previewSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    dzDefault.classList.add('hidden');
    dzPreview.classList.remove('hidden');
    uploadBtn.disabled = false;
  }

  function clearPreview(e) {
    if (e) e.stopPropagation();
    selectedFile = null;
    fileInput.value = '';
    previewImg.src = '';
    dzPreview.classList.add('hidden');
    dzDefault.classList.remove('hidden');
    uploadBtn.disabled = true;
    hideResult();
  }

  function hideResult() {
    resultCard.classList.add('hidden');
    progressWrap.classList.add('hidden');
    setProgress(0);
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!validateFile(file)) { fileInput.value = ''; return; }
    selectedFile = file;
    showPreview(file);
    hideResult();
  });

  dropzone.addEventListener('dragenter', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', (e) => { if (!dropzone.contains(e.relatedTarget)) { dropzone.classList.remove('drag-over'); } });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (!validateFile(file)) return;
    selectedFile = file;
    showPreview(file);
    hideResult();
  });

  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });

  previewClear.addEventListener('click', clearPreview);

  function setProgress(val) {
    progressBar.style.width = val + '%';
    progressBar.setAttribute('aria-valuenow', val);
    progressPct.textContent = val + '%';
  }

  uploadBtn.addEventListener('click', () => { if (!selectedFile) return; uploadFile(selectedFile); });

  function uploadFile(file) {
    hideResult();
    progressWrap.classList.remove('hidden');
    setProgress(0);
    btnLabel.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    uploadBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'upload.php', true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        setProgress(pct);
      }
    };

    xhr.onload = () => {
      progressWrap.classList.add('hidden');
      btnLabel.classList.remove('hidden');
      btnLoading.classList.add('hidden');
      uploadBtn.disabled = false;

      if (xhr.status === 200) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.success) {
            showResult(res.url);
          } else {
            showToast('Upload failed: ' + (res.message || 'Unknown error'));
          }
        } catch (e) {
          showToast('Invalid server response.');
        }
      } else {
        showToast('Server error: ' + xhr.status);
      }
    };

    xhr.onerror = () => {
      progressWrap.classList.add('hidden');
      btnLabel.classList.remove('hidden');
      btnLoading.classList.add('hidden');
      uploadBtn.disabled = false;
      showToast('Connection error. Please try again.');
    };

    xhr.send(formData);
  }

  function showResult(url) {
    resultUrl.value = url;
    openLink.href = url;
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  window.resetUploader = function () { clearPreview(null); hideResult(); };

  window.copyResult = async function () {
    const url = resultUrl.value;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!');
    } catch {
      resultUrl.select();
      document.execCommand('copy');
      showToast('Link copied to clipboard!');
    }
  };

  window.copyCode = async function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    const text = el.textContent;
    try {
      await navigator.clipboard.writeText(text);
      showToast('Code copied!');
    } catch {
      showToast('Copy failed. Please select and copy manually.');
    }
  };

  const tabs = document.querySelectorAll('.tab');
  const panels = document.querySelectorAll('.tab-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.querySelector(`[data-panel="${target}"]`);
      if (panel) panel.classList.add('active');
    });
  });

  function closeMobileMenu() {
    if (!navMenu) return;
    navMenu.classList.remove('active');
    mobileOverlay.classList.remove('active');
    hamburgerBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  function openMobileMenu() {
    if (!navMenu) return;
    navMenu.classList.add('active');
    mobileOverlay.classList.add('active');
    hamburgerBtn.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navMenu.classList.contains('active')) { closeMobileMenu(); } else { openMobileMenu(); }
    });
  }

  if (mobileOverlay) { mobileOverlay.addEventListener('click', closeMobileMenu); }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => { if (window.innerWidth <= 600) { closeMobileMenu(); } });
  });

  if (contactLink) {
    contactLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (contactModal) { contactModal.classList.add('active'); }
      if (window.innerWidth <= 600) { closeMobileMenu(); }
    });
  }

  if (closeModalBtn) { closeModalBtn.addEventListener('click', () => { contactModal.classList.remove('active'); }); }
  if (contactModal) { contactModal.addEventListener('click', (e) => { if (e.target === contactModal) { contactModal.classList.remove('active'); } }); }

  if (donationLink) {
    donationLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.open('https://tako.id/Ryzahen', '_blank');
      if (window.innerWidth <= 600) { closeMobileMenu(); }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (contactModal && contactModal.classList.contains('active')) { contactModal.classList.remove('active'); }
      if (navMenu && navMenu.classList.contains('active')) { closeMobileMenu(); }
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 600 && navMenu && navMenu.classList.contains('active')) { closeMobileMenu(); }
  });

  const announcementBar = document.createElement('div');
  announcementBar.className = 'announcement-bar hidden';
  announcementBar.innerHTML = '<span class="announcement-text"></span><button class="announcement-close" aria-label="Close announcement">&times;</button>';
  document.body.appendChild(announcementBar);

  const announcementText = announcementBar.querySelector('.announcement-text');
  const announcementClose = announcementBar.querySelector('.announcement-close');

  const announcementClosed = localStorage.getItem('announcement_closed');

  function loadAnnouncement() {
    if (announcementClosed) {
      const expiry = parseInt(announcementClosed, 10);
      if (Date.now() > expiry) {
        localStorage.removeItem('announcement_closed');
      } else {
        announcementBar.classList.add('hidden');
        return;
      }
    }

    fetch('/data/berita.json')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        if (data.aktif && data.teks) {
          announcementText.textContent = data.teks;
          announcementBar.classList.remove('hidden');
        } else {
          announcementBar.classList.add('hidden');
        }
      })
      .catch(() => {
        announcementBar.classList.add('hidden');
      });
  }

  announcementClose.addEventListener('click', () => {
    announcementBar.classList.add('hidden');
    const expiry = Date.now() + (60 * 60 * 1000);
    localStorage.setItem('announcement_closed', expiry);
  });

  loadAnnouncement();
})();