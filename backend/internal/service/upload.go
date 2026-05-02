package service

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// 文件名长度硬上限，避免某些文件系统扩展名过长导致路径问题
const maxFilenameLength = 255

type UploadService struct {
	mode      string
	localPath string
	maxSizeMB int64
}

func NewUploadService(mode, localPath string, maxSizeMB int64) *UploadService {
	return &UploadService{
		mode:      mode,
		localPath: localPath,
		maxSizeMB: maxSizeMB,
	}
}

// 图片专用扩展名白名单：不含 .svg（XSS 载体）、不含视频/音频/文档。
var imageExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
}

// 通用附件白名单（文档类，供后台需要时使用）。
// 仍然排除 .svg（XSS）、.html、.htm、.js、.json 等可执行/脚本类。
var attachmentExtensions = map[string]bool{
	".pdf": true, ".md": true, ".txt": true,
	".mp4": true, ".webm": true, ".mp3": true,
	".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".webp": true,
}

// UploadImage 图片专用上传：扩展名白名单 + magic-byte MIME 嗅探双重校验
func (s *UploadService) UploadImage(reader io.Reader, filename string, size int64) (string, error) {
	if err := s.checkSize(size); err != nil {
		return "", err
	}
	cleaned, ext, err := sanitizeFilename(filename, imageExtensions)
	if err != nil {
		return "", err
	}

	// 读取前 512 字节嗅探真实 MIME，绝不信任客户端扩展名
	head := make([]byte, 512)
	n, _ := io.ReadFull(reader, head)
	head = head[:n]
	mimeType := http.DetectContentType(head)
	if !strings.HasPrefix(mimeType, "image/") {
		return "", fmt.Errorf("文件内容不是合法图片（检测到 %s）", mimeType)
	}

	// 把嗅探读走的字节拼回 reader
	full := io.MultiReader(bytes.NewReader(head), reader)
	return s.writeWithExt(full, cleaned, ext)
}

// Upload 通用上传（文档/媒体类附件）。仍做扩展名校验但不做图片强约束。
// 如果你不确定文件是否是图片，请优先使用 UploadImage。
func (s *UploadService) Upload(reader io.Reader, filename string, size int64) (string, error) {
	if err := s.checkSize(size); err != nil {
		return "", err
	}
	cleaned, ext, err := sanitizeFilename(filename, attachmentExtensions)
	if err != nil {
		return "", err
	}

	switch s.mode {
	case "local":
		return s.writeWithExt(reader, cleaned, ext)
	case "oss":
		return "", fmt.Errorf("OSS 上传待实现")
	case "cos":
		return "", fmt.Errorf("COS 上传待实现")
	default:
		return s.writeWithExt(reader, cleaned, ext)
	}
}

func (s *UploadService) checkSize(size int64) error {
	if s.maxSizeMB > 0 && size > s.maxSizeMB*1024*1024 {
		return fmt.Errorf("文件大小超过 %dMB 限制", s.maxSizeMB)
	}
	return nil
}

// sanitizeFilename 清洗文件名：用 filepath.Base 防路径遍历 + 长度限制 + 扩展名白名单
func sanitizeFilename(raw string, allowed map[string]bool) (string, string, error) {
	if raw == "" {
		return "", "", fmt.Errorf("文件名不能为空")
	}
	cleaned := filepath.Base(raw) // 剥掉任何目录分量
	if len(cleaned) > maxFilenameLength {
		return "", "", fmt.Errorf("文件名过长")
	}
	ext := strings.ToLower(filepath.Ext(cleaned))
	if !allowed[ext] {
		return "", "", fmt.Errorf("不支持的文件类型: %s", ext)
	}
	return cleaned, ext, nil
}

// writeWithExt 按日期落地，使用服务器生成的安全文件名
func (s *UploadService) writeWithExt(reader io.Reader, _ /*originalName*/ string, ext string) (string, error) {
	dateDir := time.Now().Format("2006/01/02")
	dir := filepath.Join(s.localPath, dateDir)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", fmt.Errorf("创建上传目录失败: %w", err)
	}

	newName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(dir, newName)

	file, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("创建文件失败: %w", err)
	}
	defer file.Close()

	if _, err := io.Copy(file, reader); err != nil {
		return "", fmt.Errorf("写入文件失败: %w", err)
	}

	url := "/uploads/" + strings.ReplaceAll(filepath.Join(dateDir, newName), "\\", "/")
	return url, nil
}
