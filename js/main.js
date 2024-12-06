document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.querySelector('.upload-btn');
    const compressionSection = document.querySelector('.compression-section');
    const qualitySlider = document.getElementById('quality');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');

    let originalFile = null;
    let compressedBlob = null;

    // 上传按钮点击事件
    uploadBtn.addEventListener('click', () => fileInput.click());

    // 文件选择事件
    fileInput.addEventListener('change', handleFileSelect);

    // 拖放事件
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007AFF';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#DEDEDE';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 质量滑块事件 - 添加防抖动
    let debounceTimer;
    qualitySlider.addEventListener('input', () => {
        qualityValue.textContent = qualitySlider.value + '%';
        
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (originalFile) {
                compressImage();
            }
        }, 100);
    });

    // 下载按钮事件
    downloadBtn.addEventListener('click', () => {
        if (compressedBlob) {
            const url = URL.createObjectURL(compressedBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'compressed_' + originalFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file);
        }
    }

    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请选择图片文件！');
            return;
        }

        originalFile = file;
        originalSize.textContent = formatFileSize(file.size);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            compressionSection.style.display = 'block';
            compressedPreview.src = '';
            compressedSize.textContent = '-';
            downloadBtn.style.display = 'none';
            // 立即进行一次压缩
            compressImage();
        };
        reader.readAsDataURL(file);
    }

    async function compressImage() {
        if (!originalFile) return;

        compressedSize.textContent = '压缩中...';

        const options = {
            maxSizeMB: originalFile.size / (1024 * 1024) > 1 ? originalFile.size / (1024 * 1024) / 2 : 0.5,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
            quality: qualitySlider.value / 100,
            initialQuality: qualitySlider.value / 100,
            alwaysKeepResolution: false,
            maxIteration: 2,
        };

        try {
            if (originalFile.size > 5 * 1024 * 1024) {
                options.maxWidthOrHeight = 1600;
            }

            let compressedResult = await imageCompression(originalFile, options);
            
            if (compressedResult.size >= originalFile.size && options.quality > 0.5) {
                options.quality = 0.5;
                compressedResult = await imageCompression(originalFile, options);
            }

            compressedBlob = compressedResult;
            
            const compressionRatio = ((1 - compressedBlob.size / originalFile.size) * 100).toFixed(1);
            compressedSize.textContent = `${formatFileSize(compressedBlob.size)} (压缩率: ${compressionRatio}%)`;
            
            compressedPreview.src = URL.createObjectURL(compressedBlob);
            downloadBtn.style.display = 'block';
        } catch (error) {
            console.error('压缩失败:', error);
            compressedSize.textContent = '压缩失败，请重试';
            downloadBtn.style.display = 'none';
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 